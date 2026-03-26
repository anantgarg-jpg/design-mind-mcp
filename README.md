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
blocks/      — Ratified UI blocks (meta.yaml + component.tsx)
surfaces/    — Surface specs (workflow intent for full artifacts)
safety/      — Hard constraints and severity schema
memory/      — Episodic build log
```

---

## Genome hierarchy

The Design Mind organises knowledge at three levels:

| Level | Location | What it encodes |
|-------|----------|-----------------|
| **Tokens** | `genome/rules/styling-tokens.rule.md` | Colors, typography, spacing — the visual primitives |
| **Blocks** | `blocks/*/meta.yaml` | Reusable UI structures with product decisions baked in — from status badge to form layout. Three sub-levels: `primitive` (single-purpose), `composite` (assembles primitives), `domain` (product-specific) |
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

**3. Set the Anthropic API key**

```bash
export ANTHROPIC_API_KEY=your-key-here
```

The server uses the Anthropic API (claude-sonnet-4-5) to reason over the genome at query time. Without the key, `consult_before_build` returns a fallback response with no surface match or block selection.

---

## MCP tools

| Tool | When to call |
|------|-------------|
| `consult_before_build` | Before generating any UI component — returns surface spec, blocks, rules, ontology refs, and safety constraints |
| `review_output` | After generating UI — returns a `fix` array to address |
| `report_pattern` | Only when the **structure** changes — new interaction model, different layout container, different slot arrangement. Do not call when only slot content changes (label, domain, icon, entity type) |

### `consult_before_build` response

Returns a JSON object with:
- `surface` — matching surface spec if one exists (intent, omissions, ordering, actions, never rules)
- `blocks` — most relevant ratified blocks ranked by similarity
- `rules` — applicable genome rules
- `ontology` — relevant entity/action/state references
- `safety` — hard constraints that apply

### `report_pattern` types

The `type` field classifies where in the genome hierarchy the block belongs:

| Type | Meaning |
|------|---------|
| `primitive` | A small, single-purpose block (e.g. Badge, StatCard) |
| `composite` | A block that assembles primitives (e.g. ActionableRow, EntityContextHeader) |
| `domain` | A product-specific block tied to a workflow (e.g. ChatQuickActionChip, AssessmentTab) |
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
| `ANTHROPIC_API_KEY` | — | **Required.** Anthropic API key for LLM reasoning (claude-sonnet-4-5) |
| `TRANSPORT` | `stdio` | Set to `sse` to enable HTTP/SSE transport |
| `PORT` | `8080` | HTTP port (Railway sets this automatically) |
| `API_KEY` | `dm-local-dev-key` | Key for `/candidates` endpoint — **change in production** |
| `DESIGN_MIND_API_KEY` | `dm-local-dev-key` | Must match `API_KEY` — used by `report_pattern` when submitting |
| `DESIGN_MIND_API_URL` | `http://localhost:3456` | Base URL of the candidates API (set to your Railway URL in production) |
| `SLACK_WEBHOOK_URL` | — | Optional Slack webhook for candidate notifications |
| `DESIGN_MIND_PROJECT` | (dirname) | Project name attached to candidate submissions |

If the API is unreachable, `report_pattern` falls back to writing the candidate locally to `blocks/_candidates/`.

**Deduplication:** Candidates are compared using composite similarity across name, description, and intent. Submissions above a 0.2 similarity threshold increment a frequency counter rather than creating a duplicate. At 3+ reports from separate projects a candidate is flagged `ready_for_ratification`.

---

## Ratification flow

```
Any consumer project
  → calls report_pattern
  → POST /candidates to hosted API
  → Maintainer gets Slack notification
  → Maintainer reviews, promotes to blocks/ or surfaces/
  → Hot-reload picks it up automatically (dev) or redeploy on Railway (prod)
```

---

## Block structure

Each ratified block lives in `blocks/<BlockName>/`:

```
meta.yaml       — id, summary, level, when, not_when, because, confidence
component.tsx   — reference implementation (optional — some blocks are genome-only)
```

Candidate blocks waiting for ratification are in `blocks/_candidates/`.

### Block variation rule

Blocks have **invariants** (the container, layout, interaction model — never change) and **slots** (title, label, meta items, actions — fill freely per domain).

**The single threshold question: "Am I changing structure or content?"**

- Changing slot content (different label, entity type, icon, token) → use the existing block as-is. Do not call `report_pattern`.
- Changing structure (new layout, new interaction model, new slot arrangement) → call `report_pattern` to log a candidate.

This keeps the genome lean. Four domain-named patterns (CareGapCard, CareGapRow, TaskActionRow, TaskRow) were correctly collapsed into one structural block (ActionableRow with `variant="row"` and `variant="card"`).

### Current blocks

| Block | Level | Use for |
|-------|-------|---------|
| `ActionableRow` | composite | Any entity in a list that needs a primary action — tasks, protocols, assessments. `variant="row"` inside a shared container; `variant="card"` as standalone cards |
| `AlertBanner` | composite | Severity-driven alerts requiring user attention or acknowledgment |
| `EntityContextHeader` | composite | Entity identity at the top of any entity-scoped surface |
| `StatCard` | primitive | Summary metric or count display |
| `EntityRow` | composite | Entity in a population/worklist view with score, tier, and primary action |
| `SectionHeader` | primitive | Section label with optional count and action |
| `ChatQuickActionChip` | domain | Quick action chips in the chat interface |
| `InlineEntityCard` | domain | Compact entity card inline in chat or detail views |
| `ActivityLogRow` | domain | Single activity entry in a chronological log |
| `AssessmentTab` | domain | Structured assessment/questionnaire tab |

---

## Architecture (v2)

The v2 architecture replaced the flat-file cosine vector store and TF-IDF retrieval pipeline with full LLM reasoning over the entire genome.

### Genome loader

At startup, `genomeLoader.js` reads all blocks (`blocks/*/meta.yaml` + `component.tsx`), surfaces (`surfaces/*.surface.yaml`), rules (`genome/rules/*.rule.md`), safety constraints (`safety/hard-constraints.md`), ontology files, taste, and principles into a module-level in-memory cache. The cache is used for all tool calls; hot-reload (dev only) polls for file changes and swaps the cache atomically.

The legacy `knowledge.js` loader remains active alongside `genomeLoader.js` — it powers the keyword-scoring path in `contextAssembler.js` (surface matching, not-when penalty, composition hints) and the hot-reload in `index.js`.

### LLM composition

`llmClient.js` calls the Anthropic API (`claude-sonnet-4-5`) for both tools:

- `callDesignMind` — used by `consult_before_build`. Sends the full serialised genome as context, then the intent/scope/domain/user_type. The model selects matching blocks, identifies the surface (if any), applies rules and safety constraints, and returns a structured JSON response.
- `callCritic` — used by `review_output`. Sends the genome plus the generated code and auto-check results. Returns `honored`, `borderline`, `fix`, `novel`, and `copy_violations` arrays.

Both calls include a JSON-parse retry loop: if the model returns invalid JSON, one follow-up message is sent requesting clean JSON before giving up.

### Prompt caching

The genome context string is sent as a `cache_control: { type: "ephemeral" }` block in the first user message. This caches the genome prefix at the Anthropic API level so repeated calls within the cache TTL (5 minutes) avoid re-tokenising the ~25–30K token genome on every request.

### Tools

| Tool | Schema fields | Notes |
|------|--------------|-------|
| `consult_before_build` | `intent_description`, `scope`, `domain`, `user_type` | Replaced v1's `component_type`/`product_area` fields |
| `review_output` | `generated_output`, `original_intent`, `context_used` | Hybrid: auto-checks run first, then LLM critique |
| `report_pattern` | `pattern_name`, `description`, `intent_it_serves`, `why_existing_patterns_didnt_fit`, `closest_match_block_id` | Unchanged from v1 |
| `ping` | — | Returns build info and kb stats |

### Environment variable required

`ANTHROPIC_API_KEY` must be set. Without it, `callDesignMind` and `callCritic` return a fallback object with `build_mode: { mode: "block-composition" }`, empty `blocks`, and a gap entry explaining the LLM is not configured. The server starts and serves all four tools regardless — the API key is only needed for LLM-powered responses.
