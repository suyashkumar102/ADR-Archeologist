"use client"

import React, { useState } from "react"
import type { ADRPackage } from "@/types"
import { downloadZip } from "@/lib/export/zip"
import { createPR } from "@/lib/github/pr"

interface Props {
  pkg: ADRPackage
}

type ActionState = "idle" | "loading" | "success" | "error"

export default function ExportPanel({ pkg }: Props) {
  const [zipState, setZipState] = useState<ActionState>("idle")
  const [prState, setPrState] = useState<ActionState>("idle")
  const [prUrl, setPrUrl] = useState<string | null>(null)
  const [prError, setPrError] = useState<string | null>(null)
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [tokenInput, setTokenInput] = useState("")

  const handleDownloadZip = async () => {
    setZipState("loading")
    try {
      await downloadZip(pkg)
      setZipState("success")
      setTimeout(() => setZipState("idle"), 3000)
    } catch (err) {
      console.error(err)
      setZipState("error")
      setTimeout(() => setZipState("idle"), 3000)
    }
  }

  const handleOpenPR = () => {
    const stored = sessionStorage.getItem("github_pat")
    if (stored) {
      submitPR(stored)
    } else {
      setShowTokenModal(true)
    }
  }

  const submitPR = async (token: string) => {
    setShowTokenModal(false)
    setPrState("loading")
    setPrError(null)

    try {
      sessionStorage.setItem("github_pat", token)
      const url = await createPR(pkg, token)
      setPrUrl(url)
      setPrState("success")
    } catch (err) {
      setPrError(err instanceof Error ? err.message : "Failed to create PR")
      setPrState("error")
      setTimeout(() => setPrState("idle"), 5000)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 p-4 bg-surface border border-border rounded-xl">
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[9px] font-medium tracking-widest uppercase text-ink3 mb-1">
            Export
          </div>
          <p className="text-xs text-ink2">
            Download all {pkg.adrs.length} ADRs as MADR-format markdown files, or open a GitHub PR
            directly on the repository.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* ZIP download */}
          <button
            onClick={handleDownloadZip}
            disabled={zipState === "loading"}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors
              ${zipState === "success"
                ? "bg-green-light border-green-mid text-green-DEFAULT"
                : zipState === "error"
                ? "bg-danger-light border-danger-mid text-danger-DEFAULT"
                : "bg-surface border-border text-ink hover:bg-surface hover:border-green-mid"
              }
              disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {zipState === "loading" && (
              <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            )}
            {zipState === "success" ? "✓ Downloaded" : zipState === "error" ? "✕ Failed" : "↓ Download ZIP"}
          </button>

          {/* GitHub PR */}
          {prState === "success" && prUrl ? (
            <a
              href={prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-light border border-green-mid text-green-DEFAULT hover:opacity-80 transition-opacity"
            >
              ✓ View PR →
            </a>
          ) : (
            <button
              onClick={handleOpenPR}
              disabled={prState === "loading"}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors
                ${prState === "error"
                  ? "bg-danger-light border-danger-mid text-danger-DEFAULT"
                  : "bg-ink text-[#F0EFE9] border-ink hover:opacity-90"
                }
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {prState === "loading" && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {prState === "error" ? "✕ PR Failed" : "↗ Open GitHub PR"}
            </button>
          )}
        </div>
      </div>

      {prError && (
        <p className="mt-2 text-xs text-danger-DEFAULT font-medium px-1">{prError}</p>
      )}

      {/* GitHub PAT modal */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-[15px] font-semibold mb-2">GitHub Personal Access Token</h3>
            <p className="text-xs text-ink2 mb-4 leading-relaxed">
              A token with <code className="font-mono bg-surface border border-border rounded px-1">repo</code> scope is required to create a pull request.
              Your token is stored in browser session storage only and is never sent to our server.
            </p>
            <input
              type="password"
              value={tokenInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTokenInput(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2.5 rounded-lg border border-border font-mono text-sm bg-surface text-ink placeholder:text-ink3 outline-none focus:border-green-mid mb-4"
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter" && tokenInput.trim()) submitPR(tokenInput.trim()) }}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowTokenModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-ink2 hover:text-ink transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => tokenInput.trim() && submitPR(tokenInput.trim())}
                disabled={!tokenInput.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-green-DEFAULT text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create PR
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
