# Hard constraints
# These rules are authored by clinical SMEs and design leadership.
# No agent — including the Design Mind — can propose mutations to this file.
# Changes require explicit approval from clinical leadership + a human commit.

---

## Severity color rules

1. The color red (--severity-critical, hex #DC2626 ± 10% lightness)
   is reserved exclusively for Critical severity clinical alerts.
   It may not be used for: brand elements, CTAs, hover states,
   success states, decorative elements, or any non-clinical signal.

2. Amber (--severity-high, hex #D97706 ± 10% lightness) is reserved
   for High severity alerts and Overdue status indicators only.

3. Green (--status-success) is used for Completed and Closed states.
   It is never used for promotional content or marketing copy.

4. Severity colors are never overridden by theme customization,
   white-label configuration, or per-product styling.

---

## Alert dismissal rules

5. Critical severity alerts cannot be dismissed. The only permitted
   actions are: Acknowledge, Escalate. Any UI that renders a
   "Dismiss" or "Close" control for a Critical alert is non-compliant.

6. High severity alerts cannot be dismissed without a documented reason.
   A reason selector is required before the dismiss action completes.

7. Acknowledgment of Critical or High alerts always creates an audit
   log entry. This entry cannot be suppressed or deferred.

---

## Patient identity rules

8. Patient name is always displayed as: Last, First (formal display)
   or First Last (conversational display). Never First name only
   in clinical contexts. Middle name is optional.

9. MRN (Medical Record Number) is always labeled "MRN" — never
   "ID", "Patient ID", "Record #", or any other label.

10. Date of birth is always displayed in full (MMM D, YYYY).
    Never abbreviated to age alone in clinical contexts.
    Age may be shown alongside DOB but never replaces it.

---

## Confirmation rules

11. Any action that modifies or deletes clinical record data requires
    an explicit confirmation step with a consequence statement.
    "Are you sure?" alone is never sufficient.

12. Bulk actions affecting more than 10 patient records require a
    typed confirmation string (not just a button click).

---

## Terminology rules

13. The following terms are forbidden in all UI copy:
    - "Normal" (use specific clinical values or "Within range")
    - "Fine" (too casual for clinical communication)
    - "Don't worry" (dismisses clinical concern)
    - "Unfortunately" (adds emotional weight to factual statements)

14. Diagnoses, medications, and clinical codes are never paraphrased
    or simplified in data display. Show the canonical clinical term.
    Plain language explanations may be shown alongside, never instead.
