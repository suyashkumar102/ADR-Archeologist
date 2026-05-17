'use client'

import { useState } from 'react'
import JSZip from 'jszip'
import { api } from '@/lib/api'
import { ADRPackage } from '@/lib/types'
import Button from '@/components/ui/Button'

interface DownloadButtonsProps {
  pkg: ADRPackage
}

export default function DownloadButtons({ pkg }: DownloadButtonsProps) {
  const [zipLoading, setZipLoading] = useState(false)
  const [prToken, setPrToken] = useState('')
  const [prModalOpen, setPrModalOpen] = useState(false)
  const [prLoading, setPrLoading] = useState(false)
  const [prResult, setPrResult] = useState<{ prUrl?: string; error?: string } | null>(null)

  const handleDownloadZip = async () => {
    setZipLoading(true)
    try {
      const zip = new JSZip()
      pkg.adrs.forEach((adr) => {
        zip.file(`docs/adr/${adr.filename}`, adr.markdownContent)
      })
      zip.file('docs/adr/README.md', pkg.indexContent)

      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `adr-${pkg.repoName.replace('/', '_')}-${new Date().toISOString().slice(0, 10)}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to create ZIP:', error)
    } finally {
      setZipLoading(false)
    }
  }

  const handleCreatePR = async () => {
    if (!prToken.trim()) return

    setPrLoading(true)
    try {
      const result = await api.createPR(prToken, pkg.repoUrl, pkg.adrs)
      setPrResult(result)
      if (result.prUrl) {
        setPrModalOpen(false)
        setPrToken('')
      }
    } catch (error) {
      setPrResult({ error: 'Failed to create PR. Please check your token and try again.' })
    } finally {
      setPrLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Button onClick={handleDownloadZip} variant="secondary" loading={zipLoading}>
          Download ZIP
        </Button>
        <Button onClick={() => setPrModalOpen(true)} variant="secondary">
          Open as GitHub PR
        </Button>
      </div>

      {prModalOpen && (
        <div className="flex min-h-[400px] items-center justify-center rounded-xl bg-black/50 p-4 sm:p-8">
          <div className="glass-panel w-full max-w-[440px] rounded-xl p-6">
            <h3 className="mb-3 text-lg font-medium">Create GitHub Pull Request</h3>

            <p className="mb-4 text-xs text-[var(--color-text3)]">
              Your token is used only to create this PR and is never stored on our servers.
            </p>

            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="mb-3 block text-[11px] text-cyan-200 hover:underline"
            >
              Create a token at github.com/settings/tokens (needs repo scope)
            </a>

            <input
              type="password"
              value={prToken}
              onChange={(e) => setPrToken(e.target.value)}
              placeholder="ghp_your_token_here"
              className="my-3 w-full rounded-lg border border-white/10 bg-[#050814] px-4 py-3 text-sm outline-none transition focus:border-cyan-300/60"
            />

            {prResult && prModalOpen && (
              <div className="mb-4">
                {prResult.prUrl ? (
                  <div className="rounded-lg border border-emerald-300/25 bg-emerald-300/10 p-3">
                    <a
                      href={prResult.prUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-emerald-200 hover:underline"
                    >
                      PR created. View on GitHub
                    </a>
                  </div>
                ) : (
                  <div className="rounded-lg border border-red-300/25 bg-red-300/10 p-3">
                    <p className="text-sm text-red-200">{prResult.error}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => setPrModalOpen(false)} variant="ghost">
                Cancel
              </Button>
              <Button
                onClick={handleCreatePR}
                variant="primary"
                loading={prLoading}
                disabled={!prToken.trim()}
              >
                Create PR
              </Button>
            </div>
          </div>
        </div>
      )}

      {prResult && !prModalOpen && (
        <div className="mt-4">
          {prResult.prUrl ? (
            <div className="rounded-lg border border-emerald-300/25 bg-emerald-300/10 p-3">
              <a
                href={prResult.prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-emerald-200 hover:underline"
              >
                PR created. View on GitHub
              </a>
            </div>
          ) : (
            <div className="rounded-lg border border-red-300/25 bg-red-300/10 p-3">
              <p className="text-sm text-red-200">{prResult.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
