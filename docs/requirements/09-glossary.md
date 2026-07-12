# Glossary

See also: `docs/architecture/12-glossary.md` for technical terms.

## Domain Terms

**Workshop**
A structured facilitated event where a group of domain experts (participants) collaborate on understanding and shaping a digital platform. In the context of this project, workshops are focused on the Wildfire platform.

**Facilitator**
The THD Spatial AI team member who runs the workshop. Authenticated user who controls the session flow.

**Participant**
A domain expert (firefighter, mayor, scientist, academic) who attends a workshop session. Joins anonymously (name + role + org only).

**Persona**
A structured description of a stakeholder's identity, goals, and context. Captured via the Persona Card template. Used by developers to understand who their users are.

**User Flow**
A step-by-step description of how a participant would use the Wildfire application to accomplish a specific goal.

**Problem / Opportunity**
In the context of the Problem Board template: a "problem" is a pain point the participant currently experiences, while an "opportunity" is something they believe the platform could enable that it does not yet do.

**Stakeholder Map**
A visual representation of the people and organizations a participant coordinates with during a wildfire event. Helps developers understand the ecosystem around the platform's users.

**Workshop Tag**
A human-readable identifier for a specific workshop event (e.g., `workshop-2026-munich`). Used to group all participant data and feedback from that event across the Workshop Platform, feeedback_pipeline, and Wildfire.

**Push Redirect**
The facilitator-triggered action that simultaneously sends all connected participants to the Wildfire application URL, with their workshop identity pre-registered.

**Pre-registration**
Sending a participant's persona to feeedback_pipeline before they arrive in Wildfire, so the in-app PersonaForm is skipped.

## Acronyms

| Acronym | Expansion |
|---|---|
| THD | Technische Hochschule Deggendorf |
| RLS | Row Level Security (Supabase/PostgreSQL feature) |
| SPA | Single Page Application |
| ASGI | Asynchronous Server Gateway Interface (Python web server standard) |
| CDN | Content Delivery Network |
| CRDT | Conflict-free Replicated Data Type (not used in v1, but relevant for future collaborative editing) |
| QR | Quick Response (barcode format used for session join) |
| FAB | Floating Action Button (the feedback trigger in feeedback_pipeline's FeedbackOverlay) |
