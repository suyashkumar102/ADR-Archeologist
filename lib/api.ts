import { AnalyzeRequest, ADR } from './types/index'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

export const api = {

  // Wakes up the Render instance (free tier sleeps after inactivity)
  ping: (): void => {
    fetch(`${BACKEND}/health`).catch(() => {})
  },

  // Validates a GitHub URL — returns RepoValidation
  validateRepo: (url: string): Promise<{ valid: boolean; fileCount?: number; language?: string; error?: string }> =>
    fetch(`${BACKEND}/repo/validate?url=${encodeURIComponent(url)}`)
      .then(r => r.json()),

  // Builds the SSE stream URL — used with new EventSource(...)
  // Note: /analyze/stream NOT /api/analyze/stream
  analyzeStreamUrl: (request: AnalyzeRequest): string => {
    const params = new URLSearchParams({ repoUrl: request.repoUrl })
    if (request.pathFilter) params.set('pathFilter', request.pathFilter)
    request.focusAreas?.forEach((a: string) => params.append('focusAreas', a))
    return `${BACKEND}/analyze/stream?${params.toString()}`
  },

  // Creates a GitHub PR with the generated ADRs
  // Uses the USER's GitHub token, not the server token
  createPR: (token: string, repoUrl: string, adrs: ADR[]): Promise<{ prUrl?: string; error?: string }> =>
    fetch(`${BACKEND}/github/pr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, repoUrl, adrs }),
    }).then(r => r.json()),
}

// Made with Bob
