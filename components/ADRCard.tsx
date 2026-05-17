'use client'

import { useState, useEffect } from 'react'
import { ADR } from '@/lib/types'
import Badge from '@/components/ui/Badge'
import Tag from '@/components/ui/Tag'

interface ADRCardProps {
  adr: ADR
  defaultExpanded?: boolean
}

export default function ADRCard({ adr, defaultExpanded = false }: ADRCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [archaeologyPulse, setArchaeologyPulse] = useState(false)
  const adrNumber = `ADR-${adr.id.replace('adr-', '').padStart(3, '0')}`

  useEffect(() => {
    if (adr.archaeology && adr.archaeology.length > 0) {
      setArchaeologyPulse(true)
      const timer = setTimeout(() => setArchaeologyPulse(false), 400)
      return () => clearTimeout(timer)
    }
  }, [adr.archaeology])

  return (
    <div className="animate-fadeInUp mb-4 overflow-hidden rounded-xl border border-white/10 bg-[#071022]/80 shadow-xl shadow-black/20">
      <div
        onClick={() => setExpanded(!expanded)}
        className="cursor-pointer bg-gradient-to-r from-white/[0.06] to-white/[0.02] p-5 transition hover:bg-white/[0.07]"
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-xs text-cyan-200">{adrNumber}</span>
          <Badge status={adr.status} />
        </div>

        <h3 className="my-2 text-xl font-semibold text-white">{adr.title}</h3>

        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <Tag label={adr.category} variant="default" />
            <span className="text-xs text-[var(--color-text3)]">{adr.confidence}% confidence</span>
            <span className="text-xs text-[var(--color-text3)]">- {adr.inferredDate}</span>
          </div>
          <span className="text-sm text-[var(--color-text3)]">{expanded ? 'Collapse' : 'Expand'}</span>
        </div>
      </div>

      {!expanded && (
        <div className="bg-[#071022] px-5 py-4">
          <p className="text-xs italic text-[var(--color-text3)]">
            {adr.context.substring(0, 100)}...
          </p>
        </div>
      )}

      {expanded && (
        <div className="border-t border-white/10 bg-[#071022] p-6">
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[var(--color-text3)]">
                Context
              </div>
              <p className="text-[13px] leading-relaxed text-[var(--color-text2)]">{adr.context}</p>
            </div>

            <div>
              <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[var(--color-text3)]">
                Decision
              </div>
              <p className="text-[13px] leading-relaxed text-[var(--color-text2)]">{adr.decision}</p>
            </div>

            <div>
              <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[var(--color-text3)]">
                Consequences
              </div>
              <div className="space-y-2">
                {adr.consequences.positive.map((item, idx) => (
                  <p key={`pos-${idx}`} className="text-[13px] leading-relaxed text-[var(--color-text2)]">
                    <span className="text-[var(--color-green)]">+ </span>
                    {item}
                  </p>
                ))}
                {adr.consequences.negative.map((item, idx) => (
                  <p key={`neg-${idx}`} className="text-[13px] leading-relaxed text-[var(--color-text2)]">
                    <span className="text-[var(--color-red)]">- </span>
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {adr.alternatives.length > 0 && (
            <div className="mb-6 border-t border-white/10 pt-6">
              <div className="mb-3 text-[10px] font-medium uppercase tracking-wider text-[var(--color-text3)]">
                Alternatives considered
              </div>
              <div className="space-y-2">
                {adr.alternatives.map((alt, idx) => (
                  <p key={idx} className="text-xs text-[var(--color-text2)]">
                    {alt.option}: {alt.reason}
                  </p>
                ))}
              </div>
            </div>
          )}

          {adr.archaeology && adr.archaeology.length > 0 && (
            <div className={`my-4 rounded-lg border border-indigo-300/25 bg-indigo-300/10 p-4 ${archaeologyPulse ? 'archaeology-pulse' : ''}`}>
              <div className="mb-2 text-[13px] font-semibold text-indigo-100">
                Rejected alternative discovered
              </div>
              {adr.archaeology.map((item, idx) => (
                <div key={idx} className="mt-3 first:mt-0">
                  <div className="mb-1 text-[13px] font-medium text-indigo-100">{item.option}</div>
                  <div className="my-1 inline-block rounded bg-[#050814] px-2 py-1 font-mono text-[11px]">
                    {item.evidenceFile}
                  </div>
                  <div className="ml-2 inline-block">
                    <Tag label={item.evidenceType} variant="purple" />
                  </div>
                  <p className="mt-1 text-xs italic text-[var(--color-text2)]">
                    {item.rejectionReason}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-white/10 pt-6">
            <div className="mb-3 text-[10px] font-medium uppercase tracking-wider text-[var(--color-text3)]">
              Evidence trail
            </div>
            <div className="flex flex-wrap gap-2">
              {adr.evidenceFiles.map((file, idx) => (
                <span
                  key={idx}
                  className="inline-block rounded border border-white/10 bg-[#050814] px-2 py-1 font-mono text-[10px] text-[var(--color-text3)]"
                >
                  {file}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.3s ease;
        }
        @keyframes archaeologyPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        .archaeology-pulse {
          animation: archaeologyPulse 0.4s ease;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-fadeInUp,
          .archaeology-pulse {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
