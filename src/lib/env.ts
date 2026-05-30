// Architectural Layer: Utility
// Dependencies: zod, @t3-oss/env-nextjs

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const isProd = process.env.NODE_ENV === "production";

export const env = createEnv({
  server: {
    SUPABASE_SERVICE_ROLE_KEY: isProd 
      ? z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required in production") 
      : z.string().optional(),
    OPENROUTER_API_KEY: isProd 
      ? z.string().min(1, "OPENROUTER_API_KEY is required in production") 
      : z.string().optional(),
    OPENAI_API_KEY: isProd 
      ? z.string().min(1, "OPENAI_API_KEY is required in production") 
      : z.string().optional(),
    PINECONE_API_KEY: isProd 
      ? z.string().min(1, "PINECONE_API_KEY is required in production") 
      : z.string().optional(),
    PINECONE_INDEX: z.string().default("story-bible"),
    UPSTASH_REDIS_REST_URL: isProd 
      ? z.string().url("UPSTASH_REDIS_REST_URL must be a valid URL") 
      : z.string().optional(),
    UPSTASH_REDIS_REST_TOKEN: isProd 
      ? z.string().min(1, "UPSTASH_REDIS_REST_TOKEN is required in production") 
      : z.string().optional(),
    SENTRY_DSN: z.string().optional(),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
    NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  },
  runtimeEnv: {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    PINECONE_API_KEY: process.env.PINECONE_API_KEY,
    PINECONE_INDEX: process.env.PINECONE_INDEX,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    SENTRY_DSN: process.env.SENTRY_DSN,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  },
});
