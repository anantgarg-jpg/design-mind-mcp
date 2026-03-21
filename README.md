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
surfaces/    — Surface specs (workflow intent for full artifacts)
safety/      — Hard constraints and severity schema
memory/      — Episodic build log
```

---

## Genome hierarchy

The Design Mind organises knowledge at four levels:

| Level | Location | What it encodes |
|-------|----------|-----------------|
| **Tokens** | `genome/rules/styling-tokens.rule.md` | Colors, typography, spacing — the visual primitives |
| **Decisions** | `patterns/*/meta.yaml` | Atomic UI choices that exist because of a rule (e.g. StatusBadge, ClinicalAlertBanner) |
| **Compositions** | `patterns/*/meta.yaml` | Governed combinations of decisions (e.g. ActionableRow, PatientContextHeader) |
| **Surfaces** | `surfaces/*.surface.yaml` | Full artifacts with workflow intent — encodes *why* a surface exists, what it omits, ordering logic, available actions, and hard "never" rules |

---

## Quick start — hosted (recommended)

The server runs publicly at Railway. No local install needed.

**Add to your project's `.mcp.json`:**

```json
{
  "mcpServers": {
    "design-mind": {
      "type": "sse",
      "url": "https://design-mind-mcp.up.railway.app/sse"
    }
  }
}
```

That's it. Claude Code connects over SSE — no local process to manage.

---

## Quick start — local (self-hosted)

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
| `consult_before_build` | Before generating any UI component — returns surface spec, patterns, rules, ontology refs, and safety constraints |
| `review_output` | After generating UI — returns a `fix` array to address |
| `report_pattern` | Only when the **structure** changes — new interaction model, different layout container, different slot arrangement. Do not call when only slot content changes (label, domain, icon, entity type) |

### `consult_before_build` response

Returns a JSON object with:
- `surface` — matching surface spec if one exists (intent, omissions, ordering, actions, never rules)
- `patterns` — most relevant ratified patterns ranked by similarity
- `rules` — applicable genome rules
- `ontology` — relevant entity/action/state references
- `safety` — hard constraints that apply

### `report_pattern` types

The `type` field classifies where in the genome hierarchy the pattern belongs:

| Type | Meaning |
|------|---------|
| `decision` | An atomic component that exists because of a rule |
| `composition` | A governed combination of decisions |
| `surface` | A full artifact with workflow intent |

---

## Surfaces

Surfaces live in `surfaces/*.surface.yaml`. Each encodes:

- **intent** — why this surface exists
- **what_it_omits** — what deliberately stays out
- **ordering** — how content is sequenced and why
- **actions** — what the user can do, with constraints
- **never** — hard rules that cannot be violated

Current surfaces:

| Surface | User type |
|---------|-----------|
| `Today` | coordinator |
| `Worklist` | coordinator |
| `PatientDetail` | coordinator, clinician |
| `OutreachLog` | coordinator |
| `IntakeForm` | coordinator |
| `ClinicalAssessment` | coordinator, clinician |

---

## Candidate submission API

`report_pattern` submits new pattern candidates to a central endpoint so maintainers can ratify them and promote them into the genome for everyone.

In **hosted mode** the `/candidates` route is served by the same MCP server process — no separate process needed.

**Run the standalone API locally (only needed for local dev):**

```bash
cd api && node src/index.js
```

**Environment variables (hosted / Railway deployment):**

| Variable | Default | Description |
|----------|---------|-------------|
| `TRANSPORT` | `stdio` | Set to `sse` to enable HTTP/SSE transport |
| `PORT` | `8080` | HTTP port (Railway sets this automatically) |
| `API_KEY` | `dm-local-dev-key` | Key for `/candidates` endpoint — **change in production** |
| `DESIGN_MIND_API_KEY` | `dm-local-dev-key` | Must match `API_KEY` — used by `report_pattern` when submitting |
| `DESIGN_MIND_API_URL` | `http://localhost:3456` | Base URL of the candidates API (set to your Railway URL in production) |
| `SLACK_WEBHOOK_URL` | — | Optional Slack webhook for candidate notifications |
| `DESIGN_MIND_PROJECT` | (dirname) | Project name attached to candidate submissions |

If the API is unreachable, `report_pattern` falls back to writing the candidate locally to `patterns/_candidates/`.

**Deduplication:** Candidates are compared using composite similarity across name, description, and intent. Submissions above a 0.2 similarity threshold increment a frequency counter rather than creating a duplicate. At 3+ reports from separate projects a candidate is flagged `ready_for_ratification`.

---

## Ratification flow

```
Any consumer project
  → calls report_pattern
  → POST /candidates to hosted API
  → Maintainer gets Slack notification
  → Maintainer reviews, promotes to patterns/ or surfaces/
  → npm run seed:vectors to re-index
  → All consumers pick it up automatically
```

---

## Pattern structure

Each ratified pattern lives in `patterns/<PatternName>/`:

```
meta.yaml       — id, summary, when, not_when, because, confidence
component.tsx   — reference implementation (optional — some patterns are genome-only)
```

Candidate patterns waiting for ratification are in `patterns/_candidates/`.

### Pattern variation rule

Patterns have **invariants** (the container, layout, interaction model — never change) and **slots** (title, label, meta items, actions — fill freely per domain).

**The single threshold question: "Am I changing structure or content?"**

- Changing slot content (different label, entity type, icon, token) → use the existing pattern as-is. Do not call `report_pattern`.
- Changing structure (new layout, new interaction model, new slot arrangement) → call `report_pattern` to log a candidate.

This keeps the genome lean. Four domain-named patterns (CareGapCard, CareGapRow, TaskActionRow, TaskRow) were correctly collapsed into one structural pattern (ActionableRow with `variant="row"` and `variant="card"`).

### Current patterns

| Pattern | Type | Use for |
|---------|------|---------|
| `ActionableRow` | composition | Any entity in a list that needs a primary action — care gaps, tasks, protocols, assessments. `variant="row"` inside a shared container; `variant="card"` as standalone cards |
| `StatusBadge` | decision | Any entity status display |
| `ClinicalAlertBanner` | decision | Clinical alerts requiring immediate acknowledgment |
| `PatientContextHeader` | composition | Patient identity at the top of any patient-scoped surface |
| `StatCard` | decision | Summary metric or count display |
| `PatientRow` | composition | Patient in a population list |
| `SectionHeader` | decision | Section label with optional count and action |
