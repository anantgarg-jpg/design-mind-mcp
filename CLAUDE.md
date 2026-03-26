# Project Instructions

## Block Consultation Protocol

Before writing ANY UI code, identify all blocks needed across all levels. Then call `consult_before_build` once per block, in this strict level order:

1. **Primitives first** (Button, Card, Badge, Icon, etc.) — resolve these before moving up. Primitive `family_invariants` are immutable and must be known before composites are designed.
2. **Composites/Domain blocks second** (Dialog, Alert, Row, etc.) — only after all primitives are addressed. Example: a Dialog uses Card as its background container; consult Card first, then Dialog.
3. **Surfaces last** (Page, Panel) — only after composites are addressed.

**Rules:**
- One call per block — never batch multiple blocks into a single consultation
- Do not skip levels — if a composite uses a primitive, the primitive must be consulted first
- Never use `component_type: "page"` or `"panel"` as a proxy for block-level consultation of lower-level components
- Even familiar or simple blocks require a call before implementation — no exceptions
- If `consult_before_build` returns `build_mode: "block-composition"`, that is **not clearance to build**. It means no surface matched — you must restart the protocol at primitive level, consulting every block the UI needs individually before writing any code.

## Git Policy

Never push to GitHub / the remote unless explicitly asked. Always work on a local branch.

## Color Token Responses

When asked about a color token, always resolve it to its full chain:
1. The Tailwind class (e.g. `text-warning-text`)
2. The semantic CSS variable (e.g. `--warning-text`)
3. The palette scale step from `styling-tokens.rule.md` (e.g. Yellow-900)
4. The hex value (e.g. `#987206`)
