// Architectural Layer: Route Handler
// Dependencies: zod, src/lib/auth.ts, src/services/ProjectService.ts, src/services/ComplianceService.ts, src/lib/logger.ts, src/components/editor/EditorSerializer.ts

import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { ProjectService, ForbiddenError } from "@/services/ProjectService";
import { ComplianceService } from "@/services/ComplianceService";
import { logger } from "@/lib/logger";
import type { SceneRow } from "@/components/editor/EditorSerializer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const scenesSaveSchema = z.object({
  scenes: z.array(
    z.object({
      id: z.string().uuid().optional(),
      type: z.enum(["scene_heading", "action", "character", "dialogue", "parenthetical"]),
      content: z.string().default(""),
      order_index: z.number().int(),
    })
  ),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const requestId = crypto.randomUUID();
  let userId = "unauthenticated";

  try {
    const auth = await requireAuth(req);
    userId = auth.userId;

    const scenes = await ProjectService.getScenes(projectId, userId, requestId);

    return Response.json({
      data: scenes,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    if (err instanceof ForbiddenError) {
      return Response.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "Access denied to this project.",
          },
        },
        { status: 403 }
      );
    }

    logger.error("GET /api/v1/projects/[id]/scenes failure", err, {
      requestId,
      userId,
      projectId,
    });

    return Response.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve project screenplay scenes.",
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const requestId = crypto.randomUUID();
  let userId = "unauthenticated";

  try {
    const auth = await requireAuth(req);
    userId = auth.userId;

    const rawBody = await req.json().catch(() => ({}));
    const parseResult = scenesSaveSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return Response.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Screenplay scenes data format validation failed.",
            details: parseResult.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const { scenes } = parseResult.data;

    // 1. Fetch current scenes from database to calculate contentDelta changes
    const previousScenes = await ProjectService.getScenes(projectId, userId, requestId);
    const prevCharCount = previousScenes.reduce((sum: number, s: SceneRow) => sum + s.content.length, 0);
    const newCharCount = scenes.reduce((sum: number, s: { content: string }) => sum + s.content.length, 0);
    const contentDelta = Math.abs(newCharCount - prevCharCount);

    // 2. Perform the smart sync persistence
    const savedScenes = await ProjectService.saveScenes(
      projectId,
      userId,
      scenes.map((s) => ({ ...s, project_id: projectId })),
      requestId
    );

    // 3. Log human contribution event if text content has changed
    if (contentDelta > 0) {
      try {
        await ComplianceService.logContribution(
          {
            projectId,
            userId,
            actor: "human",
            actionType: "edit",
            contentDelta,
            nodeType: scenes[0]?.type || "action",
          },
          requestId
        );
      } catch (logErr) {
        logger.error("Failed to log human contribution event during scene sync", logErr, {
          requestId,
          userId,
          projectId,
        });
      }
    }

    return Response.json({
      data: savedScenes,
    });
  } catch (err) {
    if (err instanceof Response) return err;
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

    logger.error("POST /api/v1/projects/[id]/scenes failure", err, {
      requestId,
      userId,
      projectId,
    });

    return Response.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to persist project screenplay scenes.",
        },
      },
      { status: 500 }
    );
  }
}
