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

const TRUST_PILLS = ['Repository-aware', 'Evidence-backed', 'ADR automation', 'Developer-first']

const WORKFLOW = [
  {
    step: '01',
    title: 'Scan repository',
    copy: 'Connect a GitHub repository and scope the analysis to the code paths that matter.',
  },
  {
    step: '02',
    title: 'Detect architectural decisions',
    copy: 'Repository context surfaces choices across auth, data, APIs, tests, and deployment.',
  },
  {
    step: '03',
    title: 'Generate clean ADRs',
    copy: 'Export polished MADR-style records with context, decision, consequences, and evidence trails.',
  },
]

const DETECTED_DECISIONS = ['Auth', 'Database', 'API structure', 'Testing', 'Deployment']

const WIN_POINTS = [
  'Solves documentation debt',
  'Uses full repository context',
  'Helps onboarding and audits',
  'Converts code archaeology into reusable ADRs',
]

export default function Home() {
  const router = useRouter()
  const [repoUrl, setRepoUrl] = useState('')
  const [pathFilter, setPathFilter] = useState('')
  const [focusAreas, setFocusAreas] = useState<string[]>([])
  const [validationStatus, setValidationStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle')
  const [validationData, setValidationData] = useState<{ language?: string; fileCount?: number; error?: string }>({})

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

  const handleSample = () => {
    router.push('/results?sample=true')
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text)]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,98,254,0.22),transparent_30%),radial-gradient(circle_at_75%_10%,rgba(69,137,255,0.16),transparent_28%),linear-gradient(180deg,rgba(2,6,23,0),#050814_70%)]" />
      <div className="relative">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050814]/80 backdrop-blur-xl">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-3 text-left"
              aria-label="ADR-Archeologist home"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-300/30 bg-cyan-300/10 font-mono text-sm font-semibold text-cyan-200">
                ADR
              </span>
              <span>
                <span className="block text-sm font-semibold tracking-wide text-white">ADR-Archeologist</span>
                <span className="block text-[11px] uppercase tracking-[0.24em] text-[var(--color-text3)]">Architecture intelligence</span>
              </span>
            </button>

            <div className="hidden items-center gap-7 text-sm text-[var(--color-text2)] md:flex">
              <a className="transition hover:text-white" href="#sample">Sample</a>
              <a className="transition hover:text-white" href="#features">Features</a>
              <a className="transition hover:text-white" href="#workflow">How it works</a>
            </div>

            <a
              href="https://github.com/sidhesh0706/ADR-Archeologist"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:border-cyan-300/45 hover:bg-cyan-300/10"
            >
              GitHub
            </a>
          </nav>
        </header>

        <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-14 sm:px-8 lg:grid-cols-[1.04fr_0.96fr] lg:pb-24 lg:pt-20">
          <div className="flex flex-col justify-center">
            <div className="mb-6 flex flex-wrap gap-2">
              {TRUST_PILLS.map((pill) => (
                <span
                  key={pill}
                  className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.08] px-3 py-1 text-xs font-medium text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.08)]"
                >
                  {pill}
                </span>
              ))}
            </div>

            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-normal text-white sm:text-6xl lg:text-7xl">
              Turn Codebases Into Architecture Decisions
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-text2)]">
              ADR-Archeologist uses repository-aware analysis to uncover hidden architecture choices and generate professional ADRs.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button onClick={handleAnalyze} variant="primary" disabled={validationStatus !== 'valid' || !repoUrl}>
                Generate ADRs
              </Button>
              <Button onClick={handleSample} variant="secondary">
                View Sample
              </Button>
            </div>
          </div>

          <div className="glass-panel relative rounded-xl p-5 shadow-2xl shadow-blue-950/40 sm:p-6" id="sample">
            <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">Repository intake</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Generate ADRs</h2>
              </div>
              <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200">
                Ready
              </span>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  GitHub repository URL
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    onBlur={(e) => handleValidateRepo(e.target.value)}
                    placeholder="https://github.com/django/django"
                    className="w-full rounded-lg border border-white/10 bg-[#090f1f]/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-4 focus:ring-cyan-300/10"
                  />
                  {validationStatus === 'loading' && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-200 border-t-transparent" />
                    </div>
                  )}
                </div>
                {validationStatus === 'valid' && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-emerald-300">
                    <span aria-hidden="true">OK</span>
                    <span>
                      {validationData.language} / {validationData.fileCount} files
                    </span>
                  </div>
                )}
                {validationStatus === 'invalid' && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-red-300">
                    <span aria-hidden="true">!</span>
                    <span>{validationData.error}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Scope to subdirectory
                </label>
                <input
                  type="text"
                  value={pathFilter}
                  onChange={(e) => setPathFilter(e.target.value)}
                  placeholder="e.g. django/db/ or src/"
                  className="w-full rounded-lg border border-white/10 bg-[#090f1f]/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-4 focus:ring-cyan-300/10"
                />
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-white">
                  Focus areas
                </label>
                <div className="flex flex-wrap gap-2">
                  {FOCUS_AREAS.map((area) => (
                    <button
                      key={area}
                      onClick={() => toggleFocusArea(area)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        focusAreas.includes(area)
                          ? 'border-cyan-300/60 bg-cyan-300/15 text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.12)]'
                          : 'border-white/10 bg-white/[0.03] text-[var(--color-text2)] hover:border-cyan-300/35 hover:text-white'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8" id="workflow">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">Workflow</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">From repository noise to ADR signal</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[var(--color-text2)]">
              A clean three-stage story judges can understand quickly, with enough depth for engineering reviewers.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {WORKFLOW.map((item) => (
              <article key={item.step} className="glass-panel rounded-xl p-5 transition hover:-translate-y-1 hover:border-cyan-300/35">
                <span className="font-mono text-xs text-cyan-200">{item.step}</span>
                <h3 className="mt-5 text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--color-text2)]">{item.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-5 py-12 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]" id="features">
          <div className="glass-panel rounded-xl p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">Repository scan</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">django/django</h2>
              </div>
              <div className="text-right">
                <p className="font-mono text-2xl text-white">1,248</p>
                <p className="text-xs text-[var(--color-text3)]">files indexed</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                ['Python', '62%'],
                ['Tests', '21%'],
                ['Config', '9%'],
                ['Docs', '8%'],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="mb-2 flex justify-between text-xs text-[var(--color-text2)]">
                    <span>{label}</span>
                    <span>{value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5">
                    <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-300" style={{ width: value }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-lg border border-white/10 bg-[#060b18] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text3)]">Detected decisions</p>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {DETECTED_DECISIONS.map((decision) => (
                  <div key={decision} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                    <span className="text-sm text-white">{decision}</span>
                    <span className="h-2 w-2 rounded-full bg-cyan-300" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-6">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">ADR preview</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Use middleware for request policy</h2>
              </div>
              <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                94% confidence
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                ['Context', 'Authentication, request validation, and security headers appear before route handlers across the codebase.'],
                ['Decision', 'Centralize request policy in middleware to keep handlers focused on domain behavior.'],
                ['Consequences', 'Improves consistency and auditability, while requiring careful middleware ordering.'],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-lg border border-white/10 bg-[#060b18]/90 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">{title}</p>
                  <p className="mt-3 text-sm leading-6 text-[var(--color-text2)]">{copy}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-lg border border-indigo-300/20 bg-indigo-300/[0.07] p-4">
              <p className="text-sm font-medium text-indigo-100">Evidence trail</p>
              <p className="mt-2 font-mono text-xs leading-6 text-[var(--color-text2)]">
                middleware.py, settings.py, tests/auth/test_middleware.py, deploy/render.yaml
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          <div className="glass-panel rounded-xl p-6 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">Why it wins</p>
                <h2 className="mt-3 text-3xl font-semibold text-white">A product story with real engineering gravity</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {WIN_POINTS.map((point) => (
                  <div key={point} className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm font-medium text-white">
                    {point}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 px-5 py-8 sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm text-[var(--color-text3)] md:flex-row md:items-center">
            <p>ADR-Archeologist - code archaeology for reusable architecture decision records.</p>
            <div className="flex gap-5">
              <a className="transition hover:text-white" href="#sample">Sample</a>
              <a className="transition hover:text-white" href="#features">Features</a>
              <a className="transition hover:text-white" href="#workflow">How it works</a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
