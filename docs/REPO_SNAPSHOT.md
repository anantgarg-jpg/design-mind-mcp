# Design Mind MCP — Repository Snapshot

Generated: 2026-03-25

---

## 1. Directory Map

| Directory | Contents |
|---|---|
| `/` (root) | Top-level config files: `Dockerfile`, `start.sh`, `railway.toml`, `package.json`, `CLAUDE.md`, `README.md`, `claude-code-prompts.md`, project-context markdown files. |
| `.claude/` | Local Claude Code settings and project configuration (not checked into public scope). |
| `.github/workflows/` | One CI workflow: `sync-claude-context.yml` (presumably syncs project-context to Claude). |
| `adapters/` | Two adapter files: `base.adapter.interface.ts` (abstract interface) and `claude.adapter.ts` (Claude-specific implementation); defines how external LLM clients interface with the MCP server. |
| `agents/mind/` | `system-prompt.md` and `generate-context.js` — the "Mind" agent's system prompt and context-generation script. |
| `agents/critic/` | `system-prompt.md` — system prompt for the Critic agent that reviews generated UI output. |
| `api/` | Candidate submission REST API (separate from MCP server): `src/index.js` is the HTTP handler; `data/candidates.jsonl` persists submitted pattern candidates. |
| `blocks/` | 56 block directories, each with a `meta.yaml` and usually a `component.tsx`; divided into primitives, composites, and domain blocks. Also contains `_candidates/` for unratified candidate blocks. |
| `blocks/_candidates/` | 15 candidate files (YAML + preview TSX pairs) for patterns under human review. |
| `genome/` | Design system "genome": `rules/` directory with rule files, plus `taste.md` and `principles.md` (not yet present as files in rules/ — two referenced in `_index.json` are missing from disk). |
| `genome/rules/` | 4 active `.rule.md` files plus `_index.json` registry. |
| `memory/` | Persistent runtime logs: `episodic-log.jsonl` (22 lines), `gap-observations.jsonl` (19 lines), and `vector-db.config.yaml` (provider-agnostic embedding config). |
| `ontology/` | 4 files defining canonical clinical domain concepts: `entities.yaml`, `states.yaml`, `actions.yaml`, `copy-voice.md`. |
| `safety/` | 2 files: `hard-constraints.md` (26 numbered constraints, agent-immutable) and `severity-schema.yaml` (machine-readable severity token map). |
| `scripts/` | `triage-candidates.js` — maintenance script to triage candidate blocks in `blocks/_candidates/`. |
| `server/` | Node.js MCP server: `src/` contains all server-side JS modules; `.index/` caches TF-IDF indexes; `.vectors/` (if seeded) stores flat-file embedding vectors; `node_modules/` has the single npm dependency. |
| `showcase/` | Vite + React app for visually previewing all blocks and surfaces; `src/App.tsx` imports every block's showcase page and the surfaces/candidates pages. |
| `surfaces/` | 6 `.surface.yaml` files (ClinicalAssessment, IntakeForm, OutreachLog, PatientDetail, Today, Worklist) plus 6 matching `.preview.tsx` React previews. |
| `tools/` | 3 schema YAML files (`consult_before_build`, `review_output`, `report_pattern`) documenting tool input/output contracts. |

---

## 2. Server-Side JS Files in `server/src/`

### `index.js` — Transport + Tool Dispatcher

The server entry point. Reads `TRANSPORT` env var to decide between two modes:

- **stdio** (default): JSON-RPC 2.0 over stdin/stdout; used for local Claude Code MCP config.
- **sse**: HTTP server on `PORT` (default 8080) with:
  - `GET /sse` — opens an SSE stream, returns a `sessionId`-keyed endpoint URL
  - `POST /messages?sessionId=x` — receives JSON-RPC messages and emits responses over SSE
  - `POST /candidates` — accepts candidate submissions (API key required)
  - `GET /candidates` — lists all candidates (API key required)
  - `POST /seed` — force-rebuilds TF-IDF indexes
  - `GET /health` — health check

On startup: calls `loadKnowledge()`, builds or loads cached TF-IDF indexes from `server/.index/`, checks whether the flat-file vector store is seeded (`server/.vectors/`), and starts hot-reload polling (disabled in production). Routes tool calls to `handleToolCall()`, which delegates to `contextAssembler.js`. Embeds git commit SHA into every `consult_before_build` response via `_server.commit`.

Defines all 4 MCP tool schemas inline as the `TOOLS` array (see Section 3).

### `contextAssembler.js` — Core Tool Logic (Handler)

Implements the three MCP tools:

- **`consultBeforeBuild(args, kb, patternIndex, ruleIndex, surfaces)`**: Queries patterns and rules using either semantic vector search (if seeded) or TF-IDF fallback. Applies `not_when` penalty (demotes patterns whose `not_when` text overlaps the intent by ≥ 2 tokens, multiplying score by 0.3), applies `structuralBoost` (+0.35 for type family match), runs `stableSort`, builds composition hints for pairs in the 0.45–0.72 ambiguous zone, fires a structure-vs-content gap probe for the top result in the 0.55–0.74 zone, assembles ontology refs and safety constraints, and returns the full context payload.

- **`reviewOutput(args, kb, patternIndex)`**: Critiques generated code against the genome — honored patterns/rules, borderline tensions, novel observations, fixes (with `safety_block` flag), `primitive_violations`, `copy_violations`, and an `invariant_check` array per primitive in scope.

- **`reportPattern(args, basePath)`**: Writes a candidate YAML to `blocks/_candidates/` and (in SSE/HTTP mode) POSTs to the candidate API at `http://localhost:3456`. Returns `candidate_id`, `status`, and `frequency_count`.

Helper functions: `tokenize`, `applyNotWhenPenalty`, `buildCompositionHints`, `buildGapProbe`, `queryPatterns`, `queryRules`, `stableSort`, `structuralBoost`.

Exports `setUseVectorStore(val)` called by `index.js` after seeding check.

### `knowledge.js` — Knowledge Base Loader

Exports `loadKnowledge(basePath)` which reads all data into a structured `kb` object:

- **Blocks**: scans `blocks/*/meta.yaml` (skips `_` prefixed dirs and `status: deprecated` entries); parses YAML via Python's `PyYAML` (`spawnSync('python3', ...)`); builds `embedding_input` string from id, summary, when, not_when, because, embedding_hint, structural_family, component_type.
- **Rules**: scans `genome/rules/*.rule.md`; parses RULE/VERSION/CONFIDENCE/APPLIES_TO/WHEN/USE/NOT/BECAUSE directives from markdown.
- **Ontology**: reads all `.yaml` and `.md` files from `ontology/`.
- **Safety**: reads `hard-constraints.md` and parses numbered constraints; reads `severity-schema.yaml`.
- **Surfaces**: reads all `*.surface.yaml` files from `surfaces/`; builds `embedding_input` from id, intent, what_it_omits, never, user_type.
- **Taste/Principles**: reads `genome/taste.md` and `genome/principles.md` (full text for review context).

Returns `kb` with `_loadedAt` timestamp.

### `vectorIndex.js` — TF-IDF Search (Fallback Search Engine)

Zero external dependencies. Implements:

- `buildIndex(documents)` — tokenizes all docs, computes IDF across corpus, stores per-document TF-IDF vectors.
- `query(index, queryText, topK)` — cosine similarity between query vector and all document vectors; returns top-K with `score > 0`.
- `saveIndex(index, filePath)` — persists to JSON.
- `loadIndex(filePath)` — restores from JSON (returns `null` if file missing).
- `buildKnowledgeIndexes(kb)` — builds `patternIndex` and `ruleIndex` from a loaded `kb`, including the metadata fields stored per-document for retrieval.

Tokenizer: lowercases, strips non-word chars, removes a fixed stopword list, filters tokens < 3 chars.

### `vectorstore.js` — Flat-File Vector Store (Primary Search When Seeded)

Zero external dependencies. Stores embedding vectors as JSON in `server/.vectors/dm_patterns.json` and `server/.vectors/dm_rules.json`. Collections held in an in-memory cache (`_cache`) for fast repeated queries.

Key functions:

| Function | Role |
|---|---|
| `ensureCollection(name)` | Creates empty collection file if absent |
| `recreateCollection(name)` | Wipes and recreates a collection (used by seed scripts) |
| `upsert(name, points)` | Overwrites existing IDs, appends new; persists to disk and updates cache |
| `search(name, vector, topK)` | Brute-force cosine similarity over all stored points; returns `[{id, score, payload}]` |
| `isSeeded(name)` | Returns true if collection file exists and has at least one point |
| `checkAvailability()` | Always returns `{available: true}` (no external service) |

### `embedder.js` — Local Neural Embedder

Uses `@xenova/transformers` to run `Xenova/all-MiniLM-L6-v2` (384-dim ONNX model) locally. No API keys. Model weights (~90 MB) download automatically to `~/.cache/huggingface/` on first run.

Key functions:

| Function | Role |
|---|---|
| `embedOne(text)` | Embeds a single string; returns `number[]` (384-dim) via mean pooling + normalize |
| `embed(texts)` | Batches `embedOne` calls sequentially |
| `isConfigured()` | Always returns `true` |

Alternative model via `EMBED_MODEL=Xenova/nomic-embed-text-v1` (768-dim, ~274 MB).

### `seed.js` — TF-IDF Re-indexer

CLI script (`npm run seed`). Deletes and rebuilds `.index/blocks.json`, `.index/patterns.json`, `.index/rules.json` from the current knowledge base. Prints validation output (pattern/rule IDs + term counts, safety constraint count).

### `seed-vectors.js` — Semantic Vector Seeder (Primary)

CLI script (`npm run seed:vectors`). Loads knowledge base, calls `embed()` on all pattern and rule documents using the local ONNX model, and upserts into the flat-file vector store (`dm_patterns`, `dm_rules`). Uses a djb2 hash for stable numeric point IDs. Re-run whenever blocks or rules change.

### `seed-qdrant.js` — Legacy Qdrant Seeder (Unused in Production)

An earlier seeder that targeted an external Qdrant instance + Ollama for embeddings. Not referenced by the current server startup flow. Kept for reference; the production path uses `seed-vectors.js` + `vectorstore.js` instead.

---

## 3. Tool Schemas

### `consult_before_build`

**Purpose**: Call once per block before writing code, in level order (primitives → composites → surfaces).

**Input** (all required except `product_area`):

| Field | Type | Enum / Notes |
|---|---|---|
| `intent_description` | string | Plain-language description of what to build |
| `component_type` | string enum | `card`, `row`, `banner`, `header`, `modal`, `drawer`, `form`, `table`, `list`, `badge`, `button`, `page`, `panel`, `other` |
| `domain` | string enum | `clinical-alerts`, `patient-data`, `care-gaps`, `tasks`, `care-protocols`, `assessments`, `navigation`, `data-display`, `forms`, `admin`, `other` |
| `user_type` | array of string enum | `clinician`, `coordinator`, `patient`, `admin` |
| `product_area` | string | Optional |

**Output fields**:

| Field | Type | Description |
|---|---|---|
| `patterns` | array | Ranked relevant blocks; each item has `id`, `level`, `family_invariants`, `relevance_score`, `when`, `not_when`, `because`, `confidence`, `usage_signal` |
| `canonical_block_set` | array of string | Alphabetically sorted list of block IDs at or above the relevance threshold — the authoritative composition set |
| `primitive_guard` | object | Lists ALL active primitive blocks with their `import_path` and `family_invariants`; always present; references hard-constraints 22 & 25 |
| `rules` | array | Applicable genome rules with `rule_id`, `summary`, `applies_because` |
| `ontology_refs` | array | Relevant ontology concepts with `concept`, `canonical_name`, `ui_label`, `notes` |
| `safety_constraints` | array | In-scope hard constraints with `constraint_id`, `rule`, `applies_because` |
| `similar_builds` | array | Episodic memory matches with `build_id`, `intent`, `what_worked`, `what_to_watch` |
| `confidence` | number | 0.0–1.0; below 0.7 signals likely invention |
| `gaps` | array of string | What the genome doesn't yet cover for this intent |
| `_server` | object | `{commit: string}` — git SHA of the running build |

### `review_output`

**Purpose**: Post-generation critique of generated code against the genome.

**Input**:

| Field | Type | Required |
|---|---|---|
| `generated_output` | string | Yes — the generated code or UI description |
| `original_intent` | string | Yes — same intent passed to `consult_before_build` |
| `context_used` | object | No — context returned from `consult_before_build` |

**Output fields**:

| Field | Type | Description |
|---|---|---|
| `honored` | array | Observations of what followed the genome; each has `observation`, `rule_or_pattern_ref` |
| `borderline` | array | Tensions between rules or recommended-but-unused blocks; each has `observation`, `tension`, `recommendation` |
| `novel` | array | Novel items observed; each has `description`, `coherent_with_taste`, `coherence_reasoning` |
| `fix` | array | All violations requiring correction; each has `problem`, `rule_violated`, `correction`, `safety_block` (bool) |
| `primitive_violations` | array | Subset of `fix` items from hard-constraints 22 (className override of invariants) and 25 (primitive reimplemented inline); always `safety_block: true`; surfaced separately to allow independent gating |
| `copy_violations` | array | Copy-voice and clinical language violations with `rule`, `found`, `correction` |
| `invariant_check` | array | Per-primitive invariant audit; one entry per primitive in scope (imported, JSX usage, style reimplementation, inline Tailwind, or recommended at score ≥ 0.45). Each has `block`, `detection_method`, `invariants_present`, `invariants_missing`, `verdict` |
| `candidate_patterns` | array | Novel items worth promoting; each has `name`, `description`, `promoted_to_candidates` |
| `confidence` | number | Overall genome compliance score (0.0–1.0); safety-block violations deduct 20%, soft fixes 10%, borderline/copy 5% each |

### `report_pattern`

**Purpose**: Log a novel structural pattern that the genome doesn't cover for human ratification.

**Input** (all required except `type`, `implementation_ref`, `ontology_refs`, `preview_code`):

| Field | Type | Notes |
|---|---|---|
| `pattern_name` | string | Short descriptive name, e.g. "BulkActionToolbar" |
| `description` | string | What the block is and what problem it solves |
| `intent_it_serves` | string | The user intent addressed |
| `why_existing_patterns_didnt_fit` | string | What was checked and why it didn't match |
| `closest_match_block_id` | string | ID of closest block from `consult_before_build`, or `"none"` |
| `type` | string enum | `primitive`, `composite`, `domain`, `surface` |
| `implementation_ref` | string | Optional file path or PR link |
| `ontology_refs` | array of string | Optional ontology entities, states, actions touched |
| `preview_code` | string | Optional self-contained React/TSX component for showcase preview |

**Output fields**:

| Field | Type | Description |
|---|---|---|
| `candidate_id` | string | Timestamp-slug ID assigned to the candidate |
| `similar_candidates` | array | Other queued candidates that may be the same pattern |
| `frequency_count` | number | How many times reported (1 = first sighting) |
| `status` | string enum | `logged` (1x), `needs_more_signal` (2x), `ready_for_ratification` (3+) |

### `ping`

**Purpose**: Health check and build info. No required input. Returns `server`, `commit`, `commit_msg`, `started_at`, `kb_loaded_at`, `knowledge_base`, `vector_search` mode, `kb_stats` (pattern/surface/rule counts, ontology keys, taste/principles hashes), `genome_rules` list, and `token_set_version`.

---

## 4. Data File Counts

| Category | Count | Notes |
|---|---|---|
| `blocks/*/meta.yaml` | **56** | Excludes `_candidates/`; includes all named block directories |
| `blocks/_candidates/` files | **15** | 11 YAML + 3 YAML+TSX preview pairs + 1 YAML-only (2026-03-25) |
| `surfaces/*.surface.yaml` | **6** | ClinicalAssessment, IntakeForm, OutreachLog, PatientDetail, Today, Worklist |
| `genome/rules/*.rule.md` | **4** | `copy-voice`, `data-density`, `destructive-actions`, `styling-tokens` |
| `genome/rules/_index.json` entries | **6** rules, **48** blocks listed | _index.json references `interface-guidelines` and `accessibility` rules that do not yet exist as `.rule.md` files on disk |
| `safety/` files | **2** | `hard-constraints.md` (26 numbered constraints), `severity-schema.yaml` (4 severity levels) |
| `ontology/` files | **4** | `actions.yaml`, `copy-voice.md`, `entities.yaml`, `states.yaml` |
| `memory/episodic-log.jsonl` | **22 lines** | Header comment + interaction records |
| `memory/gap-observations.jsonl` | **19 lines** | Gap observation records |

---

## 5. Vector Store, Embedding, and Search-Related Code

### Search Architecture

The server supports two search backends selected at startup by `isSeeded('dm_patterns')`:

1. **Semantic (primary)**: Flat-file cosine similarity over ONNX-computed embeddings stored in `server/.vectors/`. Active when `server/.vectors/dm_patterns.json` and `server/.vectors/dm_rules.json` exist and are non-empty.
2. **TF-IDF (fallback)**: In-memory TF-IDF indexes loaded from `server/.index/blocks.json` and `server/.index/rules.json`. Built at startup if not cached.

### Relevant Files

| File | Role |
|---|---|
| `server/src/embedder.js` | Loads `Xenova/all-MiniLM-L6-v2` ONNX model; `embedOne(text)` → `number[384]`; `embed(texts[])` batches calls |
| `server/src/vectorstore.js` | Flat-file vector store; `upsert`, `search` (brute-force cosine), `isSeeded`, `ensureCollection`, `recreateCollection` |
| `server/src/vectorIndex.js` | TF-IDF fallback; `buildIndex`, `query`, `saveIndex`, `loadIndex`, `buildKnowledgeIndexes` |
| `server/src/seed-vectors.js` | Seeds the flat-file vector store from the live knowledge base using the local ONNX model |
| `server/src/seed.js` | Rebuilds only the TF-IDF `.index/` cache |
| `server/src/seed-qdrant.js` | Legacy script targeting an external Qdrant + Ollama setup (not used in current production path) |
| `server/src/contextAssembler.js` | `queryPatterns()` and `queryRules()` choose between vector or TF-IDF based on `_useVectorStore` flag |
| `memory/vector-db.config.yaml` | Provider-agnostic config referencing `nomic-embed-text` / Ollama (describes the legacy Qdrant path; the current flat-file path does not read this file at runtime) |

### Key Functions

| Function | File | Description |
|---|---|---|
| `embedOne(text)` | `embedder.js` | Single-text embedding via ONNX pipeline, mean pooling, normalized |
| `embed(texts)` | `embedder.js` | Sequential batch wrapper around `embedOne` |
| `upsert(name, points)` | `vectorstore.js` | Write points to `.vectors/<name>.json`, update in-memory cache |
| `search(name, vector, topK)` | `vectorstore.js` | Brute-force cosine similarity; returns `[{id, score, payload}]` |
| `isSeeded(name)` | `vectorstore.js` | Checks if collection file exists and has `points.length > 0` |
| `buildIndex(docs)` | `vectorIndex.js` | Builds TF-IDF vectors for all documents |
| `query(index, text, k)` | `vectorIndex.js` | Cosine similarity search over TF-IDF vectors |
| `buildKnowledgeIndexes(kb)` | `vectorIndex.js` | Top-level builder producing `{patternIndex, ruleIndex}` from a loaded `kb` |
| `queryPatterns(text, k, idx)` | `contextAssembler.js` | Routes to vector or TF-IDF based on `_useVectorStore`; returns `[{id, score, metadata}]` |

### npm Dependencies (embedding)

| Package | Version | Purpose |
|---|---|---|
| `@xenova/transformers` | `^2.17.2` | ONNX Runtime for Node.js + HuggingFace model loader; sole npm dependency of the server |

Collection names: `dm_patterns`, `dm_rules`. Storage path: `server/.vectors/`. Vector dimension: 384 (default model) or 768 (nomic model).

---

## 6. Package Dependencies

### Root `package.json` (`@design-mind/mcp`, v1.0.0)

**No `dependencies` or `devDependencies` declared at root level.** All dependencies live in `server/package.json`.

Scripts:
```
start             → node server/src/index.js
seed              → node server/src/seed.js
seed:vectors      → node server/src/seed-vectors.js
api               → node api/src/index.js
api:dev           → node --watch api/src/index.js
triage:candidates → node scripts/triage-candidates.js
```

Engines: `node >= 18.0.0`

### `server/package.json` (`design-mind-mcp-server`, v1.0.0)

**dependencies**:

| Package | Version | Purpose |
|---|---|---|
| `@xenova/transformers` | `^2.17.2` | Local ONNX embedding model (all-MiniLM-L6-v2) |

No devDependencies. The server has exactly one npm dependency. All other functionality (YAML parsing, HTTP, crypto, file I/O) uses Node.js built-ins, with YAML specifically delegated to the system Python 3 `PyYAML` package (installed in the Docker image via `apt-get`).

---

## 7. Entry Point and Server Startup

### `start.sh`

```sh
#!/bin/sh
PORT=3456 node api/src/index.js &
TRANSPORT=sse node server/src/index.js
```

Starts two processes in the same container:
1. **Candidate API** on port 3456 (background) — `api/src/index.js`
2. **MCP server** with SSE transport on port 8080 (foreground) — `server/src/index.js`

The MCP server calls `http://localhost:3456/candidates` (POST) from within `contextAssembler.js` when `reportPattern` is invoked.

### `Dockerfile`

Base: `node:18-slim`

Build steps:
1. Install `python3` and `python3-yaml` via apt (required by `knowledge.js` for YAML parsing via `spawnSync('python3', ...)`)
2. Copy `server/package.json`, run `npm install --production` (installs only `@xenova/transformers`)
3. Copy the full repo (genome, blocks, surfaces, ontology, safety, api, scripts, server/src, etc.)
4. Expose port 8080
5. Set `TRANSPORT=sse`, `PORT=8080`
6. Set health check: `wget -qO- http://localhost:8080/health` every 30s, 15s start period
7. `CMD ["sh", "start.sh"]`

### `railway.toml`

```toml
[build]
builder = "dockerfile"

[deploy]
startCommand = "sh /app/start.sh"
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

Environment variables injected by Railway: `TRANSPORT=sse`, `NODE_ENV=production`.

Additional env vars consumed at runtime (not in railway.toml, must be set as Railway secrets):
- `API_KEY` / `DESIGN_MIND_API_KEY` — protects `/candidates` endpoint (defaults to `dm-local-dev-key`)
- `SLACK_WEBHOOK_URL` — optional Slack notification on candidate submission
- `GITHUB_TOKEN` + `GITHUB_REPO` + `GITHUB_BRANCH` — optional GitHub commit of candidate YAML
- `PUBLIC_URL` — canonical public base URL for SSE endpoint construction (falls back to `Host` header)
- `PORT` — HTTP port (default 8080)
- `EMBED_MODEL` — override default embedding model (default `Xenova/all-MiniLM-L6-v2`)
- `HOT_RELOAD` / `HOT_RELOAD_INTERVAL` — control file-watching reload (disabled in production)

### Startup Sequence (SSE mode)

1. `main()` in `index.js` calls `initialize()`
2. `initialize()` calls `loadKnowledge(BASE_PATH)` — parses all blocks, rules, ontology, safety, surfaces from disk
3. Checks for cached TF-IDF indexes in `server/.index/`; builds and saves them if absent
4. Checks `isSeeded('dm_patterns')` and `isSeeded('dm_rules')`; if both true, calls `setUseVectorStore(true)` and logs "local semantic (flat-file cosine)", otherwise logs "TF-IDF fallback"
5. `startHotReload(BASE_PATH)` — sets up mtime polling (disabled when `NODE_ENV=production`)
6. `startHttp(port)` — binds to `0.0.0.0:8080`

---

## Notes on Discrepancies Found

- `genome/rules/_index.json` references `interface-guidelines.rule.md` and `accessibility.rule.md`, but neither file exists in `genome/rules/` on disk. Only 4 `.rule.md` files are physically present: `copy-voice`, `data-density`, `destructive-actions`, `styling-tokens`.
- `server/src/seed-qdrant.js` imports `isReachable` from `vectorstore.js`, but the current `vectorstore.js` does not export `isReachable` — it exports `checkAvailability`. This script is not invoked by any npm script or the server startup path, so it would fail if run against the current codebase.
- `genome/taste.md` and `genome/principles.md` are read by `knowledge.js` but were not found during directory listing — their absence is handled gracefully (empty string fallback).
