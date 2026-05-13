# ADR Archaeologist

> Reconstruct every architectural decision your team made but never wrote down.

ADR Archaeologist feeds IBM Bob your entire GitHub repository and recovers the reasoning behind every major architectural choice — inferred from code patterns, dependencies, commit history, and structure — outputting a complete `/docs/adr/` directory of formal [MADR](https://adr.github.io/madr/)-format Architecture Decision Records.

**IBM Bob Hackathon · May 15–17, 2026 · Zone 4 — True Blindspot**

---

## What it does

Every codebase contains thousands of undocumented decisions. Why Redis instead of database sessions? Why a monolith instead of microservices? Why this ORM, this naming convention, this folder structure? The people who decided are gone, or the context is lost.

ADR Archaeologist runs a 4-stage IBM Bob pipeline against your repository:

| Stage | Name | What Bob does |
|---|---|---|
| 1 | Decision Discovery | Reads the full repo context and identifies architectural decisions |
| 2 | Enrichment | Infers rationale, alternatives considered, and consequences |
| 3 | Archaeology | Scans for evidence of rejected alternatives in deleted files, migrations, TODOs |
| 4 | MADR Formatting | Produces clean, professional ADR records ready to commit |

The output is a ZIP of markdown files and a one-click GitHub PR that adds `/docs/adr/` directly to your repository.

---

## Demo

Point it at any public GitHub repo. Results stream live in ~90 seconds.

```
https://github.com/django/django  →  8 ADRs recovered
```

Example output:

```markdown
# ADR-001: Use Django ORM as the primary database abstraction layer

Date: 2005-07-13
Status: Accepted
Confidence: 97%

## Context
The Django framework needed a database abstraction layer that would allow
developers to interact with relational databases without writing raw SQL...

## Decision
Django adopted an Object-Relational Mapper (ORM) as the primary interface
between Python application code and the underlying relational database...

## Archaeology
🔄 migration: Early migration files show schema evolution patterns that
indicate the ORM was designed to manage schema state from the beginning,
suggesting raw SQL management was explicitly rejected.
```

---

## Tech stack

- **Next.js 14** (App Router, Node.js runtime API routes)
- **IBM Bob API** — 4-stage pipeline with Zod schema validation and auto-retry
- **@octokit/rest** — GitHub file tree ingestion, commit history, PR creation
- **Zod** — Runtime validation of all Bob pipeline outputs
- **JSZip** — Client-side ZIP generation
- **Tailwind CSS** — Styling
- **Vercel** — Deployment

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                    # Main page — input → analyzing → results state machine
│   ├── layout.tsx                  # Nav, fonts, footer
│   └── api/analyze/route.ts        # POST /api/analyze — Node.js SSE endpoint
├── components/
│   ├── InputForm.tsx               # URL input, path filter, focus area checkboxes
│   ├── PipelineProgress.tsx        # Live 4-stage progress indicators
│   ├── ADRCard.tsx                 # Per-ADR output card with 3-column layout
│   ├── ArchaeologyPanel.tsx        # Collapsible archaeology findings
│   └── ExportPanel.tsx             # ZIP download + GitHub PR creation
├── lib/
│   ├── bob/
│   │   ├── client.ts               # IBM Bob API wrapper (retry, backoff, timeout)
│   │   ├── pipeline.ts             # AsyncGenerator orchestrating all 4 stages
│   │   ├── stage1-discover.ts      # Stage 1: Decision Discovery
│   │   ├── stage2-enrich.ts        # Stage 2: Enrichment
│   │   ├── stage3-archaeology.ts   # Stage 3: Archaeology
│   │   └── stage4-format.ts        # Stage 4: MADR Formatting
│   ├── github/
│   │   ├── fetcher.ts              # Repo ingestion — Git Trees API, batching, commit history
│   │   └── pr.ts                   # GitHub PR creation via Octokit
│   ├── export/
│   │   ├── madr.ts                 # ADR → MADR markdown formatter
│   │   └── zip.ts                  # JSZip bundler + browser download
│   └── demo/
│       ├── cache.ts                # DEMO_MODE — pre-cached output with artificial delays
│       └── django-adrs.json        # Pre-cached django/django pipeline output
└── types.ts                        # Single source of truth for all shared types
```

---

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/suyashkumar102/ADR-Arch.git
cd ADR-Arch/adr-archaeologist
npm install
```

### 2. Set environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
BOB_API_KEY=your_ibm_bob_api_key
GITHUB_TOKEN=your_github_personal_access_token
DEMO_MODE=false
```

| Variable | Required | Description |
|---|---|---|
| `BOB_API_KEY` | ✓ | IBM Bob API key |
| `GITHUB_TOKEN` | ✓ | GitHub PAT with `repo` scope (server-side, for fetching repos) |
| `DEMO_MODE` | — | Set to `true` to return pre-cached django/django output instantly |

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), paste a GitHub repo URL, and click **Analyze Repository**.

### 4. Deploy to Vercel

```bash
vercel deploy
```

Set the three environment variables in the Vercel dashboard. The app deploys with zero additional configuration.

---

## API contract

```
POST /api/analyze
Content-Type: application/json

{
  "repoUrl":    "https://github.com/owner/repo",
  "pathFilter": "optional/sub/path/",     // optional
  "focusAreas": ["database", "auth"]       // optional
}
```

Response: `text/event-stream` (Server-Sent Events)

```
data: {"event":"stage",    "data":{"stage":1,"status":"running"}}
data: {"event":"stage",    "data":{"stage":1,"status":"done","count":8}}
data: {"event":"stage",    "data":{"stage":2,"status":"running"}}
data: {"event":"stage",    "data":{"stage":2,"status":"done"}}
data: {"event":"stage",    "data":{"stage":3,"status":"running"}}
data: {"event":"stage",    "data":{"stage":3,"status":"done"}}
data: {"event":"stage",    "data":{"stage":4,"status":"running"}}
data: {"event":"complete", "data":{...ADRPackage}}
```

See [`SPEC.md`](./SPEC.md) for the full contract.

---

## Demo mode

Set `DEMO_MODE=true` to bypass the live Bob pipeline and return pre-cached `django/django` output with simulated stage delays. Used for reliable demo recording.

To update the cache, run the live pipeline on any repo and replace `src/lib/demo/django-adrs.json` with the `ADRPackage` output.

---

## License

MIT — see [LICENSE](./LICENSE)
