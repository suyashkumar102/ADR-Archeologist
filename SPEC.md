# ADR Archaeologist — SSE API Contract

## Endpoint

```
POST /api/analyze
Content-Type: application/json
```

## Request Body

```json
{
  "repoUrl":    "https://github.com/owner/repo",
  "pathFilter": "optional/sub/path/",
  "focusAreas": ["database", "auth", "caching", "infrastructure", "patterns", "api-design"]
}
```

| Field        | Type       | Required | Description                                      |
|---|---|---|---|
| `repoUrl`    | `string`   | ✓        | Full GitHub repo URL                             |
| `pathFilter` | `string`   | ✗        | Limit ingestion to files under this path prefix  |
| `focusAreas` | `string[]` | ✗        | Hint Bob toward specific architectural domains   |

## Response

`Content-Type: text/event-stream`

Each event is a line: `data: {json}\n\n`

## SSE Event Types

### Stage Progress
Emitted at the start and end of each pipeline stage.
```json
{ "event": "stage", "data": { "stage": 1, "status": "running" } }
{ "event": "stage", "data": { "stage": 1, "status": "done", "count": 8 } }
{ "event": "stage", "data": { "stage": 2, "status": "running" } }
{ "event": "stage", "data": { "stage": 2, "status": "done" } }
{ "event": "stage", "data": { "stage": 3, "status": "running" } }
{ "event": "stage", "data": { "stage": 3, "status": "done" } }
{ "event": "stage", "data": { "stage": 4, "status": "running" } }
{ "event": "stage", "data": { "stage": 4, "status": "done" } }
```

`count` is only present on Stage 1 done — it is the number of decisions discovered.

### Complete
Emitted once after Stage 4 completes. Contains the full ADRPackage.
```json
{ "event": "complete", "data": { ...ADRPackage } }
```

### Error
Emitted on any unrecoverable failure.
```json
{ "event": "error", "data": { "message": "string", "stage": 2 } }
```

`stage` is optional — present only if the error occurred inside a specific pipeline stage.

## Stage Names

| Stage | Name               | What Bob does                                              |
|---|---|---|
| 1     | Decision Discovery | Reads full repo context, identifies architectural decisions |
| 2     | Enrichment         | Infers rationale, alternatives, consequences per decision  |
| 3     | Archaeology        | Scans for evidence of rejected alternatives in code        |
| 4     | MADR Formatting    | Produces final MADR-format ADR records                     |
