// Architectural Layer: Route Handler
// Dependencies: zod, src/lib/auth.ts, src/services/ProjectService.ts, src/services/RagService.ts, src/lib/logger.ts

import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { ProjectService } from "@/services/ProjectService";
import { RagService } from "@/services/RagService";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createProjectSchema = z.object({
  title: z.string().min(1, "Title must be at least 1 character long"),
  genre: z.string().min(1, "Genre must be specified"),
  logline: z.string().min(1, "Logline must be specified"),
  characters: z.string().default(""),
});

export async function GET(req: Request) {
  const requestId = crypto.randomUUID();
  let userId = "unauthenticated";

  try {
    const auth = await requireAuth(req);
    userId = auth.userId;

    const projects = await ProjectService.getProjects(userId, requestId);

    return Response.json({
      data: projects,
    });
  } catch (err) {
    if (err instanceof Response) return err;

    logger.error("GET /api/v1/projects failure", err, { requestId, userId });
    return Response.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve projects.",
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  let userId = "unauthenticated";

  try {
    const auth = await requireAuth(req);
    userId = auth.userId;

    const rawBody = await req.json().catch(() => ({}));
    const parseResult = createProjectSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return Response.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Project setup inputs failed validation checks.",
            details: parseResult.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const { title, genre, logline, characters } = parseResult.data;

    // 1. Create project row in database
    const project = await ProjectService.createProject(
      userId,
      title,
      genre,
      logline,
      requestId
    );

    // 2. Index core details (Story Bible) into Pinecone namespace in background
    const details = `Title: ${title}\nGenre: ${genre}\nLogline: ${logline}\nCharacters: ${characters}`;
    
    // Non-blocking Pinecone RAG ingestion
    RagService.ingest(project.id, details, "Story Bible Initializer", requestId)
      .then((success: boolean) => {
        logger.info("Auto-ingestion of Story Bible finished", {
          requestId,
          userId,
          projectId: project.id,
        }, { success });
      })
      .catch((err: unknown) => {
        logger.error("Auto-ingestion of Story Bible failed", err, {
          requestId,
          userId,
          projectId: project.id,
        });
      });

    return Response.json({
      data: project,
    }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;

    logger.error("POST /api/v1/projects failure", err, { requestId, userId });
    return Response.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to initialize new project.",
        },
      },
      { status: 500 }
    );
  }
}
