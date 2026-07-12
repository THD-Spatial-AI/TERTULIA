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
  user_flow_chips: string[]
  canvas_chips: string[]
  stakeholder_suggestions: string[]
}

export interface Participant {
  id: string
  display_name: string
  role: string
  org: string | null
  joined_at: string
}

export interface ControlMessage {
  type: 'phase' | 'launch' | 'broadcast'
  phase?: SessionPhase
  wildfire_url?: string
  message?: string
}

export interface ParticipantCompletion {
  participant_id: string
  display_name: string
  role: string
  persona: boolean
  user_flow: boolean
  problem_board: boolean
  stakeholder_map: boolean
}

export type ReactionKind = 'emoji_fire' | 'emoji_heart' | 'emoji_question' | 'raise_hand'

export interface ReactionEvent {
  kind: ReactionKind
  display_name: string
}
