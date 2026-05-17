# /adr Command

Defines the /adr slash command.

## Description
Generate Architecture Decision Records for the current repository.

## Usage
/adr generate
/adr generate --focus=infrastructure,auth,data

## Behaviour
When /adr generate is called:
- Execute the adr-generate skill (all 4 steps)
- Create docs/adr/ directory if needed
- Write one .md file per ADR
- Write docs/adr/README.md as index
- Report: "Generated {N} ADRs. Found {M} archaeology discoveries."

When --focus is provided:
- Limit Stage 1 to those categories only
- Valid values: infrastructure, auth, database, caching, structure, testing, communication, error_handling