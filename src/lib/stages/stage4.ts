import { callGroqJSON } from "../groq"
import { Stage4Schema, type Stage4Output, type Stage1Output, type Stage2Output, type Stage3Output } from "../schemas"
import type { ADR, RepoContext } from "@/types"
import { toMADR, toFilename } from "@/lib/export/madr"

// ─── System Prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an ADR writer generating Architecture Decision Records.

You receive:
- Stage 1: detected decisions with evidence
- Stage 2: context and constraints for each decision
- Stage 3: rejected alternatives found via archaeology

For each decision, write a complete ADR. Match decisions across stages using decisionId.

STATUS INFERENCE:
- 'accepted': pattern actively used, no migration away found
- 'deprecated': migration files or comments show movement away from this pattern
- 'superseded': a newer pattern in the same category exists and the old one is fading

DATE INFERENCE:
- Estimate from age of oldest file implementing this pattern
- Format: '~2019', '~2015', 'early project (~2012)'

TITLE: Always imperative — 'Use X for Y', 'Adopt X pattern for Y'

Return a single JSON object with EXACTLY this shape:
{
  "adrs": [
    {
      "id": "ADR-001",
      "title": "Use X for Y",
      "status": "accepted | deprecated | superseded",
      "inferredDate": "~2019",
      "category": "the decision's category",
      "confidence": 85,
      "context": "One or two paragraphs of the problem and constraints",
      "decision": "One or two paragraphs describing the chosen approach",
      "consequences": { "positive": ["..."], "negative": ["..."] },
      "alternatives": [ { "option": "Alternative considered", "reason": "Why it was not chosen" } ],
      "archaeology": [ { "option": "Rejected alternative", "evidenceFile": "path", "evidenceType": "commented_out | migration_artifact | dead_utility | dead_import | removed_test | todo_comment", "rejectionReason": "Why abandoned" } ],
      "evidenceFiles": ["path/from/provided/files.py"]
    }
  ]
}

Rules:
- "id" MUST be sequential: "ADR-001", "ADR-002", ...
- "status" and "archaeology[].evidenceType" MUST be exactly one of the listed enum values
- "confidence" is an integer 0-100
- "archaeology" MUST be null when there is no archaeology evidence for that decision
- Do NOT include any markdown — only the JSON object
No prose. No explanation.`

// ─── Stage 4 Runner ──────────────────────────────────────────────────────────

export async function runStage4(
  stage1: Stage1Output,
  stage2: Stage2Output,
  stage3: Stage3Output,
  repoContext: RepoContext
): Promise<Stage4Output> {
  const userContent = `Repository: ${repoContext.owner}/${repoContext.repo}

Stage 1 Output (Detected Decisions):
${JSON.stringify(stage1, null, 2)}

Stage 2 Output (Context & Constraints):
${JSON.stringify(stage2, null, 2)}

Stage 3 Output (Archaeology Findings):
${JSON.stringify(stage3, null, 2)}

Generate complete MADR-format ADR documents for all decisions. Match each decision across stages using decisionId.`

  const { output } = await callGroqJSON(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent }
    ],
    Stage4Schema
  )

  // The model is no longer asked to produce filename/markdownContent —
  // generate them deterministically so MADR output is always consistent.
  const adrs = output.adrs.map((adr) => {
    const withFilename = { ...adr, filename: toFilename(adr as ADR) }
    return { ...withFilename, markdownContent: toMADR(withFilename as ADR) }
  })

  return { adrs }
}

// Made with Bob