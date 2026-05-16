// ─── Single source of truth for all shared types ───────────────────────────
// The Express API server and the pipeline import from here. Never duplicate.

// ─── Enums ──────────────────────────────────────────────────────────────────

export type FocusArea =
  | 'infrastructure'
  | 'database'
  | 'auth'
  | 'caching'
  | 'structure'
  | 'testing'
  | 'communication'
  | 'error_handling'

export type ArchaeologyEvidenceType =
  | 'commented_out'
  | 'migration_artifact'
  | 'dead_utility'
  | 'dead_import'
  | 'removed_test'
  | 'todo_comment'

export enum PipelineStage {
  DETECTION = 'Decision detection',
  CONTEXT = 'Context inference',
  ARCHAEOLOGY = 'Alternatives archaeology',
  GENERATION = 'ADR generation',
}

// ─── Request/Response Types ─────────────────────────────────────────────────

export interface AnalyzeRequest {
  repoUrl: string
  pathFilter?: string
  focusAreas?: FocusArea[]
}

export interface RepoValidation {
  valid: boolean
  fileCount?: number
  language?: string
  error?: string
}

// ─── ADR Types ──────────────────────────────────────────────────────────────

export interface ADR {
  id: string // e.g. "ADR-001"
  filename: string // e.g. "0001-redis-sessions.md"
  title: string
  status: 'accepted' | 'deprecated' | 'superseded'
  inferredDate: string // e.g. "~2019"
  category: string
  confidence: number // 0-100
  context: string
  decision: string
  consequences: {
    positive: string[]
    negative: string[]
  }
  alternatives: Array<{
    option: string
    reason: string
  }>
  archaeology: Array<{
    option: string
    evidenceFile: string
    evidenceType: ArchaeologyEvidenceType
    rejectionReason: string
  }> | null
  evidenceFiles: string[]
  markdownContent: string
}

export interface ADRPackage {
  adrs: ADR[]
  indexContent: string
  repoName: string
  repoUrl: string
  totalDecisions: number
  archaeologyCount: number
  totalTimeMs: number
}

// ─── SSE Event Types ────────────────────────────────────────────────────────
// The pipeline emits these via the onProgress callback; server.ts serializes
// them to the SSE stream. Discriminated on `type`. This is the single contract
// shared by lib/pipeline.ts, lib/demo/cache.ts, server.ts, and
// scripts/test-server.ts — keep them in sync.

export type SSEEvent =
  | { type: 'stage_start'; stage: number; name: string }
  | { type: 'stage_complete'; stage: number; count: number; durationMs: number }
  | { type: 'adr_ready'; adr: ADR }
  | { type: 'pipeline_done'; package: ADRPackage }
  | { type: 'error'; message: string }

// ─── Internal Pipeline Types ────────────────────────────────────────────────

export interface RepoFile {
  path: string
  content: string
}

export interface RepoContext {
  owner: string
  repo: string
  files: RepoFile[]
  fileCount: number
  primaryLanguage: string
}
