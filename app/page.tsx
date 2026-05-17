'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { AnalyzeRequest } from '@/lib/types'
import Button from '@/components/ui/Button'

const FOCUS_AREAS = [
  'Infrastructure',
  'Database',
  'Auth',
  'Caching',
  'Structure',
  'Testing',
  'Communication',
  'Error handling',
]

export default function Home() {
  const router = useRouter()
  const [repoUrl, setRepoUrl] = useState('')
  const [pathFilter, setPathFilter] = useState('')
  const [focusAreas, setFocusAreas] = useState<string[]>([])
  const [validationStatus, setValidationStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle')
  const [validationData, setValidationData] = useState<{ language?: string; fileCount?: number; error?: string }>({})

  // Wake up the Render backend on mount
  useEffect(() => {
    api.ping()
  }, [])

  const handleValidateRepo = async (url: string) => {
    if (!url) {
      setValidationStatus('idle')
      return
    }

    setValidationStatus('loading')
    try {
      const result = await api.validateRepo(url)
      if (result.valid) {
        setValidationStatus('valid')
        setValidationData({ language: result.language, fileCount: result.fileCount })
      } else {
        setValidationStatus('invalid')
        setValidationData({ error: result.error || 'Invalid repository URL' })
      }
    } catch (error) {
      setValidationStatus('invalid')
      setValidationData({ error: 'Failed to validate repository' })
    }
  }

  const toggleFocusArea = (area: string) => {
    setFocusAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    )
  }

  const handleAnalyze = () => {
    const request: AnalyzeRequest = {
      repoUrl,
      pathFilter: pathFilter || undefined,
      focusAreas: focusAreas.length > 0 ? focusAreas : undefined,
    }
    sessionStorage.setItem('analyzeRequest', JSON.stringify(request))
    router.push('/results')
  }

  const handleDemo = () => {
    router.push('/results?demo=true')
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-[640px] mx-auto px-6 py-20">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-5xl font-light tracking-tight mb-4">
            ADR Archaeologist
          </h1>
          <p className="text-[var(--color-text2)] text-[17px] mb-3">
            Recovers the architectural decisions your team never wrote down.
          </p>
          <p className="text-[var(--color-text3)] text-[13px]">
            Powered by IBM Bob · Groq · Full repository context
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Field 1: Repo URL */}
          <div>
            <label className="block text-sm font-medium mb-2">
              GitHub repository URL
            </label>
            <div className="relative">
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onBlur={(e) => handleValidateRepo(e.target.value)}
                placeholder="https://github.com/django/django"
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-green)]"
              />
              {validationStatus === 'loading' && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            {validationStatus === 'valid' && (
              <div className="flex items-center gap-2 mt-2 text-[var(--color-green)] text-sm">
                <span>✓</span>
                <span>
                  {validationData.language} · {validationData.fileCount} files
                </span>
              </div>
            )}
            {validationStatus === 'invalid' && (
              <div className="flex items-center gap-2 mt-2 text-[var(--color-red)] text-sm">
                <span>✗</span>
                <span>{validationData.error}</span>
              </div>
            )}
          </div>

          {/* Field 2: Path Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Scope to subdirectory (optional)
            </label>
            <input
              type="text"
              value={pathFilter}
              onChange={(e) => setPathFilter(e.target.value)}
              placeholder="e.g. django/db/ or src/"
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-green)]"
            />
            <p className="text-[var(--color-text3)] text-xs mt-2">
              Leave empty to analyse the full repository
            </p>
          </div>

          {/* Field 3: Focus Areas */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Focus areas (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {FOCUS_AREAS.map((area) => (
                <button
                  key={area}
                  onClick={() => toggleFocusArea(area)}
                  className={`px-[14px] py-1 rounded-[20px] text-xs border transition-all cursor-pointer ${
                    focusAreas.includes(area)
                      ? 'border-[var(--color-green)] bg-[var(--color-green-bg)] text-[var(--color-green)]'
                      : 'border-[var(--color-border)] text-[var(--color-text2)] hover:border-[var(--color-text3)]'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          {/* Analyze Button */}
          <Button
            onClick={handleAnalyze}
            variant="primary"
            disabled={validationStatus !== 'valid' || !repoUrl}
          >
            Generate ADRs
          </Button>
        </div>

        {/* Demo Section */}
        <div className="mt-12">
          <div className="border-t border-[var(--color-border)] my-8" />
          <p className="text-[var(--color-text3)] text-[13px] mb-3">
            Or see it in action
          </p>
          <Button onClick={handleDemo} variant="secondary">
            Try with django/django →
          </Button>
          <p className="text-[var(--color-text3)] text-[11px] mt-3">
            Loads instantly — uses pre-generated output from IBM Bob IDE
          </p>
        </div>
      </div>
    </div>
  )
}

// Made with Bob
