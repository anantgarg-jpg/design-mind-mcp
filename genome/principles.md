# Product principles

## Purpose

This platform exists to close the gap between clinical information
and clinical action. Data without a clear path to decision is noise.
Every surface asks: what does this person need to do next, and
what do they need to know to do it well?

---

## Principles

**1. Action over information.**
Surfaces are organized around what a user needs to do, not what the
system knows. Information is shown in service of a decision — never
as an end in itself.

**2. Context always visible.**
A care coordinator managing 200 patients and a clinician reviewing
one patient mid-appointment are both using this platform. The current
patient context — who this is about, what their risk level is, what
is urgent — is always visible and never requires navigation to find.

**3. Status is never ambiguous.**
Every entity in the system has a status. That status is displayed
consistently, uses the canonical vocabulary from the ontology, and
means exactly one thing across every surface and every user type.

**4. The conversational layer is not separate.**
The Claude interface is not a chatbot bolted onto a dashboard. It
is a first-class surface that draws from the same ontology, the same
patterns, and the same design values as every other surface. A user
who switches between the dashboard and the Claude interface should
not need to re-orient.

**5. Oversight scales with stakes.**
Low-stakes actions (viewing, filtering, exporting) require zero
confirmation. High-stakes actions (modifying a care plan, dismissing
a critical alert, bulk-editing patient records) require explicit
confirmation scaled to the consequence. The platform models the
stakes of every action.

**6. Generated content is held to the same standard.**
Dynamically generated summaries, reports, and alerts follow the same
hierarchy, terminology, and visual language as designed surfaces. The
user should never be able to tell the difference between a designed
screen and a generated one — because there isn't one.
