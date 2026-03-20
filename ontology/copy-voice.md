# Copy and voice

## Tone

Clinical and direct. Not cold — human, but not casual.
This product is used by people making decisions that matter.
The copy respects that weight without being dramatic about it.

Never:
- Cute ("Looks like you're all caught up! 🎉")
- Apologetic ("We're sorry, something went wrong")
- Vague ("Something happened")
- Marketing ("Supercharge your care workflows")

Always:
- State what happened, then what to do
- Use the patient's name when addressing a specific situation
- Use numerals for all clinical quantities (3 patients, not three)

---

## Tense and form

Labels: present tense, imperative
  ✓ "Acknowledge"   ✗ "Acknowledging"   ✗ "Click to acknowledge"

Confirmations: past tense
  ✓ "Alert acknowledged"   ✗ "Alert has been acknowledged"

Status copy: noun or adjective, never verb
  ✓ "Overdue"   ✗ "This task is overdue"

Empty states: honest and specific
  ✓ "No open care gaps for this patient"
  ✗ "Nothing to see here"
  ✗ "All caught up!"

Error messages: what happened + what to do
  ✓ "Patient record could not be saved. Check your connection and try again."
  ✗ "Error 500"
  ✗ "Something went wrong. Please try again."

---

## Entity references

Always use canonical names from ontology/entities.yaml.
Use the exact capitalization shown there.

  ✓ "Patient"     ✗ "member" / "beneficiary" / "individual"
  ✓ "Care Gap"    ✗ "gap" / "care gap" / "HEDIS gap"
  ✓ "Task"        ✗ "to-do" / "action item" / "work item"
  ✓ "Alert"       ✗ "notification" / "flag" / "warning"
  ✓ "Provider"    ✗ "doctor" / "physician" (in labels)

In conversational contexts (Claude interface), "clinician" is
acceptable when referring to the user themselves.

---

## Numbers and dates

Patient counts: always numeral
  ✓ "3 patients"   ✗ "three patients"

Dates: MMM D, YYYY for display
  ✓ "Jan 5, 2025"   ✗ "01/05/2025"   ✗ "January 5th, 2025"

Relative dates: use when < 7 days, absolute after
  ✓ "2 days ago"   ✓ "Yesterday"   ✓ "Jan 3, 2025" (if older)

SLA / due dates: always show the date, optionally add urgency signal
  ✓ "Due Jan 5 · Overdue"   ✗ "Overdue" alone (no date context)

---

## Confirmation dialogs

Structure: [Consequence statement]. [Action instruction].
  ✓ "This will permanently delete the patient record.
     This cannot be undone. Type DELETE to confirm."
  ✗ "Are you sure you want to delete?"

Destructive action button copy: match the action label exactly
  ✓ Button: "Delete permanently"
  ✗ Button: "Yes" / "OK" / "Confirm" / "Proceed"
