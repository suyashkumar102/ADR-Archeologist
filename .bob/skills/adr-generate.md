# ADR Generation Skill

This is a Bob skill — a reusable workflow markdown file.

## Trigger
User types /adr generate or asks Bob to generate architecture decision records.

## Workflow — 4 Steps

### Step 1: Decision Surface Detection
Read the full repository using @codebase.
Find architectural decision patterns across all files.
Output: numbered list of detected decisions.

### Step 2: Context and Constraint Inference
For each decision: what specific problem was it solving?
What constraints drove this choice over alternatives?
Write the problem as the engineer who felt the pain would write it.
Specific and concrete, never generic.

### Step 3: Archaeology Search
For each decision, search the entire repo for evidence of rejected alternatives:
- Commented-out code blocks
- Migration artifacts showing previous approaches
- Dead utility functions (defined, never called)
- Dead imports (imported, never used in the file)
- Test files for removed features
- TODO/FIXME comments about migrations
Only report genuine evidence. If none found, say so explicitly.

### Step 4: ADR Document Creation
Create docs/adr/{number}-{kebab-title}.md for each decision.
Create docs/adr/README.md as an index.
Title format: imperative — "Use X for Y"
Mark archaeology with [ARCHAEOLOGY] prefix in alternatives section.

## Output rules
- Every claim cites specific file path and line number
- Confidence score 0-100 based on evidence strength
- Status inferred from code: accepted / deprecated / superseded