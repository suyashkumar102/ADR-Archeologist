import dotenv from 'dotenv'
import { resolve } from 'path'

// Load .env.local first, then .env as fallback
dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config({ path: resolve(process.cwd(), '.env') })
import express from 'express'
import cors from 'cors'
import { runPipeline } from './src/lib/pipeline'
import { validateRepo, parseRepoUrl } from './src/lib/github/fetcher'
import { createPR } from './src/lib/github/pr'
import { streamDemoOutput } from './src/lib/demo/cache'
import { Octokit } from '@octokit/rest'
import type { AnalyzeRequest, ADR, ADRPackage } from './src/types'

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 3001

// Route 1: Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Route 2: Validate repository
app.get('/repo/validate', async (req, res) => {
  const url = req.query.url as string | undefined
  
  if (!url) {
    return res.status(400).json({ valid: false, error: 'Missing url parameter' })
  }
  
  try {
    const validation = await validateRepo(url)
    res.json(validation)
  } catch (error: any) {
    res.status(500).json({ valid: false, error: error.message })
  }
})

// Route 3: Analyze with streaming (SSE)
app.get('/analyze/stream', async (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  const repoUrl = req.query.repoUrl as string
  const pathFilter = req.query.pathFilter as string | undefined
  
  // Handle focusAreas - can be single value or array
  const focusAreasParam = req.query.focusAreas
  const focusAreas = focusAreasParam 
    ? (Array.isArray(focusAreasParam) ? focusAreasParam : [focusAreasParam]).filter(Boolean) as string[]
    : []

  const request: AnalyzeRequest = {
    repoUrl,
    pathFilter,
    focusAreas: focusAreas.length > 0 ? focusAreas as any : undefined
  }

  const sendEvent = (data: object) => {
    res.write('data: ' + JSON.stringify(data) + '\n\n')
  }

  try {
    // Check for demo mode
    if (process.env.DEMO_MODE === 'true') {
      console.log('[DEMO MODE] Streaming pre-cached Django ADRs')
      for await (const event of streamDemoOutput()) {
        sendEvent(event)
      }
    } else {
      await runPipeline(request, sendEvent)
    }
  } catch (e: any) {
    sendEvent({ type: 'error', message: e.message })
  } finally {
    res.end()
  }
})

// Route 4: Analyze without streaming (POST)
app.post('/analyze', async (req, res) => {
  const request: AnalyzeRequest = req.body

  if (!request.repoUrl) {
    return res.status(400).json({ error: 'Missing repoUrl in request body' })
  }

  try {
    let result: ADRPackage | null = null
    
    await runPipeline(request, (event) => {
      // Capture the final package from pipeline_done event
      if (event.type === 'pipeline_done') {
        result = event.package;
      }
    })

    if (result) {
      res.json(result)
    } else {
      res.status(500).json({ error: 'Pipeline completed but no result was generated' })
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// Route 5: Create GitHub PR
app.post('/github/pr', async (req, res) => {
  const { token, repoUrl, adrs } = req.body as { 
    token: string
    repoUrl: string
    adrs: ADR[]
  }

  if (!token || !repoUrl || !adrs) {
    return res.status(400).json({ error: 'Missing required fields: token, repoUrl, adrs' })
  }

  try {
    // Create a minimal ADRPackage for the PR creation
    const pkg: ADRPackage = {
      adrs,
      repoUrl,
      repoName: parseRepoUrl(repoUrl).repo,
      indexContent: '',
      totalDecisions: adrs.length,
      archaeologyCount: adrs.reduce((sum, adr) => sum + (adr.archaeology?.length || 0), 0),
      totalTimeMs: 0
    }

    const prUrl = await createPR(pkg, token)
    res.json({ prUrl })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

// Made with Bob
