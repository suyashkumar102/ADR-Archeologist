# ADR Archaeologist

> Reconstruct undocumented architectural decisions from any codebase.

ADR Archaeologist uses IBM Bob IDE and watsonx.ai to recover the reasoning behind major architectural choices — inferred from code patterns, dependencies, commit history, and repository structure — outputting a complete `/docs/adr/` directory of formal [MADR](https://adr.github.io/madr/)-format Architecture Decision Records.

---

## Architecture

The product has two layers that work together:

### Layer 1 — Bob IDE integration

Bob IDE is an IDE plugin that reads your repository in full context. ADR Archaeologist ships a custom Bob mode and skill that transforms Bob into an architectural analysis assistant.

```text
Open any repo in Bob IDE
        ↓
Type /adr generate
        ↓
Bob reads the full codebase
        ↓
Stage 1: Decision Detection
Stage 2: Context Inference
Stage 3: Alternative Discovery
Stage 4: ADR Generation → writes docs/adr/*.md
```

See `bob-config/` for the mode, skill, and command configuration.

### Layer 2 — Next.js web companion

The web companion accepts a GitHub URL, fetches the repository via the GitHub API, runs the same 4-stage pipeline using watsonx.ai Granite, and displays the results as interactive ADR cards.

> Bob IDE has no REST API and cannot be invoked directly from a web server.
> The web companion uses watsonx.ai for server-side AI execution.

```text
User pastes GitHub URL
        ↓
POST /api/analyze (SSE stream)
        ↓
GitHub API → fetch full repo → batch into chunks
        ↓
watsonx.ai Granite → 4-stage pipeline
        ↓
ADR cards rendered live as SSE events arrive
        ↓
ZIP download + GitHub PR creation
```

---

## What it does

Every codebase contains undocumented decisions. Why Redis instead of database sessions? Why a monolith instead of microservices? Why this ORM, naming convention, or folder structure?

The 4-stage pipeline:

| Stage | Name | What the AI does |
|---|---|---|
| 1 | Decision Discovery | Reads the repository and identifies architectural decisions |
| 2 | Enrichment | Infers rationale, alternatives considered, and consequences |
| 3 | Repository Analysis | Scans for evidence of alternative implementations in deleted files, migrations, TODOs, and commit history |
| 4 | MADR Formatting | Produces clean ADR records ready to commit |

---

## Tech stack

- IBM Bob IDE — custom mode + skill
- watsonx.ai Granite (`ibm/granite-13b-instruct-v2`) — server-side AI processing
- Next.js 14 (App Router, Node.js runtime API routes)
- `@octokit/rest` — GitHub ingestion, commit history, PR creation
- Zod — runtime validation for AI pipeline outputs
- JSZip — ZIP generation
- Tailwind CSS — styling
- Vercel — deployment

---

## Project structure

```text
adr-archaeologist/
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── api/analyze/route.ts
│   ├── components/
│   │   ├── InputForm.tsx
│   │   ├── PipelineProgress.tsx
│   │   ├── ADRCard.tsx
│   │   ├── RepositoryAnalysisPanel.tsx
│   │   └── ExportPanel.tsx
│   ├── lib/
│   │   ├── watsonx/
│   │   │   └── client.ts
│   │   ├── bob/
│   │   │   ├── pipeline.ts
│   │   │   ├── stage1-discover.ts
│   │   │   ├── stage2-enrich.ts
│   │   │   ├── stage3-analysis.ts
│   │   │   └── stage4-format.ts
│   │   ├── github/
│   │   │   ├── fetcher.ts
│   │   │   └── pr.ts
│   │   ├── export/
│   │   │   ├── madr.ts
│   │   │   └── zip.ts
│   │   └── demo/
│   │       ├── cache.ts
│   │       └── django-adrs.json
│   └── types.ts
├── bob-config/
│   ├── README.md
│   ├── modes/adr-archaeologist.json
│   ├── skills/adr-generate.md
│   └── commands/adr.md
├── bob_sessions/
│   └── README.md
├── AGENTS.md
├── SPEC.md
├── .env.local.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── vercel.json
└── LICENSE (MIT)
```