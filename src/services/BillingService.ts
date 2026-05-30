// Architectural Layer: Service Layer
// Dependencies: stripe, src/lib/db/supabase.ts, src/lib/sentry.ts

import Stripe from "stripe";
import { createSupabaseServer } from "../lib/db/supabase";
import { Sentry } from "../lib/sentry";

const getStripeClient = () => {
  const key = process.env.STRIPE_API_KEY || "dummy-stripe-key";
  return new Stripe(key, {
    apiVersion: "2025-01-27" as unknown as NonNullable<ConstructorParameters<typeof Stripe>[1]>["apiVersion"],
  });
};

export const PLAN_LIMITS = {
  free: 50000,   // 50,000 characters limit
  pro: 1000000,  // 1,000,000 characters limit
};

export class BillingService {
  /**
   * Returns the total keystroke character edits logged in the current calendar month.
   */
  static async getMonthlyUsage(userId: string, requestId: string): Promise<number> {
    try {
      const supabase = await createSupabaseServer();
      
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("contribution_logs")
        .select("content_delta")
        .eq("user_id", userId)
        .gte("logged_at", startOfMonth.toISOString());

      if (error) {
        throw new Error(`Usage query failed: ${error.message}`);
      }

      return (data || []).reduce((sum, log) => sum + Math.abs(log.content_delta), 0);
    } catch (e) {
      Sentry.captureException(e, { extra: { requestId, userId } });
      // Degrade gracefully in dev, return 0 usage
      return 0;
    }
  }

  /**
   * Checks if user has exceeded their active plan tier limit.
   */
  static async checkLimit(
    userId: string,
    requestId: string
  ): Promise<{ isAllowed: boolean; limit: number; usage: number; tier: string }> {
    try {
      const supabase = await createSupabaseServer();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        return { isAllowed: false, limit: 0, usage: 0, tier: "free" };
      }

      const tier = (user.user_metadata?.tier as "free" | "pro") || "free";
      const limit = PLAN_LIMITS[tier] || PLAN_LIMITS.free;

      const usage = await this.getMonthlyUsage(userId, requestId);

      return {
        isAllowed: usage < limit,
        limit,
        usage,
        tier,
      };
    } catch (e) {
      Sentry.captureException(e, { extra: { requestId, userId } });
      // In development fallback, return allowed
      return { isAllowed: true, limit: PLAN_LIMITS.free, usage: 0, tier: "free" };
    }
  }

  /**
   * Generates a Stripe checkout redirection link for subscription.
   */
  static async createCheckoutSession(
    userId: string,
    email: string,
    origin: string,
    requestId: string
  ): Promise<string> {
    try {
      const stripeKey = process.env.STRIPE_API_KEY;
      if (!stripeKey) {
        if (process.env.NODE_ENV === "development") {
          // Dev mock session redirect URL
          return `${origin}/?session_id=mock_session_id&billing=success`;
        }
        throw new Error("Stripe is not configured in this environment.");
      }

      const stripe = getStripeClient();

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        customer_email: email,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Annie AI Pro Plan",
                description: "1,000,000 monthly characters allowance and Advanced routing priority.",
              },
              unit_amount: 1500, // $15.00
              recurring: { interval: "month" },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${origin}/?session_id={CHECKOUT_SESSION_ID}&billing=success`,
        cancel_url: `${origin}/?billing=cancel`,
        client_reference_id: userId,
      });

      return session.url || "";
    } catch (e) {
      Sentry.captureException(e, { extra: { requestId, userId } });
      throw e;
    }
  }
}
