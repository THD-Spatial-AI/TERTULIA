export type SessionPhase =
  | 'lobby'
  | 'slides'
  | 'template_1'
  | 'template_2'
  | 'template_3'
  | 'template_4'
  | 'launched'

export interface Session {
  id: string
  slug: string
  facilitator_id: string
  title: string
  workshop_tag: string
  slides_url: string | null
  wildfire_url: string
  phase: SessionPhase
  created_at: string
}

export interface Participant {
  id: string
  session_id: string
  display_name: string
  role: string
  org: string | null
  joined_at: string
}

export interface ParticipantWithToken extends Participant {
  session_token: string
}

export interface PersonaCard {
  id: string
  participant_id: string
  session_id: string
  goals: string | null
  pain_points: string | null
  tech_comfort: number | null
  completed_at: string | null
}

export interface FlowStep {
  id: string
  label: string
  description: string
  order: number
}

export interface ProblemNote {
  id: string
  text: string
  type: 'problem' | 'opportunity'
  order: number
}

export interface StakeholderNode {
  id: string
  name: string
  role: string
  position: { x: number; y: number }
}

export interface StakeholderEdge {
  id: string
  source: string
  target: string
  label: string
}

export type ReactionType = 'emoji_fire' | 'emoji_heart' | 'emoji_question' | 'raise_hand'

// Realtime channel message shapes
export interface ControlMessage {
  type: 'phase' | 'slide' | 'launch'
  phase?: SessionPhase
  slide_index?: number
  wildfire_url?: string
}
