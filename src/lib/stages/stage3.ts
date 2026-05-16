import { callGroqJSON } from "../groq"
import { Stage3Schema, type Stage3Output, type Stage1Output } from "../schemas"
import type { RepoContext } from "@/types"
import { buildFileContext } from "./stage1"

// ─── System Prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a code archaeologist searching for abandoned implementation attempts.

Architectural decisions leave traces of rejected alternatives:
- Commented-out code blocks implementing a different approach
  Look for: multi-line comments wrapping functions/classes, '# Old approach:', '// Previous implementation:', '/* Deprecated:'
- Migration files showing previous state (database migrations with reversed operations, rollback scripts)
- Dead utility functions: defined but called by NOTHING in the codebase
- Dead imports: imported at top of file but never referenced in the file body
- Removed tests: test files for features that no longer exist in production code
- TODO/FIXME comments: 'TODO: migrate from X to Y', 'FIXME: replace with new approach'

For EACH provided decision, search the complete repository for this archaeological evidence.

CRITICAL RULES:
- Only report evidence that GENUINELY EXISTS in the provided files
- Do NOT fabricate or invent evidence
- If no archaeology exists for a decision, return empty rejected array: {"alternatives": [{"decisionId": "...", "rejected": []}]}
- Quote actual code snippets as evidence
- The snippet field must be 1-3 actual lines from the file

Return ONLY valid JSON matching this exact schema:
{
  "alternatives": [
    {
      "decisionId": "decision-001",
      "rejected": [
        {
          "option": "Description of rejected alternative",
          "evidence": {
            "file": "path/to/file.py",
            "type": "commented_out",
            "snippet": "# Old implementation\\ndef old_function():\\n    pass"
          },
          "rejectionReason": "Why this approach was abandoned"
        }
      ]
    }
  ]
}

If no evidence found, return: {"alternatives": [{"decisionId": "decision-001", "rejected": []}]}`

// ─── Stage 3 Runner ──────────────────────────────────────────────────────────

export async function runStage3(
  stage1: Stage1Output,
  repoContext: RepoContext
): Promise<Stage3Output> {
  const fileContext = buildFileContext(repoContext.files)
  const decisions = stage1.decisions

  if (decisions.length === 0) {
    return { alternatives: [] }
  }

  // ONE batched call for all decisions. The previous design made a separate
  // Groq call per decision, each re-sending the full file context — on the
  // free tier ~7 decisions burned ~85K of the 100K/day token budget. Batching
  // sends the file context once and cuts Stage 3 token usage ~Nx.
  const decisionList = decisions
    .map((d) => `- ${d.id}: ${d.title}`)
    .join("\n")

  const userContent = `Repository: ${repoContext.owner}/${repoContext.repo}

Decisions to analyze (return ONE "alternatives" entry per decisionId):
${decisionList}

Repository files:
${fileContext}

For EACH decision above, search for archaeological evidence of rejected
alternatives. Return a JSON object with an "alternatives" array containing
exactly one entry per decisionId (use the exact decisionId values listed).`

  let alternatives: Stage3Output["alternatives"] = []
  try {
    const { output } = await callGroqJSON(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent }
      ],
      Stage3Schema
    )
    alternatives = output.alternatives
  } catch (err) {
    // Stage 3 is best-effort — never crash the pipeline over archaeology.
    console.warn(`[Stage 3] Archaeology search failed, continuing without it:`, err)
  }

  // Guarantee exactly one entry per decision, matched by decisionId, so
  // Stage 4 can rely on alignment regardless of what the model returned.
  const byId = new Map(alternatives.map((a) => [a.decisionId, a]))
  return {
    alternatives: decisions.map((d) => ({
      decisionId: d.id,
      rejected: byId.get(d.id)?.rejected ?? [],
    })),
  }
}