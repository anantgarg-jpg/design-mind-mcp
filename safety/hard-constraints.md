# Hard constraints
# These rules are authored by clinical SMEs and design leadership.
# No agent — including the Design Mind — can propose mutations to this file.
# Changes require explicit approval from design leadership + a human commit.

---

## Severity color rules

1. `--severity-critical` is reserved exclusively for Critical severity alerts and Alert-type CTAs
   that are part of a critical alert component. It may not be used for: brand elements,
   general CTAs, hover states, success states, or decorative elements.

2. `--severity-high` is reserved for High severity alerts and Overdue status indicators only.

3. `--status-success` is used for success, Completed, and Closed states. It may only appear
   in a CTA when that CTA is within a success toast or confirmation message. It is not used
   for decorative or neutral UI elements.

4. Severity colors are never overridden by theme customization, white-label configuration,
   or per-block, per-artifact, or per-surface styling.

---

## Alert dismissal rules

5. Critical severity alerts cannot be dismissed. The only permitted actions are Acknowledge
   and Escalate — these are intents, not required copy. Any UI that renders a dismiss or
   close control for a Critical alert is non-compliant.

6. High severity alert dismissal behavior is use-case defined but must be intentional
   and reversible.

---

## Patient identity rules

7. Patient name is always displayed as: Last, First (formal display) or First Last
   (conversational display). Never first name only. Middle name is optional. When a patient
   name appears within a sentence, First Last is used even in formal display contexts.

8. Date of birth is always displayed as MM/DD/YYYY. MM/DD/YY may be used only when space
   is critically constrained. Age may be shown alongside DOB but never replaces it.

---

## Confirmation and destructive action rules

9. Any modification or deletion of data requires an explicit confirmation step.
   Delete actions must use destructive tokens.

---

## Data display rules

10. Empty or null data fields must never appear blank. A consistent placeholder —
    such as "—" or "Not recorded" — must be shown. Blank space in a data field
    can be misread as a cleared or zero value.

11. Timestamps must always display an absolute date and time. Relative formats
    (e.g. "2 hours ago", "Yesterday") may be shown alongside but never replace
    the absolute value.

---

## Interactive state rules

12. Any surface containing data entry must warn the user before navigating away
    with unsaved changes. Silent discard is not permitted.

13. Form and input error states must use the designated error token. `--severity-critical`
    must not be used for routine validation errors.

---

## CTA hierarchy rules

14. Only one primary CTA may be visible to the user on any single page or surface
    at a time. No surface may render two or more simultaneously visible primary CTAs —
    not in wizards, multi-action surfaces, or modals.
    Exception: row-level or item-level primary CTAs that appear exclusively on hover are
    permitted, because only one can be visible at a time. This exception applies only when
    the CTA is fully hidden at rest (opacity-0 or not rendered) and revealed solely on
    hover of its parent row or item. A primary CTA that is visible at rest — even at
    reduced opacity — does not qualify for this exception.
    Secondary and tertiary actions must use visually subordinate treatments regardless
    of hover state.

---

## Copy and language constraints

15. "We" and all first-person constructions are prohibited in
    every user-facing string. No exceptions.

16. Confirmation dialogs must never use "Are you sure?" or
    equivalent. The header must state the consequence. The
    primary CTA label must match the header.

17. Secondary buttons on modals, interstitials, and popovers
    must use "Close", not "Cancel".

---

## CTA display rules

18. CTA label text must never wrap. Button labels are always single-line
    (whitespace-nowrap). When space is constrained, other content columns — such as
    names, descriptions, or metadata — must shrink or truncate to preserve the full
    visibility of the CTA label.

---

## Accessibility constraints

19. Color is never the sole differentiator for severity, status,
    or any meaningful state. Shape, icon, or text must also
    carry the meaning. No agent may generate a component where
    color is the only signal.

20. focus-visible must never be suppressed with outline:none or
    ring-0 without an explicit visible replacement. The --ring
    token exists for this purpose.

## Block constraints

22. When a Block composes another Block, the consuming Block must not pass className overrides that conflict with any CSS property listed in the composed Block's family_invariants. Only additive classes — positioning, sizing, spacing, and layout — are permitted on a child Block. To change an invariant property, the source Block's meta.yaml and component must be updated directly, only when the change is justified by a new design requirement.

23. When a primitive or composite Block's component or meta.yaml is modified, all consuming Blocks and surfaces that import or compose that Block must be reviewed and updated to reflect the change. No upstream change may be committed without verifying downstream consumers remain compliant.

24. Import blocks from @innovaccer/ui-assets using the exact tier path (block-primitives, block-composites, surfaces). Never import from shadcn (@/components/ui/), local paths, or relative paths when a genome block exists. Never reimplement a block inline. If a block needs changes that alter its structure, register a candidate pattern via report_pattern.

25. Only build composite blocks or surfaces using the primitive blocks. Never modify existing primitives. Do not create new primitives unless the functionality is completely different from what is supported by existing primitives, regardless of domain or semantics. 