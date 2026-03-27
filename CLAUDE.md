# Project Instructions

## Block Consultation Protocol

Before writing ANY UI code, call `consult_before_build` with the application intent and decomposed workflows. The tool returns surface matching, layout structure, and per-workflow block assignments.

**How to call:**
1. Describe the full application intent (who uses it, what data, what actions)
2. Decompose the intent into workflows — bounded UI sections as `{ id, intent, region? }` objects
3. Include scope, domain, and user_type
4. The response includes `surface` (matched or not), `layout` (regions), and `workflows` (per-workflow blocks)

**How to use the response:**
- Read `surface.matched` first — if true, the layout regions are authoritative (from a surface spec)
- If `surface.matched` is false, `layout` is an LLM-generated skeleton — treat as strong recommendation
- Import all blocks from `@innovaccer/ui-assets` using the exact `import_instruction` in the response
- Never reimplement blocks inline. Never override `family_invariants`.
- After generating code, call `review_output` with the generated code, original intent, and the consultation response as `context_used`

## Git Policy

Never push to GitHub / the remote unless explicitly asked. Always work on a local branch.

## Color Token Responses

When asked about a color token, always resolve it to its full chain:
1. The Tailwind class (e.g. `text-warning-text`)
2. The semantic CSS variable (e.g. `--warning-text`)
3. The palette scale step from `styling-tokens.rule.md` (e.g. Yellow-900)
4. The hex value (e.g. `#987206`)
