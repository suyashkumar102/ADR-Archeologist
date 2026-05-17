'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { ADRPackage, AnalyzeRequest } from '@/lib/types'
import PipelineProgress from '@/components/PipelineProgress'
import ADRCard from '@/components/ADRCard'
import DownloadButtons from '@/components/DownloadButtons'
import Button from '@/components/ui/Button'
import { SAMPLE_ADR_PACKAGE } from '@/scripts/sample-fixture'

type Phase = 'loading' | 'done' | 'error'
type SortBy = 'confidence' | 'category' | 'date'

interface ResultsViewProps {
  initialSample?: boolean
}

export default function ResultsView({ initialSample = false }: ResultsViewProps) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>(initialSample ? 'done' : 'loading')
  const [pkg, setPkg] = useState<ADRPackage | null>(initialSample ? SAMPLE_ADR_PACKAGE : null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortBy>('confidence')
  const [request, setRequest] = useState<AnalyzeRequest | null>(null)
  const [isSample, setIsSample] = useState(initialSample)

  useEffect(() => {
    api.ping()

    if (initialSample) {
      return
    }

    const params = new URLSearchParams(window.location.search)
    const sampleMode = params.get('sample') === 'true'
    setIsSample(sampleMode)

    if (sampleMode) {
      setPkg(SAMPLE_ADR_PACKAGE)
      setPhase('done')
      return
    }

    const stored = sessionStorage.getItem('analyzeRequest')
    if (!stored) {
      router.push('/')
      return
    }

    setRequest(JSON.parse(stored) as AnalyzeRequest)
    setPhase('loading')
  }, [initialSample, router])

  const handleComplete = useCallback((completedPkg: ADRPackage) => {
    setPkg(completedPkg)
    setPhase('done')
  }, [])

  const handleError = useCallback((msg: string) => {
    setErrorMessage(msg)
    setPhase('error')
  }, [])

  const categories = pkg ? Array.from(new Set(pkg.adrs.map(adr => adr.category))) : []

  const getFilteredAndSortedADRs = () => {
    if (!pkg) return []
    const filtered = activeFilter === 'all'
      ? pkg.adrs
      : pkg.adrs.filter(adr => adr.category === activeFilter)
    const sorted = [...filtered]

    switch (sortBy) {
      case 'confidence':
        sorted.sort((a, b) => b.confidence - a.confidence)
        break
      case 'category':
        sorted.sort((a, b) => a.category.localeCompare(b.category))
        break
      case 'date':
        sorted.sort((a, b) => a.inferredDate.localeCompare(b.inferredDate))
        break
    }

    return sorted
  }

  const filteredADRs = getFilteredAndSortedADRs()

  if (phase === 'loading' && request) {
    return (
      <main className="min-h-screen bg-[var(--color-bg)] text-white">
        <div className="enterprise-grid min-h-screen">
          <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
            <button
              onClick={() => router.push('/')}
              className="mb-8 text-sm text-[var(--color-text2)] transition hover:text-white"
            >
              Back to intake
            </button>
            <PipelineProgress request={request} onComplete={handleComplete} onError={handleError} />
            <div className="mt-8 space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-32 animate-shimmer rounded-xl border border-white/10 bg-gradient-to-r from-[#071022] via-[#112447] to-[#071022]"
                  style={{ backgroundSize: '200% 100%' }}
                />
              ))}
            </div>
          </div>
        </div>
        <style jsx>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .animate-shimmer {
            animation: shimmer 2s ease-in-out infinite;
          }
          @media (prefers-reduced-motion: reduce) {
            .animate-shimmer {
              animation: none;
            }
          }
        `}</style>
      </main>
    )
  }

  if (phase === 'error') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-5 text-white">
        <div className="glass-panel w-full max-w-md rounded-xl p-6">
          <p className="mb-4 text-sm text-red-300">{errorMessage}</p>
          <Button onClick={() => router.push('/')} variant="secondary">Try again</Button>
        </div>
      </main>
    )
  }

  if (phase === 'done' && pkg) {
    const archaeologyCount = pkg.archaeologyCount || 0

    return (
      <main className="min-h-screen bg-[var(--color-bg)] text-white">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,98,254,0.18),transparent_32%),linear-gradient(180deg,rgba(2,6,23,0),#050814_72%)]" />
        <div className="relative mx-auto max-w-6xl px-5 py-8 sm:px-8">
          <header className="mb-8 flex flex-col justify-between gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end">
            <div>
              <button onClick={() => router.push('/')} className="mb-5 text-sm text-[var(--color-text2)] transition hover:text-white">
                ADR-Archeologist
              </button>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">Generated package</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-normal text-white sm:text-5xl">
                Architecture decisions for {pkg.repoName}
              </h1>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="glass-panel rounded-xl px-4 py-3">
                <p className="font-mono text-2xl">{pkg.adrs.length}</p>
                <p className="text-xs text-[var(--color-text3)]">ADRs</p>
              </div>
              <div className="glass-panel rounded-xl px-4 py-3">
                <p className="font-mono text-2xl text-indigo-200">{archaeologyCount}</p>
                <p className="text-xs text-[var(--color-text3)]">Discoveries</p>
              </div>
              <div className="glass-panel col-span-2 rounded-xl px-4 py-3 sm:col-span-1">
                <p className="font-mono text-2xl text-cyan-200">{categories.length}</p>
                <p className="text-xs text-[var(--color-text3)]">Categories</p>
              </div>
            </div>
          </header>

          {isSample && (
            <div className="mb-6 rounded-lg border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
              Sample output generated from repository analysis.
            </div>
          )}

          <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setActiveFilter('all')}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm transition ${
                  activeFilter === 'all'
                    ? 'border-cyan-300/55 bg-cyan-300/15 text-cyan-100'
                    : 'border-white/10 bg-white/[0.03] text-[var(--color-text2)] hover:text-white'
                }`}
              >
                All ({pkg.adrs.length})
              </button>
              {categories.map(category => {
                const count = pkg.adrs.filter(adr => adr.category === category).length
                return (
                  <button
                    key={category}
                    onClick={() => setActiveFilter(category)}
                    className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm transition ${
                      activeFilter === category
                        ? 'border-cyan-300/55 bg-cyan-300/15 text-cyan-100'
                        : 'border-white/10 bg-white/[0.03] text-[var(--color-text2)] hover:text-white'
                    }`}
                  >
                    {category} ({count})
                  </button>
                )
              })}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="rounded-lg border border-white/10 bg-[#090f1f] px-3 py-2 text-sm text-[var(--color-text2)] outline-none transition focus:border-cyan-300/60"
            >
              <option value="confidence">By confidence</option>
              <option value="category">By category</option>
              <option value="date">By date</option>
            </select>
          </div>

          {filteredADRs.length > 0 ? (
            <div className="mb-8 space-y-4">
              {filteredADRs.map((adr, index) => (
                <ADRCard key={adr.id} adr={adr} defaultExpanded={index === 0} />
              ))}
            </div>
          ) : (
            <div className="glass-panel rounded-xl py-12 text-center">
              <p className="mb-4 text-[var(--color-text3)]">No ADRs in this category.</p>
              <Button onClick={() => setActiveFilter('all')} variant="secondary">Show all ADRs</Button>
            </div>
          )}

          <div className="glass-panel mb-10 rounded-xl p-5">
            <DownloadButtons pkg={pkg} />
          </div>
        </div>
      </main>
    )
  }

  return <main className="min-h-screen bg-[var(--color-bg)]" />
}
