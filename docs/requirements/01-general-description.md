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
| feeedback_pipeline (automated system) | THD Spatial AI | Receives pre-registered personas to enrich in-app feedback |

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
- Wildfire launch with automatic persona pre-registration to feeedback_pipeline
- Multilingual interface (DE / EN / ES / GL)
- Desktop and tablet responsive layout

### Out of Scope — v1

- Slide authoring inside the platform
- Video/audio conferencing
- Multi-workshop analytics dashboard
- AI-assisted persona synthesis
- PDF/Excel export of workshop outputs
- Support for projects other than Wildfire (architecture supports it; UI for it is v2)
- Mobile phone layout
