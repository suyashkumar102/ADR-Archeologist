import { z } from "zod"
import { callBob, extractJSON } from "./client"
import type { Stage2Output, Stage3Output, Stage4Output } from "@/types"
import { parseRepoUrl } from "@/lib/github/fetcher"

// ─── Zod Schema ──────────────────────────────────────────────────────────────

const Stage4Schema = z.object({
  adrs: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      status: z.enum(["accepted", "deprecated", "superseded"]),
      category: z.string(),
      confidence: z.number().min(0).max(1),
      context: z.string(),
      decision: z.string(),
      consequences: z.string(),
      alternativesConsidered: z.array(z.string()),
      evidenceFiles: z.array(
        z.object({
          path: z.string(),
          githubUrl: z.string(),
          snippet: z.string().optional(),
        })
      ),
      archaeologyEvidence: z.array(
        z.object({
          type: z.string(),
          description: z.string(),
          filePath: z.string().optional(),
          snippet: z.string().optional(),
        })
      ),
      decisionDate: z.string().optional(),
    })
  ),
})

// ─── System Prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are producing final Architecture Decision Records (ADRs) in MADR format.

You have been given enriched decision data and archaeology findings. Your task is to merge this data into clean, professional ADR records.

Rules:
1. Each ADR gets a sequential ID: ADR-001, ADR-002, etc.
2. Status is "accepted" for all current decisions unless the evidence clearly shows it was superseded or deprecated.
3. All text fields (context, decision, consequences) must be complete sentences in professional prose. No bullet points inside these fields.
4. alternativesConsidered is an array of strings — each string is a specific technology or approach name.
5. evidenceFiles must include the full GitHub URL for each file: https://github.com/{owner}/{repo}/blob/main/{path}
6. archaeologyEvidence comes directly from the archaeology findings for this decision. If there are no findings, use an empty array.
7. confidence comes from the Stage 1 discovery confidence score.

Output ONLY valid JSON matching this schema:
{
  "adrs": [
    {
      "id": "ADR-001",
      "title": "string",
      "status": "accepted" | "deprecated" | "superseded",
      "category": "string",
      "confidence": 0.0 to 1.0,
      "context": "string (prose)",
      "decision": "string (prose)",
      "consequences": "string (prose)",
      "alternativesConsidered": ["string", ...],
      "evidenceFiles": [{ "path": "string", "githubUrl": "string", "snippet": "string (optional)" }],
      "archaeologyEvidence": [{ "type": "string", "description": "string", "filePath": "string (optional)", "snippet": "string (optional)" }],
      "decisionDate": "YYYY-MM-DD (optional)"
    }
  ]
}

Do not include explanations or any text outside the JSON object.`

// ─── Merge helper ────────────────────────────────────────────────────────────

// ─── Runner ──────────────────────────────────────────────────────────────────

export async function runStage4(
  stage2Output: Stage2Output,
  stage3Output: Stage3Output,
  repoUrl: string,
  stage1Decisions: Array<{ title: string; category: string; confidence: number; evidenceFiles: string[] }>,
  attempt = 0
): Promise<{ output: Stage4Output; tokensUsed: number }> {
  const { owner, repo } = parseRepoUrl(repoUrl)

  // Build merged input for Bob
  const mergedDecisions = stage2Output.enrichedDecisions.map((enriched, idx) => {
    const stage1 = stage1Decisions.find((d) => d.title === enriched.title) ?? stage1Decisions[idx]
    const archaeology = stage3Output.archaeologyFindings.find(
      (f) => f.decisionTitle === enriched.title
    )

    return {
      ...enriched,
      category: stage1?.category ?? "other",
      confidence: stage1?.confidence ?? 0.7,
      evidenceFilePaths: stage1?.evidenceFiles ?? [],
      archaeologyFindings: archaeology?.findings ?? [],
      owner,
      repo,
    }
  })

  const userMessage = `Produce final MADR-format ADR records for the following decisions.

Repository: ${repoUrl} (owner: ${owner}, repo: ${repo})

Decisions with enrichment and archaeology data:
${JSON.stringify(mergedDecisions, null, 2)}

For evidenceFiles, construct the githubUrl as: https://github.com/${owner}/${repo}/blob/main/{path}

Output JSON only.`

  const { content, tokensUsed } = await callBob([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMessage },
  ])

  const json = extractJSON(content)

  try {
    const parsed = JSON.parse(json)
    const validated = Stage4Schema.parse(parsed)
    return { output: validated as Stage4Output, tokensUsed }
  } catch (err) {
    if (attempt >= 2) {
      throw new Error(`Stage 4 schema validation failed after 2 retries: ${String(err)}`)
    }

    console.warn(`[stage4] Schema validation failed (attempt ${attempt + 1}). Retrying...`)
    const { content: retryContent, tokensUsed: retryTokens } = await callBob([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
      { role: "assistant", content },
      {
        role: "user",
        content: `Your previous response did not match the required JSON schema. Error: ${String(err)}

Return ONLY valid JSON with an "adrs" array. Every ADR must have all required fields.

Previous response:
${content}`,
      },
    ])

    const retryJson = extractJSON(retryContent)
    const retryParsed = JSON.parse(retryJson)
    const retryValidated = Stage4Schema.parse(retryParsed)

    return {
      output: retryValidated as Stage4Output,
      tokensUsed: tokensUsed + retryTokens,
    }
  }
}
