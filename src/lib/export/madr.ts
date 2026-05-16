import type { ADR, ADRPackage } from "@/types"

// ─── Filename formatter ──────────────────────────────────────────────────────

export function toFilename(adr: ADR): string {
  const num = adr.id.replace(/^ADR-/i, "").padStart(4, "0")
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

  const lines: string[] = [
    `# ${adr.id}: ${adr.title}`,
    "",
    `Date: ${adr.inferredDate}`,
    `Status: ${statusCapitalized}`,
    `Category: ${adr.category}`,
    `Confidence: ${adr.confidence}%`,
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
  ]

  if (adr.consequences.positive.length > 0) {
    lines.push("### Positive", "")
    for (const item of adr.consequences.positive) {
      lines.push(`- ${item}`)
    }
    lines.push("")
  }

  if (adr.consequences.negative.length > 0) {
    lines.push("### Negative", "")
    for (const item of adr.consequences.negative) {
      lines.push(`- ${item}`)
    }
    lines.push("")
  }

  if (adr.alternatives.length > 0) {
    lines.push("## Alternatives Considered", "")
    for (const alt of adr.alternatives) {
      lines.push(`- **${alt.option}**: ${alt.reason}`)
    }
    lines.push("")
  }

  if (adr.archaeology && adr.archaeology.length > 0) {
    lines.push("## Archaeology", "")
    lines.push(
      "> The following evidence suggests alternatives were considered before this decision was made.",
      ""
    )
    for (const finding of adr.archaeology) {
      lines.push(
        `- **${finding.option}** — rejected: ${finding.rejectionReason}`,
        `  > Evidence (\`${finding.evidenceType}\`): \`${finding.evidenceFile}\``
      )
    }
    lines.push("")
  }

  if (adr.evidenceFiles.length > 0) {
    lines.push("## Evidence trail", "")
    for (const f of adr.evidenceFiles) {
      lines.push(`- \`${f}\``)
    }
    lines.push("")
  }

  return lines.join("\n")
}

// ─── README index ────────────────────────────────────────────────────────────

export function buildIndex(pkg: ADRPackage): string {
  const generatedAt = new Date().toISOString().split("T")[0]

  const lines: string[] = [
    "# Architecture Decision Records",
    "",
    `> Reconstructed from [\`${pkg.repoName}\`](${pkg.repoUrl}) by ADR Archaeologist on ${generatedAt}.`,
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
    lines.push(
      `| [${adr.id}](./${toFilename(adr)}) | ${adr.title} | ${statusEmoji} ${adr.status} | ${adr.category} | ${adr.confidence}% |`
    )
  }

  lines.push(
    "",
    "## Pipeline Stats",
    "",
    `- Total decisions: ${pkg.totalDecisions}`,
    `- Archaeology findings: ${pkg.archaeologyCount}`,
    `- Total time: ${pkg.totalTimeMs}ms`
  )

  return lines.join("\n")
}
