// Architectural Layer: Service Layer
// Dependencies: src/lib/db/supabase.ts, src/lib/sentry.ts, crypto (global randomUUID)

import { createSupabaseServer } from "../lib/db/supabase";
import { Sentry } from "../lib/sentry";
import type { Project } from "../stores/projectStore";
import type { SceneRow } from "../components/editor/EditorSerializer";

export class ForbiddenError extends Error {
  constructor(message = "Forbidden: Access denied to this project") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class ProjectService {
  /**
   * Validates if the project belongs to the user.
   * Throws ForbiddenError if ownership check fails.
   */
  static async verifyOwnership(projectId: string, userId: string): Promise<void> {
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) {
      throw new ForbiddenError();
    }
  }

  /**
   * Retrieves all projects owned by the user.
   */
  static async getProjects(userId: string, requestId: string): Promise<Project[]> {
    try {
      const supabase = await createSupabaseServer();
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) {
        throw new Error(`Failed to load projects: ${error.message}`);
      }

      return (data || []) as Project[];
    } catch (e) {
      Sentry.captureException(e, { extra: { requestId, userId } });
      throw e;
    }
  }

  /**
   * Creates a new project and returns the created record.
   */
  static async createProject(
    userId: string,
    title: string,
    genre: string,
    logline: string,
    requestId: string
  ): Promise<Project> {
    try {
      const supabase = await createSupabaseServer();
      const { data, error } = await supabase
        .from("projects")
        .insert({
          user_id: userId,
          title,
          genre,
          logline,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create project: ${error.message}`);
      }

      return data as Project;
    } catch (e) {
      Sentry.captureException(e, { extra: { requestId, userId } });
      throw e;
    }
  }

  /**
   * Retrieves all scenes for a project sorted by order_index.
   * Verifies ownership first.
   */
  static async getScenes(
    projectId: string,
    userId: string,
    requestId: string
  ): Promise<SceneRow[]> {
    try {
      await this.verifyOwnership(projectId, userId);

      const supabase = await createSupabaseServer();
      const { data, error } = await supabase
        .from("scenes")
        .select("id, project_id, type, content, order_index")
        .eq("project_id", projectId)
        .order("order_index", { ascending: true });

      if (error) {
        throw new Error(`Failed to load scenes: ${error.message}`);
      }

      return (data || []) as SceneRow[];
    } catch (e) {
      if (!(e instanceof ForbiddenError)) {
        Sentry.captureException(e, { extra: { requestId, projectId, userId } });
      }
      throw e;
    }
  }

  /**
   * Smart syncs screenplay scenes to preserve scene_versions history.
   * Compares incoming scenes against database, deletes orphans, and upserts current state.
   */
  static async saveScenes(
    projectId: string,
    userId: string,
    scenes: SceneRow[],
    requestId: string
  ): Promise<SceneRow[]> {
    try {
      await this.verifyOwnership(projectId, userId);

      const supabase = await createSupabaseServer();

      // 1. Fetch current scene IDs in the database
      const { data: existing, error: loadErr } = await supabase
        .from("scenes")
        .select("id")
        .eq("project_id", projectId);

      if (loadErr) {
        throw new Error(`Failed to sync existing scenes: ${loadErr.message}`);
      }

      const existingIds = existing ? existing.map((r) => r.id) : [];

      // 2. Identify deletions (existing IDs not present in incoming list)
      const incomingIds = new Set(scenes.map((s) => s.id).filter(Boolean));
      const idsToDelete = existingIds.filter((id) => !incomingIds.has(id));

      if (idsToDelete.length > 0) {
        const { error: delErr } = await supabase
          .from("scenes")
          .delete()
          .in("id", idsToDelete);

        if (delErr) {
          throw new Error(`Failed to delete orphaned scenes: ${delErr.message}`);
        }
      }

      // 3. Upsert incoming scenes
      const upsertPayload = scenes.map((scene) => ({
        id: scene.id || crypto.randomUUID(),
        project_id: projectId,
        type: scene.type,
        content: scene.content,
        order_index: scene.order_index,
      }));

      if (upsertPayload.length > 0) {
        const { data: saved, error: upsertErr } = await supabase
          .from("scenes")
          .upsert(upsertPayload)
          .select("id, project_id, type, content, order_index");

        if (upsertErr) {
          throw new Error(`Failed to save scenes: ${upsertErr.message}`);
        }

        return (saved || []).sort((a, b) => a.order_index - b.order_index) as SceneRow[];
      }

      return [];
    } catch (e) {
      if (!(e instanceof ForbiddenError)) {
        Sentry.captureException(e, { extra: { requestId, projectId, userId } });
      }
      throw e;
    }
  }
}
