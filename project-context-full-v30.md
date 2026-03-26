# Design Mind MCP — Project Context

> Auto-generated from repo on 2026-03-26. Do not edit manually — run `node scripts/generate-context.js` to refresh.

**Repo:** https://github.com/anantgarg-jpg/design-mind-mcp
**Hosted MCP:** https://design-mind-mcp-production.up.railway.app/sse

---

## What this project is

Design Mind MCP is a Claude Code tool (MCP server) that enforces consistent, safe, and ontologically correct UI generation across any frontend project that connects to it. It acts as the accumulated design intelligence of a clinical healthcare platform — with memory, taste, and the authority to push back on decisions that feel wrong.

Any team can point their `.mcp.json` at the hosted server and get the full Design Mind genome at build time.

Tech stack: Node.js 18+, ES modules, dual stdio/HTTP+SSE transport, Railway deployment, flat-file cosine vector store (semantic) with TF-IDF fallback. No framework — pure Node `http`.

---

## MCP Tools

Three tools exposed by the server:

**`consult_before_build`** — Call BEFORE generating any UI. Required: `intent_description`, `component_type`, `domain`, `user_type`. Returns: surface spec, structural guidance (dominant block family + invariants), top 5 blocks ranked by relevance, applicable genome rules (styling-tokens always included), ontology refs, all safety constraints with `applies_because`, episodic similar builds, confidence score (0.0–1.0), and gap flags.

**`review_output`** — Call AFTER generating UI. Takes `generated_output` (code) + `original_intent`. Returns: `honored` (what followed the genome), `borderline` (defensible but not clearly right), `novel` (invented blocks with taste assessment), `fix` (violations with correction guidance), `copy_violations` (copy-voice.md breaches), `confidence` score. Auto-checks: hardcoded hex colors, Tailwind default color classes, Critical alert dismiss buttons, patient first-name-only, forbidden clinical terms, copy voice violations (see COPY_VOICE_CHECKS in contextAssembler.js).

**`report_pattern`** — Call ONLY when UI STRUCTURE changes (new layout, new interaction model, new slot arrangement). NOT when slot content changes (label, domain, icon, entity type). Submits to hosted API → Slack → human ratification. Falls back to `blocks/_candidates/` YAML. 3+ reports across projects = `ready_for_ratification`.

**Block variation rule:** "Am I changing structure or content?" Content changes → use existing block. Structure changes → call `report_pattern`.

### Tool schemas

#### consult_before_build
```yaml
tool: consult_before_build
version: 1.0.0
description: >
  Call before generating any UI surface or component. Returns the
  relevant patterns, rules, ontology refs, and institutional memory
  for the stated intent. Closes the context gap before generation.

input:
  intent_description:
    type: string
    required: true
    description: >
      Plain language description of what you are about to build.
      Be specific about the user type, the data being shown,
      and the actions available.
    example: "A worklist row showing a care gap with status,
              due date, and a Close Gap action for coordinators"

  component_type:
    type: string
    required: true
    enum: [card, row, banner, header, modal, drawer, form,
           table, list, badge, button, page, panel, other]

  domain:
    type: string
    required: true
    enum: [clinical-alerts, patient-data, care-gaps, tasks,
           navigation, data-display, forms, admin, other]

  user_type:
    type: array
    items:
      enum: [clinician, coordinator, patient, admin]
    required: true

  product_area:
    type: string
    required: false
    description: Which product this is being built for

output:
  patterns:
    type: array
    description: Ranked relevant patterns from the library
    items:
      id: string
      level: string           # 'primitive' | 'composite' | null — use this to enforce rules 22 & 25
      family_invariants:      # CSS properties frozen by this block — never override these on primitives
        type: array
        items: string
      relevance_score: number
      when: string
      not_when: string
      because: string
      confidence: number
      usage_signal: object

  canonical_block_set:
    type: array
    description: >
      Alphabetically sorted list of block IDs at or above the relevance
      threshold (plus structural inclusions). Identical for the same intent
      across threads — use this as the authoritative set of blocks to compose
      from. Do not invent blocks that are not in this set without first calling
      report_pattern.
    items:
      type: string

  primitive_guard:
    type: object
    description: >
      Lists ALL active primitive blocks in the knowledge base regardless of
      query relevance. Always present when primitives exist. These blocks have
      immutable family_invariants — they must be imported from their declared
      import_path and used as-is (hard-constraint #25). Only additive className
      classes (positioning, sizing, spacing, layout) may be passed to them
      (hard-constraint #22).
    properties:
      rule_refs: array          # references to hard-constraints.md rules 22 & 25
      instruction: string       # machine-readable directive for code generation
      primitives:
        type: array
        items:
          id: string
          import_path: string   # canonical import e.g. '@/blocks/Button/Button'
          family_invariants:    # must not be overridden via className
            type: array
            items: string

  rules:
    type: array
    description: Applicable cross-component rules
    items:
      rule_id: string
      summary: string
      applies_because: string

  ontology_refs:
    type: array
    description: Relevant concept definitions
    items:
      concept: string
      canonical_name: string
      ui_label: string
      notes: string

  safety_constraints:
    type: array
    description: Hard constraints in scope for this intent
    items:
      constraint_id: number
      rule: string
      applies_because: string

  similar_builds:
    type: array
    description: Past builds from episodic memory with similar intent
    items:
      build_id: string
      intent: string
      what_worked: string
      what_to_watch: string

  confidence:
    type: number
    description: >
      How well the genome covers this intent (0.0–1.0).
      Below 0.7 means the agent is likely to invent — flag output.

  gaps:
    type: array
    description: What the system doesn't have a pattern for yet
    items:
      type: string
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
    description: >
      Tensions between competing rules, plus any high-confidence recommended
      blocks from consult_before_build that were not imported in the output.
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
    description: >
      All violations requiring correction before the output is shippable.
      Includes hard-constraint violations, primitive violations (rules 22 & 25),
      and soft genome violations. Items with safety_block: true must be resolved
      first — they represent non-negotiable blockers.
    items:
      problem: string
      rule_violated: string
      correction: string
      safety_block: boolean   # true = blocker; false = soft fix

  primitive_violations:
    type: array
    description: >
      Subset of fix items that originate specifically from hard-constraint rules
      22 (className override of family_invariants) and 25 (primitive block
      reimplemented inline). All items here also appear in fix with
      safety_block: true. Surfaced separately so consumers can gate on primitive
      compliance independently of other fix categories.
    items:
      problem: string
      rule_violated: string   # always 'safety/hard-constraints.md rule 22' or '... rule 25'
      correction: string
      safety_block: boolean   # always true

  copy_violations:
    type: array
    description: Copy-voice and clinical language violations
    items:
      rule: string
      found: string
      correction: string

  candidate_patterns:
    type: array
    description: Novel items worth promoting to the genome
    items:
      name: string
      description: string
      promoted_to_candidates: boolean

  confidence:
    type: number
    description: >
      Overall genome compliance score (0.0–1.0). Safety-block violations
      (hard-constraint and primitive) deduct 20% each; soft fixes 10%;
      borderline and copy violations 5% each.
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

- **Flat by default, with contextual card elevation.** Shadows exist for elements that genuinely float above the page — dropdowns, modals, tooltips, popovers — and for cards that sit on a tinted/muted background where border alone doesn't provide enough separation. Buttons, inputs, rows, headers, and banners are always flat. Cards on white backgrounds stay border-driven; cards on grey/muted surfaces get `shadow-sm`; cards in expressive/onboarding flows may use `shadow-md`.
- **Borders over shadows.** A 1px border in `border-border` communicates "this is a region" without adding visual weight. When even a border feels heavy, use a background contrast shift (e.g., `bg-card` on `bg-background`). Reserve visible borders for edges that need structural definition.
- **No decorative chrome.** No gradients, inner highlights, colored glows, or inset shadows. No border-bottom tricks to simulate depth. If an element looks "designed," it's probably over-styled. The interface should feel engineered.
- **Color enters with purpose.** The resting UI is almost entirely neutral. Saturated color appears only when it carries meaning: status indicators, active/selected states, primary actions, destructive intent, or semantic feedback. Color used decoratively dilutes the meaning of color used semantically.

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
  High      → text-alert-text (#944A00) / bg-alert-light (#FFF3E6) / border-alert/30
  Medium    → text-warning-text (#987206) / bg-warning-light (#FFF8E6) / border-warning/30
  Low       → text-accent-foreground (#003374) / bg-accent (#E8F1FD) / border-accent-foreground/20

# ── STATUS COLOR FAST REFERENCE ──────────────────────────────────────────────

  Completed / Closed / Success   → text-success-text (#057A13) / bg-success-light (#E8FCE8)
  Overdue                        → text-warning-text (#987206) / bg-warning-light (#FFF8E6)
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
  space-6  24px    p-6        EntityContextHeader horizontal padding
  space-8  32px    p-8        Major section separation, panel gutters
  space-12 48px    p-12       Page-level vertical spacing (rare)
  space-16 64px    p-16       Reserved (almost never needed)

COMPONENT SPACING CONVENTIONS:
  Cards (bg-card):        p-4 (16px all sides)
  Rows (list items):      px-4 py-3.5 (16px horizontal, 14px vertical)
  Alert banners:          p-4 with gap-3 internal
  EntityContextHeader:   px-6 py-4
  Section gaps:           gap-4 (16px) between cards, gap-3 (12px) between rows
  Meta row (below title): mt-1.5 (6px), gap-3 (12px) between items
  Button groups:          gap-2 (8px) between buttons, gap-1.5 (6px) for icon buttons

  See data-density.rule.md for 32px compact row height default.
  See interface-guidelines.rule.md for shell authoring contract — agents do not control the shell.

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

19. Color is never the sole differentiator for severity, status,
    or any meaningful state. Shape, icon, or text must also
    carry the meaning. No agent may generate a component where
    color is the only signal.

20. focus-visible must never be suppressed with outline:none or
    ring-0 without an explicit visible replacement. The --ring
    token exists for this purpose.

21. Every interactive element must meet a 44×44px minimum touch
    target. This cannot be traded off for density.

## Block constraints 

22. When a Block composes another Block, the consuming Block must not pass className overrides that conflict with any CSS property listed in the composed Block's family_invariants. Only additive classes — positioning, sizing, spacing, and layout — are permitted on a child Block. To change an invariant property, the source Block's meta.yaml and component must be updated directly, only when the change is justified by a new design requirement.

23. When a primitive or composite Block's component or meta.yaml is modified, all consuming Blocks and surfaces that import or compose that Block must be reviewed and updated to reflect the change. No upstream change may be committed without verifying downstream consumers remain compliant.

24. Whenever updating the code (.tsx) for any block or surface, the meta.yaml must be checked and updated to align with the changes.Similarly, if meta.yaml is generated, the .tsx must be generated for that block. 

25. Whenever using existing blocks or surfaces, implement the .tsx code for the block or surface as is - do not reimagine the code. If major changes are required, register as a new candidate block.

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

56 ratified blocks:

- **Accordion**
- **ActionableRow**
- **ActivityLogRow**
- **Alert**
- **AlertBanner**
- **AlertDialog**
- **AssessmentTab**
- **Avatar**
- **Badge**
- **Breadcrumb**
- **Button**
- **Calendar**
- **Card**
- **Carousel**
- **Chart**
- **ChatQuickActionChip**
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
- **EntityContextHeader**
- **EntityRow**
- **Form**
- **HoverCard**
- **InlineEntityCard**
- **Input**
- **InputOTP**
- **Label**
- **NavigationMenu**
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
- **StatCard**
- **Switch**
- **Table**
- **Tabs**
- **Textarea**
- **Toggle**
- **ToggleGroup**
- **Tooltip**

---

### Accordion

#### meta.yaml
```yaml
id: Accordion
status: active
component_type: layout
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import {
  Accordion as ShadcnAccordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Accordion/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20, 21
//
// INVARIANTS (meta.yaml):
//   border-b border-border dividers between items
//   py-4 vertical padding on each item
//   font-semibold trigger text

interface AccordionItemData {
  /** Unique value used internally to track open state */
  value: string
  /** Heading text rendered in the trigger */
  title: string
  /** Content revealed when the item is expanded */
  children: React.ReactNode
}

interface AccordionProps {
  items: AccordionItemData[]
  /** "single" allows one open at a time; "multiple" allows many */
  type?: "single" | "multiple"
  /** Value of the initially open item (single mode) or items (multiple mode) */
  defaultValue?: string | string[]
  className?: string
}

export function Accordion({
  items,
  type = "single",
  defaultValue,
  className,
}: AccordionProps) {
  const accordionProps =
    type === "single"
      ? { type: "single" as const, collapsible: true, defaultValue: defaultValue as string | undefined }
      : { type: "multiple" as const, defaultValue: defaultValue as string[] | undefined }

  return (
    <ShadcnAccordion {...accordionProps} className={cn("w-full", className)}>
      {items.map((item) => (
        <AccordionItem
          key={item.value}
          value={item.value}
          className="border-b border-border py-0"
        >
          <AccordionTrigger className="py-4 font-semibold text-base hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {item.title}
          </AccordionTrigger>
          <AccordionContent className="pb-4 text-sm text-muted-foreground">
            {item.children}
          </AccordionContent>
        </AccordionItem>
      ))}
    </ShadcnAccordion>
  )
}
```

---

### ActionableRow

#### meta.yaml
```yaml
id: ActionableRow
status: active
component_type: row
level: composite
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

### ActivityLogRow

#### meta.yaml
```yaml
id: ActivityLogRow
status: active
component_type: row
level: domain
structural_family: readonly-list-row
family_invariants:
  - "Layout: flex items-center gap-3 px-4 py-3 border-b border-border/40"
  - "No action buttons — read-only display only"
  - "Status indicators use icon + colored text, not Button components"
  - "Hover: cursor-pointer if row opens detail, but no data modification on click"
confidence: 0.85
version: 1.0.0
introduced: 2026-03-20
last_evolved: 2026-03-20

summary: >
  A compact read-only row for a chronological activity log. Shows entity avatar
  (initials, tier-tinted), entity name, related item context, activity type with icon,
  outcome with colored icon and design token, actor name, and relative timestamp.
  Flagged rows (e.g. no-answer) get a left-border warning accent. Used inside
  activity log artifacts with type and outcome filters and a summary header.

when:
  - displaying a single completed activity in a chronological log
  - audit or review surface showing all activity across a user's panel
  - user needs to see what was done, what happened, and what needs follow-up

not_when:
  - scheduling or initiating new activities — this is a read-only log pattern
  - entity-scoped surfaces showing activity for a single entity — use ActionableRow
  - population-level activity metrics — use a stat/chart component

frozen:
  - "interaction: read-only display only — no action buttons, no data modification on click"
  - "density: compact row (flex items-center gap-3 px-4 py-3) — padding must not be expanded"
  - "ordering: chronological order is a parent concern — this block does not control sort or grouping"

free:
  - activityType: "any activity type label and icon"
  - outcome: "any outcome label and color token"
  - actor: "any actor name string"
  - timestamp: "any formatted timestamp string"

because: >
  Users need a fast daily audit of activity. The compact row density
  (per data-density rule) lets them scan the full day at once. Flagged left-border
  accent makes unresolved attempts visually scannable without reading every row.

usage_signal:
  renders_total: 0
  products: []
  override_rate: 0.0

embedding_hint: >
  activity log row event record chronological audit read only
  outcome type actor timestamp compact density panel filter
```

#### component.tsx
```tsx
// Canonical implementation lives in shell/artifacts/OutreachLogArtifact.tsx (ActivityLogRow)
// The full artifact (OutreachLogArtifact) is the reference surface for this pattern.
export { OutreachLogArtifact } from "../../shell/artifacts/OutreachLogArtifact"
```

---

### Alert

#### meta.yaml
```yaml
id: Alert
status: active
component_type: feedback
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import {
  Alert as ShadcnAlert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Alert/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 13, 19
//
// INVARIANTS (meta.yaml):
//   rounded-lg border
//   p-4 internal padding
//   gap-3 icon-to-text spacing

interface AlertProps {
  title?: string
  children: React.ReactNode
  /** Icon rendered to the left of the text content */
  icon?: React.ReactNode
  variant?: "default" | "destructive"
  className?: string
}

export function Alert({
  title,
  children,
  icon,
  variant = "default",
  className,
}: AlertProps) {
  return (
    <ShadcnAlert
      variant={variant}
      className={cn(
        "rounded-lg border p-4",
        variant === "default" && "border-border",
        variant === "destructive" && "border-destructive text-destructive",
        className,
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <div className="flex flex-col gap-1">
        {title && <AlertTitle className="font-semibold text-base">{title}</AlertTitle>}
        <AlertDescription className="text-sm text-muted-foreground">
          {children}
        </AlertDescription>
      </div>
    </ShadcnAlert>
  )
}
```

---

### AlertBanner

#### meta.yaml
```yaml
id: AlertBanner
status: active
component_type: banner
level: composite
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

#### component.tsx
```tsx
import { AlertOctagon, AlertTriangle, AlertCircle, Info, X, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@blocks/Button/component"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/AlertBanner/meta.yaml
// Safety:   safety/severity-schema.yaml (single source of truth for severity tokens)
//           safety/hard-constraints.md rules 1, 5, 6
//
// HARD CONSTRAINTS:
//   Rule 1: --severity-critical (--destructive) reserved exclusively for Critical.
//   Rule 5: Critical alerts cannot be dismissed. Only Acknowledge and Escalate.
//   Rule 6: High severity dismissal is use-case defined but must be intentional + reversible.
//
// SEVERITY TOKEN MAP (severity-schema.yaml):
//   critical → bg-destructive/10 + border-destructive    + text-destructive  | icon: alert-octagon
//   high     → bg-[var(--alert-light)] + border-alert/30 + text-alert        | icon: alert-triangle
//   medium   → bg-[var(--warning-light)] + border-warning/30 + text-warning  | icon: alert-circle
//   low      → bg-accent + border-accent-foreground/20   + text-accent-fg    | icon: info
//
// AUDIT: severity-schema marks critical/high/medium as audit_required: true.
// Pass onAuditEvent to capture Acknowledge and Dismiss events for your audit system.

type Severity = "critical" | "high" | "medium" | "low"

const SEVERITY_CONFIG = {
  critical: {
    // --destructive = Red = Critical severity
    containerClass: "bg-destructive/10 border-l-4 border-destructive",
    iconClass:      "text-destructive",
    titleClass:     "text-destructive",
    bodyClass:      "text-destructive/80",
    Icon:                   AlertOctagon,
    canDismiss:             false,   // hard-constraint rule 5
    requiresAcknowledge:    true,
    auditRequired:          true,    // severity-schema.yaml audit_required
  },
  high: {
    // --alert = Orange = High severity
    containerClass: "bg-[var(--alert-light)] border-l-4 border-alert",
    iconClass:      "text-alert",
    titleClass:     "text-alert",
    bodyClass:      "text-alert/80",
    Icon:                   AlertTriangle,
    canDismiss:             true,    // with reason per severity-schema permitted_actions
    requiresAcknowledge:    true,
    auditRequired:          true,
  },
  medium: {
    // --warning = Yellow = Medium severity
    containerClass: "bg-[var(--warning-light)] border-l-4 border-warning",
    iconClass:      "text-warning",
    titleClass:     "text-warning",
    bodyClass:      "text-warning/80",
    Icon:                   AlertCircle,
    canDismiss:             true,
    requiresAcknowledge:    false,
    auditRequired:          true,
  },
  low: {
    // --accent (blue tint) = Low severity / informational
    // border-accent-foreground/20 per severity-schema.yaml (not /30)
    containerClass: "bg-accent border-l-4 border-accent-foreground/20",
    iconClass:      "text-accent-foreground",
    titleClass:     "text-accent-foreground",
    bodyClass:      "text-accent-foreground/80",
    Icon:                   Info,
    canDismiss:             true,
    requiresAcknowledge:    false,
    auditRequired:          false,
  },
} as const

interface AlertBannerProps {
  severity: Severity
  title: string
  body?: string
  // Optional context label displayed above the title (e.g. entity name)
  contextLabel?: string
  // triggeredAt: absolute timestamp required (hard-constraint rule 11)
  triggeredAt?: string
  // Required for critical + high (meta.yaml critical_rules)
  onAcknowledge?: () => void
  onEscalate?: () => void
  // Dismiss: forbidden on critical. For high: use-case defined with reason.
  onDismiss?: () => void
  // Audit hook — called with event type on acknowledge/dismiss for audit_required severities
  onAuditEvent?: (event: "acknowledged" | "dismissed" | "escalated", severity: Severity) => void
  className?: string
}

export function AlertBanner({
  severity,
  title,
  body,
  contextLabel,
  triggeredAt,
  onAcknowledge,
  onEscalate,
  onDismiss,
  onAuditEvent,
  className,
}: AlertBannerProps) {
  const config = SEVERITY_CONFIG[severity]
  const { Icon } = config

  if (process.env.NODE_ENV === "development") {
    if (config.requiresAcknowledge && !onAcknowledge) {
      console.error(
        `AlertBanner: severity="${severity}" requires onAcknowledge. ` +
        `See safety/hard-constraints.md rule 5 and safety/severity-schema.yaml.`
      )
    }
  }

  const handleAcknowledge = () => {
    onAuditEvent?.("acknowledged", severity)
    onAcknowledge?.()
  }

  const handleDismiss = () => {
    onAuditEvent?.("dismissed", severity)
    onDismiss?.()
  }

  const handleEscalate = () => {
    onAuditEvent?.("escalated", severity)
    onEscalate?.()
  }

  return (
    <div
      role="alert"
      aria-live={severity === "critical" ? "assertive" : "polite"}
      aria-atomic="true"
      className={cn(
        "flex gap-3 p-4 rounded-r-md",
        config.containerClass,
        className
      )}
    >
      <Icon
        className={cn("h-5 w-5 flex-shrink-0 mt-1", config.iconClass)}
        aria-hidden="true"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            {/* Optional context label */}
            {contextLabel && (
              <p className={cn("text-sm font-semibold mb-1", config.bodyClass)}>
                {contextLabel}
              </p>
            )}
            <p className={cn("text-base font-semibold", config.titleClass)}>
              {title}
            </p>
            {body && (
              <p className={cn("text-base mt-1", config.bodyClass)}>
                {body}
              </p>
            )}
            {/* Absolute timestamp required — hard-constraint rule 11 */}
            {triggeredAt && (
              <p className={cn("text-sm mt-1 opacity-70", config.bodyClass)}>
                {triggeredAt}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {onEscalate && (
              <Button
                variant="transparent"
                size="sm"
                onClick={handleEscalate}
                leftIcon={<ArrowUpRight className="h-3 w-3" aria-hidden="true" />}
                className={config.bodyClass}
              >
                Escalate
              </Button>
            )}

            {config.requiresAcknowledge && onAcknowledge && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAcknowledge}
                className="bg-card"
              >
                Acknowledge
              </Button>
            )}

            {/* Dismiss is forbidden on critical (hard-constraint rule 5) */}
            {config.canDismiss && onDismiss && (
              <Button
                variant="transparent"
                size="sm"
                onClick={handleDismiss}
                iconOnly
                className={config.bodyClass}
                aria-label="Dismiss alert"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

### AlertDialog

#### meta.yaml
```yaml
id: AlertDialog
status: active
component_type: overlay
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import {
  AlertDialog as ShadcnAlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@blocks/Button/component"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/AlertDialog/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 9, 14, 16, 17, 18, 21
//
// INVARIANTS (meta.yaml):
//   rounded-lg shadow-lg container
//   z-40 dialog layer, z-30 backdrop overlay
//   Cancel action always present
//
// COPY RULES:
//   Header states consequence — NEVER "Are you sure?" (rule 16)
//   Action label matches consequence (rule 16)
//   Secondary button says "Close" not "Cancel" (rule 17)

interface AlertDialogProps {
  /** Trigger element that opens the dialog */
  trigger: React.ReactNode
  /** Consequence-describing title — never "Are you sure?" */
  title: string
  /** Supporting description of what will happen */
  description: string
  /** Label for the confirm action — must match the consequence */
  actionLabel: string
  onAction: () => void
  /** Use "destructive" for delete/remove actions */
  variant?: "destructive" | "default"
  className?: string
}

export function AlertDialog({
  trigger,
  title,
  description,
  actionLabel,
  onAction,
  variant = "destructive",
  className,
}: AlertDialogProps) {
  return (
    <ShadcnAlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent
        className={cn("rounded-lg shadow-lg z-40", className)}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold text-foreground">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {/* Rule 17: secondary button says "Close" not "Cancel" */}
          <AlertDialogCancel asChild>
            <Button variant="outline">{/* Rule 17 */}Close</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild onClick={onAction}>
            <Button variant={variant === "destructive" ? "destructive" : "primary"}>
              {actionLabel}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </ShadcnAlertDialog>
  )
}
```

---

### AssessmentTab

#### meta.yaml
```yaml
id: AssessmentTab
status: active
component_type: form
level: domain
structural_family: assessment-form
family_invariants:
  - "Instrument questions are verbatim — never paraphrased or shortened"
  - "Submit disabled until all required questions answered"
  - "Score and results not shown until at least one answer recorded"
  - "Self-harm or critical indicator question: trigger Review badge on any non-zero answer"
  - "Never navigate away on submit — show inline success/results state"
confidence: 0.85
version: 1.0.0
introduced: 2026-03-20
last_evolved: 2026-03-20

summary: >
  A two-view assessment component for any structured screening instrument within
  an entity-scoped surface. View 1: questionnaire with domain-organized questions
  and structured responses (radio pills). View 2: per-domain results with need level
  indicators (flagged/clear/not screened), Create Task CTA on flagged domains, and
  Re-screen action. Integrates into an entity detail artifact as a tab.

when:
  - administering a structured assessment or questionnaire within an entity-scoped surface
  - user needs to record and act on assessment results
  - displaying assessment results with per-domain flagged status and follow-up actions

not_when:
  - population-level assessment summary counts — use a stat/metric component
  - read-only display of a single assessment data point — use Badge
  - outside an entity-scoped surface (EntityContextHeader must be present above)

because: >
  Structured assessments directly affect outcomes and workflow closure rates. Users
  need a fast, structured way to screen and act without leaving entity context. The
  two-view design (form → results) avoids re-entry and surfaces actionable tasks
  immediately on flagged domains.

actions_available:
  - Start Assessment (when no assessment on file)
  - Save Assessment (completes the form, transitions to results view)
  - Create Task (per flagged domain in results view)
  - Re-screen (from results view, resets form)

usage_signal:
  renders_total: 0
  products: []
  override_rate: 0.0

embedding_hint: >
  assessment tab questionnaire screening form domains results
  flagged needs identified summary task create re-screen
  two-view form results structured instrument entity detail
```

#### component.tsx
```tsx
// Canonical implementation lives in shell/artifacts/SdohAssessmentTab.tsx
// This re-export makes the pattern discoverable from blocks/ like all other genome blocks.
export { SdohAssessmentTab } from "../../shell/artifacts/SdohAssessmentTab"
```

---

### Avatar

#### meta.yaml
```yaml
id: Avatar
status: active
component_type: data-display
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import {
  Avatar as ShadcnAvatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Avatar/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rule 19
//
// INVARIANTS (meta.yaml):
//   rounded-full always
//   bg-muted fallback background
//   text-muted-foreground fallback text color

type AvatarSize = "sm" | "md" | "lg"

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-10 w-10 text-base",
}

/** Extracts up to two initials from a display name */
function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

interface AvatarProps {
  /** Display name used for fallback initials and alt text */
  name: string
  /** URL to the avatar image */
  src?: string
  size?: AvatarSize
  className?: string
}

export function Avatar({
  name,
  src,
  size = "md",
  className,
}: AvatarProps) {
  return (
    <ShadcnAvatar
      className={cn(
        "rounded-full",
        SIZE_CLASSES[size],
        className,
      )}
    >
      {src && <AvatarImage src={src} alt={name} />}
      <AvatarFallback className="rounded-full bg-muted text-muted-foreground font-semibold">
        {getInitials(name)}
      </AvatarFallback>
    </ShadcnAvatar>
  )
}
```

---

### Badge

#### meta.yaml
```yaml
id: Badge
status: active
component_type: data-display
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import { Badge as ShadcnBadge } from "@/components/ui/badge"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Badge/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rule 19
//
// INVARIANTS (meta.yaml):
//   rounded-full pill shape
//   text-sm font-semibold
//   px-2.5 py-0.5 compact padding
//   inline-flex items-center
//
// Rule 19: color never sole differentiator — text label always present.

type BadgeColor = "blue" | "red" | "yellow" | "orange" | "green" | "grey"

interface BadgeProps {
  children: React.ReactNode
  color?: BadgeColor
  /** When true, renders a small dot before the label */
  dot?: boolean
  className?: string
}

const dotColorMap: Record<BadgeColor, string> = {
  blue:   "bg-primary",
  red:    "bg-destructive",
  yellow: "bg-warning-text",
  orange: "bg-alert-text",
  green:  "bg-success-text",
  grey:   "bg-muted-foreground",
}

export function Badge({
  children,
  color = "blue",
  dot = false,
  className,
}: BadgeProps) {
  return (
    <ShadcnBadge
      badgeColor={color}
      badgeStyle="subtle"
      className={cn(
        "rounded-full text-sm font-semibold px-2.5 py-0.5 inline-flex items-center gap-1.5",
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            "shrink-0 size-1.5 rounded-full",
            dotColorMap[color],
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </ShadcnBadge>
  )
}
```

---

### Breadcrumb

#### meta.yaml
```yaml
id: Breadcrumb
status: active
component_type: navigation
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import {
  Breadcrumb as ShadcnBreadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Breadcrumb/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20, 21
//
// INVARIANTS (meta.yaml):
//   text-sm text-muted-foreground for inactive items
//   / separator between levels
//   gap-1.5 between items
//   last item text-foreground (current page)

interface BreadcrumbSegment {
  label: string
  /** href for navigable segments; omit for the current page (last item) */
  href?: string
}

interface BreadcrumbProps {
  segments: BreadcrumbSegment[]
  /** Max visible segments before collapsing middle items (default 5) */
  maxVisible?: number
  className?: string
}

export function Breadcrumb({
  segments,
  maxVisible = 5,
  className,
}: BreadcrumbProps) {
  const shouldCollapse = segments.length > maxVisible
  const visibleSegments = shouldCollapse
    ? [segments[0], ...segments.slice(-(maxVisible - 2))]
    : segments

  return (
    <ShadcnBreadcrumb className={cn(className)}>
      <BreadcrumbList className="gap-1.5 text-sm">
        {visibleSegments.map((segment, index) => {
          const isLast = index === visibleSegments.length - 1
          const showEllipsis = shouldCollapse && index === 1

          return (
            <span key={segment.label} className="inline-flex items-center gap-1.5">
              {index > 0 && <BreadcrumbSeparator>/</BreadcrumbSeparator>}
              {showEllipsis && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbEllipsis />
                  </BreadcrumbItem>
                  <BreadcrumbSeparator>/</BreadcrumbSeparator>
                </>
              )}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="text-foreground font-semibold">
                    {segment.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    href={segment.href}
                    className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    {segment.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          )
        })}
      </BreadcrumbList>
    </ShadcnBreadcrumb>
  )
}
```

---

### Button

#### meta.yaml
```yaml
id: Button
status: active
component_type: action
level: primitive
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
  - toggle or selection (use Toggle or Checkbox)
  - icon-only action without accessible label (add aria-label)

variants:
  primary: bg-primary, flat fill, single primary CTA per surface
  destructive: bg-destructive, flat fill, delete and remove actions only
  basic: bg-foreground/6%, subtle tinted fill for secondary actions
  outline: border-border, transparent bg, for tertiary actions
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

key_rules:
  - only one primary CTA per surface (rule 14)
  - destructive type only for delete/remove actions
  - label never wraps (rule 18)
  - disabled state reduces opacity, not contrast
  - icon-only buttons must have aria-label for accessibility
  - focus ring uses primary/40 for all types except destructive which uses destructive/40

embedding_hint: >
  button cta action trigger submit primary destructive basic
  outline transparent link click icon left right small large
  hover pressed focused disabled state flat linear scale
```

#### component.tsx
```tsx
import React from "react"
import { cn } from "@/lib/utils"
import { Button as ShadcnButton } from "@/components/ui/button"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Button/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 14, 18, 20
//
// INVARIANTS (meta.yaml):
//   rounded-md border radius
//   whitespace-nowrap — label never wraps (rule 18)
//   focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 (rule 20)
//
// Rule 14: only one primary CTA visible per surface.

type ButtonVariant = "primary" | "destructive" | "basic" | "outline" | "transparent" | "link"
type ButtonSize = "sm" | "default" | "lg"

const VARIANT_MAP: Record<ButtonVariant, string> = {
  primary: "default",
  destructive: "destructive",
  basic: "secondary",
  outline: "outline",
  transparent: "ghost",
  link: "link",
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Icon rendered before the label */
  leftIcon?: React.ReactNode
  /** Icon rendered after the label */
  rightIcon?: React.ReactNode
  /** Renders as a square icon-only button — children should be a single icon */
  iconOnly?: boolean
  /** Renders as a child element (e.g., anchor) instead of button */
  asChild?: boolean
  className?: string
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "default",
      leftIcon,
      rightIcon,
      iconOnly = false,
      asChild = false,
      className,
      children,
      ...props
    },
    ref,
  ) {
    const shadcnVariant = VARIANT_MAP[variant]
    const shadcnSize = iconOnly
      ? size === "sm" ? "icon-sm" : size === "lg" ? "icon-lg" : "icon"
      : size

    return (
      <ShadcnButton
        ref={ref}
        variant={shadcnVariant as any}
        size={shadcnSize as any}
        asChild={asChild}
        className={cn(
          "rounded-md whitespace-nowrap",
          "focus-visible:outline-none focus-visible:ring-2",
          className,
        )}
        {...props}
      >
        {iconOnly ? (
          children
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </ShadcnButton>
    )
  },
)
```

---

### Calendar

#### meta.yaml
```yaml
id: Calendar
status: active
component_type: data-display
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar"
import type { DayPickerSingleProps } from "react-day-picker"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Calendar/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20, 21
//
// INVARIANTS (meta.yaml):
//   rounded-md container
//   p-3 internal padding
//   text-sm date labels
//   today ring-accent indicator
//   selected bg-primary text-primary-foreground
//
// tabular-nums on day cells for alignment.

interface CalendarProps {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  /** Dates that should be disabled / non-selectable */
  disabled?: DayPickerSingleProps["disabled"]
  className?: string
}

export function Calendar({
  selected,
  onSelect,
  disabled,
  className,
}: CalendarProps) {
  return (
    <ShadcnCalendar
      mode="single"
      selected={selected}
      onSelect={onSelect}
      disabled={disabled}
      className={cn("rounded-md p-3", className)}
      classNames={{
        day: "tabular-nums text-sm",
        day_today: "ring-1 ring-accent",
        day_selected: "bg-primary text-primary-foreground",
        day_outside: "text-muted-foreground opacity-50",
      }}
    />
  )
}
```

---

### Card

#### meta.yaml
```yaml
id: Card
status: active
component_type: layout
level: primitive
structural_family: content-container
family_invariants:
  - "rounded-lg border border-subtle bg-card"
  - "shadow-sm when on muted/tinted background, no shadow on white background"
  - "p-4 content padding"
confidence: 0.85
version: 1.0.0

summary: >
  Surface container for grouping related content with optional header,
  content body, and footer sections. Wraps shadcn Card with project
  shadow tokens and enforced nesting rules.

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
  - hover uses bg-foreground/[0.04], active adds scale-[0.97] + bg-foreground/[0.08]
  - selected state uses bg-primary/10 border-primary/30
  - disabled state uses opacity-50 pointer-events-none
  - no nested cards
  - never use shadow transitions for hover — background color shift only

embedding_hint: >
  card container surface panel tile group
  content section box wrapper
```

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import {
  Card as ShadcnCard,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Card/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20, 21
//
// INVARIANTS (meta.yaml):
//   rounded-lg border border-subtle bg-card
//   shadow-sm when on muted/tinted background, no shadow on white background
//   p-4 content padding
//
// Elevation (styling-tokens.rule.md):
//   flat       — no shadow, border-driven (white-on-white)
//   shadow-sm  — card-raised, on muted/grey parent
//   shadow-md  — card-express, onboarding/expressive flows
//
// State feedback (styling-tokens.rule.md):
//   hover:    bg-foreground/[0.04]
//   active:   bg-foreground/[0.08]
//   focused:  ring-2 ring-ring ring-offset-1
//   selected: border-2 border-primary
//   disabled: opacity-50, pointer-events-none, no shadow, border border-subtle
//
// No nested cards permitted.

type CardElevation = "flat" | "sm" | "md"

interface CardProps {
  title?: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  /** Shadow elevation: "flat" (no shadow), "sm" (raised), "md" (expressive) */
  elevation?: CardElevation
  /** Makes the card interactive with hover/active/focus states */
  onClick?: () => void
  /** Renders the card in a selected state (2px primary border) */
  selected?: boolean
  /** Disables the card (50% opacity, no interaction) */
  disabled?: boolean
  className?: string
}

const elevationClass: Record<CardElevation, string> = {
  flat: "",
  sm: "shadow-sm",
  md: "shadow-md",
}

export function Card({
  title,
  description,
  children,
  footer,
  elevation = "flat",
  onClick,
  selected = false,
  disabled = false,
  className,
}: CardProps) {
  const isInteractive = !!onClick && !disabled

  return (
    <ShadcnCard
      role={onClick ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={isInteractive ? (e) => e.key === "Enter" && onClick() : undefined}
      aria-disabled={disabled || undefined}
      aria-selected={selected || undefined}
      className={cn(
        "rounded-lg bg-card",
        disabled
          ? "border border-subtle opacity-50 pointer-events-none"
          : elevation === "flat"
            ? "border border-subtle"
            : elevationClass[elevation],
        selected && !disabled && "border-2 border-primary",
        isInteractive && [
          "cursor-pointer transition-colors",
          "hover:bg-foreground/[0.04]",
          "active:bg-foreground/[0.08]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        ],
        className,
      )}
    >
      {(title || description) && (
        <CardHeader className="p-4 pb-0">
          {title && <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>}
          {description && <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="p-4">{children}</CardContent>
      {footer && <CardFooter className="p-4 pt-0">{footer}</CardFooter>}
    </ShadcnCard>
  )
}
```

---

### Carousel

#### meta.yaml
```yaml
id: Carousel
status: active
component_type: layout
level: composite
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

#### component.tsx
```tsx
import * as React from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Carousel as CarouselRoot,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from "@/components/ui/carousel"
import { Button } from "@blocks/Button/component"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Carousel/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20, 21
//
// INVARIANTS (meta.yaml):
//   Container: overflow-hidden relative
//   Prev/Next buttons: outline iconOnly Button block, h-8 w-8 shadow-sm
//   Items: gap-4 between slides

interface CarouselFrameProps {
  /** Array of content nodes, each rendered as a slide */
  items: React.ReactNode[]
  /** Basis class for each item (e.g., "basis-1/3" for 3-up) */
  itemBasis?: string
  /** Enable or disable drag interaction */
  draggable?: boolean
  /** Carousel orientation */
  orientation?: "horizontal" | "vertical"
  className?: string
}

export function CarouselFrame({
  items,
  itemBasis = "basis-full",
  draggable = true,
  orientation = "horizontal",
  className,
}: CarouselFrameProps) {
  return (
    <CarouselRoot
      opts={{
        align: "start",
        dragFree: draggable,
      }}
      orientation={orientation}
      className={cn("w-full", className)}
    >
      <CarouselContent className="-ml-4">
        {items.map((item, index) => (
          <CarouselItem key={index} className={cn("pl-4", itemBasis)}>
            {item}
          </CarouselItem>
        ))}
      </CarouselContent>

      {/* Navigation buttons — 44px touch targets (rule 21) */}
      <CarouselNavButton direction="prev" orientation={orientation} />
      <CarouselNavButton direction="next" orientation={orientation} />
    </CarouselRoot>
  )
}

function CarouselNavButton({
  direction,
  orientation,
}: {
  direction: "prev" | "next"
  orientation: "horizontal" | "vertical"
}) {
  const { scrollPrev, scrollNext, canScrollPrev, canScrollNext } = useCarousel()
  const isPrev = direction === "prev"

  return (
    <Button
      variant="outline"
      iconOnly
      onClick={isPrev ? scrollPrev : scrollNext}
      disabled={isPrev ? !canScrollPrev : !canScrollNext}
      aria-label={isPrev ? "Previous slide" : "Next slide"}
      className={cn(
        "absolute h-8 w-8 shadow-sm bg-background",
        "min-w-[44px] min-h-[44px]",
        orientation === "horizontal"
          ? isPrev
            ? "-left-12 top-1/2 -translate-y-1/2"
            : "-right-12 top-1/2 -translate-y-1/2"
          : isPrev
            ? "-top-12 left-1/2 -translate-x-1/2 rotate-90"
            : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90"
      )}
    >
      {isPrev ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
    </Button>
  )
}

// Re-export primitives for custom composition
export { CarouselContent, CarouselItem }
```

---

### Chart

#### meta.yaml
```yaml
id: Chart
status: active
component_type: data-display
level: composite
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

#### component.tsx
```tsx
import * as React from "react"
import { cn } from "@/lib/utils"
import { Card } from "@blocks/Card/component"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Chart/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 19, 20
//
// INVARIANTS (meta.yaml):
//   Container: Card block with elevation prop — no local card styling
//   Labels/axes: text-sm text-muted-foreground
//   Responsive width via ChartContainer

interface ChartFrameProps {
  /** Chart title displayed above the visualization */
  title?: string
  /** Optional description below the title */
  description?: string
  /** Recharts chart config mapping series keys to labels and colors */
  config: ChartConfig
  /** Shadow elevation */
  elevation?: "flat" | "sm" | "md"
  /** Chart height in pixels */
  height?: number
  /** Recharts chart elements (e.g., BarChart, LineChart with children) */
  children: React.ReactNode
  className?: string
}

export function ChartFrame({
  title,
  description,
  config,
  elevation = "flat",
  height = 300,
  children,
  className,
}: ChartFrameProps) {
  return (
    <Card elevation={elevation} className={className}>
      {(title || description) && (
        <div className="mb-4 flex flex-col gap-1">
          {title && (
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      <ChartContainer config={config} className="w-full" style={{ height }}>
        {children}
      </ChartContainer>
    </Card>
  )
}

// Re-export chart primitives for composition
export {
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
}
```

---

### ChatQuickActionChip

#### meta.yaml
```yaml
id: ChatQuickActionChip
status: active
component_type: button
level: domain
structural_family: quick-action-chip
family_invariants:
  - "Shape: rounded-full border border-border/70 hover:border-primary/50"
  - "Triggers inline card in Panel 2 only — never opens artifact tab"
  - "Read-only triggers — chips never modify data directly"
  - "Maximum ~4 chips in strip before needing command palette"
confidence: 0.85
version: 1.0.0
introduced: 2026-03-20
last_evolved: 2026-03-20

summary: >
  A persistent strip of pill-shaped chip buttons rendered above the chat input in
  Panel 2. Each chip is a one-tap shortcut that injects a structured assistant
  response inline in the conversation — no artifact tab is opened. The chip style
  is rounded-full, border-border/70, hover:border-primary/50. The
  triggered response is an assistant message with a text lead and an InlineCard
  attached below it.

when:
  - adding a one-tap shortcut for a frequently-needed data lookup in Panel 2
  - the data to surface is compact enough to fit in an inline card (not a full artifact)
  - user needs the answer in conversation flow without context-switching

not_when:
  - the data requires a full list, table, or multi-record view — open an artifact tab instead
  - the action modifies data — chips are read-only triggers
  - more than ~4 chips (strip becomes unwieldy — consider a command palette instead)

because: >
  Panel 2 is the primary navigation instrument. Chips let users surface
  structured context without typing a query or leaving the conversation flow. They
  complement — not replace — full artifact tabs.

usage_signal:
  renders_total: 0
  products: []
  override_rate: 0.0

embedding_hint: >
  chat chip quick action shortcut pill button panel 2 inline card conversation
  one tap lookup structured response data entity
  no artifact tab chat input strip persistent
```

#### component.tsx
```tsx
// Canonical implementation lives in shell/panels/ChatPanel.tsx
// The chip strip and handleXxxChip handlers are the reference implementation.
// See also: blocks/InlineEntityCard/ for the card triggered by each chip.
export { ChatPanel } from "../../shell/panels/ChatPanel"
```

---

### Checkbox

#### meta.yaml
```yaml
id: Checkbox
status: active
component_type: input
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import { Checkbox as ShadcnCheckbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Checkbox/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 13, 20, 21
//
// INVARIANTS (meta.yaml):
//   h-4 w-4 rounded-sm border border-subtle
//   checked bg-primary
//   focus-visible:ring-2
//
// Rule 13: error state uses border-destructive, NOT --severity-critical.
// Rule 21: 44px touch target on label+checkbox combined.

interface CheckboxProps {
  id: string
  label: string
  checked?: boolean
  /** Indeterminate state for partial group selections */
  indeterminate?: boolean
  onCheckedChange?: (checked: boolean) => void
  /** Shows destructive border for validation errors (rule 13) */
  error?: boolean
  disabled?: boolean
  className?: string
}

export function Checkbox({
  id,
  label,
  checked,
  indeterminate,
  onCheckedChange,
  error = false,
  disabled = false,
  className,
}: CheckboxProps) {
  return (
    <div className={cn("flex items-center gap-3 min-h-[44px]", className)}>
      <ShadcnCheckbox
        id={id}
        checked={indeterminate ? "indeterminate" : checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          "h-4 w-4 rounded-sm border border-subtle",
          "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          error && "border-destructive",
        )}
      />
      <Label
        htmlFor={id}
        className={cn(
          "text-sm cursor-pointer select-none",
          disabled && "opacity-50 cursor-not-allowed",
          error && "text-destructive",
        )}
      >
        {label}
      </Label>
    </div>
  )
}
```

---

### Collapsible

#### meta.yaml
```yaml
id: Collapsible
status: active
component_type: layout
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import {
  Collapsible as ShadcnCollapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Collapsible/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20, 21
//
// INVARIANTS (meta.yaml):
//   No visual border by default
//   Trigger is any element
//   Content animated open/close
//
// Trigger must be keyboard accessible with aria-expanded.

interface CollapsibleProps {
  /** Element that toggles the collapsible — must be keyboard accessible */
  trigger: React.ReactNode
  children: React.ReactNode
  /** Controlled open state */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Default open state for uncontrolled usage */
  defaultOpen?: boolean
  className?: string
}

export function Collapsible({
  trigger,
  children,
  open,
  onOpenChange,
  defaultOpen = false,
  className,
}: CollapsibleProps) {
  return (
    <ShadcnCollapsible
      open={open}
      onOpenChange={onOpenChange}
      defaultOpen={defaultOpen}
      className={cn(className)}
    >
      <CollapsibleTrigger asChild>{trigger}</CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        {children}
      </CollapsibleContent>
    </ShadcnCollapsible>
  )
}
```

---

### Combobox

#### meta.yaml
```yaml
id: Combobox
status: active
component_type: action
level: composite
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

#### component.tsx
```tsx
import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@blocks/Button/component"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Combobox/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 13, 20, 21
//
// INVARIANTS (meta.yaml):
//   Trigger: h-9 rounded-md border border-subtle px-3
//   Popover: rounded-md shadow-md z-20
//   Items: py-1.5 px-2 rounded-sm

interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  /** Search input placeholder inside the popover */
  searchPlaceholder?: string
  /** When true, applies border-destructive to the trigger (rule 13) */
  hasError?: boolean
  disabled?: boolean
  className?: string
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  hasError = false,
  disabled = false,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const selectedLabel = options.find((o) => o.value === value)?.label

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-9 w-full justify-between border border-subtle px-3 text-sm font-normal",
            !value && "text-muted-foreground",
            hasError && "border-destructive",
            className
          )}
        >
          <span className="truncate">{selectedLabel ?? placeholder}</span>
          <div className="flex items-center gap-1 shrink-0">
            {value && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear selection"
                className="rounded-sm p-0.5 hover:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation()
                  onValueChange("")
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation()
                    onValueChange("")
                  }
                }}
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 rounded-md shadow-md z-20"
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-9 text-sm" />
          <CommandList>
            <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">
              No results found.
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onValueChange(option.value)
                    setOpen(false)
                  }}
                  className="py-1.5 px-2 rounded-sm min-h-[44px] flex items-center gap-2 cursor-pointer"
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span>{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
```

---

### Command

#### meta.yaml
```yaml
id: Command
status: active
component_type: action
level: composite
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import {
  Command as CommandRoot,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Command/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20, 21
//
// INVARIANTS (meta.yaml):
//   Container: rounded-lg shadow-lg z-40 border border-border bg-card
//   Input: h-10 border-b px-3 text-sm
//   Item: py-2 px-3 rounded-md

interface CommandAction {
  /** Unique identifier for the action */
  id: string
  label: string
  /** Optional icon rendered before the label */
  icon?: React.ReactNode
  onSelect: () => void
  /** Keywords for search matching beyond the visible label */
  keywords?: string[]
}

interface CommandGroup {
  heading: string
  actions: CommandAction[]
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groups: CommandGroup[]
  /** Placeholder text for the search input */
  placeholder?: string
  className?: string
}

export function CommandPalette({
  open,
  onOpenChange,
  groups,
  placeholder = "Type a command or search...",
  className,
}: CommandPaletteProps) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandRoot
        className={cn(
          "rounded-lg border border-border bg-card shadow-lg",
          className
        )}
      >
        <CommandInput
          placeholder={placeholder}
          className="h-10 border-b px-3 text-sm"
        />
        <CommandList>
          <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
            No results found.
          </CommandEmpty>
          {groups.map((group, i) => (
            <div key={group.heading}>
              {i > 0 && <CommandSeparator />}
              <CommandGroup heading={group.heading}>
                {group.actions.map((action) => (
                  <CommandItem
                    key={action.id}
                    value={action.label}
                    keywords={action.keywords}
                    onSelect={action.onSelect}
                    className="py-2 px-3 rounded-md min-h-[44px] flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {action.icon}
                    <span>{action.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          ))}
        </CommandList>
      </CommandRoot>
    </CommandDialog>
  )
}
```

---

### ContextMenu

#### meta.yaml
```yaml
id: ContextMenu
status: active
component_type: overlay
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import {
  ContextMenu as ShadcnContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/ContextMenu/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 9, 20, 21
//
// INVARIANTS (meta.yaml):
//   rounded-md shadow-md z-20
//   bg-popover text-popover-foreground
//   py-1 item padding
//   min-w-[8rem]
//
// Actions in context menu must also be reachable through other UI paths.

interface ContextMenuItemData {
  label: string
  onSelect: () => void
  /** Renders item with text-destructive for delete/remove actions */
  destructive?: boolean
  disabled?: boolean
  /** Optional icon rendered before the label */
  icon?: React.ReactNode
}

interface ContextMenuGroup {
  items: ContextMenuItemData[]
}

interface ContextMenuProps {
  /** Element that receives the right-click trigger */
  children: React.ReactNode
  /** Groups of items — separators are rendered between groups */
  groups: ContextMenuGroup[]
  className?: string
}

export function ContextMenu({
  children,
  groups,
  className,
}: ContextMenuProps) {
  return (
    <ShadcnContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent
        className={cn(
          "rounded-md shadow-md z-20 bg-popover text-popover-foreground min-w-[8rem]",
          className,
        )}
      >
        {groups.map((group, groupIndex) => (
          <div key={groupIndex}>
            {groupIndex > 0 && <ContextMenuSeparator />}
            {group.items.map((item) => (
              <ContextMenuItem
                key={item.label}
                onSelect={item.onSelect}
                disabled={item.disabled}
                className={cn(
                  "py-1 text-sm cursor-pointer min-h-[44px] flex items-center gap-2",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  item.destructive && "text-destructive focus:text-destructive",
                )}
              >
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                {item.label}
              </ContextMenuItem>
            ))}
          </div>
        ))}
      </ContextMenuContent>
    </ShadcnContextMenu>
  )
}
```

---

### DataTable

#### meta.yaml
```yaml
id: DataTable
status: active
component_type: data-display
level: composite
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

#### component.tsx
```tsx
import * as React from "react"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@blocks/Button/component"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/DataTable/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 19, 20, 21
//
// INVARIANTS (meta.yaml):
//   Container: w-full rounded-lg border border-border overflow-hidden
//   Header: sticky top-0 bg-muted/50 text-sm font-medium text-muted-foreground
//   Footer: border-t px-4 py-3 with pagination

type SortDirection = "asc" | "desc" | null

interface ColumnDef<T> {
  id: string
  header: string
  /** Accessor function to get cell value from row data */
  accessor: (row: T) => React.ReactNode
  /** When true, column content uses tabular-nums and right alignment */
  numeric?: boolean
  /** When true, column header is clickable for sorting */
  sortable?: boolean
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  /** Unique key extractor for each row */
  rowKey: (row: T) => string
  /** Current page (1-indexed) */
  page?: number
  /** Total number of pages */
  pageCount?: number
  onPageChange?: (page: number) => void
  onSort?: (columnId: string, direction: SortDirection) => void
  className?: string
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  page = 1,
  pageCount = 1,
  onPageChange,
  onSort,
  className,
}: DataTableProps<T>) {
  const [sortState, setSortState] = React.useState<{
    columnId: string | null
    direction: SortDirection
  }>({ columnId: null, direction: null })

  function handleSort(columnId: string) {
    const next: SortDirection =
      sortState.columnId === columnId
        ? sortState.direction === "asc"
          ? "desc"
          : sortState.direction === "desc"
            ? null
            : "asc"
        : "asc"
    setSortState({ columnId: next ? columnId : null, direction: next })
    onSort?.(columnId, next)
  }

  function renderSortIcon(columnId: string) {
    if (sortState.columnId !== columnId) return <ArrowUpDown className="h-4 w-4" />
    if (sortState.direction === "asc") return <ArrowUp className="h-4 w-4" />
    return <ArrowDown className="h-4 w-4" />
  }

  return (
    <div
      className={cn(
        "w-full rounded-lg border border-border overflow-hidden",
        className
      )}
    >
      <div className="overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/50">
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.id}
                  className={cn(
                    "text-sm font-medium text-muted-foreground",
                    col.numeric && "text-right"
                  )}
                >
                  {col.sortable ? (
                    <Button
                      variant="transparent"
                      size="sm"
                      onClick={() => handleSort(col.id)}
                      className={cn(
                        "-ml-2",
                        col.numeric && "ml-auto"
                      )}
                    >
                      {col.header}
                      {renderSortIcon(col.id)}
                    </Button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  className="hover:bg-muted/50 transition-colors"
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.id}
                      className={cn(
                        "text-sm",
                        col.numeric && "text-right tabular-nums font-mono"
                      )}
                    >
                      {col.accessor(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer with pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Page {page} of {pageCount}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pageCount}
              onClick={() => onPageChange?.(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

### DatePicker

#### meta.yaml
```yaml
id: DatePicker
status: active
component_type: action
level: composite
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

#### component.tsx
```tsx
import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@blocks/Button/component"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/DatePicker/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20, 21
//
// INVARIANTS (meta.yaml):
//   Trigger: h-9 rounded-md border border-subtle px-3
//   Calendar popover: rounded-md shadow-md
//   Calendar icon: left-aligned inside trigger

interface DatePickerProps {
  value?: Date
  onValueChange: (date: Date | undefined) => void
  placeholder?: string
  /** Date display format string (date-fns) */
  displayFormat?: string
  /** When true, applies border-destructive to the trigger */
  hasError?: boolean
  disabled?: boolean
  className?: string
}

export function DatePicker({
  value,
  onValueChange,
  placeholder = "Pick a date",
  displayFormat = "PPP",
  hasError = false,
  disabled = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-9 w-full justify-start border border-subtle px-3 text-sm font-normal",
            !value && "text-muted-foreground",
            hasError && "border-destructive",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          {value ? (
            <span className="font-mono">{format(value, displayFormat)}</span>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 rounded-md shadow-md"
        align="start"
      >
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onValueChange(date)
            setOpen(false)
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
```

---

### Dialog

#### meta.yaml
```yaml
id: Dialog
status: active
component_type: overlay
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import {
  Dialog as ShadcnDialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { X } from "lucide-react"
import { Button } from "@blocks/Button/component"

// -- Genome sources -----------------------------------------------------------
// Block:    blocks/Dialog/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 14, 17, 18, 20
//
// INVARIANTS (meta.yaml):
//   Container: rounded-lg shadow-lg z-40 bg-card max-w-lg
//   Backdrop: z-30 bg-background/80 backdrop-blur-sm
//   Close button always present; ESC closes; focus trapped inside

interface DialogBlockProps {
  /** Element that opens the dialog on click */
  trigger: React.ReactNode
  title: string
  /** Optional supporting text below the title */
  description?: string
  children: React.ReactNode
  /** Footer actions — max one primary CTA (rule 14) */
  footer?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

export function DialogBlock({
  trigger,
  title,
  description,
  children,
  footer,
  open,
  onOpenChange,
  className,
}: DialogBlockProps) {
  return (
    <ShadcnDialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent
        className={cn(
          "rounded-lg shadow-lg bg-card max-w-lg p-6",
          className
        )}
      >
        {/* Close button — always present (invariant) */}
        <DialogClose asChild>
          <Button
            variant="transparent"
            iconOnly
            size="sm"
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogClose>

        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="py-4">{children}</div>

        {footer && (
          <DialogFooter className="flex gap-3">
            {/* CTA labels: whitespace-nowrap (rule 18) */}
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </ShadcnDialog>
  )
}
```

---

### Drawer

#### meta.yaml
```yaml
id: Drawer
status: active
component_type: overlay
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import {
  Drawer as ShadcnDrawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

// -- Genome sources -----------------------------------------------------------
// Block:    blocks/Drawer/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 14, 18, 20, 21
//
// INVARIANTS (meta.yaml):
//   Container: rounded-t-lg bg-card z-40
//   Drag handle: w-12 h-1.5 rounded-full bg-muted (always visible)
//   Snap points for partial-open states

interface DrawerBlockProps {
  /** Element that opens the drawer on click */
  trigger: React.ReactNode
  title?: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Snap points for partial open heights (e.g. [0.5, 1]) */
  snapPoints?: number[]
  className?: string
}

export function DrawerBlock({
  trigger,
  title,
  description,
  children,
  footer,
  open,
  onOpenChange,
  snapPoints,
  className,
}: DrawerBlockProps) {
  return (
    <ShadcnDrawer
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={snapPoints}
    >
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>

      <DrawerContent
        className={cn("rounded-t-lg bg-card", className)}
      >
        {/* Drag handle — always visible (invariant) */}
        <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-muted" />

        {(title || description) && (
          <DrawerHeader className="text-left">
            {title && (
              <DrawerTitle className="text-lg font-semibold text-foreground">
                {title}
              </DrawerTitle>
            )}
            {description && (
              <DrawerDescription className="text-sm text-muted-foreground">
                {description}
              </DrawerDescription>
            )}
          </DrawerHeader>
        )}

        <div className="px-4 pb-4">{children}</div>

        {footer && (
          <DrawerFooter className="flex gap-3 px-4 pb-6">
            {footer}
          </DrawerFooter>
        )}
      </DrawerContent>
    </ShadcnDrawer>
  )
}
```

---

### DropdownMenu

#### meta.yaml
```yaml
id: DropdownMenu
status: active
component_type: overlay
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import {
  DropdownMenu as ShadcnDropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// -- Genome sources -----------------------------------------------------------
// Block:    blocks/DropdownMenu/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 13, 19, 20, 21
//
// INVARIANTS (meta.yaml):
//   Container: rounded-md shadow-md z-20 bg-popover py-1 min-w-[8rem]
//   Destructive items: text-destructive
//   Keyboard navigable; never the primary action path

export interface DropdownMenuItemConfig {
  label: string
  /** Optional icon rendered before the label */
  icon?: React.ReactNode
  onClick?: () => void
  /** Marks the item as destructive — rendered in text-destructive */
  destructive?: boolean
  disabled?: boolean
}

export interface DropdownMenuGroupConfig {
  label?: string
  items: DropdownMenuItemConfig[]
}

interface DropdownMenuBlockProps {
  /** Element that opens the menu on click */
  trigger: React.ReactNode
  groups: DropdownMenuGroupConfig[]
  align?: "start" | "center" | "end"
  className?: string
}

export function DropdownMenuBlock({
  trigger,
  groups,
  align = "end",
  className,
}: DropdownMenuBlockProps) {
  return (
    <ShadcnDropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        className={cn(
          "rounded-md shadow-md bg-popover py-1 min-w-[8rem]",
          className
        )}
      >
        {groups.map((group, gi) => (
          <DropdownMenuGroup key={gi}>
            {group.label && (
              <DropdownMenuLabel className="px-3 py-1.5 text-sm font-semibold text-muted-foreground">
                {group.label}
              </DropdownMenuLabel>
            )}

            {group.items.map((item, ii) => (
              <DropdownMenuItem
                key={ii}
                disabled={item.disabled}
                onClick={item.onClick}
                className={cn(
                  "px-3 py-2 text-base cursor-pointer min-h-[44px] flex items-center gap-2",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  item.destructive && "text-destructive focus:text-destructive"
                )}
              >
                {item.icon}
                {item.label}
              </DropdownMenuItem>
            ))}

            {gi < groups.length - 1 && <DropdownMenuSeparator />}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </ShadcnDropdownMenu>
  )
}
```

---

### EntityContextHeader

#### meta.yaml
```yaml
id: EntityContextHeader
status: active
component_type: header
level: composite
structural_family: entity-context-header
family_invariants:
  - "Layout: flex items-center justify-between gap-4 px-6 py-4 bg-card border-b border-border"
  - "Entity name: format defined by consuming surface — never truncated, never abbreviated"
  - "Primary identifier label is configurable — never hardcoded"
  - "Secondary identifier uses full format per surface convention"
  - "Always the topmost element of any entity-scoped surface"
confidence: 0.90
version: 1.0.0
introduced: seed-v0
last_evolved: seed-v0

summary: >
  Displays the current entity context at the top of any scoped workflow surface.
  Ensures the user always knows which entity they are acting on. The most
  visible component on any entity-scoped surface — inconsistency here
  breaks user trust immediately.

when:
  - any surface scoped to a single entity's data
  - any workflow where a user is taking action for a specific entity
  - at the top of all entity-detail pages and workflow panels

not_when:
  - population-level views with no single entity context
  - admin surfaces not scoped to an entity
  - login, settings, or navigation-only pages

required_fields:
  - entity name (format defined by consuming surface)
  - primary identifier (label configurable via prop)
  - secondary identifier (label configurable via prop)

optional_fields:
  - tertiary label (additional context field)
  - tier (risk/priority tier badge)
  - team name
  - active alert count (drives urgency indicator)

layout:
  - always renders as a horizontal strip at top of content area
  - never collapses to icon-only — entity identity must always be text-visible
  - alert count badge links to AlertBanner stack below

safety_refs:
  - safety/hard-constraints.md (formatting rules applied by consuming surfaces)

frozen:
  - "scope: always entity-scoped — never used on population-level or admin surfaces"
  - "identity: always left-anchored, never truncated, never collapsed to icon-only"
  - "alert indicator: always right-aligned when present"
  - "position: always the topmost element of any entity-scoped surface"

free:
  - entityType: "any entity type (patient, provider, member, etc.)"
  - identityFields: "primary and secondary identifier labels configurable via props"
  - tier: "present or absent"
  - teamName: "present or absent"
  - alertCount: "any count value"

usage_signal:
  renders_total: 0
  products: []
  override_rate: 0.0

embedding_hint: >
  entity context header identity name identifier scoped
  workflow top of page always visible team score alert count
```

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import { AlertOctagon } from "lucide-react"
import { Button } from "@blocks/Button/component"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/EntityContextHeader/meta.yaml
// Safety:   safety/hard-constraints.md rule 10
//
// STRUCTURAL CONSTRAINTS:
//   Rule 10: Empty/null fields show "—". Blank space can be misread as cleared/zero.
//
// Identifier labels and name format are configurable — consuming surfaces
// pass domain-specific labels (e.g. "MRN", "DOB") via props.

interface EntityContextHeaderProps {
  // Pre-formatted entity name (format enforced by consuming surface)
  name: string
  // Primary identifier value (e.g. MRN, order number, case ID)
  primaryId: string
  // Label for primary identifier (default: "ID")
  primaryIdLabel?: string
  // Secondary identifier value (e.g. DOB, created date)
  secondaryId: string
  // Label for secondary identifier (default: "")
  secondaryIdLabel?: string

  // Optional context — rendered when present; absent fields produce no blank space
  tertiaryLabel?: string
  tier?: "high" | "medium" | "low" | "none"
  teamName?: string
  // Alert count badge: links to AlertBanner stack below this header
  alertCount?: number
  alertSeverity?: "critical" | "high" | "medium" | "low"

  onAlertClick?: () => void
  className?: string
}

const TIER_CONFIG = {
  high:   { label: "High",    classes: "bg-destructive/10 text-destructive border border-destructive/30" },
  medium: { label: "Medium",  classes: "bg-[var(--alert-light)] text-alert border border-alert/30" },
  low:    { label: "Low",     classes: "bg-success/10 text-success border border-success/30" },
  none:   { label: "None",    classes: "bg-muted text-muted-foreground border border-border" },
}

export function EntityContextHeader({
  name,
  primaryId,
  primaryIdLabel = "ID",
  secondaryId,
  secondaryIdLabel = "",
  tertiaryLabel,
  tier,
  teamName,
  alertCount,
  alertSeverity,
  onAlertClick,
  className,
}: EntityContextHeaderProps) {
  const tierConfig = tier ? TIER_CONFIG[tier] : null
  const hasAlerts = alertCount != null && alertCount > 0
  const alertIsCritical = alertSeverity === "critical"

  // Empty fields show "—" not blank
  const displayName       = name || "—"
  const displayPrimaryId  = primaryId || "—"
  const displaySecondaryId = secondaryId || "—"

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-6 py-4",
        "bg-card border-b border-border",
        className
      )}
      aria-label="Entity context"
    >
      {/* Entity identity — always visible, never truncated (meta.yaml invariant) */}
      <div className="flex items-center gap-6 min-w-0">
        <div>
          <p className="text-base font-semibold text-foreground leading-tight">
            {displayName}
          </p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-sm text-muted-foreground">
              {primaryIdLabel} <span className="font-semibold text-foreground">{displayPrimaryId}</span>
            </span>
            {secondaryIdLabel ? (
              <span className="text-sm text-muted-foreground">
                {secondaryIdLabel} <span className="font-semibold text-foreground">{displaySecondaryId}</span>
              </span>
            ) : (
              <span className="text-sm font-semibold text-foreground">
                {displaySecondaryId}
              </span>
            )}
            {tertiaryLabel && (
              <span className="text-sm text-muted-foreground">{tertiaryLabel}</span>
            )}
          </div>
        </div>
      </div>

      {/* Contextual signals — right-aligned, flex-shrink-0 so identity is never truncated */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {teamName && (
          <span className="text-sm text-muted-foreground hidden md:block">
            {teamName}
          </span>
        )}

        {tierConfig && (
          <span className={cn(
            "inline-flex items-center text-sm font-semibold px-2 py-0.5 rounded-full",
            tierConfig.classes
          )}>
            {tierConfig.label}
          </span>
        )}

        {/* Alert indicator — links to AlertBanner stack */}
        {hasAlerts && (
          <Button
            variant="transparent"
            size="sm"
            leftIcon={<AlertOctagon className="h-3 w-3" aria-hidden="true" />}
            onClick={onAlertClick}
            className={cn(
              "inline-flex items-center gap-1 text-sm font-semibold",
              "px-2 py-0.5 rounded-full border transition-colors",
              alertIsCritical
                ? "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20"
                : "bg-[var(--alert-light)] text-alert border-alert/30 hover:bg-[var(--alert-light)]"
            )}
            aria-label={`${alertCount} active alert${alertCount! > 1 ? "s" : ""}`}
          >
            {alertCount} Alert{alertCount! > 1 ? "s" : ""}
          </Button>
        )}
      </div>
    </div>
  )
}
```

---

### EntityRow

#### meta.yaml
```yaml
id: EntityRow
status: active
component_type: row
level: composite
structural_family: actionable-list-row
structural_role: "list-row"
family_invariants:
  - "Layout: flex items-start gap-3 px-4 py-3"
  - "Container: bg-card hover:bg-muted/50 transition-colors (row separation is a parent concern via divide-y)"
  - "Left accent: border-l-2 (warning for flagged/overdue, accent for active/available, transparent for neutral)"
  - "Primary action: Button variant='outline' or 'default' size='sm' className='h-7 text-sm'"
  - "Secondary actions: Button variant='ghost' size='sm' className='h-7 w-7 p-0 text-muted-foreground'"
  - "Meta row: flex items-center gap-3 mt-1 with text-sm text-muted-foreground"
confidence: 0.92
version: 1.0.0

summary: >
  A list row for displaying an entity with identity (avatar + name), a numeric
  score/metric, a tier/level classification, and a context-specific primary action.
  Designed for high-density scan-and-act worklists where users process many entities quickly.

when:
  - displaying a list of entities with scores/metrics and actions
  - user needs to scan and act on multiple entities quickly
  - population-level or worklist view

not_when:
  - single entity detail view — use EntityContextHeader
  - search results with different density requirements
  - read-only display with no actions — use a plain div

key_rules:
  - name format is defined by the consuming surface (not enforced by this component)
  - score uses tabular-nums for column alignment across rows
  - primary action label is context-specific (not generic "View")
  - flagged/overdue entities get amber left border accent automatically
  - avatar color is derived from initials, never random per render

embedding_hint: >
  entity row list worklist priority score tier metric
  scan action high density population level management
```

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import { Button } from "@blocks/Button/component"
import { ChevronRight } from "lucide-react"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/EntityRow/meta.yaml
// Safety:   safety/hard-constraints.md rule 10
// Density:  genome/rules/data-density.rule.md — scanning workflow, high throughput
// Taste:    genome/taste.md — density baseline 6, tabular-nums for score alignment
//
// STRUCTURAL CONSTRAINTS:
//   Empty fields show "—" not blank (safety rule 10).
//
// INVARIANTS (meta.yaml):
//   flex items-center gap-3 px-4 py-3.5
//   bg-card hover:bg-muted/50 (row separation is parent concern via divide-y)
//   border-l-2: warning for flagged/overdue, accent for active, transparent for neutral
//   Primary action: Button variant="outline" or "default" size="sm" h-7 text-sm
//   Score: tabular-nums for column alignment across rows

type Tier = "high" | "medium" | "low"
type BandLevel = 1 | 2 | 3 | 4

const TIER_CONFIG: Record<Tier, { label: string; className: string; dot: string }> = {
  // --destructive = Red
  high:   { label: "High", className: "text-destructive font-semibold", dot: "bg-destructive" },
  // --alert = Orange
  medium: { label: "Med",  className: "text-alert font-semibold",       dot: "bg-alert" },
  // neutral for low
  low:    { label: "Low",  className: "text-muted-foreground",           dot: "bg-border" },
}

// Avatar color derived from initials — stable across renders (not random)
const INITIALS_COLORS = [
  "bg-primary/10 text-primary",
  "bg-success/10 text-success",
  "bg-alert/10 text-alert",
  "bg-destructive/10 text-destructive",
]

interface EntityRowProps {
  initials: string
  name: string
  // Secondary context line — show "—" if unknown
  subtitle: string
  score: number
  trend?: "up" | "down" | "stable"
  tier: Tier
  band: BandLevel
  // Context-specific label (not generic "View")
  primaryAction: string
  primaryActionVariant?: "primary" | "outline"
  isOverdue?: boolean
  onPrimaryAction?: () => void
  onExpand?: () => void
  className?: string
}

export function EntityRow({
  initials,
  name,
  subtitle,
  score,
  trend = "stable",
  tier,
  band,
  primaryAction,
  primaryActionVariant = "primary",
  isOverdue,
  onPrimaryAction,
  onExpand,
  className,
}: EntityRowProps) {
  const tierConfig = TIER_CONFIG[tier]
  // Deterministic color from first initial — never random per render (meta.yaml key_rules)
  const colorIdx = initials.charCodeAt(0) % INITIALS_COLORS.length

  // Empty fields show "—" not blank
  const displaySubtitle = subtitle || "—"

  return (
    <div className={cn(
      "flex items-start gap-3 px-4 py-3 bg-card hover:bg-muted/50 transition-colors cursor-default group",
      // Overdue/flagged left border accent — amber per meta.yaml key_rules
      isOverdue  ? "border-l-2 border-warning" : "border-l-2 border-transparent",
      className
    )}>
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0",
        INITIALS_COLORS[colorIdx]
      )}>
        {initials}
      </div>

      {/* Name + subtitle — fills available space */}
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-foreground leading-tight truncate">{name}</p>
        <p className="text-sm text-muted-foreground mt-1 truncate">{displaySubtitle}</p>
      </div>

      {/* Right columns — fixed-width group so score/band/CTA align across rows */}
      <div className="flex items-center gap-3 w-72 flex-shrink-0 self-center">
        {/* Score — tabular-nums for column alignment */}
        <div className="flex items-center gap-1 w-16 flex-shrink-0">
          <span className={cn("text-base tabular-nums", tierConfig.className)}>{score}</span>
          {trend === "up"   && <span className="text-destructive text-sm" aria-label="trending up">↑</span>}
          {trend === "down" && <span className="text-success text-sm"     aria-label="trending down">↓</span>}
        </div>

        {/* Band */}
        <div className="flex items-center gap-1.5 w-20 flex-shrink-0">
          <span className={cn("w-2 h-2 rounded-full flex-shrink-0", tierConfig.dot)} aria-hidden="true" />
          <span className="text-sm text-muted-foreground">Band {band}</span>
        </div>

        {/* Primary action — right-aligned */}
        <div className="flex-1 flex justify-end">
          <Button
            size="sm"
            variant={primaryActionVariant}
            onClick={onPrimaryAction}
          >
            {primaryAction}
          </Button>
        </div>
      </div>

      {/* Expand — visible on hover only */}
      {onExpand && (
        <Button
          variant="transparent"
          size="sm"
          iconOnly
          onClick={onExpand}
          className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex-shrink-0"
          aria-label={`Expand ${name}`}
        >
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      )}
    </div>
  )
}
```

---

### Form

#### meta.yaml
```yaml
id: Form
status: active
component_type: form-control
level: composite
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

#### component.tsx
```tsx
import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Form as FormRoot,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Button } from "@blocks/Button/component"
import { UseFormReturn, FieldValues } from "react-hook-form"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Form/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 12, 13, 14, 20
//
// INVARIANTS (meta.yaml):
//   Container: flex flex-col gap-4
//   Field: flex flex-col gap-2
//   Error: text-sm text-destructive (rule 13)
//   Submit section: border-t pt-4 mt-4

interface FormLayoutProps<T extends FieldValues> {
  form: UseFormReturn<T>
  onSubmit: (values: T) => void | Promise<void>
  children: React.ReactNode
  /** Label for the primary submit button */
  submitLabel?: string
  /** When true, submit button shows loading state */
  isSubmitting?: boolean
  /** Additional actions rendered beside the submit button */
  secondaryAction?: React.ReactNode
  className?: string
}

export function FormLayout<T extends FieldValues>({
  form,
  onSubmit,
  children,
  submitLabel = "Submit",
  isSubmitting = false,
  secondaryAction,
  className,
}: FormLayoutProps<T>) {
  return (
    <FormRoot {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("flex flex-col gap-4", className)}
      >
        {children}

        {/* Submit section — single primary CTA (rule 14) */}
        <div className="flex items-center gap-3 border-t pt-4 mt-4">
          <Button
            type="submit"
            variant="primary"
            disabled={!form.formState.isValid || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : submitLabel}
          </Button>
          {secondaryAction}
        </div>
      </form>
    </FormRoot>
  )
}

// Re-export form field primitives for convenience
export { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage }
```

---

### HoverCard

#### meta.yaml
```yaml
id: HoverCard
status: active
component_type: overlay
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import {
  HoverCard as ShadcnHoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

// -- Genome sources -----------------------------------------------------------
// Block:    blocks/HoverCard/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 19, 20
//
// INVARIANTS (meta.yaml):
//   Container: rounded-lg shadow-md z-20 bg-card border border-border p-4 max-w-[320px]
//   Open delay 200ms; close delay 100ms
//   Keyboard accessible via focus; never for critical info

interface HoverCardBlockProps {
  /** Element that triggers the hover card on hover/focus */
  trigger: React.ReactNode
  children: React.ReactNode
  align?: "start" | "center" | "end"
  /** Open delay in ms (default 200) */
  openDelay?: number
  /** Close delay in ms (default 100) */
  closeDelay?: number
  className?: string
}

export function HoverCardBlock({
  trigger,
  children,
  align = "center",
  openDelay = 200,
  closeDelay = 100,
  className,
}: HoverCardBlockProps) {
  return (
    <ShadcnHoverCard openDelay={openDelay} closeDelay={closeDelay}>
      <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>

      <HoverCardContent
        align={align}
        className={cn(
          "rounded-lg shadow-md bg-card border border-border p-4 max-w-[320px]",
          className
        )}
      >
        {children}
      </HoverCardContent>
    </ShadcnHoverCard>
  )
}
```

---

### InlineEntityCard

#### meta.yaml
```yaml
id: InlineEntityCard
status: active
component_type: card
level: domain
structural_family: inline-chat-card
family_invariants:
  - "Only rendered inside Panel 2 chat context — never standalone"
  - "Structure: avatar (initials, tier-tinted) + name + badge + max 2 info rows + footer divider"
  - "Container: bg-card border border-border rounded-lg"
  - "Always paired with a ChatQuickActionChip trigger"
confidence: 0.85
version: 1.0.0
introduced: 2026-03-20
last_evolved: 2026-03-20

summary: >
  A compact structured card rendered inside an assistant message bubble in Panel 2,
  triggered by a ChatQuickActionChip. Uses a shared InlineCard shell: initials avatar
  (tier-tinted color pool) + entity name + secondary badge, followed by 1-2 info rows
  with icons, then a divider footer with metadata. Supports multiple implementations
  for different entity types and data contexts.

when:
  - displaying structured entity data inline in the chat conversation after a chip tap
  - data fits the avatar + 2 rows + footer template (not more complex)
  - always paired with ChatQuickActionChip — never rendered standalone

not_when:
  - data requires more than 2 info rows — open a full artifact instead
  - outside Panel 2 / chat context — use EntityRow or EntityContextHeader
  - displaying more than one entity record — use a list artifact

because: >
  Inline cards keep the user in conversation flow. The shared InlineCard shell
  ensures visual consistency across all chip-triggered responses regardless of the
  data domain. Avatar + secondary badge + rows + footer is the minimum viable
  structure for entity-scoped data.

usage_signal:
  renders_total: 0
  products: []
  override_rate: 0.0

embedding_hint: >
  inline card chat assistant message entity avatar initials tier
  structured data compact two rows footer shared shell chip triggered
  bubble panel 2
```

#### component.tsx
```tsx
// Canonical implementation lives in shell/panels/ChatPanel.tsx
// Exports: InlineCard (shared shell), InlineOutreachCard, InlineNextEntityCard
// Always used in conjunction with ChatQuickActionChip
export { ChatPanel } from "../../shell/panels/ChatPanel"
```

---

### Input

#### meta.yaml
```yaml
id: Input
status: active
component_type: input
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import { Input as ShadcnInput } from "@/components/ui/input"

// -- Genome sources -----------------------------------------------------------
// Block:    blocks/Input/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 13, 20
//
// INVARIANTS (meta.yaml):
//   h-9 rounded-md border border-subtle bg-card px-3 text-base
//   Focus: focus-visible:ring-2 ring-ring (never suppressed)
//   Error state: border-destructive (rule 13, NOT severity-critical)

interface InputBlockProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** When true, applies error styling (border-destructive) */
  error?: boolean
  className?: string
}

export function InputBlock({
  error = false,
  className,
  ...props
}: InputBlockProps) {
  return (
    <ShadcnInput
      className={cn(
        "h-9 rounded-md border border-subtle bg-card px-3 text-base",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        error && "border-destructive focus-visible:ring-ring-destructive",
        className
      )}
      aria-invalid={error || undefined}
      {...props}
    />
  )
}
```

---

### InputOTP

#### meta.yaml
```yaml
id: InputOTP
status: active
component_type: input
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import {
  InputOTP as ShadcnInputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp"

// -- Genome sources -----------------------------------------------------------
// Block:    blocks/InputOTP/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 13, 20, 21
//
// INVARIANTS (meta.yaml):
//   Slots: gap-2 between slots
//   Each slot: h-10 w-10 rounded-md border border-subtle text-center font-mono
//   Min 44px touch target per slot (rule 21)
//   Auto-focus next slot; paste support

interface InputOTPBlockProps {
  /** Total number of character slots (default 6) */
  maxLength?: number
  value?: string
  onChange?: (value: string) => void
  /** When true, applies error styling (border-destructive) */
  error?: boolean
  /** Group sizes for visual grouping (e.g. [3, 3] for 3-3 layout) */
  groups?: number[]
  className?: string
}

export function InputOTPBlock({
  maxLength = 6,
  value,
  onChange,
  error = false,
  groups,
  className,
}: InputOTPBlockProps) {
  // Default: single group with all slots
  const slotGroups = groups ?? [maxLength]

  let slotIndex = 0

  return (
    <ShadcnInputOTP
      maxLength={maxLength}
      value={value}
      onChange={onChange}
      className={cn(className)}
    >
      {slotGroups.map((groupSize, gi) => (
        <div key={gi} className="flex items-center gap-2">
          {gi > 0 && <InputOTPSeparator />}
          <InputOTPGroup className="gap-2">
            {Array.from({ length: groupSize }).map((_, si) => {
              const idx = slotIndex++
              return (
                <InputOTPSlot
                  key={idx}
                  index={idx}
                  className={cn(
                    "h-10 w-10 rounded-md border border-subtle text-center font-mono text-base",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    error && "border-destructive focus-visible:ring-ring-destructive"
                  )}
                />
              )
            })}
          </InputOTPGroup>
        </div>
      ))}
    </ShadcnInputOTP>
  )
}
```

---

### Label

#### meta.yaml
```yaml
id: Label
status: active
component_type: form-control
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import { Label as ShadcnLabel } from "@/components/ui/label"

// -- Genome sources -----------------------------------------------------------
// Block:    blocks/Label/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 13, 19
//
// INVARIANTS (meta.yaml):
//   Typography: text-base font-semibold leading-none
//   Disabled peer: peer-disabled:opacity-50
//   Error state: text-destructive (rule 13)

interface LabelBlockProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** When true, appends a required indicator */
  required?: boolean
  /** When true, applies error styling (text-destructive) */
  error?: boolean
  children: React.ReactNode
  className?: string
}

export function LabelBlock({
  required = false,
  error = false,
  children,
  className,
  ...props
}: LabelBlockProps) {
  return (
    <ShadcnLabel
      className={cn(
        "text-base font-semibold leading-none",
        "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
        error && "text-destructive",
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-0.5 text-destructive" aria-hidden="true">
          *
        </span>
      )}
    </ShadcnLabel>
  )
}
```

---

### NavigationMenu

#### meta.yaml
```yaml
id: NavigationMenu
status: active
component_type: navigation
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import {
  NavigationMenu as ShadcnNavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

// -- Genome sources -----------------------------------------------------------
// Block:    blocks/NavigationMenu/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 19, 20
//
// INVARIANTS (meta.yaml):
//   Layout: flex items-center gap-1
//   Trigger: text-base font-semibold
//   Active item visually distinct (not color-only)
//   Max 5-7 top-level items

export interface NavLinkItem {
  label: string
  href: string
  description?: string
  active?: boolean
}

export interface NavMenuItem {
  label: string
  href?: string
  active?: boolean
  /** Sub-items render as a dropdown panel */
  children?: NavLinkItem[]
}

interface NavigationMenuBlockProps {
  items: NavMenuItem[]
  className?: string
}

export function NavigationMenuBlock({
  items,
  className,
}: NavigationMenuBlockProps) {
  return (
    <ShadcnNavigationMenu className={cn(className)}>
      <NavigationMenuList className="flex items-center gap-1">
        {items.map((item) => (
          <NavigationMenuItem key={item.label}>
            {item.children ? (
              <>
                <NavigationMenuTrigger
                  className={cn(
                    "text-base font-semibold",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    item.active && "text-primary underline underline-offset-4"
                  )}
                >
                  {item.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-4 w-[400px]">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <NavigationMenuLink
                          href={child.href}
                          className={cn(
                            "block rounded-md p-3 hover:bg-muted",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            child.active && "bg-muted"
                          )}
                        >
                          <div className="text-base font-semibold text-foreground">
                            {child.label}
                          </div>
                          {child.description && (
                            <p className="text-sm text-muted-foreground leading-snug mt-1">
                              {child.description}
                            </p>
                          )}
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </>
            ) : (
              <NavigationMenuLink
                href={item.href}
                className={cn(
                  navigationMenuTriggerStyle(),
                  "text-base font-semibold",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  item.active && "text-primary underline underline-offset-4"
                )}
              >
                {item.label}
              </NavigationMenuLink>
            )}
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </ShadcnNavigationMenu>
  )
}
```

---

### Pagination

#### meta.yaml
```yaml
id: Pagination
status: active
component_type: navigation
level: composite
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

#### component.tsx
```tsx
import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Pagination as PaginationRoot,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Pagination/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20, 21
//
// INVARIANTS (meta.yaml):
//   Container: flex items-center gap-1
//   Item: h-9 w-9 rounded-md text-sm
//   Active: bg-primary text-primary-foreground font-medium

interface PaginationBarProps {
  /** Current active page (1-indexed) */
  page: number
  /** Total number of pages */
  pageCount: number
  onPageChange: (page: number) => void
  /** Number of sibling pages to show around current page */
  siblingCount?: number
  className?: string
}

function generatePages(
  current: number,
  total: number,
  siblings: number
): (number | "ellipsis")[] {
  const pages: (number | "ellipsis")[] = []

  const leftSibling = Math.max(current - siblings, 2)
  const rightSibling = Math.min(current + siblings, total - 1)

  pages.push(1)

  if (leftSibling > 2) {
    pages.push("ellipsis")
  }

  for (let i = leftSibling; i <= rightSibling; i++) {
    if (i !== 1 && i !== total) {
      pages.push(i)
    }
  }

  if (rightSibling < total - 1) {
    pages.push("ellipsis")
  }

  if (total > 1) {
    pages.push(total)
  }

  return pages
}

export function PaginationBar({
  page,
  pageCount,
  onPageChange,
  siblingCount = 1,
  className,
}: PaginationBarProps) {
  if (pageCount <= 1) return null

  const pages = generatePages(page, pageCount, siblingCount)

  return (
    <PaginationRoot className={className}>
      <PaginationContent className="flex items-center gap-1">
        <PaginationItem>
          <PaginationPrevious
            onClick={() => page > 1 && onPageChange(page - 1)}
            aria-disabled={page <= 1}
            className={cn(
              "min-w-[44px] min-h-[44px]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              page <= 1 && "pointer-events-none opacity-50"
            )}
          />
        </PaginationItem>

        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink
                isActive={p === page}
                onClick={() => p !== page && onPageChange(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "h-9 w-9 rounded-md text-sm",
                  "min-w-[44px] min-h-[44px]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  p === page && "bg-primary text-primary-foreground font-medium pointer-events-none"
                )}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PaginationNext
            onClick={() => page < pageCount && onPageChange(page + 1)}
            aria-disabled={page >= pageCount}
            className={cn(
              "min-w-[44px] min-h-[44px]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              page >= pageCount && "pointer-events-none opacity-50"
            )}
          />
        </PaginationItem>
      </PaginationContent>
    </PaginationRoot>
  )
}
```

---

### Popover

#### meta.yaml
```yaml
id: Popover
status: active
component_type: overlay
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import {
  Popover as ShadcnPopover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// -- Genome sources -----------------------------------------------------------
// Block:    blocks/Popover/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20
//
// INVARIANTS (meta.yaml):
//   Container: rounded-md shadow-md z-20 bg-popover border border-border p-4
//   Positioned relative to trigger; ESC closes; focus trapped
//   Click outside closes

interface PopoverBlockProps {
  /** Element that opens the popover on click */
  trigger: React.ReactNode
  children: React.ReactNode
  align?: "start" | "center" | "end"
  side?: "top" | "right" | "bottom" | "left"
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

export function PopoverBlock({
  trigger,
  children,
  align = "center",
  side = "bottom",
  open,
  onOpenChange,
  className,
}: PopoverBlockProps) {
  return (
    <ShadcnPopover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>

      <PopoverContent
        align={align}
        side={side}
        className={cn(
          "rounded-md shadow-md bg-popover border border-border p-4",
          className
        )}
      >
        {children}
      </PopoverContent>
    </ShadcnPopover>
  )
}
```

---

### Progress

#### meta.yaml
```yaml
id: Progress
status: active
component_type: feedback
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import { Progress as ShadcnProgress } from "@/components/ui/progress"

// -- Genome sources -----------------------------------------------------------
// Block:    blocks/Progress/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 19
//
// INVARIANTS (meta.yaml):
//   Track: h-2 rounded-full bg-muted
//   Indicator: bg-primary rounded-full
//   Always includes aria-valuenow, aria-valuemin, aria-valuemax

interface ProgressBlockProps {
  /** Current progress value (0-100) */
  value: number
  /** Maximum value (default 100) */
  max?: number
  /** When true, shows a percentage label beside the bar */
  showLabel?: boolean
  /** Accessible label for screen readers */
  ariaLabel?: string
  className?: string
}

export function ProgressBlock({
  value,
  max = 100,
  showLabel = false,
  ariaLabel,
  className,
}: ProgressBlockProps) {
  const percentage = Math.round((value / max) * 100)

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <ShadcnProgress
        value={percentage}
        className="h-2 rounded-full bg-muted flex-1"
        aria-label={ariaLabel}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      />
      {showLabel && (
        <span className="text-sm font-semibold tabular-nums text-muted-foreground min-w-[3ch] text-right">
          {percentage}%
        </span>
      )}
    </div>
  )
}
```

---

### RadioGroup

#### meta.yaml
```yaml
id: RadioGroup
status: active
component_type: input
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import { RadioGroup as ShadcnRadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

// -- Genome sources -----------------------------------------------------------
// Block:    blocks/RadioGroup/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 13, 19, 20, 21
//
// INVARIANTS (meta.yaml):
//   Layout: flex flex-col gap-3
//   Each radio: h-4 w-4 rounded-full border border-subtle
//   Checked: border-primary fill-primary
//   44px min touch target on label+radio combined (rule 21)

export interface RadioOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

interface RadioGroupBlockProps {
  options: RadioOption[]
  value?: string
  onValueChange?: (value: string) => void
  /** When true, applies error styling */
  error?: boolean
  /** Layout direction */
  orientation?: "vertical" | "horizontal"
  className?: string
}

export function RadioGroupBlock({
  options,
  value,
  onValueChange,
  error = false,
  orientation = "vertical",
  className,
}: RadioGroupBlockProps) {
  return (
    <ShadcnRadioGroup
      value={value}
      onValueChange={onValueChange}
      className={cn(
        orientation === "vertical" ? "flex flex-col gap-3" : "flex flex-row gap-4",
        className
      )}
      aria-invalid={error || undefined}
    >
      {options.map((option) => (
        <div
          key={option.value}
          className="flex items-start gap-2 min-h-[44px]"
        >
          <RadioGroupItem
            value={option.value}
            id={option.value}
            disabled={option.disabled}
            className={cn(
              "h-4 w-4 rounded-full border border-subtle mt-0.5",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              error && "border-destructive"
            )}
          />
          <Label
            htmlFor={option.value}
            className={cn(
              "text-base font-normal leading-tight cursor-pointer",
              option.disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {option.label}
            {option.description && (
              <span className="block text-sm text-muted-foreground mt-0.5">
                {option.description}
              </span>
            )}
          </Label>
        </div>
      ))}
    </ShadcnRadioGroup>
  )
}
```

---

### Resizable

#### meta.yaml
```yaml
id: Resizable
status: active
component_type: layout
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

// -- Genome sources -----------------------------------------------------------
// Block:    blocks/Resizable/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20
//
// INVARIANTS (meta.yaml):
//   Layout: flex h-full
//   Handle: w-1 bg-border hover:bg-primary/50 cursor-col-resize
//   Min/max size constraints enforced on each panel

export interface ResizablePanelConfig {
  /** Default size as a percentage (0-100) */
  defaultSize: number
  /** Minimum size as a percentage */
  minSize?: number
  /** Maximum size as a percentage */
  maxSize?: number
  children: React.ReactNode
  className?: string
}

interface ResizableBlockProps {
  panels: ResizablePanelConfig[]
  /** Split direction */
  direction?: "horizontal" | "vertical"
  /** Called when panel layout changes — sizes array for persistence */
  onLayout?: (sizes: number[]) => void
  className?: string
}

export function ResizableBlock({
  panels,
  direction = "horizontal",
  onLayout,
  className,
}: ResizableBlockProps) {
  return (
    <ResizablePanelGroup
      direction={direction}
      onLayout={onLayout}
      className={cn("flex h-full", className)}
    >
      {panels.map((panel, i) => (
        <div key={i} className="contents">
          {i > 0 && (
            <ResizableHandle
              className={cn(
                direction === "horizontal" ? "w-1" : "h-1",
                "bg-border hover:bg-primary/50",
                direction === "horizontal" ? "cursor-col-resize" : "cursor-row-resize",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            />
          )}
          <ResizablePanel
            defaultSize={panel.defaultSize}
            minSize={panel.minSize}
            maxSize={panel.maxSize}
            className={cn(panel.className)}
          >
            {panel.children}
          </ResizablePanel>
        </div>
      ))}
    </ResizablePanelGroup>
  )
}
```

---

### ScrollArea

#### meta.yaml
```yaml
id: ScrollArea
status: active
component_type: layout
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import { ScrollArea as ShadcnScrollArea, ScrollBar } from "@/components/ui/scroll-area"

// -- Genome sources -----------------------------------------------------------
// Block:    blocks/ScrollArea/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20
//
// INVARIANTS (meta.yaml):
//   Container: overflow-hidden
//   Scrollbar: w-2.5 rounded-full bg-border
//   Thumb: bg-muted-foreground/30 rounded-full
//   Native scrolling behavior preserved

type ScrollOrientation = "vertical" | "horizontal" | "both"

interface ScrollAreaBlockProps {
  children: React.ReactNode
  /** Scroll direction(s) to enable */
  orientation?: ScrollOrientation
  /** Fixed height for the scroll container */
  height?: string | number
  /** Fixed width for the scroll container */
  width?: string | number
  className?: string
}

export function ScrollAreaBlock({
  children,
  orientation = "vertical",
  height,
  width,
  className,
}: ScrollAreaBlockProps) {
  const style: React.CSSProperties = {}
  if (height) style.height = typeof height === "number" ? `${height}px` : height
  if (width) style.width = typeof width === "number" ? `${width}px` : width

  return (
    <ShadcnScrollArea
      className={cn("overflow-hidden", className)}
      style={style}
    >
      {children}

      {(orientation === "vertical" || orientation === "both") && (
        <ScrollBar orientation="vertical" />
      )}
      {(orientation === "horizontal" || orientation === "both") && (
        <ScrollBar orientation="horizontal" />
      )}
    </ShadcnScrollArea>
  )
}
```

---

### SectionHeader

#### meta.yaml
```yaml
id: SectionHeader
status: active
component_type: other
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/SectionHeader/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Density:  genome/rules/data-density.rule.md (wayfinding label, not a headline)
// Taste:    genome/taste.md — hierarchy through typography, not decoration
//
// INVARIANTS (never change):
//   text-sm (12px) font-semibold uppercase tracking-wider text-muted-foreground
//   Never bold or large — must recede visually, not dominate.
//   Count urgent/warning variants only when the count itself signals urgency.

interface SectionHeaderProps {
  title: string
  // count=0 renders (0 is a meaningful value, not empty — hard-constraint rule 10)
  count?: number
  countVariant?: "default" | "urgent" | "warning"
  action?: React.ReactNode
  className?: string
}

export function SectionHeader({
  title,
  count,
  countVariant = "default",
  action,
  className,
}: SectionHeaderProps) {
  const countClass = {
    default: "text-muted-foreground",
    urgent:  "text-destructive font-semibold",
    warning: "text-warning font-semibold",
  }[countVariant]

  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-2",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        {/* count !== undefined: renders 0 (hard-constraint rule 10 — 0 is not blank) */}
        {count !== undefined && (
          <span className={cn("text-sm tabular-nums", countClass)}>
            {count}
          </span>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
```

---

### Select

#### meta.yaml
```yaml
id: Select
status: active
component_type: input
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Select/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 13, 20, 21
//
// INVARIANTS (meta.yaml):
//   Trigger: h-9 rounded-md border border-subtle px-3 bg-card
//   Content: rounded-md shadow-md z-20 bg-card border
//   Item: py-1.5 px-2 cursor-pointer hover:bg-muted/50

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps {
  options: SelectOption[]
  placeholder?: string
  value?: string
  onValueChange?: (value: string) => void
  /** Displays border-destructive when true (rule 13) */
  error?: boolean
  disabled?: boolean
  className?: string
}

export function Select({
  options,
  placeholder = "Select...",
  value,
  onValueChange,
  error = false,
  disabled = false,
  className,
}: SelectProps) {
  return (
    <ShadcnSelect value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          "h-11 min-h-[44px] rounded-md border border-subtle bg-card px-3 text-base",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          error && "border-destructive",
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="rounded-md shadow-md z-20 bg-card border">
        {options.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            disabled={opt.disabled}
            className="py-1.5 px-2 cursor-pointer hover:bg-muted/50"
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </ShadcnSelect>
  )
}
```

---

### Separator

#### meta.yaml
```yaml
id: Separator
status: active
component_type: layout
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import { Separator as ShadcnSeparator } from "@/components/ui/separator"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Separator/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
//
// INVARIANTS (meta.yaml):
//   bg-border color token
//   Horizontal: h-[1px] w-full
//   Vertical: w-[1px] h-full

interface SeparatorProps {
  orientation?: "horizontal" | "vertical"
  className?: string
}

export function Separator({
  orientation = "horizontal",
  className,
}: SeparatorProps) {
  return (
    <ShadcnSeparator
      orientation={orientation}
      decorative
      className={cn("bg-border", className)}
    />
  )
}
```

---

### Sheet

#### meta.yaml
```yaml
id: Sheet
status: active
component_type: overlay
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import {
  Sheet as ShadcnSheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
  SheetTrigger,
} from "@/components/ui/sheet"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Sheet/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20
//
// INVARIANTS (meta.yaml):
//   Panel: bg-card z-40 shadow-lg inset-y-0
//   Width: min-w-[320px] max-w-[540px]
//   Backdrop: z-30 bg-black/50

interface SheetProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Panel slide direction */
  side?: "right" | "left" | "top" | "bottom"
  title: string
  description?: string
  trigger?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function Sheet({
  open,
  onOpenChange,
  side = "right",
  title,
  description,
  trigger,
  children,
  className,
}: SheetProps) {
  return (
    <ShadcnSheet open={open} onOpenChange={onOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent
        side={side}
        className={cn(
          "bg-card shadow-lg min-w-[320px] max-w-[540px]",
          "focus-visible:outline-none",
          className,
        )}
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        {children}
      </SheetContent>
    </ShadcnSheet>
  )
}
```

---

### Skeleton

#### meta.yaml
```yaml
id: Skeleton
status: active
component_type: layout
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import { Skeleton as ShadcnSkeleton } from "@/components/ui/skeleton"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Skeleton/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
//
// INVARIANTS (meta.yaml):
//   bg-muted rounded-md animate-pulse

interface SkeletonProps {
  /** Width class, e.g. "w-full", "w-32" */
  width?: string
  /** Height class, e.g. "h-4", "h-10" */
  height?: string
  /** Renders as a circle (rounded-full) for avatar placeholders */
  circle?: boolean
  className?: string
}

export function Skeleton({
  width = "w-full",
  height = "h-4",
  circle = false,
  className,
}: SkeletonProps) {
  return (
    <ShadcnSkeleton
      className={cn(
        "bg-muted animate-pulse",
        circle ? "rounded-full" : "rounded-md",
        width,
        height,
        className,
      )}
    />
  )
}
```

---

### Slider

#### meta.yaml
```yaml
id: Slider
status: active
component_type: input
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import { Slider as ShadcnSlider } from "@/components/ui/slider"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Slider/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20, 21
//
// INVARIANTS (meta.yaml):
//   Track: h-1.5 rounded-full bg-muted
//   Thumb: h-4 w-4 rounded-full bg-primary border-2 border-primary-foreground shadow-sm

interface SliderProps {
  value?: number[]
  onValueChange?: (value: number[]) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  /** Accessible label for the current value, e.g. "50 percent" */
  ariaValueText?: string
  className?: string
}

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  ariaValueText,
  className,
}: SliderProps) {
  return (
    <ShadcnSlider
      value={value}
      onValueChange={onValueChange}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      aria-valuetext={ariaValueText}
      className={cn(
        // 44px touch target via vertical padding on the root
        "py-3",
        "focus-visible:outline-none",
        className,
      )}
    />
  )
}
```

---

### Sonner

#### meta.yaml
```yaml
id: Sonner
status: active
component_type: feedback
level: primitive
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

#### component.tsx
```tsx
import { Toaster as ShadcnToaster } from "@/components/ui/sonner"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Sonner/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 13, 14, 19
//
// INVARIANTS (meta.yaml):
//   Container: rounded-lg shadow-lg z-50 bg-card border p-4
//   Position: bottom-right
//   Auto-dismiss: 5s default
//
// Usage:
//   Mount <Sonner /> once in the layout.
//   Trigger toasts via: toast("Message"), toast.success("Saved"),
//   toast.error("Failed"), toast.warning("Careful")

interface SonnerProps {
  /** Maximum visible toasts at once */
  visibleToasts?: number
  /** Position on screen */
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
}

export function Sonner({
  visibleToasts = 3,
  position = "bottom-right",
}: SonnerProps) {
  return (
    <ShadcnToaster
      visibleToasts={visibleToasts}
      position={position}
      toastOptions={{
        classNames: {
          toast: "rounded-lg shadow-lg bg-card border p-4 text-base",
          title: "text-foreground font-semibold",
          description: "text-muted-foreground text-sm",
          success: "border-success",
          error: "border-destructive",
          warning: "border-warning",
          actionButton: "whitespace-nowrap",
        },
      }}
    />
  )
}
```

---

### StatCard

#### meta.yaml
```yaml
id: StatCard
status: active
component_type: card
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import { Card } from "@blocks/Card/component"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/StatCard/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Taste:    genome/taste.md — numbers earn emphasis; tabular-nums for alignment
// Density:  genome/rules/data-density.rule.md — value scannable at a glance
//
// INVARIANTS:
//   Label: text-sm (12px) font-medium uppercase tracking-wide text-muted-foreground
//   Value: text-[32px] font-medium tabular-nums leading-none (title/x-large)
//   Max 4 StatCards per row.
//
// Container: Card block with elevation prop — no local card styling.
//
// Variant tokens map to semantic colors — never use Tailwind default colors.
//   urgent  → --destructive (Critical severity / highest-stakes data)
//   warning → --warning     (Overdue / at-risk)
//   success → --success     (Positive outcomes)
//   default → --foreground  (General counts, neutral)
// Subtitle is always text-muted-foreground — no reduced-opacity text.

type StatVariant = "default" | "urgent" | "warning" | "success"

const VARIANT_CONFIG: Record<StatVariant, { valueClass: string }> = {
  default: { valueClass: "text-foreground" },
  urgent:  { valueClass: "text-destructive" },
  warning: { valueClass: "text-warning" },
  success: { valueClass: "text-success" },
}

interface StatCardProps {
  label: string
  value: number | string
  // subtitle: supporting context — shown only when it adds meaning to the value
  subtitle?: string
  variant?: StatVariant
  elevation?: "flat" | "sm" | "md"
  // onClick: makes the entire card interactive; hover state activates automatically
  onClick?: () => void
  className?: string
}

export function StatCard({
  label,
  value,
  subtitle,
  variant = "default",
  elevation = "flat",
  onClick,
  className,
}: StatCardProps) {
  const v = VARIANT_CONFIG[variant]

  return (
    <Card
      elevation={elevation}
      onClick={onClick}
      className={className}
    >
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className={cn("text-[32px] font-medium tabular-nums leading-none", v.valueClass)}>
          {value}
        </p>
        {subtitle && (
          <p className="text-sm leading-4 text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
    </Card>
  )
}
```

---

### Switch

#### meta.yaml
```yaml
id: Switch
status: active
component_type: input
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import { Switch as ShadcnSwitch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Switch/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20, 21
//
// INVARIANTS (meta.yaml):
//   Root: h-5 w-9 rounded-full
//   Track: bg-subtle checked:bg-primary
//   Thumb: h-4 w-4 rounded-full bg-card shadow-sm

interface SwitchProps {
  id?: string
  label: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export function Switch({
  id,
  label,
  checked,
  onCheckedChange,
  disabled = false,
  className,
}: SwitchProps) {
  const switchId = id ?? `switch-${label.toLowerCase().replace(/\s+/g, "-")}`

  return (
    <div
      className={cn(
        "flex items-center gap-3 min-h-[44px]", // 44px touch target (rule 21)
        className,
      )}
    >
      <ShadcnSwitch
        id={switchId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <Label htmlFor={switchId} className="text-base cursor-pointer">
        {label}
      </Label>
    </div>
  )
}
```

---

### Table

#### meta.yaml
```yaml
id: Table
status: active
component_type: data-display
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Table/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
//
// INVARIANTS (meta.yaml):
//   Root: w-full text-base
//   Header: text-sm font-semibold text-muted-foreground uppercase tracking-wide
//   Cell: py-3 px-4 border-b
//   Row hover: hover:bg-muted/50

interface Column<T> {
  key: keyof T & string
  label: string
  /** Right-align for numeric columns (uses tabular-nums) */
  numeric?: boolean
  className?: string
}

interface TableProps<T extends Record<string, unknown>> {
  columns: Column<T>[]
  data: T[]
  /** Enables sticky header for scrollable containers */
  stickyHeader?: boolean
  className?: string
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  stickyHeader = false,
  className,
}: TableProps<T>) {
  return (
    <ShadcnTable className={cn("w-full text-base", className)}>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead
              key={col.key}
              className={cn(
                "text-sm font-semibold text-muted-foreground uppercase tracking-wide py-3 px-4",
                col.numeric && "text-right",
                stickyHeader && "sticky top-0 bg-background z-10",
                col.className,
              )}
            >
              {col.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, idx) => (
          <TableRow key={idx} className="hover:bg-muted/50">
            {columns.map((col) => (
              <TableCell
                key={col.key}
                className={cn(
                  "py-3 px-4 border-b",
                  col.numeric && "text-right tabular-nums",
                  col.className,
                )}
              >
                {String(row[col.key] ?? "")}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </ShadcnTable>
  )
}
```

---

### Tabs

#### meta.yaml
```yaml
id: Tabs
status: active
component_type: layout
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import {
  Tabs as ShadcnTabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Tabs/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rule 20
//
// INVARIANTS (meta.yaml):
//   Trigger: text-sm font-semibold text-muted-foreground
//   Active: text-foreground border-b-2 border-primary
//   List: border-b border-border

interface TabItem {
  value: string
  label: string
  content: React.ReactNode
  disabled?: boolean
}

interface TabsProps {
  items: TabItem[]
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
}

export function Tabs({
  items,
  defaultValue,
  value,
  onValueChange,
  className,
}: TabsProps) {
  const resolvedDefault = defaultValue ?? items[0]?.value

  return (
    <ShadcnTabs
      defaultValue={resolvedDefault}
      value={value}
      onValueChange={onValueChange}
      className={cn(className)}
    >
      <TabsList className="border-b border-border bg-transparent rounded-none w-full justify-start gap-0 h-auto p-0">
        {items.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            disabled={tab.disabled}
            className={cn(
              "text-sm font-semibold text-muted-foreground rounded-none border-b-2 border-transparent",
              "px-4 py-2 min-h-[44px]",
              "data-[state=active]:text-foreground data-[state=active]:border-primary data-[state=active]:shadow-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-4">
          {tab.content}
        </TabsContent>
      ))}
    </ShadcnTabs>
  )
}
```

---

### Textarea

#### meta.yaml
```yaml
id: Textarea
status: active
component_type: input
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import { Textarea as ShadcnTextarea } from "@/components/ui/textarea"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Textarea/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 13, 20
//
// INVARIANTS (meta.yaml):
//   Root: rounded-md border border-subtle bg-card px-3 py-2 text-base
//   Focus: focus-visible:ring-2 ring-ring
//   Min height: min-h-[80px]

interface TextareaProps {
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  /** Displays border-destructive when true (rule 13) */
  error?: boolean
  disabled?: boolean
  rows?: number
  className?: string
}

export function Textarea({
  value,
  onChange,
  placeholder,
  error = false,
  disabled = false,
  rows = 3,
  className,
}: TextareaProps) {
  return (
    <ShadcnTextarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      className={cn(
        "rounded-md border border-subtle bg-card px-3 py-2 text-base",
        "min-h-[80px] resize-y",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        error && "border-destructive",
        className,
      )}
    />
  )
}
```

---

### Toggle

#### meta.yaml
```yaml
id: Toggle
status: active
component_type: input
level: primitive
structural_family: form-input
family_invariants:
  - "Root: rounded-md h-9 px-3"
  - "Pressed: bg-muted"
  - "Hover: hover:bg-muted/50"
  - "Focus: focus-visible:ring-2"
confidence: 0.85
version: 1.0.0

summary: >
  Single pressable toggle button with on/off states. Used for
  toolbar-style actions or view mode toggles. Provides clear
  visual distinction between pressed and unpressed states.

when:
  - toggling a single toolbar option (bold, italic, grid view)
  - view mode switching (list vs grid)
  - activating a tool or mode

not_when:
  - boolean setting with a label (use Switch)
  - selecting from a group of options (use ToggleGroup)
  - form submission checkbox (use Checkbox)

variants:
  default: subtle border toggle
  outline: border with bg-muted fill on active

key_rules:
  - aria-pressed state always set
  - 44px minimum touch target (rule 21)
  - clear visual distinction between on and off states
  - focus-visible ring never suppressed (rule 20)

embedding_hint: >
  toggle button press on off toolbar
  mode view switch active state control
```

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import { Toggle as ShadcnToggle } from "@/components/ui/toggle"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Toggle/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rules 20, 21
//
// INVARIANTS (meta.yaml):
//   Root: rounded-md h-9 px-3
//   Pressed: bg-muted
//   Hover: hover:bg-muted/50
//   Focus: focus-visible:ring-2

interface ToggleProps {
  pressed?: boolean
  onPressedChange?: (pressed: boolean) => void
  variant?: "default" | "outline"
  disabled?: boolean
  children: React.ReactNode
  className?: string
}

export function Toggle({
  pressed,
  onPressedChange,
  variant = "default",
  disabled = false,
  children,
  className,
}: ToggleProps) {
  return (
    <ShadcnToggle
      pressed={pressed}
      onPressedChange={onPressedChange}
      variant={variant}
      disabled={disabled}
      className={cn(
        "rounded-md h-9 min-w-[44px] min-h-[44px] px-3",
        "hover:bg-muted/50 data-[state=on]:bg-muted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {children}
    </ShadcnToggle>
  )
}
```

---

### ToggleGroup

#### meta.yaml
```yaml
id: ToggleGroup
status: active
component_type: input
level: primitive
structural_family: form-input
family_invariants:
  - "Container: flex gap-1"
  - "Items: rounded-md"
  - "Active: bg-muted font-semibold"
confidence: 0.85
version: 1.0.0

summary: >
  Group of related toggle buttons for single or multi-select
  scenarios. Renders a horizontal row of toggle items with shared
  state management. Supports exclusive and multi-selection modes.

when:
  - selecting one or more options from a small set (2-5 items)
  - toolbar-style option groups (view mode, alignment, format)
  - segmented control pattern for switching between modes

not_when:
  - more than 5 options (use Select or RadioGroup)
  - binary toggle (use Switch or single Toggle)
  - form checkbox group (use CheckboxGroup)

variants:
  single: exclusive selection, only one active at a time
  multiple: multi-select, any combination of items

key_rules:
  - type="single" for exclusive selection
  - type="multiple" for multi-select
  - keyboard navigable with arrow keys
  - disabled items use opacity-50
  - focus-visible ring never suppressed (rule 20)

embedding_hint: >
  toggle group segmented control multi select
  toolbar options mode switch button group
```

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import {
  ToggleGroup as ShadcnToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/ToggleGroup/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rule 20
//
// INVARIANTS (meta.yaml):
//   Container: flex gap-1
//   Items: rounded-md
//   Active: bg-muted font-semibold

interface ToggleGroupOption {
  value: string
  label: React.ReactNode
  disabled?: boolean
}

interface ToggleGroupSingleProps {
  type: "single"
  value?: string
  onValueChange?: (value: string) => void
  options: ToggleGroupOption[]
  className?: string
}

interface ToggleGroupMultipleProps {
  type: "multiple"
  value?: string[]
  onValueChange?: (value: string[]) => void
  options: ToggleGroupOption[]
  className?: string
}

type ToggleGroupProps = ToggleGroupSingleProps | ToggleGroupMultipleProps

export function ToggleGroup(props: ToggleGroupProps) {
  const { type, options, className } = props

  return (
    <ShadcnToggleGroup
      type={type}
      value={props.value as any}
      onValueChange={props.onValueChange as any}
      className={cn("flex gap-1", className)}
    >
      {options.map((opt) => (
        <ToggleGroupItem
          key={opt.value}
          value={opt.value}
          disabled={opt.disabled}
          className={cn(
            "rounded-md px-3 min-h-[44px] min-w-[44px]",
            "data-[state=on]:bg-muted data-[state=on]:font-semibold",
            "hover:bg-muted/50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            opt.disabled && "opacity-50",
          )}
        >
          {opt.label}
        </ToggleGroupItem>
      ))}
    </ShadcnToggleGroup>
  )
}
```

---

### Tooltip

#### meta.yaml
```yaml
id: Tooltip
status: active
component_type: overlay
level: primitive
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

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import {
  Tooltip as ShadcnTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/Tooltip/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Safety:   safety/hard-constraints.md rule 20
//
// INVARIANTS (meta.yaml):
//   Content: rounded-md shadow-sm z-60
//   Style: bg-foreground text-background text-sm px-3 py-1.5
//   Width: max-w-[220px]

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  /** Open delay in ms (default 400ms to prevent accidental triggers) */
  delayDuration?: number
  className?: string
}

export function Tooltip({
  content,
  children,
  side = "top",
  delayDuration = 400,
  className,
}: TooltipProps) {
  return (
    <TooltipProvider delayDuration={delayDuration} skipDelayDuration={100}>
      <ShadcnTooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          className={cn(
            "rounded-md shadow-sm z-60",
            "bg-foreground text-background text-sm px-3 py-1.5",
            "max-w-[220px]",
            className,
          )}
        >
          {content}
        </TooltipContent>
      </ShadcnTooltip>
    </TooltipProvider>
  )
}
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

---

## Surfaces

6 surfaces:


### ClinicalAssessment
```yaml
id: ClinicalAssessment
type: surface
user_type: [coordinator, clinician]

intent: >
  A surface for administering or recording a standardised clinical screening
  instrument (PHQ-9, GAD-7, SDOH, CAGE, etc.) against a patient.
  Captures verbatim instrument questions, computes a total score, classifies
  severity, and logs the completed assessment.

what_it_omits:
  - item: Interpretation or clinical advice beyond score classification
    reason: "Clinical interpretation requires licensed clinical judgment. This surface is used by coordinators as well as clinicians — generating advice here could constitute an unlicensed clinical recommendation. Score + severity classification is the boundary."
  - item: Comparison to prior assessments
    reason: "Trend analysis requires temporal context and a different visual model. Mixing it into the entry surface creates cognitive load during administration and risks the coordinator treating prior scores as a target rather than focusing on the current response."
  - item: Free-text narrative responses
    reason: "Standardised instruments have validated, structured response options. Allowing free text breaks clinical validity — scores would not be comparable across administrations or patients."

empty_state_meaning: >
  No answers recorded yet. Progress indicator in the submit bar shows 0/N answered.

ordering: >
  Questions presented in the instrument's canonical order — never reordered
  or grouped differently, as clinical validity depends on standardised presentation.

actions:
  - label: "Record Assessment"
    stage: submit bar
    constraint: disabled until all questions answered — partial records are not valid
  - label: "Clear"
    stage: submit bar
    constraint: resets all answers and patient identity, no confirmation needed

never:
  - Paraphrase or shorten instrument question text (safety rule 14)
  - Enable submit on a partial response
  - Show score or severity until at least one answer is recorded
  - Omit a safety flag (e.g. Review badge) when a self-harm indicator question
    receives any non-zero answer
  - Navigate away on submit — show inline success state with score and severity
```

### IntakeForm
```yaml
id: IntakeForm
type: surface
user_type: [coordinator]

intent: >
  A coordinator-facing form to log a completed or attempted outreach contact.
  Single-purpose: capture one outreach event against one patient and submit.
  Not a multi-record entry surface.

what_it_omits:
  - item: Bulk outreach logging
    reason: "This is a single-record entry surface. Bulk operations require a different interaction model with safety constraints (rule 12) — attempting bulk entry here would bypass per-record confirmation."
  - item: Patient clinical data beyond identity and care gap reference
    reason: "The coordinator needs to know who they contacted and why — not full clinical history. Exposing clinical data on an entry form creates HIPAA surface area without functional value."
  - item: Scheduling or calendar integration
    reason: "Scheduling is a separate workflow with its own surface and state machine. Embedding it here conflates two distinct intents and increases form complexity without serving the primary logging goal."

empty_state_meaning: >
  The form is blank and ready for a new entry. No message needed.

ordering: >
  Fields ordered: patient identity → outreach details → log details.
  Identity first because the coordinator must confirm who before logging what.

actions:
  - label: "Log Outreach"
    stage: submit bar
    constraint: disabled until all required fields are complete
  - label: "Clear"
    stage: submit bar
    constraint: resets form to empty state, no confirmation needed

never:
  - Submit partial records silently
  - Auto-populate patient identity from a previous entry without explicit confirmation
  - Navigate away on submit — show inline success state and offer "Log another"
```

### OutreachLog
```yaml
id: OutreachLog
type: surface
user_type: [coordinator]

intent: >
  Chronological read-only audit of all outreach activity across the coordinator's
  patient panel in the last 24 hours. This is an observation surface, not an
  action surface. Coordinators use it to review what happened, not to do things.

what_it_omits:
  - item: Outreach older than 24 hours (use reporting for historical views)
    reason: "This surface is a shift-level review tool, not a historical ledger. 24h scope keeps the view relevant to the current coordinator session. Older records belong in a reporting surface."
  - item: Any action that modifies an existing log entry
    reason: "Outreach logs are audit records. Mutability would compromise their integrity as a compliance trail. Edits and corrections must go through a formal amendment process outside this surface."
  - item: Patient clinical data beyond name and related care gap
    reason: "This is an outreach surface, not a clinical record. Showing clinical data here would require the same access controls as PatientDetail — a different surface with different intent."

empty_state_meaning: >
  No outreach has been logged in the last 24 hours. Honest one-liner only —
  no illustration, no call to action.

ordering: >
  Reverse chronological — most recent first. Never filtered by default.

actions:
  - label: none (read-only surface)
    stage: n/a
    constraint: rows are clickable to open the message thread drawer, not to edit

never:
  - Allow editing or deleting a log entry
  - Show a "Log Outreach" button inside this surface (use New Intake tab instead)
  - Paginate — show all 24h records in a single scrollable list
```

### PatientDetail
```yaml
id: PatientDetail
type: surface
user_type: [coordinator, clinician]

intent: >
  A single patient's full care picture scoped to what a coordinator or clinician
  needs to act on. Not a medical record viewer — an action surface.
  Everything shown should connect to a possible next step.

what_it_omits:
  - item: Historical closed gaps (unless explicitly surfaced in audit mode)
    reason: "Closed gaps are audit record, not action items. Showing them by default inflates the list and obscures what still needs intervention. Audit mode is a deliberate opt-in."
  - item: Billing and coding data
    reason: "Billing is handled by a separate team with different access controls. Exposing it here creates HIPAA surface area without clinical value for the coordinator/clinician role."
  - item: Raw lab values without clinical context
    reason: "A lab value alone is uninterpretable and potentially alarming without reference range and clinical narrative. Showing raw values without context violates the principle that everything shown should connect to a possible next step."
  - item: Unstructured notes
    reason: "Free-text clinical notes require medical training to interpret safely. This surface serves coordinators who need structured, actionable data — not freeform narrative."

empty_state_meaning: >
  No open care gaps or tasks means this patient's panel is currently clear.
  This is not an error — it means no coordinator action is required right now.

ordering: >
  Active alerts first (by severity descending), then open care gaps
  (by measure priority), then tasks (by due date ascending).

actions:
  - label: "Close Gap"
    stage: care gap section
    constraint: one step
  - label: "Acknowledge"
    stage: alert banner only
    constraint: critical and high alerts require acknowledgment, not dismissal
  - label: "Add Task"
    stage: task section
    constraint: opens inline form, does not navigate away

never:
  - Show a Dismiss control on a Critical or High severity alert
  - Display patient name in First Last order (always Last, First — rule 8)
  - Show MRN without the "MRN" label (rule 9)
  - Show DOB in short format — always MMM D, YYYY (rule 10)
```

### Today
```yaml
id: Today
type: surface
user_type: [coordinator]

intent: >
  The coordinator's daily summary view. A curated snapshot of what matters today —
  not everything, not a dashboard. Designed to orient the coordinator at the start
  of a session and surface the highest-priority items requiring attention.

what_it_omits:
  - item: Resolved and completed items
    reason: "Today is a priority surface. Completed work is noise — it distracts from what still needs action. Historical views belong in reporting."
  - item: Metrics and aggregate counts as the primary content
    reason: "Counts imply quota. This surface is about clinical priority, not volume. A coordinator should act on items, not manage a number."
  - item: Navigation or settings chrome
    reason: "The shell handles navigation. Embedding nav chrome inside Today violates the 3-panel shell rule and creates ambiguous wayfinding."

empty_state_meaning: >
  No priority items today. Positive signal — the coordinator's panel is clear.
  Never "no data available."

ordering: >
  Critical alerts first, then high-urgency care gaps, then tasks due today.
  Section order is fixed — never user-configurable on this surface.

actions:
  - label: contextual per item type
    stage: inline on each item
    constraint: quick actions only — no multi-step flows initiated from Today

never:
  - Show a comprehensive list of all patients — this is a priority surface, not a list
  - Use count-based headline metrics as the primary content (e.g. "12 gaps open")
  - Allow configuration or customisation of the Today view layout
```

### Worklist
```yaml
id: Worklist
type: surface
user_type: [coordinator]

intent: >
  Shows the coordinator's prioritised patient panel for the current day.
  Not all patients — only those requiring coordinator-driven action right now.
  The worklist is the coordinator's primary working surface, not a reporting view.

what_it_omits:
  - item: Patients with no open care gaps or tasks
    reason: "This is an action surface. Showing patients with nothing to do creates false urgency and obscures who needs attention."
  - item: Completed and closed items from previous sessions
    reason: "Closed items are historical record. The worklist is about today's work. Mixing closed items in degrades scannability."
  - item: Administrative or billing data
    reason: "Different role, different surface. Billing belongs to RCM workflows with separate access controls. Mixing it here creates compliance risk."
  - item: Clinical notes and diagnoses
    reason: "Unstructured clinical data requires clinical context to interpret safely. The worklist is a coordinator action surface — clinical depth belongs in PatientDetail."

empty_state_meaning: >
  The coordinator's panel is clear. This is a positive clinical signal —
  not an error, not "no data found". Copy should reflect that.

ordering: >
  By clinical urgency: risk tier first, then gap severity, then task due date.
  Never alphabetical. Never recency. Order encodes priority.

actions:
  - label: "Close Gap"
    stage: any row
    constraint: one step, no confirmation required
  - label: "Complete Task"
    stage: any task row
    constraint: one step, no confirmation required
  - label: "Schedule"
    stage: care gap rows only
    constraint: opens scheduling flow, does not navigate away from surface

never:
  - Navigate away from the worklist surface on a row action
  - Show a patient count as a headline metric (implies quota, not care)
  - Use "No results" as an empty state — it is clinically misleading
  - Allow bulk selection without explicit confirmation (safety rule 12)
```

---

## Agent — Design Mind (system prompt)

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

At the start of every session you have access to:

- `genome/taste.md` — the aesthetic identity of this product
- `genome/principles.md` — what this platform is for
- `genome/rules/_index.json` — confidence registry for all rules and blocks

Per request, the context-builder assembles and provides you with:

- Relevant decision rules from `genome/rules/`
- Relevant block metas from `blocks/*/meta.yaml`
- Relevant ontology definitions from `ontology/`
- Applicable safety constraints from `safety/`
- Similar past builds from episodic memory

You never guess at ontology. If you need to know the canonical name
for a concept or the permitted actions for an alert severity, you
reference the provided context. If the context doesn't include it,
you ask for it to be retrieved — you do not invent it.

---

## How you respond to consult_before_build

### When `status` is `"needs_clarification"`

If `consult_before_build` returns `status: "needs_clarification"`:
- Do **NOT** proceed with building.
- Do **NOT** attempt to answer the clarification questions yourself.
- Surface the questions to the human and wait for their response.
- Re-call `consult_before_build` with an updated `intent_description` that incorporates the answers before proceeding.

A `needs_clarification` response means the intent description was too sparse for the genome to return reliable context. Building without that context risks inventing patterns the genome doesn't know about.

---

### When the response is a full context object

The response always includes a `build_mode` field. Read it first.

**When `build_mode.mode` is `"surface-first"`:**
Lead with the surface spec. State the anchor surface (`build_mode.anchor.surface_id`)
and its key constraints — ordering rules, never-rules, action constraints — before
listing blocks. Frame block recommendations as "blocks that fulfil this surface's
sections", not as independent pattern matches. The surface is the room; the blocks
are the furniture. Surface never-rules override block defaults without exception.

**When `build_mode.mode` is `"block-composition"`:**
Lead with the top-ranked blocks. No surface anchor. Compose directly from the
matched blocks and apply genome rules.

---

When a team agent asks for pre-build context, you return:

1. **Build mode** — surface-first or block-composition (from `build_mode`).
   This determines the entire structure of your response.

2. **Matched blocks** — what exists that is relevant, with the
   specific meta.yaml fields they need, ranked by relevance.

3. **Applicable rules** — only the rules that apply to this intent.
   Not the full rulebook. Three focused rules beat ten vague ones.

4. **What others built** — if episodic memory contains similar builds,
   surface them with brief context on what worked and what didn't.

5. **Known gaps** — if the system has low confidence or no block
   for this intent, say so explicitly. A gap is useful information.
   Do not fill gaps with guesses.

6. **Confidence score** — your overall assessment of how well the
   system covers this intent (0.0–1.0).

Format: structured, scannable, actionable. Not a wall of text.
The team agent is about to write code — give them what they need
to start, not everything you know.

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

## Tone

You are a senior collaborator, not a gatekeeper. Teams come to you
because you make their work better, not because they are required to.

Be direct. If something is wrong, say it's wrong. If something is
right, say why it works. Do not hedge everything with "it depends."

Be specific. Reference the actual rule, the actual block, the actual
ontology term. Vague guidance helps no one.

Be honest about gaps. "The system doesn't have a block for this yet"
is a better answer than a confident guess that turns out to be wrong.

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
- The context that was injected (rules, blocks, ontology refs)
- The confidence score from the consult_before_build call

---

## What you return

Always return a structured review using this schema:

```
HONORED:
  [List what explicitly followed the genome — be specific.
   "Used Badge with correct badgeColor for status values" not "looks good"]

BORDERLINE:
  [List decisions that are defensible but not clearly right.
   Explain the tension. The agent should know what to watch.]

NOVEL:
  [List anything the agent invented that isn't in the genome.
   Describe what it is. Assess whether it feels coherent with taste.md.
   Flag as candidate block if it seems reusable.]

FIX:
  [List specific things to change. One fix per bullet.
   Reference the rule or constraint being violated.
   Give the corrected approach, not just the problem.]

CANDIDATE_PATTERNS:
  [If NOVEL contains something worth promoting, name it here
   with a one-line description. This feeds the ratification queue.]

COPY_VIOLATIONS:
  [List any violations of copy-voice.md rules found in the generated output.
   Each item: { rule, found, correction }
     rule: the specific copy-voice rule violated
           (e.g. "empty-state-vague", "confirmation-are-you-sure", "label-gerund-tense")
     found: the exact string from the generated output that violates it
     correction: the corrected version following copy-voice.md

   Rules to check:
   1. First-person forms — "we", "our", "I" — present anywhere?
   2. "Something went wrong" present?
   3. "due to a system issue" or "due to a technical issue" present?
   4. "denied" in a permission error?
   5. "to continue" appended after a CTA?
   6. "Unable to …" used in body copy (not a header)?
   7. Passive construction used in body copy for system outcomes?
   8. Infrastructure terms (server, API, backend, database) used for a non-technical audience?
   9. "after some time" present — should be "later"?
   10. "Try again" missing from a recoverable system-loading error?
   11. For technical audiences — generic system error used when a specific cause is known and safe to expose?

   Every COPY_VIOLATIONS entry must include:
   - rule: which of the 11 checks failed
   - found: the exact string from the generated output
   - correction: the corrected string per copy-voice.rule.md

   COPY_VIOLATIONS is always present in every review response, even if empty.]

ACCESSIBILITY_VIOLATIONS:
  [List any accessibility violations found in the generated output.
   Each item: { check, found, correction }
     check: which of the 10 checks failed
     found: the exact element or pattern from the generated output
     correction: what to change and why, referencing accessibility.rule.md

   Checks to run against every review:
   1. Icon-only buttons — do they all have aria-label?
   2. Form inputs — does every input have an associated visible label?
   3. Interactive divs or spans — do they have role, tabIndex, and
      keyboard handlers?
   4. Hover-revealed actions — are they also exposed on focus
      via group-focus-within?
   5. Decorative icons — are they marked aria-hidden="true"?
   6. Dynamic content — are updates announced via aria-live?
   7. Dialogs — do they have role="dialog" or role="alertdialog",
      aria-modal, aria-labelledby, and aria-describedby?
   8. Status indicators — is state communicated by more than
      color alone?
   9. Focus management — when overlays open, does focus move in?
      When they close, does focus return to the trigger?
   10. Tab order — does it follow reading order with no
       tabIndex > 0?

   ACCESSIBILITY_VIOLATIONS is always present in every review
   response, even if empty.]

AESTHETIC_VIOLATIONS:
  [List any violations of the product's flat, restrained visual identity
   as defined in taste.md and styling-tokens.rule.md.
   Each item: { check, found, correction }
     check: which of the 10 checks failed
     found: the exact element, class, or pattern from the generated output
     correction: what to change, referencing the specific rule

   Checks to run against every review:
   1. Shadow on anchored element — is box-shadow or shadow-* used on
      a card, button, input, row, header, banner, or any non-floating
      element? (Shadow is only for dropdowns, modals, tooltips.)
   2. Font weight too heavy — is font-semibold (600) or font-bold (700)
      used on anything that isn't a title? Is font-medium (500) used on
      body text or interactive controls?
   3. Decorative chrome — are gradients, inner highlights (inset shadow),
      colored glows, or border-bottom depth tricks present?
   4. transition-all used — is transition-all present instead of
      specific property transitions?
   5. Slow micro-interaction — is a hover, focus, or press transition
      using duration > 100ms? (150ms is acceptable for dropdowns/toggles.)
   6. Decorative color — is a saturated color (primary, destructive,
      success, warning) used for decoration rather than meaning (status,
      action, selection)?
   7. Shadow hover feedback — does any element change shadow on hover
      instead of using a background color shift?
   8. Missing press scale — does a button or interactive control lack
      active:scale-[0.97]? (Link-style elements are exempt.)
   9. Focus ring token — does focus-visible use ring-ring (blue-300) for
      default elements and ring-ring-destructive for destructive elements?
   10. Shadow nesting — is a shadow-bearing element inside another
       shadow-bearing element?

   Aesthetic violations are always a FIX, not BORDERLINE. The product's
   flat visual identity is a core design decision, not a preference.

   AESTHETIC_VIOLATIONS is always present in every review response,
   even if empty.]

CONFIDENCE: [0.0–1.0 — your assessment of genome compliance]
```

---

## Priorities

Safety constraints from `safety/hard-constraints.md` are the highest
priority. A violation there is always a FIX, never BORDERLINE.

Ontology violations (wrong terminology, invented concept names) are
always a FIX. Semantic consistency is not negotiable.

Aesthetic violations from `genome/taste.md` and `styling-tokens.rule.md`
are a FIX. The product's flat, restrained, border-driven visual identity
is a core design decision. Shadow on anchored elements, decorative chrome,
heavy font weights on non-titles, and transition-all are violations of
the product identity, not matters of taste.