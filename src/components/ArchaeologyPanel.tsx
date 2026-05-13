"use client"

import { useState } from "react"
import type { ArchaeologyFinding } from "@/types"

const TYPE_ICONS: Record<ArchaeologyFinding["type"], string> = {
  "deleted-file":    "🗑",
  "commented-code":  "💬",
  "migration":       "🔄",
  "naming-pattern":  "🏷",
  "todo-comment":    "📝",
}

const TYPE_LABELS: Record<ArchaeologyFinding["type"], string> = {
  "deleted-file":    "Deleted file",
  "commented-code":  "Commented code",
  "migration":       "Migration artifact",
  "naming-pattern":  "Naming pattern",
  "todo-comment":    "TODO / FIXME",
}

interface Props {
  findings: ArchaeologyFinding[]
}

export default function ArchaeologyPanel({ findings }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-3">
      {/* Toggle badge */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[9px] font-medium border border-amber-mid bg-amber-light text-amber-DEFAULT hover:opacity-80 transition-opacity"
      >
        ⛏ Archaeology · {findings.length} finding{findings.length !== 1 ? "s" : ""}
        <span className="ml-0.5">{open ? "▲" : "▼"}</span>
      </button>

      {/* Panel */}
      <div className={`archaeology-panel ${open ? "expanded" : "collapsed"}`}>
        <div className="mt-3 rounded-lg border border-amber-mid bg-amber-light p-3 space-y-3">
          <p className="text-[11px] text-ink2 italic">
            Evidence of alternatives that were considered before this decision was made.
          </p>
          {findings.map((finding, idx) => (
            <div key={idx} className="flex gap-2.5 items-start">
              <span className="text-base flex-shrink-0 mt-0.5">
                {TYPE_ICONS[finding.type]}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-mono text-[9px] font-medium text-amber-DEFAULT uppercase tracking-wide">
                    {TYPE_LABELS[finding.type]}
                  </span>
                  {finding.filePath && (
                    <span className="font-mono text-[9px] bg-surface border border-border rounded px-1.5 py-0.5 text-ink2">
                      {finding.filePath}
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink2 leading-relaxed">{finding.description}</p>
                {finding.snippet && (
                  <pre className="mt-1.5 text-[10px] font-mono bg-ink text-[#D0CFC8] rounded p-2 overflow-x-auto leading-relaxed">
                    {finding.snippet}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
