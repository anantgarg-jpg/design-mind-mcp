RULE: navigation-patterns
VERSION: 2.0.0
CONFIDENCE: 0.92

APPLIES_TO: all navigation decisions across the platform shell and within artifact surfaces

# ── SHELL STRUCTURE ───────────────────────────────────────────────
# The platform uses a fixed 3-panel layout. This is not negotiable.
# See genome/rules/shell-layout.rule.md for full shell spec.
# Navigation rules are written in the context of this shell.

WHEN — product / solution switching (Panel 1):
  - user needs to move between solutions (Care Manager, Atlas VBC, etc.)

USE:
  - left nav Panel 1 only — icon + label grouped under "SOLUTIONS" header
  - solution groups are collapsible
  - active solution is highlighted, sub-sessions shown as indented items with date

NOT:
  - horizontal top nav — there is no top nav bar in this shell
  - tabs for top-level solution switching
  - modal or overlay for solution selection

WHEN — session navigation (Panel 1):
  - user needs to return to a previous conversation session

USE:
  - session history listed under the active solution in Panel 1
  - show session name + relative date (e.g. "18 Mar")
  - max 5 recent sessions visible before "View all" link

NOT:
  - dedicated sessions page — history lives in Panel 1 inline
  - breadcrumb for session navigation

WHEN — artifact navigation (Panel 3):
  - chat spawns a new artifact or the user opens a surface directly

USE:
  - tabbed interface at the top of Panel 3
  - tabs are closeable (× affordance on each tab)
  - active tab underlined, not filled — matches the screenshot
  - tab label is the artifact name, not the artifact type

NOT:
  - back button inside Panel 3 — artifacts don't have their own nav
  - breadcrumb inside Panel 3
  - nested tabs within an artifact

WHEN — patient context switching:
  - user is in a patient-scoped workflow in Panel 3

USE:
  - PatientContextHeader at the top of the artifact surface
  - patient search accessible via Panel 2 (ask the chat)
  - explicit dismiss affordance to return to population-level view

NOT:
  - patient switcher dropdown in Panel 3 — route through Panel 2
  - patient name only in the artifact tab label

WHEN — workflow steps within an artifact:
  - multi-step process (2–5 steps)

USE:
  - step indicator at the top of the artifact content area
  - "Step 2 of 4" format always — never progress bar alone
  - linear only — no branching step indicators

NOT:
  - tabs to represent workflow steps
  - Panel 1 or Panel 2 to show workflow progress

BECAUSE:
  This shell makes the conversational layer (Panel 2) the primary
  navigation instrument. Users ask for things; artifacts appear in
  Panel 3. Traditional navigation patterns that assume a page-based
  mental model conflict with this. An agent building UI for Panel 3
  should never add navigation chrome that duplicates what the shell
  already provides.
