# ANNIE AI - Creative Intelligence Orchestrator

**"One Workspace, Multiple Minds."**

Annie AI is a next-generation SaaS platform for scriptwriters that orchestrates multiple LLMs (Claude, GPT, Grok, Gemini) into a unified, industry-standard screenplay editor.

## Features

- **Brain Switching**: Automatically route tasks to the best model (Dialogue -> Claude, Logic -> GPT).
- **Screenplay Editor**: WYSIWYG editor with standard formatting (Courier Prime) using Tiptap.
- **Muse AI**: Integrated chat that holds context of your Story Bible.
- **WGA Compliance**: Tracks AI usage for transparency reports.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4.0
- **Validations**: Zod
- **Editor**: Tiptap (Headless)
- **AI**: Vercel AI SDK + OpenAI/Anthropic/Google Providers (via OpenRouter)
- **Database**: Supabase (Postgres)
- **Vector DB**: Pinecone (for Story Bible RAG)

## Setup & specific Environment Variables

1. **Clone the repo**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Environment Variables**:
   Create a `.env.local` file:
   ```env
   # Database (Supabase)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

   # AI Router (OpenRouter)
   OPENROUTER_API_KEY=your_openrouter_key

   # Vector DB (Pinecone)
   PINECONE_API_KEY=your_pinecone_key
   ```

## Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

The project is optimized for **Vercel**.

1. Push to GitHub.
2. Import project in Vercel.
3. Add the Environment Variables in Vercel Project Settings.
4. Deploy.

## V1 Testing Plan

- **Metric**: Context Accuracy > 95%.
- **Test**: Load a 100-page script into the Story Bible (Pinecone) and ask Muse about details on Page 5.
- **Latency**: Ensure "Brain Switching" happens in < 200ms.

---
© 2026 Annie AI Inc.
