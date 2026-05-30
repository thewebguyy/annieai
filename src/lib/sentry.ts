// Architectural Layer: Utility
// Dependencies: src/lib/logger.ts

import { logger } from "./logger";

export const Sentry = {
  /**
   * Mocked/Defensive Sentry exception capturer. Logs captured errors to the structured JSON logger.
   */
  captureException(error: unknown, context?: { extra?: Record<string, unknown> }): void {
    const requestId = String(context?.extra?.requestId || "unknown");
    
    logger.error(
      "Sentry exception captured",
      error,
      {
        requestId,
      },
      context?.extra
    );
  },
};
