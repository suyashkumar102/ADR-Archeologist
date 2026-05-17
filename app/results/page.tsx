'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { ADRPackage, AnalyzeRequest } from '@/lib/types'
import PipelineProgress from '@/components/PipelineProgress'
import ADRCard from '@/components/ADRCard'
import DownloadButtons from '@/components/DownloadButtons'
import Button from '@/components/ui/Button'
import { DEMO_ADR_PACKAGE } from '@/scripts/demo-fixture'

type Phase = 'loading' | 'done' | 'error'
type SortBy = 'confidence' | 'category' | 'date'

export default function ResultsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [phase, setPhase] = useState<Phase>('loading')
  const [pkg, setPkg] = useState<ADRPackage | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortBy>('confidence')
  const [request, setRequest] = useState<AnalyzeRequest | null>(null)

  useEffect(() => {
    // Wake up backend
    api.ping()

    // Check for demo mode
    if (searchParams.get('demo') === 'true') {
      setPkg(DEMO_ADR_PACKAGE)
      setPhase('done')
      return
    }

    // Load analyze request from session storage
    const stored = sessionStorage.getItem('analyzeRequest')
    if (!stored) {
      router.push('/')
      return
    }

    const analyzeRequest: AnalyzeRequest = JSON.parse(stored)
    setRequest(analyzeRequest)
    setPhase('loading')
  }, [searchParams, router])

  const handleComplete = (completedPkg: ADRPackage) => {
    setPkg(completedPkg)
    setPhase('done')
  }

  const handleError = (msg: string) => {
    setErrorMessage(msg)
    setPhase('error')
  }

  // Get unique categories
  const categories = pkg ? Array.from(new Set(pkg.adrs.map(adr => adr.category))) : []

  // Filter and sort ADRs
  const getFilteredAndSortedADRs = () => {
    if (!pkg) return []

    let filtered = pkg.adrs
    if (activeFilter !== 'all') {
      filtered = filtered.filter(adr => adr.category === activeFilter)
    }

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

  // Loading phase
  if (phase === 'loading' && request) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-[560px] mx-auto px-6 py-12">
          <PipelineProgress
            request={request}
            onComplete={handleComplete}
            onError={handleError}
          />
          
          {/* Skeleton loaders */}
          <div className="mt-8 space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-32 bg-gradient-to-r from-[#0D0D0D] via-[#1A1A1A] to-[#0D0D0D] rounded-[10px] animate-shimmer"
                style={{ backgroundSize: '200% 100%' }}
              />
            ))}
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
      </div>
    )
  }

  // Error phase
  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-[var(--color-red-bg)] border border-[var(--color-red)] rounded-lg p-6">
          <p className="text-[var(--color-red)] text-sm mb-4">{errorMessage}</p>
          <Button onClick={() => router.push('/')} variant="secondary">
            ← Try again
          </Button>
        </div>
      </div>
    )
  }

  // Done phase
  if (phase === 'done' && pkg) {
    const isDemo = searchParams.get('demo') === 'true'
    const archaeologyCount = pkg.metadata.archaeologyCount || 0

    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-[900px] mx-auto px-6 py-8">
          {/* Stats Bar */}
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4 mb-5">
            <div className="flex items-center gap-6 text-[13px] text-[var(--color-text2)]">
              <span>{pkg.adrs.length} ADRs generated</span>
              <span className={archaeologyCount > 0 ? 'text-[var(--color-purple)]' : ''}>
                {archaeologyCount > 0 && '🏛️ '}
                {archaeologyCount} archaeology {archaeologyCount === 1 ? 'discovery' : 'discoveries'}
              </span>
            </div>
          </div>

          {/* Demo Banner */}
          {isDemo && (
            <div className="bg-[var(--color-amber-dim)] text-[var(--color-amber)] text-xs px-[14px] py-2 rounded-md mb-4">
              Demo mode — output generated by IBM Bob IDE using /adr generate command
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex items-center gap-4 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`whitespace-nowrap px-3 py-2 text-sm border-b-2 transition-colors ${
                activeFilter === 'all'
                  ? 'border-[var(--color-green)] text-[var(--color-green)]'
                  : 'border-transparent text-[var(--color-text3)] hover:text-[var(--color-text2)]'
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
                  className={`whitespace-nowrap px-3 py-2 text-sm border-b-2 transition-colors ${
                    activeFilter === category
                      ? 'border-[var(--color-green)] text-[var(--color-green)]'
                      : 'border-transparent text-[var(--color-text3)] hover:text-[var(--color-text2)]'
                  }`}
                >
                  {category} ({count})
                </button>
              )
            })}
          </div>

          {/* Sort Dropdown */}
          <div className="flex justify-end mb-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text2)] focus:outline-none focus:border-[var(--color-green)]"
            >
              <option value="confidence">By confidence ↓</option>
              <option value="category">By category</option>
              <option value="date">By date</option>
            </select>
          </div>

          {/* ADR Cards */}
          {filteredADRs.length > 0 ? (
            <div className="space-y-3 mb-8">
              {filteredADRs.map((adr, index) => (
                <ADRCard
                  key={adr.id}
                  adr={adr}
                  defaultExpanded={index === 0}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-[var(--color-text3)] mb-4">No ADRs in this category.</p>
              <Button onClick={() => setActiveFilter('all')} variant="secondary">
                Show all ADRs
              </Button>
            </div>
          )}

          {/* Download Buttons */}
          <div className="border-t border-[var(--color-border)] pt-6 mt-8">
            <DownloadButtons pkg={pkg} />
          </div>
        </div>
      </div>
    )
  }

  return null
}

// Made with Bob
