import type { AnalyzeRequest, RepoContext, ADRPackage, SSEEvent } from "@/types"
import { runStage1 } from "./stage1-discover"
import { runStage2 } from "./stage2-enrich"
import { runStage3 } from "./stage3-archaeology"
import { runStage4 } from "./stage4-format"

function now(): number {
  return Date.now()
}

function buildADRPackage(
  input: AnalyzeRequest,
  repoContext: RepoContext,
  adrs: ADRPackage["adrs"],
  stats: ADRPackage["pipelineStats"]
): ADRPackage {
  const repoName = repoContext.repoUrl
    .replace(/https?:\/\/github\.com\//, "")
    .replace(/\//g, "-")

  return {
    repoUrl: input.repoUrl,
    repoName,
    generatedAt: new Date().toISOString(),
    adrs,
    pipelineStats: stats,
  }
}

export async function* runPipeline(
  input: AnalyzeRequest,
  repoContext: RepoContext
): AsyncGenerator<SSEEvent> {
  let totalTokens = 0

  // ── Stage 1: Decision Discovery ──────────────────────────────────────────
  yield { event: "stage", data: { stage: 1, status: "running" } }
  const t1Start = now()

  const { output: stage1Output, tokensUsed: t1Tokens } = await runStage1(repoContext)
  totalTokens += t1Tokens

  const t1Duration = now() - t1Start
  yield {
    event: "stage",
    data: { stage: 1, status: "done", count: stage1Output.decisions.length },
  }

  // ── Stage 2: Enrichment ──────────────────────────────────────────────────
  yield { event: "stage", data: { stage: 2, status: "running" } }
  const t2Start = now()

  const { output: stage2Output, tokensUsed: t2Tokens } = await runStage2(
    stage1Output,
    repoContext.commitHistory
  )
  totalTokens += t2Tokens

  const t2Duration = now() - t2Start
  yield { event: "stage", data: { stage: 2, status: "done" } }

  // ── Stage 3: Archaeology ─────────────────────────────────────────────────
  yield { event: "stage", data: { stage: 3, status: "running" } }
  const t3Start = now()

  const { output: stage3Output, tokensUsed: t3Tokens } = await runStage3(
    stage2Output,
    repoContext
  )
  totalTokens += t3Tokens

  const t3Duration = now() - t3Start
  yield { event: "stage", data: { stage: 3, status: "done" } }

  // ── Stage 4: MADR Formatting ─────────────────────────────────────────────
  yield { event: "stage", data: { stage: 4, status: "running" } }
  const t4Start = now()

  const { output: stage4Output, tokensUsed: t4Tokens } = await runStage4(
    stage2Output,
    stage3Output,
    input.repoUrl,
    stage1Output.decisions
  )
  totalTokens += t4Tokens

  const t4Duration = now() - t4Start
  yield { event: "stage", data: { stage: 4, status: "done" } }

  // ── Complete ─────────────────────────────────────────────────────────────
  const pkg = buildADRPackage(input, repoContext, stage4Output.adrs, {
    stage1DurationMs: t1Duration,
    stage2DurationMs: t2Duration,
    stage3DurationMs: t3Duration,
    stage4DurationMs: t4Duration,
    totalTokensUsed: totalTokens,
  })

  yield { event: "complete", data: pkg }
}
