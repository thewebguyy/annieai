// Architectural Layer: Route Handler
// Dependencies: stripe, @supabase/supabase-js, src/lib/logger.ts, src/lib/sentry.ts

import { headers } from "next/headers";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { Sentry } from "@/lib/sentry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const getStripeClient = () => {
  return new Stripe(process.env.STRIPE_API_KEY || "dummy-key", {
    apiVersion: "2025-01-27" as unknown as NonNullable<ConstructorParameters<typeof Stripe>[1]>["apiVersion"],
  });
};

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-role";
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const stripe = getStripeClient();
  const headerList = await headers();
  const sig = headerList.get("stripe-signature") || "";

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      if (process.env.NODE_ENV === "development") {
        // Dev Mock Webhook bypass
        const parsed = JSON.parse(rawBody);
        event = parsed as Stripe.Event;
        logger.warn("[DEV MOCK WEBHOOK] Bypassing webhook verification checks.", { requestId });
      } else {
        throw new Error("Missing STRIPE_WEBHOOK_SECRET in production.");
      }
    } else {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    }
  } catch (err) {
    logger.error("Stripe webhook verification failed", err, { requestId });
    return Response.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: err instanceof Error ? err.message : "Signature verification failed.",
        },
      },
      { status: 400 }
    );
  }

  // Handle billing completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;

    if (userId) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        
        // Update user metadata in Supabase Auth to Pro tier
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: { tier: "pro" },
        });

        if (error) {
          throw error;
        }

        logger.info("User subscription upgraded to PRO successfully", {
          requestId,
          userId,
        });
      } catch (err) {
        Sentry.captureException(err, { extra: { requestId, userId } });
        logger.error("Failed to update user database tier to PRO", err, {
          requestId,
          userId,
        });
        return Response.json({ error: { code: "INTERNAL_ERROR", message: "Failed to persist upgrade." } }, { status: 500 });
      }
    }
  }

  return Response.json({ received: true });
}
