// Architectural Layer: Test Layer
// Dependencies: vitest, src/services/ComplianceService.ts, src/lib/db/supabase.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ComplianceService } from "../ComplianceService";
import { createSupabaseServer } from "../../lib/db/supabase";

vi.mock("../../lib/db/supabase", () => ({
  createSupabaseServer: vi.fn(),
}));

describe("ComplianceService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate correct contribution ratios and compile model breakdowns", async () => {
    const mockLogs = [
      { actor: "human", content_delta: 100, model: null },
      { actor: "human", content_delta: 200, model: null },
      { actor: "ai", content_delta: 150, model: "gpt-4o" },
      { actor: "ai", content_delta: 50, model: "claude-3.5" },
    ];

    const mockEq = vi.fn().mockResolvedValue({
      data: mockLogs,
      error: null,
    });

    const mockSelect = vi.fn().mockReturnValue({
      eq: mockEq,
    });

    vi.mocked(createSupabaseServer).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: mockSelect,
      }),
    } as unknown as Awaited<ReturnType<typeof createSupabaseServer>>);

    const report = await ComplianceService.generateReport("project-1", "test-request");

    expect(report.metrics.totalChars).toBe(500);
    expect(report.metrics.humanChars).toBe(300);
    expect(report.metrics.aiChars).toBe(200);
    expect(report.metrics.aiPercentage).toBe("40.0%");
    expect(report.modelBreakdown["gpt-4o"]).toBe(150);
    expect(report.modelBreakdown["claude-3.5"]).toBe(50);
    expect(report.complianceStatus).toBe("Standard");
  });

  it("should set Warning flag when AI contribution exceeds 50 percent threshold", async () => {
    const mockLogs = [
      { actor: "human", content_delta: 100, model: null },
      { actor: "ai", content_delta: 300, model: "gpt-4o" },
    ];

    const mockEq = vi.fn().mockResolvedValue({
      data: mockLogs,
      error: null,
    });

    const mockSelect = vi.fn().mockReturnValue({
      eq: mockEq,
    });

    vi.mocked(createSupabaseServer).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: mockSelect,
      }),
    } as unknown as Awaited<ReturnType<typeof createSupabaseServer>>);

    const report = await ComplianceService.generateReport("project-1", "test-request");

    expect(report.metrics.aiPercentage).toBe("75.0%");
    expect(report.complianceStatus).toBe("Warning: High AI Contribution");
  });
});
