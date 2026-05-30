// Architectural Layer: Test Layer
// Dependencies: vitest, src/services/RagService.ts, src/lib/db/pinecone.ts, ai

import { describe, it, expect, vi, beforeEach } from "vitest";
import { RagService } from "../RagService";
import { getPineconeClient } from "../../lib/db/pinecone";
import { embed } from "ai";

vi.mock("../../lib/db/pinecone", () => ({
  getPineconeClient: vi.fn(),
}));

vi.mock("ai", () => ({
  embed: vi.fn(),
}));

describe("RagService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PINECONE_API_KEY = "test-key";
    process.env.OPENAI_API_KEY = "test-openai-key";
    process.env.PINECONE_INDEX = "story-bible";
  });

  it("should query Pinecone using project namespace filter", async () => {
    const mockQuery = vi.fn().mockResolvedValue({
      matches: [
        {
          id: "chunk-1",
          score: 0.88,
          metadata: { text: "Elara is a 32-year old rebel hacker.", source: "Story Bible Initializer" },
        },
      ],
    });

    const mockNamespace = vi.fn().mockReturnValue({
      query: mockQuery,
    });

    const mockIndex = vi.fn().mockReturnValue({
      namespace: mockNamespace,
    });

    vi.mocked(getPineconeClient).mockReturnValue({
      index: mockIndex,
    } as unknown as ReturnType<typeof getPineconeClient>);

    vi.mocked(embed).mockResolvedValue({
      embedding: [0.12, -0.05, 0.41],
    } as unknown as ReturnType<typeof embed>);

    const snippets = await RagService.query("project-uuid-123", "Who is Elara?");

    expect(mockIndex).toHaveBeenCalledWith("story-bible");
    expect(mockNamespace).toHaveBeenCalledWith("project-uuid-123");
    expect(snippets.length).toBe(1);
    expect(snippets[0].text).toBe("Elara is a 32-year old rebel hacker.");
    expect(snippets[0].source).toBe("Story Bible Initializer");
  });

  it("should gracefully degrade to empty array on embedding or DB error", async () => {
    vi.mocked(embed).mockRejectedValue(new Error("Rate Limit or API Unreachable"));

    const snippets = await RagService.query("project-uuid-123", "Who is Elara?");
    expect(snippets).toEqual([]);
  });
});
