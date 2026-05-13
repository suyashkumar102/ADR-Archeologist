import type { ADR, ADRPackage } from "@/types"

// ─── Filename formatter ──────────────────────────────────────────────────────

export function toFilename(adr: ADR): string {
  const num = adr.id.replace("ADR-", "").padStart(4, "0")
  const slug = adr.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
  return `${num}-${slug}.md`
}

// ─── MADR formatter ──────────────────────────────────────────────────────────

export function toMADR(adr: ADR): string {
  const statusCapitalized = adr.status.charAt(0).toUpperCase() + adr.status.slice(1)
  const date = adr.decisionDate ?? new Date().toISOString().split("T")[0]
  const confidencePct = Math.round(adr.confidence * 100)

  const lines: string[] = [
    `# ${adr.id}: ${adr.title}`,
    "",
    `Date: ${date}`,
    `Status: ${statusCapitalized}`,
    `Category: ${adr.category}`,
    `Confidence: ${confidencePct}%`,
    "",
    "## Context",
    "",
    adr.context,
    "",
    "## Decision",
    "",
    adr.decision,
    "",
    "## Consequences",
    "",
    adr.consequences,
    "",
  ]

  if (adr.alternativesConsidered.length > 0) {
    lines.push("## Alternatives Considered", "")
    for (const alt of adr.alternativesConsidered) {
      lines.push(`- ${alt}`)
    }
    lines.push("")
  }

  if (adr.evidenceFiles.length > 0) {
    lines.push("## Evidence", "")
    for (const f of adr.evidenceFiles) {
      lines.push(`- [\`${f.path}\`](${f.githubUrl})`)
      if (f.snippet) {
        lines.push("  ```")
        lines.push(`  ${f.snippet}`)
        lines.push("  ```")
      }
    }
    lines.push("")
  }

  if (adr.archaeologyEvidence.length > 0) {
    lines.push("## Archaeology", "")
    lines.push(
      "> The following evidence suggests alternatives were considered before this decision was made.",
      ""
    )
    for (const finding of adr.archaeologyEvidence) {
      const icon = {
        "deleted-file": "🗑",
        "commented-code": "💬",
        migration: "🔄",
        "naming-pattern": "🏷",
        "todo-comment": "📝",
      }[finding.type] ?? "🔍"

      lines.push(`**${icon} ${finding.type}**: ${finding.description}`)
      if (finding.filePath) {
        lines.push(`> File: \`${finding.filePath}\``)
      }
      if (finding.snippet) {
        lines.push("```")
        lines.push(finding.snippet)
        lines.push("```")
      }
      lines.push("")
    }
  }

  return lines.join("\n")
}

// ─── README index ────────────────────────────────────────────────────────────

export function buildIndex(pkg: ADRPackage): string {
  const lines: string[] = [
    "# Architecture Decision Records",
    "",
    `> Reconstructed from [\`${pkg.repoName}\`](${pkg.repoUrl}) by [ADR Archaeologist](https://github.com/adr-archaeologist) on ${pkg.generatedAt.split("T")[0]}.`,
    "",
    "These ADRs were not written by hand — they were inferred from code patterns, dependencies, commit history, and structure.",
    "",
    "## Decisions",
    "",
    "| ID | Title | Status | Category | Confidence |",
    "|---|---|---|---|---|",
  ]

  for (const adr of pkg.adrs) {
    const statusEmoji = { accepted: "✅", deprecated: "❌", superseded: "🔄" }[adr.status] ?? ""
    const confidencePct = Math.round(adr.confidence * 100)
    lines.push(
      `| [${adr.id}](./${toFilename(adr)}) | ${adr.title} | ${statusEmoji} ${adr.status} | ${adr.category} | ${confidencePct}% |`
    )
  }

  lines.push("")
  lines.push("## Pipeline Stats")
  lines.push("")
  lines.push(`- Stage 1 (Discovery): ${pkg.pipelineStats.stage1DurationMs}ms`)
  lines.push(`- Stage 2 (Enrichment): ${pkg.pipelineStats.stage2DurationMs}ms`)
  lines.push(`- Stage 3 (Archaeology): ${pkg.pipelineStats.stage3DurationMs}ms`)
  lines.push(`- Stage 4 (Formatting): ${pkg.pipelineStats.stage4DurationMs}ms`)
  lines.push(`- Total tokens used: ${pkg.pipelineStats.totalTokensUsed.toLocaleString()}`)

  return lines.join("\n")
}
