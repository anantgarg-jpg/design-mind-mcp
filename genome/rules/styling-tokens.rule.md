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
