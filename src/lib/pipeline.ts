// ─── Main Pipeline Orchestration ─────────────────────────────────────────────
// Wires all 4 stages together with progress callbacks

import type { AnalyzeRequest, ADRPackage, SSEEvent, RepoContext, ADR } from "@/types"
import { fetchRepoContext } from "./github/fetcher"
import { runStage1 } from "./stages/stage1"
import { runStage2 } from "./stages/stage2"
import { runStage3 } from "./stages/stage3"
import { runStage4 } from "./stages/stage4"
import { buildIndex } from "./export/madr"

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProgressCallback = (event: SSEEvent) => void

// ─── Main Pipeline Runner ────────────────────────────────────────────────────

/**
 * Run the complete 4-stage ADR archaeology pipeline
 * 
 * @param request - Analysis request with repo URL and optional filters
 * @param onProgress - Callback for progress events (SSE)
 * @returns Complete ADR package with all generated ADRs
 * 
 * @example
 * await runPipeline(
 *   { repoUrl: "https://github.com/django/django", pathFilter: "django/" },
 *   (event) => console.log(event)
 * )
 */
export async function runPipeline(
  request: AnalyzeRequest,
  onProgress: ProgressCallback
): Promise<ADRPackage> {
  const totalStart = Date.now()
  
  try {
    // ─── Stage 1: Decision Detection ─────────────────────────────────────────
    
    onProgress({ type: 'stage_start', stage: 1, name: 'Decision detection' })
    
    const repoContext = await fetchRepoContext(request.repoUrl, request.pathFilter)
    
    const stage1Start = Date.now()
    const stage1 = await runStage1(repoContext, request.focusAreas)
    
    onProgress({
      type: 'stage_complete',
      stage: 1,
      count: stage1.totalFound,
      durationMs: Date.now() - stage1Start
    })
    
    // ─── Stage 2: Context Inference ──────────────────────────────────────────
    
    onProgress({ type: 'stage_start', stage: 2, name: 'Context inference' })
    
    const stage2Start = Date.now()
    const stage2 = await runStage2(stage1, repoContext)
    
    onProgress({
      type: 'stage_complete',
      stage: 2,
      count: stage2.contexts.length,
      durationMs: Date.now() - stage2Start
    })
    
    // ─── Stage 3: Alternatives Archaeology ───────────────────────────────────
    
    onProgress({ type: 'stage_start', stage: 3, name: 'Alternatives archaeology' })
    
    const stage3Start = Date.now()
    const stage3 = await runStage3(stage1, repoContext)
    
    const archaeologyCount = stage3.alternatives.filter(
      a => a.rejected.length > 0
    ).length
    
    onProgress({
      type: 'stage_complete',
      stage: 3,
      count: archaeologyCount,
      durationMs: Date.now() - stage3Start
    })
    
    // ─── Stage 4: ADR Generation ─────────────────────────────────────────────
    
    onProgress({ type: 'stage_start', stage: 4, name: 'ADR generation' })
    
    const stage4Start = Date.now()
    const stage4 = await runStage4(stage1, stage2, stage3, repoContext)
    
    onProgress({
      type: 'stage_complete',
      stage: 4,
      count: stage4.adrs.length,
      durationMs: Date.now() - stage4Start
    })
    
    // ─── Emit Individual ADRs ────────────────────────────────────────────────
    
    // Cast stage4.adrs to ADR[] to satisfy type checker
    const adrs = stage4.adrs as ADR[]
    
    for (const adr of adrs) {
      onProgress({ type: 'adr_ready', adr })
    }
    
    // ─── Build Final Package ─────────────────────────────────────────────────
    
    const result: ADRPackage = {
      adrs,
      indexContent: "",
      repoName: `${repoContext.owner}/${repoContext.repo}`,
      repoUrl: request.repoUrl,
      totalDecisions: stage1.totalFound,
      archaeologyCount,
      totalTimeMs: Date.now() - totalStart
    }
    result.indexContent = buildIndex(result)

    onProgress({ type: 'pipeline_done', package: result })
    
    return result
    
  } catch (error: any) {
    onProgress({
      type: 'error',
      message: error.message || 'Unknown pipeline error'
    })
    throw error
  }
}

// Made with Bob