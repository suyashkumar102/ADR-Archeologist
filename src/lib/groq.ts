import Groq from 'groq-sdk'

const MODEL = 'llama-3.3-70b-versatile'
const MAX_TOKENS = 8000

let client: Groq | null = null

function getClient(): Groq {
  if (!client) {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is not set')
    }
    // maxRetries lets the SDK back off on 429s — important on the free tier.
    client = new Groq({ apiKey, maxRetries: 4 })
  }
  return client
}

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// The model occasionally wraps JSON in markdown fences or adds stray prose
// even in JSON mode. Strip to the outermost JSON value before parsing.
function extractJSON(raw: string): string {
  let s = raw.trim()

  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) s = fence[1].trim()

  const firstObj = s.indexOf('{')
  const firstArr = s.indexOf('[')
  let start = -1
  if (firstObj === -1) start = firstArr
  else if (firstArr === -1) start = firstObj
  else start = Math.min(firstObj, firstArr)

  const end = Math.max(s.lastIndexOf('}'), s.lastIndexOf(']'))

  if (start !== -1 && end !== -1 && end > start) {
    s = s.slice(start, end + 1)
  }
  return s
}

export async function callGroqJSON<T>(
  messages: GroqMessage[],
  schema: { parse: (data: unknown) => T }
): Promise<{ output: T; tokensUsed: number }> {
  const enhancedMessages = [...messages]
  const lastMsg = enhancedMessages[enhancedMessages.length - 1]
  if (lastMsg && lastMsg.role === 'user') {
    lastMsg.content +=
      '\n\nReturn ONLY a single valid JSON object that matches the schema exactly. No markdown fences. No prose. No explanation.'
  }

  let attempt = 0
  let lastError: string | null = null
  let rawResponse = ''
  let totalTokens = 0

  while (attempt < 2) {
    try {
      const groq = getClient()
      const response = await groq.chat.completions.create({
        model: MODEL,
        messages: enhancedMessages.map((m) => ({ role: m.role, content: m.content })),
        temperature: 0,
        max_tokens: MAX_TOKENS,
        // JSON mode: Groq guarantees the response is a syntactically valid
        // JSON object. Eliminates the array/fence/prose parsing failures.
        response_format: { type: 'json_object' },
      })

      const content = response.choices[0]?.message?.content ?? ''
      totalTokens += response.usage?.total_tokens ?? 0
      rawResponse = content

      if (!content) {
        throw new Error('Groq API returned an empty response')
      }

      const parsed = JSON.parse(extractJSON(content))
      const validated = schema.parse(parsed)

      return { output: validated, tokensUsed: totalTokens }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)

      if (attempt >= 1) {
        throw new Error(
          `Groq JSON validation failed after retry. Error: ${lastError}\nFirst 300 chars: ${rawResponse.slice(0, 300)}`
        )
      }

      console.warn('[groq] JSON validation failed, retrying with error feedback')
      enhancedMessages.push(
        { role: 'assistant', content: rawResponse },
        {
          role: 'user',
          content: `Your previous response was invalid: ${lastError}. Return ONLY a single valid JSON object that matches the required schema exactly. No markdown fences. No prose.`,
        }
      )
      attempt++
    }
  }

  throw new Error('Unexpected error in callGroqJSON')
}
