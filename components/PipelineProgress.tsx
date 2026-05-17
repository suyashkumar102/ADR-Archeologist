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

    // Set timeout warning after 25 seconds
    const timeoutTimer = setTimeout(() => {
      setShowTimeoutWarning(true)
    }, 25000)

    es.onmessage = (e) => {
      // Clear timeout warning on any event
      setShowTimeoutWarning(false)
      clearTimeout(timeoutTimer)
      
      const event: SSEEvent = JSON.parse(e.data)

      if (event.type === 'stage_start') {
        setStages((prev) =>
          prev.map((s) =>
            s.stage === event.stage ? { ...s, status: 'running' } : s
          )
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
        setStages((prev) =>
          prev.map((s) =>
            s.status === 'running' ? { ...s, status: 'error' } : s
          )
        )
        es.close()
        onError(event.message)
      }
    }

    es.onerror = () => {
      const message = 'Connection to backend lost. Is the server running?'
      setErrorMessage(message)
      setStages((prev) =>
        prev.map((s) =>
          s.status === 'running' ? { ...s, status: 'error' } : s
        )
      )
      es.close()
      onError(message)
    }

    return () => {
      clearTimeout(timeoutTimer)
      es.close()
    }
  }, [request, onComplete, onError])

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[10px] p-6">
      <h2 className="text-base font-medium mb-5">Analysing repository...</h2>

      <div className="space-y-0">
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

        {/* Archaeology Banner */}
        {archaeologyCount > 0 && (
          <div className="bg-[var(--color-purple-bg)] border border-[var(--color-purple)] rounded-lg px-4 py-[10px] my-3">
            <p className="text-[var(--color-purple)] text-[13px] font-medium">
              🏛️ Found {archaeologyCount} archaeology {archaeologyCount === 1 ? 'discovery' : 'discoveries'}
            </p>
          </div>
        )}

        {/* Stage 4 */}
        <ProgressStep
          stage={stages[3].stage}
          name={stages[3].name}
          status={stages[3].status}
          count={stages[3].count}
          durationMs={stages[3].durationMs}
        />
      </div>

      {/* Timeout Warning */}
      {showTimeoutWarning && !errorMessage && (
        <div className="mt-4 bg-[var(--color-amber-dim)] border border-[var(--color-amber)] rounded-lg p-3">
          <p className="text-[var(--color-amber)] text-xs">
            Taking longer than expected — large repositories may need a few minutes.
          </p>
        </div>
      )}

      {/* Error State */}
      {errorMessage && (
        <div className="mt-6 bg-[var(--color-red-bg)] border border-[var(--color-red-dim)] rounded-lg p-4">
          <p className="text-[var(--color-red)] text-sm mb-3">{errorMessage}</p>
          <Button onClick={() => window.history.back()} variant="secondary">
            ← Try again
          </Button>
        </div>
      )}
    </div>
  )
}

// Made with Bob
