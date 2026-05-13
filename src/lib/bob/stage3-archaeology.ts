import { z } from "zod"
import { callBob, extractJSON } from "./client"
import type { Stage2Output, Stage3Output, RepoContext } from "@/types"

// ─── Zod Schema ──────────────────────────────────────────────────────────────

const Stage3Schema = z.object({
  archaeologyFindings: z.array(
    z.object({
      decisionTitle: z.string(),
      findings: z.array(
        z.object({
          type: z.enum([
            "deleted-file",
            "commented-code",
            "migration",
            "naming-pattern",
            "todo-comment",
          ]),
          description: z.string(),
          filePath: z.string().optional(),
          snippet: z.string().optional(),
        })
      ),
    })
  ),
})

// ─── System Prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert software archaeologist. Your job is to find evidence of the road not taken — traces of architectural alternatives that were considered and rejected.

You have been given:
1. A list of enriched architectural decisions
2. The complete file list of the repository

Your task: For each decision, scan the file list and any available code context for evidence that an alternative approach was once considered or partially implemented.

Look for these specific types of evidence:

- **deleted-file**: File paths that suggest a prior implementation was removed (e.g. "db_sessions.py" in a codebase that now uses Redis sessions, migration files showing a schema that was later dropped)
- **commented-code**: References to commented-out imports, disabled configurations, or code blocks that suggest a prior approach
- **migration**: Database migration files that show a schema evolution (e.g. a migration that drops a table that would have been used by an alternative approach)
- **naming-pattern**: File or variable names that suggest a rename/refactor from a prior approach (e.g. "legacy_", "old_", "_v1", "_deprecated")
- **todo-comment**: TODO, FIXME, HACK, or NOTE comments that reference a prior approach or a known limitation of the current choice

For each finding:
- Specify which decision it relates to (use the exact decision title)
- Describe what the evidence suggests about the rejected alternative
- Include the file path if relevant
- Include a short code snippet if it makes the finding clearer (max 3 lines)

Only report findings where you have genuine evidence. Do not speculate without a specific file or pattern to point to.

Output ONLY valid JSON matching this schema:
{
  "archaeologyFindings": [
    {
      "decisionTitle": "string (must match an input decision title exactly)",
      "findings": [
        {
          "type": "deleted-file" | "commented-code" | "migration" | "naming-pattern" | "todo-comment",
          "description": "string",
          "filePath": "string (optional)",
          "snippet": "string (optional, max 3 lines)"
        }
      ]
    }
  ]
}

Decisions with no findings should be omitted from the output entirely.
Do not include explanations or any text outside the JSON object.`

// ─── Runner ──────────────────────────────────────────────────────────────────

export async function runStage3(
  stage2Output: Stage2Output,
  repoContext: RepoContext,
  attempt = 0
): Promise<{ output: Stage3Output; tokensUsed: number }> {
  const userMessage = `Perform archaeological analysis on the following decisions.

Decisions:
${JSON.stringify(stage2Output.enrichedDecisions.map((d) => ({ title: d.title, decision: d.decision })), null, 2)}

Complete file list (${repoContext.fileList.length} files):
${repoContext.fileList.join("\n")}

Repository context (first chunk for pattern scanning):
${repoContext.chunks[0] ?? ""}

Find evidence of rejected alternatives. Output JSON only.`

  const { content, tokensUsed } = await callBob([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMessage },
  ])

  const json = extractJSON(content)

  try {
    const parsed = JSON.parse(json)
    const validated = Stage3Schema.parse(parsed)
    return { output: validated, tokensUsed }
  } catch (err) {
    if (attempt >= 2) {
      throw new Error(`Stage 3 schema validation failed after 2 retries: ${String(err)}`)
    }

    console.warn(`[stage3] Schema validation failed (attempt ${attempt + 1}). Retrying...`)
    const { content: retryContent, tokensUsed: retryTokens } = await callBob([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
      { role: "assistant", content },
      {
        role: "user",
        content: `Your previous response did not match the required JSON schema. Error: ${String(err)}

Return ONLY valid JSON with an "archaeologyFindings" array. Each entry needs decisionTitle and findings array.

Previous response:
${content}`,
      },
    ])

    const retryJson = extractJSON(retryContent)
    const retryParsed = JSON.parse(retryJson)
    const retryValidated = Stage3Schema.parse(retryParsed)

    return {
      output: retryValidated,
      tokensUsed: tokensUsed + retryTokens,
    }
  }
}
