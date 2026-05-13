// ─── IBM Bob API client ──────────────────────────────────────────────────────
// Wraps the Bob API with retry, timeout, and exponential backoff.

// process.env is available at runtime in Next.js Node runtime.
// Declared here to satisfy TypeScript before node_modules are installed.
declare const process: { env: Record<string, string | undefined> }

const BOB_API_URL = "https://api.ibm.com/bob/v1/chat/completions"
const MAX_RETRIES = 3
const BASE_DELAY_MS = 1000

interface BobMessage {
  role: "system" | "user" | "assistant"
  content: string
}

interface BobResponse {
  choices: Array<{
    message: { content: string }
    finish_reason: string
  }>
  usage?: {
    total_tokens: number
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export async function callBob(
  messages: BobMessage[],
  attempt = 0
): Promise<{ content: string; tokensUsed: number }> {
  const apiKey = process.env.BOB_API_KEY
  if (!apiKey) throw new Error("BOB_API_KEY environment variable is not set")

  try {
    const res = await fetch(BOB_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "ibm-bob-latest",
        messages,
        temperature: 0.2,       // Low temperature for consistent structured output
        max_tokens: 8192,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(90_000), // 90s timeout per Bob call
    })

    if (res.status === 429) {
      // Rate limited — exponential backoff
      if (attempt >= MAX_RETRIES) throw new Error("Bob API rate limit exceeded after retries")
      const delay = BASE_DELAY_MS * Math.pow(2, attempt)
      console.warn(`[bob] Rate limited. Retrying in ${delay}ms (attempt ${attempt + 1})`)
      await sleep(delay)
      return callBob(messages, attempt + 1)
    }

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Bob API error ${res.status}: ${body}`)
    }

    const data = (await res.json()) as BobResponse
    const content = data.choices[0]?.message?.content ?? ""
    const tokensUsed = data.usage?.total_tokens ?? 0

    return { content, tokensUsed }
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      throw new Error("Bob API call timed out after 90 seconds")
    }
    throw err
  }
}

// ─── JSON extraction helper ──────────────────────────────────────────────────
// Bob sometimes wraps JSON in markdown code fences — strip them.

export function extractJSON(raw: string): string {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) return fenceMatch[1].trim()
  return raw.trim()
}
