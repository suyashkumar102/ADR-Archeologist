'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { AnalyzeRequest, ADRPackage, SSEEvent } from '@/lib/types'
import ProgressStep from '@/components/ui/ProgressStep'
import Button from '@/components/ui/Button'

interface Stage {
  stage: 1 | 2 | 3 | 4
  name: string
  status: 'waiting' | 'running' | 'complete' | 'error'
  count: number
  durationMs: number
}

interface PipelineProgressProps {
  request: AnalyzeRequest
  onComplete: (pkg: ADRPackage) => void
  onError: (message: string) => void
}

export default function PipelineProgress({ request, onComplete, onError }: PipelineProgressProps) {
  const [stages, setStages] = useState<Stage[]>([
    { stage: 1, name: 'Decision detection', status: 'waiting', count: 0, durationMs: 0 },
    { stage: 2, name: 'Context inference', status: 'waiting', count: 0, durationMs: 0 },
    { stage: 3, name: 'Alternatives archaeology', status: 'waiting', count: 0, durationMs: 0 },
    { stage: 4, name: 'ADR generation', status: 'waiting', count: 0, durationMs: 0 },
  ])
  const [archaeologyCount, setArchaeologyCount] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)

  useEffect(() => {
    const url = api.analyzeStreamUrl(request)
    const es = new EventSource(url)
    const timeoutTimer = setTimeout(() => {
      setShowTimeoutWarning(true)
    }, 25000)

    es.onmessage = (e) => {
      setShowTimeoutWarning(false)
      clearTimeout(timeoutTimer)

      const event: SSEEvent = JSON.parse(e.data)

      if (event.type === 'stage_start') {
        setStages((prev) =>
          prev.map((s) => s.stage === event.stage ? { ...s, status: 'running' } : s)
        )
      }

      if (event.type === 'stage_complete') {
        setStages((prev) =>
          prev.map((s) =>
            s.stage === event.stage
              ? { ...s, status: 'complete', count: event.count, durationMs: event.durationMs }
              : s
          )
        )
        if (event.stage === 3) {
          setArchaeologyCount(event.count)
        }
      }

      if (event.type === 'pipeline_done') {
        es.close()
        onComplete(event.package)
      }

      if (event.type === 'error') {
        setErrorMessage(event.message)
        setStages((prev) => prev.map((s) => s.status === 'running' ? { ...s, status: 'error' } : s))
        es.close()
        onError(event.message)
      }
    }

    es.onerror = () => {
      const message = 'Connection to backend lost. Is the server running?'
      setErrorMessage(message)
      setStages((prev) => prev.map((s) => s.status === 'running' ? { ...s, status: 'error' } : s))
      es.close()
      onError(message)
    }

    return () => {
      clearTimeout(timeoutTimer)
      es.close()
    }
  }, [request, onComplete, onError])

  return (
    <div className="glass-panel rounded-xl p-6">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">Pipeline running</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Analyzing repository</h2>
      </div>

      <div>
        {stages.slice(0, 3).map((stage) => (
          <ProgressStep
            key={stage.stage}
            stage={stage.stage}
            name={stage.name}
            status={stage.status}
            count={stage.count}
            durationMs={stage.durationMs}
          />
        ))}

        {archaeologyCount > 0 && (
          <div className="my-3 rounded-lg border border-indigo-300/25 bg-indigo-300/10 px-4 py-3">
            <p className="text-[13px] font-medium text-indigo-100">
              Found {archaeologyCount} archaeology {archaeologyCount === 1 ? 'discovery' : 'discoveries'}
            </p>
          </div>
        )}

        <ProgressStep
          stage={stages[3].stage}
          name={stages[3].name}
          status={stages[3].status}
          count={stages[3].count}
          durationMs={stages[3].durationMs}
        />
      </div>

      {showTimeoutWarning && !errorMessage && (
        <div className="mt-4 rounded-lg border border-amber-300/25 bg-amber-300/10 p-3">
          <p className="text-xs text-amber-100">
            Taking longer than expected. Large repositories may need a few minutes.
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="mt-6 rounded-lg border border-red-300/25 bg-red-300/10 p-4">
          <p className="mb-3 text-sm text-red-200">{errorMessage}</p>
          <Button onClick={() => window.history.back()} variant="secondary">
            Try again
          </Button>
        </div>
      )}
    </div>
  )
}
