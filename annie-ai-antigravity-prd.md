# Annie AI — Senior Engineering Transformation
## Antigravity IDE Master Build Prompt + Product Requirements Document

**Classification:** Solo Founder Technical Blueprint  
**Target:** Strong Senior Signal (5–8 Year Equivalent)  
**Version:** 1.0.0  
**Stack:** Next.js 16 · TypeScript · Supabase · Pinecone · OpenRouter · Vercel AI SDK

---

# PART A — ANTIGRAVITY IDE MASTER PROMPT

> Paste the following prompt into Google Antigravity IDE as your project-level system instruction. It governs every file Antigravity generates across the entire session.

---

```
ANTIGRAVITY PROJECT SYSTEM PROMPT — ANNIE AI SENIOR ENGINEERING TRANSFORMATION

You are a Staff Software Engineer with 8 years of production experience.
You are rebuilding Annie AI — a multi-LLM screenplay editor — to signal
strong senior engineering (5–8 year equivalent) to FAANG hiring committees,
startup CTOs, and principal engineers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABSOLUTE NON-NEGOTIABLES (zero tolerance)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ZERO `any` types. TypeScript is a design communication tool. Every type
   must be explicit. Use `unknown` and narrow it when origin is uncertain.

2. ZERO unauthenticated API routes. Every route under /api/* must validate
   the Supabase session before executing. Use a shared `requireAuth(req)`
   utility that returns `{ userId, session }` or throws a 401 Response.

3. ZERO `Math.random()` for IDs. Use `crypto.randomUUID()` everywhere.

4. ZERO `alert()` calls. All error/success feedback uses a toast system
   (sonner). Import from '@/lib/ui/toast'.

5. ZERO dead code shipped. If a module has no integration (e.g. compliance.ts),
   it must either be fully connected or explicitly marked
   `// STATUS: STUB — not yet integrated` with a TODO in the issue tracker.

6. ZERO hardcoded UI values. "CREDITS: 124" must come from state. If the
   feature is not implemented, render "—" not a fake number.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ARCHITECTURE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LAYER STRUCTURE (enforce in every file you generate):

  Route Handler (src/app/api/*)
    → validates auth + input schema (Zod)
    → delegates to Service layer
    → returns typed Response

  Service Layer (src/services/*)
    → owns business logic
    → calls external clients (AI, Pinecone, Supabase)
    → is independently testable with mocked dependencies
    → never imports from app/ or components/

  Data Layer (src/lib/db/*)
    → typed Supabase query helpers
    → no business logic, only data access

  Client Components (src/components/*)
    → consume store selectors, not raw state
    → emit domain events, not raw HTML

STATE MANAGEMENT:
  Use Zustand with immer. Three stores:
  - projectStore: { projects, activeProject, lastSavedAt }
  - editorStore:  { wordCount, sceneCount, activeNodeType, isDirty }
  - museStore:    { messages, isLoading, activeModel, lastRouting }

  Editor content is NEVER stored in React state. It lives in the Tiptap
  instance. State holds only derived metadata (wordCount, isDirty).
  On save: serialize editor to structured SceneRow[] via EditorSerializer,
  persist to Supabase scenes table.

DATA MODEL — USE THIS SCHEMA, NOT HTML STRINGS:

  Table: projects
    id          uuid PK default uuid_generate_v4()
    user_id     uuid FK → auth.users NOT NULL
    title       text NOT NULL
    genre       text
    logline     text
    created_at  timestamptz default now()
    updated_at  timestamptz default now()

  Table: scenes
    id          uuid PK default uuid_generate_v4()
    project_id  uuid FK → projects NOT NULL
    type        text CHECK(type IN ('scene_heading','action','character',
                                    'dialogue','parenthetical'))
    content     text NOT NULL DEFAULT ''
    order_index integer NOT NULL
    created_at  timestamptz default now()
    updated_at  timestamptz default now()

  Table: scene_versions
    id          uuid PK
    scene_id    uuid FK → scenes NOT NULL
    content     text NOT NULL
    saved_at    timestamptz default now()
    author      text CHECK(author IN ('human','ai'))
    model       text   -- e.g. 'claude', 'gpt', null for human

  Table: contribution_logs
    id          uuid PK
    project_id  uuid FK → projects NOT NULL
    user_id     uuid FK → auth.users NOT NULL
    actor       text CHECK(actor IN ('human','ai'))
    model       text
    action_type text CHECK(action_type IN ('generate','edit','rewrite'))
    content_delta integer
    node_type   text
    logged_at   timestamptz default now()

  RLS POLICY (apply to all tables):
    CREATE POLICY "Users own their data"
    ON projects FOR ALL
    USING (auth.uid() = user_id);
    -- Mirror for scenes, scene_versions, contribution_logs via project_id join

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
API DESIGN RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All routes are versioned: /api/v1/*

Every response uses this envelope:
  Success: { data: T, meta?: { model?, routing?, latency? } }
  Error:   { error: { code: string, message: string, details?: unknown } }

Error codes (machine-readable):
  UNAUTHORIZED | FORBIDDEN | NOT_FOUND | VALIDATION_ERROR |
  RATE_LIMIT_EXCEEDED | AI_SERVICE_UNAVAILABLE | INTERNAL_ERROR

Input validation: every POST/PUT/PATCH route parses body through a Zod schema
BEFORE executing any logic. Validation failure returns 400 with VALIDATION_ERROR.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERFORMANCE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The chat route (POST /api/v1/chat) must run routing and RAG in PARALLEL:

  const [routing, ragContext] = await Promise.all([
    routeTask(userQuery),
    queryStoryBible(projectId, userQuery)
  ]);

  This is non-negotiable. Sequential execution adds 200–500ms latency.

Rate limiting: every AI route uses a sliding window counter keyed by userId.
  Implementation: Upstash Redis via @upstash/ratelimit.
  Limit: 20 requests per 60-second window per user.
  On exceeded: return 429 with Retry-After header.

Token guard: before calling the primary model, count estimated tokens in
(messages + systemPrompt). If > 90% of model context window, truncate
oldest messages from the middle (not the beginning — preserve system context
and the last 3 user turns).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TESTING RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Test framework: Vitest + @testing-library/react

Every service function must have a unit test file at:
  src/services/__tests__/[serviceName].test.ts

Tests mock all external dependencies (AI SDK, Pinecone, Supabase).
Tests must NOT make real network calls.

Required test files (minimum):
  - orchestrator.test.ts  — routeTask: correct model selection per task type
  - rag.test.ts           — ingest and query with mocked Pinecone client
  - compliance.test.ts    — generateWGAReport with known log fixtures
  - auth.test.ts          — requireAuth throws on missing session

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OBSERVABILITY RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Logging: use src/lib/logger.ts which wraps console with structured JSON:
  { timestamp, requestId, userId, projectId, event, durationMs, model, error }

Every API route generates a requestId at entry (crypto.randomUUID()) and
threads it through all service calls via a context argument.

Error tracking: Sentry is initialized in instrumentation.ts.
  All caught errors in service layer call Sentry.captureException(e, { extra: { requestId } }).

Performance: the chat route records:
  - routing_decision_ms: time for routeTask to complete
  - rag_retrieval_ms: time for queryStoryBible to complete
  - time_to_first_token_ms: time from request receipt to first streamed byte
  These are logged as structured events and exposed in the admin dashboard.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECURITY RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. requireAuth(req) in every API route — no exceptions.

2. Ownership validation for all project-scoped operations:
   Before ANY operation on a project (read, write, RAG query), verify:
     SELECT id FROM projects WHERE id = $projectId AND user_id = $userId
   If no row returned, return 403 FORBIDDEN — not 404 (prevents enumeration).

3. System prompt injection surface: the `reasoning` string from routeTask
   must NOT be injected into the downstream model's system prompt. It is
   metadata only. Log it, surface it in response headers, never embed it
   in prompts sent to subsequent models.

4. Environment variable validation at startup: create src/lib/env.ts using
   the T3 env pattern (t3-oss/t3-env). All required vars are validated at
   build time. Missing vars = build failure, not silent placeholder fallback.

5. Content Security Policy: configure in next.config.ts headers() function.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE GENERATION BEHAVIOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When generating any file, Antigravity must:

  1. State which architectural layer the file belongs to
     (Route Handler | Service | Data | Store | Component | Utility | Test)

  2. List the files it depends on and verify they exist or will be created
     in the same session

  3. Confirm the file has no `any` types before completing

  4. If the file is a service, confirm it has a corresponding test stub

Do not generate:
  - Placeholder credentials or fallback strings for API keys
  - Auth bypass logic of any kind
  - `console.log` for user-facing errors (use logger.ts)
  - Direct AI SDK calls outside the service layer
```

---

# PART B — PRODUCT REQUIREMENTS DOCUMENT

---

## 1. Product Overview

Annie AI is a professional screenplay writing platform that orchestrates multiple large language models into a single, industry-standard creative workspace. Writers interact with one editor, one AI chat panel, and one set of keyboard shortcuts — while an intelligent routing layer transparently dispatches each request to the model best suited to the task.

The target user is a professional or serious aspiring scriptwriter who has heard of AI writing tools but finds single-model tools inadequate for the nuance of feature-length dramatic writing.

---

## 2. Problem Statement

Professional scriptwriters working with AI today face three failure modes: single-model tools produce homogeneous output that flattens the tension between dialogue quality and plot logic; general-purpose chat interfaces have no screenplay formatting awareness; and no existing tool addresses the WGA's emerging requirement for AI contribution transparency.

Annie AI solves all three.

---

## 3. Goals and Non-Goals

**Goals**

The platform ships a working screenplay editor with proper Courier Prime formatting, five screenplay node types with keyboard shortcut navigation, and a right-panel AI chat (Muse) that routes each message to the optimal model. The Story Bible ingests project metadata into Pinecone and retrieves relevant context on every Muse query. The WGA compliance system logs human and AI contributions and generates a downloadable report. Users authenticate via Supabase magic link and own their data behind row-level security.

**Non-Goals for V1**

Real-time collaborative editing, mobile application, direct Final Draft file import, payment processing, and team workspace management are deferred to V2. The credit system UI exists but is display-only in V1 — enforcement is a V2 billing feature.

---

## 4. User Stories

As a screenwriter, I want to write in properly formatted screenplay style without manually managing margins and capitalization, so that my output is industry-standard from keystroke one.

As a screenwriter, I want to ask my AI assistant about plot consistency and receive a response that has read my entire Story Bible, so that the AI never contradicts established facts I have already written.

As a professional writer concerned about WGA compliance, I want a report showing what percentage of my script was AI-generated and which models contributed, so that I can submit accurate disclosure documentation.

As a power user, I want to select a specific model for a specific task rather than always relying on auto-routing, so that I can override the system when I know what I need.

As any authenticated user, I want the system to reject my requests gracefully when AI services are degraded rather than hanging indefinitely, so that I am never trapped in a broken loading state.

---

## 5. Functional Requirements

### 5.1 Authentication

The login page presents a magic link email form. On submission, Supabase sends a one-time login link. OAuth via Google is rendered as a visible "coming soon" button. The login page has no bypass logic of any kind. Middleware protects all page routes and all API routes. Session expiry produces a user-visible notification and redirect to login, not a silent failure.

### 5.2 Project Management

A project is the top-level entity. It has a title, genre, logline, and character bios. Projects are created through the three-step ProjectWizard. On creation, the project metadata is ingested into Pinecone under the project's UUID namespace. Projects are stored in the Supabase `projects` table with RLS ensuring users can only access their own projects. The sidebar lists the user's projects from Supabase, not from local state.

### 5.3 Screenplay Editor

The editor is built on Tiptap with five custom node types: SceneHeading, Action, Character, Dialogue, Parenthetical. Keyboard shortcuts Cmd+1 through Cmd+5 set the current block type. The Enter key advances to the contextually appropriate next node type (SceneHeading → Action, Character → Dialogue, Dialogue → Character, Parenthetical → Dialogue). The Tab key on Character blocks sets Parenthetical.

Editor content is saved to the Supabase `scenes` table as structured rows, not as an HTML string. The autosave fires on a 2-second debounce after the last keystroke. A "Draft saved" indicator updates in the header on each successful save. On load, the editor reconstructs the document from the `scenes` rows by ordering on `order_index`.

Every scene modification dispatches a contribution event to the compliance logger with actor=human.

### 5.4 Muse AI Chat Panel

The right sidebar renders the Muse chat interface. On submit, the request goes to POST /api/v1/chat with the message history and the active projectId. The route runs routing and RAG retrieval in parallel. Routing selects the optimal model alias. RAG retrieves up to three Story Bible snippets. The system prompt is constructed from a template (model alias context + RAG snippets) and the stream begins.

The model used and routing latency are returned in response headers. The Muse panel renders a small attribution footer showing the model name and a brief routing reason after each response.

When the user selects a specific model in the dropdown, the route bypasses routeTask and calls the selected model directly. The UI clearly indicates when auto-routing is disabled.

Every AI response that results in content being inserted into the editor dispatches a contribution event with actor=ai and the model alias.

### 5.5 LLM Routing

The routing decision calls gpt-4o-mini via OpenRouter with a structured Zod schema requiring `{ model, reasoning, taskType }`. The routing prompt instructs the model to consider: Claude for emotional depth and nuanced dialogue, GPT for structural consistency and plot logic, Grok for wit and culturally current references, Gemini for massive lore cross-reference and world-building.

On any routing error, the fallback model is GPT. The fallback is logged as a warning event with the original error attached.

### 5.6 Story Bible RAG

On project creation, the project's title, genre, logline, and characters are embedded via text-embedding-3-small and upserted into Pinecone under the project's UUID as the namespace.

Writers can manually add Story Bible entries through a "Story Intel" panel that accepts free text. Each entry is chunked (max 512 tokens), embedded, and upserted.

On every Muse query, the three most similar Story Bible chunks are retrieved using the projectId as a namespace filter. If Pinecone is unreachable, the AI responds without context and the Muse panel shows a "Story Bible unavailable" indicator. This degradation is silent to the model — the system prompt simply omits the context block.

### 5.7 WGA Compliance

Every human edit and every AI generation emits a `ContributionEvent` processed by the compliance service. Events are written to the `contribution_logs` table.

The compliance panel (accessible from the sidebar) shows: total character count, human percentage, AI percentage, and a model breakdown chart. A "Generate Report" button calls POST /api/v1/compliance/report which queries the contribution_logs for the active project and returns a structured JSON summary. A "Download PDF" button triggers a client-side PDF render of this summary.

### 5.8 Version History

Every AI generation that modifies the editor creates a row in `scene_versions` capturing the scene ID, the content before the AI edit, the model used, and a timestamp. A "History" button in the editor header opens a drawer listing the last 20 AI edits with a one-click restore per entry.

---

## 6. Non-Functional Requirements

**Latency:** Time to first streaming token from message submit must be under 1.2 seconds at p50. This target is measured and logged on every request. If the measurement consistently exceeds this target in production, the routing model is swapped for a faster alternative.

**Availability:** All external dependencies (Pinecone, OpenRouter, Supabase) have defined degradation states. The application never shows a spinner indefinitely. All loading states have a 15-second timeout after which an error toast is shown and the operation is aborted.

**Security:** RLS enforces data isolation at the database layer. API-layer ownership validation is a second enforcement layer. Both are tested independently. No user can access, modify, or query another user's projects or Story Bible through any API surface.

**Scalability:** The architecture supports horizontal scaling without shared server-side state. Zustand stores are client-only. Rate limiting state is stored in Redis (Upstash), not in-process. Supabase handles connection pooling via PgBouncer.

---

## 7. Technical Architecture

### 7.1 Directory Structure

```
src/
  app/
    api/
      v1/
        chat/route.ts          ← Route Handler: auth + Zod + delegates to MuseService
        compliance/
          report/route.ts      ← Route Handler: generates WGA report
        projects/
          route.ts             ← CRUD for projects
          [id]/scenes/
            route.ts           ← CRUD for scenes
    login/page.tsx
    page.tsx
  components/
    editor/
      ScriptEditor.tsx
      extensions.ts
      EditorSerializer.ts      ← Converts Tiptap doc ↔ SceneRow[]
    layout/
      Muse.tsx
      Sidebar.tsx
    ui/
      ProjectWizard.tsx
      CompliancePanel.tsx
      VersionHistoryDrawer.tsx
      Toast.tsx
  services/
    MuseService.ts             ← Orchestration: route + RAG + stream
    RagService.ts              ← Pinecone ingest + query
    ComplianceService.ts       ← Event logging + report generation
    ProjectService.ts          ← Project CRUD + scene persistence
    __tests__/
      orchestrator.test.ts
      rag.test.ts
      compliance.test.ts
      auth.test.ts
  stores/
    projectStore.ts
    editorStore.ts
    museStore.ts
  lib/
    ai/
      orchestrator.ts          ← routeTask + MODELS registry
      prompts.ts               ← System prompt templates (pure functions)
    db/
      supabase.ts              ← Server client (cookies-based, SSR)
      supabaseClient.ts        ← Browser client (singleton)
      queries/
        projects.ts
        scenes.ts
        compliance.ts
    env.ts                     ← T3 env validation
    logger.ts                  ← Structured JSON logger
    auth.ts                    ← requireAuth(req) utility
    utils.ts                   ← cn(), formatDate()
    ui/
      toast.ts                 ← Sonner wrapper
  middleware.ts
```

### 7.2 Chat Route — Correct Implementation Pattern

The chat route is the most performance-critical path. The correct execution order:

1. Parse and validate request body through Zod schema
2. Call requireAuth(req) — throw 401 on failure
3. Validate project ownership — throw 403 on failure
4. Extract userQuery from last message
5. Execute routing and RAG in parallel via Promise.all
6. Count estimated tokens; truncate message history if needed
7. Construct system prompt from template (never inject routing.reasoning)
8. Call streamText with selected model
9. Log structured event with all timing metrics
10. Return streaming response with model and latency headers

### 7.3 Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        ← server-only, never NEXT_PUBLIC_

# AI
OPENROUTER_API_KEY=
OPENAI_API_KEY=                   ← for embeddings only

# Vector DB
PINECONE_API_KEY=
PINECONE_INDEX=story-bible

# Rate Limiting
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Observability
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

All variables validated at build time via src/lib/env.ts. Missing required variables fail the build with a descriptive error.

---

## 8. Testing Strategy

**Unit tests (Vitest):** All service layer functions with fully mocked external dependencies. Minimum four test files as specified in the Antigravity prompt. Tests run in under 5 seconds total.

**Integration tests:** Full chat pipeline test using MSW to intercept OpenRouter and Pinecone HTTP calls. Validates the complete request flow from authenticated API call to streamed response.

**End-to-end tests (Playwright):** Three critical user flows: sign in via magic link simulation → create project → receive Muse response. Each flow runs against a Vercel preview deployment in CI.

**CI gates (GitHub Actions):** All PRs must pass: `tsc --noEmit`, `eslint`, `vitest run`, and `playwright test`. No merge without green CI.

---

## 9. Deployment Strategy

Production and staging are separate Vercel projects with separate Supabase projects and separate Pinecone indexes. Environment variables are managed via Vercel environment variable groups — not entered manually per deployment.

Database migrations are managed via Supabase CLI with migration files version-controlled in `supabase/migrations/`. Migrations run as part of the deployment pipeline before the application code is deployed.

Custom domain, SSL, and Vercel Analytics are configured at launch. Sentry source map upload is integrated into the Vercel build step.

---

## 10. Architecture Decision Records

### ADR-001: OpenRouter over Direct API Calls

**Decision:** All model calls route through OpenRouter rather than individual provider SDKs.

**Rationale:** OpenRouter provides a single API key, unified billing, automatic fallback to equivalent models on provider outage, and access to all four target models (Claude, GPT, Grok, Gemini) without managing four separate API relationships. The tradeoff is an added network hop (approximately 20–50ms). This is acceptable given the latency budget is dominated by model inference time.

**Revisit trigger:** If OpenRouter introduces pricing that exceeds direct API cost by more than 15%, or if a specific provider offers capabilities unavailable through OpenRouter.

### ADR-002: Pinecone over Supabase pgvector

**Decision:** Pinecone is used for the Story Bible vector store rather than Supabase's native pgvector extension.

**Rationale:** The target use case involves 100-page screenplays ingested as hundreds of chunks per project. At this scale, pgvector performance is adequate but requires manual index tuning and lacks the namespace-based isolation that Pinecone provides natively. Pinecone's namespace feature maps cleanly to the projectId isolation requirement with zero additional query logic. The tradeoff is an additional external dependency.

**Revisit trigger:** If the project moves to a self-hosted or enterprise Supabase tier where pgvector performance is tunable, the dependency consolidation may be worth the migration effort.

### ADR-003: Structured Scene Rows over HTML String

**Decision:** Screenplay content is stored as typed scene rows in the `scenes` table, not as a serialized HTML string.

**Rationale:** An HTML string storage model forecloses version history, per-scene AI operations, word count analytics, collaborative editing, and structured export. These features are V2 requirements. Choosing the HTML model now would require a data migration at V2 with no user-visible benefit in V1. The structured model costs one EditorSerializer abstraction today but enables every important V2 feature without schema changes.

**Revisit trigger:** Never. This is the correct model.

---

## 11. V1 Launch Checklist

Before the first real user is given access, the following must be true:

- All API routes return 401 for unauthenticated requests (automated test confirms)
- RLS policies are active and tested on all four tables
- No `any` types exist (tsc --noEmit passes with strict: true)
- Rate limiting is active on /api/v1/chat
- Sentry is capturing errors in production
- The auth bypass in login/page.tsx is deleted
- The WGA compliance panel renders real data from contribution_logs
- The Muse model selector actually affects which model is called
- Environment variables are validated at build time
- CI pipeline passes on main branch

---

## 12. V2 Roadmap (Post-Launch)

**Real-time collaboration:** Scene-level operational transform using Supabase Realtime presence and broadcast channels. Each connected user holds a cursor position and color. Conflicts are resolved at the scene level (last-write-wins with version vector validation).

**Final Draft / Fountain export:** Implement the Fountain plain-text specification as an EditorSerializer export target. This requires no new data model — it is a serialization concern only.

**Billing and credit enforcement:** Stripe integration with usage-based pricing. Token consumption is already tracked per request via the compliance logger. The billing service reads this table to compute monthly usage and enforce plan limits.

**Team workspaces:** A `workspace_members` table with owner/editor/viewer roles. RLS policies updated to check workspace membership. The routing layer gains a workspace-level context that injects shared Style Guide entries into every Muse system prompt.

---

*Annie AI — Engineering Blueprint v1.0.0*  
*This document is the authoritative specification for the Annie AI V1 build.*  
*All Antigravity IDE sessions must conform to the constraints defined in Part A.*
