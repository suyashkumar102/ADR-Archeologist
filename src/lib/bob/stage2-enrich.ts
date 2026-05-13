import { z } from "zod"
import { callBob, extractJSON } from "./client"
import type { Stage1Output, Stage2Output } from "@/types"

// ─── Zod Schema ──────────────────────────────────────────────────────────────

const Stage2Schema = z.object({
  enrichedDecisions: z.array(
    z.object({
      title: z.string(),
      context: z.string(),
      decision: z.string(),
      rationale: z.string(),
      alternativesConsidered: z.array(z.string()),
      consequences: z.string(),
      decisionDate: z.string().optional(),
    })
  ),
})

// ─── System Prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert software architect performing deep intent inference on architectural decisions.

You have been given a list of architectural decisions identified in a codebase, along with commit history showing when key files were first introduced.

Your task: For each decision, reason about the WHY — not what the code does, but why this choice was made over alternatives.

For each decision, produce:

1. **context**: What problem was the team facing that led to this decision? What was the situation? Write 2-4 sentences of professional prose.

2. **decision**: State the decision clearly and specifically. What exactly was chosen? Write 1-2 sentences.

3. **rationale**: Why was this choice made? What factors drove it? What would have been worse about the alternatives? This must be substantive — not "it was a good choice" but specific technical reasoning. Write 3-5 sentences.

4. **alternativesConsidered**: List 2-4 specific alternatives that were likely evaluated. Each should be a concrete technology or approach (e.g. "Database-backed sessions using Django's default session backend", not just "other options").

5. **consequences**: What does this decision enable? What does it constrain? What are the tradeoffs the team accepted? Write 2-4 sentences.

6. **decisionDate**: If commit history is provided for this decision's evidence files, use the earliest date as an ISO date string (YYYY-MM-DD). Omit if no date is available.

Output ONLY valid JSON matching this schema:
{
  "enrichedDecisions": [
    {
      "title": "string (must match the input decision title exactly)",
      "context": "string",
      "decision": "string",
      "rationale": "string",
      "alternativesConsidered": ["string", ...],
      "consequences": "string",
      "decisionDate": "YYYY-MM-DD" (optional)
    }
  ]
}

Do not include explanations, markdown formatting, or any text outside the JSON object.
Write in professional technical prose. Do not use bullet points inside string fields.`

// ─── Runner ──────────────────────────────────────────────────────────────────

export async function runStage2(
  stage1Output: Stage1Output,
  commitHistory: Record<string, string>,
  attempt = 0
): Promise<{ output: Stage2Output; tokensUsed: number }> {
  // Build commit history context for each decision
  const decisionsWithDates = stage1Output.decisions.map((d) => {
    const dates = d.evidenceFiles
      .map((f) => commitHistory[f])
      .filter(Boolean)
      .sort()
    return {
      ...d,
      earliestCommitDate: dates[0] ?? null,
    }
  })

  const userMessage = `Enrich the following architectural decisions with context, rationale, alternatives, and consequences.

Decisions to enrich:
${JSON.stringify(decisionsWithDates, null, 2)}

For each decision, use the "earliestCommitDate" field (if present) as the decisionDate.
Output JSON only.`

  const { content, tokensUsed } = await callBob([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMessage },
  ])

  const json = extractJSON(content)

  try {
    const parsed = JSON.parse(json)
    const validated = Stage2Schema.parse(parsed)
    return { output: validated, tokensUsed }
  } catch (err) {
    if (attempt >= 2) {
      throw new Error(`Stage 2 schema validation failed after 2 retries: ${String(err)}`)
    }

    console.warn(`[stage2] Schema validation failed (attempt ${attempt + 1}). Retrying...`)
    const { content: retryContent, tokensUsed: retryTokens } = await callBob([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
      { role: "assistant", content },
      {
        role: "user",
        content: `Your previous response did not match the required JSON schema. Error: ${String(err)}

Return ONLY valid JSON. Every enrichedDecision must have: title, context, decision, rationale, alternativesConsidered (array), consequences. decisionDate is optional.

Previous response:
${content}`,
      },
    ])

    const retryJson = extractJSON(retryContent)
    const retryParsed = JSON.parse(retryJson)
    const retryValidated = Stage2Schema.parse(retryParsed)

    return {
      output: retryValidated,
      tokensUsed: tokensUsed + retryTokens,
    }
  }
}
