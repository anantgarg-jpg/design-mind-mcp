# Design Mind MCP — Claude Code Implementation Prompts

## How to use this document

Run each prompt in a separate Claude Code session, in order.
Wait for each to complete and verify before moving to the next.
Each prompt is self-contained — paste it as-is.

---

## Prompt 1: Understand the repo and create a snapshot

```
Read the entire repo structure and give me a summary of:
1. Every directory and what it contains
2. Every server-side JS/TS file and its role (handler, assembler, transport, etc.)
3. The current tool schemas (input/output) for all 3 tools
4. All data files: blocks/*/meta.yaml count, surfaces/*.yaml count, genome/rules/* count, safety/*, ontology/*
5. Any vector store, embedding, or search-related code (files, functions, dependencies)
6. The current package.json dependencies

Output this as a file: docs/REPO_SNAPSHOT.md
Do NOT change any files yet.
```

---

## Prompt 2: Author surface regions (for all 6 surfaces)

```
Read all files in surfaces/*.surface.yaml and all blocks/*/meta.yaml.

For each surface, add a `regions` field that maps layout slots to specific blocks.
Each region has: slot (string), block_id (string referencing an existing block),
props_hint (string with suggested prop values for this surface context),
and layout_hint (string with CSS layout guidance).

Rules for authoring regions:
- Only reference blocks that exist in blocks/*/meta.yaml
- The block's `when` field must be compatible with the surface's intent
- Think about the visual structure: what goes at top, what's the main list,
  what's the empty state, what's the toolbar
- Include layout_hint with flex direction, gap, sticky behavior, overflow

Do this for all surfaces: Worklist, PatientDetail, Today, IntakeForm,
OutreachLog, AssessmentEntry (ClinicalAssessment).

After adding regions to each surface YAML, verify:
- Every block_id in every region exists as a directory in blocks/
- No region references a block whose not_when conflicts with the surface intent

Commit message: "feat: add regions field to all surface specs"
```

---

## Prompt 3: Remove the vector store and embedding infrastructure

```
The vector store, embedding generation, cosine similarity search, and TF-IDF
fallback are being replaced. The new architecture loads all genome files directly
and sends them to an LLM for reasoning.

Find and remove:
1. All vector store code (any file dealing with embeddings, cosine similarity,
   vector search, TF-IDF)
2. All embedding generation code and any pre-computed embedding files (.json, .bin)
3. Any npm dependencies only used for embeddings/vectors (remove from package.json)
4. The `embedding_hint` field does NOT get removed from meta.yaml files —
   it stays as documentation even though it's no longer used for search

Do NOT remove:
- Any genome data files (blocks, surfaces, rules, safety, ontology, taste, principles)
- The episodic memory log (memory/episodic-log.jsonl or similar)
- Any transport code (stdio, HTTP, SSE)
- The tool handler shell (we'll rewrite the internals next)
- The report_pattern tool or its candidate tracking

After removal, verify the server still starts (it will have broken tool handlers —
that's expected). Fix any import errors from removed modules.

Commit message: "refactor: remove vector store and embedding infrastructure"
```

---

## Prompt 4: Build the genome loader

```
Create a new module: src/genomeLoader.js (or .ts if the project uses TypeScript)

This module exports a single function: loadGenome()

It reads the ENTIRE genome into a structured object, cached in memory:
- blocks: Map<blockId, { meta: parsedYaml, tsxPath: string }>
  Read every blocks/*/meta.yaml file. Parse YAML. Store the parsed object.
  Store the path to component.tsx but do NOT read the .tsx content yet.
- surfaces: Map<surfaceId, parsedYaml>
  Read every surfaces/*.surface.yaml file. Parse YAML.
- rules: Map<ruleId, { meta: parsedFromIndex, fullContent: string }>
  Read genome/rules/_index.json for the registry.
  Read each rule file referenced in the index. Store full content as string.
- safety: string
  Read the full safety/hard-constraints.md as a string.
- ontology: Map<concept, parsedYaml>
  Read every ontology/*.yaml file. Parse YAML.
- taste: string
  Read genome/taste.md as a string.
- principles: string
  Read genome/principles.md as a string.
- severitySchema: parsedYaml
  Read safety/severity-schema.yaml. Parse YAML.

Implementation notes:
- Use Node.js fs.readFileSync at startup (not async — this is init-time)
- Parse YAML using the existing YAML parser in the project (js-yaml or yaml package)
- If no YAML parser exists, add `yaml` to package.json
- Cache the result in a module-level variable
- Export a refreshGenome() function that re-reads all files (for hot-reload)
- Export a getGenomeForLLM() function that serializes the genome into a single
  string suitable for an LLM context window:
  - All block meta.yamls (as YAML strings, NOT .tsx)
  - All surface YAMLs (full content)
  - All rules (full content)
  - Safety constraints (full text)
  - Ontology (full content)
  - Taste + principles
  - Format: clear section headers between each type
  - Target: ~25-30K tokens total

Also export a resolveTsx(blockIds: string[]): Map<string, string> function that
reads the component.tsx files ONLY for the specified block IDs and returns their
full content.

Add a console.log at startup showing: "Genome loaded: X blocks, Y surfaces, Z rules"

Commit message: "feat: add genome loader module — reads full genome into memory"
```

---

## Prompt 5: Create the Anthropic API client with caching

```
Create a new module: src/llmClient.js

This module wraps the Anthropic API for the Design Mind's internal LLM calls.

Install the Anthropic SDK: npm install @anthropic-ai/sdk

The module exports two functions:

1. callDesignMind({ genomeContext, intent, scope, domain, userType })
   - Makes a single API call to claude-sonnet-4-6
   - System message: the Design Mind system prompt from agents/mind/system-prompt.md
   - User message: the genome context (from getGenomeForLLM()) + the calling agent's
     intent, scope, domain, and user_type
   - Uses prompt caching: add cache_control: { type: "ephemeral" } at the top level
     of the request. The genome context is the stable prefix — structure the message
     so it comes first, then the dynamic intent comes last.
   - Requires structured JSON output from the LLM. Add to the system prompt:
     "You MUST respond with a JSON object matching this schema: { build_mode, 
     selected_blocks, regions, rules_applied, confidence, gaps }"
   - Temperature: 0 (deterministic composition)
   - Max tokens: 4096
   - Returns the parsed JSON response

2. callCritic({ generatedCode, originalIntent, genomeContext, autoCheckResults })
   - Makes a single API call to claude-sonnet-4-6
   - System message: the Critic agent system prompt from agents/critic/system-prompt.md
   - User message: the generated code + original intent + auto-check results
   - Uses prompt caching on the genome context portion
   - Temperature: 0
   - Max tokens: 4096
   - Returns the parsed JSON response

Error handling:
- Wrap API calls in try/catch
- If the response isn't valid JSON, retry once with a note "Your previous response
  was not valid JSON. Respond ONLY with the JSON object."
- Log API errors to console.error with the intent for debugging

Environment:
- Read ANTHROPIC_API_KEY from process.env
- If not set, log a warning and return a fallback response with confidence: 0
  and a gap saying "LLM not configured — returning retrieval-only results"

Commit message: "feat: add LLM client with prompt caching for Design Mind and Critic"
```

---

## Prompt 6: Rewrite consult_before_build handler

```
Rewrite the consult_before_build tool handler from scratch.

NEW INPUT SCHEMA:
  intent_description: string (required) — rich description of what to build
  scope: enum "surface" | "block" | "token" (required) — routing hint
  domain: enum "clinical-alerts" | "patient-data" | "care-gaps" | "tasks" |
          "navigation" | "data-display" | "forms" | "admin" | "other" (optional)
  user_type: array of enum "clinician" | "coordinator" | "patient" | "admin" |
             "data-engineer" (optional)

Remove: component_type, product_area from the input schema.

NEW TOOL DESCRIPTION (replace the existing one entirely):
"""
REQUIRED before generating ANY UI — component, page, surface, or style change.
Returns the design genome: component code templates, layout blueprints, safety
constraints, and copy rules for this platform. The response is a construction
packet — use it as a blueprint, not as suggestions.

HOW TO CALL:
1. Describe WHAT you are building. Be specific — include who uses it, what data
   it shows, what actions are available, and whether this is a new build or modification.
2. Send a SCOPE HINT: "surface" (full page/panel), "block" (single component),
   "token" (styling/spacing question).
3. Include domain and user_type if you can infer them from the codebase.

The server matches your description against its knowledge base. If it finds a known
page blueprint, it returns a full construction plan with layout regions, component
assignments, ordering rules, and hard constraints. If not, it returns the best
matching components with code templates for you to compose.

WRITING A GOOD DESCRIPTION:
  Good: "Coordinator-facing page showing prioritised patients with open care gaps.
        Each row: patient name, risk tier, gap status, due date. Actions: Close Gap."
  Bad: "a worklist"

HOW TO USE THE RESPONSE:
Read build_mode FIRST. "surface-first" means follow the blueprint exactly.
"block-composition" means compose from the returned blocks.
component_tsx in each block is the EXACT code template — copy the structure,
adapt only data source and state management.
safety_constraints are non-negotiable.
"""

HANDLER LOGIC:
1. Load genome via genomeLoader.loadGenome() (or use cached)
2. Build genome context string via genomeLoader.getGenomeForLLM()
3. Call llmClient.callDesignMind({ genomeContext, intent, scope, domain, userType })
4. The LLM returns JSON with: build_mode, selected_blocks (array of block IDs),
   regions (array of {slot, block_id, props_hint, layout_hint}),
   rules_applied (array of {rule_id, applies_because}),
   confidence, gaps
5. Resolve .tsx files: genomeLoader.resolveTsx(selectedBlockIds)
6. Assemble response:

NEW OUTPUT SCHEMA:
{
  build_mode: { mode: "surface-first" | "block-composition", anchor: { surface_id } | null },
  surface: <full surface YAML object if surface-first, null otherwise>,
  blocks: [
    {
      id: string,
      level: "primitive" | "composite" | "domain",
      meta_yaml: <full meta.yaml content as string>,
      component_tsx: <full .tsx content as string>,
      family_invariants: string[],
      import_path: string,
      when: string,
      not_when: string
    }
  ],
  primitive_guard: {
    instruction: "Import these from their declared paths. Do not override family_invariants.",
    primitives: [ { id, import_path, family_invariants } ]  // ALL primitives, always
  },
  rules: [ { rule_id, summary, applies_because, full_content } ],
  safety_constraints: [ { constraint_id, rule, applies_because } ],
  ontology_refs: [ { concept, canonical_name, ui_label, notes } ],
  confidence: number,
  gaps: string[]
}

Remove from output: patterns (replaced by blocks), canonical_block_set (replaced by
blocks array), similar_builds (episodic memory can be added back later), usage_signal.

The primitive_guard is always present — load ALL blocks with level: "primitive" from
the genome, regardless of what the LLM selected.

Log every call to memory/episodic-log.jsonl:
{ timestamp, intent, scope, domain, build_mode, selected_blocks, confidence }

Commit message: "feat: rewrite consult_before_build — genome loader + LLM composition"
```

---

## Prompt 7: Rewrite review_output handler

```
Rewrite the review_output tool handler.

The new architecture is hybrid: code auto-checks first, then LLM Critic.

STEP 1 — CODE AUTO-CHECKS (keep and enhance existing regex checks):
Run these against the generated_output string:
- Hardcoded hex colors (any #xxx or #xxxxxx not inside a comment)
- Tailwind default color classes (red-600, amber-100, blue-500, etc.)
- Critical alert dismiss: detect dismiss/close button near "critical" or "severity-critical"
- Patient first-name-only: detect first-name rendering without last name
- Copy voice violations: "Something went wrong", "Are you sure?", first-person pronouns
  (we, our, I), "Cancel" button (should be "Close"), "denied", "failed", "failure"
- Primitive reimplementation: detect <style> blocks or inline Tailwind that replicate
  a known primitive's family_invariants without importing the primitive
- Import path check: blocks should be imported from @/blocks/ not reinvented

Collect results as: { violation_type, found_text, rule_ref, severity: "blocker" | "warning" }

STEP 2 — LLM CRITIC:
Call llmClient.callCritic() with:
- The generated code
- The original intent
- The genome context (from genomeLoader)
- The auto-check results from step 1

The Critic LLM returns JSON with:
  honored: [{ observation, rule_ref }],
  borderline: [{ observation, tension, recommendation }],
  novel: [{ description, coherent_with_taste, reasoning }],
  fix: [{ problem, rule_violated, correction, safety_block }],
  candidate_patterns: [{ name, description }],
  copy_violations: [{ rule, found, correction }],
  invariant_check: [{ block, detection_method, invariants_present, invariants_missing, verdict }],
  confidence: number

STEP 3 — MERGE AND RETURN:
Combine code auto-check results with LLM Critic results.
Auto-check violations that overlap with LLM fix items get deduplicated.
Return the combined response.

Keep the existing input schema (generated_output, original_intent, context_used).

Commit message: "feat: rewrite review_output — hybrid code auto-checks + LLM Critic"
```

---

## Prompt 8: Update the Design Mind system prompt for structured output

```
Read agents/mind/system-prompt.md.

Update it for the new architecture. The Design Mind LLM now receives
the FULL genome (all meta.yamls, all surfaces, all rules, all safety)
and must return structured JSON.

Key changes to the system prompt:

1. Add at the top: "You receive the full genome — all block meta.yamls,
   all surface specs, all rules, safety constraints, taste, and principles.
   You have complete visibility into what exists."

2. Replace the section about how context is assembled per-request.
   The new reality: everything is provided every time.

3. Add structured output instructions. After reasoning, the LLM must return
   ONLY a JSON object with this exact schema:
   {
     "build_mode": { "mode": "surface-first" | "block-composition", "anchor": { "surface_id": "..." } | null },
     "selected_blocks": ["BlockId1", "BlockId2", ...],
     "regions": [
       { "slot": "header", "block_id": "EntityContextHeader", "props_hint": "...", "layout_hint": "..." },
       ...
     ],
     "rules_applied": [
       { "rule_id": "styling-tokens", "applies_because": "..." },
       ...
     ],
     "safety_applied": [
       { "constraint_id": 5, "applies_because": "..." },
       ...
     ],
     "ontology_refs": [
       { "concept": "Care Gap", "canonical_name": "Care Gap", "ui_label": "Care Gap" },
       ...
     ],
     "confidence": 0.92,
     "gaps": []
   }

4. Keep the existing guidance about surface-first vs block-composition:
   - If a surface spec matches, use its regions and reference its blocks
   - If no surface matches, compose regions from the best-matching blocks
   - In both cases, return the same JSON schema

5. Keep the existing guidance about what the Design Mind never does
   (override safety, approve severity colors decoratively, guess ontology, etc.)

6. Add: "For block-composition mode, compose a regions array that
   the calling agent can follow as a layout plan. This is a draft blueprint —
   assign blocks to named slots with prop and layout hints just like a
   human-authored surface spec would."

7. Keep temperature guidance: prefer consistency over creativity.

Do NOT change the Critic system prompt — that stays as-is.

Commit message: "feat: update Design Mind system prompt for full-genome + structured output"
```

---

## Prompt 9: Clean up and verify

```
Do a full cleanup pass:

1. Remove any dead imports across all server files
2. Remove any files that are no longer referenced:
   - Old context assembler (if replaced)
   - Old vector store modules
   - Old embedding generators
   - Any test files for removed modules
3. Verify package.json has no unused dependencies. Run:
   npm prune
4. Verify the server starts without errors:
   node index.js (or whatever the entry point is)
   If there are errors, fix them.
5. Verify the tool schemas are registered correctly by checking
   the MCP tool list output
6. Run a dry-run test: manually call consult_before_build with:
   {
     "intent_description": "Coordinator-facing worklist showing prioritised patients with open care gaps",
     "scope": "surface",
     "domain": "care-gaps",
     "user_type": ["coordinator"]
   }
   Verify the response has: build_mode, surface (with regions), blocks (with .tsx), rules, safety
7. Run a dry-run test for block-composition:
   {
     "intent_description": "Admin dashboard showing provider performance metrics with stat cards and a sortable table",
     "scope": "surface",
     "domain": "data-display",
     "user_type": ["admin"]
   }
   Verify: build_mode is block-composition, blocks have .tsx, regions are LLM-composed

8. Update the generate-context.js script to reflect the new architecture
   (if it references removed modules or old schemas)

9. Update README.md with:
   - New architecture description (genome loader + LLM reasoning + .tsx resolution)
   - New input schema for consult_before_build
   - New response schema
   - Note about ANTHROPIC_API_KEY environment variable requirement

Commit message: "chore: cleanup dead code, verify server, update docs"
```

---

## Prompt 10: Deploy and smoke test

```
Verify the Railway deployment configuration:

1. Check that ANTHROPIC_API_KEY is set in Railway environment variables
2. Check that the Procfile / start command is correct
3. Push to the deployment branch
4. After deployment, test the hosted endpoint:
   - Call consult_before_build via the SSE transport
   - Verify the response shape matches the new schema
   - Verify .tsx content is present in the blocks array
   - Verify prompt caching is working (check the API response for
     cache_creation_input_tokens vs cache_read_input_tokens)
5. Test from a consuming project:
   - Point a test project's .mcp.json at the hosted server
   - Have Claude Code call consult_before_build with a real intent
   - Verify the agent receives the construction plan
   - Verify the agent uses the .tsx templates

If caching is NOT working:
- Ensure the genome context string is positioned BEFORE the dynamic intent
  in the user message
- Ensure cache_control: { type: "ephemeral" } is at the request top level
- Check that the genome context exceeds 1024 tokens (minimum cacheable size)

Commit message: "deploy: v2.0.0 — genome loader + LLM composition architecture"
```

---

## Execution order summary

| Step | Prompt | What it does | Depends on |
|------|--------|-------------|------------|
| 1 | Snapshot | Understand repo, document current state | — |
| 2 | Regions | Add regions to all 6 surface YAMLs | — |
| 3 | Remove vectors | Delete vector store, embeddings, TF-IDF | Prompt 1 |
| 4 | Genome loader | Build the file-reading module | Prompt 3 |
| 5 | LLM client | Anthropic API wrapper with caching | Prompt 4 |
| 6 | consult handler | Rewrite the main tool | Prompts 4, 5 |
| 7 | review handler | Rewrite the review tool | Prompts 4, 5 |
| 8 | System prompt | Update for structured output | Prompt 6 |
| 9 | Cleanup | Remove dead code, verify, docs | All above |
| 10 | Deploy | Railway deploy, smoke test | Prompt 9 |
