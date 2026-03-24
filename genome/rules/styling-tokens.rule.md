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

# ── TOKEN VALUES ─────────────────────────────────────────────────────────────

Token values (hex, oklch, CSS custom properties) live in `theme.css` in the
consuming project. Read that file for actual color values.

Surface tokens: --background, --foreground, --card, --card-foreground,
  --muted, --muted-foreground, --popover, --popover-foreground,
  --border, --input, --ring
Brand tokens: --primary, --primary-foreground
Semantic tokens: --destructive, --destructive-foreground, --destructive-light,
  --success, --success-foreground, --success-light,
  --warning, --warning-foreground, --warning-light, --warning-surface,
  --alert, --alert-foreground, --alert-light,
  --accent, --accent-foreground,
  --info, --info-foreground, --info-light
Accent tokens: --accent1 through --accent8 (charts, tags, avatar fallback)
Sidebar tokens: --sidebar* (Panel 1 only — see below)

FOCUS RING TREATMENT:
  Focus rings use the base --ring color at reduced opacity for a softer,
  less intrusive appearance while remaining clearly visible:
    - Default:      ring-primary/40  (all non-destructive elements)
    - Destructive:  ring-destructive/40  (destructive buttons and actions)
  Structure: focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none
  The ring color is set per-variant, not globally, so destructive actions
  get a red-tinted ring that matches their intent.

# ── GRAY SCALE USAGE ─────────────────────────────────────────────────────────

Gray primitives use a 100–1400 scale. Values in theme.css.

USAGE: Prefer semantic tokens (--muted, --border, --foreground, --muted-foreground)
over raw --gray-* values. The gray scale exists as a reference for edge cases
where semantic tokens don't cover the need — chart axis labels, skeleton
placeholders, disabled states. If you're reaching for --gray-* in a component,
ask first whether a semantic token already handles it.

# ── ACCENT PALETTE USAGE ─────────────────────────────────────────────────────

Eight accent families (--accent1 through --accent8) for charts, category tags,
and avatar fallback colors. Each has ultra-light through darker variants.
Values in theme.css.

WHEN TO USE ACCENTS:
  - Chart series colors (use in order: accent1 through accent8)
  - Category tags and labels that need visual differentiation
  - Avatar fallback backgrounds (use -avatar variant: -300 shade)

NEVER:
  - Use accents for severity indicators — severity has its own tokens
  - Use accents for interactive states — use --primary
  - Use accents for status badges — use the status color reference below
  - Mix accent base shades with their light/dark variants in the same context

# ── SIDEBAR ──────────────────────────────────────────────────────────────────

--sidebar* is a parallel token set for Panel 1 styling — always use sidebar
tokens when styling Panel 1 content. Values in theme.css.

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

  Critical  → text-destructive / bg-destructive-light / border-destructive/30
  High      → text-alert / bg-alert-light / border-alert/30
  Medium    → text-warning / bg-warning-light / border-warning/30
  Low       → text-accent-foreground / bg-accent / border-accent-foreground/20

# ── STATUS COLOR FAST REFERENCE ──────────────────────────────────────────────

  Completed / Closed / Success   → text-success / bg-success-light
  Overdue                        → text-warning / bg-warning-light
  In Progress / In Outreach      → text-primary / bg-accent
  Open                           → text-muted-foreground / border border-border
  Cancelled / Excluded           → text-muted-foreground / bg-muted
  Error / Failed                 → text-destructive / bg-destructive-light

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

FLAT BY DEFAULT. The product's visual identity is flat and border-driven.
Shadows exist only for elements that genuinely float above the page.
Everything anchored to the page uses borders or background contrast
for separation — never shadows.

  LEVEL         CLASS               WHEN
  ────────────  ──────────────────  ────────────────────────────────────────
  flat          (no shadow)         THE DEFAULT. Cards, buttons, inputs, rows,
                                    headers, banners, list items, all controls
  dropdown      shadow-md           Dropdowns, popovers, context menus
  dialog        shadow-lg           Modals, dialogs, command palette
  tooltip       shadow-sm           Tooltips

WHAT IS ALWAYS FLAT (no shadow, no exceptions):
  - Cards at rest — use border border-border, not shadow
  - Buttons and interactive controls — always flat
  - Inputs, selects, textareas — border only
  - Rows in lists — border-b or background alternation
  - Headers (EntityContextHeader, section headers) — border-b
  - Alert banners — colored left border, no shadow
  - Sidebar content — sidebar tokens handle surface treatment
  - Any element inside a card — shadows never nest

HOW TO SEPARATE WITHOUT SHADOW:
  - Border: border border-border (1px, subtle grey) for structural edges
  - Background contrast: bg-card on bg-background for content regions
  - Inset background: bg-muted for nested/secondary regions
  - Dividers: border-b border-border between stacked items

NEVER:
  - Stack shadows (a floating element inside another floating element)
  - Use shadow-xl or shadow-2xl — too dramatic for clinical context
  - Add shadow to severity indicators — severity communicates via color, not depth
  - Use box-shadow for non-elevation purposes (glow effects, colored glows,
    inner highlights, inset shadows for depth simulation)
  - Add shadow to cards, buttons, inputs, or any anchored element
  - Use hover shadow transitions (shadow-card → shadow-card-hover) — use
    background color shift for hover instead

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

# ── STATE FEEDBACK PATTERNS ──────────────────────────────────────────────────

Interactive elements follow a consistent state feedback language:

  STATE      TREATMENT                              EXAMPLE
  ─────────  ─────────────────────────────────────  ──────────────────────────
  hover      Background opacity shift               hover:bg-foreground/[0.04]
  active     Darker bg shift + scale(0.97)          active:bg-foreground/[0.08] active:scale-[0.97]
  focused    Soft ring at 40% opacity               focus-visible:ring-primary/40
  selected   Primary-tinted background              bg-primary/10 or bg-accent
  disabled   50% opacity, no pointer events          disabled:opacity-50 disabled:pointer-events-none

  NEVER use shadow changes for hover feedback (no shadow-card → shadow-card-hover).
  NEVER use translate-y for press feedback — use scale instead.
  NEVER use color darkening as the sole press signal — always include scale.
  NEVER use gradients, glows, or inner highlights for any state.

# ── USAGE RULES ──────────────────────────────────────────────────────────────

NEVER:
  - Use hardcoded hex values in component code
  - Use Tailwind default color classes (red-600, amber-100, blue-500, etc.)
  - Override --destructive or --success for non-semantic decoration
  - Use --warning or --alert for branding or decorative elements
  - Use a color that "looks like" a severity color for non-severity purposes
  - Use font-thin, font-light, or font-black
  - Use rounded-2xl or larger radius values
  - Use shadow on anchored elements (cards, buttons, inputs, rows, headers)
  - Use shadow-xl or shadow-2xl
  - Use transition-all — specify exact properties
  - Use transition-shadow — the product does not animate shadows
  - Use transition durations > 300ms
  - Animate severity indicators or clinical data values
  - Use gradients, inner highlights, colored glows, or inset shadows
