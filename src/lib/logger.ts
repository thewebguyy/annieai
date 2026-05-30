// Architectural Layer: Utility
// Dependencies: None

export interface LogContext {
  requestId: string;
  userId?: string;
  projectId?: string;
  model?: string;
  durationMs?: number;
}

export const logger = {
  info(event: string, context: LogContext, extra?: Record<string, unknown>): void {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        event,
        requestId: context.requestId,
        userId: context.userId,
        projectId: context.projectId,
        model: context.model,
        durationMs: context.durationMs,
        ...extra,
      })
    );
  },

  warn(event: string, context: LogContext, extra?: Record<string, unknown>): void {
    console.warn(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "warn",
        event,
        requestId: context.requestId,
        userId: context.userId,
        projectId: context.projectId,
        model: context.model,
        durationMs: context.durationMs,
        ...extra,
      })
    );
  },

  error(event: string, error: unknown, context: LogContext, extra?: Record<string, unknown>): void {
    const errorObj = error instanceof Error 
      ? { message: error.message, stack: error.stack } 
      : { message: String(error) };

    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        event,
        error: errorObj,
        requestId: context.requestId,
        userId: context.userId,
        projectId: context.projectId,
        model: context.model,
        durationMs: context.durationMs,
        ...extra,
      })
    );
  },
};
