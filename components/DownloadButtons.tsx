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
      
      // Add each ADR file
      pkg.adrs.forEach((adr) => {
        zip.file(`docs/adr/${adr.filename}`, adr.markdownContent)
      })
      
      // Add README/index
      zip.file('docs/adr/README.md', pkg.indexContent)
      
      // Generate and download
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
      const result = await api.createPR(prToken, pkg.metadata.repoUrl, pkg.adrs)
      setPrResult(result)
      if (result.prUrl) {
        setPrModalOpen(false)
        setPrToken('') // Clear token after success
      }
    } catch (error) {
      setPrResult({ error: 'Failed to create PR. Please check your token and try again.' })
    } finally {
      setPrLoading(false)
    }
  }

  return (
    <div>
      {/* Buttons Row */}
      <div className="flex gap-3 mb-4">
        <Button onClick={handleDownloadZip} variant="secondary" loading={zipLoading}>
          Download ZIP
        </Button>
        <Button onClick={() => setPrModalOpen(true)} variant="secondary">
          Open as GitHub PR
        </Button>
      </div>

      {/* PR Modal */}
      {prModalOpen && (
        <div className="min-h-[400px] bg-black/80 flex items-center justify-center rounded-[10px] p-8">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[10px] p-6 max-w-[400px] w-full">
            <h3 className="text-lg font-medium mb-3">Create GitHub Pull Request</h3>
            
            <p className="text-[var(--color-text3)] text-xs mb-4">
              Your token is used only to create this PR and is never stored on our servers.
            </p>
            
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[var(--color-green)] hover:underline block mb-3"
            >
              Create a token at github.com/settings/tokens (needs repo scope)
            </a>
            
            <input
              type="password"
              value={prToken}
              onChange={(e) => setPrToken(e.target.value)}
              placeholder="ghp_your_token_here"
              className="w-full bg-[#0D0D0D] border border-[var(--color-border)] rounded-lg px-4 py-3 text-sm my-3 focus:outline-none focus:border-[var(--color-green)]"
            />
            
            {/* Modal Result Display */}
            {prResult && prModalOpen && (
              <div className="mb-4">
                {prResult.prUrl ? (
                  <div className="bg-[var(--color-green-bg)] border border-[var(--color-green)] rounded-lg p-3">
                    <a
                      href={prResult.prUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-green)] text-sm hover:underline"
                    >
                      PR created! View on GitHub →
                    </a>
                  </div>
                ) : (
                  <div className="bg-[var(--color-red-bg)] border border-[var(--color-red)] rounded-lg p-3">
                    <p className="text-[var(--color-red)] text-sm">{prResult.error}</p>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex gap-3">
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

      {/* Post-Modal Result Banner */}
      {prResult && !prModalOpen && (
        <div className="mt-4">
          {prResult.prUrl ? (
            <div className="bg-[var(--color-green-bg)] border border-[var(--color-green)] rounded-lg p-3">
              <a
                href={prResult.prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-green)] text-sm hover:underline"
              >
                ✓ PR created! View on GitHub →
              </a>
            </div>
          ) : (
            <div className="bg-[var(--color-red-bg)] border border-[var(--color-red)] rounded-lg p-3">
              <p className="text-[var(--color-red)] text-sm">{prResult.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Made with Bob
