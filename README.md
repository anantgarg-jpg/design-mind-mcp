# Design Mind MCP

The Design Mind MCP server — a Claude Code tool that enforces consistent, safe, and ontologically correct UI generation across any project that uses it.

Any team can point their `.mcp.json` at this server and get the full Design Mind genome at build time.

---

## What's included

```
server/      — MCP stdio server (the Claude Code tool)
api/         — Hosted candidate submission API
genome/      — Rules, taste, and principles
ontology/    — Canonical entity names, actions, states, copy voice
patterns/    — Ratified UI patterns (meta.yaml + component.tsx)
safety/      — Hard constraints and severity schema
memory/      — Episodic build log
```

---

## Quick start

**1. Install dependencies**

```bash
cd server && npm install
```

**2. Add to your project's `.mcp.json`**

```json
{
  "mcpServers": {
    "design-mind": {
      "command": "node",
      "args": ["/path/to/design-mind-mcp/server/src/index.js"]
    }
  }
}
```

**3. (Optional) Enable semantic search**

```bash
npm run seed:vectors
```

Without this step the server falls back to TF-IDF search — still useful, just less precise.

---

## MCP tools

| Tool | When to call |
|------|-------------|
| `consult_before_build` | Before generating any UI component |
| `review_output` | After generating UI — returns a `fix` array to address |
| `report_pattern` | When you build something novel not covered by the genome |

---

## Candidate submission API

`report_pattern` submits new pattern candidates to a central hosted endpoint so maintainers can ratify them and promote them into the genome for everyone.

**Run locally:**

```bash
cd api && node src/index.js
```

**Environment variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3456` | API port |
| `API_KEY` | `dm-local-dev-key` | Auth key (change in production) |
| `SLACK_WEBHOOK_URL` | — | Optional Slack webhook for notifications |

**MCP server variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `DESIGN_MIND_API_URL` | `http://localhost:3456` | Candidate API endpoint |
| `DESIGN_MIND_API_KEY` | `dm-local-dev-key` | API key |
| `DESIGN_MIND_PROJECT` | (dirname) | Project name attached to submissions |

If the API is unreachable, `report_pattern` falls back to writing the candidate locally to `patterns/_candidates/`.

---

## Ratification flow

```
Any consumer project
  → calls report_pattern
  → POST /candidates to hosted API
  → Maintainer gets Slack notification
  → Maintainer reviews, promotes to patterns/
  → npm run seed:vectors to re-index
  → All consumers pick it up automatically
```

Frequency counts are tracked — if 3+ projects independently report the same pattern it's flagged `ready_for_ratification`.

---

## Pattern structure

Each ratified pattern lives in `patterns/<PatternName>/`:

```
meta.yaml       — id, summary, when, not_when, because, confidence
component.tsx   — reference implementation
```

Candidate patterns waiting for ratification are in `patterns/_candidates/`.
