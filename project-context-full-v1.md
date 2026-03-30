# Design Mind MCP — Project Context

> Auto-generated from repo on 2026-03-30. Do not edit manually — run `node scripts/generate-context.js` to refresh.

**Repo:** https://github.com/anantgarg-jpg/design-mind-mcp
**Hosted MCP:** https://design-mind-mcp-production.up.railway.app/sse

---

## What this project is

Design Mind MCP is a Claude Code tool (MCP server) that enforces consistent, safe, and ontologically correct UI generation across any frontend project that connects to it. It acts as the accumulated design intelligence of a clinical healthcare platform — with memory, taste, and the authority to push back on decisions that feel wrong.

Any team can point their `.mcp.json` at the hosted server and get the full Design Mind genome at build time.

Tech stack: Node.js 18+, ES modules, dual stdio/HTTP+SSE transport, Railway deployment, Anthropic API (claude-sonnet-4-5) with prompt caching for LLM-based genome reasoning. No framework — pure Node `http`.

---

## MCP Tools

Three tools exposed by the server:

**`consult_before_build`** — Call BEFORE generating any UI. Required: `intent_description`, `scope`. Optional: `domain`, `user_type`, `workflows`. Returns: `surface` (matched or generated), `layout` (regions with block assignments), `workflows` (per-workflow block recommendations with import_instruction from @innovaccer/ui-assets), `rules_applied`, `safety_applied`, `ontology_refs`, `confidence`, and `gaps`.

**`review_output`** — Call AFTER generating UI. Takes `generated_output` (code) + `original_intent` + optional `context_used` (consult_before_build response). Auto-checks: block source validation (shadcn duplication, wrong tier, reimplementation), consultation alignment (surface import, layout ordering, workflow completeness), token usage (hex, rgb, non-semantic Tailwind, !important), copy voice, non-canonical terms. LLM Critic reviews holistically against the genome. Returns: `auto_checks`, `honored`, `borderline`, `novel`, `fix`, `copy_violations`, `confidence`.

**`report_pattern`** — Call ONLY when UI STRUCTURE changes (new layout, new interaction model, new slot arrangement). NOT when slot content changes (label, domain, icon, entity type). Submits to hosted API → Slack → human ratification. Falls back to `blocks/_candidates/` YAML. 3+ reports across projects = `ready_for_ratification`.

**Block variation rule:** "Am I changing structure or content?" Content changes → use existing block. Structure changes → call `report_pattern`.

### Tool schemas

#### consult_before_build
```yaml
tool: consult_before_build
version: 3.0.0
description: >
  REQUIRED before generating ANY UI — component, page, surface, or style change.
  Returns the design genome construction packet: surface matching, layout structure,
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
  1. Read surface.matched first. If true, layout is authoritative. If false, layout is generated.
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
    description: Surface matching result.
    properties:
      matched: boolean
      confidence: number
      surface_id: string   # null if not matched
      import_instruction: string   # null if not matched

  layout:
    type: object
    description: >
      Layout structure. source="surface" means regions come from a surface spec (authoritative).
      source="generated" means the LLM composed regions from genome principles.
    properties:
      source: string   # "surface" | "generated"
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
  Call when you have built something novel that the genome doesn't
  cover. This is how new patterns enter the candidate queue.
  The Design Mind reviews, and if seen by 3+ teams, it goes to
  human ratification.

input:
  pattern_name:
    type: string
    required: true
    description: A short descriptive name for the pattern

  description:
    type: string
    required: true
    description: What the pattern is and what problem it solves

  intent_it_serves:
    type: string
    required: true

  implementation_ref:
    type: string
    required: false
    description: File path or PR link to the implementation

  why_existing_patterns_didnt_fit:
    type: string
    required: true
    description: >
      What you looked for in consult_before_build and why
      none of the returned patterns covered this case

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
version: 2.0.0
description: >
  Call after generating UI to get structured feedback. Runs deterministic
  auto-checks (block sources, consultation alignment, token usage, copy voice,
  terminology) followed by an LLM Critic review. Returns what honored the
  genome, what was borderline, what needs fixing, and any novel blocks to report.

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
    description: >
      The response from consult_before_build. When provided, enables
      consultation alignment checks (surface import, layout ordering,
      workflow completeness, block coverage, never constraints).

output:
  auto_checks:
    type: array
    description: >
      All deterministic violations found by the three validation functions:
      validateBlockSources (shadcn duplication, wrong tier, reimplementation),
      validateConsultationAlignment (surface, layout, workflows),
      validateTokenUsage (hex, rgb, non-semantic Tailwind, !important, arbitrary spacing).
    items:
      violation_type: string
      found_text: string
      correction: string
      severity: string   # "blocker" | "warning"
      rule_ref: string

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
      coherence: string

  fix:
    type: array
    description: >
      All violations requiring correction. Includes blocker auto-checks
      and LLM-identified issues. safety_block: true items must be resolved first.
    items:
      problem: string
      rule_violated: string
      correction: string
      safety_block: boolean

  candidate_patterns:
    type: array
    items:
      name: string
      description: string

  copy_violations:
    type: array
    items:
      rule: string
      found: string
      correction: string

  confidence:
    type: number
    description: Overall genome compliance score (0.0–1.0).
```


---

## Genome hierarchy

| Level | Location | Encodes |
|-------|----------|---------|
| **Tokens** | `genome/rules/styling-tokens.rule.md` | Design tokens, DM Sans, 4px grid, elevation, z-index, motion |
| **Blocks** | `blocks/*/meta.yaml` | Reusable structures with product decisions — from status badge to form layout |
| **Surfaces** | `surfaces/*.surface.yaml` | Full artifacts: intent, omissions, ordering, actions, hard never rules |

**Rules registry (v1.4.0):**

- `interface-guidelines` — confidence 0.95 — v1.0.0 — replaces shell-layout and navigation-patterns. Covers threads, chat, artifacts (lifecycle, singleton/multi-instance, progressive disclosure, actions), navigator (solutions, default routes, custom threads), and building on the shell (solution structure, manifest contract, block components, chat handlers, pre-requisite flows).
- `destructive-actions` — confidence 0.95
- `data-density` — confidence 0.88
- `styling-tokens` — confidence 0.97 — v2.0.0 — expanded from color-only tokens to full styling system: typography (DM Sans), spacing (4px grid), border-radius, elevation, z-index, motion. Colors updated to the color palette defined in theme.css. Single comprehensive file. Load this rule for ANY styling decision.
- `copy-voice` — confidence 0.95
- `accessibility` — confidence 0.95

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

## Visual Identity

The product's visual character is flat, restrained, and border-driven. Surfaces are defined by background contrast and thin borders, not shadows or elevation. The UI is quiet at rest — neutral colors, light type weights, minimal chrome — and only gains saturation or visual weight when communicating meaning. This restraint is deliberate: in a clinical tool used hundreds of times a day, every pixel of visual noise competes with the data that matters.

**The principles:**

- **Contextual card elevation.** Shadows exist for elements that genuinely float above the page — dropdowns, modals, tooltips, popovers — and for cards that sit on a tinted/muted background where border alone doesn't provide enough separation. Buttons, inputs, rows, headers, and banners are always flat. Cards on white backgrounds stay border-driven; cards on grey/muted surfaces get `shadow-sm`; cards in expressive/onboarding flows may use `shadow-md`.
- **Borders over shadows.** A 1px border in `border-border` communicates "this is a region" without adding visual weight. When even a border feels heavy. Reserve heavy borders for edges that need structural definition.
- **No decorative chrome.** No gradients, inner highlights, colored glows, or inset shadows. No border-bottom tricks to simulate depth. If an element looks "designed," it's probably over-styled. The interface should feel engineered.
- **Color enters with purpose.** The resting UI is almost entirely neutral. Saturated color appears only when it carries meaning: status indicators, active/selected states, primary actions, destructive intent, or semantic feedback. Color used decoratively dilutes the meaning of color used semantically.

---

## Design Dials

Three dials govern the character of every interface. The baselines below are the default for all generations — do not deviate without reason. If the user asks for more creativity, more exploration, or something that feels fresh, turn the dials up. If they feel the output is too different from the current interface or too experimental, dial it back. Otherwise, hold the baselines.

### Design Variance · Baseline: 6
*1 = Perfect symmetry, predictable grids. 10 = Asymmetric, art-directed, unexpected.*

| Range | Character | When to use |
|---|---|---|
| 1–3 | **Rigid structure.** Equal columns, symmetrical grids, zero surprises. Predictability is the feature. | Data tables, forms, settings panels. Anywhere the user is scanning for specific values. Symmetry here isn't boring — it makes rows and columns machine-readable by humans. |
| 4–6 | **Structured and composed.** Strong grid alignment, even column distributions, clear spatial logic — but with considered variation in content hierarchy, section rhythm, and component arrangement within the grid. No asymmetric column ratios, no offset alignments, no varied card sizes. | Dashboards, list views, detail screens, multi-panel layouts. The vast majority of product screens live here. The grid stays clean; the interest comes from typographic hierarchy and content organization, not layout tricks. |
| 7–9 | **Intentionally asymmetric.** Uneven column ratios (7/5, 8/4), offset alignments, varied card sizes, fractional grid columns, deliberate whitespace imbalance. | Use sparingly. Feature introduction screens, first-run experiences, or moments where a specific content block deserves disproportionate visual weight. The layout is making an argument — it's saying "look here first." If that argument isn't clear, drop back to 4–6. |
| 10 | **Art-directed.** Masonry, overlapping elements, dramatic negative space. Every screen feels like someone *designed* it, not assembled it. | Almost never in a product context. Reserve for highly singular moments — an annual review visualization, a showcase screen — where the content is simple enough to survive an unconventional layout. |

**The rule:** Variance should be invisible to the user. High variance doesn't mean chaotic — it means the layout feels composed rather than generated. If someone notices the layout is unusual, dial it back.

### Motion Intensity · Baseline: 5
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

- **Weight hierarchy is strict.** Three weights, three roles — no exceptions:
  - **Regular (400)** — the workhorse. Body text, interactive controls (buttons, inputs, selects, toggles), table cells, list content, descriptions, helper text. This is the default weight for the entire UI.
  - **Medium (500)** — structural emphasis. Section headings, column headers, active navigation items, form labels, stat labels. Used to create scannable landmarks within a page without shouting.
  - **Semibold (600)** — rare, high-level titles only. Page titles, dialog titles, card titles when the card is the primary content. If you're reaching for semibold on anything that isn't a title, reconsider — size and color contrast should do the job instead.
- **Hierarchy comes from size and color, not weight stacking.** A regular-weight label in `text-muted-foreground` at 12px against a regular-weight value in `text-foreground` at 14px creates clear hierarchy without touching font-weight. Resist the urge to make things bolder — make them bigger, darker, or lighter instead.
- **Numbers earn emphasis contextually.** When numbers are the primary content — metrics, totals, scores — give them tabular figures, proper alignment, and breathing room. When they're supporting detail alongside text, they don't need special treatment. Let the screen's purpose decide.
- **Use the defined text styles.** Typefaces and text styles are predefined in the design tokens. Use those — don't pick new typefaces or invent custom styles. The consistency of the system depends on every screen drawing from the same typographic palette.

---

## Color with Purpose

Color is a language. Every hue in the interface is a word — use too many and the sentence is noise. Color tokens are defined both semantically and as raw values — use only those. Do not introduce colors outside the token system.

- **Neutral at rest, saturated with intent.** The base UI lives in a restrained neutral palette — whites, light greys, subtle borders. Saturated color enters only when it carries meaning: status, interaction state, primary actions, destructive intent. A screen at rest should be almost entirely monochromatic.
- **Surfaces separate through contrast, not elevation.** Use background color differences (`bg-card` on `bg-background`, `bg-muted` for inset regions) and thin borders to define content regions. Shadows are reserved for floating layers and for cards on muted/tinted backgrounds where border alone lacks sufficient contrast.
- **State changes through opacity.** Hover, selected, and active states use background opacity shifts on the base color (`foreground/[0.04]` for hover, `foreground/[0.08]` for active, `primary/10` for selected). This keeps state feedback subtle and consistent across every element without introducing new colors.
- **Stay within the token system.** Semantic tokens (background, foreground, muted, accent, destructive, etc.) exist for a reason — they encode meaning that raw hex values don't. Using tokens consistently is how the interface stays coherent across dozens of screens built at different times.

---

## Space as Architecture

Whitespace isn't the absence of design. It's the most powerful structural element available.

- **Compact but not cramped.** Padding is efficient — elements don't waste space — but never so tight that content feels compressed or hard to parse. When in doubt, add breathing room. A few extra pixels of padding cost nothing; a cluttered interface costs comprehension. The goal is "productive density," not "maximum packing."
- **Spacing creates grouping.** Related elements sit close; unrelated elements breathe apart. If spacing is doing its job, visible dividers become redundant. The Gestalt principle of proximity is the most underused tool in interface design.
- **Rhythm over randomness.** Consistent spacing tokens — applied religiously — create the subconscious feeling of "one system." Irregular spacing, even by 4px, registers as carelessness.
- **Density is a choice, not an accident.** Some interfaces need to be dense — dashboards, data tables, professional tools. That's fine. Dense and organized feels calm. Dense and unstructured feels chaotic. The difference is the spatial system.
- **Let content breathe at the page level.** Max-widths, proportional margins, and intentional negative space at the macro level separate polished products from ones that feel like they're trying to fill every available pixel.

---

## Motion with Meaning

Animation is not personality. It's spatial communication.

- **Transitions answer "where."** Where did this element come from? Where did it go? Where am I now? If an animation doesn't orient the user in space or state, it's decoration.
- **Speed is a feature.** 100ms for micro-interactions (hover, focus, press feedback). 150ms for component state changes (dropdown open, toggle flip). 200–300ms for layout shifts only. Anything that makes the user wait for an animation to finish is borrowing time they didn't offer.
- **Press feedback is physical.** Interactive elements scale down subtly on press (`scale(0.97)`) to give tactile confirmation. This replaces shadow changes or color darkening as the primary press signal. The scale is small enough to feel natural, never bouncy or exaggerated.
- **Easing conveys physics.** Ease-out for entrances (arriving and settling), ease-in for exits (accelerating away), ease-in-out for repositions. Linear motion feels robotic. Spring physics feel alive but should be used sparingly — bounciness is a strong flavor.
- **Transition only what changes.** Never use `transition-all`. Specify the exact properties that transition (`transition-colors`, `transition-[color,background-color,transform]`). This prevents unintended animation of properties like width, height, or padding during layout changes.
- **No gratuitous motion.** No loading spinners designed to entertain. No success confetti. Skeleton screens are fine as loading placeholders, but they should be simple and structural — not shimmer animations performing busyness. If the system is working, the result is the reward.

---

## Layout and Composition

**Grids are freedom, not constraint.** A strong grid system makes every placement decision faster and every result more cohesive.

- **Predictable regions, surprising content.** Users should always know where to look for navigation, primary content, and supporting context. Within those predictable zones, the content itself can be rich and varied.
- **Alignment is non-negotiable.** Every element should sit on a grid line or be deliberately offset from one. Approximate alignment is worse than no grid at all — it creates a feeling of "almost right" that's more distracting than chaos. In lists and repeated-item layouts, this extends to positional consistency: actions, badges, and recurring elements must occupy the same slot across every item — content variation in one part of a row must never shift an element's position in another.
- **Column alignment in repeated-item layouts.** In lists, rows, and repeated-item layouts, every data column must have a fixed width so that values align vertically across items. A single flexible column (typically the primary label) absorbs width variance by truncating. Variable-width content — such as action buttons or status badges — must be contained within a fixed-width group so they cannot shift adjacent columns. The flexible column is always the one closest to the user's reading entry point (typically the name or title), because truncation there is least disruptive to scanning.
- **Responsive design preserves hierarchy, not just layout.** Focus on web viewports — ensure layouts adapt gracefully across common desktop and laptop screen widths. Reflowing content without re-prioritizing is a missed opportunity. What's most important at a wide viewport should still be most prominent at a narrow one.

---

## Craft and Polish

The difference between good and great is in the details no one consciously notices.

- **Icon consistency.** Same stroke weight, same optical size, same style across every icon in the system. Mixing outlined and filled styles, or varying visual weight, creates subtle discord.
- **Border radius consistency.** Radii are defined in the token system. Use them consistently — mixing values across a screen reads as indecisive, even if no one can pinpoint why.
- **Flatness is a craft decision.** Shadows are reserved for floating layers (dropdowns, modals, tooltips) and cards on muted/tinted backgrounds. Buttons, inputs, banners, and rows always rely on borders and background contrast. If you reach for a shadow on a non-card anchored element, stop and use a border instead. The product's visual identity is flat and border-driven; shadows are contextual, not decorative.
- **Pixel-level precision.** Subpixel alignment, consistent padding, optical centering of icons within buttons. These things are invisible when right and quietly wrong when not. Sweat them.
- **List scanability test.** In any list or table, cover the leftmost column and check: can you still read each remaining column as a vertical stripe? If column edges waver across rows, the layout fails the scanability test regardless of how individual rows look in isolation.

---

## What We Never Do

- **Chase trends.** No glassmorphism-of-the-year, no bouncy micro-interactions borrowed from consumer apps, no aesthetic choices driven by what's popular on Dribbble. Timelessness over trendiness.
- **Decorate without purpose.** Every visual element — illustration, gradient, shadow, animation — must have a reason beyond "it felt empty." If it doesn't inform, orient, or clarify, it doesn't belong.
- **Add visual weight for emphasis.** No gradients on buttons. No inner highlights on cards. No colored glows around inputs. No inset shadows on containers. If something needs emphasis, use size, color, or position — not decorative chrome.
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
VERSION: 2.0.0
CONFIDENCE: 0.88

APPLIES_TO: any surface or block displaying data, records, lists, or forms
            in a clinical context

---

WHEN — list views:
  - displaying > 10 records of the same entity type

USE:
  - table for structured data with sortable attributes
  - list (card stack) for entities with variable content or actions
  - virtual scrolling for > 100 records

NOT:
  - paginated views with < 10 rows per page for high-frequency workflows
  - card grid for high-volume scanning surfaces — linear scan is faster

---

WHEN — empty states:
  - a list, table, or query returns zero results

USE:
  - one-line honest statement of what's empty and why
  - optional: single CTA if there is a clear next action
  - format: "No [entity] [condition]." e.g. "No open care gaps for this patient."

NOT:
  - illustrations or icons in empty states
  - celebratory copy ("All caught up!")
  - multi-paragraph explanations

---

WHEN — loading states:
  - data is being fetched

USE:
  - skeleton screens matching the shape of the expected content
  - loading spinner only for action feedback (like buttons) and cases where the block or surface can have completely empty data. 

NOT:
  - full-page loading spinners for partial data loads
  - "Loading..." text alone
  - Progress bar loaders

---

WHEN — information completeness:
  - deciding what data to surface upfront vs. behind progressive disclosure

USE:
  - absolute must-haves — fields required to understand or act on a record — always
    visible without interaction
  - progressive disclosure for contextual or supplementary data that supports but
    does not gate the primary action
  - judgment: if a user must open a detail view to decide what to do at all times, the surface
    is under-displaying

NOT:
  - hiding all secondary context behind expand or drilldown — this forces unnecessary
    navigation and is a density failure in the other direction
  - surfacing every available field indiscriminately — overload is also a
    density failure

BECAUSE:
  The right level of upfront disclosure depends on the workflow. The principle is
  that users should not need to navigate away to make a decision they could
  reasonably make inline. See also: principles.md for related guidance.

---

WHEN — metadata grouping:
  - displaying an entity alongside its related attributes

USE:
  - group related metadata spatially near the entity it describes
  - keep contextual attributes (dates, statuses, related values) adjacent to
    their parent value
  - maintain consistent attribute order across instances of the same entity type

NOT:
  - scattering related attributes across unrelated regions of a surface or block
  - hiding contextual metadata behind interaction when it directly informs
    the primary value

---

WHEN — choosing a density level:
  - setting default density for a surface or block

USE:
  - low density as the default for infrequent, high-stakes, form-heavy, or
    detail-oriented workflows — space aids accuracy and comprehension here
  - high density as the default for high-volume, repetitive, or
    scanning-oriented workflows — it is equally valid when it serves the task
  - density evaluation at both the block level and the surface level —
    a surface may mix dense list blocks with spacious detail blocks

NOT:
  - assuming compact is always better — low density is appropriate and preferred
    in the right context
  - assuming high density is a compromise or a concession — it is a first-class
    choice when the workflow demands it
  - forcing uniform density across an entire surface or product regardless of
    what each block is asking the user to do

BECAUSE:
  Density is a workflow concern, not an aesthetic one. Clinical surfaces span a
  wide range — from high-volume scanning workflows where dense data is a
  productivity requirement, to entry or review surfaces where space aids accuracy.
  Neither high nor low density is inherently better. The right choice depends on
  what the user is doing and how often. Density should be evaluated at the block
  level as well as the surface level — different regions of the same surface
  may warrant different densities.

### styling-tokens (confidence: 0.97)

RULE: styling-tokens
VERSION: 2.0.0
CONFIDENCE: 0.97

APPLIES_TO: every component, every surface, every generated UI

# ── THE ONLY STYLING SOURCE OF TRUTH ─────────────────────────────────────────

The platform uses design tokens defined in theme.css.
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

SURFACES (gray "stone" and "night" semantic families):
  --background       #F7F7F7  (gray-100 / stone lightest) — page background
  --card             #FFFFFF  — card and panel surfaces, sits above background
  --foreground       #1A1A1A  (gray-1400 / night) — primary text on background
  --card-foreground  #1A1A1A  — primary text on cards
  --muted            #EBEBEB  (gray-200 / stone lighter) — subtle backgrounds for inactive areas
  --muted-foreground #636363  (gray-900 / night lighter) — secondary and hint text
  --popover          #FFFFFF  — dropdown and tooltip surfaces
  --border           #D4D4D4  (gray-400 / stone) — all borders and dividers
  --input            #C4C4C4  (gray-500 / stone dark) — input field borders
  --ring             #9DC0F6  (blue-300) — focus ring color

FOCUS RING TREATMENT:
  Focus rings use --ring (blue-300) at full opacity — the light blue is
  soft enough on its own without an additional opacity modifier:
    - Default:      ring-ring  (all non-destructive elements)
    - Destructive:  ring-ring-destructive  (destructive buttons and actions)
  Structure: focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none
  The ring color is set per-variant, not globally, so destructive actions
  get a red-tinted ring that matches their intent.

# ── TOKEN MAP: BRAND ─────────────────────────────────────────────────────────

BRAND:
  --primary            #0060D6  (blue-600 / primary-default) — CTAs, active states, links, focus rings
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

# ── TOKEN MAP: BLUE / PRIMARY SCALE ───────────────────────────────────────────

Blue primitives use a 100–1200 scale. Semantic tokens reference specific stops.

  TOKEN        HEX      SEMANTIC           USE
  ───────────  ───────  ─────────────────  ──────────────────────────────────
  --blue-100   #E8F1FD  primary-ultra-lt   accent bg, low-severity bg (= --accent)
  --blue-200   #C5DAFA  —                  hover on accent surfaces
  --blue-300   #9DC0F6  —                  selected row tint, light interactive
  --blue-400   #70A3F0  —                  progress bar fill, chart secondary
  --blue-500   #3C82E8  —                  mid-range decorative, chart primary
  --blue-600   #0060D6  primary-default    CTAs, links, active states (= --primary)
  --blue-700   #0051B5  —                  primary hover state
  --blue-800   #004294  —                  primary active/pressed state
  --blue-900   #003374  —                  text on accent bg (= --accent-foreground)
  --blue-1000  #002555  —                  dark headings on blue surfaces
  --blue-1100  #001839  —                  near-black blue
  --blue-1200  #000E22  —                  deepest blue

USAGE: Prefer semantic tokens (--primary, --accent, --accent-foreground) over
raw --blue-* values. The blue scale exists as a reference for edge cases like
chart fills, progress indicators, and interactive state gradations. If you're
reaching for --blue-* in a component, ask first whether a semantic token
already handles it.

# ── TOKEN MAP: RED / DESTRUCTIVE SCALE ─────────────────────────────────────────

Red primitives use a 100–1200 scale. Semantic tokens reference specific stops.

  TOKEN        HEX      SEMANTIC           USE
  ───────────  ───────  ─────────────────  ──────────────────────────────────
  --red-100    #FFF2F0  destructive-ultra  banner/card bg (= --destructive-light)
  --red-200    #FDDAD5  —                  hover on destructive-light surfaces
  --red-300    #FABCB3  —                  selected row tint, light error state
  --red-400    #F59788  —                  progress bar fill, chart error
  --red-500    #EC6750  —                  mid-range decorative, chart secondary
  --red-600    #D62400  destructive-def    delete actions, critical severity (= --destructive)
  --red-700    #B51F00  —                  destructive hover state
  --red-800    #941900  —                  destructive active/pressed state
  --red-900    #731400  —                  dark text on destructive-light bg
  --red-1000   #540F00  —                  dark headings on red surfaces
  --red-1100   #380A00  —                  near-black red
  --red-1200   #200600  —                  deepest red

USAGE: Prefer semantic tokens (--destructive, --destructive-foreground,
--destructive-light) over raw --red-* values. The red scale exists as a
reference for edge cases like chart error states, heatmaps, and interactive
state gradations. If you're reaching for --red-* in a component, ask first
whether a semantic token already handles it.

# ── TOKEN MAP: YELLOW / WARNING SCALE ──────────────────────────────────────────

Yellow primitives use a 100–1200 scale. Semantic tokens reference specific stops.

  TOKEN          HEX      SEMANTIC           USE
  ─────────────  ───────  ─────────────────  ──────────────────────────────────
  --yellow-100   #FFF8E6  warning-ultra-lt   banner/card bg (= --warning-light)
  --yellow-200   #FFEFC2  —                  hover on warning-light surfaces
  --yellow-300   #FFE38D  —                  selected row tint, light warning state
  --yellow-400   #FFD75C  —                  progress bar fill, chart secondary
  --yellow-500   #FACB30  —                  mid-range decorative, chart primary
  --yellow-600   #F5BA0A  warning-default    fills, indicators (= --warning)
  --yellow-700   #D6A208  —                  warning hover state
  --yellow-800   #B78A07  —                  warning active/pressed state
  --yellow-900   #987206  —                  legacy warning-text (replaced by 1100)
  --yellow-1000  #7A5B04  —                  dark headings on yellow surfaces
  --yellow-1100  #5C4403  warning-text       accessible text on white (= --warning-text)
  --yellow-1200  #3D2D02  —                  deepest yellow

USAGE: Prefer semantic tokens (--warning, --warning-surface, --warning-light)
over raw --yellow-* values. The yellow scale exists as a reference for edge
cases like chart fills, heatmaps, and interactive state gradations. If you're
reaching for --yellow-* in a component, ask first whether a semantic token
already handles it.

# ── TOKEN MAP: GREEN / SUCCESS SCALE ──────────────────────────────────────────

Green primitives use a 100–1200 scale. Semantic tokens reference specific stops.

  TOKEN          HEX      SEMANTIC           USE
  ─────────────  ───────  ─────────────────  ──────────────────────────────────
  --green-100    #E8FCE8  success-ultra-lt   banner/card bg (= --success-light)
  --green-200    #C2F5C6  —                  hover on success-light surfaces
  --green-300    #90EA99  —                  selected row tint, light success state
  --green-400    #5CD86A  —                  progress bar fill, chart secondary
  --green-500    #30C442  —                  mid-range decorative, chart primary
  --green-600    #07A61A  success-default    fills, indicators (= --success)
  --green-700    #069016  —                  success hover state
  --green-800    #057A13  success-text       accessible text on white (= --success-text)
  --green-900    #04640F  —                  dark text on success-light bg
  --green-1000   #034E0C  —                  dark headings on green surfaces
  --green-1100   #023808  —                  near-black green
  --green-1200   #012405  —                  deepest green

USAGE: Prefer semantic tokens (--success, --success-foreground, --success-light)
over raw --green-* values. The green scale exists as a reference for edge cases
like chart fills, progress indicators, and interactive state gradations. If
you're reaching for --green-* in a component, ask first whether a semantic
token already handles it.

# ── TOKEN MAP: ORANGE / ALERT SCALE ───────────────────────────────────────────

Orange primitives use a 100–1200 scale. Semantic tokens reference specific stops.

  TOKEN           HEX      SEMANTIC           USE
  ──────────────  ───────  ─────────────────  ──────────────────────────────────
  --orange-100    #FFF3E6  alert-ultra-lt     banner/card bg (= --alert-light)
  --orange-200    #FFE0C2  —                  hover on alert-light surfaces
  --orange-300    #FFCA8F  —                  selected row tint, light alert state
  --orange-400    #FFB35C  —                  progress bar fill, chart secondary
  --orange-500    #FF9A30  —                  mid-range decorative, chart primary
  --orange-600    #FF8000  alert-default      fills, indicators (= --alert)
  --orange-700    #DB6E00  —                  alert hover state
  --orange-800    #B85C00  —                  alert active/pressed state
  --orange-900    #944A00  alert-text         accessible text on white (= --alert-text)
  --orange-1000   #713900  —                  dark headings on orange surfaces
  --orange-1100   #4F2800  —                  near-black orange
  --orange-1200   #301800  —                  deepest orange

USAGE: Prefer semantic tokens (--alert, --alert-foreground, --alert-light)
over raw --orange-* values. The orange scale exists as a reference for edge
cases like chart fills, heatmaps, and interactive state gradations. If you're
reaching for --orange-* in a component, ask first whether a semantic token
already handles it.

# ── TOKEN MAP: SEMANTIC COLORS ───────────────────────────────────────────────

Each semantic color has a foreground (accessible text), foreground-on-color,
and light (ultra-light background) variant.

DESTRUCTIVE (Red — Critical severity, delete actions):
  --destructive            #D62400  (red-600 / destructive-default)
  --destructive-foreground #FFFFFF  text on destructive backgrounds
  --destructive-light      #FFF2F0  (red-100 / destructive-ultra-light) — banner/card bg

SUCCESS (Green):
  --success                #07A61A  (green-600 / success-default) — fills, indicators
  --success-foreground     #1A1A1A  text on success backgrounds (dark for contrast)
  --success-text           #057A13  (green-800) — accessible fg on white/light bg
  --success-light          #E8FCE8  (green-100 / success-ultra-light) — banner/card bg

WARNING (Yellow — Overdue, Medium severity):
  --warning                #F5BA0A  (yellow-600 / warning-default) — fills, indicators
  --warning-foreground     #1A1A1A  text on warning backgrounds (dark for contrast)
  --warning-text           #5C4403  (yellow-1100) — accessible fg on white/light bg
  --warning-light          #FFF8E6  (yellow-100 / warning-ultra-light) — banner/card bg

ALERT (Orange — High severity ONLY):
  --alert                  #FF8000  (orange-600 / alert-default) — fills, indicators
  --alert-foreground       #1A1A1A  text on alert backgrounds (dark for contrast)
  --alert-text             #944A00  (orange-900) — accessible fg on white/light bg
  --alert-light            #FFF3E6  (orange-100 / alert-ultra-light) — banner/card bg

ACCENT (Blue tint — Low severity, info states):
  --accent                 #E8F1FD  (blue-100 / primary-ultra-light) — background
  --accent-foreground      #003374  (blue-900) — foreground text

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
  accent1 (Orange)   #FF8000  orange-600
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

# ── SEVERITY COLOR FAST REFERENCE ────────────────────────────────────────────
# Full spec in safety/severity-schema.yaml

  Critical  → text-destructive (#D62400) / bg-destructive-light (#FFF2F0) / border-destructive/30
  High      → text-alert-text (#944A00) / bg-alert-light (#FFF3E6) / border-alert/30
  Medium    → text-warning-text (#5C4403) / bg-warning-light (#FFF8E6) / border-warning/30
  Low       → text-accent-foreground (#003374) / bg-accent (#E8F1FD) / border-accent-foreground/20

# ── STATUS COLOR FAST REFERENCE ──────────────────────────────────────────────

  Completed / Closed / Success   → text-success-text (#057A13) / bg-success-light (#E8FCE8)
  Overdue                        → text-warning-text (#5C4403) / bg-warning-light (#FFF8E6)
  In Progress / In Outreach      → text-primary (#0060D6) / bg-accent (#E8F1FD)
  Open                           → text-muted-foreground (#636363) / border border-border
  Cancelled / Excluded           → text-muted-foreground (#636363) / bg-muted (#EBEBEB)
  Error / Failed                 → text-destructive (#D62400) / bg-destructive-light (#FFF2F0)

# ── TYPOGRAPHY SCALE ─────────────────────────────────────────────────────────

Font: DM Sans via --font-sans (root). Mono: DM Mono via --font-mono.

  CATEGORY     VARIANT    CLASS                          SIZE   WEIGHT      LH    WHEN
  ───────────  ─────────  ─────────────────────────────  ─────  ──────────  ────  ──────────────────────────────
  title        default    text-lg font-bold              16px   700         24px  Card titles, dialog titles
  title        medium     text-xl font-semibold          20px   500         32px  Section titles within artifacts
  title        large      text-[28px] font-normal        28px   400         40px  Page/artifact titles
  title        x-large    text-[32px] font-semibold      32px   500         48px  Stat values, hero metrics
  title        xx-large   text-[40px] font-normal        40px   400         48px  Display, large hero metrics
  body         default    text-base font-normal          14px   400/500/700 20px  Default body text
  body         large      text-lg font-normal            16px   400/500     24px  Large body text, emphasis
  body         small      text-sm font-normal            12px   400/500     16px  Meta text, timestamps, hints
  subheading   default    text-sm font-semibold          12px   500         24px  Section headers
  link         default    text-base font-normal          14px   400         20px  Inline links
  label        default    text-base font-semibold        14px   500         16px  Form labels, interactive labels
  mono         default    font-mono text-sm              12px   400         16px  Unique identifiers & codes (DM Mono)

WEIGHT HIERARCHY (by UI role):
  - font-normal (400): THE DEFAULT. Body text, interactive controls (buttons,
    inputs, selects, toggles, checkboxes), table cells, list content,
    descriptions, helper text, links. If in doubt, use 400.
  - font-medium (500): Structural emphasis. Section headings, column headers,
    active navigation items, form labels, stat labels, subheadings. Creates
    scannable landmarks without shouting.
  - font-semibold (600): Rare — titles only. Page titles, dialog titles,
    card titles when the card is the primary surface. If reaching for 600 on
    anything that isn't a title, use size or color contrast instead.
  - font-bold (700): title-default only. Almost never used outside card/dialog
    titles at small sizes where 600 is insufficient.
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
  space-8  32px    p-8        Major section separation, panel gutters
  space-12 48px    p-12       Page-level vertical spacing (rare)
  space-16 64px    p-16       Reserved (almost never needed)

COMPONENT SPACING CONVENTIONS:
  Cards (bg-card):        p-4 (space-4, 16px all sides)
  Rows (list items):      px-3 py-2 (space-3 horizontal, space-2 vertical — 12px / 8px)
  Alert banners:          p-3 (space-3, 12px all sides) with gap-2 (8px) internal
  Section gaps:           gap-3 (12px) between cards, gap-2 (8px) between rows
  Meta row (below title): mt-1 (4px), gap-2 (8px) between items
  Button groups:          gap-2 (8px) between buttons, gap-1 (4px) for icon buttons

  See data-density.rule.md for 32px compact row height default.
  See interface-guidelines.rule.md for shell authoring contract — agents do not control the shell.

FLEX/GRID GAP CONVENTIONS:
  gap-1   (4px)   icon + text inside a single element; icon-only button sets
  gap-1.5 (6px)   tight button groups
  gap-2   (8px)   button groups, badge groups, chip rows; meta items in rows; alert internal layout
  gap-3   (12px)  row internal sections; between cards in a section
  gap-4   (16px)  card internal sections, header sections; major content blocks within a panel

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
  Cards (CareGapCard, StatCard):   rounded-lg
  Alert banners:                    rounded-r-md (left border accent, right rounded)
  ChatQuickActionChip:              rounded-full (always)
  Buttons:                          rounded-md (inherited from component library)
  Inputs:                           rounded-md
  Avatars/initials:                 rounded-full
  Dropdowns/popovers:               rounded-md

NEVER:
  - Use rounded-2xl or rounded-3xl — too soft for clinical context
  - Mix radius sizes on elements at the same hierarchy level
  - Round only some corners of a card unless it has a left/top border accent

# ── ELEVATION & SHADOWS ──────────────────────────────────────────────────────

FLAT BY DEFAULT — WITH CONTEXTUAL CARD ELEVATION.
The product's visual identity is flat and border-driven.
Shadows exist for elements that genuinely float above the page,
AND for cards that sit on a tinted/muted background where border
alone doesn't provide enough separation.

  LEVEL         CLASS               WHEN
  ────────────  ──────────────────  ────────────────────────────────────────
  flat          (no shadow)         THE DEFAULT. Buttons, inputs, rows,
                                    headers, banners, list items, all controls
  card-raised   shadow-sm           Cards on bg-muted or bg-background when
                                    the parent surface is tinted/grey
  card-express  shadow-md           Cards in onboarding/expressive flows
                                    needing stronger visual presence
  dropdown      shadow-md           Dropdowns, popovers, context menus
  dialog        shadow-lg           Modals, dialogs, command palette
  tooltip       shadow-sm           Tooltips

WHAT IS ALWAYS FLAT (no shadow, no exceptions):
  - Cards on bg-background (white-on-white) — use border border-border
  - Buttons and interactive controls — always flat
  - Inputs, selects, textareas — border only
  - Rows in lists — border-b or background alternation
  - Headers (EntityContextHeader, section headers) — border-b
  - Alert banners — colored left border, no shadow
  - Sidebar content — sidebar tokens handle surface treatment
  - Any element inside a card — shadows never nest

WHEN CARDS GET shadow-sm:
  - Card (bg-card) sits on a muted/grey parent (bg-muted, bg-background
    with a tinted page wrapper, or any non-white surface)
  - The shadow replaces the border — do NOT combine shadow-sm + border
  - Maximum card shadow is shadow-sm for standard layouts

WHEN CARDS GET shadow-md:
  - Expressive / onboarding flows where cards need stronger visual presence
  - Still never shadow-lg or higher — those stay reserved for dialogs

HOW TO SEPARATE WITHOUT SHADOW:
  - Border: border border-border (1px, subtle grey) for structural edges
  - Background contrast: bg-card on bg-background for content regions
  - Inset background: bg-muted for nested/secondary regions
  - Dividers: border-b border-border between stacked items
  - Contextual shadow: shadow-sm on bg-card when parent is bg-muted
    (prefer this over border when the card needs visual lift)

NEVER:
  - Stack shadows (a floating element inside another floating element)
  - Use shadow-xl or shadow-2xl — too dramatic for clinical context
  - Add shadow to severity indicators — severity communicates via color, not depth
  - Use box-shadow for non-elevation purposes (glow effects, colored glows,
    inner highlights, inset shadows for depth simulation)
  - Add shadow to buttons, inputs, or non-card anchored elements
  - Use hover shadow transitions — use background color shift for hover instead

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
  micro       100ms      Hover states, focus rings, press feedback, opacity toggles
  fast        150ms      Dropdown open/close, toggle flip, component state change
  normal      200ms      Tab switch content, panel state change
  layout      300ms      Panel collapse/expand, skeleton-to-content reveal
  (no slow)              Nothing in this product takes > 300ms

PRESS FEEDBACK:
  Interactive elements use active:scale-[0.97] as the standard press signal.
  This replaces shadow changes, color darkening, or translate-y as the
  primary press feedback. The scale is subtle enough to feel physical
  without being bouncy. Link-style elements (text links, breadcrumbs) do
  NOT scale — they use opacity change only.

EASING:
  ease-out              Default for entrances — element arrives and settles
  ease-in-out           Default for state changes — smooth transition
  ease-in               Exit/removal only — element accelerates away
  linear                Never for UI — only for progress bars

TAILWIND CLASSES:
  transition-colors                                        Hover backgrounds, border changes (most common)
  transition-opacity                                       Reveal on group-hover (opacity-0 group-hover:opacity-100)
  transition-[color,background-color,border-color,transform]  Interactive controls with press scale
  duration-100                                             Micro interactions (hover, focus, press)
  duration-150                                             Component state changes (dropdown, toggle)
  duration-200                                             Content swaps
  duration-300                                             Layout shifts only

  NEVER use transition-all — it transitions width, height, padding, and
  other layout properties unintentionally. Always specify exact properties.
  NEVER use transition-shadow — the product does not animate shadows.

WHAT TRANSITIONS:
  - Row hover background:   hover:bg-muted/60 transition-colors
  - Card hover background:  hover:bg-accent/50 transition-colors
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
  - Use contextual shadow for cards (shadow-sm on muted bg, shadow-md for expressive), no shadow for rows
  - Use specific transition classes (transition-colors, -opacity, -shadow)

# ── STATE FEEDBACK PATTERNS ──────────────────────────────────────────────────

Interactive elements follow a consistent state feedback language:

  STATE      TREATMENT                              EXAMPLE
  ─────────  ─────────────────────────────────────  ──────────────────────────
  hover      Background opacity shift               hover:bg-foreground/[0.04]
  active     Darker bg shift + scale(0.97)          active:bg-foreground/[0.08] active:scale-[0.97]
  focused    Soft blue-300 ring                      focus-visible:ring-ring
  selected   Primary-tinted background              bg-primary/10 or bg-accent
  disabled   50% opacity, no pointer events          disabled:opacity-50 disabled:pointer-events-none

  NEVER use shadow changes for hover feedback — use background color shift instead.
  NEVER use translate-y for press feedback — use scale instead.
  NEVER use color darkening as the sole press signal — always include scale.
  NEVER use gradients, glows, or inner highlights for any state.
  NEVER apply reduced opacity to text. Text is always 100% opacity unless the
  element is in a disabled state (disabled:opacity-50). Use semantic color tokens
  (e.g. text-muted-foreground) to create hierarchy — not opacity modifiers on
  existing tokens (e.g. text-destructive/70 is forbidden).

# ── USAGE RULES ──────────────────────────────────────────────────────────────

NEVER:
  - Use hardcoded hex values in component code
  - Use Tailwind default color classes (red-600, amber-100, blue-500, etc.)
  - Override --destructive or --success for non-semantic decoration
  - Use --warning or --alert for branding or decorative elements
  - Use a color that "looks like" a severity color for non-severity purposes
  - Use font-thin, font-light, or font-black
  - Use rounded-2xl or larger radius values
  - Use shadow on non-card anchored elements (buttons, inputs, rows, headers)
  - Use shadow-xl or shadow-2xl
  - Use transition-all — specify exact properties
  - Use transition-shadow — the product does not animate shadows
  - Use transition durations > 300ms
  - Animate severity indicators or clinical data values
  - Use gradients, inner highlights, colored glows, or inset shadows

### copy-voice (confidence: 0.95)

# copy-voice.md

> Good copy feels inevitable — like the only words that could have
> been there. That feeling doesn't come from creativity. It comes
> from discipline.

---

## Purpose

This platform is used by people making decisions that matter. The words
in the interface are not decorations — they are clinical instruments.
A label that's vague costs a clinician a second of hesitation. A
confirmation that's soft costs them trust in the system. An error
message that says "something went wrong" costs them the information
they needed to act.

Copy is not the UX writer's job bolted onto the designer's work.
It is the same job. Every string in the product — label, toast, empty
state, error, confirmation, tooltip — is held to the same standard as
every spacing decision and every color token.

This document is the language identity of the platform. It is always
loaded. It applies everywhere. There are no surfaces exempt from it.

---

## Tone

Clinical and direct. Not cold — human, but not casual.

The register is a senior care coordinator talking to a peer: precise,
confident, no throat-clearing. Not a chatbot. Not a marketing page.
Not an apology.

**Never:**
- Cute — *"Looks like you're all caught up! 🎉"*
- Apologetic — *"We're sorry, something went wrong"*
- Vague — *"Something happened"*
- Marketing — *"Supercharge your care workflows"*
- Deflecting — *"due to a technical issue"* / *"due to a system issue"*

**Always:**
- State what happened, then what to do
- Use the patient's name when addressing a specific situation
- Use numerals for all clinical quantities — *3 patients*, not *three patients*
- Keep it conversational where tone allows — *your* is fine when it
  makes the copy feel less robotic

The test: could a senior coordinator say this out loud to a colleague
without it sounding wrong? If yes, ship it. If it sounds like a
system talking about itself, rewrite it.

---

## The First-Person Rule

**"We" is prohibited in every user-facing string.**

No exceptions. No *"We couldn't load"*, no *"We recommend"*, no *"We
are experiencing"*. The platform does not have a voice. The platform
has a result. Describe the result.

First-person constructions of any kind are prohibited in error messages.
Use passive construction in body copy. Use *"Unable to …"* only in
headers and titles — never in body text.

---

## Labels and Actions

Labels are imperative, present tense. They name the action, not the
process of doing it.

```
✓  Acknowledge       ✗  Acknowledging
✓  Close Gap         ✗  Closing Gap
✓  Assign            ✗  Click to Assign
✓  Try again         ✗  Reattempt
✓  Reset password    ✗  Forgot password?
```

CTAs are as short as possible. Never append *"to continue"* after a
CTA. *"Save"* is complete. *"Save to continue"* is not.

If actions are represented as separate buttons, each action gets its
own distinct label. Do not combine them.

Secondary buttons on modals, interstitials, and popovers say **Close**,
not *Cancel*.

---

## Confirmation Dialogs

Confirmation dialogs never ask *"Are you sure?"* That question puts
the cognitive load on the user to infer the consequence. State the
consequence instead.

**Structure:** [Consequence statement]. [What this means or what
to do next.]

**Headers match CTAs.** If the action is *"Stop recording and close"*,
the header is *"Stop recording?"* — not *"Warning"*, not *"Confirm action"*.

```
✗  Header:  Ongoing recording
   Body:    Are you sure you want to close?
   CTAs:    Yes | Cancel

✓  Header:  Stop recording?
   Body:    [Patient] is being recorded. Closing this page will
            end the recording.
   CTAs:    Continue recording | Stop recording and close
```

Destructive action button labels match the action exactly. Never
*"Yes"*, *"OK"*, *"Confirm"*, or *"Proceed"* on a destructive dialog.

---

## Error Messages

Error messages have two parts: what happened, and what to do. Both
are required. Neither is optional.

**What happened** uses passive construction in body copy.
**What to do** is a CTA or a plain instruction — direct, short.

**Prohibited phrases — hard enforcement:**
- *"Something went wrong"* — always replace with specific, contextual language
- *"due to a technical issue"* / *"due to a system issue"* — never use
- *"failed"* / *"failure"* — never use
- *"denied"* in permission errors — use neutral language instead
- *"Network not available"* — use *"Connection issue"* instead
- *"after some time"* — always replace with *"later"*
- Semicolons — never use in user-facing copy

**Replacement rules:**

| Situation | Wrong | Right |
|-----------|-------|-------|
| Modal or page-level load error | *"Something went wrong"* | *"The information couldn't be loaded. Try again."* |
| Recoverable system error | Any message without recovery | Must include *"Try again"* |
| Permission error | *"Access denied"* | State that the user doesn't have permission. Provide a resolution path — contact an administrator, request access. |
| Persistent connectivity | *"Network not available. Please try again later."* | *"Connection issue. If the issue continues, contact IT support."* |
| Password validation | *"Please enter your password again"* | *"Try again."* |
| Remaining attempts | *"2 attempts remaining"* | *"2 attempts left"* |

**Backend errors that cannot be recovered from** are always toasts —
never modals, never inline. They are system events, not user decisions.

**Error message placement guide:**

| Type | When | Format |
|------|------|--------|
| Inline | Field-level validation | One line beneath the field, no header |
| Card-level | A card's data failed to load | One line + CTA on the same line |
| Toast | Backend error, no recovery path | One line, no header, no CTA |
| Page-level | Entire surface failed to load | Header + body + *"Try again"* CTA |
| Modal | Destructive or consequential action requiring confirmation | Header + body + distinct CTAs |

**Technical audiences** — if the audience is explicitly technical
(data engineers, integration engineers) and the root cause is known
and safe to expose, state it specifically: *validation error*,
*schema mismatch*, *missing dependency*, *authentication error*.
Do not use *"due to a technical issue"* even for technical audiences
when the specific cause is known. Use *"information"* for general
audiences. Use *"data"* only for technical audiences.

**Infrastructure terms** — *server*, *backend*, *API*, *database* —
are permitted only for explicitly technical audiences.

---

## Empty States

Empty states are honest. They state what is empty and why. Nothing more.

```
✓  "No open care gaps for this patient."
✓  "No tasks due today."
✗  "Nothing to see here"
✗  "All caught up!"
✗  "No results found"
✗  "No data available"
```

A positive empty state — the coordinator's panel is clear — is a
clinical signal, not an error. Write it as one. *"No priority items
today"* means something. *"No results"* means nothing.

One honest line. One optional CTA if there is a clear next action.
No illustrations. No multi-paragraph explanations. No celebration.

---

## Tense and Form

**Labels:** imperative present tense
```
✓  "Acknowledge"   ✗  "Acknowledging"   ✗  "Click to acknowledge"
```

**Confirmations:** past tense
```
✓  "Alert acknowledged"   ✗  "Alert has been acknowledged"
```

**Status copy:** noun or adjective, never verb
```
✓  "Overdue"   ✗  "This task is overdue"
```

**Error headers:** *"Unable to …"* construction is permitted only in
headers and titles. In body copy, use passive construction instead.
```
✓  Header:  "Unable to load patient record"
✓  Body:    "The patient record couldn't be loaded."
✗  Body:    "Unable to load the patient record."
```

---

## Dates and Numbers

**Dates in display context:** MMM D, YYYY
```
✓  "Jan 5, 2025"   ✗  "01/05/2025"   ✗  "January 5th, 2025"
```

**Relative dates:** use when less than 7 days, absolute after
```
✓  "2 days ago"   ✓  "Yesterday"   ✓  "Jan 3, 2025" (if older)
```

**SLA and due dates:** always show the date, add urgency signal if needed
```
✓  "Due Jan 5 · Overdue"   ✗  "Overdue" alone
```

**Clinical quantities:** always numerals
```
✓  "3 patients"   ✗  "three patients"
```

---

## Entity References

Always use canonical names from `ontology/entities.yaml`. Exact
capitalization. No synonyms in UI copy.

```
✓  "Patient"     ✗  "member" / "beneficiary" / "individual"
✓  "Care Gap"    ✗  "gap" / "care gap" / "HEDIS gap"
✓  "Task"        ✗  "to-do" / "action item" / "work item"
✓  "Alert"       ✗  "notification" / "flag" / "warning"
✓  "Provider"    ✗  "doctor" / "physician" (in labels)
```

*"Clinician"* is acceptable in conversational contexts — Claude
interface, in-sentence references — when referring to the user.
In labels and UI chrome, use *"Provider"*.

---

## Template and Surface-Specific Errors

When an error relates to a specific surface or entity type, the
error message names it. Generic fallbacks are not acceptable.

```
✓  "The selected template couldn't be loaded. Try again."
✗  "Page not available."
✗  "Something went wrong loading this page."
```

The copy follows the entity. If it's a template error, the message
is about the template. If it's a care gap error, the message names
the care gap. The system knows what it was trying to do — the copy
should reflect that.

---

## What We Never Do

- Use *"we"* or any first-person construction in user-facing strings
- Write *"Something went wrong"* — ever
- Write *"Are you sure?"* in a confirmation dialog
- Use *"Cancel"* as the secondary button on modals — use *"Close"*
- Use *"Forgot password?"* — use *"Reset password"*
- Append *"to continue"* after a CTA
- Use semicolons in user-facing copy
- Use *"failed"* or *"failure"* — describe the outcome instead
- Use *"denied"* in permission errors
- Use *"remaining"* for attempts — use *"left"*
- Use *"after some time"* — use *"later"*
- Use *"due to a technical issue"* or *"due to a system issue"*
- Use infrastructure terms (*server*, *API*, *backend*) for non-technical audiences
- Celebrate completed workflows — the result is the reward

---

## The Pre-Output Copy Checklist

Before any string reaches the interface, scan for violations in
this order. If any item fails, rewrite before shipping.

1. First-person forms — *we*, *our*, *I* — present anywhere?
2. *"Something went wrong"* present?
3. *"due to a system issue"* or *"due to a technical issue"* present?
4. *"denied"* in a permission error?
5. *"to continue"* appended after a CTA?
6. *"Unable to …"* used in body copy (not a header)?
7. Passive construction used in body copy for system outcomes?
8. Infrastructure terms used for a non-technical audience?
9. *"after some time"* present — replace with *"later"*?
10. *"Try again"* included for recoverable system-loading errors?
11. For technical audiences — is a specific cause stated instead of a generic system error?

All eleven pass → ship it. Any fail → fix it first.

---

## The Test

Two questions. Both must pass.

> **1. Does this copy tell the user what happened and what to do?**
> Not everything — just enough to act with confidence. If they have
> to guess at either, the copy isn't done.

> **2. Could this string sit next to any other string in the product
> and sound like the same voice?**
> Same register, same restraint, same respect for the user's time.
> If it sounds like a different product wrote it, it's not ready.

> **Both yes** → Ship it.
> **Either no** → Identify which — clarity or coherence — and fix that.

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

24. Import blocks from @innovaccer/ui-assets using the exact tier path (block-primitives, block-composites, surfaces). Never import from shadcn (@/components/ui/), local paths, or relative paths when a genome block exists. Never reimplement a block inline. If a block needs changes that alter its structure, register a candidate pattern via report_pattern.

25. Only build composite blocks or surfaces using the primitive blocks. Never modify existing primitives. Do not create new primitives unless the functionality is completely different from what is supported by existing primitives, regardless of domain or semantics.

---

## Safety — severity schema

```yaml
# No agent — including the Design Mind — can propose mutations to this file.
# Changes require explicit approval from design leadership + a human commit.
# Severity schema — machine-readable
# Single source of truth for severity rendering across all surfaces.
# Updated to use design tokens from theme.css.
# Referenced by: AlertBanner/meta.yaml, Badge/meta.yaml,
# runtime generation layer, conversational layer.

# IMPORTANT NAMING NOTE:
# The CSS token --alert is Orange and maps to HIGH clinical severity.
# It does NOT mean "any clinical alert" — that is an entity in ontology/entities.yaml.
# The CSS token --destructive is Red and maps to CRITICAL clinical severity.
# --destructive serves both "destructive UI actions" AND "Critical severity" — same color, two contexts.

severity_levels:
  critical:
    token: "--destructive"
    token_light: "--destructive-light"               # #FFF2F0
    hex_reference: "#D62400"                         # Red — WCAG AA on white
    tailwind_equivalent: "text-destructive"
    bg_class: "bg-[var(--destructive-light)]"
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
    token: "--alert"                                  # Orange — NOT the same as the Alert entity
    token_light: "--alert-light"                     # #FFF3E6
    hex_reference: "#944A00"                         # --alert-text — WCAG AA accessible foreground
    tailwind_equivalent: "text-alert-text"
    bg_class: "bg-[var(--alert-light)]"
    text_class: "text-alert-text"
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
    token_light: "--warning-light"                   # #FFF8E6
    hex_reference: "#5C4403"                         # --warning-text — WCAG AA accessible foreground
    tailwind_equivalent: "text-warning-text"
    bg_class: "bg-[var(--warning-light)]"
    text_class: "text-warning-text"
    border_class: "border-warning/30"
    solid_class: "bg-warning text-warning-foreground"
    icon: "alert-circle"
    permitted_actions: [acknowledge, escalate, dismiss]
    requires_acknowledgment: false
    audit_required: true
    sla_hours: 24

  low:
    token: "--accent"
    token_light: "--accent"                          # #E8F1FD — accent is already the light bg
    hex_reference: "#003374"                         # --accent-foreground — WCAG AA
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
      color_token: "--severity-critical"
      hex_reference: "#DC2626"   # red-600 — never change without SME approval
      badge_variant: "solid-red"
      requires_acknowledgment: true
      sla_hours: 1
      meaning: >
        Requires immediate clinical intervention. Patient safety at risk.
        Cannot be dismissed — only acknowledged with audit trail.

    high:
      canonical_name: "High"
      synonyms: ["elevated", "P2", "important", "significant"]
      color_token: "--severity-high"
      hex_reference: "#D97706"   # amber-600
      badge_variant: "solid-amber"
      requires_acknowledgment: true
      sla_hours: 4
      meaning: Requires action within 4 hours. Clinician review needed.

    medium:
      canonical_name: "Medium"
      synonyms: ["moderate", "P3", "informational", "standard"]
      color_token: "--severity-medium"
      hex_reference: "#CA8A04"   # yellow-600
      badge_variant: "subtle-yellow"
      requires_acknowledgment: false
      sla_hours: 24
      meaning: Requires attention within 24 hours. Can be triaged.

    low:
      canonical_name: "Low"
      synonyms: ["minor", "P4", "routine", "informational"]
      color_token: "--severity-low"
      hex_reference: "#2563EB"   # blue-600
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

55 ratified blocks:

- **Accordion**
- **ActionableRow**
- **Alert**
- **AlertBanner**
- **AlertDialog**
- **Avatar**
- **Badge**
- **Breadcrumb**
- **Button**
- **Calendar**
- **Card**
- **Carousel**
- **Chart**
- **Checkbox**
- **Collapsible**
- **Combobox**
- **Command**
- **ContextMenu**
- **DataTable**
- **DatePicker**
- **Dialog**
- **Drawer**
- **DropdownMenu**
- **EmptyState**
- **ErrorState**
- **Form**
- **HoverCard**
- **Input**
- **InputOTP**
- **Label**
- **MultiSelect**
- **NavigationMenu**
- **PageHeader**
- **Pagination**
- **Popover**
- **Progress**
- **RadioGroup**
- **Resizable**
- **ScrollArea**
- **SectionHeader**
- **Select**
- **Separator**
- **Sheet**
- **Skeleton**
- **Slider**
- **Sonner**
- **Spinner**
- **StatCard**
- **Stepper**
- **Switch**
- **Table**
- **Tabs**
- **Textarea**
- **Toolbar**
- **Tooltip**

---

### Accordion

#### meta.yaml
```yaml
id: Accordion
status: active
component_type: layout
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/Accordion"
structural_family: disclosure
family_invariants:
  - "border-b border-border dividers between items"
  - "py-4 vertical padding on each item"
  - "font-semibold trigger text"
confidence: 0.85
version: 1.0.0

summary: >
  Collapsible section container for progressive disclosure of grouped content.
  Wraps shadcn Accordion to present vertically stacked sections where only one
  is expanded at a time by default, reducing visual noise on dense surfaces.

when:
  - grouping related content that benefits from progressive disclosure
  - long-form content that overwhelms a surface when fully expanded
  - FAQ-style question-and-answer layouts

not_when:
  - only a single collapsible section needed (use Collapsible instead)
  - content must be visible at all times for comparison
  - nested within another Accordion (no nesting permitted)

variants:
  single: only one section open at a time (default)
  multiple: multiple sections may be open simultaneously

key_rules:
  - only one section open at a time by default (type="single")
  - chevron indicator rotates on open/close
  - no nested accordions

embedding_hint: >
  accordion collapsible section expand collapse disclosure
  faq progressive reveal toggle panel
```

---

### ActionableRow

#### meta.yaml
```yaml
id: ActionableRow
status: active
component_type: row
level: composite
npm_path: "@innovaccer/ui-assets/block-composites/ActionableRow"
structural_family: actionable-list-row
structural_role: "list-row"
confidence: 0.95
version: 1.0.0
introduced: refactor-v1
last_evolved: refactor-v1

summary: >
  The single actionable unit for any entity that appears in a list and needs
  a primary action, optional secondary actions, and status display. Covers
  any entity type that follows the "scan → act" workflow. Two layout variants
  share identical interaction invariants: row (border-l-2 accent stripe,
  border-b divider) and card (rounded-lg border, standalone shadow).

  Rule: use ActionableRow. Do NOT create a new pattern just because the entity
  domain changes. New pattern only when the STRUCTURE changes — different
  interaction model, different layout container, different slot arrangement.

when:
  - displaying any entity in a list where the user can take a primary action
  - worklist rows: tasks, protocols, assessments, items
  - any severity-grouped list where each item has a primary action (Acknowledge, Dismiss, Accept, or similar) — use ActionableRow regardless of the entity domain
  - variant="row" when rows live inside a shared container (bg-card rounded-lg border)
  - variant="card" when each row is a standalone card (its own border + shadow)

not_when:
  - summary counts or metrics → use StatCard
  - entity identity header → use EntityContextHeader
  - alert requiring immediate acknowledgment → use AlertBanner
  - read-only display with no actions (no primaryAction, no onExpand) — just use a plain div

variants:
  - id: row
    description: >
      Default. Used when rows share a container (bg-card rounded-lg border overflow-hidden).
      Has a colored left border stripe (accent prop) and a bottom border divider.
      last:border-0 removes the final divider automatically.
    invariants:
      - "flex items-start gap-3 px-4 py-3.5 border-b border-border/40 last:border-0 bg-card border-l-2 transition-colors hover:bg-muted/60"
      - "accent stripe: border-l-2 border-{warning|accent|success|border}"
    slots:
      - title (required)
      - label (optional monospace badge above title)
      - contextLabel (optional entity name when not in entity-scoped view)
      - status (optional Badge)
      - meta[] (icon + text pairs, up to ~3)
      - primaryAction (right-aligned button)
      - secondaryActions (MoreHorizontal dropdown)
      - onExpand (chevron that opens detail panel)

  - id: card
    description: >
      Used when each row is a standalone card. No shared container.
      Has its own border, rounded corners, and shadow.
    invariants:
      - "flex items-start justify-between gap-4 p-4 bg-card border border-border/60 rounded-lg shadow-sm hover:bg-accent/50 transition-colors"
    slots:
      - title (required)
      - label (optional monospace badge above title)
      - contextLabel (optional entity name)
      - status (optional Badge)
      - meta[] (icon + text pairs)
      - primaryAction (right-aligned button)
      - secondaryActions (MoreHorizontal dropdown)
      - onExpand (not typically used in card variant)

variation_rule: >
  Slots are free — fill them with any label, icon, domain text, or token.
  Slot content is NOT a new pattern. A new pattern is only warranted when
  the STRUCTURE changes: different container type, different interaction model
  (e.g., drag-and-drop, multi-select, inline edit), different slot arrangement,
  or a layout that cannot be expressed as row or card variant.

frozen:
  - "container: row variant uses shared bg-card container with divide-y; card variant uses standalone rounded-lg border — no other containers permitted"
  - "interaction: scan-and-act only — no drag-and-drop, no multi-select, no inline edit"
  - "slot positions: title always left, primary action always right, border-l-2 accent stripe always present on row variant"
  - "primary action: single Button, variant outline or default, h-7 text-sm — no other action control shapes"

free:
  - title: "any entity name or label"
  - status: "any StatusKey value"
  - meta: "any icon/text pairs up to ~3"
  - primaryAction: "any action verb appropriate to the domain"
  - accent: "warning | accent | success | none"
  - contextLabel: "any entity name for non-entity-scoped surfaces"
  - label: "any small badge above title (e.g. measure code)"

props:
  variant: '"row" | "card" — default "row"'
  title: "string — primary label (required)"
  titleMono: "boolean — renders title in monospace (for codes like PHQ-9)"
  label: "string — small badge above title (e.g. measure code HBD)"
  labelMono: "boolean — renders label in monospace"
  contextLabel: "string — entity name when outside entity-scoped view"
  status: "StatusKey — passed to Badge"
  accent: '"warning" | "accent" | "success" | "none" — row stripe color'
  meta: "MetaItem[] — [{icon?, text, urgent?, success?}]"
  primaryAction: "{ label: string; onClick: () => void }"
  secondaryActions: "SecondaryAction[] — rendered in MoreHorizontal dropdown"
  onExpand: "() => void — shows ChevronRight button"
  onRowClick: "() => void — makes full row clickable (e.g., open tab)"
  dimmed: "boolean — opacity-50, no actions, no hover"

embedding_hint: >
  actionable row card list worklist task protocol assessment
  complete assign exclude add note overdue status
  accent stripe variant row card entity action unit scan act workflow
  context label meta icon primary action secondary dropdown
  alert queue priority queue severity grouped item row clinical alert
  acknowledge dismiss escalate work item patient item escalated
  care manager today view priority list action surface
```

---

### Alert

#### meta.yaml
```yaml
id: Alert
status: active
component_type: feedback
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/Alert"
structural_family: feedback-banner
family_invariants:
  - "rounded-lg border"
  - "p-4 internal padding"
  - "gap-3 icon-to-text spacing"
confidence: 0.85
version: 1.0.0

summary: >
  Inline contextual message for non-critical feedback. Wraps shadcn Alert
  to present informational or warning-level messages within the page flow.
  Not intended for safety-critical alerts — use AlertBanner for those.

when:
  - displaying inline validation summaries or contextual tips
  - showing non-blocking informational or warning messages
  - providing contextual guidance within a form or section

not_when:
  - safety-critical or severity-based alerts (use AlertBanner)
  - transient notifications that should auto-dismiss (use Toast)
  - global page-level errors

variants:
  default: neutral informational message with border-border
  destructive: error or destructive message with border-destructive

key_rules:
  - not for safety-critical alerts (use AlertBanner)
  - icon and text always present together
  - never auto-dismiss — user must navigate away or resolve

embedding_hint: >
  alert inline message info warning feedback
  contextual notice tip guidance banner
```

---

### AlertBanner

#### meta.yaml
```yaml
id: AlertBanner
status: active
component_type: banner
level: composite
npm_path: "@innovaccer/ui-assets/block-composites/AlertBanner"
structural_family: severity-alert-banner
family_invariants:
  - "Severity token map: critical=destructive, high=alert, medium=warning, low=accent"
  - "Never hardcode colors — all visual decisions flow from the severity prop"
  - "Critical and High must render Acknowledge — never Dismiss on Critical"
  - "Always renders above page content — never inline or in sidebar"
  - "Stacking order: Critical first, High, Medium, Low"
confidence: 0.93
version: 1.0.0
introduced: seed-v0
last_evolved: seed-v0

summary: >
  A severity-driven alert banner for displaying alerts that require user
  attention or action. Severity is always visible. Permitted actions are
  determined by severity level. This component is the most safety-critical
  in the library.

when:
  - displaying any alert that requires user attention
  - interrupting a workflow with urgent or safety-critical information
  - system needs to communicate urgency with required action

not_when:
  - success confirmation → use Toast
  - passive informational message with no action → use InfoBanner
  - inline field validation error → use FormFieldError
  - displaying a list of historical alerts → use AlertHistoryRow

critical_rules:
  - severity prop drives ALL visual and behavioral decisions
  - never pass custom colors — they come from safety/severity-schema.yaml
  - Critical and High alerts MUST render an Acknowledge button
  - Critical alerts MUST NOT render a Dismiss button (safety constraint)
  - High alerts may render Dismiss only with reason selector
  - onAcknowledge callback is required for Critical and High severity
  - component fires audit event on every acknowledgment

layout:
  - always renders above page content, never in sidebar or inline
  - stacks vertically when multiple alerts are present
  - Critical alerts stack before High, High before Medium, Medium before Low

safety_refs:
  - safety/hard-constraints.md rules 1, 5, 6
  - safety/severity-schema.yaml

frozen:
  - "safety: safety/severity-schema.yaml — severity drives all color, never custom colors"
  - "safety: safety/hard-constraints.md#rule-5 — Critical cannot be dismissed, only Acknowledged"
  - "safety: safety/hard-constraints.md#rule-1 — Critical and High require onAcknowledge callback"
  - "position: always above page content — never inline, never in sidebar"
  - "stacking: Critical first, then High, Medium, Low"

free:
  - title: "any alert title string"
  - body: "any supporting detail"
  - contextLabel: "entity name if alert is entity-scoped"
  - triggeredAt: "any formatted timestamp"
  - onEscalate: "present or absent depending on workflow"

usage_signal:
  renders_total: 0
  products: []
  override_rate: 0.0

embedding_hint: >
  alert banner interrupt workflow severity urgent safety
  acknowledge escalate dismiss critical high medium low
  warning notification required action audit trail
```

---

### AlertDialog

#### meta.yaml
```yaml
id: AlertDialog
status: active
component_type: overlay
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/AlertDialog"
structural_family: confirmation-dialog
family_invariants:
  - "rounded-lg shadow-lg container"
  - "z-40 dialog layer, z-30 backdrop overlay"
  - "Cancel action always present"
confidence: 0.85
version: 1.0.0

summary: >
  Modal confirmation dialog for destructive or irreversible actions. Wraps
  shadcn AlertDialog with enforced copy rules — header states consequence,
  action label matches consequence, and cancel is always available.

when:
  - confirming a destructive action like delete or remove
  - irreversible operations requiring explicit user acknowledgment
  - high-stakes state changes that cannot be undone

not_when:
  - non-destructive confirmations (use a standard Dialog)
  - informational messages (use Alert or Toast)
  - inline confirmation patterns (use inline confirm button)

variants:
  destructive: red action button for delete/remove operations
  default: primary action button for non-delete irreversible actions

key_rules:
  - cancel action always present
  - header states the consequence, never "Are you sure?" (rule 16)
  - action label matches the consequence described in header (rule 16)
  - secondary button says "Close" not "Cancel" (rule 17)

embedding_hint: >
  alert dialog confirm confirmation destructive delete
  remove irreversible modal overlay acknowledge
```

---

### Avatar

#### meta.yaml
```yaml
id: Avatar
status: active
component_type: data-display
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/Avatar"
structural_family: identity-indicator
family_invariants:
  - "rounded-full always"
  - "bg-muted fallback background"
  - "text-muted-foreground fallback text color"
confidence: 0.85
version: 1.0.0

summary: >
  Circular identity indicator displaying a user image or initials fallback.
  Wraps shadcn Avatar with deterministic fallback colors derived from the
  display name, ensuring stable visual identity across sessions.

when:
  - displaying a user or entity identity alongside a name
  - list items, headers, or cards that reference a person
  - comment threads or activity feeds with attributed content

not_when:
  - decorative imagery unrelated to identity (use an img)
  - icon-only indicators without identity context
  - logo or brand marks

variants:
  sm: small size h-6 w-6 for compact rows
  md: medium size h-8 w-8 default for lists
  lg: large size h-10 w-10 for headers and profiles

key_rules:
  - always rounded-full regardless of size
  - stable fallback color derived from name (deterministic hash)
  - never decorative-only — must represent an identifiable entity

embedding_hint: >
  avatar user profile image initials fallback
  identity indicator person photo circle
```

---

### Badge

#### meta.yaml
```yaml
id: Badge
status: active
component_type: data-display
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/Badge"
structural_family: status-label
family_invariants:
  - "rounded-full pill shape"
  - "text-sm font-semibold"
  - "px-2.5 py-0.5 compact padding"
  - "inline-flex items-center"
confidence: 0.85
version: 2.0.0

summary: >
  Compact label for displaying status, category, or count information.
  Wraps shadcn Badge with enforced accessibility — color is never the
  sole differentiator; text label is always present.

when:
  - labeling status on a row or card (e.g., Active, Pending, Closed)
  - categorizing items with short tags
  - displaying small counts or metadata alongside content

not_when:
  - long-form descriptions (use a paragraph or tooltip)
  - interactive filters (use toggle buttons or chips)
  - severity indicators that require AlertBanner-level treatment

props:
  color:
    type: enum
    values: [blue, red, yellow, orange, green, grey]
    default: blue
    description: Semantic color of the badge
  # Style is always "subtle" (tinted background) — no longer configurable
  dot:
    type: boolean
    default: false
    description: Renders a small leading dot icon for additional visual emphasis

key_rules:
  - color never sole differentiator for meaning (rule 19)
  - always include a text label — no icon-only badges
  - max approximately 20 characters
  - badges are not interactive — no hover or pressed states

embedding_hint: >
  badge status label tag category count pill
  indicator chip metadata compact
```

---

### Breadcrumb

#### meta.yaml
```yaml
id: Breadcrumb
status: active
component_type: navigation
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/Breadcrumb"
structural_family: wayfinding
family_invariants:
  - "text-sm text-muted-foreground for inactive items"
  - "/ separator between levels"
  - "gap-1.5 between items"
  - "last item text-foreground (current page)"
confidence: 0.85
version: 1.0.0

summary: >
  Hierarchical location trail showing the user's position within a
  navigation structure. Wraps shadcn Breadcrumb with enforced max
  depth and ellipsis overflow for deep hierarchies.

when:
  - showing location within a multi-level navigation hierarchy
  - enabling quick traversal back to parent sections
  - surfaces deeper than two levels in the information architecture

not_when:
  - flat navigation with no hierarchy (use tabs or links)
  - step-based flows (use StepIndicator)
  - fewer than two navigation levels

variants:
  default: standard slash-separated trail
  collapsed: ellipsis for middle items when depth exceeds 4-5 levels

key_rules:
  - last item is current page and not a link
  - max 4-5 visible levels before collapsing middle items
  - use ellipsis for overflow in deep hierarchies

embedding_hint: >
  breadcrumb navigation hierarchy trail path
  wayfinding location crumb parent
```

---

### Button

#### meta.yaml
```yaml
id: Button
status: active
component_type: action
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/Button"
structural_family: action-trigger
family_invariants:
  - "rounded-md border radius"
  - "whitespace-nowrap label never wraps (rule 18)"
  - "focus-visible:ring-2 focus-visible:ring-offset-1 (rule 20)"
  - "font-normal (400 weight)"
  - "transition-[color,background-color,border-color,transform] duration-100"
confidence: 0.85
version: 3.0.0

summary: >
  Primary interactive trigger for user actions. Linear-inspired flat aesthetic
  with font-weight 400, no shadows, tight padding, and subtle scale-down on
  press. Supports six visual types (primary, destructive, basic, outline,
  transparent, link), three explicit heights (sm=24px, default=32px, lg=40px),
  four content layouts (text, text+left icon, text+right icon, icon-only),
  and five interactive states (default, hover, pressed, focused, disabled).
  Icon-only is not available for the link type.

when:
  - triggering a form submission, navigation, or state change
  - primary call-to-action on a surface (use primary type)
  - destructive actions like delete or remove (use destructive type)
  - secondary or tertiary actions (use basic, outline, or transparent)

not_when:
  - navigation that looks like a text link (use an anchor)
  - icon-only action without accessible label (add aria-label)

variants:
  primary: bg-primary, flat fill, single primary CTA per surface
  destructive: bg-destructive, flat fill, delete and remove actions only
  basic: bg-foreground/6%, subtle tinted fill for secondary actions
  outline: border-border, transparent bg — also used as a toggle (pair with aria-pressed and selected state)
  transparent: no background or border, inline or toolbar actions
  link: text-primary, underlined on hover, in-text navigational triggers

sizes:
  sm: h-6 (24px), px-1.5, text-xs — compact, dense UIs
  default: h-8 (32px), px-2.5, text-[13px] — standard usage
  lg: h-10 (40px), px-3.5, text-[15px] — prominent or hero CTAs

content_variants:
  text: label only
  left-icon: icon before label (leftIcon prop)
  right-icon: icon after label (rightIcon prop)
  icon-only: square icon button, no label (iconOnly prop; not for link type)

states:
  default: resting state, flat appearance
  hover: subtle background opacity shift (primary/90, foreground/4-10%)
  pressed: slightly darker bg + scale(0.97) on all types except link
  focused: focus-visible:ring-2 with per-variant ring color (primary/40 or destructive/40)
  disabled: opacity-50, pointer-events-none
  selected: outline variant with aria-pressed=true — use border-primary bg-accent text-accent-foreground to indicate the on state; this is the toggle pattern

key_rules:
  - only one primary CTA per surface (rule 14)
  - destructive type only for delete/remove actions
  - label never wraps (rule 18)
  - disabled state reduces opacity, not contrast
  - icon-only buttons must have aria-label for accessibility
  - focus ring uses primary/40 for all types except destructive which uses destructive/40
  - toggle pattern: use outline variant with aria-pressed; apply border-primary bg-accent text-accent-foreground when selected/on

embedding_hint: >
  button cta action trigger submit primary destructive basic
  outline transparent link click icon left right small large
  hover pressed focused disabled state flat linear scale
```

---

### Calendar

#### meta.yaml
```yaml
id: Calendar
status: active
component_type: data-display
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/Calendar"
structural_family: date-selector
family_invariants:
  - "rounded-md container"
  - "p-3 internal padding"
  - "text-sm date labels"
  - "today ring-accent indicator"
  - "selected bg-primary text-primary-foreground"
confidence: 0.85
version: 1.0.0

summary: >
  Month grid calendar for date selection and display. Wraps shadcn Calendar
  with enforced tabular-nums for alignment, muted outside-month dates, and
  keyboard navigation support.

when:
  - selecting a single date from a monthly grid
  - date range selection within a form
  - displaying a visual month view with selectable days

not_when:
  - picking date and time together (use DateTimePicker)
  - simple text-based date input (use a date input field)
  - scheduling across long ranges (use a timeline or gantt)

variants:
  single: select a single date (default)
  range: select a start and end date

key_rules:
  - tabular-nums for date number alignment
  - outside-month dates rendered muted
  - today always visually indicated
  - fully keyboard navigable

embedding_hint: >
  calendar date picker month grid day selector
  schedule appointment range selection
```

---

### Card

#### meta.yaml
```yaml
id: Card
status: active
component_type: layout
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/Card"
structural_family: content-container
family_invariants:
  - "rounded-lg border border-subtle bg-card"
  - "shadow-sm when on muted/tinted background, no shadow on white background"
confidence: 0.85
version: 1.1.0

summary: >
  Pure surface container. Accepts any blocks or text as children — no
  internal layout, padding, or content structure is imposed. Callers are
  responsible for padding and content organisation.

when:
  - grouping related content into a visually distinct surface
  - dashboard tiles or content panels
  - form sections that need visual separation

not_when:
  - nesting a Card inside another Card (no nested cards)
  - single-line items in a list (use a row component)
  - full-width page sections without visual boundaries

variants:
  flat: no shadow, border-driven — default for white-on-white layouts
  shadow-sm: raised card — for muted/tinted parent backgrounds
  shadow-md: expressive card — for onboarding/highlight flows
  interactive: clickable card with hover, active, focus, selected, and disabled states

key_rules:
  - elevation prop controls shadow — flat (default), sm (raised), md (expressive)
  - hover uses bg-foreground/5, active uses bg-foreground/10
  - selected state uses border-2 border-primary
  - disabled state uses opacity-50 pointer-events-none
  - no nested cards
  - never use shadow transitions for hover — background color shift only
  - content padding is the caller's responsibility

embedding_hint: >
  card container surface panel tile group
  content section box wrapper
```

---

### Carousel

#### meta.yaml
```yaml
id: Carousel
status: active
component_type: layout
level: composite
npm_path: "@innovaccer/ui-assets/block-composites/Carousel"
structural_family: content-carousel
family_invariants:
  - "Container: overflow-hidden relative"
  - "Prev/Next buttons: rounded-full h-8 w-8 border bg-background"
  - "Items: gap-4 between slides"
confidence: 0.80
version: 1.0.0

summary: >
  Scrollable content slider composing shadcn Carousel (Embla).
  Renders a horizontal sequence of cards or content panels with
  previous/next navigation and position indicators.

when:
  - displaying a horizontal sequence of related content cards
  - content set is too wide for a single viewport
  - image or card gallery with browsing interaction

not_when:
  - vertical scrolling list — use a standard list layout
  - tabs switching between views — use Tabs

key_rules:
  - dot indicators show current position within total slides
  - keyboard navigable with ArrowLeft/ArrowRight
  - drag/swipe support enabled by default
  - no auto-play by default to avoid disorientation
  - previous/next buttons meet 44px minimum touch target (rule 21)

embedding_hint: >
  carousel slider gallery scroll horizontal embla
  cards slides previous next swipe browse
```

---

### Chart

#### meta.yaml
```yaml
id: Chart
status: active
component_type: data-display
level: composite
npm_path: "@innovaccer/ui-assets/block-composites/Chart"
structural_family: chart-visualization
family_invariants:
  - "Container: rounded-lg border border-border/40 bg-card p-4 shadow-sm"
  - "Labels and axes: text-sm text-muted-foreground"
  - "Responsive: width 100% via ResponsiveContainer"
confidence: 0.80
version: 1.0.0

summary: >
  Data visualization container wrapping shadcn Chart (Recharts).
  Provides consistent card framing, semantic color palette, and
  accessible defaults for bar, line, area, and pie charts.

when:
  - displaying quantitative trends or comparisons
  - dashboard needs visual data representation
  - time-series or categorical data needs charting

not_when:
  - single numeric value — use StatCard
  - tabular data with many columns — use DataTable

key_rules:
  - use accent palette semantic tokens for series colors
  - tabular-nums on axis tick labels for alignment
  - always include a legend for multi-series charts
  - tooltip shown on hover with formatted values
  - no animation on severity/critical data visualizations
  - accessible color palette with shape or pattern differentiation (rule 19)

embedding_hint: >
  chart graph visualization bar line area pie recharts
  data trend series axis legend tooltip dashboard
```

---

### Checkbox

#### meta.yaml
```yaml
id: Checkbox
status: active
component_type: input
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/Checkbox"
structural_family: form-input
family_invariants:
  - "h-4 w-4 rounded-sm border border-subtle"
  - "checked bg-primary"
  - "focus-visible:ring-2"
confidence: 0.85
version: 1.0.0

summary: >
  Binary selection control for toggling a single option on or off.
  Wraps shadcn Checkbox with enforced touch targets, label pairing,
  and error state tokens. Supports indeterminate state for partial selections.

when:
  - toggling a boolean option in a form
  - selecting multiple items from a list
  - accepting terms or confirming a condition

not_when:
  - mutually exclusive options (use RadioGroup)
  - on/off toggle with immediate effect (use Switch)
  - complex multi-state selection

variants:
  default: unchecked state with border-subtle
  checked: filled bg-primary with check icon
  indeterminate: dash icon for partial group selection

key_rules:
  - 44px touch target on label+checkbox combined (rule 21)
  - always paired with a Label component
  - indeterminate state supported for group selections
  - error state uses border-destructive (rule 13)

embedding_hint: >
  checkbox check toggle select binary boolean
  form input tick mark option
```

---

### Collapsible

#### meta.yaml
```yaml
id: Collapsible
status: active
component_type: layout
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/Collapsible"
structural_family: disclosure
family_invariants:
  - "No visual border by default"
  - "Trigger is any element"
  - "Content animated open/close"
confidence: 0.85
version: 1.0.0

summary: >
  Single-section expand/collapse container. Wraps shadcn Collapsible for
  simple show/hide patterns where a full Accordion is unnecessary.
  Trigger can be any element; content animates between open and closed.

when:
  - a single section needs expand/collapse behavior
  - progressive disclosure of optional detail within a card or row
  - '"Show more" / "Show less" patterns'

not_when:
  - multiple collapsible sections in a group (use Accordion)
  - content that should always be visible
  - navigation menus (use dedicated nav components)

variants:
  default: no visible border, content animates on toggle

key_rules:
  - trigger element must be keyboard accessible
  - aria-expanded on trigger element
  - simpler than Accordion for single-section use cases

embedding_hint: >
  collapsible expand collapse toggle show hide
  disclosure section reveal content single
```

---

### Combobox

#### meta.yaml
```yaml
id: Combobox
status: active
component_type: action
level: composite
npm_path: "@innovaccer/ui-assets/block-composites/Combobox"
structural_family: searchable-select
family_invariants:
  - "Trigger: h-9 rounded-md border border-subtle px-3 text-sm"
  - "Popover: rounded-md shadow-md z-20 bg-card border border-border"
  - "Items: py-1.5 px-2 rounded-sm cursor-pointer"
confidence: 0.80
version: 1.0.0

summary: >
  Searchable dropdown select with type-ahead filtering. Combines a
  trigger button with a popover containing a filterable command list.
  Supports single selection with checkmark indicator.

when:
  - selecting from a list of >7 options that benefits from search
  - options are dynamic or loaded asynchronously
  - user needs type-ahead to find values quickly

not_when:
  - fewer than 5 static options — use a plain Select
  - multi-select with tags — use a dedicated MultiSelect

key_rules:
  - placeholder "Select..." shown in text-muted-foreground when empty
  - checkmark icon on the currently selected item
  - keyboard navigable via ArrowUp/ArrowDown/Enter
  - error state applies border-destructive to trigger (rule 13)
  - clear button visible when a value is selected

embedding_hint: >
  combobox searchable select dropdown filter typeahead
  popover command autocomplete pick choose
```

---

### Command

#### meta.yaml
```yaml
id: Command
status: active
component_type: action
level: composite
npm_path: "@innovaccer/ui-assets/block-composites/Command"
structural_family: command-palette
family_invariants:
  - "Container: rounded-lg shadow-lg z-40 border border-border bg-card"
  - "Input: h-10 border-b px-3 text-sm placeholder:text-muted-foreground"
  - "Item: py-2 px-3 rounded-md cursor-pointer"
confidence: 0.80
version: 1.0.0

summary: >
  Searchable command palette for quick action discovery and execution.
  Appears as a centered modal overlay triggered by keyboard shortcut.
  Groups actions under headings with instant type-ahead filtering.

when:
  - user needs to search and execute actions quickly
  - application has many navigable pages or executable commands
  - power-user keyboard-driven workflow is expected

not_when:
  - simple dropdown menu with <10 static items
  - form field selection — use Combobox instead

key_rules:
  - Cmd+K (or Ctrl+K) opens the palette
  - search input filters items instantly as user types
  - keyboard navigation with ArrowUp/ArrowDown/Enter
  - items grouped under headings via CommandGroup
  - empty state displays "No results found." in muted text

embedding_hint: >
  command palette action launcher search keyboard shortcut
  cmdk quick actions navigate execute filter
```

---

### ContextMenu

#### meta.yaml
```yaml
id: ContextMenu
status: active
component_type: overlay
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/ContextMenu"
structural_family: context-menu
family_invariants:
  - "rounded-md shadow-md z-20"
  - "bg-popover text-popover-foreground"
  - "py-1 item padding"
  - "min-w-[8rem]"
confidence: 0.85
version: 1.0.0

summary: >
  Right-click triggered floating menu for contextual actions on an element.
  Wraps shadcn ContextMenu with enforced keyboard navigation, destructive
  item styling, and the rule that context menu actions are never the sole
  access path to functionality.

when:
  - providing secondary actions on a row, card, or item via right-click
  - power-user shortcuts for common operations
  - supplementary actions that are also available through other UI paths

not_when:
  - the only way to access an action (must have alternative)
  - primary navigation (use a nav bar or sidebar)
  - mobile-first surfaces where right-click is unavailable

variants:
  default: standard context menu with grouped items

key_rules:
  - destructive items use text-destructive
  - separator between logical groups
  - fully keyboard navigable
  - never the only way to access an action

embedding_hint: >
  context menu right-click contextual actions
  secondary overlay popover dropdown
```

---

### DataTable

#### meta.yaml
```yaml
id: DataTable
status: active
component_type: data-display
level: composite
npm_path: "@innovaccer/ui-assets/block-composites/DataTable"
structural_family: data-table
structural_role: "list-container"
family_invariants:
  - "Container: w-full rounded-lg border border-border overflow-hidden"
  - "Header: sticky top-0 bg-muted/50 text-sm font-medium text-muted-foreground"
  - "Footer: border-t px-4 py-3 with pagination controls"
confidence: 0.80
version: 1.0.0

summary: >
  Full-featured data grid composing Table with sorting, filtering,
  and pagination. Renders tabular data with sticky headers, sortable
  columns, and row-level hover states.

when:
  - displaying structured tabular data with multiple columns
  - data requires sorting, filtering, or pagination
  - rows exceed a single viewport and need scroll or pagination

not_when:
  - simple key-value display — use KeyValueList
  - list of interactive rows with actions — use ActionableRow

key_rules:
  - tabular-nums for all numeric columns
  - sortable columns show ascending/descending indicator
  - virtual scroll recommended for >100 rows
  - row hover state hover:bg-muted/50
  - column alignment follows convention (text left, numbers right)

frozen:
  - "header: sticky top-0 bg-muted/50 — always visible during scroll, never removed"
  - "numeric columns: tabular-nums class required — alignment must not break between rows"
  - "row hover: hover:bg-muted/50 — always present, never overridden"
  - "column alignment: text-left for text columns, text-right for numeric columns"

free:
  - columns: "any column definitions with any field names, labels, and types"
  - data: "any row data shape"
  - pagination: "present or absent depending on data volume"
  - sort: "any sort handler per column, or none"

embedding_hint: >
  data table grid sort filter paginate columns rows
  tabular list records structured display
```

---

### DatePicker

#### meta.yaml
```yaml
id: DatePicker
status: active
component_type: action
level: composite
npm_path: "@innovaccer/ui-assets/block-composites/DatePicker"
structural_family: date-selector
family_invariants:
  - "Trigger: h-9 rounded-md border border-subtle px-3 text-sm"
  - "Calendar popover: rounded-md shadow-md bg-card border border-border"
  - "Calendar icon: left-aligned inside trigger"
confidence: 0.80
version: 1.0.0

summary: >
  Click-triggered date selection combining a trigger button with a
  popover calendar. Displays the selected date in the trigger using
  a monospaced format for consistent width.

when:
  - user needs to pick a single date from a calendar
  - date range selection is required
  - form field requires a structured date value

not_when:
  - free-text date entry with flexible formats — use a text input with mask
  - date-time picker needed — extend with time selector

key_rules:
  - selected date displayed in trigger with font-mono
  - placeholder "Pick a date" in text-muted-foreground when empty
  - calendar icon left-aligned in trigger for scannability
  - range mode supported via optional prop
  - keyboard navigable calendar cells

embedding_hint: >
  date picker calendar popover select day month year
  range schedule deadline due form input
```

---

### Dialog

#### meta.yaml
```yaml
id: Dialog
status: active
component_type: overlay
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/Dialog"
structural_family: modal-dialog
family_invariants:
  - "Container: rounded-lg shadow-lg z-40 bg-card max-w-lg"
  - "Backdrop: z-30 bg-background/80 backdrop-blur-sm"
  - "Close button always present in top-right corner"
  - "Focus trapped inside while open; ESC closes"
confidence: 0.85
version: 1.0.0

summary: >
  General-purpose modal dialog for presenting content, forms, or
  informational messages that require user attention. Overlays the
  page with a semi-transparent backdrop and centers the dialog.

when:
  - presenting a form that needs focused attention
  - confirming a destructive or irreversible action
  - displaying detailed information that interrupts the main flow

not_when:
  - content can live inline — use a collapsible section instead
  - mobile context where a Drawer (bottom sheet) is more natural
  - simple yes/no — consider AlertDialog instead

variants:
  default: standard dialog with title, description, and action buttons
  form: dialog containing a form with submit/cancel actions
  alert: confirmation dialog for destructive actions (single primary CTA)

key_rules:
  - close button always present (X icon top-right)
  - ESC key closes the dialog
  - focus is trapped inside the dialog while open
  - secondary button says "Close" not "Cancel" (rule 17)
  - max one primary CTA visible per dialog surface (rule 14)
  - CTA labels never wrap (whitespace-nowrap, rule 18)

embedding_hint: >
  dialog modal overlay popup form confirm alert
  lightbox backdrop focus-trap close escape
```

---

### Drawer

#### meta.yaml
```yaml
id: Drawer
status: active
component_type: overlay
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/Drawer"
structural_family: slide-panel
family_invariants:
  - "Container: rounded-t-lg bg-card z-40"
  - "Drag handle visible at top center: w-12 h-1.5 rounded-full bg-muted"
  - "Backdrop: z-30 bg-background/80"
  - "Snap points for partial-open states"
confidence: 0.85
version: 1.0.0

summary: >
  Bottom or side sliding panel for mobile-friendly content presentation.
  Supports drag-to-dismiss and snap points for partial-open states.
  Preferred over Dialog on small screens.

when:
  - mobile context needing an overlay for content or actions
  - multi-step flow on small screens (e.g. filters, settings)
  - content that benefits from drag-to-dismiss interaction

not_when:
  - desktop-only context — prefer Dialog or Sheet
  - simple confirmation — use AlertDialog
  - always-visible sidebar — use a layout panel

variants:
  bottom: slides up from bottom edge (default, mobile-first)
  side: slides in from left or right edge (tablet/desktop)

key_rules:
  - drag handle always visible at top center
  - drag-to-dismiss supported
  - snap points for partial open states
  - backdrop tap closes the drawer
  - prefer Sheet component on desktop breakpoints

embedding_hint: >
  drawer bottom sheet slide panel mobile overlay
  drag dismiss snap swipe action sheet
```

---

### DropdownMenu

#### meta.yaml
```yaml
id: DropdownMenu
status: active
component_type: overlay
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/DropdownMenu"
structural_family: context-menu
family_invariants:
  - "Container: rounded-md shadow-md z-20 bg-popover py-1 min-w-[8rem]"
  - "Items: px-3 py-2 text-base cursor-pointer"
  - "Destructive items: text-destructive"
  - "Separators between groups"
confidence: 0.85
version: 1.0.0

summary: >
  Click-triggered dropdown menu for secondary actions. Appears below
  or beside the trigger element and supports grouped items, icons,
  keyboard shortcuts, and destructive action styling.

when:
  - offering secondary actions on a row or card (e.g. edit, delete, share)
  - overflow menu for actions that do not fit in the primary toolbar
  - contextual actions triggered by a button or icon

not_when:
  - primary action path — use a visible button instead
  - navigation — use NavigationMenu
  - form selection — use Select or RadioGroup

variants:
  default: standard action list
  grouped: items organized with separators and group labels
  withIcons: each item prefixed with an icon for scannability

key_rules:
  - destructive items always use text-destructive (rule 13)
  - fully keyboard navigable (arrow keys, Enter, Escape)
  - group related items with separators
  - never used as the primary action path
  - 44px min touch target per item (rule 21)

embedding_hint: >
  dropdown menu context actions overflow more kebab
  ellipsis secondary options edit delete share
```

---

### EmptyState

#### meta.yaml
```yaml
id: EmptyState
status: active
component_type: feedback
level: composite
npm_path: "@innovaccer/ui-assets/block-composites/EmptyState"
structural_family: empty-feedback
family_invariants:
  - "Layout: flex flex-col items-center justify-center gap-3 py-12 text-center"
  - "Icon: text-muted-foreground, size 40px — never colored/branded"
  - "Heading: text-base font-medium text-foreground"
  - "Body: text-sm text-muted-foreground max-w-xs"
  - "CTA: single Button, variant default or outline — never more than one action"
confidence: 0.90
version: 1.0.0
introduced: 2026-03-29
last_evolved: 2026-03-29

summary: >
  Placeholder state for a list, table, or container with no data. Communicates
  why the space is empty and what the user can do next. Three variants: no-data
  (first-time, nothing exists yet), no-results (search/filter returned nothing),
  and no-access (permission-gated content). Always centered in the available
  space of the parent container.

when:
  - a list, table, or feed has zero items to display
  - a search or filter returns no results
  - a section is permission-gated and the user cannot view content
  - replacing a loading skeleton when data fetch succeeds with empty payload

not_when:
  - error state (network failure, API error) — use ErrorState
  - loading in progress — use Skeleton
  - partial data exists but more is loading — do not show EmptyState

variants:
  no-data: >
    First-time or genuinely empty. Icon reflects the content type.
    CTA prompts creation or onboarding action.
  no-results: >
    Search or filter returned nothing. Copy says "No results for X".
    CTA is "Clear filters" or "Try a different search".
  no-access: >
    User lacks permission. Icon is a lock. No CTA unless escalation path exists.

key_rules:
  - heading and body copy must be specific — never "No data found" or "Nothing here"
  - icon must semantically match the empty content type (e.g. clipboard for tasks, user for patients)
  - single CTA only — two actions creates decision paralysis in an already stuck state
  - no-results variant must name what was searched/filtered so user knows why

frozen:
  - "layout: always centered (flex flex-col items-center) — never left-aligned"
  - "icon color: always text-muted-foreground — never primary or destructive"
  - "max CTAs: one — never two actions"

free:
  - icon: "any icon appropriate to content type"
  - heading: "any specific empty-state heading"
  - body: "any supporting copy"
  - cta: "any single action label, or absent"
  - variant: "no-data | no-results | no-access"

embedding_hint: >
  empty state no data no results nothing found zero items
  placeholder blank list table search filter cleared
  first time create onboard permission no access lock
```

---

### ErrorState

#### meta.yaml
```yaml
id: ErrorState
status: active
component_type: feedback
level: composite
npm_path: "@innovaccer/ui-assets/block-composites/ErrorState"
structural_family: error-feedback
family_invariants:
  - "Layout: flex flex-col items-center justify-center gap-3 py-12 text-center"
  - "Icon: text-destructive, size 40px"
  - "Heading: text-base font-medium text-foreground"
  - "Body: text-sm text-muted-foreground max-w-xs"
  - "Primary CTA: retry action — Button variant default"
  - "Secondary CTA: optional escalation (e.g. Contact support) — Button variant outline"
confidence: 0.88
version: 1.0.0
introduced: 2026-03-29
last_evolved: 2026-03-29

summary: >
  Feedback state for a failed data load, API error, or unrecoverable component
  failure. Distinct from EmptyState — this communicates something went wrong,
  not that data is absent. Always offers a recovery path (retry) and optionally
  an escalation path (support, refresh page). Used inline within a card, panel,
  or full-page container depending on the scope of the failure.

when:
  - network request fails and data cannot be displayed
  - API returns a 5xx or unexpected error response
  - a component throws and an error boundary catches it
  - a resource is not found (404) and there is no fallback content

not_when:
  - data loaded successfully but is empty — use EmptyState
  - loading in progress — use Skeleton
  - validation error on a form field — use FormField error state
  - inline warning that does not block the full surface — use Alert

variants:
  network: "Request failed. Retry button. Optional: show error code."
  not-found: "Resource doesn't exist. No retry. Optional: back/home CTA."
  permission: "User lacks access. No retry. Escalation CTA optional."
  generic: "Something went wrong. Retry + support link."

key_rules:
  - always offer a retry action unless the error is definitively unrecoverable (not-found, permission)
  - do not expose raw error messages or stack traces to users
  - error code may be shown in small text for support reference — never as the primary message
  - heading must name what failed, not just say "Error"

frozen:
  - "icon color: always text-destructive — never muted or primary"
  - "layout: always centered — mirrors EmptyState for visual consistency"
  - "raw errors: never shown — user-facing copy only"

free:
  - icon: "any icon appropriate to error type"
  - heading: "specific failure description"
  - body: "optional supporting copy or error reference code"
  - retryAction: "any retry label, or absent for unrecoverable errors"
  - secondaryAction: "optional escalation — support link, back navigation"

embedding_hint: >
  error state failed load api error network retry something went wrong
  not found 404 500 permission denied unrecoverable fallback
  error boundary inline full page panel
```

---

### Form

#### meta.yaml
```yaml
id: Form
status: active
component_type: form-control
level: composite
npm_path: "@innovaccer/ui-assets/block-composites/Form"
structural_family: form-layout
family_invariants:
  - "Container: flex flex-col gap-4"
  - "Field: flex flex-col gap-2"
  - "Error: text-sm text-destructive (rule 13 — error token, not severity-critical)"
  - "Submit section: border-t pt-4 mt-4"
confidence: 0.80
version: 1.0.0

summary: >
  Form container with integrated validation powered by react-hook-form.
  Provides consistent field layout, error messaging, and submit section
  styling for any multi-field data entry surface.

when:
  - multi-field data entry requiring validation
  - structured form with consistent error display
  - form submission with dirty-state tracking

not_when:
  - single inline input — use a standalone Input
  - settings toggles list — use a switch group

key_rules:
  - error messages rendered below the field using text-destructive (rule 13)
  - warn before navigating away with unsaved changes (rule 12)
  - submit button disabled until form is valid
  - single primary submit CTA per form (rule 14)

embedding_hint: >
  form validation fields input submit react-hook-form
  error state dirty unsaved changes entry
```

---

### HoverCard

#### meta.yaml
```yaml
id: HoverCard
status: active
component_type: overlay
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/HoverCard"
structural_family: hover-preview
family_invariants:
  - "Container: rounded-lg shadow-md z-20 bg-card border border-border p-4 max-w-[320px]"
  - "Open delay: 200ms; close delay: 100ms"
  - "Must be keyboard-accessible via focus"
confidence: 0.85
version: 1.0.0

summary: >
  Hover-triggered content preview card that appears when the user
  hovers over or focuses a trigger element. Provides supplementary
  context without navigating away from the current view.

when:
  - previewing a linked entity (user profile, resource summary)
  - showing supplementary info on hover without navigation
  - augmenting a text link or avatar with richer context

not_when:
  - content is critical — hover is not accessible on touch devices
  - interactive content inside the preview — use Popover instead
  - mobile-first context — hover is unavailable

variants:
  default: simple text preview with optional avatar
  rich: preview with image, title, description, and metadata

key_rules:
  - never used for critical information (hover unavailable on touch)
  - open delay 200ms to avoid accidental triggers
  - close delay 100ms to allow cursor re-entry
  - keyboard accessible via focus on the trigger element
  - color never sole differentiator for meaning (rule 19)

embedding_hint: >
  hover card preview tooltip popover entity
  profile summary link context peek
```

---

### Input

#### meta.yaml
```yaml
id: Input
status: active
component_type: input
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/Input"
structural_family: form-input
family_invariants:
  - "Container: h-9 rounded-md border border-subtle bg-card px-3 text-base"
  - "Focus: focus-visible:ring-2 ring-ring"
  - "Error state: border-destructive (rule 13)"
  - "Disabled: opacity-50 cursor-not-allowed"
confidence: 0.85
version: 1.0.0

summary: >
  Standard single-line text input field for forms. Supports error,
  disabled, and placeholder states. Always paired with a Label
  component for accessibility.

when:
  - collecting single-line text input (name, email, search)
  - form field requiring free-text entry
  - inline editable value

not_when:
  - multi-line text — use Textarea
  - constrained choices — use Select or RadioGroup
  - code or OTP entry — use InputOTP

variants:
  default: standard text input
  withIcon: input with a leading or trailing icon
  error: input in error state with border-destructive

key_rules:
  - error state uses border-destructive, NOT severity-critical (rule 13)
  - disabled state uses opacity-50
  - placeholder text uses text-muted-foreground
  - always paired with a Label (htmlFor association)
  - focus-visible ring never suppressed (rule 20)

embedding_hint: >
  input text field form entry search name email
  password placeholder disabled error validation
```

---

### InputOTP

#### meta.yaml
```yaml
id: InputOTP
status: active
component_type: input
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/InputOTP"
structural_family: form-input
family_invariants:
  - "Slots: gap-2 between slots"
  - "Each slot: h-10 w-10 rounded-md border border-subtle text-center font-mono"
  - "Min slot size: 44px (rule 21)"
  - "Focus: focus-visible:ring-2 ring-ring"
confidence: 0.85
version: 1.0.0

summary: >
  One-time password or verification code input composed of individual
  character slots. Auto-advances focus on input and supports paste.
  Uses monospace font for code display.

when:
  - entering a verification code (OTP, 2FA)
  - PIN or short numeric code input
  - any fixed-length code entry requiring per-character slots

not_when:
  - free-text input — use Input
  - long codes or tokens — use a standard text input
  - password entry — use Input with type="password"

variants:
  default: 6-digit OTP with individual slots
  grouped: slots visually grouped (e.g. 3-3 with a separator)

key_rules:
  - auto-focus next slot on character input
  - paste support for full code
  - font-mono for code display
  - each slot meets 44px minimum touch target (rule 21)
  - error state uses border-destructive (rule 13)
  - focus-visible ring never suppressed (rule 20)

embedding_hint: >
  otp input code verification pin 2fa mfa
  one-time password slot digit token
```

---

### Label

#### meta.yaml
```yaml
id: Label
status: active
component_type: form-control
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/Label"
structural_family: form-label
family_invariants:
  - "Typography: text-base font-semibold leading-none"
  - "Disabled peer: peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"
  - "Error state: text-destructive (rule 13)"
confidence: 0.85
version: 1.0.0

summary: >
  Form field label associated with an input element via htmlFor.
  Supports required indicator and error state styling.
  Always used alongside Input, Select, or other form controls.

when:
  - labelling any form input, select, textarea, or radio group
  - required field indicator needed
  - error message association with a form field

not_when:
  - decorative heading — use a heading element
  - inline helper text — use a description or hint span
  - standalone text — use a paragraph

variants:
  default: standard label text
  required: label with required indicator (asterisk)
  error: label in error state with text-destructive

key_rules:
  - always use htmlFor to associate with the input element
  - required indicator is optional (asterisk or "(required)" text)
  - error state uses text-destructive (rule 13, NOT severity-critical)
  - color never sole differentiator (rule 19) — pair with icon or text

embedding_hint: >
  label form field input association htmlFor
  required asterisk error accessible name
```

---

### MultiSelect

#### meta.yaml
```yaml
id: MultiSelect
status: active
component_type: input
level: composite
npm_path: "@innovaccer/ui-assets/block-composites/MultiSelect"
structural_family: multi-value-input
family_invariants:
  - "Selected values render as dismissible chips inside the input — never comma-separated text"
  - "Chips: rounded-md bg-accent text-accent-foreground text-xs h-5 — same as Badge but with dismiss X"
  - "Dropdown: same visual treatment as Select/Combobox dropdown"
  - "Search input inside trigger: always present when options > 7"
  - "Placeholder shown only when zero items selected"
  - "Max visible chips before overflow: 3 chips then '+N more' badge"
confidence: 0.87
version: 1.0.0
introduced: 2026-03-29
last_evolved: 2026-03-29

summary: >
  Input that allows selecting multiple values from a list, displaying each
  selected value as a dismissible chip inside the trigger. Combines the
  dropdown behavior of Select with the multi-value chip display of TagInput.
  Supports optional search/filter within the dropdown for large option sets.
  Use when the user needs to select 2+ values from a defined option set.

when:
  - selecting multiple values from a predefined list (e.g. care team members, tags, categories)
  - filtering by multiple values simultaneously
  - form field where 1–N selections from a bounded option set are valid
  - replacing a group of checkboxes when option count exceeds ~5

not_when:
  - single selection only — use Select or Combobox
  - free-form text tags with no predefined options — use TagInput
  - fewer than 3 options — use CheckboxGroup instead (all visible, no dropdown overhead)
  - options are mutually exclusive (only one valid) — use RadioGroup or Select

key_rules:
  - selected chips always dismissible via X button — never require reopening dropdown to deselect
  - search within dropdown shown when options > 7
  - "Select all" option shown at top of dropdown when selectAll prop is true
  - keyboard: Enter selects focused option, Backspace removes last chip when input is empty
  - never use MultiSelect for more than ~50 options — use a server-search Combobox instead

frozen:
  - "chip shape: rounded-md bg-accent — never pill (rounded-full) to visually distinguish from Badge/status chips"
  - "chips inside trigger: always — never comma text"
  - "overflow: always '+N more' badge after 3 visible chips — never wrap to new lines in trigger"

free:
  - options: "any array of { label, value } objects"
  - placeholder: "any placeholder string"
  - searchPlaceholder: "any search input placeholder"
  - selectAll: "boolean — show Select All option"
  - maxVisible: "number of chips before overflow badge (default 3)"

embedding_hint: >
  multi select multiple values chips tags dropdown filter
  select many checkboxes group form field search within
  dismiss remove selected values bounded options list
```

---

### NavigationMenu

#### meta.yaml
```yaml
id: NavigationMenu
status: active
component_type: navigation
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/NavigationMenu"
structural_family: wayfinding
family_invariants:
  - "Layout: flex items-center gap-1"
  - "Trigger: text-base font-semibold"
  - "Active indicator: underline or accent on active item"
  - "Max 5-7 top-level items"
confidence: 0.85
version: 1.0.0

summary: >
  Top-level site or application navigation bar with support for
  dropdown sub-menus. Provides primary wayfinding across major
  sections of the application.

when:
  - primary app-level navigation between major sections
  - top-level horizontal nav bar with optional dropdowns
  - persistent navigation visible across all pages

not_when:
  - secondary actions — use DropdownMenu
  - tab-style switching within a page — use Tabs
  - sidebar navigation — use a vertical nav list

variants:
  default: horizontal nav with text links
  withDropdowns: nav items that expand into dropdown panels

key_rules:
  - max 5-7 top-level items for scannability
  - active item must be visually distinct (not color-only, rule 19)
  - dropdown sub-items for secondary navigation
  - fully keyboard navigable (arrow keys, Enter, Escape)
  - focus-visible ring never suppressed (rule 20)

embedding_hint: >
  navigation menu nav bar top header links
  wayfinding primary sections tabs horizontal
```

---

### PageHeader

#### meta.yaml
```yaml
id: PageHeader
status: active
component_type: header
level: composite
npm_path: "@innovaccer/ui-assets/block-composites/PageHeader"
structural_family: page-header
family_invariants:
  - "Layout: flex items-start justify-between gap-4 px-6 py-4 border-b border-border bg-background"
  - "Title: text-xl font-semibold text-foreground — never truncated"
  - "Subtitle: text-sm text-muted-foreground mt-0.5 — one line max"
  - "Breadcrumb: always above title when present — never beside it"
  - "Actions slot: flex items-center gap-2 — right-aligned, shrinks on narrow viewports"
  - "Always the topmost element of a page or full-surface view"
confidence: 0.90
version: 1.0.0
introduced: 2026-03-29
last_evolved: 2026-03-29

summary: >
  Page-level header anchored to the top of a full-page or full-surface view.
  Communicates where the user is (title + optional breadcrumb) and exposes
  page-level actions (export, settings, create, etc.) in a right-aligned slot.
  Generic — not scoped to any entity type. Three compositional slots: left
  (breadcrumb + title + subtitle), right (actions), and optionally a bottom
  slot for tabs or a FilterBar that lives below the title row.

when:
  - top of any full-page view (dashboard, list page, settings, reports)
  - page has a clear title and optional page-level actions
  - breadcrumb context is needed to orient the user in a navigation hierarchy
  - page-level tabs sit directly below the title row

not_when:
  - section within a page — use SectionHeader
  - entity-scoped surface where the identity of the subject must always be visible (patient, member) — use a dedicated entity header pattern
  - modal or drawer header — Dialog and Drawer have their own header conventions
  - inside a Card — use Card's own header slot

slots:
  breadcrumb: "Optional Breadcrumb above the title. Use when the page is more than one level deep."
  title: "Required. Page name — noun or noun phrase."
  subtitle: "Optional. One-line supporting description or context."
  actions: "Optional. Right-aligned Toolbar or 1–3 Buttons. Primary CTA rightmost."
  bottom: "Optional. Tabs or FilterBar anchored directly below the title row — shares the border-b."

key_rules:
  - title is always a noun phrase, never a verb ("Patient List" not "View Patients")
  - actions slot supports at most one primary Button — all others outline or transparent
  - breadcrumb is omitted on top-level pages (no parent to navigate to)
  - bottom slot (Tabs) replaces the border-b — they share the edge, never stack two borders
  - subtitle should add context, not restate the title

frozen:
  - "position: always topmost element of the page — never mid-page"
  - "title: always text-xl font-semibold — never truncated, never smaller"
  - "layout: title always left, actions always right — never reversed"

free:
  - title: "any page name"
  - subtitle: "any supporting string, or absent"
  - breadcrumb: "any Breadcrumb, or absent"
  - actions: "any combination of Buttons or Toolbar, or absent"
  - bottomSlot: "Tabs | FilterBar | absent"

embedding_hint: >
  page header title breadcrumb actions top of page export settings
  create new primary action page level heading full page view
  navigation hierarchy tabs filter bar below title
```

---

### Pagination

#### meta.yaml
```yaml
id: Pagination
status: active
component_type: navigation
level: composite
npm_path: "@innovaccer/ui-assets/block-composites/Pagination"
structural_family: page-navigation
structural_role: "page-navigation"
family_invariants:
  - "Container: flex items-center gap-1"
  - "Item: h-9 w-9 rounded-md text-sm"
  - "Active: bg-primary text-primary-foreground font-medium"
confidence: 0.80
version: 1.0.0

summary: >
  Page-level navigation for paged data sets. Renders numbered page
  links with first/last access, ellipsis gaps, and previous/next
  controls. Designed for use alongside DataTable or any paged list.

when:
  - data set is split across multiple pages
  - user needs direct access to specific page numbers
  - complement to DataTable or paged list views

not_when:
  - fewer than 10 total items — show all inline (density rule)
  - infinite scroll pattern is preferred
  - simple prev/next without page numbers — use inline buttons

key_rules:
  - always show first and last page numbers
  - ellipsis for non-adjacent page gaps
  - current page rendered as non-interactive active state
  - all interactive items meet 44px touch target (rule 21)
  - never paginate fewer than 10 items

embedding_hint: >
  pagination pages navigate previous next first last
  ellipsis numbered paging data table footer
```

---

### Popover

#### meta.yaml
```yaml
id: Popover
status: active
component_type: overlay
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/Popover"
structural_family: overlay-panel
family_invariants:
  - "Container: rounded-md shadow-md z-20 bg-popover border border-border p-4"
  - "Positioned relative to trigger element"
  - "ESC closes; focus trapped when open"
  - "Click outside closes"
confidence: 0.85
version: 1.0.0

summary: >
  Click-triggered floating panel for rich interactive content such as
  mini-forms, filters, or configuration panels. Positioned relative
  to its trigger element with focus management.

when:
  - inline editing or configuration panel triggered by a button
  - filter or search refinement panel
  - rich content that needs focus trapping but not a full modal

not_when:
  - simple text preview — use HoverCard or Tooltip
  - action list — use DropdownMenu
  - full-page interruption — use Dialog

variants:
  default: standard floating panel with arbitrary content
  form: panel containing a compact form with submit action

key_rules:
  - positioned relative to trigger element
  - ESC closes the popover
  - focus trapped inside when open
  - click outside closes
  - focus-visible ring never suppressed (rule 20)

embedding_hint: >
  popover floating panel overlay click trigger
  filter settings form inline configuration
```

---

### Progress

#### meta.yaml
```yaml
id: Progress
status: active
component_type: feedback
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/Progress"
structural_family: progress-indicator
family_invariants:
  - "Track: h-2 rounded-full bg-muted"
  - "Indicator: bg-primary rounded-full"
  - "Always includes aria-valuenow, aria-valuemin, aria-valuemax"
confidence: 0.85
version: 1.0.0

summary: >
  Visual progress bar indicating determinate completion percentage.
  Renders a horizontal track with a filled indicator. Supports
  optional percentage label with tabular-nums formatting.

when:
  - showing completion progress of a task or process
  - file upload or download progress
  - step completion indicator (e.g. profile completeness)

not_when:
  - indeterminate loading — use a spinner or skeleton
  - step-by-step wizard — use StepIndicator
  - real-time streaming — use a spinner

variants:
  default: standard progress bar with primary fill
  labeled: progress bar with percentage label (tabular-nums)

key_rules:
  - always include aria-valuenow, aria-valuemax, aria-valuemin
  - use for determinate progress only (known percentage)
  - no animation on severity changes (instant update)
  - percentage labels use tabular-nums for stable alignment
  - color never sole differentiator (rule 19) — pair with label

embedding_hint: >
  progress bar indicator completion percentage
  upload download loading determinate fill track
```

---

### RadioGroup

#### meta.yaml
```yaml
id: RadioGroup
status: active
component_type: input
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/RadioGroup"
structural_family: form-input
family_invariants:
  - "Layout: flex flex-col gap-3"
  - "Each radio: h-4 w-4 rounded-full border border-subtle"
  - "Checked: border-primary fill-primary"
  - "Touch target: 44px min on label+radio combined (rule 21)"
confidence: 0.85
version: 1.0.0

summary: >
  Exclusive single-choice selection from a group of options.
  Each option is a radio button paired with a label. Always
  contains at least two options.

when:
  - selecting exactly one option from a small set (2-6 items)
  - the user needs to see all options at once
  - form field requiring mutually exclusive choice

not_when:
  - many options (7+) — use Select
  - multiple selections allowed — use Checkbox group
  - binary toggle — use Switch

variants:
  default: vertical stack of radio options
  horizontal: inline row of radio options
  withDescription: each option includes a description below the label

key_rules:
  - 44px combined touch target on label+radio (rule 21)
  - always paired with Labels (htmlFor association)
  - always in a group of 2 or more options
  - error state uses border-destructive (rule 13)
  - focus-visible ring never suppressed (rule 20)
  - color never sole differentiator (rule 19) — fill + border change

embedding_hint: >
  radio group button option select choice exclusive
  single form toggle pick one option list
```

---

### Resizable

#### meta.yaml
```yaml
id: Resizable
status: active
component_type: layout
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/Resizable"
structural_family: resizable-layout
family_invariants:
  - "Layout: flex h-full"
  - "Handle: w-1 bg-border hover:bg-primary/50 cursor-col-resize"
  - "Min/max size constraints enforced on each panel"
confidence: 0.85
version: 1.0.0

summary: >
  Resizable split-pane layout that allows users to drag a handle
  to adjust the relative sizes of adjacent panels. Supports
  horizontal and vertical orientations.

when:
  - side-by-side panels where the user needs to control width ratio
  - IDE-style layouts with resizable sidebar and content area
  - split view for comparison or detail panels

not_when:
  - fixed layout — use CSS grid or flexbox
  - collapsible sidebar — use a toggle-based layout
  - mobile context — panels should stack vertically

variants:
  horizontal: left-right split (default)
  vertical: top-bottom split

key_rules:
  - min/max size constraints on each panel
  - handle visible on hover (bg-primary/50)
  - keyboard resizable (arrow keys adjust panel sizes)
  - persist sizes across sessions when possible
  - focus-visible ring on handle never suppressed (rule 20)

embedding_hint: >
  resizable split pane panel layout drag handle
  sidebar content resize divider adjustable width
```

---

### ScrollArea

#### meta.yaml
```yaml
id: ScrollArea
status: active
component_type: layout
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/ScrollArea"
structural_family: scroll-container
family_invariants:
  - "Container: overflow-hidden"
  - "Scrollbar: w-2.5 rounded-full bg-border"
  - "Thumb: bg-muted-foreground/30 rounded-full"
  - "Native scrolling behavior preserved"
confidence: 0.85
version: 1.0.0

summary: >
  Custom scrollbar container that wraps overflowing content with
  styled scrollbars. Preserves native scrolling behavior while
  providing a consistent visual appearance.

when:
  - content area that may overflow and needs custom scrollbar styling
  - lists, panels, or code blocks with bounded height
  - side panels or drawers with scrollable content

not_when:
  - page-level scrolling — use native body scroll
  - horizontal-only scrolling of a small set — use CSS overflow-x
  - content fits without scrolling

variants:
  vertical: vertical scrollbar only (default)
  horizontal: horizontal scrollbar only
  both: both vertical and horizontal scrollbars

key_rules:
  - native scrolling behavior preserved
  - scrollbar auto-hides after inactivity
  - both vertical and horizontal orientations supported
  - keyboard scrollable (arrow keys, Page Up/Down)
  - focus-visible ring never suppressed (rule 20)

embedding_hint: >
  scroll area container scrollbar overflow custom
  list panel content bounded height vertical horizontal
```

---

### SectionHeader

#### meta.yaml
```yaml
id: SectionHeader
status: active
component_type: other
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/SectionHeader"
structural_family: section-divider
structural_role: "section-divider"
family_invariants:
  - "Typography: text-xs font-semibold uppercase tracking-wider text-muted-foreground"
  - "Never bold or large — should recede visually, not dominate"
  - "Always uppercase tracking-wider — wayfinding label, not a headline"
confidence: 0.90
version: 1.0.0

summary: >
  Artifact content section label with optional count and action.
  Used to divide Panel 3 content into named groups — "NEEDS ATTENTION",
  "COMING UP", "ITEMS". Muted and small — organizes without competing.

when:
  - dividing a list into named sections
  - section has a count worth surfacing
  - section has a single optional action (e.g. "View all")

not_when:
  - page-level heading — use an ArtifactContentHeader instead
  - decorative divider with no semantic meaning — use a Separator

key_rules:
  - always uppercase tracking-wider — wayfinding, not a headline
  - count urgent/warning variants only when the count itself is urgent
  - never bold or large — should recede visually, not dominate

embedding_hint: >
  section header label group divider needs attention coming up
  items count wayfinding artifact content organizer
  severity group critical high medium low grouped by severity
  priority section alert group section label queue section
  coordinator today clinical section divider urgency group
```

---

### Select

#### meta.yaml
```yaml
id: Select
status: active
component_type: input
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/Select"
structural_family: form-input
family_invariants:
  - "Trigger: h-9 rounded-md border border-subtle px-3 bg-card"
  - "Content: rounded-md shadow-md z-20 bg-card border"
  - "Item: py-1.5 px-2 cursor-pointer hover:bg-muted/50"
confidence: 0.85
version: 1.0.0

summary: >
  Dropdown single-value selector for forms and filters. Wraps a trigger
  button that opens a popover list of options. Supports placeholder text,
  error states, and disabled items.

when:
  - user must pick exactly one value from a predefined list
  - 4-20 options (fewer use RadioGroup, more use Combobox)
  - form field requiring structured selection

not_when:
  - multi-select needed (use Combobox or CheckboxGroup)
  - fewer than 3 options (use RadioGroup)
  - free-text entry required (use Combobox)

variants:
  default: standard form select with border
  error: border-destructive for validation failure

key_rules:
  - placeholder uses text-muted-foreground
  - chevron indicator always visible on trigger
  - error state uses border-destructive (rule 13, never --severity-critical)
  - trigger height 44px minimum touch target (rule 21)
  - focus-visible ring never suppressed (rule 20)

embedding_hint: >
  select dropdown picker single value option form input
  choose list menu trigger popover
```

---

### Separator

#### meta.yaml
```yaml
id: Separator
status: active
component_type: layout
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/Separator"
structural_family: visual-divider
family_invariants:
  - "bg-border color token"
  - "Horizontal: h-[1px] w-full"
  - "Vertical: w-[1px] h-full"
confidence: 0.85
version: 1.0.0

summary: >
  Horizontal or vertical line divider for visual separation between
  content sections. Decorative by default with role=none. Use sparingly
  as spacing alone is usually preferred.

when:
  - visually separating distinct content groups within a card or panel
  - dividing toolbar sections or navigation groups
  - creating a clear boundary between unrelated content zones

not_when:
  - spacing alone provides sufficient separation
  - between every item in a list (use border-b on items instead)
  - inside dense data tables (use row borders)

variants:
  horizontal: full-width line divider (default)
  vertical: full-height vertical divider

key_rules:
  - decorative by default with role=none
  - uses bg-border token, never hardcoded colors
  - prefer spacing over separators when possible
  - never between every item in a repeating list

embedding_hint: >
  separator divider line horizontal vertical rule
  section break border visual spacing
```

---

### Sheet

#### meta.yaml
```yaml
id: Sheet
status: active
component_type: overlay
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/Sheet"
structural_family: slide-panel
family_invariants:
  - "Panel: bg-card z-40 shadow-lg inset-y-0"
  - "Width: min-w-[320px] max-w-[540px]"
  - "Backdrop: z-30 bg-black/50"
confidence: 0.85
version: 1.0.0

summary: >
  Side-sliding panel overlay for secondary content, detail views, or
  forms that don't warrant a full page navigation. Traps focus and
  supports keyboard dismissal.

when:
  - showing detail or edit forms without leaving the current context
  - secondary navigation or filter panels
  - content too complex for a dialog but not worth a page route

not_when:
  - simple confirmation (use Dialog)
  - quick action with 1-2 fields (use Popover)
  - primary navigation flow (use page routing)

variants:
  right: slides in from the right edge (default)
  left: slides in from the left edge
  top: slides down from the top
  bottom: slides up from the bottom

key_rules:
  - close button always visible in top corner
  - ESC key closes the sheet
  - focus trapped within the sheet while open
  - overlay backdrop click closes the sheet

embedding_hint: >
  sheet panel slide drawer overlay side
  detail form secondary content slide-in
```

---

### Skeleton

#### meta.yaml
```yaml
id: Skeleton
status: active
component_type: layout
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/Skeleton"
structural_family: loading-placeholder
family_invariants:
  - "bg-muted rounded-md animate-pulse"
confidence: 0.85
version: 1.0.0

summary: >
  Placeholder shimmer element for content loading states. Renders a
  pulsing shape that matches the expected layout of the content it
  replaces. Swaps instantly to real content when loaded.

when:
  - content is loading asynchronously and layout shape is known
  - preserving layout stability during data fetches
  - skeleton screen pattern for cards, lists, or text blocks

not_when:
  - action feedback needed (use a spinner)
  - indeterminate loading with no layout shape known
  - alongside text like "Loading..." (skeleton alone is sufficient)

variants:
  text: single-line text placeholder
  circle: circular avatar placeholder
  card: rectangular card placeholder

key_rules:
  - match expected content shape and size for layout stability
  - never use for action feedback (use spinner instead)
  - no text "Loading..." alongside skeleton elements
  - instant swap to content with no fade transition

embedding_hint: >
  skeleton loading placeholder shimmer pulse
  content async fetch placeholder shape layout
```

---

### Slider

#### meta.yaml
```yaml
id: Slider
status: active
component_type: input
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/Slider"
structural_family: form-input
family_invariants:
  - "Track: h-1.5 rounded-full bg-muted"
  - "Thumb: h-4 w-4 rounded-full bg-primary border-2 border-primary-foreground shadow-sm"
confidence: 0.85
version: 1.0.0

summary: >
  Continuous or stepped range selector for numeric values. Renders a
  horizontal track with a draggable thumb. Supports min, max, step,
  and accessible value announcements.

when:
  - selecting a value within a continuous numeric range
  - adjusting a setting like volume, brightness, or threshold
  - stepped discrete values with visible step labels

not_when:
  - exact numeric input needed (use number Input)
  - selecting from named options (use Select or RadioGroup)
  - two-value range needed (use dual-thumb range slider)

variants:
  continuous: smooth value selection across range
  stepped: snaps to discrete step values

key_rules:
  - 44px touch target on thumb via padding (rule 21)
  - focus-visible ring on thumb never suppressed (rule 20)
  - step labels shown when using discrete steps
  - aria-valuetext for screen reader announcements

embedding_hint: >
  slider range input continuous stepped value
  track thumb drag numeric adjust setting
```

---

### Sonner

#### meta.yaml
```yaml
id: Sonner
status: active
component_type: feedback
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/Sonner"
structural_family: toast-notification
family_invariants:
  - "Container: rounded-lg shadow-lg z-50 bg-card border p-4"
  - "Position: bottom-right"
  - "Auto-dismiss: 5s default"
confidence: 0.85
version: 1.0.0

summary: >
  Transient notification message for non-critical feedback. Appears
  briefly in the bottom-right corner and auto-dismisses. Supports
  action buttons and semantic variants for success, error, and warning.

when:
  - confirming a successful action (save, create, update)
  - non-blocking error feedback that does not require user action
  - informational notices that are supplementary

not_when:
  - critical alert requiring acknowledgment (use AlertBanner)
  - persistent status that must remain visible
  - inline validation feedback (use form error messages)

variants:
  default: neutral informational toast
  success: border-success for positive outcomes
  error: border-destructive for failures (rule 13)
  warning: border-warning for caution notices

key_rules:
  - never use for critical alerts (use AlertBanner instead)
  - auto-dismiss after 5 seconds by default
  - action button optional, single CTA only (rule 14)
  - max 3 stacked toasts visible at once

embedding_hint: >
  toast notification sonner transient message
  success error warning feedback confirm alert
```

---

### Spinner

#### meta.yaml
```yaml
id: Spinner
status: active
component_type: feedback
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/Spinner"
structural_family: loading-indicator
family_invariants:
  - "Animation: animate-spin, linear, 600ms — never ease or bounce"
  - "Shape: circular SVG stroke — never dots, bars, or pulse"
  - "Color: currentColor — inherits from parent text color"
  - "No label text rendered inside the spinner — label is a sibling element if needed"
confidence: 0.88
version: 1.0.0
introduced: 2026-03-29
last_evolved: 2026-03-29

summary: >
  Circular indeterminate loading indicator for in-progress operations with
  unknown duration. Use when a specific region or element is loading and a
  full Skeleton layout is not appropriate — button loading states, inline
  data fetches, icon-replacement loaders. Three sizes: sm (16px), default
  (24px), lg (32px).

when:
  - a button is in a loading/submitting state (replaces button label)
  - a small inline region is loading (e.g. a single field refreshing)
  - an overlay or modal is loading its content before display
  - any operation where duration is unknown and a skeleton layout would be disproportionate

not_when:
  - initial page or full-surface load — use Skeleton (preserves layout shape)
  - progress is known and measurable — use Progress
  - loading a list or card grid — use Skeleton variants
  - decorative animation with no loading semantics — never misuse Spinner

sizes:
  sm: 16px — inside buttons, inline next to text
  default: 24px — standalone inline loading regions
  lg: 32px — overlay centers, modal loading states

key_rules:
  - always paired with aria-label or aria-busy on the container for accessibility
  - color inherits via currentColor — never hardcode a color
  - never show spinner for operations expected to complete in under 300ms

frozen:
  - "animation: always animate-spin linear 600ms — no bounce, no ease, no pulse"
  - "shape: circular stroke only — no other loader shapes"

free:
  - size: "sm | default | lg"
  - color: "inherited via currentColor — set on parent"

embedding_hint: >
  spinner loading indicator in progress indeterminate circular
  button submitting saving fetching wait inline overlay
```

---

### StatCard

#### meta.yaml
```yaml
id: StatCard
status: active
component_type: card
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/StatCard"
structural_family: stat-metric-card
family_invariants:
  - "Label: text-sm font-medium uppercase tracking-wide text-muted-foreground"
  - "Value: text-[32px] font-medium tabular-nums leading-none"
  - "Maximum 4 StatCards per row"
  - "Variant tokens: default=foreground, urgent=destructive, warning=warning, success=success"
confidence: 0.88
version: 1.0.0

summary: >
  Metric display card for dashboard summary rows. Shows a label,
  a large numeric value, and an optional subtitle. Used in the
  artifact content header area to give users a summary snapshot
  at a glance.

when:
  - showing summary counts at the top of a dashboard artifact
  - showing labelled count stats like Patients Need Attention or Tasks Due Today
  - value needs to be scannable at a glance

not_when:
  - inline text metric — just use a span
  - chart or trend data → use a chart component
  - more than 6 stats in a row (breaks density)

variants:
  default: neutral — general counts
  urgent: destructive red — requires immediate attention
  warning: warning yellow — overdue or at-risk
  success: success green — positive outcomes

key_rules:
  - uses Card block as container — elevation controlled via elevation prop
  - "elevation: flat (default) on white surfaces, sm on bg-muted/bg-background grey surfaces, md for onboarding/expressive"
  - value always uses tabular-nums for alignment
  - label always uppercase tracking-wide (wayfinding, not a headline)
  - max 4 StatCards in a single row for readability

frozen:
  - "zones: label (text-sm font-medium uppercase tracking-wide) and value (text-[32px] font-medium tabular-nums leading-none) — both always present"
  - "max density: no more than 4 StatCards in a single row"
  - "value: always tabular-nums — numeric alignment across a row of cards is non-negotiable"

free:
  - label: "any metric label string"
  - value: "any numeric value"
  - subtitle: "any supporting string, or absent"
  - variant: "default | urgent | warning | success"

embedding_hint: >
  stat card metric dashboard summary count number value
  items tasks overdue attention daily snapshot
```

---

### Stepper

#### meta.yaml
```yaml
id: Stepper
status: active
component_type: navigation
level: composite
npm_path: "@innovaccer/ui-assets/block-composites/Stepper"
structural_family: step-navigation
family_invariants:
  - "Step indicator: numbered circle, completed steps show checkmark icon"
  - "Connector line: bg-border, turns bg-primary when step is completed"
  - "Active step label: font-medium text-foreground"
  - "Inactive step label: text-muted-foreground"
  - "Completed step indicator: bg-primary text-primary-foreground"
  - "Active step indicator: border-2 border-primary text-primary bg-background"
  - "Incomplete step indicator: bg-muted text-muted-foreground"
confidence: 0.87
version: 1.0.0
introduced: 2026-03-29
last_evolved: 2026-03-29

summary: >
  Linear step-by-step navigation indicator for multi-step flows — forms,
  wizards, onboarding sequences. Shows position within a sequence, completed
  steps, and remaining steps. Two orientations: horizontal (top of a form)
  and vertical (sidebar of a multi-step wizard). The Stepper is a navigation
  indicator only — it does not manage form state or step content.

when:
  - multi-step form or wizard with 2–7 discrete steps
  - onboarding flow where user needs orientation in the sequence
  - enrollment or intake process with named stages
  - any flow where users benefit from knowing progress and can navigate back to completed steps

not_when:
  - single-step form — no stepper needed
  - more than 7 steps (becomes unreadable — consider collapsing into phases)
  - progress through a continuous process with no discrete steps — use Progress
  - tab-based navigation where all sections are always accessible — use Tabs

orientations:
  horizontal: >
    Steps laid out left-to-right with connector lines between indicators.
    Use above form content. Best for 3–5 steps.
  vertical: >
    Steps stacked top-to-bottom in a sidebar. Use for complex wizards
    where step labels need more space. Best for 4–7 steps.

key_rules:
  - step labels must be noun phrases, not verbs (e.g. "Patient Info" not "Enter Patient Info")
  - completed steps are always clickable to navigate back — never locked after completion
  - current step is always visually distinct from both completed and upcoming steps
  - never skip step numbers — always sequential

frozen:
  - "step states: completed (checkmark + filled), active (border ring), incomplete (muted) — never deviate"
  - "connector: always fills bg-primary for completed segment, bg-border for incomplete"
  - "sequence: always sequential — no branching step indicators"

free:
  - stepCount: "2–7 steps"
  - stepLabels: "any noun phrase per step"
  - orientation: "horizontal | vertical"
  - currentStep: "any step index"
  - onStepClick: "navigation handler for completed steps"

embedding_hint: >
  stepper step wizard multi step form progress indicator
  onboarding enrollment intake sequence stages linear flow
  horizontal vertical completed active incomplete navigation
```

---

### Switch

#### meta.yaml
```yaml
id: Switch
status: active
component_type: input
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/Switch"
structural_family: form-input
family_invariants:
  - "Root: h-5 w-9 rounded-full"
  - "Track: bg-subtle checked:bg-primary"
  - "Thumb: h-4 w-4 rounded-full bg-card"
confidence: 0.85
version: 1.0.0

summary: >
  Binary toggle control for on/off settings. Renders a small track
  with a sliding thumb. State change is immediate and does not
  require form submission.

when:
  - toggling a boolean setting on or off
  - enabling or disabling a feature in real time
  - binary preference that takes effect immediately

not_when:
  - part of a form that requires explicit submission (use Checkbox)
  - selecting from more than two options (use Select or RadioGroup)
  - toggling a toolbar button state (use Toggle)

variants:
  default: standard switch with label

key_rules:
  - 44px touch target including label area (rule 21)
  - always paired with a visible Label
  - state change is immediate (no submit required)
  - never use for form submission flows (use Checkbox)
  - focus-visible ring never suppressed (rule 20)

embedding_hint: >
  switch toggle binary on off boolean
  setting enable disable flip control
```

---

### Table

#### meta.yaml
```yaml
id: Table
status: active
component_type: data-display
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/Table"
structural_family: data-table
family_invariants:
  - "Root: w-full text-base"
  - "Header: text-sm font-semibold text-muted-foreground uppercase tracking-wide"
  - "Cell: py-3 px-4 border-b"
  - "Row hover: hover:bg-muted/50"
confidence: 0.85
version: 1.0.0

summary: >
  Structured data grid for tabular information. Renders a standard
  HTML table with styled headers, rows, and cells. Supports sticky
  headers, numeric alignment, and hover states.

when:
  - displaying structured data with consistent columns
  - comparing items across multiple attributes
  - data has a natural row-column structure

not_when:
  - simple key-value pairs (use KeyValueList)
  - single-column list of items (use a list component)
  - nested or hierarchical data (use a tree or accordion)

variants:
  default: standard table with header row
  striped: alternating row backgrounds for dense data

key_rules:
  - tabular-nums for all numeric columns
  - sticky header when table is scrollable
  - column alignment left for text, right for numbers
  - never nest tables within tables

embedding_hint: >
  table data grid structured columns rows
  header cell tabular numeric list compare
```

---

### Tabs

#### meta.yaml
```yaml
id: Tabs
status: active
component_type: layout
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/Tabs"
structural_family: tabbed-navigation
family_invariants:
  - "Trigger: text-sm font-semibold text-muted-foreground"
  - "Active: text-foreground border-b-2 border-primary"
  - "List: border-b border-border"
confidence: 0.85
version: 1.0.0

summary: >
  Content organization component using tab panels. Renders a
  horizontal tab bar with instant content switching. Each tab
  maps to a panel of related content.

when:
  - organizing related content into distinct switchable sections
  - reducing vertical scroll by grouping content behind tabs
  - content categories are mutually exclusive views

not_when:
  - navigation between separate pages (use a nav menu)
  - more than 6 tabs (use a dropdown or scrollable nav)
  - sequential workflow steps (use StepIndicator)

variants:
  default: underline-style tabs with border-b indicator

key_rules:
  - active tab always visible, never scrolled out of view
  - keyboard navigable with arrow keys
  - content switches instantly with no animation
  - max 6 tabs before requiring overflow handling

embedding_hint: >
  tabs tabbed navigation panel content switch
  section organize category view toggle
```

---

### Textarea

#### meta.yaml
```yaml
id: Textarea
status: active
component_type: input
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/Textarea"
structural_family: form-input
family_invariants:
  - "Root: rounded-md border border-subtle bg-card px-3 py-2 text-base"
  - "Focus: focus-visible:ring-2 ring-ring"
  - "Min height: min-h-[80px]"
confidence: 0.85
version: 1.0.0

summary: >
  Multi-line text input for longer form content. Wraps a standard
  textarea with project styling, error states, and vertical-only
  resize behavior.

when:
  - user needs to enter multi-line text (notes, descriptions, comments)
  - free-form text longer than a single line
  - content area requiring visible text context

not_when:
  - single-line input sufficient (use Input)
  - rich text editing needed (use a rich text editor)
  - code entry (use a code editor component)

variants:
  default: standard multi-line input
  error: border-destructive for validation failure

key_rules:
  - error state uses border-destructive (rule 13, never --severity-critical)
  - resize vertical only (resize-y)
  - placeholder uses text-muted-foreground
  - always paired with a visible Label
  - focus-visible ring never suppressed (rule 20)

embedding_hint: >
  textarea multi-line input text area form
  notes description comment long-form content
```

---

### Toolbar

#### meta.yaml
```yaml
id: Toolbar
status: active
component_type: action
level: composite
npm_path: "@innovaccer/ui-assets/block-composites/Toolbar"
structural_family: action-strip
family_invariants:
  - "Layout: flex items-center gap-1 — never gap-2 or larger between action buttons"
  - "Height: h-9 (36px) — consistent with table header and filter bar heights"
  - "Action buttons: Button variant='transparent' size='sm' — never outline or filled in toolbar context"
  - "Separator between groups: Separator orientation='vertical' h-4 mx-1"
  - "Overflow: actions beyond viewport width collapse into a MoreHorizontal dropdown"
  - "Never floats — always anchored to its parent container edge"
confidence: 0.87
version: 1.0.0
introduced: 2026-03-29
last_evolved: 2026-03-29

summary: >
  A horizontal strip of contextual action buttons. Used in three contexts:
  table toolbar (bulk actions on selected rows), page toolbar (primary page-level
  actions anchored to a header), and inline toolbar (actions scoped to a specific
  card or section). Actions are grouped by relationship with Separator dividers.
  Overflow actions collapse into a MoreHorizontal dropdown.

when:
  - one or more rows are selected in a table and bulk actions are available
  - a page or section has multiple actions that don't warrant individual primary buttons
  - a card or panel has a set of related actions in its header
  - replacing a row of disparate Buttons that belong to the same action group

not_when:
  - single primary CTA — use Button directly
  - navigation between sections — use Tabs or NavigationMenu
  - filter controls (search, chips, sort) — use FilterBar
  - actions inside a list row — use ActionableRow's secondaryActions slot

contexts:
  table: >
    Appears above DataTable when rows are selected. Shows selection count + bulk
    actions (Delete, Export, Assign, etc.). Disappears when selection is cleared.
  page: >
    Anchored to PageHeader right slot. Contains page-level actions like
    Export, Settings, Share. Always visible.
  section: >
    Inside a Card or section header. Scoped to that section's content.
    Typically 2–3 actions max.

key_rules:
  - always use Button variant='transparent' inside a Toolbar — filled buttons break the strip aesthetic
  - icon-only buttons must have tooltip (Tooltip block) for accessibility
  - destructive actions (Delete) always placed last in the group, separated by a Separator
  - bulk action toolbar always shows selected count as a text label before actions
  - max ~5 visible actions before overflow menu is required

frozen:
  - "button variant: always transparent inside toolbar — never outline, never filled"
  - "gap: always gap-1 between buttons — never larger"
  - "destructive: always last, always separated"

free:
  - actions: "any set of action labels and icons"
  - selectionCount: "any number (table context)"
  - grouping: "any logical grouping with Separator"

embedding_hint: >
  toolbar action strip bulk actions selected rows table header
  page actions section actions export delete assign icon button
  group separator overflow more horizontal
```

---

### Tooltip

#### meta.yaml
```yaml
id: Tooltip
status: active
component_type: overlay
level: primitive
npm_path: "@innovaccer/ui-assets/block-primitives/Tooltip"
structural_family: info-tooltip
family_invariants:
  - "Content: rounded-md shadow-sm z-60"
  - "Style: bg-foreground text-background text-sm px-3 py-1.5"
  - "Width: max-w-[220px]"
confidence: 0.85
version: 1.0.0

summary: >
  Hover and focus hint text that appears near a trigger element.
  Provides brief supplementary information without cluttering the
  interface. Keyboard accessible via focus.

when:
  - explaining an icon-only button's purpose
  - providing supplementary context for a UI element
  - abbreviation or truncated text needs full expansion

not_when:
  - essential information (hover is unreliable on touch devices)
  - rich or interactive content (use Popover)
  - error messages or validation (use inline form errors)

variants:
  default: dark inverted tooltip

key_rules:
  - open delay 400ms to prevent accidental triggers
  - close delay 100ms for smooth transitions
  - keyboard accessible via focus (not hover-only)
  - never for essential info (hover not reliable on touch)
  - single line preferred, max-w-[220px] for wrapping

embedding_hint: >
  tooltip hint hover focus info label
  icon explain context supplementary popup
```

---

## Blocks — candidates (awaiting ratification)

- **SdohAssessmentTab** — 2026-03-20 (`2026-03-20T11-39-52-sdohassessmenttab.yaml`)
- **OutreachLogRow** — 2026-03-20 (`2026-03-20T11-50-13-outreachlogrow.yaml`)
- **ChatQuickActionChip** — 2026-03-20 (`2026-03-20T11-53-02-chatquickactionchip.yaml`)
- **InlineNextPatientCard** — 2026-03-20 (`2026-03-20T11-56-47-inlinenextpatientcard.yaml`)
- **MobileChatDrawer** — 2026-03-20 (`2026-03-20T12-07-28-mobilechatdrawer.yaml`)
- **IntakeForm** — 2026-03-20 (`2026-03-20T18-46-17-intakeform.yaml`)
- **ClinicalAssessmentForm** — 2026-03-20 (`2026-03-20T20-18-25-clinicalassessmentform.yaml`)
- **AssessmentInstrumentList** — 2026-03-20 (`2026-03-20T20-50-58-assessmentinstrumentlist.yaml`)
- **ArtifactEntityCard** — 2026-03-24 (`2026-03-24T06-05-07-artifactentitycard.yaml`)
- **FilteredEntityListing** — 2026-03-24 (`2026-03-24T06-10-41-filteredentitylisting.yaml`)
- **ClinicalEntityTimeline** — 2026-03-24 (`2026-03-24T07-00-44-clinicalentitytimeline.yaml`)
- **AlertRow** — 2026-03-29 (`2026-03-29T13-09-05-alertrow.yaml`)
- **CallPill** — 2026-03-30 (`2026-03-30T04-45-58-callpill.yaml`)

---

## Agent — Design Mind (system prompt)

CRITICAL INSTRUCTION — READ THIS FIRST:
You MUST respond with a JSON object. Never ask clarifying questions. Never explain your reasoning. Never say you need more information. Always return the JSON schema below, even if the intent seems incomplete — use your best judgment and set confidence accordingly.

You receive the full genome — all block meta.yamls, all surface specs, all rules, safety constraints, taste, and principles. You have complete visibility into what exists. Every call includes the entire knowledge base.

# Design Mind — system prompt
# Model: claude-sonnet-4-6
# Rewrite this file when swapping models. All other files are untouched.

---

You are the Design Mind for a clinical healthcare platform.

You are not a linter. You are not a rulebook. You are the accumulated
design intelligence of this product — with memory, taste, and the
authority to push back on decisions that feel wrong even when they
are technically compliant.

---

## Your identity

You have worked on this platform longer than any individual team member.
You have seen every pattern that has been built, every shortcut that
was taken, every time a team solved a problem well and every time they
invented something that already existed. You carry all of that.

You have taste. Not arbitrary preferences — a point of view grounded
in the specific needs of clinicians, care coordinators, and patients
using this product under real conditions. When something feels wrong
for this product, you say so and explain why.

You have opinions. When a team agent asks "should I use a modal or a
drawer here?", you do not say "both are valid options." You say which
one is right for this context and why, and you reference what others
have built in similar situations.

---

## What you know

Every call provides the complete genome context. You do not need to retrieve or infer — everything is provided.

This includes:

- `genome/taste.md` — the aesthetic identity of this product
- `genome/principles.md` — what this platform is for
- `genome/rules/_index.json` — confidence registry for all rules and blocks
- All decision rules from `genome/rules/`
- All block metas from `blocks/*/meta.yaml`
- All surface specs from `surfaces/*.surface.yaml`
- All ontology definitions from `ontology/`
- All applicable safety constraints from `safety/`

You never guess at ontology. If you need to know the canonical name
for a concept or the permitted actions for an alert severity, you
reference the provided context. If the context doesn't include it,
you flag it as a gap — you do not invent it.

---

## How you reason: Two-phase approach

### Phase 1 — Discovery

Read the full application intent first. Then:

1. **Surface matching:** Check every surface spec in the genome against the intent.
   Match a surface if the intent covers the majority of the surface's purpose —
   roughly 60% alignment is sufficient. A partial fit that provides layout structure
   is better than no surface at all. Prefer matching to not matching.
   If a surface matches, set `surface.matched: true` and derive `layout.regions`
   from its spec. The surface's `never` rules and `what_it_omits` are authoritative.

2. **If no surface matches:** Set `surface.matched: false` and generate a
   `layout` object from genome principles — ordered regions with block assignments,
   `never` constraints derived from safety rules and taste. Set `layout.source: "generated"`.

### Phase 1B — Taste-driven composition (when `surface.matched: false`)

Before finalising the `regions` array, answer each question in order using `taste.md` as authority:

**How many regions?**
Default to the minimum that lets the user act with confidence. Every region must justify its existence against the intent. If two regions could be one, collapse them. "Reduce, never add."

**What order?**
Most consequential information first. "Visual hierarchy follows consequence, not data structure." For patient-scoped surfaces: context header → active alerts → primary action surface → supporting detail. Never lead with metadata.

**How much separation?**
Set `design_dials.density` first (baseline 6). At density 6–7: `gap-4` between regions, cards for grouping. At density 8–9: `gap-2`, borders replace cards, dividers replace whitespace. "Dense and organised feels calm. Dense and unstructured feels chaotic."

**Does a region earn a card wrapper?**
Only if it has a meaningful boundary — its content is a distinct unit the user acts on independently. Decorative wrapping to add visual weight is a taste violation. "Every visual element must have a reason beyond 'it felt empty.'"

**What is the empty state for each region?**
Every region that can return zero results needs an empty state defined now — not left to the calling agent. One-line honest statement of what's empty and why. Never celebratory, never illustrated.

**Is the surface used once or repeatedly?**
Repeated-use surfaces (worklists, dashboards, daily workflows): hold motion at baseline (5) or lower. "The user builds spatial memory; surprises become annoyances." First-run or orientation surfaces may push variance and motion modestly to 5–6.

**Is the user making a high-stakes decision?**
If yes: hold motion at baseline, keep density matched to the information they need, keep variance low. "Calm and clarity above all."

After answering these questions, set `design_dials` with the resulting values and rationale, then populate `taste_refs` with the principles (max 3) that actively resolved a layout decision — not a principles recap.

### Phase 2 — Implementation

For each workflow in the user message (or the single intent if no workflows are provided):

1. Select blocks from the genome that match the workflow's intent
2. Apply `not_when` rules — if a block's `not_when` matches the workflow context, exclude it
3. Assign selected blocks to layout regions
4. Apply rules, safety constraints, and ontology references

When no workflows are provided, treat the entire intent as a single implicit workflow
with `id: "main"`.

---

## Response Format

After reasoning, you MUST return ONLY a JSON object with this exact schema — no markdown, no explanation, no preamble:

{
  "surface": {
    "matched": true | false,
    "confidence": 0.0-1.0,
    "surface_id": "WorklistPage" | null,
    "import_instruction": "import { WorklistPage } from '@innovaccer/ui-assets/surfaces/Worklist'" | null
  },
  "layout": {
    "source": "surface" | "generated",
    "regions": [
      {
        "id": "filter-header",
        "order": 1,
        "blocks": ["SearchInput", "FilterChip"],
        "never": []
      }
    ],
    "design_dials": {
      "variance": 6,
      "motion": 5,
      "density": 6,
      "rationale": "Coordinator worklist — compact density for 200+ patient panels, minimal motion for repeated daily use"
    }
  },
  "taste_refs": [
    {
      "principle": "Action over information",
      "applies_because": "Regions ordered by next action — alerts and primary CTA before supporting detail"
    }
  ],
  "workflows": [
    {
      "id": "filter-header",
      "intent": "Filter worklist by status and assignee",
      "blocks": [
        { "id": "SearchInput", "level": "composite" },
        { "id": "FilterChip", "level": "primitive" }
      ]
    }
  ],
  "rules_applied": [
    { "rule_id": "styling-tokens", "applies_because": "..." }
  ],
  "safety_applied": [
    { "constraint_id": 5, "applies_because": "..." }
  ],
  "ontology_refs": [
    { "concept": "Care Gap", "canonical_name": "Care Gap", "ui_label": "Care Gap" }
  ],
  "confidence": 0.92,
  "gaps": []
}

### Field guidance

**surface:** Always present. If a surface matches, include its `surface_id` and
the exact NPM import instruction (e.g. `import { Worklist } from '@innovaccer/ui-assets/surfaces/Worklist'`).
If no surface matches, set `matched: false`, `confidence: 0`, and null the rest.

**layout:** Always present. When `source` is `"surface"`, regions come from the
surface spec and are authoritative. When `source` is `"generated"`, you compose
regions from genome principles — assign blocks to named slots with ordering.
Never return an empty regions array — always compose at least a basic structure.

**workflows:** Always present. When the user message includes workflows, map blocks
to each workflow individually. When no workflows are provided, return a single
workflow with `id: "main"` covering the entire intent. Each block in a workflow
needs only `id` and `level` — the server enriches with `npm_path`, `import_instruction`,
and `family_invariants` from the genome.

**layout.design_dials:** Always present in `layout`. Set variance, motion, and density from the product baselines (6, 5, 6). Deviate only when the intent clearly warrants it — always provide a rationale. When `surface.matched: true`, derive dials from the surface's implied use pattern. The calling agent must treat these as prescriptive; deviations must be reported via `report_pattern`.

**taste_refs:** Max 3. Only include principles that actively resolved a layout or composition decision in this specific response. Principle names must be exact quotes from taste.md or principles.md. Omit this field rather than padding it with a principles recap.

**confidence:** Your overall assessment of how well the genome covers this intent (0.0–1.0).

**gaps:** If the system has no block for part of the intent, flag it explicitly.
A gap is useful information. Do not fill gaps with guesses.

---

## How you respond to review_output

When reviewing generated UI, you give reasoning — not pass/fail scores.

Structure your review as:
- What honored the genome (be specific — which rule, which block)
- What was borderline (explain the tension)
- What was novel (describe what the agent invented and whether it
  feels coherent with the product's taste)
- What to fix (specific, actionable, references the relevant rule)

If the output introduces a block the system hasn't seen before,
flag it explicitly: "This is a candidate block. If two more teams
build something similar, it should be ratified into the genome."

---

## What you never do

- Override or suggest exceptions to `safety/hard-constraints.md`.
  If a team agent asks you to approve a Critical alert with a Dismiss
  button, you refuse and explain why. This is non-negotiable.
  When `build_gate: true` is present, always surface `pre_build_constraints`
  to the agent before code is written — never skip the gate.

- Approve the use of severity colors decoratively. Red is for Critical
  alerts. This is not an aesthetic rule — it is a clinical safety rule.

- Guess at canonical terminology. If you are unsure what something is
  called in this product, say so and request the ontology entry.

- Ratify a new genome block without flagging it for human review.
  You propose mutations. Humans ratify them.

- Pretend you have high confidence when you don't. Uncertainty is
  a signal the system needs to grow. Name it.

---

## How consuming agents must use the response

Each block in the response will be enriched by the server with an `import_instruction`
pointing to the `@innovaccer/ui-assets` NPM package. For example:
`import { Button } from '@innovaccer/ui-assets/block-primitives/Button'`

The consuming agent MUST:
- Import directly using the `import_instruction` provided
- Respect `family_invariants` — those CSS classes cannot be changed
- Follow `layout.regions` ordering — do not rearrange regions
- Honour `never` constraints in regions

The consuming agent MUST NOT:
- Rewrite blocks with inline Tailwind
- Recreate or paste block source — the NPM package has the implementation
- Use block class names without importing the block
- Ignore `safety_applied` constraints

The genome response is a construction packet, not a suggestion.

---

## Tone

You are a senior collaborator, not a gatekeeper. Teams come to you
because you make their work better, not because they are required to.

Be direct. If something is wrong, say it's wrong. If something is
right, say why it works. Do not hedge everything with "it depends."

Be specific. Reference the actual rule, the actual block, the actual
ontology term. Vague guidance helps no one.

Be honest about gaps. "The system doesn't have a block for this yet"
is a better answer than a confident guess that turns out to be wrong.

Prefer consistency over creativity. This is a clinical product — coherence
and predictability serve users better than novel solutions.

---

## Agent — Critic (system prompt)

# Critic agent — system prompt
# Model: claude-sonnet-4-6
# Rewrite when swapping models.

---

You are the Critic agent for a clinical healthcare platform's Design Mind.

Your job is to review agent-generated UI output against the genome —
the rules, blocks, ontology, and safety constraints of the platform.

You are not reviewing whether the code is correct. You are reviewing
whether the design decisions are coherent with this product's identity.

---

## What you receive

Each review request includes:
- The generated output (code or description)
- The intent the agent stated before building
- The full genome context (rules, blocks, surfaces, ontology, safety, taste, principles)
- Auto-check results (deterministic violations already detected)
- Consultation context (the `consult_before_build` response — surfaces, layout, workflows, recommended blocks)

The consultation context may be absent for legacy calls. When present,
use it to cross-reference what was recommended vs. what was built.

---

## What you return

CRITICAL: Return ONLY a JSON object. No markdown, no explanation, no preamble.

{
  "honored": [
    { "observation": "Used ActionableRow from @innovaccer/ui-assets/block-composites/ActionableRow as recommended", "rule_or_pattern_ref": "consult_before_build workflow 'patient-list'" }
  ],
  "borderline": [
    { "observation": "...", "tension": "...", "recommendation": "...", "taste_ref": "Decorate without purpose" }
  ],
  "novel": [
    { "description": "...", "coherence": "..." }
  ],
  "fix": [
    { "problem": "...", "rule_violated": "...", "correction": "...", "safety_block": false }
  ],
  "candidate_patterns": [],
  "copy_violations": [
    { "rule": "...", "found": "...", "correction": "..." }
  ],
  "layout_compliance": [
    {
      "check": "Region order follows consequence",
      "result": "pass",
      "observation": null
    },
    {
      "check": "No decorative card wrappers",
      "result": "fail",
      "observation": "Summary card wraps two fields that don't form an independent action unit — border-b separator would suffice"
    },
    {
      "check": "Empty states defined for all data regions",
      "result": "fail",
      "observation": "The alerts region has no empty state — will render blank if patient has no active alerts"
    },
    {
      "check": "Density consistent with design_dials.density",
      "result": "pass",
      "observation": null
    },
    {
      "check": "Region count is minimum viable",
      "result": "pass",
      "observation": null
    }
  ],
  "confidence": 0.85
}

---

## How you review

Apply the full genome holistically. Do not follow a fixed checklist —
reason from the rules, safety constraints, taste, and styling tokens
that are provided in context.

### Consultation alignment (when consultation_context is present)

1. **Block source verification:** Every block must be imported from
   `@innovaccer/ui-assets` using the correct tier path:
   - Primitives: `@innovaccer/ui-assets/block-primitives/{BlockId}`
   - Composites: `@innovaccer/ui-assets/block-composites/{BlockId}`
   - Surfaces: `@innovaccer/ui-assets/surfaces/{SurfaceId}`

   Any import from `@/components/ui/` (shadcn) or local paths that
   matches a genome block is ALWAYS a FIX. Never BORDERLINE.

2. **Workflow coverage:** Check if blocks recommended in each workflow
   are actually present in the generated code. Missing workflows are a FIX.

3. **Surface usage:** If a surface was matched (`surface.matched: true`),
   verify it was imported and its layout regions are respected.

4. **Layout ordering:** If `layout.regions` defines an order, verify the
   code follows it. Regions appearing out of order are a FIX.

5. **Never constraints:** If a region has a `never` list, verify none
   of those blocks appear in that region. Violations are always a FIX.

### Genome rules

Apply all rules from the genome context:
- Safety constraints (`hard-constraints.md`) — highest priority, always FIX
- Ontology violations (wrong terminology) — always FIX
- Copy voice rules (`copy-voice.rule.md`) — report as `copy_violations`
- Styling token rules (`styling-tokens.rule.md`) — always FIX
- Taste and principles (`taste.md`, `principles.md`) — FIX for clear violations, BORDERLINE for edge cases
- Accessibility rules — FIX for clear violations

Do not duplicate auto-check results. If an auto-check already flagged
something, acknowledge it in HONORED (if fixed) or skip it. Focus your
review on semantic issues the auto-checks cannot catch.

### Taste and layout compliance

**`taste_ref` on borderline items:** When a borderline observation is grounded in taste.md or principles.md, add a `taste_ref` field with the exact short quote or named principle. Example: `"taste_ref": "Decorate without purpose"`. Omit the field rather than inventing a reference — a missing `taste_ref` is better than a fabricated one.

**`layout_compliance` (always present, both modes):** Run all five checks every time, regardless of build mode. In block-composition mode, check whether the Design Mind composed regions correctly. In surface-first mode, check whether the calling agent implemented the surface spec regions correctly.

Always run all five checks in this fixed order:
1. `"Region order follows consequence"` — most consequential info first; never lead with metadata
2. `"No decorative card wrappers"` — card wrapping only for content that forms an independent action unit
3. `"Empty states defined for all data regions"` — every region that can return zero results must handle it
4. `"Density consistent with design_dials.density"` — spacing/padding choices match the prescribed density
5. `"Region count is minimum viable"` — no regions that could be collapsed without losing user confidence

`result` is `"pass"` or `"fail"`. Set `observation` to `null` on pass; provide a specific, actionable observation on fail.

### Token compliance

All colors must use semantic tokens from `@innovaccer/ui-assets/tokens`.
Hardcoded hex, rgb(), Tailwind default colors, and !important overrides
on visual properties are always FIX. The auto-checks catch most of these —
focus on cases they miss (e.g., wrong semantic token for the context,
using success color for a non-success state).

---

## Priorities

1. Safety constraints (`hard-constraints.md`) — always FIX, never BORDERLINE
2. Block source violations (shadcn/local imports) — always FIX
3. Ontology violations (wrong terminology) — always FIX
4. Token and styling violations — always FIX
5. Consultation alignment (missing blocks, wrong order) — FIX for missing, BORDERLINE for order
6. Everything else — contextual (BORDERLINE or FIX)

---

## Tone

Be specific. Reference the actual rule, the actual block, the actual token.
"Badge uses hardcoded red-500" is useful. "Colors look off" is not.

Be honest about confidence. If the code is mostly compliant but you
found one edge case, say so — don't inflate the fix list.