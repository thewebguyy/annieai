// Architectural Layer: Test Layer
// Dependencies: vitest, src/lib/auth.ts, src/lib/db/supabase.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAuth } from "../../lib/auth";
import { createSupabaseServer } from "../../lib/db/supabase";

vi.mock("../../lib/db/supabase", () => ({
  createSupabaseServer: vi.fn(),
}));

describe("requireAuth Helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return the user ID and session on a successful query", async () => {
    const mockSession = {
      user: { id: "user-uuid-999" },
    };

    vi.mocked(createSupabaseServer).mockResolvedValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: mockSession },
          error: null,
        }),
      },
    } as unknown as Awaited<ReturnType<typeof createSupabaseServer>>);

    const auth = await requireAuth();

    expect(auth.userId).toBe("user-uuid-999");
    expect(auth.session).toEqual(mockSession);
  });

  it("should throw a 401 JSON Response if getSession returns no session", async () => {
    vi.mocked(createSupabaseServer).mockResolvedValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
          error: null,
        }),
      },
    } as unknown as Awaited<ReturnType<typeof createSupabaseServer>>);

    let errorResponse: Response | null = null;
    try {
      await requireAuth();
    } catch (e) {
      if (e instanceof Response) {
        errorResponse = e;
      }
    }

    expect(errorResponse).not.toBeNull();
    expect(errorResponse!.status).toBe(401);
    
    const body = await errorResponse!.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("should throw a 401 JSON Response when database call itself rejects", async () => {
    vi.mocked(createSupabaseServer).mockRejectedValue(new Error("Supabase is offline"));

    let errorResponse: Response | null = null;
    try {
      await requireAuth();
    } catch (e) {
      if (e instanceof Response) {
        errorResponse = e;
      }
    }

    expect(errorResponse).not.toBeNull();
    expect(errorResponse!.status).toBe(401);
    
    const body = await errorResponse!.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });
});
