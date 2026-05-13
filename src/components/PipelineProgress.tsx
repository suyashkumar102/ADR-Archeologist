import type { StageState } from "@/types"

const STAGE_NAMES: Record<number, { name: string; description: string }> = {
  1: { name: "Decision Discovery",  description: "Bob reads the full codebase and identifies architectural decisions" },
  2: { name: "Enrichment",          description: "Bob infers rationale, alternatives, and consequences for each decision" },
  3: { name: "Archaeology",         description: "Bob scans for evidence of rejected alternatives in the code" },
  4: { name: "MADR Formatting",     description: "Bob produces final MADR-format Architecture Decision Records" },
}

interface Props {
  stages: StageState[]
}

export default function PipelineProgress({ stages }: Props) {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {stages.map((s, idx) => {
        const meta = STAGE_NAMES[s.stage]
        const isLast = idx === stages.length - 1

        return (
          <div
            key={s.stage}
            className={`flex items-start gap-4 p-4 ${!isLast ? "border-b border-border" : ""}`}
          >
            {/* Stage badge */}
            <div className="flex-shrink-0 mt-0.5">
              {s.status === "idle" && (
                <div className="w-9 h-9 rounded-full border-[1.5px] border-border bg-surface flex items-center justify-center font-mono text-sm font-medium text-ink3">
                  {s.stage}
                </div>
              )}
              {s.status === "running" && (
                <div className="w-9 h-9 rounded-full border-[1.5px] border-green-mid bg-green-light flex items-center justify-center font-mono text-sm font-medium text-green-DEFAULT animate-pulse-ring">
                  {s.stage}
                </div>
              )}
              {s.status === "done" && (
                <div className="w-9 h-9 rounded-full bg-green-DEFAULT flex items-center justify-center text-white text-sm">
                  ✓
                </div>
              )}
              {s.status === "error" && (
                <div className="w-9 h-9 rounded-full bg-danger-DEFAULT flex items-center justify-center text-white text-sm">
                  ✕
                </div>
              )}
            </div>

            {/* Stage info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-ink">
                  {s.stage} · {meta.name}
                </span>
                {s.status === "running" && (
                  <span className="font-mono text-[9px] font-medium px-2 py-0.5 rounded-full bg-green-light text-green-DEFAULT border border-green-mid tracking-wide">
                    RUNNING
                  </span>
                )}
                {s.status === "done" && s.count !== undefined && (
                  <span className="font-mono text-[9px] font-medium px-2 py-0.5 rounded-full bg-green-light text-green-DEFAULT border border-green-mid tracking-wide">
                    {s.count} decisions found
                  </span>
                )}
                {s.status === "done" && s.count === undefined && (
                  <span className="font-mono text-[9px] font-medium px-2 py-0.5 rounded-full bg-green-light text-green-DEFAULT border border-green-mid tracking-wide">
                    DONE
                  </span>
                )}
                {s.status === "error" && (
                  <span className="font-mono text-[9px] font-medium px-2 py-0.5 rounded-full bg-danger-light text-danger-DEFAULT border border-danger-mid tracking-wide">
                    ERROR
                  </span>
                )}
              </div>
              <p className="text-xs text-ink2 mt-0.5 leading-relaxed">{meta.description}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
