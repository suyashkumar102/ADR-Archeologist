"use client"

import { useState, useCallback } from "react"
import type { ADRPackage, SSEEvent, StageState, AnalyzeRequest } from "@/types"
import InputForm from "@/components/InputForm"
import PipelineProgress from "@/components/PipelineProgress"
import ADRCard from "@/components/ADRCard"
import ExportPanel from "@/components/ExportPanel"

type View = "input" | "analyzing" | "results"

const INITIAL_STAGES: StageState[] = [
  { stage: 1, status: "idle" },
  { stage: 2, status: "idle" },
  { stage: 3, status: "idle" },
  { stage: 4, status: "idle" },
]

export default function HomePage() {
  const [view, setView] = useState<View>("input")
  const [stages, setStages] = useState<StageState[]>(INITIAL_STAGES)
  const [pkg, setPkg] = useState<ADRPackage | null>(null)
  const [error, setError] = useState<string | null>(null)

  const updateStage = useCallback((stage: number, status: StageState["status"], count?: number) => {
    setStages((prev) =>
      prev.map((s) =>
        s.stage === stage ? { ...s, status, ...(count !== undefined ? { count } : {}) } : s
      )
    )
  }, [])

  const handleSubmit = useCallback(
    async (request: AnalyzeRequest) => {
      setView("analyzing")
      setStages(INITIAL_STAGES)
      setPkg(null)
      setError(null)

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        })

        if (!res.body) throw new Error("No response body from server")

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n\n")
          buffer = lines.pop() ?? ""

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            const raw = line.slice(6).trim()
            if (!raw) continue

            try {
              const event = JSON.parse(raw) as SSEEvent

              if (event.event === "stage") {
                updateStage(event.data.stage, event.data.status, event.data.count)
              } else if (event.event === "complete") {
                setPkg(event.data)
                setView("results")
              } else if (event.event === "error") {
                setError(event.data.message)
                setView("input")
              }
            } catch {
              // Malformed SSE line — skip
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred")
        setView("input")
      }
    },
    [updateStage]
  )

  const handleReset = useCallback(() => {
    setView("input")
    setStages(INITIAL_STAGES)
    setPkg(null)
    setError(null)
  }, [])

  return (
    <div className="max-w-[1080px] mx-auto px-10 py-16">
      {/* Hero */}
      {view === "input" && (
        <div className="mb-12">
          <div className="font-mono text-[10px] font-medium tracking-widest uppercase text-ink3 mb-4 flex items-center gap-3">
            <span className="w-5 h-px bg-border inline-block" />
            IBM Bob Hackathon · May 15–17, 2026
          </div>
          <h1 className="text-[clamp(48px,6.5vw,80px)] font-light tracking-[-2.5px] leading-[1.05] mb-6">
            ADR<br />
            <span className="text-green-DEFAULT">Archaeologist</span>
          </h1>
          <p className="text-[16px] text-ink2 leading-[1.7] max-w-[580px] mb-8">
            Bob reads your entire codebase and reconstructs every major architectural decision as a
            formal Architecture Decision Record — for decisions your team made{" "}
            <strong className="text-ink font-semibold">but never wrote down.</strong>
          </p>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-danger-light border border-danger-mid text-danger-DEFAULT text-sm font-medium">
          {error}
        </div>
      )}

      {/* Input form */}
      {view === "input" && (
        <InputForm onSubmit={handleSubmit} isLoading={false} />
      )}

      {/* Analyzing view */}
      {view === "analyzing" && (
        <div className="max-w-[640px]">
          <div className="font-mono text-[10px] font-medium tracking-widest uppercase text-ink3 mb-4 flex items-center gap-3">
            <span className="w-5 h-px bg-border inline-block" />
            Running IBM Bob pipeline
          </div>
          <h2 className="text-[26px] font-semibold tracking-tight mb-2">
            Analyzing repository…
          </h2>
          <p className="text-sm text-ink2 mb-8">
            Bob is reading the full codebase. This takes ~90 seconds.
          </p>
          <PipelineProgress stages={stages} />
        </div>
      )}

      {/* Results view */}
      {view === "results" && pkg && (
        <div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="font-mono text-[10px] font-medium tracking-widest uppercase text-ink3 mb-2 flex items-center gap-3">
                <span className="w-5 h-px bg-border inline-block" />
                {pkg.adrs.length} decisions recovered
              </div>
              <h2 className="text-[26px] font-semibold tracking-tight">
                Architecture Decision Records
              </h2>
              <p className="text-sm text-ink2 mt-1">
                Reconstructed from{" "}
                <a
                  href={pkg.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-DEFAULT underline underline-offset-2"
                >
                  {pkg.repoName}
                </a>
              </p>
            </div>
            <button
              onClick={handleReset}
              className="text-sm font-medium text-ink2 hover:text-ink border border-border rounded-lg px-4 py-2 transition-colors hover:bg-surface"
            >
              ← Analyze another repo
            </button>
          </div>

          {/* Frozen pipeline progress */}
          <div className="mb-8">
            <PipelineProgress stages={stages} />
          </div>

          {/* Export panel */}
          <ExportPanel pkg={pkg} />

          {/* ADR cards */}
          <div className="mt-8 space-y-4">
            {pkg.adrs.length === 0 ? (
              <div className="p-8 rounded-xl border border-border text-center text-ink2 text-sm">
                No architectural decisions were found in this repository.
              </div>
            ) : (
              pkg.adrs.map((adr) => <ADRCard key={adr.id} adr={adr} repoUrl={pkg.repoUrl} />)
            )}
          </div>
        </div>
      )}
    </div>
  )
}
