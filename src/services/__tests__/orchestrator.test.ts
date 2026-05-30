// Architectural Layer: Test Layer
// Dependencies: vitest, ai, src/lib/ai/orchestrator.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { routeTask } from "@/lib/ai/orchestrator";
import { generateObject } from "ai";

vi.mock("ai", () => ({
  generateObject: vi.fn(),
}));

describe("Orchestrator routeTask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENROUTER_API_KEY = "test-openrouter-key";
  });

  it("should select the optimal model and return model alias & reasoning", async () => {
    vi.mocked(generateObject).mockResolvedValue({
      object: {
        model: "claude",
        reasoning: "Deep character interaction and dialogue required.",
        taskType: "dialogue",
      },
    } as unknown as Awaited<ReturnType<typeof generateObject>>);

    const res = await routeTask(
      "Write a dramatic dialogue between Elara and her shadow.",
      "test-request-id"
    );

    expect(res.model).toBe("claude");
    expect(res.reasoning).toContain("Deep character interaction");
  });

  it("should gracefully fallback to gpt when routing model calls fail", async () => {
    vi.mocked(generateObject).mockRejectedValue(new Error("OpenRouter API error (503)"));

    const res = await routeTask(
      "Refine the pacing of this script sequence.",
      "test-request-id"
    );

    expect(res.model).toBe("gpt");
    expect(res.reasoning).toBe("System fallback due to routing error");
  });
});
