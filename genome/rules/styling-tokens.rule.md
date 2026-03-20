RULE: styling-tokens
VERSION: 1.0.0
CONFIDENCE: 0.97

APPLIES_TO: every component, every surface, every generated UI

# ── THE ONLY STYLING SOURCE OF TRUTH ─────────────────────────────────────────

The platform uses MDS (Masala Design System) tokens defined in theme.css.
Tailwind's default color palette (red-600, amber-100, blue-500, etc.) is
NEVER used directly. All color decisions go through MDS tokens.

Font: Nunito Sans — loaded via --font-sans in theme.css.

FONT RULES:
  - All text inherits font-sans automatically from the root element
  - Never set font-family inline or hardcode 'Nunito Sans' in component code
  - font-mono is permitted only for: MRN values, measure codes, system IDs,
    timestamps, and other clinical identifiers needing fixed-width rendering
  - Never use system-ui, Arial, Inter, or any other font family directly
  - Components do not need an explicit font class — they inherit from root

# ── TOKEN MAP ────────────────────────────────────────────────────────────────

SURFACES:
  --background     page background (#F9F9F9 — slightly off-white)
  --card           card/panel surfaces (#FFFFFF — sits above background)
  --foreground     primary text on background
  --card-foreground primary text on cards
  --muted          subtle backgrounds for inactive/secondary areas
  --muted-foreground secondary and hint text (#707070 — WCAG AA on white)
  --popover        dropdown and tooltip surfaces
  --border         all borders and dividers (#8C8C8C — WCAG 3:1 UI compliant)
  --input          input field borders
  --ring           focus ring color

BRAND:
  --primary        MDS Blue (#0060D6) — CTAs, active states, links, focus rings
  --primary-foreground white — text on primary bg

SEMANTIC:
  --destructive    MDS Red (#D62400) — TWO uses: delete/destructive actions AND Critical severity
  --success        MDS Green (#007A0E) — Completed, Closed, success states
  --warning        MDS Yellow accessible fg (#7A5400) — Overdue, Medium severity
  --warning-light  Warning background (#FFF9E5)
  --alert          MDS Orange accessible fg (#9A4700) — High severity ONLY
  --alert-light    Alert background (#FFF2DB)
  --accent         Blue tinted surface (#F0F9FF bg / #0051AD fg) — Low severity, info states

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

# ── USAGE RULES ──────────────────────────────────────────────────────────────

ALWAYS:
  - Use CSS custom properties via Tailwind's semantic classes
    (text-primary, bg-card, text-muted-foreground, bg-destructive, etc.)
  - Use bg-[var(--warning-light)] for warning background surfaces
  - Use bg-[var(--alert-light)] for alert/high severity background surfaces
  - Use text-foreground for primary body text
  - Use text-muted-foreground for secondary, hint, and label text

NEVER:
  - Use hardcoded hex values in component code
  - Use Tailwind default color classes (red-600, amber-100, blue-500, etc.)
  - Override --destructive or --success for non-semantic decoration
  - Use --warning or --alert for branding or decorative elements
  - Use a color that "looks like" a severity color for non-severity purposes

# ── SEVERITY COLOR FAST REFERENCE ────────────────────────────────────────────
# Full spec in safety/severity-schema.yaml

  Critical  → text-destructive / bg-destructive/10 / border-destructive/30
  High      → text-alert / bg-[var(--alert-light)] / border-alert/30
  Medium    → text-warning / bg-[var(--warning-light)] / border-warning/30
  Low       → text-accent-foreground / bg-accent / border-accent-foreground/20

# ── STATUS COLOR FAST REFERENCE ──────────────────────────────────────────────

  Completed / Closed / Success   → text-success / bg-success/10
  Overdue                        → text-warning / bg-[var(--warning-light)]
  In Progress / In Outreach      → text-primary / bg-accent
  Open                           → text-muted-foreground / border border-border
  Cancelled / Excluded           → text-muted-foreground / bg-muted
  Error / Failed                 → text-destructive / bg-destructive/10

# ── DARK MODE ────────────────────────────────────────────────────────────────

All MDS tokens have dark mode variants defined in theme.css (.dark class).
Never write manual dark: overrides for semantic colors — the tokens handle it.
The only exception: physical color scenes (charts, illustrations) that must
not invert should use explicit @media (prefers-color-scheme: dark) or
conditional className logic.
