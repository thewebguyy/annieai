// Architectural Layer: Service Layer
// Dependencies: @pinecone-database/pinecone, ai, @ai-sdk/openai, src/lib/db/pinecone.ts, src/lib/sentry.ts

import { getPineconeClient } from "../lib/db/pinecone";
import { createOpenAI } from "@ai-sdk/openai";
import { embed } from "ai";
import { Sentry } from "../lib/sentry";

export interface StoryBibleSnippet {
  text: string;
  score?: number;
  source: string;
}

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY || "dummy-key";
  return createOpenAI({
    apiKey,
  });
};

export class RagService {
  /**
   * Ingests text into Pinecone, chunked to max 512 tokens (~400 words), under the project's namespace.
   */
  static async ingest(
    projectId: string,
    text: string,
    source: string,
    requestId: string
  ): Promise<boolean> {
    try {
      const apiKey = process.env.PINECONE_API_KEY;
      const openAiKey = process.env.OPENAI_API_KEY;

      if (!apiKey || !openAiKey) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            `[DEV FALLBACK] Pinecone or OpenAI key missing. Skipping ingest for project: ${projectId}`
          );
          return true;
        }
        throw new Error("Missing required Pinecone or OpenAI environment keys.");
      }

      const pc = getPineconeClient();
      const openai = getOpenAIClient();
      const indexName = process.env.PINECONE_INDEX || "story-bible";

      const chunks = this.chunkTextByWords(text, 400);
      const index = pc.index(indexName).namespace(projectId);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        const { embedding } = await embed({
          model: openai.embedding("text-embedding-3-small"),
          value: chunk,
        });

        await index.upsert([
          {
            id: `chunk-${projectId}-${Date.now()}-${i}`,
            values: embedding,
            metadata: {
              projectId,
              text: chunk,
              source,
              timestamp: new Date().toISOString(),
            },
          },
        ]);
      }

      return true;
    } catch (err) {
      Sentry.captureException(err, { extra: { requestId, projectId, source } });
      if (process.env.NODE_ENV === "development") {
        console.error("[DEV FALLBACK] Ingestion failed:", err);
        return false;
      }
      throw err;
    }
  }

  /**
   * Queries Pinecone Story Bible within the project's namespace.
   * Returns up to topK similar snippets.
   */
  static async query(
    projectId: string,
    queryText: string,
    topK = 3
  ): Promise<StoryBibleSnippet[]> {
    try {
      const apiKey = process.env.PINECONE_API_KEY;
      const openAiKey = process.env.OPENAI_API_KEY;

      if (!apiKey || !openAiKey) {
        return [];
      }

      const pc = getPineconeClient();
      const openai = getOpenAIClient();
      const indexName = process.env.PINECONE_INDEX || "story-bible";

      const { embedding } = await embed({
        model: openai.embedding("text-embedding-3-small"),
        value: queryText,
      });

      const index = pc.index(indexName).namespace(projectId);
      const results = await index.query({
        vector: embedding,
        topK,
        includeMetadata: true,
      });

      return (results.matches || [])
        .filter((match) => match.metadata && typeof match.metadata.text === "string")
        .map((match) => ({
          text: match.metadata!.text as string,
          score: match.score,
          source: (match.metadata!.source as string) || "Story Bible",
        }));
    } catch (err) {
      Sentry.captureException(err, { extra: { projectId, queryText } });
      console.error("Story Bible Pinecone query failed:", err);
      return [];
    }
  }

  /**
   * Simple word-based text chunker
   */
  private static chunkTextByWords(text: string, maxWords: number): string[] {
    const words = text.trim().split(/\s+/);
    if (words.length === 0 || words[0] === "") return [];
    
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += maxWords) {
      chunks.push(words.slice(i, i + maxWords).join(" "));
    }
    return chunks;
  }
}
