import { t } from '@/lib/i18n'
import type { ParticipantCompletion, SessionPhase } from '@/types'

export const PHASE_ORDER: SessionPhase[] = [
  'lobby', 'slides', 'template_1', 'template_2', 'template_3', 'template_4', 'launched',
]

export function phaseHint(phase: SessionPhase): string {
  const key = `facilitator.phase_hint_${phase}`
  const hint = t(key)
  return hint === key ? '' : hint
}

export function getNextPhase(current: SessionPhase, hasSlides: boolean): SessionPhase | null {
  if (current === 'lobby') return hasSlides ? 'slides' : 'template_1'
  if (current === 'slides') return 'template_1'
  if (current === 'template_1') return 'template_2'
  if (current === 'template_2') return 'template_3'
  if (current === 'template_3') return 'template_4'
  if (current === 'template_4') return 'launched'
  return null
}

export function getPrevPhase(current: SessionPhase, hasSlides: boolean): SessionPhase | null {
  if (current === 'lobby') return null
  if (current === 'slides') return 'lobby'
  if (current === 'template_1') return hasSlides ? 'slides' : 'lobby'
  if (current === 'template_2') return 'template_1'
  if (current === 'template_3') return 'template_2'
  if (current === 'template_4') return 'template_3'
  if (current === 'launched') return 'template_4'
  return null
}

export function nextPhaseLabel(current: SessionPhase, hasSlides: boolean): string {
  if (current === 'lobby') return hasSlides ? t('facilitator.start_presentation') : t('facilitator.start_workshop')
  if (current === 'slides') return t('facilitator.start_workshop')
  if (current === 'template_1') return t('facilitator.unlock_user_flow')
  if (current === 'template_2') return t('facilitator.unlock_problem_board')
  if (current === 'template_3') return t('facilitator.unlock_stakeholder_map')
  if (current === 'template_4') return t('facilitator.launch_wildfire')
  return ''
}

export function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export const COMPLETION_COLS: { key: keyof ParticipantCompletion; phaseKey: SessionPhase }[] = [
  { key: 'persona', phaseKey: 'template_1' },
  { key: 'user_flow', phaseKey: 'template_2' },
  { key: 'problem_board', phaseKey: 'template_3' },
  { key: 'stakeholder_map', phaseKey: 'template_4' },
]

export const PHASE_COMPLETION_KEY: Partial<Record<SessionPhase, keyof ParticipantCompletion>> = {
  template_1: 'persona',
  template_2: 'user_flow',
  template_3: 'problem_board',
  template_4: 'stakeholder_map',
}
