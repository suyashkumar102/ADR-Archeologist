# Skill: Generate Architecture Decision Records
# File: bob-config/skills/adr-generate.md
# Usage: Copy contents into Bob IDE → Settings → Skills → New Skill
# Triggered by: /adr slash command

## Trigger
This skill is triggered by the /adr slash command or by explicit user request
to generate ADRs.

## Workflow

### Step 1: Decision Surface Detection
Read the complete repository using @codebase context.
Identify patterns that reveal architectural decisions.
Focus on: imports/dependencies that reveal technology choices,
config files that reveal infrastructure decisions,
folder structure that reveals architectural patterns,
test patterns that reveal quality philosophy.
Output a numbered list of detected decisions.

### Step 2: Context and Constraint Inference
For each detected decision:
- State the problem it was solving (specific, not generic)
- List the constraints that drove the choice (with code evidence)
- Estimate when in the project lifecycle this was decided

### Step 3: Archaeology Search
For each decision, search for rejected alternative evidence.
LOOK FOR:
- Code blocks commented out with "# Old:", "// Previous:", etc.
- Migration files showing previous model/schema versions
- Import statements that exist but are never used
- Functions/classes that are defined but never called
- Test files for features that no longer exist in production code
- TODO/FIXME comments referencing architectural migrations

Only report genuine evidence. If none found, say so explicitly.

### Step 4: ADR Document Generation
For each decision, write a complete MADR-format ADR.
Create the file at: docs/adr/{number}-{kebab-title}.md
Also update/create: docs/adr/README.md as an index.

## Output format per ADR
```
# ADR-{N}: {Title}
Status: {accepted|deprecated|superseded} (~{year})

## Context
{problem statement}

## Decision
{what was chosen and primary reasoning}

## Alternatives considered
- {option}: {why rejected}
- [ARCHAEOLOGY] {option}: Evidence found in {file}. {why abandoned}

## Consequences
### Positive
- {benefit}

### Negative
- {tradeoff}

## Evidence trail
- {file}:{lines} — {what this reveals}
```

## Important rules
- Every claim must cite a specific file and line number
- Never fabricate archaeology — only report what exists
- ADR titles must be imperative: "Use X for Y"
- Confidence score must reflect evidence quality
