// Architectural Layer: Utility / Auth Guard
// Dependencies: src/lib/db/supabase.ts

import { createSupabaseServer } from "./db/supabase";
import type { Session } from "@supabase/supabase-js";

export interface AuthenticatedUser {
  userId: string;
  session: Session;
}

/**
 * Validates the Supabase session on the server side.
 * Throws a 401 JSON Response on failure.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function requireAuth(_req?: Request): Promise<AuthenticatedUser> {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session || !session.user) {
      throw new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication session is missing or expired.",
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return {
      userId: session.user.id,
      session,
    };
  } catch (err) {
    if (err instanceof Response) {
      throw err;
    }
    throw new Response(
      JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message: "Unable to verify authentication session.",
          details: err instanceof Error ? err.message : err,
        },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
