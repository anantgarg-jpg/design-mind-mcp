# Design Mind MCP — Project Context

> Auto-generated from repo on 2026-03-24. Do not edit manually — run `node scripts/generate-context.js` to refresh.

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
      relevance_score: number
      when: string
      not_when: string
      because: string
      confidence: number
      usage_signal: object

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

  candidate_patterns:
    type: array
    description: Novel items worth promoting to the genome
    items:
      name: string
      description: string
      promoted_to_candidates: boolean

  confidence:
    type: number
    description: Overall genome compliance score (0.0–1.0)
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
- **Alignment is non-negotiable.** Every element should sit on a grid line or be deliberately offset from one. Approximate alignment is worse than no grid at all — it creates a feeling of "almost right" that's more distracting than chaos. In lists and repeated-item layouts, this extends to positional consistency: actions, badges, and recurring elements must occupy the same slot across every item — content variation in one part of a row must never shift an element's position in another.
- **Column alignment in repeated-item layouts.** In lists, rows, and repeated-item layouts, every data column must have a fixed width so that values align vertically across items. A single flexible column (typically the primary label) absorbs width variance by truncating. Variable-width content — such as action buttons or status badges — must be contained within a fixed-width group so they cannot shift adjacent columns. The flexible column is always the one closest to the user's reading entry point (typically the name or title), because truncation there is least disruptive to scanning.
- **Responsive design preserves hierarchy, not just layout.** Focus on web viewports — ensure layouts adapt gracefully across common desktop and laptop screen widths. Reflowing content without re-prioritizing is a missed opportunity. What's most important at a wide viewport should still be most prominent at a narrow one.

---

## Craft and Polish

The difference between good and great is in the details no one consciously notices.

- **Icon consistency.** Same stroke weight, same optical size, same style across every icon in the system. Mixing outlined and filled styles, or varying visual weight, creates subtle discord.
- **Border radius consistency.** Radii are defined in the token system. Use them consistently — mixing values across a screen reads as indecisive, even if no one can pinpoint why.
- **Shadows and elevation with intent.** Elevation tokens are defined in the system. Every use of a shadow should have a clear reason — distinguishing a floating element from the surface beneath it, signalling interactivity, or creating visual grouping. Arbitrary shadows are visual noise.
- **Pixel-level precision.** Subpixel alignment, consistent padding, optical centering of icons within buttons. These things are invisible when right and quietly wrong when not. Sweat them.
- **List scanability test.** In any list or table, cover the leftmost column and check: can you still read each remaining column as a vertical stripe? If column edges waver across rows, the layout fails the scanability test regardless of how individual rows look in isolation.

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


### interface-guidelines (confidence: 0.95)

RULE: interface-guidelines
VERSION: 1.0.0
CONFIDENCE: 0.95

APPLIES_TO: all threads, chat, artifacts, navigator, and solution extension points within the shell

# ── THREADS ─────────────────────────────────────────────────────────────────

WHEN — thread lifecycle:
  A thread is the user's workspace for a single goal.

USE:
  - Treat threads as persistent — messages, open artifacts, form state survive across tab switches and revisits
  - New threads are titled "New" until context exists to rename them
  - Renaming: AI renames once intent is clear, or shell auto-derives title from first user message on navigate-away
  - Threads have no subtitles — the title alone must be descriptive enough
  - Never hardcode or assume a thread's display name — titles are always derived from context
  - URL stays as semantic entry path (e.g. /access) while thread is "New"; transitions to permalink (/threads/<id>) once thread earns a title
  - Semantic URLs are for entry; permalinks are for identity

NOT:
  - Hardcoded thread titles
  - Subtitles on threads
  - Using "pin", "save", or "favourite" — everything is "star" (filled/unfilled)

WHEN — starring:

USE:
  - Star (filled/unfilled) as the only bookmark-like affordance
  - Starred threads and recent threads are personal to the user

NOT:
  - "Pin", "save", or "favourite" terminology

# ── CHAT ────────────────────────────────────────────────────────────────────

WHEN — intent and artifact relationship:

USE:
  - Never surface an artifact until the user's intent is clear
  - If context is missing, ask for it in chat first
  - Artifacts are the result of understood intent, not a starting point
  - When an artifact opens or an action completes, the conversation must continue — acknowledge what happened and offer a next step
  - An empty or skeletal artifact is a last resort

NOT:
  - Surfacing artifacts before intent is clear
  - Dead-end artifact interactions with no follow-up in chat
  - Using artifacts as a starting point instead of a result

WHEN — quick-reply chips:

USE:
  - Chips when a structured response is expected from a constrained set of options
  - Tapping a chip submits it as a message with no separate confirm step
  - Chips are single-use — once the user sends any message after chips appear, all prior chips disappear

NOT:
  - Chips that require a separate confirm step
  - Chips that persist after the user sends a message

WHEN — pre-requisite flows:

USE:
  - Gather pre-requisites as a guided chat sequence
  - Workspace stays hidden until all inputs are satisfied, then the artifact opens automatically
  - Pre-requisite flows are defined per solution via the preRequisites map on the manifest, keyed by threadMode

NOT:
  - Showing the artifact workspace before all pre-requisites are satisfied

# ── ARTIFACTS ───────────────────────────────────────────────────────────────

WHEN — artifact lifecycle:

USE:
  - Artifact components stay mounted for the lifetime of the thread — do not rely on unmount/remount cycles for cleanup or re-initialization between tab switches
  - Fetch data on mount, do not re-fetch on visibility change
  - Content updates only in response to explicit events — a user action, an incoming message, or a data push
  - If block runs timers, animations, or polling, pause them when the artifact is not the active tab (framework hides inactive artifacts via CSS — component is still alive)

NOT:
  - Re-fetching data on tab switch or visibility change
  - Relying on unmount/remount for cleanup
  - Running timers or polling when artifact tab is inactive

WHEN — singleton vs multi-instance:

USE:
  - Singleton for blocks where only one instance makes sense per thread (e.g. dashboard, summary) — re-triggering switches to existing tab
  - Multi-instance for entity-specific views (e.g. provider detail, appointment) — each entity gets its own tab

WHEN — progressive disclosure:

USE:
  - Do not render an artifact until there is enough data to populate it meaningfully
  - Prefer gathering missing context via chat over showing a loading skeleton

WHEN — actions within artifacts:

USE:
  - Each visible section has at most one primary action — the most likely next step
  - Row-level actions in tables and lists appear on hover only, never all at once
  - Supporting actions (secondary, destructive, navigation) use visually lighter treatments than the primary

NOT:
  - Multiple primary actions per section
  - Showing all row-level actions at once

# ── NAVIGATOR ───────────────────────────────────────────────────────────────

WHEN — solutions and default routes:

USE:
  - Each solution declares one or more default routes — pre-defined entry points visible in the sidebar
  - If a solution has only one default route, only its header appears; multiple routes show as sub-items beneath the header
  - Default routes can be view-first (artifact opens immediately) or chat-first (guided conversation, artifact opens later) — declare via the route's threadMode

NOT:
  - Hardcoded navigator entries outside of solution manifests

WHEN — custom threads:

USE:
  - The + on each solution header creates a new custom thread for that solution
  - Custom threads start with chat only — no artifact pre-opened
  - Custom threads are for open-ended exploration; default routes are for known tasks

NOT:
  - Pre-opening artifacts in custom threads

# ── BUILDING ON THE SHELL ───────────────────────────────────────────────────

WHEN — creating a new solution:

USE:
  - Your solution directory under src/solutions/<your-solution>/
  - Everything inside it: manifest, chat handler, pre-requisite flows, block components, types
  - Solutions are auto-discovered at build time — place index.ts in convention directory and it registers automatically, no shell edits needed

NOT:
  - Modifying the shell (src/shell/) — layout, contexts, router, registry, AI dispatch
  - Modifying these guidelines
  - Modifying CLAUDE.md

WHEN — solution directory structure:

USE:
  - src/solutions/<your-solution>/index.ts — single entry point, exports SolutionManifest as default
  - src/solutions/<your-solution>/types.ts — artifact data shapes
  - src/solutions/<your-solution>/chatHandler.ts — ChatHandler + ArtifactPreRequisiteDefinition exports
  - src/solutions/<your-solution>/blocks/MyBlock.tsx — block components receiving ArtifactComponentProps

WHEN — manifest contract:

USE:
  - index.ts default-exports a SolutionManifest with: id (globally unique), slug (URL root, lowercase hyphens only), name (display name in Navigator)
  - blockTypes[] — each with type, label, component, and optionally singleton, urlSegment, entityKey
  - defaultRoutes[] — each with title, urlPath, and optionally threadMode + urlSuffix
  - defaultBlockType — which block opens when user enters the solution (must match a blockTypes[].type)
  - defaultDataFactory — optional function producing initial data for the default artifact from user profile
  - chatHandler — optional ChatHandler with handleMessage and fallbackResponses
  - preRequisites — optional map of threadMode to ArtifactPreRequisiteDefinition for chat-first flows

WHEN — block components:

USE:
  - Every block receives ArtifactComponentProps<TData> with: data (opaque payload), onUpdate(data), onOpenArtifact(descriptor), onClose(), onStartIntakeFlow(mode), onNewThread(title, solutionId, options?), mode ('canvas' or 'inline')

WHEN — chat handlers:

USE:
  - ChatHandler.handleMessage(msg, context) receives user message and ChatHandlerContext with solutionId, threadMode, priorExchanges, activeArtifactType, activeArtifactData
  - Return a ChatResponseSpec to surface an artifact, or null to use fallback responses

WHEN — pre-requisite flows:

USE:
  - Define an ArtifactPreRequisiteDefinition with a seedMessage (opening assistant message) and handleStep(msg, step) function
  - Each step returns a ChatResponseSpec
  - When the spec includes a non-empty type, the flow completes and the artifact opens

BECAUSE:
  These rules define the shell's authoring contract. Threads are persistent
  workspaces, chat drives artifact creation through understood intent, and
  artifacts follow strict lifecycle rules. The navigator and solution
  registration system enables extensibility without modifying the shell —
  solutions plug in via auto-discovery and manifest contracts.

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
  - loading spinner only for action feedback (e.g. button submits, not page loads)

NOT:
  - full-page loading spinners for partial data loads
  - "Loading..." text alone

---

WHEN — information completeness:
  - deciding what data to surface upfront vs. behind progressive disclosure

USE:
  - absolute must-haves — fields required to understand or act on a record — always
    visible without interaction
  - progressive disclosure for contextual or supplementary data that supports but
    does not gate the primary action
  - judgment: if a user must open a detail view to decide what to do, the surface
    is under-displaying

NOT:
  - hiding all secondary context behind expand or drill — this forces unnecessary
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

WEIGHT RULES:
  - font-bold (700): title-default, body emphasis
  - font-semibold (500): title-medium, title-x-large, subheading, label, body emphasis
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
  space-6  24px    p-6        PatientContextHeader horizontal padding
  space-8  32px    p-8        Major section separation, panel gutters
  space-12 48px    p-12       Page-level vertical spacing (rare)
  space-16 64px    p-16       Reserved (almost never needed)

COMPONENT SPACING CONVENTIONS:
  Cards (bg-card):        p-4 (16px all sides)
  Rows (list items):      px-4 py-3.5 (16px horizontal, 14px vertical)
  Alert banners:          p-4 with gap-3 internal
  PatientContextHeader:   px-6 py-4
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
  xl           rounded-xl      12px     Inline cards within chat (InlinePatientCard)
  full         rounded-full    9999px   Badges, pills, status indicators, avatars, chips

COMPONENT DEFAULTS:
  Cards (CareGapCard, StatCard):   rounded-lg
  Alert banners:                    rounded-r-md (left border accent, right rounded)
  StatusBadge:                      rounded-full (always)
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

The platform uses a restrained shadow system. Clinical density demands
that elevation is structural, not decorative. Most surfaces rely on
borders, not shadows, for visual separation.

  LEVEL         CLASS               WHEN
  ────────────  ──────────────────  ────────────────────────────────────────
  flat          (no shadow)         Rows, list items, inline elements, headers
  card          shadow-card         Cards at rest (CareGapCard, StatCard)
  card-hover    shadow-card-hover   Cards on hover — subtle lift
  dropdown      shadow-md           Dropdowns, popovers, context menus
  dialog        shadow-lg           Modals, dialogs, command palette
  tooltip       shadow-sm           Tooltips

WHEN NOT TO USE SHADOWS:
  - Rows in lists — rows use border-b, never shadow
  - PatientContextHeader — uses border-b, no shadow
  - ClinicalAlertBanner — uses colored left border, no shadow
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
  sticky        10        Sticky headers, tab bars, PatientContextHeader
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
# Changes require explicit approval from clinical leadership + a human commit.

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

## Safety — severity schema

```yaml
# Severity schema — machine-readable
# Single source of truth for severity rendering across all surfaces.
# Updated to use design tokens from theme.css.
# Referenced by: ClinicalAlertBanner/meta.yaml, StatusBadge/meta.yaml,
# runtime generation layer, conversational layer.

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
    token: "--alert"                              # Orange — NOT the same as the Alert entity
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

17 ratified blocks:

- **ActionableRow**
- **ChatQuickActionChip**
- **ClinicalAlertBanner**
- **FormLayout**
- **InlinePatientCard**
- **KeyValueList**
- **OutreachLogRow**
- **PageHeader**
- **PatientContextHeader**
- **PatientRow**
- **SdohAssessmentTab**
- **SectionHeader**
- **SectionMessage**
- **StatCard**
- **StatusBadge**
- **StepIndicator**
- **Toolbar**

---

### ActionableRow

#### meta.yaml
```yaml
id: ActionableRow
status: active
component_type: row
level: composite
structural_family: actionable-list-row
confidence: 0.95
version: 1.0.0
introduced: refactor-v1
last_evolved: refactor-v1

summary: >
  The single actionable unit for any entity that appears in a list and needs
  a primary action, optional secondary actions, and status display. Covers
  care gaps, tasks, protocols, assessments, patients — anything that follows
  the "scan → act" coordinator workflow. Two layout variants share identical
  interaction invariants: row (border-l-2 accent stripe, border-b divider)
  and card (rounded-lg border, standalone shadow).

  Rule: use ActionableRow. Do NOT create a new pattern just because the entity
  domain changes. New pattern only when the STRUCTURE changes — different
  interaction model, different layout container, different slot arrangement.

when:
  - displaying any entity in a list where the user can take a primary action
  - worklist rows: care gaps, tasks, protocols, assessments
  - variant="row" when rows live inside a shared container (bg-card rounded-lg border)
  - variant="card" when each row is a standalone card (its own border + shadow)

not_when:
  - summary counts or metrics → use StatCard
  - patient identity header → use PatientContextHeader
  - clinical alert requiring immediate acknowledgment → use ClinicalAlertBanner
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
      - contextLabel (optional patient name when not in patient-scoped view)
      - status (optional StatusBadge)
      - meta[] (icon + text pairs, up to ~3)
      - primaryAction (right-aligned button)
      - secondaryActions (MoreHorizontal dropdown)
      - onExpand (chevron that opens detail panel)

  - id: card
    description: >
      Used when each row is a standalone card. No shared container.
      Has its own border, rounded corners, and shadow.
    invariants:
      - "flex items-start justify-between gap-4 p-4 bg-card border border-border/60 rounded-lg shadow-card hover:shadow-card-hover transition-shadow"
    slots:
      - title (required)
      - label (optional monospace badge above title)
      - contextLabel (optional patient name)
      - status (optional StatusBadge)
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

props:
  variant: '"row" | "card" — default "row"'
  title: "string — primary label (required)"
  titleMono: "boolean — renders title in monospace (for codes like PHQ-9)"
  label: "string — small badge above title (e.g. measure code HBD)"
  labelMono: "boolean — renders label in monospace"
  contextLabel: "string — patient name when outside patient-scoped view"
  status: "StatusKey — passed to StatusBadge"
  accent: '"warning" | "accent" | "success" | "none" — row stripe color'
  meta: "MetaItem[] — [{icon?, text, urgent?, success?}]"
  primaryAction: "{ label: string; onClick: () => void }"
  secondaryActions: "SecondaryAction[] — rendered in MoreHorizontal dropdown"
  onExpand: "() => void — shows ChevronRight button"
  onRowClick: "() => void — makes full row clickable (e.g., open tab)"
  dimmed: "boolean — opacity-50, no actions, no hover"

ontology_refs:
  entities: [CareGap, Task, CareProtocol, Assessment, Patient]
  states: [CareGapStatus, TaskStatus, ProtocolStatus]
  actions: [CloseGap, Complete, Activate, View, Assign, AddNote, Exclude, StartAssessment]

embedding_hint: >
  actionable row card list worklist care gap task protocol assessment
  coordinator close gap complete assign exclude add note overdue status
  accent stripe variant row card entity action unit scan act workflow
  patient name context label meta icon primary action secondary dropdown
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
  - "Shape: rounded-full border border-border/70 hover:border-primary/50 shadow-card"
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
  is rounded-full, border-border/70, hover:border-primary/50, shadow-card. The
  triggered response is an assistant message with a text lead and an InlineCard
  attached below it.

when:
  - adding a one-tap shortcut for a frequently-needed data lookup in Panel 2
  - the data to surface is compact enough to fit in an inline card (not a full artifact)
  - coordinator needs the answer in conversation flow without context-switching

not_when:
  - the data requires a full list, table, or multi-record view — open an artifact tab instead
  - the action modifies data — chips are read-only triggers
  - more than ~4 chips (strip becomes unwieldy — consider a command palette instead)

because: >
  Panel 2 is the primary navigation instrument. Chips let coordinators surface
  structured context without typing a query or leaving the conversation flow. They
  complement — not replace — full artifact tabs.

ontology_refs:
  entities: [Patient, CareGap]
  states: []
  actions: []

usage_signal:
  renders_total: 0
  products: []
  override_rate: 0.0

embedding_hint: >
  chat chip quick action shortcut pill button panel 2 inline card conversation
  one tap lookup coordinator last outreach next patient structured response
  no artifact tab chat input strip persistent
```

#### component.tsx
```tsx
// Canonical implementation lives in shell/panels/ChatPanel.tsx
// The chip strip and handleXxxChip handlers are the reference implementation.
// See also: patterns/InlinePatientCard/ for the card triggered by each chip.
export { ChatPanel } from "../../shell/panels/ChatPanel"
```

---

### ClinicalAlertBanner

#### meta.yaml
```yaml
id: ClinicalAlertBanner
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
  The primary surface for displaying clinical alerts that require
  attention or action. Severity is always visible. Permitted actions
  are determined by severity level. This component is the most
  safety-critical in the library.

when:
  - displaying any Alert entity that requires clinical attention
  - interrupting a workflow with patient safety information
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

ontology_refs:
  entities: [Alert, Patient]
  states: [AlertSeverity]
  actions: [Acknowledge, Escalate, Dismiss]

safety_refs:
  - safety/hard-constraints.md rules 1, 5, 6, 7
  - safety/severity-schema.yaml

usage_signal:
  renders_total: 0
  products: []
  override_rate: 0.0

embedding_hint: >
  clinical alert banner interrupt workflow severity urgent patient
  safety acknowledge escalate dismiss critical high medium low
  warning notification required action audit trail
```

#### component.tsx
```tsx
import { AlertOctagon, AlertTriangle, AlertCircle, Info, X, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/ClinicalAlertBanner/meta.yaml
// Safety:   safety/severity-schema.yaml (single source of truth for severity tokens)
//           safety/hard-constraints.md rules 1, 5, 6
// Ontology: ontology/entities.yaml → Alert
//           ontology/states.yaml → AlertSeverity
//
// HARD CONSTRAINTS — never change without clinical leadership approval:
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
    // --alert = Orange = High severity (≠ Alert entity)
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

interface ClinicalAlertBannerProps {
  severity: Severity
  title: string
  body?: string
  // Patient name — use when alert is in a non-patient-scoped surface
  patientName?: string
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

export function ClinicalAlertBanner({
  severity,
  title,
  body,
  patientName,
  triggeredAt,
  onAcknowledge,
  onEscalate,
  onDismiss,
  onAuditEvent,
  className,
}: ClinicalAlertBannerProps) {
  const config = SEVERITY_CONFIG[severity]
  const { Icon } = config

  if (process.env.NODE_ENV === "development") {
    if (config.requiresAcknowledge && !onAcknowledge) {
      console.error(
        `ClinicalAlertBanner: severity="${severity}" requires onAcknowledge. ` +
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
            {/* Patient name in "Last, First" format — hard-constraint rule 7 */}
            {patientName && (
              <p className={cn("text-sm font-semibold mb-1", config.bodyClass)}>
                {patientName}
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
                variant="ghost"
                size="sm"
                onClick={handleEscalate}
                className={cn("h-7 gap-1 text-sm", config.bodyClass)}
              >
                <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                Escalate
              </Button>
            )}

            {config.requiresAcknowledge && onAcknowledge && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAcknowledge}
                className="h-7 text-sm bg-card"
              >
                Acknowledge
              </Button>
            )}

            {/* Dismiss is forbidden on critical (hard-constraint rule 5) */}
            {config.canDismiss && onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className={cn("h-7 w-7 p-0", config.bodyClass)}
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

### FormLayout

#### meta.yaml
```yaml
id: FormLayout
status: placeholder
component_type: form
level: composite
structural_family: assessment-form
confidence: 0.0
version: 0.0.0

summary: >
  Placeholder — not yet ratified. Standard form layout shell for
  structured data entry — field groups, section labels, submit/cancel
  actions in the footer. Governs spacing, field width, label placement,
  and button placement for all non-assessment forms.

when:
  - structured data entry form with multiple fields
  - creating or editing an entity (Task, Note, Care Protocol)
  - form needs consistent field spacing, grouping, and footer actions

not_when:
  - clinical assessment instrument — use SdohAssessmentTab or equivalent
  - single inline field with no group structure — no layout wrapper needed
  - read-only display of form data — use KeyValueList

embedding_hint: >
  form layout shell data entry fields groups labels submit cancel footer
  create edit task note care protocol structured input spacing field width
  label placement standard form wrapper
```

---

### InlinePatientCard

#### meta.yaml
```yaml
id: InlinePatientCard
status: active
component_type: card
level: domain
structural_family: inline-chat-card
family_invariants:
  - "Only rendered inside Panel 2 chat context — never standalone"
  - "Structure: avatar (initials, risk-tinted) + name + badge + max 2 info rows + footer divider"
  - "Container: bg-card border border-border rounded-lg"
  - "Always paired with a ChatQuickActionChip trigger"
confidence: 0.85
version: 1.0.0
introduced: 2026-03-20
last_evolved: 2026-03-20

summary: >
  A compact structured card rendered inside an assistant message bubble in Panel 2,
  triggered by a ChatQuickActionChip. Uses a shared InlineCard shell: initials avatar
  (risk-tinted color pool) + patient name (Last, First) + secondary badge, followed
  by 1-2 info rows with icons, then a divider footer with metadata. Two implementations:
  InlineOutreachCard (last outreach: type, outcome, care gap, coordinator, timestamp)
  and InlineNextPatientCard (next patient: risk tier, open gap count, next due item,
  suggested action).

when:
  - displaying structured patient data inline in the chat conversation after a chip tap
  - data fits the avatar + 2 rows + footer template (not more complex)
  - always paired with ChatQuickActionChip — never rendered standalone

not_when:
  - data requires more than 2 info rows — open a full artifact instead
  - outside Panel 2 / chat context — use PatientRow or PatientContextHeader
  - displaying more than one patient record — use a list artifact

because: >
  Inline cards keep the coordinator in conversation flow. The shared InlineCard shell
  ensures visual consistency across all chip-triggered responses regardless of the
  data domain. Avatar + secondary badge + rows + footer is the minimum viable
  structure for patient-scoped data.

ontology_refs:
  entities: [Patient, CareGap, Task]
  states: [CareGapStatus]
  actions: []

usage_signal:
  renders_total: 0
  products: []
  override_rate: 0.0

embedding_hint: >
  inline card chat assistant message patient avatar initials outreach next patient
  risk tier care gap suggested action coordinator timestamp bubble panel 2
  structured data compact two rows footer shared shell chip triggered
```

#### component.tsx
```tsx
// Canonical implementation lives in shell/panels/ChatPanel.tsx
// Exports: InlineCard (shared shell), InlineOutreachCard, InlineNextPatientCard
// Always used in conjunction with ChatQuickActionChip — see patterns/ChatQuickActionChip/
export { ChatPanel } from "../../shell/panels/ChatPanel"
```

---

### KeyValueList

#### meta.yaml
```yaml
id: KeyValueList
status: placeholder
component_type: list
level: primitive
structural_family: readonly-list-row
confidence: 0.0
version: 0.0.0

summary: >
  Placeholder — not yet ratified. A read-only list of labeled field/value
  pairs used for displaying entity details. Covers patient demographics,
  care team info, and similar structured data in detail panels.

when:
  - displaying a set of labeled fields for a single entity
  - detail panel or summary section with no actions per row
  - structured metadata that benefits from label/value alignment

not_when:
  - actionable list rows — use ActionableRow
  - tabular data with multiple entities — use a table or list of rows
  - single metric — use StatCard

embedding_hint: >
  key value list label field detail panel read only metadata entity
  demographics care team structured data name value pairs summary
```

---

### OutreachLogRow

#### meta.yaml
```yaml
id: OutreachLogRow
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
  A compact read-only row in a 24-hour outreach activity log. Shows patient avatar
  (initials, risk-tinted), patient name (Last, First), related Care Gap or Task name,
  outreach type (Phone Call / Portal Message / Letter) with icon, outcome
  (Reached / Left Voicemail / No Answer / Declined / Sent) with colored icon and
  design token, coordinator name, and relative timestamp. No-answer rows get a
  left-border warning accent. Used inside OutreachLogArtifact — a full-panel artifact
  with type and outcome filters and a summary header.

when:
  - displaying a single completed outreach attempt in a chronological log
  - audit or review surface showing all outreach across a coordinator's panel
  - coordinator needs to see who was contacted, what happened, and what needs follow-up

not_when:
  - scheduling or initiating outreach — this is a read-only log pattern
  - patient-scoped surfaces showing outreach for a single patient — use TaskActionRow
  - population-level outreach metrics — use a stat/chart component

because: >
  Coordinators need a fast daily audit of outreach activity. The compact row density
  (per data-density rule) lets them scan the full day at once. No-answer left-border
  accent makes unresolved attempts visually scannable without reading every row.

ontology_refs:
  entities: [Patient, CareGap, Task]
  states: [CareGapStatus]
  actions: []

usage_signal:
  renders_total: 0
  products: []
  override_rate: 0.0

embedding_hint: >
  outreach log row phone call portal message letter reached no answer voicemail
  declined sent coordinator patient care gap audit 24 hours activity log
  read only chronological filter type outcome compact density panel
```

#### component.tsx
```tsx
// Canonical implementation lives in shell/artifacts/OutreachLogArtifact.tsx (OutreachRow)
// The full artifact (OutreachLogArtifact) is the reference surface for this pattern.
export { OutreachLogArtifact } from "../../shell/artifacts/OutreachLogArtifact"
```

---

### PageHeader

#### meta.yaml
```yaml
id: PageHeader
status: placeholder
component_type: header
level: composite
structural_family: section-organiser
confidence: 0.0
version: 0.0.0

summary: >
  Placeholder — not yet ratified. Page-level header for non-patient-scoped
  surfaces. Encodes the surface title, optional subtitle, and top-level
  page actions. Distinct from PatientContextHeader (patient-scoped only).

when:
  - top-level heading of a non-patient-scoped page or artifact
  - surface needs a title, optional description, and primary page actions

not_when:
  - patient-scoped surface — use PatientContextHeader
  - section within a page — use SectionHeader

embedding_hint: >
  page header title surface artifact heading top level actions breadcrumb
  navigation non-patient coordinator admin surface name
```

---

### PatientContextHeader

#### meta.yaml
```yaml
id: PatientContextHeader
status: active
component_type: header
level: composite
structural_family: patient-context-header
family_invariants:
  - "Layout: flex items-center justify-between gap-4 px-6 py-4 bg-card border-b border-border"
  - "Patient name: Last, First format — never truncated, never first-name only"
  - "MRN always labeled 'MRN' — never 'Patient ID', 'Chart Number', etc."
  - "DOB always full format: MMM D, YYYY — never shortened or omitted"
  - "Always the topmost element of any patient-scoped surface"
confidence: 0.90
version: 1.0.0
introduced: seed-v0
last_evolved: seed-v0

summary: >
  Displays the current patient context at the top of any clinical
  workflow surface. Ensures the clinician always knows who they are
  acting on behalf of. The most visible component on any patient-scoped
  surface — inconsistency here breaks clinician trust immediately.

when:
  - any surface scoped to a single patient's data
  - any workflow where a clinician is taking action for a specific patient
  - at the top of all patient-detail pages and workflow panels

not_when:
  - population-level views with no single patient context
  - admin surfaces not scoped to a patient
  - login, settings, or navigation-only pages

required_fields:
  - patient full name (Last, First format per ontology/entities.yaml)
  - MRN (labeled "MRN" — hard-constraints.md rule 9)
  - date of birth (full date — hard-constraints.md rule 10)

optional_fields:
  - primary payer
  - risk score / risk tier
  - care team name
  - active alert count (drives urgency indicator)

layout:
  - always renders as a horizontal strip at top of content area
  - never collapses to icon-only — patient identity must always be text-visible
  - alert count badge links to ClinicalAlertBanner stack below

ontology_refs:
  entities: [Patient, CareTeam, Alert]
  states: [AlertSeverity]

safety_refs:
  - safety/hard-constraints.md rules 8, 9, 10

usage_signal:
  renders_total: 0
  products: []
  override_rate: 0.0

embedding_hint: >
  patient context header identity name MRN date of birth DOB
  risk score care team alert count clinical workflow who patient
  is demographics top of page always visible
```

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import { AlertOctagon } from "lucide-react"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/PatientContextHeader/meta.yaml
// Ontology: ontology/entities.yaml → Patient (identifier_label: "MRN")
// Safety:   safety/hard-constraints.md rules 7, 8, 10
//
// HARD CONSTRAINTS — never change without clinical leadership approval:
//   Rule 7:  Name always "Last, First" format. Never first name only.
//   Rule 8:  DOB always MM/DD/YYYY. Age may appear alongside but never replaces it.
//   Rule 10: Empty/null fields show "—". Blank space can be misread as cleared/zero.
//
// MRN label is hard-constrained as "MRN" — never "Patient ID", "Chart Number", etc.

interface PatientContextHeaderProps {
  // Required — hard-constraints.md rules 7, 8
  lastName: string
  firstName: string
  mrn: string
  // DOB must be passed as MM/DD/YYYY per hard-constraints.md rule 8
  // Age (copy-voice.md: MMM D, YYYY) applies to general dates but NOT DOB
  dateOfBirth: string

  // Optional context — rendered when present; absent fields produce no blank space
  age?: number
  primaryPayer?: string
  riskTier?: "high" | "medium" | "low" | "none"
  careTeamName?: string
  // Alert count badge: links to ClinicalAlertBanner stack below this header
  activeAlertCount?: number
  highestAlertSeverity?: "critical" | "high" | "medium" | "low"

  onAlertClick?: () => void
  className?: string
}

const RISK_CONFIG = {
  high:   { label: "High Risk",    classes: "bg-destructive/10 text-destructive border border-destructive/30" },
  medium: { label: "Medium Risk",  classes: "bg-[var(--alert-light)] text-alert border border-alert/30" },
  low:    { label: "Low Risk",     classes: "bg-success/10 text-success border border-success/30" },
  none:   { label: "No Risk Score", classes: "bg-muted text-muted-foreground border border-border" },
}

export function PatientContextHeader({
  lastName,
  firstName,
  mrn,
  dateOfBirth,
  age,
  primaryPayer,
  riskTier,
  careTeamName,
  activeAlertCount,
  highestAlertSeverity,
  onAlertClick,
  className,
}: PatientContextHeaderProps) {
  const riskConfig = riskTier ? RISK_CONFIG[riskTier] : null
  const hasAlerts = activeAlertCount != null && activeAlertCount > 0
  const alertIsCritical = highestAlertSeverity === "critical"

  // hard-constraint rule 10: required fields show "—" if empty
  const displayName   = `${lastName || "—"}, ${firstName || "—"}`
  const displayMrn    = mrn || "—"
  const displayDob    = dateOfBirth || "—"

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-6 py-4",
        "bg-card border-b border-border",
        className
      )}
      aria-label="Patient context"
    >
      {/* Patient identity — always visible, never truncated (meta.yaml invariant) */}
      <div className="flex items-center gap-6 min-w-0">
        <div>
          {/* Last, First format — hard-constraint rule 7 */}
          <p className="text-base font-semibold text-foreground leading-tight">
            {displayName}
          </p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {/* "MRN" label is hard-constrained — ontology/entities.yaml identifier_label */}
            <span className="text-sm text-muted-foreground">
              MRN <span className="font-semibold text-foreground">{displayMrn}</span>
            </span>
            {/* MM/DD/YYYY format — hard-constraint rule 8 */}
            <span className="text-sm text-muted-foreground">
              DOB <span className="font-semibold text-foreground">{displayDob}</span>
              {age != null && (
                <span className="text-muted-foreground"> ({age}y)</span>
              )}
            </span>
            {primaryPayer && (
              <span className="text-sm text-muted-foreground">{primaryPayer}</span>
            )}
          </div>
        </div>
      </div>

      {/* Contextual signals — right-aligned, flex-shrink-0 so identity is never truncated */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {careTeamName && (
          <span className="text-sm text-muted-foreground hidden md:block">
            {careTeamName}
          </span>
        )}

        {riskConfig && (
          <span className={cn(
            "inline-flex items-center text-sm font-semibold px-2 py-0.5 rounded-full",
            riskConfig.classes
          )}>
            {riskConfig.label}
          </span>
        )}

        {/* Alert indicator — links to ClinicalAlertBanner stack */}
        {hasAlerts && (
          <button
            onClick={onAlertClick}
            className={cn(
              "inline-flex items-center gap-1 text-sm font-semibold",
              "px-2 py-0.5 rounded-full border transition-colors",
              alertIsCritical
                ? "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20"
                : "bg-[var(--alert-light)] text-alert border-alert/30 hover:bg-[var(--alert-light)]"
            )}
            // canonical entity name "Alert" per ontology/entities.yaml
            aria-label={`${activeAlertCount} active Alert${activeAlertCount! > 1 ? "s" : ""}`}
          >
            <AlertOctagon className="h-3 w-3" aria-hidden="true" />
            {activeAlertCount} Alert{activeAlertCount! > 1 ? "s" : ""}
          </button>
        )}
      </div>
    </div>
  )
}
```

---

### PatientRow

#### meta.yaml
```yaml
id: PatientRow
status: active
component_type: row
level: composite
structural_family: actionable-list-row
family_invariants:
  - "Layout: flex items-start gap-3 px-4 py-3"
  - "Container: bg-card hover:bg-muted/50 transition-colors (row separation is a parent concern via divide-y)"
  - "Left accent: border-l-2 (warning for overdue, accent for active/available, transparent for neutral)"
  - "Primary action: Button variant='outline' or 'default' size='sm' className='h-7 text-sm'"
  - "Secondary actions: Button variant='ghost' size='sm' className='h-7 w-7 p-0 text-muted-foreground'"
  - "Meta row: flex items-center gap-3 mt-1 with text-sm text-muted-foreground"
confidence: 0.92
version: 1.0.0

summary: >
  The primary list item for population-level patient worklists.
  Shows patient identity, risk signal, band, and a context-specific
  primary action. Used in priority patient lists, outreach queues,
  and any surface where coordinators scan and act on patients.

when:
  - displaying a list of patients with risk scores and actions
  - coordinator needs to scan and act on multiple patients quickly
  - population-level or worklist view

not_when:
  - single patient detail view
  - patient search results (different density/purpose)
  - admin/non-clinical patient lists

key_rules:
  - name always Last, First format
  - risk score uses tabular-nums for column alignment
  - primary action label is context-specific (not generic "View")
  - overdue patients get amber left border accent automatically
  - avatar color is derived from initials, never random per render

ontology_refs:
  entities: [Patient, Provider]

embedding_hint: >
  patient row list worklist priority risk score band outreach
  coordinator scan action population health care management
```

#### component.tsx
```tsx
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/PatientRow/meta.yaml
// Ontology: ontology/entities.yaml → Patient, Provider
// Safety:   safety/hard-constraints.md rules 7, 10
// Density:  genome/rules/data-density.rule.md — scanning workflow, high throughput
// Taste:    genome/taste.md — density baseline 6, tabular-nums for risk score alignment
//
// HARD CONSTRAINTS:
//   Rule 7:  Name always "Last, First". Never first name only.
//   Rule 10: Empty fields show "—" not blank.
//
// INVARIANTS (meta.yaml):
//   flex items-center gap-3 px-4 py-3.5
//   bg-card hover:bg-muted/50 (row separation is parent concern via divide-y)
//   border-l-2: warning for overdue, accent for active, transparent for neutral
//   Primary action: Button variant="outline" or "default" size="sm" h-7 text-sm
//   Risk score: tabular-nums for column alignment across rows

type RiskTier = "high" | "medium" | "low"
type BandLevel = 1 | 2 | 3 | 4

const RISK_CONFIG: Record<RiskTier, { label: string; className: string; dot: string }> = {
  // --destructive = Red
  high:   { label: "High", className: "text-destructive font-semibold", dot: "bg-destructive" },
  // --alert = Orange
  medium: { label: "Med",  className: "text-alert font-semibold",       dot: "bg-alert" },
  // neutral for low risk
  low:    { label: "Low",  className: "text-muted-foreground",           dot: "bg-border" },
}

// Avatar color derived from initials — stable across renders (not random)
const INITIALS_COLORS = [
  "bg-primary/10 text-primary",
  "bg-success/10 text-success",
  "bg-alert/10 text-alert",
  "bg-destructive/10 text-destructive",
]

interface PatientRowProps {
  initials: string
  // Name in "Last, First" format — hard-constraint rule 7
  name: string
  // Context string e.g. "HbA1c overdue · 90 days" — show "—" if unknown
  condition: string
  riskScore: number
  riskTrend?: "up" | "down" | "stable"
  riskTier: RiskTier
  band: BandLevel
  // Context-specific label (not generic "View") — e.g. "Start Outreach", "Triage"
  primaryAction: string
  primaryActionVariant?: "default" | "outline"
  isOverdue?: boolean
  onPrimaryAction?: () => void
  onExpand?: () => void
  className?: string
}

export function PatientRow({
  initials,
  name,
  condition,
  riskScore,
  riskTrend = "stable",
  riskTier,
  band,
  primaryAction,
  primaryActionVariant = "default",
  isOverdue,
  onPrimaryAction,
  onExpand,
  className,
}: PatientRowProps) {
  const risk = RISK_CONFIG[riskTier]
  // Deterministic color from first initial — never random per render (meta.yaml key_rules)
  const colorIdx = initials.charCodeAt(0) % INITIALS_COLORS.length

  // hard-constraint rule 10: empty condition shows "—" not blank
  const displayCondition = condition || "—"

  return (
    <div className={cn(
      "flex items-start gap-3 px-4 py-3 bg-card hover:bg-muted/50 transition-colors cursor-default group",
      // Overdue left border accent — amber per meta.yaml key_rules
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

      {/* Name + condition — fills available space */}
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-foreground leading-tight truncate">{name}</p>
        <p className="text-sm text-muted-foreground mt-1 truncate">{displayCondition}</p>
      </div>

      {/* Right columns — fixed-width group so risk/band/CTA align across rows */}
      <div className="flex items-center gap-3 w-72 flex-shrink-0 self-center">
        {/* Risk score — tabular-nums for column alignment */}
        <div className="flex items-center gap-1 w-16 flex-shrink-0">
          <span className={cn("text-base tabular-nums", risk.className)}>{riskScore}</span>
          {riskTrend === "up"   && <span className="text-destructive text-sm" aria-label="trending up">↑</span>}
          {riskTrend === "down" && <span className="text-success text-sm"     aria-label="trending down">↓</span>}
        </div>

        {/* Band */}
        <div className="flex items-center gap-1.5 w-20 flex-shrink-0">
          <span className={cn("w-2 h-2 rounded-full flex-shrink-0", risk.dot)} aria-hidden="true" />
          <span className="text-sm text-muted-foreground">Band {band}</span>
        </div>

        {/* Primary action — right-aligned */}
        <div className="flex-1 flex justify-end">
          <Button
            size="sm"
            variant={primaryActionVariant}
            onClick={onPrimaryAction}
            className="h-7 text-sm whitespace-nowrap"
          >
            {primaryAction}
          </Button>
        </div>
      </div>

      {/* Expand — visible on hover only */}
      {onExpand && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onExpand}
          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
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

### SdohAssessmentTab

#### meta.yaml
```yaml
id: SdohAssessmentTab
status: active
component_type: form
level: domain
structural_family: assessment-form
family_invariants:
  - "Instrument questions are verbatim — never paraphrased or shortened (safety rule 14)"
  - "Submit disabled until all required questions answered"
  - "Score and results not shown until at least one answer recorded"
  - "Self-harm indicator question: trigger Review badge on any non-zero answer"
  - "Never navigate away on submit — show inline success/results state"
confidence: 0.85
version: 1.0.0
introduced: 2026-03-20
last_evolved: 2026-03-20

summary: >
  Two-view assessment component for SDOH (Social Determinants of Health) screening
  in a patient-scoped surface. View 1: AHC HRSN-inspired questionnaire across 5 domains
  (Housing, Food Security, Transportation, Social Isolation, Financial Strain) with radio
  pill responses. View 2: per-domain results with need level indicators (flagged/clear/
  not screened), Create Task CTA on flagged domains, and Re-screen action. Integrates
  into the patient detail artifact as a tab.

when:
  - screening a patient for social determinants of health needs
  - care coordinator needs to record and act on SDOH needs within patient context
  - displaying SDOH screening results with per-domain flagged status and follow-up actions

not_when:
  - population-level SDOH summary counts — use a stat/metric component
  - read-only display of a single SDOH data point — use StatusBadge
  - outside a patient-scoped surface (PatientContextHeader must be present above)

because: >
  SDOH needs directly affect clinical outcomes and care gap closure rates. Coordinators
  need a fast, structured way to screen and act without leaving patient context. The
  two-view design (form → results) avoids re-entry and surfaces actionable tasks
  immediately on flagged domains.

actions_available:
  - Start SDOH Screening (when no assessment on file)
  - Save Assessment (completes the form, transitions to results view)
  - Create Task (per flagged domain in results view)
  - Re-screen (from results view, resets form)

ontology_refs:
  entities: [Patient, Task]
  states: []
  actions: [Assign]

usage_signal:
  renders_total: 0
  products: []
  override_rate: 0.0

embedding_hint: >
  SDOH social determinants health screening assessment form housing food security
  transportation social isolation financial strain coordinator patient questionnaire
  domains flagged needs identified results summary task create re-screen AHC HRSN
  two-view form results tab patient detail
```

#### component.tsx
```tsx
// Canonical implementation lives in shell/artifacts/SdohAssessmentTab.tsx
// This re-export makes the pattern discoverable from patterns/ like all other genome patterns.
export { SdohAssessmentTab } from "../../shell/artifacts/SdohAssessmentTab"
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
family_invariants:
  - "Typography: text-xs font-semibold uppercase tracking-wider text-muted-foreground"
  - "Never bold or large — should recede visually, not dominate"
  - "Always uppercase tracking-wider — wayfinding label, not a headline"
confidence: 0.90
version: 1.0.0

summary: >
  Artifact content section label with optional count and action.
  Used to divide Panel 3 content into named groups — "NEEDS ATTENTION",
  "COMING UP", "CARE GAPS". Muted and small — organizes without competing.

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
  care gaps count wayfinding artifact content organizer
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

### SectionMessage

#### meta.yaml
```yaml
id: SectionMessage
status: placeholder
component_type: banner
level: primitive
structural_family: section-organiser
confidence: 0.0
version: 0.0.0

summary: >
  Placeholder — not yet ratified. Inline informational, warning, or success
  message block within page content. Distinct from ClinicalAlertBanner
  (clinical safety interrupts) — this is for non-urgent contextual messaging
  embedded in a surface section.

when:
  - displaying non-urgent contextual information within a section
  - surfacing a passive system notice that doesn't require immediate action
  - empty-state guidance or inline onboarding hints

not_when:
  - clinical alert requiring acknowledgment — use ClinicalAlertBanner
  - transient feedback after an action — use Toast
  - inline field validation — use FormFieldError

embedding_hint: >
  section message info banner inline notice contextual hint empty state
  guidance non-urgent passive system message onboarding surface content
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
  - "Label: text-xs font-semibold uppercase tracking-wide text-muted-foreground"
  - "Value: text-2xl font-bold tabular-nums"
  - "Maximum 4 StatCards per row"
  - "Variant tokens: default=foreground, urgent=destructive, warning=warning, success=success"
confidence: 0.88
version: 1.0.0

summary: >
  Metric display card for dashboard summary rows. Shows a label,
  a large numeric value, and an optional subtitle. Used in the
  artifact content header area to give coordinators their daily
  snapshot at a glance.

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
  - value always uses tabular-nums for alignment
  - label always uppercase tracking-wide (wayfinding, not a headline)
  - max 4 StatCards in a single row for readability

embedding_hint: >
  stat card metric dashboard summary count number value
  patients tasks care gaps overdue attention daily snapshot
```

#### component.tsx
```tsx
import { cn } from "@/lib/utils"

// ── Genome sources ────────────────────────────────────────────────────────────
// Block:    blocks/StatCard/meta.yaml
// Tokens:   genome/rules/styling-tokens.rule.md
// Taste:    genome/taste.md — numbers earn emphasis; tabular-nums for alignment
// Density:  genome/rules/data-density.rule.md — value scannable at a glance
//
// INVARIANTS:
//   Label: text-sm (12px) font-semibold uppercase tracking-wide text-muted-foreground
//   Value: text-2xl font-semibold tabular-nums leading-none
//   Max 4 StatCards per row.
//
// Variant tokens map to semantic colors — never use Tailwind default colors.
//   urgent  → --destructive (Critical severity / highest-stakes data)
//   warning → --warning     (Overdue / at-risk)
//   success → --success     (Positive outcomes)
//   default → --foreground  (General counts, neutral)

type StatVariant = "default" | "urgent" | "warning" | "success"

const VARIANT_CONFIG: Record<StatVariant, { valueClass: string; subtitleClass: string }> = {
  default: { valueClass: "text-foreground",          subtitleClass: "text-muted-foreground" },
  urgent:  { valueClass: "text-destructive",         subtitleClass: "text-destructive/70" },
  warning: { valueClass: "text-warning",             subtitleClass: "text-warning/70" },
  success: { valueClass: "text-success",             subtitleClass: "text-success/70" },
}

interface StatCardProps {
  label: string
  value: number | string
  // subtitle: supporting context — shown only when it adds meaning to the value
  subtitle?: string
  variant?: StatVariant
  // onClick: makes the entire card interactive; hover state activates automatically
  onClick?: () => void
  className?: string
}

export function StatCard({
  label,
  value,
  subtitle,
  variant = "default",
  onClick,
  className,
}: StatCardProps) {
  const v = VARIANT_CONFIG[variant]

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      className={cn(
        "flex flex-col gap-1 p-4 bg-card rounded-lg border border-border/40 shadow-card",
        "transition-shadow",
        onClick && "cursor-pointer hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className={cn("text-2xl font-semibold tabular-nums leading-none", v.valueClass)}>
        {value}
      </p>
      {subtitle && (
        <p className={cn("text-sm leading-tight", v.subtitleClass)}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
```

---

### StatusBadge

#### meta.yaml
```yaml
id: StatusBadge
status: active
component_type: badge
level: primitive
structural_family: status-indicator
family_invariants:
  - "Label text from ontology/states.yaml canonical_name only — never custom text"
  - "Color token from ontology/states.yaml color_token only — never custom colors"
  - "Always include aria-label for accessibility"
  - "Sizes: sm (inline/dense), md (default in cards/rows) — never lg"
confidence: 0.95
version: 1.0.0
introduced: seed-v0
last_evolved: seed-v0

summary: >
  The atomic unit of status display. Every entity state in the platform
  is rendered through this component. It is the most-used component
  and the highest-stakes for semantic consistency.

when:
  - displaying the current state of any entity (Task, CareGap, Alert, Patient)
  - any surface that shows a list of entities needs their status visible

not_when:
  - displaying severity of a clinical alert → use ClinicalAlertBanner which
    renders its own severity indicator
  - displaying a count or numeric value → use a plain text span

variants:
  - outline: default, low-emphasis states (Open, Excluded)
  - subtle: colored background at 10% opacity (In Progress, In Outreach)
  - solid: high-emphasis, reserved for Critical severity only

size:
  - sm: used inline within text or dense lists
  - md: default, used in cards and rows
  - lg: never — StatusBadge does not scale up

rules:
  - label text comes from ontology/states.yaml canonical_name only
  - color token comes from ontology/states.yaml color_token only
  - never use custom colors outside the token system
  - always include aria-label for screen readers

ontology_refs:
  states: [TaskStatus, CareGapStatus, AlertSeverity]

safety_refs:
  - safety/severity-schema.yaml for AlertSeverity rendering

usage_signal:
  renders_total: 0
  products: []
  override_rate: 0.0

embedding_hint: >
  status badge state label entity task care gap alert active
  open completed overdue cancelled closed severity indicator
```

#### component.tsx
```tsx
import { cn } from "@/lib/utils"

// ── Genome sources ────────────────────────────────────────────────────────────
// Status values:   ontology/states.yaml
// Color tokens:    genome/rules/styling-tokens.rule.md (design tokens)
// Safety:          safety/severity-schema.yaml (AlertSeverity rendering)
//
// NEVER use hardcoded Tailwind color classes — all color decisions use design tokens.
//
// NOTE ON ENTITY-SCOPED STATUS:
// CareGapStatus.open maps to --status-warning (amber) per ontology/states.yaml.
// TaskStatus.open maps to --status-neutral (outline/muted).
// Both have canonical_name "Open" but different visual treatment.
// Use `care_gap_open` for CareGap open state, `open` for Task open state.

const STATUS_CONFIG = {
  // ── Task states (ontology/states.yaml → TaskStatus) ──────────────────────
  open: {
    label: "Open",
    classes: "border border-border text-muted-foreground bg-transparent",
  },
  in_progress: {
    label: "In Progress",
    // --status-info → accent (blue tint)
    classes: "bg-accent text-accent-foreground border border-accent-foreground/20",
  },
  completed: {
    label: "Completed",
    classes: "bg-success/10 text-success border border-success/30",
  },
  overdue: {
    label: "Overdue",
    classes: "bg-[var(--warning-light)] text-warning border border-warning/30",
  },
  cancelled: {
    label: "Cancelled",
    classes: "bg-muted text-muted-foreground border border-border",
  },

  // ── Care gap states (ontology/states.yaml → CareGapStatus) ───────────────
  // open care gaps use amber/warning — distinct from task open (neutral)
  care_gap_open: {
    label: "Open",
    classes: "bg-[var(--warning-light)] text-warning border border-warning/30",
  },
  in_outreach: {
    label: "In Outreach",
    classes: "bg-accent text-accent-foreground border border-accent-foreground/20",
  },
  closed: {
    label: "Closed",
    classes: "bg-success/10 text-success border border-success/30",
  },
  excluded: {
    label: "Excluded",
    classes: "bg-muted text-muted-foreground border border-border",
  },

  // ── Alert severity (safety/severity-schema.yaml → AlertSeverity) ─────────
  // --destructive = Red = Critical severity (NOT the Alert entity)
  // --alert       = Orange = High severity
  // --warning     = Yellow = Medium severity
  // --accent      = Blue tint = Low severity
  critical: {
    label: "Critical",
    classes: "bg-destructive/10 text-destructive border border-destructive/30",
  },
  high: {
    label: "High",
    classes: "bg-[var(--alert-light)] text-alert border border-alert/30",
  },
  medium: {
    label: "Medium",
    classes: "bg-[var(--warning-light)] text-warning border border-warning/30",
  },
  low: {
    label: "Low",
    // border-accent-foreground/20 per severity-schema.yaml
    classes: "bg-accent text-accent-foreground border border-accent-foreground/20",
  },

  // ── Protocol / program states ─────────────────────────────────────────────
  active: {
    label: "Active",
    classes: "bg-success/10 text-success border border-success/30",
  },
  draft: {
    label: "Draft",
    classes: "bg-accent text-accent-foreground border border-accent-foreground/20",
  },
  inactive: {
    label: "Inactive",
    classes: "bg-muted text-muted-foreground border border-border",
  },
  archived: {
    label: "Archived",
    classes: "bg-muted text-muted-foreground border border-border",
  },
  coming_soon: {
    label: "Coming Soon",
    classes: "bg-muted text-muted-foreground border border-border",
  },
} as const

export type StatusKey = keyof typeof STATUS_CONFIG

interface StatusBadgeProps {
  status: StatusKey
  size?: "sm" | "md"
  className?: string
}

export function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  if (!config) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `StatusBadge: unknown status "${status}". ` +
        `Verify against ontology/states.yaml. ` +
        `For CareGap open state use "care_gap_open", not "open".`
      )
    }
    return <span className="text-sm text-muted-foreground">—</span>
  }

  return (
    <span
      role="status"
      aria-label={config.label}
      className={cn(
        "inline-flex items-center rounded-full",
        // Spacing: py-0.5 (2px) vertical, px-2 (8px) horizontal for both sizes
        "px-2 py-0.5",
        // Typography: md = body-default (text-base/14px), sm = body-small (text-sm/12px)
        size === "sm" ? "text-sm font-semibold" : "text-base font-semibold",
        config.classes,
        className
      )}
    >
      {config.label}
    </span>
  )
}
```

---

### StepIndicator

#### meta.yaml
```yaml
id: StepIndicator
status: placeholder
component_type: other
level: primitive
structural_family: section-organiser
confidence: 0.0
version: 0.0.0

summary: >
  Placeholder — not yet ratified. Horizontal or vertical progress indicator
  for multi-step flows. Shows current step, completed steps, and remaining
  steps. Used in intake forms, enrollment flows, and structured assessments
  with more than 2 stages.

when:
  - multi-step form or workflow with 3+ discrete stages
  - user needs orientation within a sequential process
  - progress through a clinical assessment or intake flow

not_when:
  - single-step form — no step indicator needed
  - non-sequential content (tabs are not steps)
  - fewer than 3 steps — inline labeling is sufficient

embedding_hint: >
  step indicator progress stepper multi-step form flow intake enrollment
  assessment stages current step completed remaining sequential wizard
```

---

### Toolbar

#### meta.yaml
```yaml
id: Toolbar
status: placeholder
component_type: other
level: primitive
structural_family: section-organiser
confidence: 0.0
version: 0.0.0

summary: >
  Placeholder — not yet ratified. Horizontal strip of filter controls,
  search input, and/or bulk actions placed above a list or table. Distinct
  from SectionHeader — Toolbar is interactive and scoped to controlling a
  specific content area.

when:
  - above a list or table that needs filtering, searching, or sorting
  - bulk actions apply to multiple selected items in a list
  - surface needs a search input + filter chip row

not_when:
  - page-level navigation — use shell navigation components
  - single section label with count — use SectionHeader
  - no interactive controls needed — use SectionHeader instead

embedding_hint: >
  toolbar filter search sort bulk action chips controls list table
  worklist input coordinator filter row above content interactive
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

When a team agent asks for pre-build context, you return:

1. **Matched blocks** — what exists that is relevant, with the
   specific meta.yaml fields they need, ranked by relevance.

2. **Applicable rules** — only the rules that apply to this intent.
   Not the full rulebook. Three focused rules beat ten vague ones.

3. **What others built** — if episodic memory contains similar builds,
   surface them with brief context on what worked and what didn't.

4. **Known gaps** — if the system has low confidence or no block
   for this intent, say so explicitly. A gap is useful information.
   Do not fill gaps with guesses.

5. **Confidence score** — your overall assessment of how well the
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
   "Used StatusBadge with canonical status values" not "looks good"]

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

CONFIDENCE: [0.0–1.0 — your assessment of genome compliance]
```

---

## Priorities

Safety constraints from `safety/hard-constraints.md` are the highest
priority. A violation there is always a FIX, never BORDERLINE.

Ontology violations (wrong terminology, invented concept names) are
always a FIX. Semantic consistency is not negotiable.

Aesthetic judgments from `genome/taste.md` are context-dependent.
A novel block that violates taste is BORDERLINE unless it clearly
contradicts a stated principle — then it's a FIX.