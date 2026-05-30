// Architectural Layer: Route Handler
// Dependencies: src/lib/auth.ts, src/services/ProjectService.ts, src/lib/db/supabase.ts, src/lib/logger.ts

import { requireAuth } from "@/lib/auth";
import { ProjectService, ForbiddenError } from "@/services/ProjectService";
import { createSupabaseServer } from "@/lib/db/supabase";
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

    // 1. Verify project ownership
    try {
      await ProjectService.verifyOwnership(projectId, userId);
    } catch (err) {
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
      throw err;
    }

    const supabase = await createSupabaseServer();

    // 2. Fetch last 20 AI edit scene versions for this project
    const { data: versions, error: dbErr } = await supabase
      .from("scene_versions")
      .select(`
        id,
        scene_id,
        content,
        saved_at,
        author,
        model,
        scenes!inner (
          project_id,
          type,
          order_index
        )
      `)
      .eq("scenes.project_id", projectId)
      .eq("author", "ai")
      .order("saved_at", { ascending: false })
      .limit(20);

    if (dbErr) {
      throw new Error(`Failed to query scene versions: ${dbErr.message}`);
    }

    return Response.json({
      data: versions || [],
    });
  } catch (err) {
    if (err instanceof Response) return err;

    logger.error("GET /api/v1/projects/[id]/versions failure", err, {
      requestId,
      userId,
      projectId,
    });

    return Response.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve project version history.",
        },
      },
      { status: 500 }
    );
  }
}
