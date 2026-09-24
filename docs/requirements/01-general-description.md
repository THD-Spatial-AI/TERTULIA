# General Description

## Stakeholders

| Role | Organization | Interest |
|---|---|---|
| Workshop Facilitator | THD Spatial AI | Creates and controls workshop sessions; interprets outputs for product decisions |
| Firefighter | Fire departments, emergency response agencies | Represents operational perspective on wildfire response tools |
| Mayor / Municipal Official | City and regional governments | Represents policy and resource allocation perspective |
| Scientist / Researcher | Universities, research institutions | Represents data quality and model validation perspective |
| Academic | Universities (THD, UVigo, etc.) | Represents educational and methodological perspective |
| Developer (THD Spatial AI) | THD Spatial AI | Consumes workshop outputs to guide Wildfire feature development |
| Feedback pipeline (built-in, automated) | THD Spatial AI | Receives pre-registered personas and turns in-app feedback into GitHub issues |

## Objectives

### Primary Objective
Provide a structured, real-time collaborative environment for stakeholder co-design workshops around the Wildfire platform — converting diverse expert knowledge into actionable product data.

### Secondary Objectives
- Reduce the friction of stakeholder participation (no account creation, no installation)
- Automatically bridge workshop output to the development feedback loop
- Support both in-person and fully remote workshop formats
- Be reusable for future THD Spatial AI projects beyond Wildfire

## Context & Scope

### In Scope — v1

- Presenter-controlled workshop sessions (3-phase journey: slides → templates → launch)
- Anonymous participant join via URL or QR code
- Real-time slide sync (external iframe)
- Real-time participant reactions (emoji, raise hand)
- 4 collaborative templates: Persona Card, User Flow, Problem/Opportunity Board, Stakeholder Map
- Facilitator live progress monitoring (completion counts, individual submission view)
- Launch into the target app (Wildfire by default) with automatic persona pre-registration to the built-in feedback pipeline
- In-app feedback capture (overlay) → AI-generated GitHub issues, with pre-attached persona
- Workshop feedback report export (Markdown + PDF + Excel)
- Multilingual interface (DE / EN / ES / GL)
- Desktop and tablet responsive layout

### Out of Scope — v1

- Slide authoring inside the platform
- Video/audio conferencing
- Multi-workshop analytics dashboard
- AI-assisted persona synthesis
- PDF/Excel export of the co-design template outputs (personas/flows) — note: the feedback pipeline *does* export a workshop **feedback** report (MD/PDF/Excel)
- Support for projects other than Wildfire (architecture supports it; UI for it is v2)
- Mobile phone layout
