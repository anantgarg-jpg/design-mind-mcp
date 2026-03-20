RULE: data-density
VERSION: 1.0.0
CONFIDENCE: 0.88

APPLIES_TO: any surface displaying lists, tables, or multiple records

WHEN — list views:
  - displaying > 10 records of the same entity type

USE:
  - table for structured data with sortable columns
  - list (card stack) for entities with variable content or actions
  - virtual scrolling for > 100 records

NOT:
  - paginated table with < 10 rows per page for power users
  - card grid for worklist views — linear scan is faster for coordinators

WHEN — empty states:
  - a list, table, or query returns zero results

USE:
  - one-line honest statement of what's empty and why
  - optional: single CTA if there's a clear next action
  - format: "No [entity] [condition]." e.g. "No open care gaps for this patient."

NOT:
  - illustrations or icons in empty states
  - celebratory copy ("All caught up!")
  - multi-paragraph explanations

WHEN — loading states:
  - data is being fetched

USE:
  - skeleton screens matching the shape of the expected content
  - loading spinner only for actions (button submits, not page loads)

NOT:
  - full-page loading spinners for partial data loads
  - "Loading..." text alone

WHEN — density defaults:
  - presenting data to coordinators managing large patient panels

USE:
  - compact row density by default (32px row height)
  - user-adjustable density toggle if > 8 columns

NOT:
  - comfortable/spacious density as default for worklist views
  - forcing all products to the same density

BECAUSE:
  Care coordinators manage panels of 200+ patients. Data density
  is a productivity requirement. Spacious layouts optimized for
  occasional users harm power users who need to scan fast.
