import type { SSEEvent, ADRPackage } from "@/types"
import { PipelineStage } from "@/types"
import djangoAdrs from "./django-adrs.json"

// ─── Demo Mode ───────────────────────────────────────────────────────────────
// When DEMO_MODE=true, the /analyze/stream route calls streamDemoOutput()
// instead of the live pipeline. This replays pre-cached django/django output
// with artificial delays to simulate the real pipeline experience.
//
// To update the cache: run the live pipeline on django/django and replace
// the contents of django-adrs.json with the ADRPackage output.

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

const STAGE_DELAY_MS = 1500

export async function* streamDemoOutput(): AsyncGenerator<SSEEvent> {
  const pkg = djangoAdrs as ADRPackage

  const stages: Array<{ stage: number; name: string; count: number }> = [
    { stage: 1, name: PipelineStage.DETECTION, count: pkg.totalDecisions },
    { stage: 2, name: PipelineStage.CONTEXT, count: pkg.adrs.length },
    { stage: 3, name: PipelineStage.ARCHAEOLOGY, count: pkg.archaeologyCount },
    { stage: 4, name: PipelineStage.GENERATION, count: pkg.adrs.length },
  ]

  for (const s of stages) {
    yield { type: "stage_start", stage: s.stage, name: s.name }
    await sleep(STAGE_DELAY_MS)
    yield {
      type: "stage_complete",
      stage: s.stage,
      count: s.count,
      durationMs: STAGE_DELAY_MS,
    }
  }

  for (const adr of pkg.adrs) {
    yield { type: "adr_ready", adr }
  }

  yield { type: "pipeline_done", package: pkg }
}
