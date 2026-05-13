// ─── Single source of truth for all shared types ───────────────────────────
// Both frontend and backend import from here. Never duplicate these types.

export interface EvidenceFile {
  path: string
  githubUrl: string
  snippet?: string
}

export interface ArchaeologyFinding {
  type: "deleted-file" | "commented-code" | "migration" | "naming-pattern" | "todo-comment"
  description: string
  filePath?: string
  snippet?: string
}

export interface ADR {
  id: string                      // e.g. "ADR-004"
  title: string
  status: "accepted" | "deprecated" | "superseded"
  category: string
  confidence: number              // 0–1
  context: string
  decision: string
  consequences: string
  alternativesConsidered: string[]
  evidenceFiles: EvidenceFile[]
  archaeologyEvidence: ArchaeologyFinding[]
  decisionDate?: string           // inferred from commit history (ISO date string)
}

export interface PipelineStats {
  stage1DurationMs: number
  stage2DurationMs: number
  stage3DurationMs: number
  stage4DurationMs: number
  totalTokensUsed: number
}

export interface ADRPackage {
  repoUrl: string
  repoName: string
  generatedAt: string             // ISO date string
  adrs: ADR[]
  pipelineStats: PipelineStats
}

export interface AnalyzeRequest {
  repoUrl: string
  pathFilter?: string
  focusAreas?: string[]
}

export interface RepoContext {
  chunks: string[]                // batched file content chunks for Bob
  commitHistory: Record<string, string>  // filePath → earliest commit ISO date
  fileList: string[]              // all included file paths
  repoUrl: string
  owner: string
  repo: string
}

// ─── SSE Event Types ────────────────────────────────────────────────────────

export type StageStatus = "idle" | "running" | "done" | "error"

export interface StageState {
  stage: 1 | 2 | 3 | 4
  status: StageStatus
  count?: number                  // only on Stage 1 done
}

export type SSEEvent =
  | { event: "stage";    data: { stage: 1 | 2 | 3 | 4; status: "running" | "done"; count?: number } }
  | { event: "complete"; data: ADRPackage }
  | { event: "error";    data: { message: string; stage?: number } }

// ─── Stage-level internal types ─────────────────────────────────────────────

export interface Stage1Decision {
  title: string
  category: "database" | "auth" | "caching" | "infrastructure" | "patterns" | "api-design" | "other"
  confidence: number
  evidenceFiles: string[]
  summary: string
}

export interface Stage1Output {
  decisions: Stage1Decision[]
}

export interface Stage2EnrichedDecision {
  title: string
  context: string
  decision: string
  rationale: string
  alternativesConsidered: string[]
  consequences: string
  decisionDate?: string
}

export interface Stage2Output {
  enrichedDecisions: Stage2EnrichedDecision[]
}

export interface Stage3Finding {
  type: "deleted-file" | "commented-code" | "migration" | "naming-pattern" | "todo-comment"
  description: string
  filePath?: string
  snippet?: string
}

export interface Stage3ArchaeologyEntry {
  decisionTitle: string
  findings: Stage3Finding[]
}

export interface Stage3Output {
  archaeologyFindings: Stage3ArchaeologyEntry[]
}

export interface Stage4Output {
  adrs: ADR[]
}
