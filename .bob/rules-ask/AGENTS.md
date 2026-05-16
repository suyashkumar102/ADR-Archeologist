# AGENTS.md - Ask Mode

This file provides documentation context for agents in Ask mode.

## Non-Obvious Documentation Context

**Bob IDE vs Web Companion**: This project has TWO layers - Bob IDE (the primary AI product) and a Next.js web companion. Bob IDE has NO REST API - it's an IDE plugin only. The web companion uses watsonx.ai for server-side AI calls.

**Bob Configuration Files**: Files in `bob-config/` are reference documentation ONLY - Bob IDE has no file-based config system. These must be manually copied into Bob IDE settings UI (Settings → Modes/Skills/Commands).

**Pipeline Architecture**: The 4-stage pipeline runs identically in both Bob IDE and the web companion:
- Stage 1: Decision Discovery (identifies architectural decisions)
- Stage 2: Enrichment (infers rationale and alternatives)
- Stage 3: Archaeology (finds evidence of rejected alternatives)
- Stage 4: MADR Formatting (produces final ADR records)

**Type System**: `src/types.ts` is the single source of truth for ALL types - both frontend and backend import from here. Never duplicate these types elsewhere.

**DEMO_MODE**: When `DEMO_MODE=true`, the API bypasses the live watsonx.ai pipeline and returns pre-cached django/django output from `src/lib/demo/django-adrs.json` with simulated delays. Used for reliable demo recording.

**watsonx.ai Naming**: The `src/lib/watsonx/client.ts` exports `callWatsonx()` but it's imported as `callBob` in stage files - this is intentional aliasing because the web companion uses watsonx.ai (not Bob IDE which has no REST API).

**File Batching**: GitHub fetcher batches repository files at 80k tokens per chunk (`MAX_TOKENS_PER_CHUNK = 80_000`, `CHARS_PER_TOKEN = 4`) to fit within watsonx.ai context limits.

**SSE Streaming**: The `/api/analyze` endpoint uses Server-Sent Events (SSE) with specific format: `data: {json}\n\n` (double newline required for browser EventSource API compatibility).

**Environment Variables**: Three required vars: `WATSONX_API_KEY`, `WATSONX_PROJECT_ID`, `GITHUB_TOKEN`. Optional: `DEMO_MODE=true`.

**Bob Session Exports**: All Bob IDE session exports go in `bob_sessions/` directory at repo root for hackathon submission requirements.