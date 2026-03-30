# Project Instructions

## Architecture: Agent-First (Mode B)

The genome is served as MCP resources. Read them at session start — they are your context.
The MCP tools do not do layout or block selection for you. You own the composition.

**Read these resources before writing any UI:**
- `design-mind://blocks/manifest` — full block palette (id, level, import_instruction, when, not_when, family_invariants)
- `design-mind://surfaces/manifest` — ratified surface patterns (starts empty, populates as patterns ratify)
- `design-mind://genome/safety` — hard clinical rules, non-negotiable
- `design-mind://genome/ontology` — canonical entity names, state labels, action verbs
- `design-mind://genome/tokens` — color, spacing, typography rules
- `design-mind://genome/copy-voice` — clinical tone, number formatting, confirmation copy
- `design-mind://genome/principles` — the eight product principles
- `design-mind://genome/taste` — aesthetic identity, design dials (variance/motion/density baselines)

## Block Consultation Protocol

**Step 1 — Before writing any UI**, call `consult_before_build`:
- Pass `intent_description`: who uses it, what data, what actions
- Pass `domain` and `user_type` if inferable
- Returns `prior_builds` — what similar surfaces looked like before ratification. Use as signal, not prescription.

**Step 2 — Compose using the genome resources, in this precedence order:**
1. **Ratified surface** (`surfaces/manifest`) — if an entry matches your intent, its `canonical_structure` is authoritative. Do not deviate.
2. **Ratified blocks** (`blocks/manifest`) — use `when` / `not_when` to select. `family_invariants` are immutable. Import from `@innovaccer/ui-assets` using `import_instruction`. Never reimplement inline.
3. **`prior_builds`** (returned by `consult_before_build`) — weak signal only. Shows what teams built before ratification. If a ratified block covers the intent, use it — prior builds do not override the manifest.

**Step 3 — After generating code**, call `review_output`:
- Pass `generated_output`, `original_intent`, and optionally `context_used` (the consult response)
- If the response contains `candidate_patterns`, you **must** call `report_pattern` for each entry before proceeding — this is a separate obligation from review

**Step 4 — If you built something structurally new**, call `report_pattern`:
- Only when structure changed — new interaction model, different layout container, different slot arrangement
- Content variation (different label, domain, icon, token) is free — do not report it
- The single threshold question: "Am I changing structure or content?"

## Git Policy

Never push to GitHub / the remote unless explicitly asked. Always work on a local branch.

## Color Token Responses

When asked about a color token, always resolve it to its full chain:
1. The Tailwind class (e.g. `text-warning-text`)
2. The semantic CSS variable (e.g. `--warning-text`)
3. The palette scale step from `styling-tokens.rule.md` (e.g. Yellow-900)
4. The hex value (e.g. `#987206`)
