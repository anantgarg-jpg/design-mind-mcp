# Design Mind MCP — Project Context

> Auto-generated from repo on 2026-03-28. Do not edit manually — run `node scripts/generate-context.js` to refresh.

**Repo (GitLab):** https://gitlab.innovaccer.com/innovaccer-ui/design-mind-mcp.git
**Hosted MCP:** https://design-mind.truefoundry-aws.innovaccer.com/sse
**Showcase repo:** https://gitlab.innovaccer.com/innovaccer-ui/design-mind-showcase

---

## What this project is

Design Mind MCP is a Claude Code tool (MCP server) that enforces consistent, safe, and ontologically correct UI generation across any frontend project that connects to it. It acts as the accumulated design intelligence of a clinical healthcare platform — with memory, taste, and the authority to push back on decisions that feel wrong.

Any team can point their `.mcp.json` at the hosted server and get the full Design Mind genome at build time.

Tech stack: Node.js 18+, ES modules, dual stdio/HTTP+SSE transport, TrueFoundry deployment, LLM reasoning over full genome (no flat-file vector store). No framework — pure Node `http`. Source of truth for block implementations: `@innovaccer/ui-assets` npm package.

---

## MCP Tools

Three tools exposed by the server:

**`consult_before_build`** — Call BEFORE generating any UI. Required: `intent_description`. Optional: `domain`, `user_type`, `workflows`, `project_root`. Returns: surface matching (always `matched: false` — surfaces removed from genome), layout structure (LLM-generated from genome principles), per-workflow block assignments, applicable genome rules, ontology refs, safety constraints, confidence score (0.0–1.0), and gap flags.

**`review_output`** — Call AFTER generating UI. Takes `generated_output` (code) + `original_intent` + optional `context_used`. Returns: `honored` (what followed the genome), `borderline` (defensible but not clearly right), `novel` (invented patterns with taste assessment), `fix` (violations with correction guidance), `copy_violations` (copy-voice.md breaches), `confidence` score. Auto-checks: hardcoded hex colors, Tailwind default color classes, Critical alert dismiss buttons, patient first-name-only, forbidden clinical terms, copy voice violations.

**`report_pattern`** — Call ONLY when UI STRUCTURE changes (new layout, new interaction model, new slot arrangement). NOT when slot content changes (label, domain, icon, entity type). Submits to hosted API → Slack → human ratification. Falls back to `blocks/_candidates/` YAML. 3+ reports across projects = `ready_for_ratification`.

**Pattern variation rule:** "Am I changing structure or content?" Content changes → use existing block. Structure changes → call `report_pattern`.

### Tool schemas

#### consult_before_build
```yaml
tool: consult_before_build
version: 3.0.0
description: >
  REQUIRED before generating ANY UI — component, page, surface, or style change.
  Returns the design genome construction packet: layout structure,
  per-workflow block assignments, safety constraints, and copy rules.
  The response is a blueprint, not a suggestion.

  PRE-FLIGHT:
  Ensure @innovaccer/ui-assets is in the project's package.json.
  Ensure import '@innovaccer/ui-assets/tokens' is in the project entry file.

  HOW TO CALL:
  1. Describe WHAT you are building — who uses it, what data, what actions.
  2. Include domain and user_type if inferable.
  3. DECOMPOSE the intent into WORKFLOWS — bounded UI sections as { id, intent, region? }.

  HOW TO USE THE RESPONSE:
  1. layout is always LLM-generated (surfaces removed from genome) — treat as strong recommendation.
  2. For each workflow, import blocks using exact import_instruction from @innovaccer/ui-assets.
  3. family_invariants are CSS classes that must never be changed.
  4. safety_applied constraints are non-negotiable.
  5. After generating code, call review_output.

input:
  intent_description:
    type: string
    required: true
    description: "Rich description of what to build — who uses it, what data it shows, what actions are available"

  domain:
    type: string
    enum: ["clinical-alerts", "patient-data", "care-gaps", "tasks", "navigation", "data-display", "forms", "admin", "other"]
    required: false

  user_type:
    type: array
    items:
      type: string
      enum: ["clinician", "coordinator", "patient", "admin", "data-engineer"]
    required: false

  project_root:
    type: string
    required: false
    description: "Absolute path to the consuming project root. Auto-detected if omitted."

  workflows:
    type: array
    required: false
    description: >
      Optional workflow decompositions. Each represents a bounded UI section.
      When provided, the response maps blocks to each workflow individually.
      When omitted, the entire intent is treated as a single workflow.
    items:
      id: string
      intent: string
      region: string   # optional

output:
  surface:
    type: object
    description: Always { matched: false, confidence: 0, surface_id: null, import_instruction: null } — surfaces removed from genome.
    properties:
      matched: boolean
      confidence: number
      surface_id: string   # always null
      import_instruction: string   # always null

  layout:
    type: object
    description: >
      Layout structure. source is always "generated" — LLM composes regions from genome principles.
    properties:
      source: string   # always "generated"
      regions:
        type: array
        items:
          id: string
          order: number
          blocks: array
          never: array

  workflows:
    type: array
    description: Per-workflow block assignments. Each block is enriched with genome metadata.
    items:
      id: string
      intent: string
      blocks:
        type: array
        items:
          id: string
          level: string   # "primitive" | "composite"
          npm_path: string
          import_instruction: string
          family_invariants: array
          when: string
          not_when: string

  blocks:
    type: array
    description: Flat list of all blocks across all workflows (backwards compatibility).

  rules_applied:
    type: array
    items:
      rule_id: string
      applies_because: string

  safety_applied:
    type: array
    items:
      constraint_id: number
      applies_because: string

  ontology_refs:
    type: array
    items:
      concept: string
      canonical_name: string
      ui_label: string

  confidence:
    type: number
    description: How well the genome covers this intent (0.0–1.0).

  gaps:
    type: array
    description: What the system does not have coverage for.
```

#### report_pattern
```yaml
tool: report_pattern
version: 1.0.0
description: >
  Call when you have built something novel that the genome doesn't cover.
  This is how new blocks enter the candidate queue.
  The Design Mind reviews, and if seen by 3+ teams, it goes to human ratification.

input:
  pattern_name:
    type: string
    required: true
    description: A short descriptive name for the block (e.g. "BulkActionToolbar")

  type:
    type: string
    enum: ["primitive", "composite", "domain", "surface"]
    required: false

  description:
    type: string
    required: true
    description: What the block is and what problem it solves

  intent_it_serves:
    type: string
    required: true

  why_existing_patterns_didnt_fit:
    type: string
    required: true
    description: >
      What you looked for in consult_before_build and why
      none of the returned blocks covered this case

  closest_match_block_id:
    type: string
    required: true
    description: The ID of the closest block from consult_before_build. Pass "none" if nothing matched.

  ontology_refs:
    type: array
    required: false
    description: Entities, states, or actions from the ontology this touches

output:
  candidate_id:
    type: string
    description: ID assigned to this candidate in blocks/_candidates/

  similar_candidates:
    type: array
    description: Other candidates in the queue that might be the same pattern

  frequency_count:
    type: number
    description: How many times this pattern has been reported (1 = first time)

  status:
    type: string
    enum: [logged, needs_more_signal, ready_for_ratification]
    description: >
      logged: first sighting, watching
      needs_more_signal: seen 2 times, one more triggers ratification
      ready_for_ratification: seen 3+ times, queued for human review
```

#### review_output
```yaml
tool: review_output
version: 1.0.0
description: >
  Call after generating UI to get a structured critique from the
  Critic agent. Returns what honored the genome, what was borderline,
  what was novel, and what to fix.

input:
  generated_output:
    type: string
    required: true
    description: The generated code or detailed description of the UI

  original_intent:
    type: string
    required: true
    description: The same intent_description passed to consult_before_build

  context_used:
    type: object
    required: false
    description: The context returned from consult_before_build, if available

output:
  honored:
    type: array
    items:
      observation: string
      rule_or_pattern_ref: string

  borderline:
    type: array
    items:
      observation: string
      tension: string
      recommendation: string

  novel:
    type: array
    items:
      description: string
      coherent_with_taste: boolean
      coherence_reasoning: string

  fix:
    type: array
    items:
      problem: string
      rule_violated: string
      correction: string

  copy_violations:
    type: array
    items:
      violation: string
      correction: string

  confidence:
    type: number
    description: Overall genome compliance score (0.0–1.0)
```


---

## Genome hierarchy

| Level | Location | Encodes |
|-------|----------|---------|
| **Tokens** | `genome/rules/styling-tokens.rule.md` | Design tokens, DM Sans, 4px grid, elevation, z-index, motion |
| **Blocks** | `blocks/*/meta.yaml` | Reusable UI structures with product decisions baked in. Implementations live in `@innovaccer/ui-assets` npm package. Two sub-levels: `primitive` (single-purpose), `composite` (assembles primitives). |
| **Surfaces** | *(removed)* | Surface YAMLs have been deleted — surfaces are no longer part of the genome. `consult_before_build` always returns `surface.matched: false`. |

**Rules registry (v1.3.0):**

- `shell-layout` — confidence 0.95 — Added after shell screenshot review. Load this before navigation-patterns for any layout decision.
- `navigation-patterns` — confidence 0.92 — v2.0 — rewritten for 3-panel shell. Removed horizontal top-nav assumptions from v1.
- `destructive-actions` — confidence 0.95
- `data-density` — confidence 0.88
- `styling-tokens` — confidence 0.97 — v2.0.0 — expanded from color-only tokens to full styling system: typography (DM Sans), spacing (4px grid), border-radius, elevation, z-index, motion. Colors updated to the color palette defined in theme.css. Single comprehensive file. Load this rule for ANY styling decision.

---

## Product principles

# Product principles

## Purpose

This platform exists to close the gap between clinical information
and clinical action. Data without a clear path to decision is noise.
Every surface asks: what does this person need to do next, and
what do they need to know to do it well?

---

## Principles

**1. Action over information.**
Surfaces are organised by what the user needs to do, not what the
system knows. Detail is revealed only when it serves a decision —
never by default.

**2. The right context, at the right moment.**
Every surface knows where it sits in the user's workflow and surfaces
only what's relevant to that moment — except where suppressing
information could cause harm. Context shapes what appears; consequence
determines what persists. Not everything at once — just enough to act
with confidence.

**3. One concept, one source of truth.**
The system has one ontology — every concept exists once, with a single
authoritative definition. No synonyms that quietly point to different
things, no parallel hierarchies that drift apart. Consistency lives
in the model.

**4. Speak the user's language.**
The same underlying concept is expressed in the language most natural
to its audience. The system's internal vocabulary never leaks to the
surface. Labels, units, and phrasing adapt to context so that every
user reads the interface as if it were built for them.

**5. Confirmation proportional to consequence.**
Routine actions require no friction. Actions with meaningful
consequences — those that are broad, irreversible, or affect others —
earn explicit confirmation. The interface doesn't cry wolf.

**6. Most consequential information carries the most weight.**
Visual hierarchy follows consequence, not data structure. The
information that most affects the next decision is the most prominent.
Status and risk before detail, actions before records. Density is
earned by relevance, not inherited from the schema.

**7. Generated and designed are indistinguishable.**
AI-generated content earns its place on screen by meeting the same
standard as anything hand-crafted — same hierarchy, same language,
same visual logic. Output is never a second-class citizen.

**8. Honest about uncertainty.**
When the system doesn't know, it says so — clearly and without
deflection. Confidence is expressed proportionally to evidence. Users
are never misled into false certainty by silence, vague language, or
a design that hides gaps.

---

## Aesthetic identity

# taste.md

> Good interface design feels inevitable — like every element is in the only place it could be.
> That feeling doesn't come from minimalism or maximalism. It comes from rigor.

---

## Design Dials

Three dials govern the character of every interface. The baselines below are the default for all generations — do not deviate without reason. If the user asks for more creativity, more exploration, or something that feels fresh, turn the dials up. If they feel the output is too different from the current interface or too experimental, dial it back. Otherwise, hold the baselines.

### Design Variance · Baseline: 4
*1 = Perfect symmetry, predictable grids. 10 = Asymmetric, art-directed, unexpected.*

| Range | Character | When to use |
|---|---|---|
| 1–3 | **Rigid structure.** Equal columns, symmetrical grids, zero surprises. Predictability is the feature. | Data tables, forms, settings panels. Anywhere the user is scanning for specific values. Symmetry here isn't boring — it makes rows and columns machine-readable by humans. |
| 4–6 | **Structured and composed.** Strong grid alignment, even column distributions, clear spatial logic — but with considered variation in content hierarchy, section rhythm, and component arrangement within the grid. No asymmetric column ratios, no offset alignments, no varied card sizes. | Dashboards, list views, detail screens, multi-panel layouts. The vast majority of product screens live here. The grid stays clean; the interest comes from typographic hierarchy and content organization, not layout tricks. |
| 7–9 | **Intentionally asymmetric.** Uneven column ratios (7/5, 8/4), offset alignments, varied card sizes, fractional grid columns, deliberate whitespace imbalance. | Use sparingly. Feature introduction screens, first-run experiences, or moments where a specific content block deserves disproportionate visual weight. The layout is making an argument — it's saying "look here first." If that argument isn't clear, drop back to 4–6. |
| 10 | **Art-directed.** Masonry, overlapping elements, dramatic negative space. Every screen feels like someone *designed* it, not assembled it. | Almost never in a product context. Reserve for highly singular moments — an annual review visualization, a showcase screen — where the content is simple enough to survive an unconventional layout. |

**The rule:** Variance should be invisible to the user. High variance doesn't mean chaotic — it means the layout feels composed rather than generated. If someone notices the layout is unusual, dial it back.

### Motion Intensity · Baseline: 3
*1 = Static, no movement. 10 = Cinematic, physics-driven choreography.*

The baseline is deliberately low. Motion in a product used daily becomes invisible at best and irritating at worst. The bar for exceeding level 2 is high — the motion must solve a real orientation or comprehension problem that static UI cannot.

| Range | Character | When to use |
|---|---|---|
| 1–2 | **Near-static.** Hover and focus state changes only. Panel open/close transitions at 150ms or less. Nothing that loops, nothing that staggers, nothing that draws attention to the interface itself. | The default for all product screens. Forms, tables, dashboards, detail views, settings. Motion is invisible infrastructure — it confirms that a click registered and that a panel came from somewhere. That's it. |
| 3–4 | **Subtle orientation.** Smooth layout shifts when content changes. Fade transitions between views. Micro-feedback on interactive elements (a button press, a toggle switch). Still no choreography — individual elements transition, but nothing is sequenced. | Screens with meaningful state changes: filtering a list, switching tabs, expanding a section. The motion answers "what just changed?" without calling attention to itself. Only reach for this when a hard cut between states would feel jarring or disorienting. |
| 5–6 | **Guided motion.** Sequenced reveals, staggered list entrances, transitions that guide the eye through a multi-step change. Motion becomes part of how the user reads the screen. | First-run experiences, onboarding flows, or screens where the user is encountering a complex layout for the first time and the motion helps them parse the structure. This level requires a clear justification — "it looks nicer" is not sufficient. |
| 7–10 | **Choreographed.** Spring physics, scroll-driven sequences, orchestrated multi-element entrances. Motion is part of the narrative. | Feature showcases, demo modes, or singular product moments where the interface is *presenting* information rather than being worked in. Performance must stay flawless — spectacle at 30fps is worse than stillness. |

**The rule:** Motion at every level must answer "where did this come from?" or "what just changed?" If it doesn't orient the user in space or state, it's decoration regardless of how good it looks.

### Visual Density · Baseline: 6
*1 = Art gallery, maximum breathing room. 10 = Cockpit, every pixel carries data.*

| Range | Character | When to use |
|---|---|---|
| 1–3 | **Spacious and focused.** Generous whitespace, large type, single focus per viewport. The content is sparse by nature — let it breathe. | Confirmation screens, empty states, error recovery, single-decision moments. Screens where the user needs to absorb one idea or make one choice. Space signals that the system is patient. |
| 4–5 | **Comfortable reading density.** Clear grouping through space. Nothing feels cramped or empty. A natural rhythm between content blocks. | Settings, profile screens, onboarding steps, detail views with narrative content. Screens where the user is reading and configuring, not scanning volume. |
| 6–7 | **Productive density.** Tighter spacing, more information per viewport. Hierarchy is critical — density without structure is chaos. This is the working range for screens where throughput matters. | Dashboards, list views, multi-panel layouts, workflow screens. The screen has multiple data types, actions, and status indicators coexisting. Every spacing token earns its keep. |
| 8–9 | **Compact and utilitarian.** Reduced padding, compact row heights, monospace numbers in data columns. Dividers and borders become essential structural tools — `divide-y` and 1px separators replace whitespace-based grouping. | Data tables, monitoring views, admin consoles, audit logs — any screen where the volume of information is the point. The user's task is to scan, compare, or process at speed. |
| 10 | **Maximum throughput.** Every spacing token at its minimum. Information per pixel is the priority. | Only when the screen's purpose is real-time monitoring or high-volume data processing, and the user's entire workflow depends on seeing everything at once. This only works with ironclad typographic hierarchy. |

**The rule:** Density should match the demand the screen places on the user — how much do they need to see simultaneously to do their job? Screens that demand comparison, monitoring, or rapid scanning earn high density. Screens that demand comprehension, decision-making, or focus earn lower density. Never be dense to seem "professional" — be dense because the task demands throughput.

### Reading the Room

The baselines are **(4, 3, 6)** — structured layout, subtle motion, productive density. This is the gravity center. Every deviation needs a reason.

Adjust when context demands it:

- *How much data is on this screen?* More data → higher density, lower motion, lower variance. The data is the design.
- *Is this screen used once or a hundred times?* Repeated-use screens → hold baselines or go lower. The user builds spatial memory; surprises become annoyances.
- *Is the user making a high-stakes decision?* If yes → hold motion at baseline, keep density matched to the information they need, keep variance low. Calm and clarity above all.
- *Is this a moment of first impression or orientation?* Onboarding, first-run, feature introduction → variance and motion can push up modestly (5–6 range). Pull back to baseline the moment the user starts working.

When the dials conflict with each other, **density wins** — the amount of information on screen should always dictate how much room there is for layout play and motion.

---

## Typography

How text is set determines whether a screen feels considered or careless. Typography isn't the only tool — but it's the one that fails loudest when neglected.

- **Hierarchy is the work.** Size, weight, and spacing contrasts should carry much of the visual structure. If you're reaching for borders, background fills, or dividers to create separation, check whether the type hierarchy could do the job first.
- **Two weights can do what five colors can't.** A semibold heading against a regular-weight body creates instant scanability. Overusing color for emphasis is a sign that the typographic hierarchy is underbuilt.
- **Numbers earn emphasis contextually.** When numbers are the primary content — metrics, totals, scores — give them tabular figures, proper alignment, and breathing room. When they're supporting detail alongside text, they don't need special treatment. Let the screen's purpose decide.
- **Use the defined text styles.** Typefaces and text styles are predefined in the design tokens. Use those — don't pick new typefaces or invent custom styles. The consistency of the system depends on every screen drawing from the same typographic palette.

---

## Color with Purpose

Color is a language. Every hue in the interface is a word — use too many and the sentence is noise. Color tokens are defined both semantically and as raw values — use only those. Do not introduce colors outside the token system.

- **Neutral at rest, saturated with intent.** The base UI should live in a restrained palette — considered neutrals, subtle surface shifts for depth. Saturated color enters only when it carries meaning: status, interaction, emphasis.
- **Surfaces create depth.** Use the existing card styles and shadow utilities from shadcn/Tailwind to establish spatial relationships between content layers. A flat card, a bordered card, and an elevated card each communicate something different about the content's relationship to its surroundings.
- **Stay within the token system.** Semantic tokens (background, foreground, muted, accent, destructive, etc.) exist for a reason — they encode meaning that raw hex values don't. Using tokens consistently is how the interface stays coherent across dozens of screens built at different times.

---

## Space as Architecture

Whitespace isn't the absence of design. It's the most powerful structural element available.

- **Spacing creates grouping.** Related elements sit close; unrelated elements breathe apart. If spacing is doing its job, visible dividers become redundant. The Gestalt principle of proximity is the most underused tool in interface design.
- **Rhythm over randomness.** Consistent spacing tokens — applied religiously — create the subconscious feeling of "one system." Irregular spacing, even by 4px, registers as carelessness.
- **Density is a choice, not an accident.** Some interfaces need to be dense — dashboards, data tables, professional tools. That's fine. Dense and organized feels calm. Dense and unstructured feels chaotic. The difference is the spatial system.
- **Let content breathe at the page level.** Max-widths, proportional margins, and intentional negative space at the macro level separate polished products from ones that feel like they're trying to fill every available pixel.

---

## Motion with Meaning

Animation is not personality. It's spatial communication.

- **Transitions answer "where."** Where did this element come from? Where did it go? Where am I now? If an animation doesn't orient the user in space or state, it's decoration.
- **Speed is a feature.** 120–200ms for micro-interactions. 200–350ms for layout shifts. Anything that makes the user wait for an animation to finish is borrowing time they didn't offer. Err on the side of too fast.
- **Easing conveys physics.** Ease-out for entrances (arriving and settling), ease-in for exits (accelerating away), ease-in-out for repositions. Linear motion feels robotic. Spring physics feel alive but should be used sparingly — bounciness is a strong flavor.
- **No gratuitous motion.** No loading spinners designed to entertain. No success confetti. Skeleton screens are fine as loading placeholders, but they should be simple and structural — not shimmer animations performing busyness. If the system is working, the result is the reward.

---

## Layout and Composition

**Grids are freedom, not constraint.** A strong grid system makes every placement decision faster and every result more cohesive.

- **Predictable regions, surprising content.** Users should always know where to look for navigation, primary content, and supporting context. Within those predictable zones, the content itself can be rich and varied.
- **Alignment is non-negotiable.** Every element should sit on a grid line or be deliberately offset from one. Approximate alignment is worse than no grid at all — it creates a feeling of "almost right" that's more distracting than chaos.
- **Responsive design preserves hierarchy, not just layout.** Focus on web viewports — ensure layouts adapt gracefully across common desktop and laptop screen widths. Reflowing content without re-prioritizing is a missed opportunity. What's most important at a wide viewport should still be most prominent at a narrow one.

---

## Craft and Polish

The difference between good and great is in the details no one consciously notices.

- **Icon consistency.** Same stroke weight, same optical size, same style across every icon in the system. Mixing outlined and filled styles, or varying visual weight, creates subtle discord.
- **Border radius consistency.** Radii are defined in the token system. Use them consistently — mixing values across a screen reads as indecisive, even if no one can pinpoint why.
- **Shadows and elevation with intent.** Elevation tokens are defined in the system. Every use of a shadow should have a clear reason — distinguishing a floating element from the surface beneath it, signalling interactivity, or creating visual grouping. Arbitrary shadows are visual noise.
- **Pixel-level precision.** Subpixel alignment, consistent padding, optical centering of icons within buttons. These things are invisible when right and quietly wrong when not. Sweat them.

---

## What We Never Do

- **Chase trends.** No glassmorphism-of-the-year, no bouncy micro-interactions borrowed from consumer apps, no aesthetic choices driven by what's popular on Dribbble. Timelessness over trendiness.
- **Decorate without purpose.** Every visual element — illustration, gradient, shadow, animation — must have a reason beyond "it felt empty." If it doesn't inform, orient, or clarify, it doesn't belong.
- **Break consistency for novelty.** One screen that looks different from the rest undermines the entire system. Coherence is more important than any individual screen looking impressive.
- **Sacrifice clarity for aesthetics.** If a design choice makes something beautiful but harder to understand, the design choice is wrong.

---

## The Test

Two questions. Both must pass.

> **1. Can someone arrive at this screen and know what to do?**
> Not in zero seconds. Not after reading a manual. Just — does the hierarchy, layout, and labeling make the next action obvious without effort?

> **2. Could this screen sit next to any other screen in the product and feel like it belongs?**
> Same spatial rhythm, same typographic voice, same surfaces, same restraint. If it looks like a different product built it, it's not ready.

> **Both yes** → Ship it.
> **Either no** → Identify what's breaking — clarity or coherence — and fix that, not everything.

---

## Genome rules (full)


### shell-layout (confidence: 0.95)

RULE: shell-layout
VERSION: 1.0.0
CONFIDENCE: 0.95

APPLIES_TO: every surface built for this platform — all artifact content
lives inside Panel 3 of this shell

# ── THE SHELL ────────────────────────────────────────────────────────────────

The platform shell is a fixed 3-panel layout. It does not reflow to
a different structure on different pages. Agents building artifact
content are always building for Panel 3. They do not control Panel 1
or Panel 2.

PANEL 1 — Left navigation (~240px, fixed width)
  Contains: product/solution switcher, session history, solution nav groups
  Behavior: collapsible to icon-only via toggle at top right
  Ownership: shell — artifact agents do not write Panel 1 content

PANEL 2 — Conversational (~400px, fixed width)
  Contains: the Claude interface — greeting, prompts, chat history, input
  Behavior: always present, never collapses, never hides
  Ownership: shell — artifact agents do not write Panel 2 content
  Key rule: Panel 2 is the PRIMARY UI surface, not a sidebar assistant.
            It drives Panel 3. Artifacts are outputs of conversations.

PANEL 3 — Artifact window (fills remaining width, ~fluid)
  Contains: tabbed artifact surfaces spawned by Panel 2 or direct nav
  Behavior: tab bar pinned to top, content scrolls within the panel
  Ownership: artifact agents write exclusively here

# ── WHAT AGENTS BUILD ────────────────────────────────────────────────────────

Agents build artifact content only — the content that appears inside
a Panel 3 tab. They never build:
  - The shell chrome itself
  - Panel 1 nav items
  - Panel 2 conversational UI
  - The tab bar (tabs are managed by the shell)

# ── PANEL 3 CONTENT RULES ────────────────────────────────────────────────────

WHEN building any artifact surface:

USE:
  - Full-width content filling the Panel 3 tab area
  - Own content header if needed (title + primary action, e.g. "New task")
  - EntityContextHeader at the top when surface is patient-scoped
  - AlertBanner above content header when active alerts exist

NOT:
  - Top navigation bar within the artifact — shell handles navigation
  - Back button within the artifact — use tab close (×)
  - Left sidebar within the artifact — Panel 1 is the sidebar
  - Full-page loading states — use skeleton content within the artifact
  - Modals that exceed Panel 3 width — they clip and feel broken

WHEN Panel 2 sends context to Panel 3:
  - Panel 3 artifact receives the context (e.g. patient name, session)
  - Panel 3 does NOT re-ask for context already established in Panel 2
  - Panel 3 does NOT show a welcome state if context is already set

# ── TAB BEHAVIOR ─────────────────────────────────────────────────────────────

Tabs in Panel 3:
  - Label: artifact name (e.g. "Outreach Queue", "Morning rounds")
  - Not the artifact type — never "Dashboard" or "List" as a tab label
  - Closeable with × — always
  - Max visible tabs: 5 — beyond this, tabs overflow into a "more" menu
  - Active tab: underline indicator, not filled background
  - New tab opens to the right of the active tab

# ── THE RELATIONSHIP BETWEEN PANEL 2 AND PANEL 3 ─────────────────────────────

Panel 2 is not a help assistant attached to Panel 3.
Panel 3 is not a detail view that opens from Panel 2.

They are co-equal surfaces. Panel 2 is conversational.
Panel 3 is visual/operational. The user moves between them naturally —
asking a question in Panel 2, acting on the result in Panel 3,
asking a follow-up question in Panel 2.

An artifact in Panel 3 that duplicates the conversational affordances
of Panel 2 is wrong. A Panel 2 interface that tries to embed a full
data table is wrong. Each panel has its domain.

BECAUSE:
  This shell is the product's answer to the "AI bolted onto a dashboard"
  problem. Panel 2 is not bolted on — it is co-equal. Agents that build
  artifacts assuming the traditional page/nav model will produce surfaces
  that conflict with the shell's interaction model. Every artifact builder
  must internalize this before writing a line of code.

### navigation-patterns (confidence: 0.92)

RULE: navigation-patterns
VERSION: 2.0.0
CONFIDENCE: 0.92

APPLIES_TO: all navigation decisions across the platform shell and within artifact surfaces

# ── SHELL STRUCTURE ───────────────────────────────────────────────
# The platform uses a fixed 3-panel layout. This is not negotiable.
# See genome/rules/shell-layout.rule.md for full shell spec.
# Navigation rules are written in the context of this shell.

WHEN — product / solution switching (Panel 1):
  - user needs to move between solutions (Care Manager, Atlas VBC, etc.)

USE:
  - left nav Panel 1 only — icon + label grouped under "SOLUTIONS" header
  - solution groups are collapsible
  - active solution is highlighted, sub-sessions shown as indented items with date

NOT:
  - horizontal top nav — there is no top nav bar in this shell
  - tabs for top-level solution switching
  - modal or overlay for solution selection

WHEN — session navigation (Panel 1):
  - user needs to return to a previous conversation session

USE:
  - session history listed under the active solution in Panel 1
  - show session name + relative date (e.g. "18 Mar")
  - max 5 recent sessions visible before "View all" link

NOT:
  - dedicated sessions page — history lives in Panel 1 inline
  - breadcrumb for session navigation

WHEN — artifact navigation (Panel 3):
  - chat spawns a new artifact or the user opens a surface directly

USE:
  - tabbed interface at the top of Panel 3
  - tabs are closeable (× affordance on each tab)
  - active tab underlined, not filled — matches the screenshot
  - tab label is the artifact name, not the artifact type

NOT:
  - back button inside Panel 3 — artifacts don't have their own nav
  - breadcrumb inside Panel 3
  - nested tabs within an artifact

WHEN — patient context switching:
  - user is in a patient-scoped workflow in Panel 3

USE:
  - EntityContextHeader at the top of the artifact surface
  - patient search accessible via Panel 2 (ask the chat)
  - explicit dismiss affordance to return to population-level view

NOT:
  - patient switcher dropdown in Panel 3 — route through Panel 2
  - patient name only in the artifact tab label

WHEN — workflow steps within an artifact:
  - multi-step process (2–5 steps)

USE:
  - step indicator at the top of the artifact content area
  - "Step 2 of 4" format always — never progress bar alone
  - linear only — no branching step indicators

NOT:
  - tabs to represent workflow steps
  - Panel 1 or Panel 2 to show workflow progress

BECAUSE:
  This shell makes the conversational layer (Panel 2) the primary
  navigation instrument. Users ask for things; artifacts appear in
  Panel 3. Traditional navigation patterns that assume a page-based
  mental model conflict with this. An agent building UI for Panel 3
  should never add navigation chrome that duplicates what the shell
  already provides.

### destructive-actions (confidence: 0.95)

RULE: destructive-action-confirmation
VERSION: 1.0.0
CONFIDENCE: 0.95

APPLIES_TO: any action that is irreversible or affects clinical data

WHEN:
  - action permanently deletes data
  - action affects more than 1 record
  - action cannot be undone within the session
  - action modifies a clinical record

USE:
  - AlertDialog with a consequence statement before the action label
  - Consequence statement format: "[What will happen]. [What this means]."
  - Action button label must match the action exactly (see ontology/actions.yaml)
  - Cancel must always be present and be the default-focused element

NOT:
  - Toast as the only warning
  - Disabled button with tooltip
  - Inline warning that doesn't interrupt the workflow
  - "Are you sure?" without a consequence statement
  - "Yes" / "OK" / "Confirm" as the action button label

BECAUSE:
  Clinical data has compliance and audit implications. Passive warnings
  fail under cognitive load. The user must actively read and respond
  to a consequence — not just click through a modal.

EXCEPTIONS:
  - Single-record soft operations (Archive, Assign): no confirmation needed
  - Draft records with no clinical data: no confirmation needed

BULK_THRESHOLD:
  - > 10 records: require typed confirmation string
  - 2–10 records: AlertDialog with record count in consequence statement
  - 1 record: AlertDialog for irreversible actions only

### data-density (confidence: 0.88)

RULE: data-density
VERSION: 1.0.0
CONFIDENCE: 0.88

APPLIES_TO: any surface displaying lists, tables, or multiple records

WHEN — list views:
  - displaying > 10 records of the same entity type

USE:
  - table for structured data with sortable columns
  - list (card stack) for entities with variable content or actions
  - virtual scrolling for > 100 records

NOT:
  - paginated table with < 10 rows per page for power users
  - card grid for worklist views — linear scan is faster for coordinators

WHEN — empty states:
  - a list, table, or query returns zero results

USE:
  - one-line honest statement of what's empty and why
  - optional: single CTA if there's a clear next action
  - format: "No [entity] [condition]." e.g. "No open care gaps for this patient."

NOT:
  - illustrations or icons in empty states
  - celebratory copy ("All caught up!")
  - multi-paragraph explanations

WHEN — loading states:
  - data is being fetched

USE:
  - skeleton screens matching the shape of the expected content
  - loading spinner only for actions (button submits, not page loads)

NOT:
  - full-page loading spinners for partial data loads
  - "Loading..." text alone

WHEN — density defaults:
  - presenting data to coordinators managing large patient panels

USE:
  - compact row density by default (32px row height)
  - user-adjustable density toggle if > 8 columns

NOT:
  - comfortable/spacious density as default for worklist views
  - forcing all products to the same density

BECAUSE:
  Care coordinators manage panels of 200+ patients. Data density
  is a productivity requirement. Spacious layouts optimized for
  occasional users harm power users who need to scan fast.

### styling-tokens (confidence: 0.97)

RULE: styling-tokens
VERSION: 2.0.0
CONFIDENCE: 0.97

APPLIES_TO: every component, every surface, every generated UI

# ── THE ONLY STYLING SOURCE OF TRUTH ─────────────────────────────────────────

The platform uses the design system tokens defined in theme.css.
Color primitives are sourced from the color palette defined in theme.css.
Tailwind's default color palette (red-600, amber-100, blue-500, etc.) is
NEVER used directly. All color decisions go through design tokens.

Font: DM Sans — loaded via --font-sans in theme.css.
Mono: DM Mono — loaded via --font-mono in theme.css.

FONT RULES:
  - All text inherits font-sans automatically from the root element
  - Never set font-family inline or hardcode 'DM Sans' in component code
  - font-mono is permitted only for: MRN values, measure codes, system IDs,
    timestamps, and other clinical identifiers needing fixed-width rendering
  - Never use system-ui, Arial, Inter, Nunito Sans, or any other font family
  - Components do not need an explicit font class — they inherit from root

# ── TOKEN MAP: SURFACES ──────────────────────────────────────────────────────

SURFACES (Gray "stone" and "night" semantic families):
  --background       #F7F7F7  (gray-100 / stone lightest) — page background
  --card             #FFFFFF  — card and panel surfaces, sits above background
  --foreground       #1A1A1A  (gray-1400 / night) — primary text on background
  --card-foreground  #1A1A1A  — primary text on cards
  --muted            #EBEBEB  (gray-200 / stone lighter) — subtle backgrounds for inactive areas
  --muted-foreground #636363  (gray-900 / night lighter) — secondary and hint text
  --popover          #FFFFFF  — dropdown and tooltip surfaces
  --border           #D4D4D4  (gray-400 / stone) — all borders and dividers
  --input            #C4C4C4  (gray-500 / stone dark) — input field borders
  --ring             #0060D6  (blue-1000 / primary-default) — focus ring color

# ── TOKEN MAP: BRAND ─────────────────────────────────────────────────────────

BRAND:
  --primary            #0060D6  (blue-1000 / primary-default) — CTAs, active states, links, focus rings
  --primary-foreground #FFFFFF  — text on primary backgrounds

# ── TOKEN MAP: NEUTRAL / GRAY SCALE ─────────────────────────────────────────

Gray primitives use a 100–1400 scale with two semantic families:
"stone" (lighter, for surfaces) and "night" (darker, for text).

  TOKEN        HEX      SEMANTIC           USE
  ───────────  ───────  ─────────────────  ──────────────────────────────────
  --gray-100   #F7F7F7  stone lightest     backgrounds, zebra-stripe (= --background)
  --gray-200   #EBEBEB  stone lighter      hover on muted surfaces (= --muted)
  --gray-300   #E0E0E0  stone light        light dividers, disabled input bg
  --gray-400   #D4D4D4  stone              borders, dividers (= --border)
  --gray-500   #C4C4C4  stone dark         input field borders (= --input)
  --gray-600   #B5B5B5  —                  disabled state backgrounds
  --gray-700   #A3A3A3  night lightest     placeholder text, disabled icons
  --gray-800   #858585  —                  stronger disabled states
  --gray-900   #636363  night lighter      secondary text (= --muted-foreground)
  --gray-1000  #575757  —                  emphasis secondary text
  --gray-1100  #424242  night light        strong secondary, sub-headings
  --gray-1200  #333333  —                  near-primary text
  --gray-1300  #242424  —                  headings
  --gray-1400  #1A1A1A  night              primary text (= --foreground)

USAGE: Prefer semantic tokens (--muted, --border, --foreground, --muted-foreground)
over raw --gray-* values. The gray scale exists as a reference for edge cases
where semantic tokens don't cover the need — chart axis labels, skeleton
placeholders, disabled states. If you're reaching for --gray-* in a component,
ask first whether a semantic token already handles it.

# ── TOKEN MAP: SEMANTIC COLORS ───────────────────────────────────────────────

Each semantic color has a foreground (accessible text), foreground-on-color,
and light (ultra-light background) variant.

DESTRUCTIVE (Red — Critical severity, delete actions):
  --destructive            #D62400  (red-1000 / alert-default)
  --destructive-foreground #FFFFFF  text on destructive backgrounds
  --destructive-light      #FFF2F0  (red-100 / alert-ultra-light) — banner/card bg

SUCCESS (Green):
  --success                #007A0E  (green-1000 / success-default)
  --success-foreground     #FFFFFF  text on success backgrounds
  --success-light          #DEFFDB  (green-100 / success-ultra-light) — banner/card bg

WARNING (Yellow — Overdue, Medium severity):
  --warning                #AD8200  (yellow-1100 / warning-dark) — accessible fg on white
  --warning-foreground     #FFFFFF  text on warning backgrounds
  --warning-light          #FFF9E5  (yellow-100 / warning-ultra-light) — banner/card bg
  --warning-surface        #F5BA0A  (yellow-900 / warning-default) — visual indicator fill

ALERT (Orange — High severity ONLY):
  --alert                  #B24D00  (orange-1200 / accent1-dark) — accessible fg on white
  --alert-foreground       #FFFFFF  text on alert backgrounds
  --alert-light            #FFF2DB  (orange-100 / accent1-ultra-light) — banner/card bg

ACCENT (Blue tint — Low severity, info states):
  --accent                 #F0F9FF  (blue-100 / primary-ultra-light) — background
  --accent-foreground      #0051AD  (blue-1100) — foreground text

INFO (Cyan — non-severity informational callouts):
  --info                   #0FABD2  (cyan-1000 / accent5-default)
  --info-foreground        #FFFFFF  text on info backgrounds
  --info-light             #DBFAFF  (cyan-100 / accent5-ultra-light) — help surfaces

# ── TOKEN MAP: ACCENT PALETTE ────────────────────────────────────────────────

Eight accent families for charts, category tags, and avatar fallback colors.
Only base (default) shades listed — each has ultra-light through darker variants
in the token map.

  NAME               HEX      PRIMITIVE
  ─────────────────  ───────  ─────────────
  accent1 (Orange)   #E56F00  orange-1000
  accent2 (Violet)   #6F21E4  violet-1000
  accent3 (Indigo)   #3B48DE  indigo-1000
  accent4 (Lime)     #70BC06  lime-900
  accent5 (Cyan)     #0FABD2  cyan-1000
  accent6 (Sea)      #0CA79F  sea-1000
  accent7 (Magenta)  #E40763  magenta-1100
  accent8 (Pink)     #ED68ED  pink-1000

WHEN TO USE ACCENTS:
  - Chart series colors (use in order: accent1 through accent8)
  - Category tags and labels that need visual differentiation
  - Avatar fallback backgrounds (use -avatar variant: -300 shade)

NEVER:
  - Use accents for severity indicators — severity has its own tokens
  - Use accents for interactive states — use --primary
  - Use accents for status badges — use the status color reference below
  - Mix accent base shades with their light/dark variants in the same context

# ── TOKEN MAP: SIDEBAR ───────────────────────────────────────────────────────

SIDEBAR:
  --sidebar*       parallel token set for Panel 1 styling — always use sidebar
                   tokens when styling Panel 1 content

# ── CRITICAL NAMING DISAMBIGUATION ───────────────────────────────────────────

"Alert" (capitalized) = a clinical Alert entity (ontology/entities.yaml)
"--alert" (token) = Orange = High clinical severity color
These are DIFFERENT things. Never confuse them.

"--destructive" = BOTH "delete action" AND "Critical severity"
A Critical alert banner and a Delete button use the same base color.
This is intentional — both represent the highest-stakes interaction.

"--info" (Cyan) = non-severity informational callouts, help surfaces
"--accent" (Blue tint) = Low severity indicator
These are DIFFERENT. --info is for generic information. --accent is for
Low clinical severity. Never swap them.

# ── SEVERITY COLOR FAST REFERENCE ────────────────────────────────────────────
# Full spec in safety/severity-schema.yaml

  Critical  → text-destructive (#D62400) / bg-destructive-light (#FFF2F0) / border-destructive/30
  High      → text-alert (#B24D00) / bg-alert-light (#FFF2DB) / border-alert/30
  Medium    → text-warning (#AD8200) / bg-warning-light (#FFF9E5) / border-warning/30
  Low       → text-accent-foreground (#0051AD) / bg-accent (#F0F9FF) / border-accent-foreground/20

# ── STATUS COLOR FAST REFERENCE ──────────────────────────────────────────────

  Completed / Closed / Success   → text-success (#007A0E) / bg-success-light (#DEFFDB)
  Overdue                        → text-warning (#AD8200) / bg-warning-light (#FFF9E5)
  In Progress / In Outreach      → text-primary (#0060D6) / bg-accent (#F0F9FF)
  Open                           → text-muted-foreground (#636363) / border border-border
  Cancelled / Excluded           → text-muted-foreground (#636363) / bg-muted (#EBEBEB)
  Error / Failed                 → text-destructive (#D62400) / bg-destructive-light (#FFF2F0)

# ── TYPOGRAPHY SCALE ─────────────────────────────────────────────────────────

Font: DM Sans via --font-sans (root). Mono: DM Mono via --font-mono.

  CATEGORY     VARIANT    CLASS                          SIZE   WEIGHT      LH    WHEN
  ───────────  ─────────  ─────────────────────────────  ─────  ──────────  ────  ──────────────────────────────
  title        default    text-base font-bold            16px   700         24px  Card titles, dialog titles
  title        medium     text-xl font-semibold          20px   600         32px  Section titles within artifacts
  title        large      text-[28px] font-normal        28px   400         40px  Page/artifact titles
  title        x-large    text-[32px] font-semibold      32px   600         48px  Stat values, hero metrics
  title        xx-large   text-[40px] font-normal        40px   400         48px  Display, large hero metrics
  body         default    text-sm font-normal            14px   400/600/700 20px  Default body text
  body         large      text-base font-normal          16px   400/600     24px  Large body text, emphasis
  body         small      text-xs font-semibold          12px   600/700     16px  Meta text, timestamps, hints
  subheading   default    text-xs font-semibold          12px   600         24px  Section headers
  link         default    text-sm font-normal            14px   400         20px  Inline links
  label        default    text-sm font-semibold          14px   600         16px  Form labels, interactive labels
  mono         default    font-mono text-xs              12px   400         16px  Unique identifiers & codes (DM Mono)

WEIGHT RULES:
  - font-bold (700): title-default, body emphasis
  - font-semibold (600): title-medium, title-x-large, subheading, label, body emphasis
  - font-normal (400): title-large, title-xx-large, body default, links
  - Never use font-thin, font-light, or font-black — insufficient contrast
    under cognitive load

FONT RULES:
  - All text inherits font-sans from root — never set font-family inline
  - font-mono (DM Mono) permitted only for: unique identifiers & codes,
    system-generated values, and fixed-width data
  - Never use font-mono in key-value pairs
  - Never use system-ui, Arial, Inter, Nunito Sans, or any other font family

# ── SPACING SYSTEM ───────────────────────────────────────────────────────────

Base unit: 4px. All spacing is a multiple of 4.

  TOKEN    VALUE   TAILWIND   WHEN
  ───────  ──────  ─────────  ────────────────────────────────────────────
  space-1  4px     p-1        Tight internal gaps (icon-to-text in badges)
  space-2  8px     p-2        Badge padding, chip padding, inline gaps
  space-3  12px    p-3        Alert banner padding, compact card padding
  space-4  16px    p-4        Standard card padding, section padding
  space-6  24px    p-6        EntityContextHeader horizontal padding
  space-8  32px    p-8        Major section separation, panel gutters
  space-12 48px    p-12       Page-level vertical spacing (rare)
  space-16 64px    p-16       Reserved (almost never needed)

COMPONENT SPACING CONVENTIONS:
  Cards (bg-card):        p-4 (16px all sides)
  Rows (list items):      px-4 py-3.5 (16px horizontal, 14px vertical)
  Alert banners:          p-4 with gap-3 internal
  EntityContextHeader:    px-6 py-4
  Section gaps:           gap-4 (16px) between cards, gap-3 (12px) between rows
  Meta row (below title): mt-1.5 (6px), gap-3 (12px) between items
  Button groups:          gap-2 (8px) between buttons, gap-1.5 (6px) for icon buttons

  See data-density.rule.md for 32px compact row height default.
  See shell-layout.rule.md for panel dimensions — agents do not control those.

FLEX/GRID GAP CONVENTIONS:
  gap-1   (4px)   icon + text inside a single element
  gap-1.5 (6px)   tight button groups, icon-only button sets
  gap-2   (8px)   button groups, badge groups, chip rows
  gap-2.5 (10px)  meta item spacing in rows
  gap-3   (12px)  row internal sections, alert internal layout
  gap-4   (16px)  card internal sections, header sections
  gap-6   (24px)  major content blocks within a panel

NEVER:
  - Use gap-0 between meaningful content elements
  - Use margin-based spacing when flex gap is available
  - Mix rem and px — Tailwind handles the conversion, stay in the class system
  - Use space-y-* when gap-* achieves the same result (gap is preferred)

# ── BORDER RADIUS ────────────────────────────────────────────────────────────

  LEVEL        CLASS           RADIUS   WHEN
  ───────────  ──────────────  ───────  ────────────────────────────────────────
  none         rounded-none    0        Table cells, full-bleed sections
  sm           rounded-sm      2px      Rarely used — prefer md
  md (default) rounded-md      6px      Inputs, buttons, dropdowns, tooltips
  lg           rounded-lg      8px      Cards, panels, dialogs, alert banners
  xl           rounded-xl      12px     Inline cards within chat (InlineEntityCard)
  full         rounded-full    9999px   Badges, pills, status indicators, avatars, chips

COMPONENT DEFAULTS:
  Cards (StatCard, ActionableRow card variant):   rounded-lg
  Alert banners:                                   rounded-r-md (left border accent, right rounded)
  StatusBadge:                                     rounded-full (always)
  ChatQuickActionChip:                             rounded-full (always)
  Buttons:                                         rounded-md (inherited from component library)
  Inputs:                                          rounded-md
  Avatars/initials:                                rounded-full
  Dropdowns/popovers:                              rounded-md

NEVER:
  - Use rounded-2xl or rounded-3xl — too soft for clinical context
  - Mix radius sizes on elements at the same hierarchy level
  - Round only some corners of a card unless it has a left/top border accent

# ── ELEVATION & SHADOWS ──────────────────────────────────────────────────────

The platform uses a restrained shadow system. Clinical density demands
that elevation is structural, not decorative. Most surfaces rely on
borders, not shadows, for visual separation.

  LEVEL         CLASS               WHEN
  ────────────  ──────────────────  ────────────────────────────────────────
  flat          (no shadow)         Rows, list items, inline elements, headers
  card          shadow-card         Cards at rest (StatCard, ActionableRow card)
  card-hover    shadow-card-hover   Cards on hover — subtle lift
  dropdown      shadow-md           Dropdowns, popovers, context menus
  dialog        shadow-lg           Modals, dialogs, command palette
  tooltip       shadow-sm           Tooltips

WHEN NOT TO USE SHADOWS:
  - Rows in lists — rows use border-b, never shadow
  - EntityContextHeader — uses border-b, no shadow
  - AlertBanner — uses colored left border, no shadow
  - Sidebar content — sidebar tokens handle their own surface treatment
  - Any element inside a card — shadows are for top-level containers only

NEVER:
  - Stack shadows (a card with shadow inside a panel with shadow)
  - Use shadow-xl or shadow-2xl — too dramatic for clinical context
  - Add shadow to severity indicators — severity communicates via color, not depth
  - Use box-shadow for non-elevation purposes (glow effects, highlights)

# ── Z-INDEX LAYERING ─────────────────────────────────────────────────────────

  LAYER         Z-INDEX   WHAT
  ────────────  ────────  ──────────────────────────────────────
  base          0         Normal content flow
  sticky        10        Sticky headers, tab bars, EntityContextHeader
  dropdown      20        Dropdowns, popovers, context menus
  overlay       30        Modal backdrops, drawer overlays
  modal         40        Dialogs, confirmation modals, command palette
  toast         50        Toast notifications, snackbars
  tooltip       60        Tooltips (always on top of everything)

Use Tailwind z-* classes: z-0, z-10, z-20, z-30, z-40, z-50.
The shell manages its own z-index layers for Panel 1, Panel 2, Panel 3.
Artifact agents should only use z-10 through z-50 within Panel 3 content.

NEVER:
  - Use z-[999] or arbitrary high values — use the defined layers
  - Set z-index on elements that don't need stacking context
  - Fight the shell's z-index — Panel 1/2/3 layering is shell-owned

# ── MOTION & TRANSITIONS ─────────────────────────────────────────────────────

Motion in this platform is functional, never decorative. Every animation
must answer: does this help the user understand what changed?

DURATION SCALE:
  instant     0ms        Severity indicator state changes — NEVER animate
  micro       100ms      Hover states, focus rings, opacity toggles
  fast        150ms      Button press feedback, dropdown open/close
  normal      200ms      Tab switch content, panel state change
  layout      300ms      Panel collapse/expand, skeleton-to-content reveal
  (no slow)              Nothing in this product takes > 300ms

EASING:
  ease-out              Default for entrances — element arrives and settles
  ease-in-out           Default for state changes — smooth transition
  ease-in               Exit/removal only — element accelerates away
  linear                Never for UI — only for progress bars

TAILWIND CLASSES:
  transition-colors     Hover backgrounds, border changes
  transition-opacity    Reveal on group-hover (opacity-0 group-hover:opacity-100)
  transition-shadow     Card hover elevation (shadow-card → shadow-card-hover)
  transition-all        Avoid — be specific about what transitions
  duration-100          Micro interactions
  duration-150          Default for most transitions
  duration-200          Content swaps
  duration-300          Layout shifts only

WHAT TRANSITIONS:
  - Row hover background:   hover:bg-muted/60 transition-colors
  - Card hover shadow:      hover:shadow-card-hover transition-shadow
  - Button reveal on hover: opacity-0 group-hover:opacity-100 transition-opacity
  - Focus ring appearance:  ring-ring transition (handled by component library)

WHAT NEVER TRANSITIONS:
  - Severity indicator colors — Critical is red instantly, no fade-in
  - Status badge state — status changes are immediate, not animated
  - Clinical data values — numbers, dates, MRNs appear instantly
  - Text content — body text never fades in or slides
  - Empty state transitions — content appears or it doesn't

REDUCED MOTION:
  - Respect prefers-reduced-motion: reduce
  - All transitions degrade to instant when reduced motion is active
  - Use motion-reduce:transition-none on animated elements
  - Skeleton shimmer: replace with static gray in reduced motion

NEVER:
  - Animate for delight (bounce, overshoot, spring physics)
  - Use transition durations > 300ms
  - Animate severity indicators, clinical data, or status changes
  - Add entrance animations to list items (no staggered fade-in)
  - Use CSS @keyframes for UI elements (reserved for skeleton shimmer only)
  - Celebrate completed workflows — do the work, get out of the way

# ── DARK MODE ────────────────────────────────────────────────────────────────

All design tokens have dark mode variants defined in theme.css (.dark class).
Never write manual dark: overrides for semantic colors — the tokens handle it.
The only exception: physical color scenes (charts, illustrations) that must
not invert should use explicit @media (prefers-color-scheme: dark) or
conditional className logic.

# ── USAGE RULES ──────────────────────────────────────────────────────────────

ALWAYS:
  - Use CSS custom properties via Tailwind's semantic classes
    (text-primary, bg-card, text-muted-foreground, bg-destructive, etc.)
  - Use bg-destructive-light for destructive background surfaces
  - Use bg-warning-light for warning background surfaces
  - Use bg-alert-light for alert/high severity background surfaces
  - Use text-foreground for primary body text
  - Use text-muted-foreground for secondary, hint, and label text
  - Use the typography scale levels defined above — don't invent sizes
  - Use the spacing system — all spacing multiples of 4px
  - Use shadow-card for cards, no shadow for rows
  - Use specific transition classes (transition-colors, -opacity, -shadow)

NEVER:
  - Use hardcoded hex values in component code
  - Use Tailwind default color classes (red-600, amber-100, blue-500, etc.)
  - Override --destructive or --success for non-semantic decoration
  - Use --warning or --alert for branding or decorative elements
  - Use a color that "looks like" a severity color for non-severity purposes
  - Use font-thin, font-light, or font-black
  - Use rounded-2xl or larger radius values
  - Use shadow-xl or shadow-2xl
  - Use transition-all when a specific property transition will do
  - Use transition durations > 300ms
  - Animate severity indicators or clinical data values

---

## Safety — hard constraints (immutable)

# Hard constraints
# These rules are authored by clinical SMEs and design leadership.
# No agent — including the Design Mind — can propose mutations to this file.
# Changes require explicit approval from design leadership + a human commit.

---

## Severity color rules

1. `--severity-critical` is reserved exclusively for Critical severity alerts and Alert-type CTAs
   that are part of a critical alert component. It may not be used for: brand elements,
   general CTAs, hover states, success states, or decorative elements.

2. `--severity-high` is reserved for High severity alerts and Overdue status indicators only.

3. `--status-success` is used for success, Completed, and Closed states. It may only appear
   in a CTA when that CTA is within a success toast or confirmation message. It is not used
   for decorative or neutral UI elements.

4. Severity colors are never overridden by theme customization, white-label configuration,
   or per-block, per-artifact, or per-surface styling.

---

## Alert dismissal rules

5. Critical severity alerts cannot be dismissed. The only permitted actions are Acknowledge
   and Escalate — these are intents, not required copy. Any UI that renders a dismiss or
   close control for a Critical alert is non-compliant.

6. High severity alert dismissal behavior is use-case defined but must be intentional
   and reversible.

---

## Patient identity rules

7. Patient name is always displayed as: Last, First (formal display) or First Last
   (conversational display). Never first name only. Middle name is optional. When a patient
   name appears within a sentence, First Last is used even in formal display contexts.

8. Date of birth is always displayed as MM/DD/YYYY. MM/DD/YY may be used only when space
   is critically constrained. Age may be shown alongside DOB but never replaces it.

---

## Confirmation and destructive action rules

9. Any modification or deletion of data requires an explicit confirmation step.
   Delete actions must use destructive tokens.

---

## Data display rules

10. Empty or null data fields must never appear blank. A consistent placeholder —
    such as "—" or "Not recorded" — must be shown. Blank space in a data field
    can be misread as a cleared or zero value.

11. Timestamps must always display an absolute date and time. Relative formats
    (e.g. "2 hours ago", "Yesterday") may be shown alongside but never replace
    the absolute value.

---

## Interactive state rules

12. Any surface containing data entry must warn the user before navigating away
    with unsaved changes. Silent discard is not permitted.

13. Form and input error states must use the designated error token. `--severity-critical`
    must not be used for routine validation errors.

---

## CTA hierarchy rules

14. Only one primary CTA may be visible to the user on any single page or surface
    at a time. No surface may render two or more simultaneously visible primary CTAs —
    not in wizards, multi-action surfaces, or modals.
    Exception: row-level or item-level primary CTAs that appear exclusively on hover are
    permitted, because only one can be visible at a time. This exception applies only when
    the CTA is fully hidden at rest (opacity-0 or not rendered) and revealed solely on
    hover of its parent row or item. A primary CTA that is visible at rest — even at
    reduced opacity — does not qualify for this exception.
    Secondary and tertiary actions must use visually subordinate treatments regardless
    of hover state.

---

## Copy and language constraints

15. "We" and all first-person constructions are prohibited in
    every user-facing string. No exceptions.

16. Confirmation dialogs must never use "Are you sure?" or
    equivalent. The header must state the consequence. The
    primary CTA label must match the header.

17. Secondary buttons on modals, interstitials, and popovers
    must use "Close", not "Cancel".

---

## CTA display rules

18. CTA label text must never wrap. Button labels are always single-line
    (whitespace-nowrap). When space is constrained, other content columns — such as
    names, descriptions, or metadata — must shrink or truncate to preserve the full
    visibility of the CTA label.

---

## Accessibility constraints

20. focus-visible must never be suppressed with outline:none or
    ring-0 without an explicit visible replacement. The --ring
    token exists for this purpose.

## Block constraints

22. When a Block composes another Block, the consuming Block must not pass className overrides that conflict with any CSS property listed in the composed Block's family_invariants. Only additive classes — positioning, sizing, spacing, and layout — are permitted on a child Block. To change an invariant property, the source Block's meta.yaml and component must be updated directly, only when the change is justified by a new design requirement.

23. When a primitive or composite Block's component or meta.yaml is modified, all consuming Blocks and surfaces that import or compose that Block must be reviewed and updated to reflect the change. No upstream change may be committed without verifying downstream consumers remain compliant.

24. Import blocks from @innovaccer/ui-assets using the exact tier path (block-primitives, block-composites). Never import from shadcn (@/components/ui/), local paths, or relative paths when a genome block exists. Never reimplement a block inline. If a block needs changes that alter its structure, register a candidate pattern via report_pattern.

25. Only build composite blocks using the primitive blocks. Never modify existing primitives. Do not create new primitives unless the functionality is completely different from what is supported by existing primitives, regardless of domain or semantics.

---

## Safety — severity schema

```yaml
# Severity schema — machine-readable
# Single source of truth for severity rendering across all surfaces.
# Updated to use the design system tokens from theme.css.
# Referenced by: AlertBanner/meta.yaml, runtime generation layer, conversational layer.

# IMPORTANT NAMING NOTE:
# The CSS token --alert is Orange and maps to HIGH clinical severity.
# It does NOT mean "any clinical alert" — that is an entity in ontology/entities.yaml.
# The CSS token --destructive is Red and maps to CRITICAL clinical severity.
# --destructive serves both "destructive UI actions" AND "Critical severity" — same color, two contexts.

severity_levels:
  critical:
    token: "--destructive"
    token_light: null                            # no --destructive-light defined — use inline bg
    hex_reference: "#D62400"                     # Red — WCAG AA on white
    tailwind_equivalent: "text-destructive"
    bg_class: "bg-destructive/10"                # 10% opacity destructive for banner bg
    text_class: "text-destructive"
    border_class: "border-destructive/30"
    solid_class: "bg-destructive text-destructive-foreground"
    icon: "alert-octagon"
    permitted_actions: [acknowledge, escalate]
    forbidden_actions: [dismiss, archive]
    requires_acknowledgment: true
    audit_required: true
    sla_hours: 1

  high:
    token: "--alert"                             # Orange — NOT the same as the Alert entity
    token_light: "--alert-light"                 # #FFF2DB
    hex_reference: "#B24D00"                     # WCAG AA accessible foreground
    tailwind_equivalent: "text-alert"
    bg_class: "bg-[var(--alert-light)]"
    text_class: "text-alert"
    border_class: "border-alert/30"
    solid_class: "bg-alert text-alert-foreground"
    icon: "alert-triangle"
    permitted_actions: [acknowledge, escalate, dismiss_with_reason]
    forbidden_actions: [dismiss_without_reason]
    requires_acknowledgment: true
    audit_required: true
    sla_hours: 4

  medium:
    token: "--warning"
    token_light: "--warning-light"               # #FFF9E5
    hex_reference: "#AD8200"                     # WCAG AA accessible foreground
    tailwind_equivalent: "text-warning"
    bg_class: "bg-[var(--warning-light)]"
    text_class: "text-warning"
    border_class: "border-warning/30"
    solid_class: "bg-warning text-warning-foreground"
    icon: "alert-circle"
    permitted_actions: [acknowledge, escalate, dismiss]
    requires_acknowledgment: false
    audit_required: true
    sla_hours: 24

  low:
    token: "--accent"
    token_light: "--accent"                      # accent is already the light bg
    hex_reference: "#0051AD"                     # accent-foreground — WCAG AA
    tailwind_equivalent: "text-accent-foreground"
    bg_class: "bg-accent"
    text_class: "text-accent-foreground"
    border_class: "border-accent-foreground/20"
    solid_class: "bg-primary text-primary-foreground"
    icon: "info"
    permitted_actions: [acknowledge, escalate, dismiss]
    requires_acknowledgment: false
    audit_required: false
    sla_hours: 72
```

---

## Ontology — entities

```yaml
# Canonical entity definitions
# One definition per concept. Every surface uses these names exactly.
# Synonyms are listed so agents can recognize them — not use them.

Patient:
  canonical_name: "Patient"
  synonyms: ["member", "beneficiary", "individual", "client", "person"]
  definition: >
    A person receiving care managed or monitored through this platform.
    Always referred to as "Patient" in UI copy. Never "member" or
    "beneficiary" even if the business context uses those terms.
  display_fields:
    primary: full_name
    secondary: [mrn, date_of_birth, primary_payer]
  identifier_label: "MRN"

Encounter:
  canonical_name: "Encounter"
  synonyms: ["visit", "appointment", "episode", "interaction"]
  definition: >
    A discrete clinical interaction between a patient and a care provider.
    Can be in-person, telehealth, or phone.
  display_fields:
    primary: encounter_date
    secondary: [encounter_type, provider_name, facility]

CareGap:
  canonical_name: "Care Gap"
  synonyms: ["gap in care", "quality measure gap", "HEDIS gap", "open gap"]
  definition: >
    A clinical service or intervention that evidence indicates a patient
    should have received but has not. Drives outreach and care coordination
    workflows. Always two words: "Care Gap" not "caregap" or "care-gap".
  display_fields:
    primary: measure_name
    secondary: [due_date, gap_status, assigned_to]

Alert:
  canonical_name: "Alert"
  synonyms: ["notification", "flag", "warning", "issue", "event"]
  definition: >
    A system-generated signal that requires clinical attention or action.
    Alerts have severity levels. They are never dismissed without
    acknowledgment at Critical or High severity.
  display_fields:
    primary: alert_title
    secondary: [severity, patient_name, triggered_at]

Task:
  canonical_name: "Task"
  synonyms: ["action item", "to-do", "work item", "assignment", "activity"]
  definition: >
    A discrete unit of work assigned to a care team member. Has an owner,
    a due date, and a status. Always referred to as "Task" in UI copy.
  display_fields:
    primary: task_title
    secondary: [due_date, assigned_to, task_status, patient_name]

Provider:
  canonical_name: "Provider"
  synonyms: ["clinician", "physician", "doctor", "practitioner", "clinican"]
  definition: >
    A licensed clinical professional who delivers or oversees patient care.
    Use "Provider" in UI labels. Use "Clinician" in conversational contexts.
  display_fields:
    primary: provider_name
    secondary: [npi, specialty, practice_name]

CareTeam:
  canonical_name: "Care Team"
  synonyms: ["team", "care team members", "assigned team"]
  definition: >
    The group of providers and coordinators responsible for a patient's
    care within this platform. Always "Care Team" — two words, title case
    when used as a label.
```

---

## Ontology — states

```yaml
# Canonical state and status definitions
# These are the ONLY status values permitted in UI. No synonyms in copy.
# Color tokens are defined here. safety/severity-schema.yaml extends this
# for clinical severity specifically.

# ── TASK STATES ──────────────────────────────────────────────────────────────

TaskStatus:
  values:
    open:
      canonical_name: "Open"
      synonyms: ["pending", "new", "unstarted", "to-do"]
      color_token: "--status-neutral"
      badge_variant: "outline"
      meaning: Task created, not yet started. Default state.

    in_progress:
      canonical_name: "In Progress"
      synonyms: ["active", "started", "working", "in-progress"]
      color_token: "--status-info"
      badge_variant: "subtle-blue"
      meaning: Task has been picked up by an assignee. Work is underway.

    completed:
      canonical_name: "Completed"
      synonyms: ["done", "finished", "resolved", "closed", "complete"]
      color_token: "--status-success"
      badge_variant: "subtle-green"
      meaning: Task has been finished. No further action required.

    overdue:
      canonical_name: "Overdue"
      synonyms: ["late", "past due", "missed", "expired"]
      color_token: "--status-warning"
      badge_variant: "subtle-amber"
      meaning: Task due date has passed without completion. Requires attention.

    cancelled:
      canonical_name: "Cancelled"
      synonyms: ["voided", "withdrawn", "removed"]
      color_token: "--status-muted"
      badge_variant: "muted"
      meaning: Task was intentionally stopped. Not a failure state.

# ── CARE GAP STATES ───────────────────────────────────────────────────────────

CareGapStatus:
  values:
    open:
      canonical_name: "Open"
      color_token: "--status-warning"
      badge_variant: "subtle-amber"
      meaning: Gap identified, not yet addressed.

    in_outreach:
      canonical_name: "In Outreach"
      synonyms: ["outreach in progress", "contacted", "attempting"]
      color_token: "--status-info"
      badge_variant: "subtle-blue"
      meaning: Care team is actively attempting to close the gap.

    closed:
      canonical_name: "Closed"
      synonyms: ["resolved", "completed", "met", "satisfied"]
      color_token: "--status-success"
      badge_variant: "subtle-green"
      meaning: Gap has been addressed. Service was delivered.

    excluded:
      canonical_name: "Excluded"
      synonyms: ["exempt", "excluded", "not applicable", "N/A"]
      color_token: "--status-muted"
      badge_variant: "muted"
      meaning: Patient has a documented clinical exclusion for this measure.

# ── ALERT SEVERITY ────────────────────────────────────────────────────────────
# See also: safety/severity-schema.yaml for hard constraints on these values.

AlertSeverity:
  values:
    critical:
      canonical_name: "Critical"
      synonyms: ["urgent", "STAT", "P1", "high-priority", "emergent"]
      color_token: "--destructive"
      hex_reference: "#D62400"
      badge_variant: "solid-red"
      requires_acknowledgment: true
      sla_hours: 1
      meaning: >
        Requires immediate clinical intervention. Patient safety at risk.
        Cannot be dismissed — only acknowledged with audit trail.

    high:
      canonical_name: "High"
      synonyms: ["elevated", "P2", "important", "significant"]
      color_token: "--alert"
      hex_reference: "#B24D00"
      badge_variant: "solid-amber"
      requires_acknowledgment: true
      sla_hours: 4
      meaning: Requires action within 4 hours. Clinician review needed.

    medium:
      canonical_name: "Medium"
      synonyms: ["moderate", "P3", "informational", "standard"]
      color_token: "--warning"
      hex_reference: "#AD8200"
      badge_variant: "subtle-yellow"
      requires_acknowledgment: false
      sla_hours: 24
      meaning: Requires attention within 24 hours. Can be triaged.

    low:
      canonical_name: "Low"
      synonyms: ["minor", "P4", "routine", "informational"]
      color_token: "--accent"
      hex_reference: "#0051AD"
      badge_variant: "subtle-blue"
      requires_acknowledgment: false
      sla_hours: 72
      meaning: Informational. No immediate action required.
```

---

## Ontology — actions

```yaml
# Canonical action definitions
# These are the actions users take in the platform.
# UI labels, confirmation requirements, and audit rules live here.

# ── CLINICAL ACTIONS ─────────────────────────────────────────────────────────

Acknowledge:
  canonical_name: "Acknowledge"
  synonyms: ["confirm", "accept", "noted", "seen"]
  ui_label: "Acknowledge"
  past_tense: "Acknowledged"
  meaning: >
    Confirms that a clinician has seen and understood an alert.
    Creates an audit trail entry. Does not resolve the alert —
    only records that it was seen. Required for Critical and High alerts.
  confirmation_required: false
  audit_logged: true
  reversible: false
  applies_to: [Alert]

Escalate:
  canonical_name: "Escalate"
  synonyms: ["escalate to", "elevate", "hand off", "transfer"]
  ui_label: "Escalate"
  past_tense: "Escalated"
  meaning: >
    Routes an alert or task to a higher-level clinician or care team
    member. Requires selecting a recipient. Logs the escalation chain.
  confirmation_required: true
  confirmation_copy: "Escalate to {recipient}?"
  audit_logged: true
  reversible: false
  applies_to: [Alert, Task]

Dismiss:
  canonical_name: "Dismiss"
  synonyms: ["close", "ignore", "clear", "remove", "hide"]
  ui_label: "Dismiss"
  past_tense: "Dismissed"
  meaning: >
    Removes an alert from the active view. Only permitted for Medium
    and Low severity alerts. Requires a documented reason.
    Critical and High alerts cannot be dismissed — only acknowledged.
  confirmation_required: true
  confirmation_copy: "Dismiss this alert? Select a reason."
  audit_logged: true
  reversible: false
  applies_to: [Alert]
  constraint: "severity must be Medium or Low — see safety/severity-schema.yaml"

# ── DATA ACTIONS ─────────────────────────────────────────────────────────────

Archive:
  canonical_name: "Archive"
  synonyms: ["hide", "soft-delete", "remove from view", "deactivate"]
  ui_label: "Archive"
  past_tense: "Archived"
  meaning: >
    Removes from active view. Data is fully retained and recoverable.
    Does not affect the clinical record. Used for tasks, care gaps,
    and notes that are no longer relevant but must be preserved.
  not_same_as: Delete
  confirmation_required: false
  audit_logged: true
  reversible: true
  applies_to: [Task, CareGap, Note]

Delete:
  canonical_name: "Delete"
  synonyms: ["remove", "erase", "purge", "permanently delete"]
  ui_label: "Delete permanently"
  past_tense: "Deleted"
  meaning: >
    Permanent removal. Cannot be undone. Affects the clinical record.
    Subject to compliance and audit requirements.
  not_same_as: Archive
  confirmation_required: true
  confirmation_copy: "Delete permanently? This cannot be undone."
  bulk_threshold: 1   # always confirm, even for single record
  audit_logged: true
  reversible: false
  applies_to: [Draft, Note]

Assign:
  canonical_name: "Assign"
  synonyms: ["reassign", "delegate", "allocate", "route to"]
  ui_label: "Assign"
  past_tense: "Assigned"
  meaning: Sets or changes the owner of a task or care gap.
  confirmation_required: false
  audit_logged: true
  reversible: true
  applies_to: [Task, CareGap]

# ── WORKFLOW ACTIONS ─────────────────────────────────────────────────────────

CloseGap:
  canonical_name: "Close Gap"
  synonyms: ["mark complete", "gap met", "resolve gap", "satisfy measure"]
  ui_label: "Close Gap"
  past_tense: "Gap Closed"
  meaning: >
    Records that a care gap has been addressed and the clinical service
    was delivered. Requires a service date. Updates the patient's
    quality measure record.
  confirmation_required: true
  confirmation_copy: "Close this care gap? Enter the service date."
  audit_logged: true
  reversible: false
  applies_to: [CareGap]
```

---

## Ontology — copy voice

# Copy and voice

## Tone

Clinical and direct. Not cold — human, but not casual.
This product is used by people making decisions that matter.
The copy respects that weight without being dramatic about it.

Never:
- Cute ("Looks like you're all caught up! 🎉")
- Apologetic ("We're sorry, something went wrong")
- Vague ("Something happened")
- Marketing ("Supercharge your care workflows")

Always:
- State what happened, then what to do
- Use the patient's name when addressing a specific situation
- Use numerals for all clinical quantities (3 patients, not three)

---

## Tense and form

Labels: present tense, imperative
  ✓ "Acknowledge"   ✗ "Acknowledging"   ✗ "Click to acknowledge"

Confirmations: past tense
  ✓ "Alert acknowledged"   ✗ "Alert has been acknowledged"

Status copy: noun or adjective, never verb
  ✓ "Overdue"   ✗ "This task is overdue"

Empty states: honest and specific
  ✓ "No open care gaps for this patient"
  ✗ "Nothing to see here"
  ✗ "All caught up!"

Error messages: what happened + what to do
  ✓ "Patient record could not be saved. Check your connection and try again."
  ✗ "Error 500"
  ✗ "Something went wrong. Please try again."

---

## Entity references

Always use canonical names from ontology/entities.yaml.
Use the exact capitalization shown there.

  ✓ "Patient"     ✗ "member" / "beneficiary" / "individual"
  ✓ "Care Gap"    ✗ "gap" / "care gap" / "HEDIS gap"
  ✓ "Task"        ✗ "to-do" / "action item" / "work item"
  ✓ "Alert"       ✗ "notification" / "flag" / "warning"
  ✓ "Provider"    ✗ "doctor" / "physician" (in labels)

In conversational contexts (Claude interface), "clinician" is
acceptable when referring to the user themselves.

---

## Numbers and dates

Patient counts: always numeral
  ✓ "3 patients"   ✗ "three patients"

Dates: MMM D, YYYY for display
  ✓ "Jan 5, 2025"   ✗ "01/05/2025"   ✗ "January 5th, 2025"

Relative dates: use when < 7 days, absolute after
  ✓ "2 days ago"   ✓ "Yesterday"   ✓ "Jan 3, 2025" (if older)

SLA / due dates: always show the date, optionally add urgency signal
  ✓ "Due Jan 5 · Overdue"   ✗ "Overdue" alone (no date context)

---

## Confirmation dialogs

Structure: [Consequence statement]. [Action instruction].
  ✓ "This will permanently delete the patient record.
     This cannot be undone. Type DELETE to confirm."
  ✗ "Are you sure you want to delete?"

Destructive action button copy: match the action label exactly
  ✓ Button: "Delete permanently"
  ✗ Button: "Yes" / "OK" / "Confirm" / "Proceed"

---

## Blocks — ratified

54 ratified blocks (all meta.yaml only — implementations live in `@innovaccer/ui-assets`):

Accordion, ActionableRow, ActivityLogRow, Alert, AlertBanner, AlertDialog,
AssessmentTab, Avatar, Badge, Breadcrumb, Button, Calendar, Card, Carousel,
Chart, ChatQuickActionChip, Checkbox, Collapsible, Combobox, Command,
ContextMenu, DataTable, DatePicker, Dialog, Drawer, DropdownMenu,
EntityContextHeader, EntityRow, Form, HoverCard, InlineEntityCard, Input,
InputOTP, Label, NavigationMenu, Pagination, Popover, Progress, RadioGroup,
Resizable, ScrollArea, SectionHeader, Select, Separator, Sheet, Skeleton,
Slider, Sonner, StatCard, Switch, Table, Tabs, Textarea, Tooltip

All blocks are imported from `@innovaccer/ui-assets` using the exact `import_instruction`
returned by `consult_before_build`. Block snapshots are no longer stored in the repo —
the npm package is the single source of truth for implementations.

---

## Architecture

### Genome loader

At startup, `genomeLoader.js` reads all blocks (`blocks/*/meta.yaml`), rules (`genome/rules/*.rule.md`), safety constraints (`safety/hard-constraints.md`), ontology files, taste, and principles into a module-level in-memory cache. The cache is used for all tool calls; hot-reload (dev only) polls for file changes and swaps the cache atomically.

Surfaces (`surfaces/`) have been removed from the genome — the directory no longer exists. `consult_before_build` always returns `surface.matched: false` and `layout.source: "generated"`.

### LLM composition

`llmClient.js` supports two modes:

**Gateway mode (recommended for production):**
Set `OPENAI_API_KEY` + `OPENAI_BASE_URL`. The gateway (TrueFoundry) serves all models through one OpenAI-compatible endpoint. Models are tried in priority order:
  1. `ANTHROPIC_MODEL` (default: `claude-sonnet-4-5`)
  2. `OPENAI_MODEL` (default: `gpt-4o`)
  3. `GEMINI_MODEL` (fallback)

**Direct provider mode (local / CI):**
Set `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` (no BASE_URL), or `GEMINI_API_KEY`. Priority: Anthropic → OpenAI → Gemini.

Two LLM calls:
- `callDesignMind` — used by `consult_before_build`. Sends the full serialised genome as context, then the intent/domain/user_type/workflows. The model selects matching blocks, composes layout regions from genome principles (no surface matching), applies rules and safety constraints, and returns structured JSON.
- `callCritic` — used by `review_output`. Sends the genome plus the generated code and auto-check results. Returns `honored`, `borderline`, `fix`, `novel`, and `copy_violations` arrays.

Both calls include a JSON-parse retry loop: if the model returns invalid JSON, one follow-up message is sent requesting clean JSON before giving up.

### Prompt caching (Anthropic direct mode only)

The genome context string is sent as a `cache_control: { type: "extended" }` block in the first user message. This caches the genome prefix at the Anthropic API level so repeated calls within the cache TTL avoid re-tokenising the genome on every request.

### Tools summary

| Tool | Required fields | Notes |
|------|----------------|-------|
| `consult_before_build` | `intent_description` | `scope` parameter removed. `domain`, `user_type`, `workflows`, `project_root` optional. |
| `review_output` | `generated_output`, `original_intent` | Hybrid: auto-checks run first, then LLM critique |
| `report_pattern` | `pattern_name`, `description`, `intent_it_serves`, `why_existing_patterns_didnt_fit`, `closest_match_block_id` | Unchanged from v1 |
| `ping` | — | Returns build info and kb stats |

---

## Deployment

### Hosted (TrueFoundry)

The server runs at TrueFoundry:

```json
{
  "mcpServers": {
    "design-mind": {
      "type": "sse",
      "url": "https://design-mind.truefoundry-aws.innovaccer.com/sse"
    }
  }
}
```

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | — | TrueFoundry JWT (gateway mode) |
| `OPENAI_BASE_URL` | — | `https://truefoundry.innovaccer.com/api/llm/api/inference/openai/` (gateway mode) |
| `OPENAI_MODEL` | `gpt-4o` | Gateway model name (e.g. `internal-bedrock/sonnet-46`) |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-5` | First-priority model in gateway mode |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Last-resort fallback model in gateway mode |
| `ANTHROPIC_API_KEY` | — | Direct Anthropic key (direct mode) |
| `GEMINI_API_KEY` | — | Direct Gemini key (direct mode) |
| `TRANSPORT` | `stdio` | Set to `sse` to enable HTTP/SSE transport |
| `PORT` | `8080` | HTTP port |
| `API_KEY` | `dm-local-dev-key` | Key for `/candidates` endpoint |
| `DESIGN_MIND_API_KEY` | `dm-local-dev-key` | Must match `API_KEY` |
| `DESIGN_MIND_API_URL` | `http://localhost:3456` | Base URL of candidates API |
| `SLACK_WEBHOOK_URL` | — | Optional Slack webhook for candidate notifications |
| `DESIGN_MIND_PROJECT` | (dirname) | Project name attached to candidate submissions |

### Local development

```bash
cd server && npm install
node src/index.js
```

Or with SSE transport:

```bash
TRANSPORT=sse PORT=8080 node src/index.js
```

---

## Remotes

- **MCP server (GitLab):** https://gitlab.innovaccer.com/innovaccer-ui/design-mind-mcp.git
- **Showcase repo (GitLab):** https://gitlab.innovaccer.com/innovaccer-ui/design-mind-showcase
- **Current branch:** transformation
