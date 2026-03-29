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
