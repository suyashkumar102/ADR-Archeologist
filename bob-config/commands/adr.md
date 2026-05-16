# Slash Command: /adr
# File: bob-config/commands/adr.md
# Usage: Copy contents into Bob IDE → Settings → Commands → New Command
# Command: /adr generate | /adr generate --focus=infrastructure,auth

## Description
Generate Architecture Decision Records for the current repository.

## Arguments
- generate: run full ADR generation workflow
- --focus={areas}: scope to specific decision categories
  Valid areas: infrastructure, auth, data, structure, testing, communication

## Behaviour
When /adr generate is called:
1. Activate ADR Archaeologist mode instructions
2. Execute the adr-generate skill workflow (all 4 steps)
3. Create docs/adr/ directory if it doesn't exist
4. Write each ADR as a separate .md file
5. Write docs/adr/README.md as an index
6. Report: "Generated {N} ADRs. Found {M} archaeology discoveries."

When /adr generate --focus={areas} is called:
Same workflow but limit Stage 1 detection to specified categories.

## Example usage
/adr generate
/adr generate --focus=infrastructure,auth
