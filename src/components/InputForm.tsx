"use client"

import { useState } from "react"
import type { AnalyzeRequest } from "@/types"

const FOCUS_AREAS = [
  { id: "database",       label: "Database" },
  { id: "auth",           label: "Auth" },
  { id: "caching",        label: "Caching" },
  { id: "infrastructure", label: "Infrastructure" },
  { id: "patterns",       label: "Patterns" },
  { id: "api-design",     label: "API Design" },
]

const REPO_URL_REGEX = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(?:\/.*)?$/

interface Props {
  onSubmit: (request: AnalyzeRequest) => void
  isLoading: boolean
}

export default function InputForm({ onSubmit, isLoading }: Props) {
  const [repoUrl, setRepoUrl] = useState("")
  const [pathFilter, setPathFilter] = useState("")
  const [focusAreas, setFocusAreas] = useState<string[]>([])
  const [urlError, setUrlError] = useState<string | null>(null)

  const toggleFocusArea = (id: string) => {
    setFocusAreas((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setUrlError(null)

    const trimmed = repoUrl.trim()
    if (!trimmed) {
      setUrlError("Please enter a GitHub repository URL")
      return
    }
    if (!REPO_URL_REGEX.test(trimmed)) {
      setUrlError("Must be a valid GitHub URL: https://github.com/owner/repo")
      return
    }

    onSubmit({
      repoUrl: trimmed,
      pathFilter: pathFilter.trim() || undefined,
      focusAreas: focusAreas.length > 0 ? focusAreas : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-[640px]">
      {/* Repo URL */}
      <div className="mb-5">
        <label className="block font-mono text-[10px] font-medium tracking-widest uppercase text-ink3 mb-2">
          GitHub Repository URL
        </label>
        <input
          type="url"
          value={repoUrl}
          onChange={(e) => { setRepoUrl(e.target.value); setUrlError(null) }}
          placeholder="https://github.com/django/django"
          disabled={isLoading}
          className={`w-full px-4 py-3 rounded-xl border text-sm font-mono bg-surface text-ink placeholder:text-ink3 outline-none transition-colors
            ${urlError
              ? "border-danger-DEFAULT focus:border-danger-DEFAULT"
              : "border-border focus:border-green-mid"
            }
            disabled:opacity-50 disabled:cursor-not-allowed`}
        />
        {urlError && (
          <p className="mt-1.5 text-xs text-danger-DEFAULT font-medium">{urlError}</p>
        )}
      </div>

      {/* Path filter */}
      <div className="mb-5">
        <label className="block font-mono text-[10px] font-medium tracking-widest uppercase text-ink3 mb-2">
          Path Filter{" "}
          <span className="normal-case tracking-normal font-normal text-ink3">(optional)</span>
        </label>
        <input
          type="text"
          value={pathFilter}
          onChange={(e) => setPathFilter(e.target.value)}
          placeholder="django/db/"
          disabled={isLoading}
          className="w-full px-4 py-3 rounded-xl border border-border focus:border-green-mid text-sm font-mono bg-surface text-ink placeholder:text-ink3 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <p className="mt-1.5 text-xs text-ink3">
          Limit analysis to files under this path prefix
        </p>
      </div>

      {/* Focus areas */}
      <div className="mb-8">
        <label className="block font-mono text-[10px] font-medium tracking-widest uppercase text-ink3 mb-3">
          Focus Areas{" "}
          <span className="normal-case tracking-normal font-normal text-ink3">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {FOCUS_AREAS.map((area) => {
            const active = focusAreas.includes(area.id)
            return (
              <button
                key={area.id}
                type="button"
                onClick={() => toggleFocusArea(area.id)}
                disabled={isLoading}
                className={`px-3 py-1.5 rounded-full font-mono text-[10px] font-medium border transition-colors
                  ${active
                    ? "bg-green-light border-green-mid text-green-DEFAULT"
                    : "bg-surface border-border text-ink2 hover:border-green-mid hover:text-green-DEFAULT"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {area.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center gap-3 px-6 py-3 rounded-xl bg-green-DEFAULT text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Analyzing…
          </>
        ) : (
          "Analyze Repository"
        )}
      </button>
    </form>
  )
}
