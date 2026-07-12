# Introduction & Goals

## Purpose

The Workshop Logic Platform is a web-based collaborative environment developed by THD Spatial AI to support structured stakeholder co-design workshops around geospatial and AI-driven applications.

Its first deployment targets the **Wildfire** platform — a geospatial wildfire risk simulation tool — bringing together domain experts (firefighters, mayors, scientists, academics) to collaboratively define personas, user flows, problem statements, and stakeholder maps.

The platform acts as the orchestration layer between a workshop facilitation session and the development/feedback pipeline:

1. Facilitator presents the platform context (slides phase)
2. Stakeholders collaboratively fill structured templates (workshop phase)
3. All participants are simultaneously redirected to the live platform (launch phase), with their identity pre-registered in the Feedback Pipeline

## Architectural Goals

| Priority | Goal | Description |
|---|---|---|
| 1 | Real-time collaboration | All participants see live updates with < 500ms latency |
| 2 | Zero friction for participants | No account creation, no installation, join by URL or QR code |
| 3 | Facilitator control | Single facilitator drives the session pace and template unlocking |
| 4 | Pipeline integration | Participant personas feed automatically into feeedback_pipeline |
| 5 | Multilingual | Full DE / EN / ES / GL support from day one |
| 6 | Tablet-first | Usable on tablets and laptops without horizontal scroll |
| 7 | Zero infrastructure | Supabase + Vercel managed hosting, no server maintenance |

## Stakeholders

| Role | Interest in the System |
|---|---|
| Workshop Facilitator (THD Spatial AI) | Creates and controls sessions; sees live participant progress |
| Domain Expert Participant | Firefighter, mayor, scientist, academic — fills templates, provides real-world knowledge |
| Developer (THD Spatial AI) | Consumes workshop outputs (personas, flows) for product decisions |
| Feedback Pipeline (automated) | Receives pre-registered personas to enrich Wildfire feedback |

## Quality Goals

| Quality | Scenario |
|---|---|
| Availability | Platform is reachable for a workshop at 10:00 AM with 30+ participants joining simultaneously |
| Consistency | Slide index and phase changes propagate to all participants within 500ms |
| Privacy | Participants are anonymous — no email, no password, no persistent user account |
| Maintainability | A single developer can understand and modify any feature module independently |
| Internationalization | All visible strings are translated in DE, EN, ES, GL — no hard-coded English |
