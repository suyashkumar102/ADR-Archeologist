# AGENTS.md - Code Mode

This file provides coding-specific guidance for agents working in this repository.

## Critical Coding Patterns

**watsonx.ai Import Aliasing**: When importing from `src/lib/watsonx/client.ts`, the function is exported as `callWatsonx()` but imported as `callBob` in all stage files (`stage1-discover.ts`, `stage2-enrich.ts`, etc.). This is intentional - maintain this aliasing pattern:
```typescript
import { callWatsonx as callBob, extractJSON } from "@/lib/watsonx/client"
```

**JSON Extraction Pattern**: ALWAYS use `extractJSON()` before parsing AI responses. Granite wraps JSON in markdown fences:
```typescript
const { content } = await callBob([...])
const json = extractJSON(content)  // Required - strips ```json``` fences
const parsed = JSON.parse(json)
```

**Zod Validation with Retry**: Stage functions have built-in retry on validation failure. Pattern:
```typescript
try {
  const validated = Schema.parse(parsed)
  return { output: validated, tokensUsed }
} catch (err) {
  if (attempt >= 2) throw new Error(...)
  // Re-prompt with error message
  const { content: retryContent } = await callBob([
    ...originalMessages,
    { role: "assistant", content },
    { role: "user", content: `Error: ${err}. Return valid JSON...` }
  ])
}
```

**Type Import Rule**: NEVER duplicate types. Always import from `src/types.ts`:
```typescript
import type { ADR, ADRPackage, RepoContext } from "@/types"
```

**API Route Runtime**: `/api/analyze/route.ts` MUST export `runtime = "nodejs"` - Edge runtime fails on Buffer and process.env usage.

**SSE Event Encoding**: Use exact format with double newline:
```typescript
function encodeEvent(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`  // Double \n required
}
```

**File Batching Constants**: Don't modify without understanding context limits:
```typescript
const MAX_TOKENS_PER_CHUNK = 80_000
const CHARS_PER_TOKEN = 4
```

**IAM Token Caching**: watsonx.ai client handles token refresh automatically with 5-minute buffer - don't add external token management.