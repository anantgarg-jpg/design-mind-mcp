# copy-voice.md

> Good copy feels inevitable — like the only words that could have
> been there. That feeling doesn't come from creativity. It comes
> from discipline.

---

## Purpose

This platform is used by people making decisions that matter. The words
in the interface are not decorations — they are clinical instruments.
A label that's vague costs a clinician a second of hesitation. A
confirmation that's soft costs them trust in the system. An error
message that says "something went wrong" costs them the information
they needed to act.

Copy is not the UX writer's job bolted onto the designer's work.
It is the same job. Every string in the product — label, toast, empty
state, error, confirmation, tooltip — is held to the same standard as
every spacing decision and every color token.

This document is the language identity of the platform. It is always
loaded. It applies everywhere. There are no surfaces exempt from it.

---

## Tone

Clinical and direct. Not cold — human, but not casual.

The register is a senior care coordinator talking to a peer: precise,
confident, no throat-clearing. Not a chatbot. Not a marketing page.
Not an apology.

**Never:**
- Cute — *"Looks like you're all caught up! 🎉"*
- Apologetic — *"We're sorry, something went wrong"*
- Vague — *"Something happened"*
- Marketing — *"Supercharge your care workflows"*
- Deflecting — *"due to a technical issue"* / *"due to a system issue"*

**Always:**
- State what happened, then what to do
- Use the patient's name when addressing a specific situation
- Use numerals for all clinical quantities — *3 patients*, not *three patients*
- Keep it conversational where tone allows — *your* is fine when it
  makes the copy feel less robotic

The test: could a senior coordinator say this out loud to a colleague
without it sounding wrong? If yes, ship it. If it sounds like a
system talking about itself, rewrite it.

---

## The First-Person Rule

**"We" is prohibited in every user-facing string.**

No exceptions. No *"We couldn't load"*, no *"We recommend"*, no *"We
are experiencing"*. The platform does not have a voice. The platform
has a result. Describe the result.

First-person constructions of any kind are prohibited in error messages.
Use passive construction in body copy. Use *"Unable to …"* only in
headers and titles — never in body text.

---

## Labels and Actions

Labels are imperative, present tense. They name the action, not the
process of doing it.

```
✓  Acknowledge       ✗  Acknowledging
✓  Close Gap         ✗  Closing Gap
✓  Assign            ✗  Click to Assign
✓  Try again         ✗  Reattempt
✓  Reset password    ✗  Forgot password?
```

CTAs are as short as possible. Never append *"to continue"* after a
CTA. *"Save"* is complete. *"Save to continue"* is not.

If actions are represented as separate buttons, each action gets its
own distinct label. Do not combine them.

Secondary buttons on modals, interstitials, and popovers say **Close**,
not *Cancel*.

---

## Confirmation Dialogs

Confirmation dialogs never ask *"Are you sure?"* That question puts
the cognitive load on the user to infer the consequence. State the
consequence instead.

**Structure:** [Consequence statement]. [What this means or what
to do next.]

**Headers match CTAs.** If the action is *"Stop recording and close"*,
the header is *"Stop recording?"* — not *"Warning"*, not *"Confirm action"*.

```
✗  Header:  Ongoing recording
   Body:    Are you sure you want to close?
   CTAs:    Yes | Cancel

✓  Header:  Stop recording?
   Body:    [Patient] is being recorded. Closing this page will
            end the recording.
   CTAs:    Continue recording | Stop recording and close
```

Destructive action button labels match the action exactly. Never
*"Yes"*, *"OK"*, *"Confirm"*, or *"Proceed"* on a destructive dialog.

---

## Error Messages

Error messages have two parts: what happened, and what to do. Both
are required. Neither is optional.

**What happened** uses passive construction in body copy.
**What to do** is a CTA or a plain instruction — direct, short.

**Prohibited phrases — hard enforcement:**
- *"Something went wrong"* — always replace with specific, contextual language
- *"due to a technical issue"* / *"due to a system issue"* — never use
- *"failed"* / *"failure"* — never use
- *"denied"* in permission errors — use neutral language instead
- *"Network not available"* — use *"Connection issue"* instead
- *"after some time"* — always replace with *"later"*
- Semicolons — never use in user-facing copy

**Replacement rules:**

| Situation | Wrong | Right |
|-----------|-------|-------|
| Modal or page-level load error | *"Something went wrong"* | *"The information couldn't be loaded. Try again."* |
| Recoverable system error | Any message without recovery | Must include *"Try again"* |
| Permission error | *"Access denied"* | State that the user doesn't have permission. Provide a resolution path — contact an administrator, request access. |
| Persistent connectivity | *"Network not available. Please try again later."* | *"Connection issue. If the issue continues, contact IT support."* |
| Password validation | *"Please enter your password again"* | *"Try again."* |
| Remaining attempts | *"2 attempts remaining"* | *"2 attempts left"* |

**Backend errors that cannot be recovered from** are always toasts —
never modals, never inline. They are system events, not user decisions.

**Error message placement guide:**

| Type | When | Format |
|------|------|--------|
| Inline | Field-level validation | One line beneath the field, no header |
| Card-level | A card's data failed to load | One line + CTA on the same line |
| Toast | Backend error, no recovery path | One line, no header, no CTA |
| Page-level | Entire surface failed to load | Header + body + *"Try again"* CTA |
| Modal | Destructive or consequential action requiring confirmation | Header + body + distinct CTAs |

**Technical audiences** — if the audience is explicitly technical
(data engineers, integration engineers) and the root cause is known
and safe to expose, state it specifically: *validation error*,
*schema mismatch*, *missing dependency*, *authentication error*.
Do not use *"due to a technical issue"* even for technical audiences
when the specific cause is known. Use *"information"* for general
audiences. Use *"data"* only for technical audiences.

**Infrastructure terms** — *server*, *backend*, *API*, *database* —
are permitted only for explicitly technical audiences.

---

## Empty States

Empty states are honest. They state what is empty and why. Nothing more.

```
✓  "No open care gaps for this patient."
✓  "No tasks due today."
✗  "Nothing to see here"
✗  "All caught up!"
✗  "No results found"
✗  "No data available"
```

A positive empty state — the coordinator's panel is clear — is a
clinical signal, not an error. Write it as one. *"No priority items
today"* means something. *"No results"* means nothing.

One honest line. One optional CTA if there is a clear next action.
No illustrations. No multi-paragraph explanations. No celebration.

---

## Tense and Form

**Labels:** imperative present tense
```
✓  "Acknowledge"   ✗  "Acknowledging"   ✗  "Click to acknowledge"
```

**Confirmations:** past tense
```
✓  "Alert acknowledged"   ✗  "Alert has been acknowledged"
```

**Status copy:** noun or adjective, never verb
```
✓  "Overdue"   ✗  "This task is overdue"
```

**Error headers:** *"Unable to …"* construction is permitted only in
headers and titles. In body copy, use passive construction instead.
```
✓  Header:  "Unable to load patient record"
✓  Body:    "The patient record couldn't be loaded."
✗  Body:    "Unable to load the patient record."
```

---

## Dates and Numbers

**Dates in display context:** MMM D, YYYY
```
✓  "Jan 5, 2025"   ✗  "01/05/2025"   ✗  "January 5th, 2025"
```

**Relative dates:** use when less than 7 days, absolute after
```
✓  "2 days ago"   ✓  "Yesterday"   ✓  "Jan 3, 2025" (if older)
```

**SLA and due dates:** always show the date, add urgency signal if needed
```
✓  "Due Jan 5 · Overdue"   ✗  "Overdue" alone
```

**Clinical quantities:** always numerals
```
✓  "3 patients"   ✗  "three patients"
```

---

## Entity References

Always use canonical names from `ontology/entities.yaml`. Exact
capitalization. No synonyms in UI copy.

```
✓  "Patient"     ✗  "member" / "beneficiary" / "individual"
✓  "Care Gap"    ✗  "gap" / "care gap" / "HEDIS gap"
✓  "Task"        ✗  "to-do" / "action item" / "work item"
✓  "Alert"       ✗  "notification" / "flag" / "warning"
✓  "Provider"    ✗  "doctor" / "physician" (in labels)
```

*"Clinician"* is acceptable in conversational contexts — Claude
interface, in-sentence references — when referring to the user.
In labels and UI chrome, use *"Provider"*.

---

## Template and Surface-Specific Errors

When an error relates to a specific surface or entity type, the
error message names it. Generic fallbacks are not acceptable.

```
✓  "The selected template couldn't be loaded. Try again."
✗  "Page not available."
✗  "Something went wrong loading this page."
```

The copy follows the entity. If it's a template error, the message
is about the template. If it's a care gap error, the message names
the care gap. The system knows what it was trying to do — the copy
should reflect that.

---

## What We Never Do

- Use *"we"* or any first-person construction in user-facing strings
- Write *"Something went wrong"* — ever
- Write *"Are you sure?"* in a confirmation dialog
- Use *"Cancel"* as the secondary button on modals — use *"Close"*
- Use *"Forgot password?"* — use *"Reset password"*
- Append *"to continue"* after a CTA
- Use semicolons in user-facing copy
- Use *"failed"* or *"failure"* — describe the outcome instead
- Use *"denied"* in permission errors
- Use *"remaining"* for attempts — use *"left"*
- Use *"after some time"* — use *"later"*
- Use *"due to a technical issue"* or *"due to a system issue"*
- Use infrastructure terms (*server*, *API*, *backend*) for non-technical audiences
- Celebrate completed workflows — the result is the reward

---

## The Pre-Output Copy Checklist

Before any string reaches the interface, scan for violations in
this order. If any item fails, rewrite before shipping.

1. First-person forms — *we*, *our*, *I* — present anywhere?
2. *"Something went wrong"* present?
3. *"due to a system issue"* or *"due to a technical issue"* present?
4. *"denied"* in a permission error?
5. *"to continue"* appended after a CTA?
6. *"Unable to …"* used in body copy (not a header)?
7. Passive construction used in body copy for system outcomes?
8. Infrastructure terms used for a non-technical audience?
9. *"after some time"* present — replace with *"later"*?
10. *"Try again"* included for recoverable system-loading errors?
11. For technical audiences — is a specific cause stated instead of a generic system error?

All eleven pass → ship it. Any fail → fix it first.

---

## The Test

Two questions. Both must pass.

> **1. Does this copy tell the user what happened and what to do?**
> Not everything — just enough to act with confidence. If they have
> to guess at either, the copy isn't done.

> **2. Could this string sit next to any other string in the product
> and sound like the same voice?**
> Same register, same restraint, same respect for the user's time.
> If it sounds like a different product wrote it, it's not ready.

> **Both yes** → Ship it.
> **Either no** → Identify which — clarity or coherence — and fix that.
