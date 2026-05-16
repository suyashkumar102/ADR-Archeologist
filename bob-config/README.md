# Bob IDE Configuration

This folder contains the Bob IDE configuration for ADR Archaeologist.
These are **reference files** — copy them into Bob IDE manually via the settings UI.

Bob IDE has no file-based config system. These files document what to configure.

## Setup instructions

### 1. Custom Mode
Copy `modes/adr-archaeologist.json` contents into:
Bob IDE → Settings → Modes → New Mode

This mode turns Bob into an architectural historian. When active, Bob reads
the full repository and generates ADRs in 4 stages.

### 2. Skill
Copy `skills/adr-generate.md` contents into:
Bob IDE → Settings → Skills → New Skill

This skill defines the 4-step ADR generation workflow that the /adr command triggers.

### 3. Slash Command
Copy `commands/adr.md` contents into:
Bob IDE → Settings → Commands → New Command

This registers `/adr generate` as a command that triggers the full ADR workflow.

## Demo usage

Once configured in Bob IDE:

1. Open any GitHub repository in Bob IDE
2. Wait for Bob to index the codebase (status bar)
3. Type `/adr generate` in Bob chat
4. Bob reads the full repo and generates ADRs in `docs/adr/`
5. Export the Bob session for hackathon submission

## Session exports

All Bob session exports go in `bob_sessions/` at the repo root.
See `bob_sessions/README.md` for the required export checklist.
