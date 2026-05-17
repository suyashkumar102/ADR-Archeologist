# ADR Archaeologist

ADR Archaeologist reconstructs undocumented architectural decisions directly
from a codebase and records them as formal Architecture Decision Records
(ADRs) in the [MADR](https://adr.github.io/madr/) format.

Most architectural decisions are never written down. Their rationale — and
the alternatives that were considered and rejected — is recoverable from the
code itself: dependencies, configuration, directory structure, test patterns,
commented-out implementations, dead utilities, and abandoned migrations. This
project analyzes those signals and produces a reviewable, versioned record of
why a system is built the way it is.

## Design Methodology and Core Contrast

When building an architectural recovery system, distinct implementation paths emerge. ADR Archaeologist optimizes for deterministic production workflows through deliberate design decisions:

### 1. Static Structural Forensics vs. Git History Analysis
Many tools attempt to map codebase evolution by parsing Git logs, diff histories, or old commit messages. In real-world engineering teams, commit histories are frequently compromised by squashed merges, refactoring noise, and uninformative commit messages (e.g., "wip" or "fix bug"). ADR Archaeologist treats the current structural state of the codebase as the ultimate source of truth. By parsing physical "code scars"—such as multi-line commented-out legacy blocks, unreferenced imports, dead utility functions, and migration-related TODO hooks—it reconstructs architectural intent from the code that survived, rather than vulnerable historical text narratives.

### 2. Linear Deterministic Pipelines vs. Multi-Agent Frameworks
Multi-agent architectures that rely on conversational debate between various AI personas introduce significant latency, non-deterministic outputs, and extreme token consumption. ADR Archaeologist utilizes a strict, linear four-stage execution pipeline. This ensures predictable runtime performance, verifiable structural validation at each layer, and a total execution time of under 90 seconds for major codebases.

### 3. Integrated Repository Assets vs. External Analytics Dashboards
Instead of decoupling analysis into an external third-party dashboard or generating static PDF summaries that exist outside the developer's workspace, ADR Archaeologist compiles standard Markdown assets directly into the repository's native file system structure under `/docs/adr/`. This allows development teams to instantly review, version-control, and merge architectural records through standard code review workflows and GitHub pull requests.

## Overview

The tool runs a four-stage analysis pipeline:

1. **Decision Detection** — identifies code patterns that represent deliberate
   architectural choices across seven categories: infrastructure, structure,
   communication, data, auth, error handling, and testing.
2. **Context Inference** — reconstructs the problem each decision solved, the
   constraints that drove it, and where it occurred in the project lifecycle.
3. **Alternatives Archaeology** — searches for evidence of rejected
   approaches: commented-out code, migration artifacts, dead utilities, unused
   imports, removed tests, and migration-related TODO/FIXME comments.
4. **ADR Generation** — produces complete MADR documents with inferred status
   (accepted, deprecated, or superseded), an inferred date, an imperative
   title, consequences, and a cited evidence trail.

Output is written as `docs/adr/{number}-{kebab-title}.md` plus a
`docs/adr/README.md` index. Every claim in an ADR is required to cite specific
file evidence; archaeology findings must quote real lines or report none.

## Interfaces

The same analysis is available through three interfaces.

### 1. IBM Bob IDE (recommended for deep analysis)

A native Bob extension consisting of a mode, a skill, and a command. Bob runs
the four-stage workflow using its own model and filesystem tools
(`read_file`, `search_codebase`, `create_file`) and writes the ADR files
directly into the open repository.

- Mode: `ADR Archaeologist`
- Skill: `adr-generate`
- Command: `/adr generate`, or `/adr generate --focus=infrastructure,auth`

This path requires no API key and operates on full file contents, which
yields the most thorough archaeology results.

### 2. Web application

A Next.js frontend and an Express API backend. The backend runs the pipeline
against the API and streams progress to the UI over Server-Sent Events.
Results can be exported as a ZIP archive or opened as a GitHub pull request. A
demo mode serves pre-generated output for `django/django` without calling any
external API.

### 3. Command line

```bash
npm run adr:generate
```

Generates ADRs for the target repository and writes them to `docs/adr/`.

## Architecture

```
Next.js / React frontend ──(SSE)──► Express API ──► 4-stage pipeline
                                                      │
                                                      ├─ GitHub fetch (Octokit)
                                                      ├─ LLM Model
                                                      ├─ Zod schema validation
                                                      └─ Deterministic MADR export
```

The codebase is TypeScript end to end. Notable engineering details:

- **Self-healing schemas.** Zod `z.preprocess` normalization tolerates model
  output that paraphrases field names, so a renamed key does not fail a run.
- **Strict JSON mode.** The model is constrained to JSON output, with a robust
  extractor as a fallback, eliminating fence and prose parsing failures.
- **Lazy client construction.** API clients are created on first use rather
  than at import time, so environment variables are read after they load.
- **Bounded token usage.** File count, file size, and per-file context are
  capped, and archaeology runs as a single batched request, keeping the
  pipeline within the Groq free tier.
- **Deterministic output.** ADR filenames and MADR formatting are generated in
  code, not delegated to the model.
  

## Installation

```bash
git clone <repository-url>
cd adr-archaeologist
npm install
```

## Configuration

Create a `.env.local` file in the project root. Values in `.env.local` take
precedence over `.env`.

```env
# Required for the web application and CLI
GROQ_API_KEY=your_groq_api_key

# Optional. Raises the GitHub API limit from 60 to 5000 requests/hour
GITHUB_TOKEN=your_github_token

# Frontend only. Defaults to http://localhost:3001
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Optional. When "true", the API serves the cached demo output
DEMO_MODE=false

# Optional. API server port. Defaults to 3001
PORT=3001
```

## Running the Web Application

The web application requires the API backend and the frontend to run together.

```bash
# Terminal 1 — API backend (port 3001)
npm run backend

# Terminal 2 — frontend (port 3000)
npm run dev
```

Open `http://localhost:3000`. Enter a public GitHub repository URL, optionally
scope the analysis to a subdirectory or to specific focus areas, and start the
analysis. The demo option on the home page loads pre-generated output
immediately and makes no external API calls.

For a production build of the frontend:

```bash
npm run build
npm run start
```

## API Reference

The API backend exposes the following endpoints.

| Method | Endpoint           | Description                                            |
|--------|--------------------|--------------------------------------------------------|
| GET    | `/health`          | Health check.                                          |
| GET    | `/repo/validate`   | Validates a repository URL. Query parameter: `url`.    |
| GET    | `/analyze/stream`  | Runs the pipeline and streams progress over SSE.       |
| POST   | `/analyze`         | Runs the pipeline and returns the full result as JSON. |
| POST   | `/github/pr`       | Opens a pull request containing the generated ADRs.    |

## Project Structure

```
app/                      Next.js frontend (pages, layout, styles)
components/                React components (results, progress, export, UI)
lib/                       Frontend API client and shared types
scripts/                   CLI generator, demo fixture, test utilities
src/
  types.ts                 Backend domain and SSE event types
  lib/
    pipeline.ts            Pipeline orchestration
    groq.ts                Groq client and JSON handling
    schemas.ts             Zod validation and normalization
    stages/                Stage 1–4 implementations
    github/                Repository fetch and pull-request creation
    export/madr.ts         MADR document and index generation
    demo/cache.ts          Cached demo output
server.ts                  Express API server
bob-config/                Bob IDE mode, skill, and command (reference copies)
.bob/                      Installed Bob IDE configuration
```

## Operational Mechanics and Environment Validation

The processing layer of ADR Archaeologist operates under a tiered scaling model tailored to the hosting environment.

### 1. Dual-Engine Scaling Strategy

The web-based and CLI interfaces are engineered as high-speed triage layers, running against lightweight cloud gateways that optimize performance by budgeting file context windows.

Conversely, the native IBM Bob IDE workspace extension handles deep structural scans. Because it leverages local resources directly within the editor environment, it operates with:

- Zero runtime network costs
- Zero context truncation constraints

This enables extraction of complete archaeological records from large code structures.

### 2. Algorithmic Code Base Verification

The generation of alternative paths during Stage 3 relies strictly on the presence of physical evidence within the scanned files.

If a targeted repository yields few or zero archaeological records, the engine flags this outcome as a deterministic verification of a clean codebase, indicating that the development team maintains:

- Absolute dead-code elimination
- Clean refactoring cycles
- Zero legacy contamination

## Acknowledgments

- IBM Bob IDE — host environment for the editor-integrated interface
- MADR — Architecture Decision Record format

## License

Released under the MIT License.
