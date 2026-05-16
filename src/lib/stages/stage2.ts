import { callGroqJSON } from "../groq"
import { Stage2Schema, type Stage2Output, type Stage1Output } from "../schemas"
import type { RepoContext } from "@/types"
import { buildFileContext } from "./stage1"

// ─── System Prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an architectural historian reconstructing the reasoning behind software decisions.

For each decision provided, infer:

1. PROBLEM — The specific technical problem this decision was solving.
   Write it as the engineer who felt the pain would write it. Concrete and specific.
   GOOD: 'Database reads on every authenticated request were creating 40ms latency at ~400 req/s'
   BAD: 'Performance was a concern'

2. CONSTRAINTS — What constraints drove this specific choice over alternatives.
   Scale signals: request volume patterns in configs/tests
   Consistency requirements: transaction patterns, data integrity code
   Simplicity preference: abstraction count, code complexity signals
   Team size: commit author breadth, documentation density

3. TIMING — When in project lifecycle: early (simple code, fast growth), growth (scaling code added), mature (refactoring, migration patterns)

Return a single JSON object with EXACTLY this shape:
{
  "contexts": [
    {
      "decisionId": "decision-001",
      "problem": "Concrete, specific problem statement",
      "constraints": [
        { "type": "performance | scale | consistency | simplicity | team_size | cost", "evidence": "what in the code signals this constraint" }
      ],
      "timing": "early | growth | mature",
      "confidence": 80
    }
  ]
}

Rules:
- "decisionId" MUST match an "id" from the provided decisions, one context per decision
- "constraints[].type" and "timing" MUST be exactly one of the listed enum values
- "confidence" is an integer 0-100
No markdown. No prose. No explanation.`

// ─── Stage 2 Runner ──────────────────────────────────────────────────────────

export async function runStage2(
  stage1: Stage1Output,
  repoContext: RepoContext
): Promise<Stage2Output> {
  const fileContext = buildFileContext(repoContext.files)
  
  const userContent = `Repository: ${repoContext.owner}/${repoContext.repo}

Decisions to analyse:
${JSON.stringify(stage1.decisions, null, 2)}

Repository files:
${fileContext}`

  const { output } = await callGroqJSON(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent }
    ],
    Stage2Schema
  )

  return output
}

// Made with Bob