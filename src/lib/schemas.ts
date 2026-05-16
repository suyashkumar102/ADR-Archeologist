import { z } from "zod"

// ─── Why this file looks like this ──────────────────────────────────────────
// A free-tier 70B model will NOT reliably emit a strict nested schema even
// when the schema is in the prompt — it paraphrases keys ("name" vs "title"),
// drops derivable fields ("id", "totalFound"), and uses 0-1 confidence.
// So every schema below is `z.preprocess(normalize, strict)`: we coerce
// whatever the model produced into the canonical shape, THEN validate.
// The model only has to get the *data* right; field plumbing is our job.

// ─── Coercion helpers ───────────────────────────────────────────────────────

function asArray(x: unknown): any[] {
  if (Array.isArray(x)) return x
  if (x && typeof x === "object") {
    for (const k of ["decisions", "contexts", "alternatives", "adrs", "items", "results", "data"]) {
      const v = (x as any)[k]
      if (Array.isArray(v)) return v
    }
  }
  return []
}

function str(x: unknown, fallback = ""): string {
  if (typeof x === "string") return x
  if (typeof x === "number" || typeof x === "boolean") return String(x)
  return fallback
}

function strList(x: unknown): string[] {
  if (Array.isArray(x)) return x.map((v) => str(v)).filter(Boolean)
  if (typeof x === "string" && x.trim()) return [x]
  return []
}

function confidence(x: unknown): number {
  let n = Number(x)
  if (!Number.isFinite(n)) return 70
  if (n > 0 && n <= 1) n = n * 100
  return Math.max(0, Math.min(100, Math.round(n)))
}

function enumOr<T extends string>(
  x: unknown,
  allowed: readonly T[],
  fallback: T,
  synonyms: Record<string, T> = {}
): T {
  const v = str(x).toLowerCase().trim().replace(/[\s-]+/g, "_")
  if ((allowed as readonly string[]).includes(v)) return v as T
  if (synonyms[v]) return synonyms[v]
  return fallback
}

function id(prefix: string, raw: unknown, index: number): string {
  const v = str(raw).trim()
  if (v) return v
  return `${prefix}-${String(index + 1).padStart(3, "0")}`
}

// ─── Stage 1: Decision Detection ────────────────────────────────────────────

const STAGE1_CATEGORIES = [
  "infrastructure",
  "structure",
  "communication",
  "data",
  "auth",
  "error_handling",
  "testing",
  "other",
] as const

const Stage1Strict = z.object({
  decisions: z.array(
    z.object({
      id: z.string(),
      category: z.enum(STAGE1_CATEGORIES),
      title: z.string(),
      evidence: z.array(
        z.object({
          file: z.string(),
          lines: z.string(),
          signal: z.string(),
        })
      ),
      confidence: z.number().min(0).max(100),
    })
  ),
  totalFound: z.number(),
})

function normalizeStage1(raw: unknown): unknown {
  const root = raw as any
  const list = asArray(root)
  const decisions = list.map((d: any, i: number) => {
    let evidence: any[]
    if (Array.isArray(d?.evidence)) {
      evidence = d.evidence.map((e: any) => ({
        file: str(e?.file ?? e?.path ?? e),
        lines: str(e?.lines ?? e?.line ?? e?.line_ranges, ""),
        signal: str(e?.signal ?? e?.reason ?? e?.note, ""),
      }))
    } else {
      const files = strList(d?.files ?? d?.evidenceFiles ?? d?.evidence_files)
      const lines = strList(d?.lines ?? d?.line_ranges)
      evidence = files.map((f, idx) => ({
        file: f,
        lines: lines[idx] ?? "",
        signal: str(d?.signal, ""),
      }))
    }
    if (evidence.length === 0) evidence = [{ file: "unknown", lines: "", signal: "" }]

    return {
      id: id("decision", d?.id ?? d?.decisionId, i),
      category: enumOr(d?.category ?? d?.type, STAGE1_CATEGORIES, "other", {
        database: "data",
        db: "data",
        persistence: "data",
        orm: "data",
        patterns: "structure",
        architecture: "structure",
        organization: "structure",
        infra: "infrastructure",
        deployment: "infrastructure",
        caching: "infrastructure",
        security: "auth",
        authentication: "auth",
        authorization: "auth",
        api: "communication",
        networking: "communication",
        logging: "error_handling",
        observability: "error_handling",
        resilience: "error_handling",
        tests: "testing",
        qa: "testing",
      }),
      title: str(d?.title ?? d?.name ?? d?.decision ?? d?.summary, "Untitled decision"),
      evidence,
      confidence: confidence(d?.confidence),
    }
  })

  return {
    decisions,
    totalFound: typeof root?.totalFound === "number" ? root.totalFound : decisions.length,
  }
}

export const Stage1Schema = z.preprocess(normalizeStage1, Stage1Strict)
export type Stage1Output = z.infer<typeof Stage1Strict>

// ─── Stage 2: Context Enrichment ────────────────────────────────────────────

const STAGE2_CONSTRAINTS = [
  "performance",
  "scale",
  "consistency",
  "simplicity",
  "team_size",
  "cost",
] as const

const STAGE2_TIMING = ["early", "growth", "mature"] as const

const Stage2Strict = z.object({
  contexts: z.array(
    z.object({
      decisionId: z.string(),
      problem: z.string(),
      constraints: z.array(
        z.object({
          type: z.enum(STAGE2_CONSTRAINTS),
          evidence: z.string(),
        })
      ),
      timing: z.enum(STAGE2_TIMING),
      confidence: z.number().min(0).max(100),
    })
  ),
})

function normalizeStage2(raw: unknown): unknown {
  const list = asArray(raw)
  const contexts = list.map((c: any, i: number) => {
    const constraints = (Array.isArray(c?.constraints) ? c.constraints : []).map((k: any) => ({
      type: enumOr(k?.type, STAGE2_CONSTRAINTS, "simplicity", {
        latency: "performance",
        speed: "performance",
        throughput: "scale",
        scalability: "scale",
        reliability: "consistency",
        correctness: "consistency",
        maintainability: "simplicity",
        complexity: "simplicity",
        team: "team_size",
        headcount: "team_size",
        budget: "cost",
        money: "cost",
      }),
      evidence: str(k?.evidence ?? k?.signal ?? k, ""),
    }))

    return {
      decisionId: id("decision", c?.decisionId ?? c?.id, i),
      problem: str(c?.problem ?? c?.context ?? c?.summary, "Unknown problem"),
      constraints,
      timing: enumOr(c?.timing, STAGE2_TIMING, "growth", {
        new: "early",
        initial: "early",
        scaling: "growth",
        established: "mature",
        legacy: "mature",
      }),
      confidence: confidence(c?.confidence),
    }
  })

  return { contexts }
}

export const Stage2Schema = z.preprocess(normalizeStage2, Stage2Strict)
export type Stage2Output = z.infer<typeof Stage2Strict>

// ─── Stage 3: Alternatives Archaeology ──────────────────────────────────────

const EVIDENCE_TYPES = [
  "commented_out",
  "migration_artifact",
  "dead_utility",
  "dead_import",
  "removed_test",
  "todo_comment",
] as const

const Stage3Strict = z.object({
  alternatives: z.array(
    z.object({
      decisionId: z.string(),
      rejected: z.array(
        z.object({
          option: z.string(),
          evidence: z.object({
            file: z.string(),
            type: z.enum(EVIDENCE_TYPES),
            snippet: z.string(),
          }),
          rejectionReason: z.string(),
        })
      ),
    })
  ),
})

function normalizeStage3(raw: unknown): unknown {
  const list = asArray(raw)
  const alternatives = list.map((a: any, i: number) => {
    const rejected = (Array.isArray(a?.rejected) ? a.rejected : []).map((r: any) => {
      const ev = r?.evidence ?? {}
      return {
        option: str(r?.option ?? r?.alternative ?? r?.name, "Unknown alternative"),
        evidence: {
          file: str(ev?.file ?? ev?.path ?? r?.file, "unknown"),
          type: enumOr(ev?.type ?? r?.type, EVIDENCE_TYPES, "commented_out", {
            comment: "commented_out",
            commented: "commented_out",
            migration: "migration_artifact",
            migrations: "migration_artifact",
            dead_code: "dead_utility",
            unused: "dead_utility",
            unused_import: "dead_import",
            removed: "removed_test",
            test: "removed_test",
            todo: "todo_comment",
            fixme: "todo_comment",
          }),
          snippet: str(ev?.snippet ?? ev?.code ?? r?.snippet, ""),
        },
        rejectionReason: str(r?.rejectionReason ?? r?.reason ?? r?.why, "Reason not recorded"),
      }
    })

    return {
      decisionId: id("decision", a?.decisionId ?? a?.id, i),
      rejected,
    }
  })

  return { alternatives }
}

export const Stage3Schema = z.preprocess(normalizeStage3, Stage3Strict)
export type Stage3Output = z.infer<typeof Stage3Strict>

// ─── Stage 4: ADR Generation ────────────────────────────────────────────────

const STAGE4_STATUS = ["accepted", "deprecated", "superseded"] as const

const Stage4Strict = z.object({
  adrs: z.array(
    z.object({
      id: z.string(),
      filename: z.string().optional(),
      title: z.string(),
      status: z.enum(STAGE4_STATUS),
      inferredDate: z.string(),
      category: z.string(),
      confidence: z.number().min(0).max(100),
      context: z.string(),
      decision: z.string(),
      consequences: z.object({
        positive: z.array(z.string()),
        negative: z.array(z.string()),
      }),
      alternatives: z.array(
        z.object({
          option: z.string(),
          reason: z.string(),
        })
      ),
      archaeology: z
        .array(
          z.object({
            option: z.string(),
            evidenceFile: z.string(),
            evidenceType: z.enum(EVIDENCE_TYPES),
            rejectionReason: z.string(),
          })
        )
        .nullable(),
      evidenceFiles: z.array(z.string()),
      markdownContent: z.string().optional(),
    })
  ),
})

function normalizeConsequences(x: any): { positive: string[]; negative: string[] } {
  if (x && typeof x === "object" && !Array.isArray(x)) {
    return {
      positive: strList(x.positive ?? x.pros ?? x.benefits),
      negative: strList(x.negative ?? x.cons ?? x.drawbacks ?? x.risks),
    }
  }
  // A bare string or array of strings — treat all as positive consequences.
  const all = strList(x)
  return { positive: all, negative: [] }
}

function normalizeStage4(raw: unknown): unknown {
  const list = asArray(raw)
  const adrs = list.map((a: any, i: number) => {
    const altSrc = a?.alternatives ?? a?.alternativesConsidered ?? a?.alternatives_considered
    const alternatives = Array.isArray(altSrc)
      ? altSrc.map((alt: any) =>
          typeof alt === "string"
            ? { option: alt, reason: "" }
            : { option: str(alt?.option ?? alt?.name), reason: str(alt?.reason ?? alt?.why, "") }
        )
      : []

    const archSrc = a?.archaeology ?? a?.archaeologyEvidence ?? a?.archaeology_evidence
    const archaeology = Array.isArray(archSrc) && archSrc.length > 0
      ? archSrc.map((g: any) => ({
          option: str(g?.option ?? g?.alternative ?? g?.description, "Unknown alternative"),
          evidenceFile: str(g?.evidenceFile ?? g?.file ?? g?.filePath, "unknown"),
          evidenceType: enumOr(g?.evidenceType ?? g?.type, EVIDENCE_TYPES, "commented_out", {
            comment: "commented_out",
            commented: "commented_out",
            migration: "migration_artifact",
            "naming-pattern": "migration_artifact",
            naming_pattern: "migration_artifact",
            unused: "dead_utility",
            dead_code: "dead_utility",
            unused_import: "dead_import",
            test: "removed_test",
            todo: "todo_comment",
            fixme: "todo_comment",
          }),
          rejectionReason: str(g?.rejectionReason ?? g?.reason ?? g?.description, "Reason not recorded"),
        }))
      : null

    const evidenceFiles = Array.isArray(a?.evidenceFiles)
      ? a.evidenceFiles.map((f: any) => (typeof f === "string" ? f : str(f?.path ?? f?.file)))
      : strList(a?.evidence_files)

    return {
      id: id("ADR", a?.id, i),
      filename: typeof a?.filename === "string" ? a.filename : undefined,
      title: str(a?.title ?? a?.name, "Untitled decision"),
      status: enumOr(a?.status, STAGE4_STATUS, "accepted", {
        active: "accepted",
        current: "accepted",
        in_use: "accepted",
        deprecated: "deprecated",
        legacy: "deprecated",
        replaced: "superseded",
        superceded: "superseded",
      }),
      inferredDate: str(a?.inferredDate ?? a?.decisionDate ?? a?.date, "~unknown"),
      category: str(a?.category, "other"),
      confidence: confidence(a?.confidence),
      context: str(a?.context, "Context not recorded."),
      decision: str(a?.decision, "Decision not recorded."),
      consequences: normalizeConsequences(a?.consequences),
      alternatives,
      archaeology,
      evidenceFiles,
      markdownContent: typeof a?.markdownContent === "string" ? a.markdownContent : undefined,
    }
  })

  return { adrs }
}

export const Stage4Schema = z.preprocess(normalizeStage4, Stage4Strict)
export type Stage4Output = z.infer<typeof Stage4Strict>
