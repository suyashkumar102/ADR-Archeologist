import type { ADR } from "@/types"
import ArchaeologyPanel from "./ArchaeologyPanel"

const STATUS_STYLES = {
  accepted:   "bg-[#1F4A32] text-[#6FCF97]",
  deprecated: "bg-[#4A1F1F] text-[#EB5757]",
  superseded: "bg-[#3A3010] text-[#F5D18A]",
}

interface Props {
  adr: ADR
  repoUrl: string
}

// ADRCard intentionally receives repoUrl for future deep-link use.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ADRCard({ adr, repoUrl: _repoUrl }: Props) {
  const confidencePct = Math.round(adr.confidence * 100)

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-surface">
      {/* Dark header */}
      <div className="bg-[#1C1B18] px-4 py-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="font-mono text-[10px] text-[#9A9890] mb-1">{adr.id}</div>
          <div className="text-[14px] font-medium text-[#F0EFE9] leading-snug">{adr.title}</div>
        </div>
        <span
          className={`flex-shrink-0 font-mono text-[9px] font-medium px-2 py-0.5 rounded tracking-wide ${STATUS_STYLES[adr.status]}`}
        >
          {adr.status.toUpperCase()}
        </span>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* 3-column grid */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <div className="font-mono text-[9px] font-medium tracking-widest uppercase text-ink3 mb-2">
              Context
            </div>
            <p className="text-[12px] text-ink2 leading-relaxed">{adr.context}</p>
          </div>
          <div>
            <div className="font-mono text-[9px] font-medium tracking-widest uppercase text-ink3 mb-2">
              Decision
            </div>
            <p className="text-[12px] text-ink2 leading-relaxed">{adr.decision}</p>
          </div>
          <div>
            <div className="font-mono text-[9px] font-medium tracking-widest uppercase text-ink3 mb-2">
              Consequences
            </div>
            <p className="text-[12px] text-ink2 leading-relaxed">{adr.consequences}</p>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="font-mono text-[9px] text-ink3 w-20 flex-shrink-0">Confidence</div>
          <div className="flex-1 h-[3px] bg-border rounded-full overflow-hidden">
            <div
              className="h-[3px] bg-green-DEFAULT rounded-full"
              style={{ width: `${confidencePct}%` }}
            />
          </div>
          <div className="font-mono text-[11px] font-medium text-green-DEFAULT w-8 text-right">
            {confidencePct}%
          </div>
        </div>

        {/* Evidence files */}
        {adr.evidenceFiles.length > 0 && (
          <div className="mb-3">
            <div className="font-mono text-[9px] font-medium tracking-widest uppercase text-ink3 mb-2">
              Evidence
            </div>
            <div className="flex flex-wrap gap-1.5">
              {adr.evidenceFiles.map((f) => (
                <a
                  key={f.path}
                  href={f.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[10px] bg-surface border border-border rounded px-2 py-0.5 text-ink2 hover:text-green-DEFAULT hover:border-green-mid transition-colors"
                >
                  {f.path}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Archaeology panel */}
        {adr.archaeologyEvidence.length > 0 && (
          <ArchaeologyPanel findings={adr.archaeologyEvidence} />
        )}
      </div>
    </div>
  )
}
