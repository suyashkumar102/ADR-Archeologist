import { callGroqJSON } from "../groq"
import { Stage1Schema, type Stage1Output } from "../schemas"
import type { RepoContext, RepoFile } from "@/types"

// ─── System Prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an architectural pattern analyst with access to a complete software repository.
Your task: identify every code pattern that represents a deliberate architectural DECISION.
Focus on DECISIONS — what choices the code implies, not what the code does.

Decision categories:

infrastructure: database choice, caching layer, message queue, storage backend
structure: monolith vs modules, service boundaries, folder organisation
communication: REST vs events vs RPC vs GraphQL
data: ORM vs raw SQL, migration strategy, data model patterns
auth: session strategy, token format, OAuth vs internal auth
error_handling: exception philosophy, retry patterns, circuit breakers
testing: unit vs integration bias, test doubles strategy, coverage approach

For each decision:

Name it precisely using imperative: 'Use Redis for session storage'
Cite the specific files and line ranges that REVEAL the decision
Explain what each file signals — why it is evidence of this decision
Assign confidence 0-100 based on how unambiguous the evidence is

Return a single JSON object with EXACTLY this shape:
{
  "decisions": [
    {
      "id": "decision-001",
      "category": "infrastructure | structure | communication | data | auth | error_handling | testing | other",
      "title": "Use X for Y",
      "evidence": [
        { "file": "path/from/provided/files.py", "lines": "10-25", "signal": "what this code reveals about the decision" }
      ],
      "confidence": 85
    }
  ],
  "totalFound": 1
}

Rules:
- "id" MUST be sequential: "decision-001", "decision-002", ...
- "category" MUST be exactly one of the listed enum values (no other strings)
- "confidence" is an integer 0-100
- "evidence[].file" MUST be a path from the provided files
- "totalFound" MUST equal the number of items in "decisions"
No markdown. No prose. No explanation.`

// ─── Helper: Build File Context ─────────────────────────────────────────────

export function buildFileContext(files: RepoFile[]): string {
  // Extreme reduction: 500 chars per file for Groq free tier
  // 20 files × 500 chars = 10k chars ≈ 2.5k tokens (leaves 9.5k for prompts/response)
  return files
    .map((file) => `### ${file.path}\n\n${file.content.slice(0, 500)}\n\n`)
    .join("")
}

// ─── Stage 1 Runner ──────────────────────────────────────────────────────────

export async function runStage1(
  repoContext: RepoContext,
  focusAreas?: string[]
): Promise<Stage1Output> {
  const fileContext = buildFileContext(repoContext.files)
  
  let userContent = `Repository: ${repoContext.owner}/${repoContext.repo} (${repoContext.fileCount} files, language: ${repoContext.primaryLanguage})

Files:
${fileContext}`

  if (focusAreas && focusAreas.length > 0) {
    userContent += `\n\nPrioritise these categories: ${focusAreas.join(", ")}`
  }

  const { output } = await callGroqJSON(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent }
    ],
    Stage1Schema
  )

  return output
}

// Made with Bob
