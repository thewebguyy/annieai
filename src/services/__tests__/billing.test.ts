import { describe, it, expect, vi, beforeEach } from "vitest";
import { BillingService, PLAN_LIMITS } from "../BillingService";
import { createSupabaseServer } from "../../lib/db/supabase";

vi.mock("../../lib/db/supabase", () => ({
  createSupabaseServer: vi.fn(),
}));

describe("BillingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMonthlyUsage", () => {
    it("should query contribution logs and sum content_delta correctly", async () => {
      const mockLogs = [
        { content_delta: 100 },
        { content_delta: -50 },
        { content_delta: 200 },
      ];

      const mockGte = vi.fn().mockResolvedValue({
        data: mockLogs,
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue({
        gte: mockGte,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(createSupabaseServer).mockResolvedValue({
        from: vi.fn().mockReturnValue({
          select: mockSelect,
        }),
      } as unknown as Awaited<ReturnType<typeof createSupabaseServer>>);

      const usage = await BillingService.getMonthlyUsage("user-1", "req-1");
      // Sum of absolute content_delta: 100 + 50 + 200 = 350
      expect(usage).toBe(350);
    });
  });

  describe("checkLimit", () => {
    it("should allow access when usage is below the free tier limit", async () => {
      const mockUser = {
        id: "user-1",
        user_metadata: { tier: "free" },
      };

      // Mock getUser
      const mockGetUser = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock getMonthlyUsage by mocking createSupabaseServer for it too
      const mockGte = vi.fn().mockResolvedValue({
        data: [{ content_delta: 1000 }],
        error: null,
      });
      const mockEq = vi.fn().mockReturnValue({ gte: mockGte });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(createSupabaseServer).mockResolvedValue({
        auth: {
          getUser: mockGetUser,
        },
        from: vi.fn().mockReturnValue({
          select: mockSelect,
        }),
      } as unknown as Awaited<ReturnType<typeof createSupabaseServer>>);

      const result = await BillingService.checkLimit("user-1", "req-1");
      expect(result.isAllowed).toBe(true);
      expect(result.limit).toBe(PLAN_LIMITS.free);
      expect(result.usage).toBe(1000);
      expect(result.tier).toBe("free");
    });

    it("should deny access when usage is above the free tier limit", async () => {
      const mockUser = {
        id: "user-1",
        user_metadata: { tier: "free" },
      };

      const mockGetUser = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockGte = vi.fn().mockResolvedValue({
        data: [{ content_delta: 60000 }],
        error: null,
      });
      const mockEq = vi.fn().mockReturnValue({ gte: mockGte });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(createSupabaseServer).mockResolvedValue({
        auth: {
          getUser: mockGetUser,
        },
        from: vi.fn().mockReturnValue({
          select: mockSelect,
        }),
      } as unknown as Awaited<ReturnType<typeof createSupabaseServer>>);

      const result = await BillingService.checkLimit("user-1", "req-1");
      expect(result.isAllowed).toBe(false);
      expect(result.limit).toBe(PLAN_LIMITS.free);
      expect(result.usage).toBe(60000);
    });

    it("should allow access for pro user above free limit but below pro limit", async () => {
      const mockUser = {
        id: "user-1",
        user_metadata: { tier: "pro" },
      };

      const mockGetUser = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockGte = vi.fn().mockResolvedValue({
        data: [{ content_delta: 60000 }],
        error: null,
      });
      const mockEq = vi.fn().mockReturnValue({ gte: mockGte });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(createSupabaseServer).mockResolvedValue({
        auth: {
          getUser: mockGetUser,
        },
        from: vi.fn().mockReturnValue({
          select: mockSelect,
        }),
      } as unknown as Awaited<ReturnType<typeof createSupabaseServer>>);

      const result = await BillingService.checkLimit("user-1", "req-1");
      expect(result.isAllowed).toBe(true);
      expect(result.limit).toBe(PLAN_LIMITS.pro);
      expect(result.usage).toBe(60000);
      expect(result.tier).toBe("pro");
    });
  });
});
