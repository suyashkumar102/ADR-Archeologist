import { z } from "zod"
import { callBob, extractJSON } from "./client"
import type { RepoContext, Stage1Output } from "@/types"

// ─── Zod Schema ──────────────────────────────────────────────────────────────

const Stage1Schema = z.object({
  decisions: z.array(
    z.object({
      title: z.string(),
      category: z.enum([
        "database",
        "auth",
        "caching",
        "infrastructure",
        "patterns",
        "api-design",
        "other",
      ]),
      confidence: z.number().min(0).max(1),
      evidenceFiles: z.array(z.string()),
      summary: z.string().max(300),
    })
  ),
})

// ─── System Prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert software architect analyzing a complete codebase to identify architectural decisions.

Your task: Read the full repository context and identify every major architectural decision that was made — not what the code does, but WHY it was built this way.

Examples of architectural decisions:
- "Use Redis for session storage instead of database sessions"
- "Adopt Django ORM over raw SQL queries"
- "Implement JWT-based authentication"
- "Use a monolithic architecture instead of microservices"
- "Store uploaded files in S3 instead of local filesystem"

NOT architectural decisions:
- "The User model has a username field" (this is a code description)
- "The API returns JSON" (too generic)
- "There are unit tests" (not a decision about architecture)

For each decision you identify:
1. Give it a clear, specific title
2. Assign a category: database, auth, caching, infrastructure, patterns, api-design, or other
3. Assign a confidence score (0–1) based on how clear the evidence is
4. List the file paths that evidence this decision
5. Write a 1-2 sentence summary of what the decision is

Output ONLY valid JSON matching this schema:
{
  "decisions": [
    {
      "title": "string",
      "category": "database" | "auth" | "caching" | "infrastructure" | "patterns" | "api-design" | "other",
      "confidence": 0.0 to 1.0,
      "evidenceFiles": ["path/to/file.py", ...],
      "summary": "string"
    }
  ]
}

Do not include explanations, markdown formatting, or any text outside the JSON object.`

// ─── Runner ──────────────────────────────────────────────────────────────────

export async function runStage1(
  repoContext: RepoContext,
  attempt = 0
): Promise<{ output: Stage1Output; tokensUsed: number }> {
  const userMessage = `Repository: ${repoContext.repoUrl}

${repoContext.chunks.join("\n\n---\n\n")}

Identify all major architectural decisions in this codebase. Output JSON only.`

  const { content, tokensUsed } = await callBob([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMessage },
  ])

  const json = extractJSON(content)

  try {
    const parsed = JSON.parse(json)
    const validated = Stage1Schema.parse(parsed)
    return { output: validated, tokensUsed }
  } catch (err) {
    if (attempt >= 2) {
      throw new Error(`Stage 1 schema validation failed after 2 retries: ${String(err)}`)
    }

    // Retry with corrective prompt
    console.warn(`[stage1] Schema validation failed (attempt ${attempt + 1}). Retrying...`)
    const { content: retryContent, tokensUsed: retryTokens } = await callBob([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
      { role: "assistant", content },
      {
        role: "user",
        content: `Your previous response did not match the required JSON schema. Error: ${String(err)}

Return ONLY valid JSON matching this exact schema:
${JSON.stringify(Stage1Schema.shape, null, 2)}

Previous response:
${content}`,
      },
    ])

    const retryJson = extractJSON(retryContent)
    const retryParsed = JSON.parse(retryJson)
    const retryValidated = Stage1Schema.parse(retryParsed)

    return {
      output: retryValidated,
      tokensUsed: tokensUsed + retryTokens,
    }
  }
}
