# AGENTS.md - Plan Mode

This file provides architectural context for agents in Plan mode.

## Non-Obvious Architectural Patterns

**Dual-Layer Architecture**: This project has TWO distinct layers that work together:
1. **Bob IDE** (primary AI product) - IDE plugin with full repo context, custom mode/skill/command
2. **Next.js web companion** - Accepts GitHub URLs, uses watsonx.ai for server-side AI calls

Bob IDE has NO REST API - it's an IDE plugin only. The web companion replicates the same 4-stage pipeline using watsonx.ai Granite model.

**Pipeline Flow**: Both layers run identical 4-stage pipeline:
```
Stage 1: Decision Discovery → identifies architectural decisions from code patterns
Stage 2: Enrichment → infers rationale, alternatives, consequences
Stage 3: Archaeology → finds evidence of rejected alternatives in code
Stage 4: MADR Formatting → produces final ADR records
```

**Type System Architecture**: `src/types.ts` is the single source of truth - both frontend and backend import from here. Comment at top enforces: "Never duplicate these types."

**API Route Constraints**: `/api/analyze/route.ts` MUST use Node.js runtime (`export const runtime = "nodejs"`) - Edge runtime fails due to:
- Buffer usage in GitHub fetcher (base64 decode)
- process.env access for credentials

**Token Management**: watsonx.ai client (`src/lib/watsonx/client.ts`) caches IAM tokens with 5-minute safety buffer to avoid re-authentication overhead. Token refresh is automatic.

**File Batching Strategy**: GitHub fetcher batches repository files at 80k tokens per chunk to fit watsonx.ai context limits:
- `MAX_TOKENS_PER_CHUNK = 80_000`
- `CHARS_PER_TOKEN = 4`
- Files are concatenated with `=== FILE: {path} ===` separators

**Zod Validation with Retry**: All stage functions have built-in retry logic - if Zod validation fails, they re-prompt the AI with the error message (max 2 retries). Don't add external retry wrappers.

**SSE Streaming Pattern**: API uses Server-Sent Events with specific format: `data: {json}\n\n` (double newline required for browser EventSource API).

**DEMO_MODE Architecture**: When `DEMO_MODE=true`, API bypasses live watsonx.ai pipeline and returns pre-cached django/django output from `src/lib/demo/django-adrs.json` with simulated stage delays. Used for reliable demo recording.

**Bob Configuration**: Files in `bob-config/` are reference documentation only - Bob IDE has no file-based config system. These must be manually copied into Bob IDE settings UI.