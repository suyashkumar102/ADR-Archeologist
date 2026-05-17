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

  // Pulse archaeology banner on mount if it exists
  useEffect(() => {
    if (adr.archaeology && adr.archaeology.length > 0) {
      setArchaeologyPulse(true)
      const timer = setTimeout(() => setArchaeologyPulse(false), 400)
      return () => clearTimeout(timer)
    }
  }, [adr.archaeology])

  return (
    <div className="border border-[var(--color-border)] rounded-[10px] overflow-hidden mb-3 animate-fadeInUp">
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        className={`bg-[#0D0D0D] p-[14px_18px] cursor-pointer ${
          expanded ? 'rounded-t-[10px]' : 'rounded-[10px]'
        }`}
      >
        {/* Row 1: Number and Badge */}
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[11px] text-[var(--color-text3)]">{adrNumber}</span>
          <Badge status={adr.status} />
        </div>

        {/* Row 2: Title */}
        <h3 className="text-base font-medium text-white my-[6px]">{adr.title}</h3>

        {/* Row 3: Category, Confidence, Date, Chevron */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag label={adr.category} variant="default" />
            <span className="text-[11px] text-[var(--color-text3)] ml-2">
              {adr.confidence}% confidence
            </span>
            <span className="text-[11px] text-[var(--color-text3)]">· {adr.inferredDate}</span>
          </div>
          <span className="text-[var(--color-text3)]">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Collapsed Preview */}
      {!expanded && (
        <div className="bg-[var(--color-surface)] rounded-b-[10px] p-[10px_18px]">
          <p className="text-xs text-[var(--color-text3)] italic">
            {adr.context.substring(0, 100)}...
          </p>
        </div>
      )}

      {/* Expanded Content */}
      {expanded && (
        <div className="bg-[var(--color-surface)] border-t border-[var(--color-border)] rounded-b-[10px] p-6">
          {/* Three Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Column 1: Context */}
            <div>
              <div className="text-[10px] font-medium tracking-wider uppercase text-[var(--color-text3)] mb-2">
                CONTEXT
              </div>
              <p className="text-[13px] text-[var(--color-text2)] leading-relaxed">{adr.context}</p>
            </div>

            {/* Column 2: Decision */}
            <div>
              <div className="text-[10px] font-medium tracking-wider uppercase text-[var(--color-text3)] mb-2">
                DECISION
              </div>
              <p className="text-[13px] text-[var(--color-text2)] leading-relaxed">{adr.decision}</p>
            </div>

            {/* Column 3: Consequences */}
            <div>
              <div className="text-[10px] font-medium tracking-wider uppercase text-[var(--color-text3)] mb-2">
                CONSEQUENCES
              </div>
              <div className="space-y-2">
                {adr.consequences.positive.map((item, idx) => (
                  <p key={`pos-${idx}`} className="text-[13px] text-[var(--color-text2)] leading-relaxed">
                    <span className="text-[var(--color-green)]">✓ </span>
                    {item}
                  </p>
                ))}
                {adr.consequences.negative.map((item, idx) => (
                  <p key={`neg-${idx}`} className="text-[13px] text-[var(--color-text2)] leading-relaxed">
                    <span className="text-[var(--color-red)]">× </span>
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Alternatives Section */}
          {adr.alternatives.length > 0 && (
            <div className="border-t border-[var(--color-border)] pt-6 mb-6">
              <div className="text-[10px] font-medium tracking-wider uppercase text-[var(--color-text3)] mb-3">
                ALTERNATIVES CONSIDERED
              </div>
              <div className="space-y-2">
                {adr.alternatives.map((alt, idx) => (
                  <p key={idx} className="text-xs text-[var(--color-text2)]">
                    — {alt.option}: {alt.reason}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Archaeology Section - THE STAR OF THE SHOW */}
          {adr.archaeology && adr.archaeology.length > 0 && (
            <div className={`bg-[var(--color-purple-bg)] border border-[var(--color-purple)] rounded-lg p-[12px_16px] my-4 ${archaeologyPulse ? 'archaeology-pulse' : ''}`}>
              <div className="text-[var(--color-purple)] text-[13px] font-semibold mb-2">
                🏛️ Rejected alternative discovered
              </div>
              {adr.archaeology.map((item, idx) => (
                <div key={idx} className="mt-3 first:mt-0">
                  <div className="text-[13px] font-medium text-[var(--color-purple)] mb-1">
                    {item.option}
                  </div>
                  <div className="inline-block bg-[#0D0D0D] font-mono text-[11px] px-[7px] py-[2px] rounded my-1">
                    {item.evidenceFile}
                  </div>
                  <div className="inline-block ml-2">
                    <Tag label={item.evidenceType} variant="purple" />
                  </div>
                  <p className="text-xs text-[var(--color-text2)] italic mt-1">
                    {item.rejectionReason}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Evidence Trail */}
          <div className="border-t border-[var(--color-border)] pt-6">
            <div className="text-[10px] font-medium tracking-wider uppercase text-[var(--color-text3)] mb-3">
              EVIDENCE TRAIL
            </div>
            <div className="flex flex-wrap gap-2">
              {adr.evidenceFiles.map((file, idx) => (
                <span
                  key={idx}
                  className="inline-block bg-[#0D0D0D] border border-[var(--color-border)] rounded px-[9px] py-[3px] font-mono text-[10px] text-[var(--color-text3)]"
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

// Made with Bob
