// Architectural Layer: Route Handler
// Dependencies: src/lib/auth.ts, src/services/BillingService.ts, src/lib/logger.ts

import { requireAuth } from "@/lib/auth";
import { BillingService } from "@/services/BillingService";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  let userId = "unauthenticated";

  try {
    const auth = await requireAuth(req);
    userId = auth.userId;
    const email = auth.session.user.email || "";

    const origin = req.headers.get("origin") || "http://localhost:3000";

    const checkoutUrl = await BillingService.createCheckoutSession(
      userId,
      email,
      origin,
      requestId
    );

    return Response.json({
      data: {
        url: checkoutUrl,
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;

    logger.error("POST /api/v1/billing/checkout failure", err, {
      requestId,
      userId,
    });

    return Response.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to generate billing checkout link.",
        },
      },
      { status: 500 }
    );
  }
}
