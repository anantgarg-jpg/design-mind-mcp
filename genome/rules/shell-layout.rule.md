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
  - PatientContextHeader at the top when surface is patient-scoped
  - ClinicalAlertBanner above content header when active alerts exist

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
