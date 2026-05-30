// Architectural Layer: Service Layer
// Dependencies: src/lib/db/supabase.ts, src/lib/sentry.ts

import { createSupabaseServer } from "../lib/db/supabase";
import { Sentry } from "../lib/sentry";

export interface ContributionEvent {
  projectId: string;
  userId: string;
  actor: "human" | "ai";
  model?: string;
  actionType: "generate" | "edit" | "rewrite";
  contentDelta: number;
  nodeType?: string;
}

export interface WGAReport {
  complianceStatus: "Standard" | "Warning: High AI Contribution";
  metrics: {
    totalChars: number;
    humanChars: number;
    aiChars: number;
    aiPercentage: string;
  };
  modelBreakdown: Record<string, number>;
}

export class ComplianceService {
  /**
   * Logs a contribution event (human keystrokes or AI writes) to Supabase database.
   */
  static async logContribution(
    event: ContributionEvent,
    requestId: string
  ): Promise<void> {
    try {
      const supabase = await createSupabaseServer();
      
      const { error } = await supabase.from("contribution_logs").insert({
        project_id: event.projectId,
        user_id: event.userId,
        actor: event.actor,
        model: event.model || null,
        action_type: event.actionType,
        content_delta: event.contentDelta,
        node_type: event.nodeType || null,
      });

      if (error) {
        throw new Error(`Failed to log contribution: ${error.message}`);
      }
    } catch (e) {
      Sentry.captureException(e, { extra: { requestId, projectId: event.projectId } });
      throw e;
    }
  }

  /**
   * Queries contribution_logs and generates a structured summary of character counts and percentages.
   */
  static async generateReport(
    projectId: string,
    requestId: string
  ): Promise<WGAReport> {
    try {
      const supabase = await createSupabaseServer();

      const { data: logs, error } = await supabase
        .from("contribution_logs")
        .select("actor, model, content_delta")
        .eq("project_id", projectId);

      if (error) {
        throw new Error(`Failed to retrieve contribution logs: ${error.message}`);
      }

      if (!logs || logs.length === 0) {
        return {
          complianceStatus: "Standard",
          metrics: {
            totalChars: 0,
            humanChars: 0,
            aiChars: 0,
            aiPercentage: "0.0%",
          },
          modelBreakdown: {},
        };
      }

      let totalChars = 0;
      let humanChars = 0;
      let aiChars = 0;
      const modelBreakdown: Record<string, number> = {};

      for (const log of logs) {
        const delta = Math.abs(log.content_delta);
        totalChars += delta;
        
        if (log.actor === "ai") {
          aiChars += delta;
          const modelName = log.model || "unknown";
          modelBreakdown[modelName] = (modelBreakdown[modelName] || 0) + delta;
        } else {
          humanChars += delta;
        }
      }

      const aiPercentage = totalChars > 0 ? (aiChars / totalChars) * 100 : 0;

      return {
        complianceStatus: aiPercentage > 50 ? "Warning: High AI Contribution" : "Standard",
        metrics: {
          totalChars,
          humanChars,
          aiChars,
          aiPercentage: aiPercentage.toFixed(1) + "%",
        },
        modelBreakdown,
      };
    } catch (e) {
      Sentry.captureException(e, { extra: { requestId, projectId } });
      throw e;
    }
  }
}
