// Architectural Layer: Route Handler
// Dependencies: zod, src/lib/auth.ts, src/services/ProjectService.ts, src/services/ComplianceService.ts, src/lib/logger.ts

import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { ProjectService, ForbiddenError } from "@/services/ProjectService";
import { ComplianceService } from "@/services/ComplianceService";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const reportRequestSchema = z.object({
  projectId: z.string().uuid("projectId must be a valid UUID"),
});

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  let userId = "unauthenticated";
  let projectId = "unspecified";

  try {
    const auth = await requireAuth(req);
    userId = auth.userId;

    const rawBody = await req.json().catch(() => ({}));
    const parseResult = reportRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return Response.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Report request inputs failed validation checks.",
            details: parseResult.error.format(),
          },
        },
        { status: 400 }
      );
    }

    projectId = parseResult.data.projectId;

    // 1. Verify project ownership before generating report
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

    // 2. Generate compliance report metrics
    const report = await ComplianceService.generateReport(projectId, requestId);

    return Response.json({
      data: report,
    });
  } catch (err) {
    if (err instanceof Response) return err;

    logger.error("POST /api/v1/compliance/report failure", err, {
      requestId,
      userId,
      projectId,
    });

    return Response.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to generate compliance report data.",
        },
      },
      { status: 500 }
    );
  }
}
