// Architectural Layer: Route Handler
// Dependencies: zod, src/lib/auth.ts, src/services/ProjectService.ts, src/services/MuseService.ts, src/lib/logger.ts, @upstash/ratelimit, @upstash/redis

import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { ProjectService, ForbiddenError } from "@/services/ProjectService";
import { MuseService } from "@/services/MuseService";
import { BillingService } from "@/services/BillingService";
import { logger } from "@/lib/logger";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Zod Input Validation
const chatRequestSchema = z.object({
  projectId: z.string().uuid("projectId must be a valid UUID"),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string().min(1, "Message content cannot be empty"),
    })
  ),
  modelOverride: z.enum(["Auto", "Claude", "GPT", "Grok", "Gemini"]).default("Auto"),
});

// Upstash sliding window rate limiter config
let globalRatelimit: Ratelimit | null = null;
const getGlobalRatelimit = (): Ratelimit | null => {
  if (globalRatelimit) return globalRatelimit;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    const redis = new Redis({ url, token });
    globalRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "60 s"),
    });
    return globalRatelimit;
  } catch (err) {
    console.error("Failed to initialize Upstash Redis rate limiter:", err);
    return null;
  }
};

// In-memory sliding window rate limiter fallback for development
const devCache = new Map<string, number[]>();
const devRatelimit = {
  async limit(userId: string) {
    const now = Date.now();
    const windowMs = 60000;
    const limit = 20;

    let timestamps = devCache.get(userId) || [];
    timestamps = timestamps.filter((t) => now - t < windowMs);

    if (timestamps.length >= limit) {
      const oldest = timestamps[0];
      const reset = oldest + windowMs;
      const retryAfter = Math.ceil((reset - now) / 1000);
      return { success: false, limit, remaining: 0, reset, retryAfter };
    }

    timestamps.push(now);
    devCache.set(userId, timestamps);
    return { success: true, limit, remaining: limit - timestamps.length, reset: now + windowMs, retryAfter: 0 };
  },
};

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  let userId = "unauthenticated";
  let projectId = "unspecified";

  try {
    // 1. Auth Guard
    const auth = await requireAuth(req);
    userId = auth.userId;

    // 2. Body Parser & Zod Validation
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = chatRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return Response.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Request inputs failed validation checks.",
            details: parseResult.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const { projectId: reqProjectId, messages, modelOverride } = parseResult.data;
    projectId = reqProjectId;

    // 3. Project Ownership Guard
    try {
      await ProjectService.verifyOwnership(projectId, userId);
    } catch (err) {
      if (err instanceof ForbiddenError) {
        return Response.json(
          {
            error: {
              code: "FORBIDDEN",
              message: "Access denied: You do not own this project.",
            },
          },
          { status: 403 }
        );
      }
      throw err;
    }

    // 3b. Credit Enforcement Check
    const limitCheck = await BillingService.checkLimit(userId, requestId);
    if (!limitCheck.isAllowed) {
      return Response.json(
        {
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: `Credit limit exceeded. You have used ${limitCheck.usage} of ${limitCheck.limit} character edits allowed on the ${limitCheck.tier} plan. Please upgrade to write more.`,
          },
        },
        { status: 402 } // Payment Required
      );
    }

    // 4. Sliding Window Rate Limiting
    const limiter = getGlobalRatelimit();
    const limitResult = limiter 
      ? await limiter.limit(userId)
      : process.env.NODE_ENV === "development"
        ? await devRatelimit.limit(userId)
        : { success: true, remaining: 20, reset: Date.now() + 60000, retryAfter: 0 };

    if (!limitResult.success) {
      const retryAfter = "retryAfter" in limitResult ? limitResult.retryAfter : 0;
      return Response.json(
        {
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Sliding window rate limit reached (20 requests per 60 seconds).",
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
          },
        }
      );
    }

    // 5. Run Routing and RAG in parallel via Service Layer
    const {
      result,
      modelAlias,
      reasoning,
      routingDecisionMs,
      ragRetrievalMs,
    } = await MuseService.chat(projectId, userId, messages, modelOverride, requestId);

    // Create stream response and track metrics on first byte
    const rawResponse = result.toTextStreamResponse({
      headers: {
        "x-annie-model": modelAlias,
        "x-annie-reasoning": encodeURIComponent(reasoning),
        "x-annie-latency": String(routingDecisionMs),
      },
    });

    const originalBody = rawResponse.body;
    if (originalBody) {
      let isFirstTokenLogged = false;
      const reader = originalBody.getReader();
      
      const loggedStream = new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                controller.close();
                break;
              }
              if (!isFirstTokenLogged) {
                const timeToFirstTokenMs = Date.now() - startTime;
                logger.info(
                  "Muse chat stream initiated successfully",
                  {
                    requestId,
                    userId,
                    projectId,
                    model: modelAlias,
                    durationMs: timeToFirstTokenMs,
                  },
                  {
                    routing_decision_ms: routingDecisionMs,
                    rag_retrieval_ms: ragRetrievalMs,
                    time_to_first_token_ms: timeToFirstTokenMs,
                  }
                );
                isFirstTokenLogged = true;
              }
              controller.enqueue(value);
            }
          } catch (e) {
            logger.error("Error reading streaming chat token chunks", e, {
              requestId,
              userId,
              projectId,
              model: modelAlias,
            });
            controller.error(e);
          }
        },
      });

      return new Response(loggedStream, {
        headers: rawResponse.headers,
        status: rawResponse.status,
        statusText: rawResponse.statusText,
      });
    }

    return rawResponse;
  } catch (err) {
    if (err instanceof Response) {
      return err; // requireAuth Response bypass
    }
    
    logger.error("Unhandled exception inside POST /api/v1/chat", err, {
      requestId,
      userId,
      projectId,
    });

    return Response.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: err instanceof Error ? err.message : "An unexpected server exception occurred.",
        },
      },
      { status: 500 }
    );
  }
}
