# AGENTS.md - Advanced Mode

This file provides advanced mode guidance for agents working in this repository.

## Critical Advanced Patterns

**watsonx.ai Import Aliasing**: When importing from `src/lib/watsonx/client.ts`, the function is exported as `callWatsonx()` but imported as `callBob` in all stage files. This is intentional aliasing:
```typescript
import { callWatsonx as callBob, extractJSON } from "@/lib/watsonx/client"
```

**JSON Extraction Required**: Granite model wraps JSON in markdown code fences - always use `extractJSON()` helper before parsing:
```typescript
const { content } = await callBob([...])
const json = extractJSON(content)  // Strips ```json``` fences
const parsed = JSON.parse(json)
```

**Zod Validation with Retry**: Stage functions have built-in retry logic on schema validation failures - they re-prompt the AI with the error message. Don't add external retry wrappers.

**Type Centralization**: `src/types.ts` is the single source of truth - never duplicate type definitions elsewhere.

**API Route Runtime**: `/api/analyze/route.ts` MUST use `export const runtime = "nodejs"` - Edge runtime fails due to Buffer usage and process.env access.

**File Batching Strategy**: GitHub fetcher batches files at 80k tokens per chunk (`MAX_TOKENS_PER_CHUNK = 80_000`, `CHARS_PER_TOKEN = 4`) - don't modify without understanding watsonx.ai context limits.

**SSE Event Format**: API route uses specific SSE format: `data: {json}\n\n` (double newline required for browser EventSource API).

**IAM Token Caching**: watsonx.ai client caches IAM tokens with 5-minute safety buffer - don't implement separate token management.

**DEMO_MODE Bypass**: When `DEMO_MODE=true`, API route returns pre-cached django/django output from `src/lib/demo/django-adrs.json` with simulated delays.

**Bob IDE Configuration**: Files in `bob-config/` are reference documentation only - Bob IDE has no file-based config system. These must be manually copied into Bob IDE settings UI.

## MCP and Browser Tools

Advanced mode has access to MCP servers and browser tools for enhanced capabilities beyond standard code editing.