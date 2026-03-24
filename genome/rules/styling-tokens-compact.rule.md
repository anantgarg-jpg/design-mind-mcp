RULE: styling-tokens-compact
VERSION: 1.0.0
CONFIDENCE: 0.97
APPLIES_TO: every component, every surface, every generated UI

# ── TOKEN NAMES ───────────────────────────────────────────────────────────────
# Values live in theme.css in the consuming project. Never hardcode hex.

Surface:  --background  --foreground  --card  --card-foreground
          --muted  --muted-foreground  --popover  --popover-foreground
          --border  --input  --ring
Brand:    --primary  --primary-foreground
Semantic: --destructive  --destructive-foreground  --destructive-light
          --success  --success-foreground  --success-light
          --warning  --warning-foreground  --warning-light  --warning-surface
          --alert  --alert-foreground  --alert-light
          --accent  --accent-foreground
          --info  --info-foreground  --info-light
Accent:   --accent1 through --accent8  (charts, tags, avatars only —
          never severity, never interactive states)
Sidebar:  --sidebar*  (Panel 1 only)

# ── NAMING DISAMBIGUATION ─────────────────────────────────────────────────────

"Alert" (entity) ≠ "--alert" (token = Orange = High severity)
"--destructive" = BOTH delete actions AND Critical severity (intentional)
"--info" (Cyan, generic info) ≠ "--accent" (Blue tint, Low severity)

# ── SEVERITY FAST REFERENCE ───────────────────────────────────────────────────

Critical  → text-destructive / bg-destructive-light / border-destructive/30
High      → text-alert / bg-alert-light / border-alert/30
Medium    → text-warning / bg-warning-light / border-warning/30
Low       → text-accent-foreground / bg-accent / border-accent-foreground/20

# ── STATUS FAST REFERENCE ─────────────────────────────────────────────────────

Completed/Closed/Success  → text-success / bg-success-light
Overdue                   → text-warning / bg-warning-light
In Progress/In Outreach   → text-primary / bg-accent
Open                      → text-muted-foreground / border-border
Cancelled/Excluded        → text-muted-foreground / bg-muted
Error/Failed              → text-destructive / bg-destructive-light

# ── FOCUS RING ────────────────────────────────────────────────────────────────

Default:      focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:outline-none
Destructive:  focus-visible:ring-2 focus-visible:ring-destructive/40 focus-visible:ring-offset-1 focus-visible:outline-none

# ── TYPOGRAPHY SCALE ─────────────────────────────────────────────────────────

Card/dialog titles          → text-lg font-bold
Section titles              → text-xl font-semibold
Page/artifact titles        → text-[28px] font-normal
Stat values, hero metrics   → text-[32px] font-semibold
Default body                → text-base font-normal
Large body                  → text-lg font-normal
Meta, timestamps, hints     → text-sm font-normal
Section headers             → text-sm font-semibold
Form/interactive labels     → text-base font-semibold
Identifiers, codes          → font-mono text-sm

Weight: 400=default (body, controls, cells, links) | 500=section heads/labels/nav-active
        600=titles only | 700=title-default only at small sizes
Never: font-thin  font-light  font-black

# ── SPACING ───────────────────────────────────────────────────────────────────

Cards:               p-4
Rows:                px-4 py-3.5
Alert banners:       p-4  gap-3 internal
EntityContextHeader: px-6 py-4
Section gaps:        gap-4 between cards  /  gap-3 between rows
Meta row:            mt-1.5  gap-3 between items
Button groups:       gap-2  /  gap-1.5 icon-only

Flex/grid gap:
  gap-1   icon+text inside single element
  gap-1.5 tight button groups, icon-only sets
  gap-2   button groups, badge groups, chip rows
  gap-2.5 meta item spacing in rows
  gap-3   row internal sections, alert internal layout
  gap-4   card internal sections, header sections
  gap-6   major content blocks within a panel

# ── BORDER RADIUS ─────────────────────────────────────────────────────────────

Cards, panels, dialogs, alert banners  → rounded-lg
Inputs, buttons, dropdowns, tooltips   → rounded-md
StatusBadge, chips, avatars            → rounded-full
Alert banners (left accent)            → rounded-r-md
Never: rounded-2xl or larger

# ── ELEVATION ─────────────────────────────────────────────────────────────────

Flat by default. Anchored elements use borders only — never shadow.
shadow-md → dropdowns/popovers
shadow-lg → dialogs
shadow-sm → tooltips

# ── Z-INDEX ───────────────────────────────────────────────────────────────────

base 0 / sticky 10 / dropdown 20 / overlay 30 / modal 40 / toast 50 / tooltip 60

# ── STATE FEEDBACK ───────────────────────────────────────────────────────────

hover    → hover:bg-foreground/[0.04] transition-colors
active   → active:bg-foreground/[0.08] active:scale-[0.97]
focused  → focus-visible:ring-primary/40
selected → bg-primary/10 or bg-accent
disabled → disabled:opacity-50 disabled:pointer-events-none

# ── TRANSITIONS ──────────────────────────────────────────────────────────────

Use: transition-colors / transition-opacity /
     transition-[color,background-color,border-color,transform]
Durations: duration-100 to duration-300 only
Never: transition-all  transition-shadow  durations > 300ms
Never animate: severity indicators, clinical data values

# ── NEVER ─────────────────────────────────────────────────────────────────────

- Hardcoded hex values in component code
- Tailwind default color classes (red-600, blue-500, amber-100, etc.)
- Severity/status colors used decoratively
- shadow on cards, rows, inputs, buttons, headers, or any anchored element
- rounded-2xl or larger
- transition-all or transition-shadow
- font-thin, font-light, font-black
