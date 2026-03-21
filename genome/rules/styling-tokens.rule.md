RULE: styling-tokens
VERSION: 2.0.0
CONFIDENCE: 0.97

APPLIES_TO: every component, every surface, every generated UI

# ── THE ONLY STYLING SOURCE OF TRUTH ─────────────────────────────────────────

The platform uses MDS (Masala Design System) tokens defined in theme.css.
Color primitives are sourced from the MDS Updated Colors Pallet.
Tailwind's default color palette (red-600, amber-100, blue-500, etc.) is
NEVER used directly. All color decisions go through MDS tokens.

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

SURFACES (MDS gray "stone" and "night" semantic families):
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

MDS gray primitives use a 100–1400 scale with two semantic families:
"stone" (lighter, for surfaces) and "night" (darker, for text).

  TOKEN        HEX      MDS SEMANTIC       USE
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

Eight MDS accent families for charts, category tags, and avatar fallback colors.
Only base (default) shades listed — each has ultra-light through darker variants
in the MDS token map.

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
"--alert" (token) = MDS Orange = High clinical severity color
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

All MDS tokens have dark mode variants defined in theme.css (.dark class).
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
