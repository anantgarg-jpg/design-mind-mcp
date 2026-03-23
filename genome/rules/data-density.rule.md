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
