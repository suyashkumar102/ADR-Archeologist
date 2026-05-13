import type { SSEEvent, ADRPackage } from "@/types"
import djangoAdrs from "./django-adrs.json"

// ─── Demo Mode ───────────────────────────────────────────────────────────────
// When DEMO_MODE=true, the API route calls streamDemoOutput() instead of the
// live Bob pipeline. This returns pre-cached django/django output with
// artificial delays to simulate the real pipeline experience.
//
// To update the cache: run the live pipeline on django/django and replace
// the contents of django-adrs.json with the ADRPackage output.

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export async function* streamDemoOutput(): AsyncGenerator<SSEEvent> {
  const pkg = djangoAdrs as ADRPackage

  yield { event: "stage", data: { stage: 1, status: "running" } }
  await sleep(1500)
  yield { event: "stage", data: { stage: 1, status: "done", count: pkg.adrs.length } }

  yield { event: "stage", data: { stage: 2, status: "running" } }
  await sleep(1500)
  yield { event: "stage", data: { stage: 2, status: "done" } }

  yield { event: "stage", data: { stage: 3, status: "running" } }
  await sleep(1500)
  yield { event: "stage", data: { stage: 3, status: "done" } }

  yield { event: "stage", data: { stage: 4, status: "running" } }
  await sleep(1500)
  yield { event: "stage", data: { stage: 4, status: "done" } }

  yield { event: "complete", data: pkg }
}
