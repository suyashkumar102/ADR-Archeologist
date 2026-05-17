export interface AnalyzeRequest {
  repoUrl: string
  pathFilter?: string
  focusAreas?: string[]
}

export interface ADR {
  id: string
  title: string
  status: 'accepted' | 'deprecated' | 'superseded'
  date: string
  category: string
  confidence: number
  inferredDate: string
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
    evidenceType: string
    rejectionReason: string
  }> | null
  evidenceFiles: string[]
  relatedDecisions?: string[]
}

export interface RepoValidation {
  valid: boolean
  fileCount?: number
  language?: string
  error?: string
}

export interface PRResponse {
  prUrl?: string
  error?: string
}

export interface ADRPackage {
  adrs: Array<ADR & { filename: string; markdownContent: string }>
  repoName: string
  indexContent: string
  metadata: {
    repoUrl: string
    analysisDate: string
    totalDecisions: number
    archaeologyCount: number
  }
}

export type SSEEvent =
  | { type: 'stage_start'; stage: 1 | 2 | 3 | 4 }
  | { type: 'stage_complete'; stage: 1 | 2 | 3 | 4; count: number; durationMs: number }
  | { type: 'adr_ready'; adr: ADR }
  | { type: 'pipeline_done'; package: ADRPackage }
  | { type: 'error'; message: string }

// Made with Bob
