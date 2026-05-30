// Architectural Layer: Route Handler
// Dependencies: src/lib/auth.ts, src/services/ProjectService.ts, src/components/editor/EditorSerializer.ts, src/lib/logger.ts

import { requireAuth } from "@/lib/auth";
import { ProjectService, ForbiddenError } from "@/services/ProjectService";
import { EditorSerializer } from "@/components/editor/EditorSerializer";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    // Fetch the scenes sorted by order_index (getScenes does this automatically)
    const scenes = await ProjectService.getScenes(projectId, userId, requestId);

    // Convert scenes to Fountain format
    const fountainText = EditorSerializer.toFountain(scenes);

    // Return the response with appropriate attachment headers
    return new Response(fountainText, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="screenplay-${projectId}.fountain"`,
      },
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

    logger.error("GET /api/v1/projects/[id]/export failure", err, {
      requestId,
      userId,
      projectId,
    });

    return Response.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to export screenplay to Fountain format.",
        },
      },
      { status: 500 }
    );
  }
}
