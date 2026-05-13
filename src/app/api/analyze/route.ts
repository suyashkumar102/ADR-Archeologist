import type { SSEEvent, AnalyzeRequest } from "@/types"
import { fetchRepo } from "@/lib/github/fetcher"
import { runPipeline } from "@/lib/bob/pipeline"
import { streamDemoOutput } from "@/lib/demo/cache"

// Node.js runtime required — pipeline uses Buffer (base64 decode) and
// process.env. Edge runtime does not support these Node globals.
export const runtime = "nodejs"

// Increase the max duration for Vercel deployments (Pro: 300s, Hobby: 60s)
export const maxDuration = 60

function encodeEvent(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

export async function POST(req: Request): Promise<Response> {
  let body: AnalyzeRequest

  try {
    body = (await req.json()) as AnalyzeRequest
  } catch {
    return new Response(
      encodeEvent({ event: "error", data: { message: "Invalid JSON request body" } }),
      {
        status: 400,
        headers: { "Content-Type": "text/event-stream" },
      }
    )
  }

  const { repoUrl, pathFilter, focusAreas } = body

  if (!repoUrl || !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+/.test(repoUrl)) {
    return new Response(
      encodeEvent({ event: "error", data: { message: "Invalid GitHub repository URL" } }),
      {
        status: 400,
        headers: { "Content-Type": "text/event-stream" },
      }
    )
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: SSEEvent) => {
        controller.enqueue(encoder.encode(encodeEvent(event)))
      }

      try {
        if (process.env.DEMO_MODE === "true") {
          for await (const event of streamDemoOutput()) {
            emit(event)
          }
          return
        }

        const repoContext = await fetchRepo(repoUrl, pathFilter)

        for await (const event of runPipeline({ repoUrl, pathFilter, focusAreas }, repoContext)) {
          emit(event)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        emit({ event: "error", data: { message } })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable Nginx buffering for SSE
    },
  })
}
