RULE: destructive-action-confirmation
VERSION: 1.0.0
CONFIDENCE: 0.95

APPLIES_TO: any action that is irreversible or affects clinical data

WHEN:
  - action permanently deletes data
  - action affects more than 1 record
  - action cannot be undone within the session
  - action modifies a clinical record

USE:
  - AlertDialog with a consequence statement before the action label
  - Consequence statement format: "[What will happen]. [What this means]."
  - Action button label must match the action exactly (see ontology/actions.yaml)
  - Cancel must always be present and be the default-focused element

NOT:
  - Toast as the only warning
  - Disabled button with tooltip
  - Inline warning that doesn't interrupt the workflow
  - "Are you sure?" without a consequence statement
  - "Yes" / "OK" / "Confirm" as the action button label

BECAUSE:
  Clinical data has compliance and audit implications. Passive warnings
  fail under cognitive load. The user must actively read and respond
  to a consequence — not just click through a modal.

EXCEPTIONS:
  - Single-record soft operations (Archive, Assign): no confirmation needed
  - Draft records with no clinical data: no confirmation needed

BULK_THRESHOLD:
  - > 10 records: require typed confirmation string
  - 2–10 records: AlertDialog with record count in consequence statement
  - 1 record: AlertDialog for irreversible actions only
