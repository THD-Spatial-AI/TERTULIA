import { categoriser } from '@/components/canvas/ChipPalette'

// ── Category definitions ─────────────────────────────────────────────────────
// Thematic problem/opportunity types that apply across any domain project.
// Chips are matched by label; unrecognised chips fall into "Other".

const CATEGORIES: { nameKey: string; chips: Set<string> }[] = [
  {
    nameKey: 'chip_cat.technical',
    chips: new Set([
      // Wildfire template
      'Poor network coverage',
      'Data latency',
      'No offline mode',
      'Sensor unreliability',
      'Equipment incompatibility',
      'Weather data integration',
      'Satellite coverage gaps',
      'Battery drain in field',
      // Generic template
      'Data availability',
      'Alert systems',
      'Network coverage',
      'Sensor reliability',
      'Data quality',
      'Integration',
      'Security',
      'Scalability',
    ]),
  },
  {
    nameKey: 'chip_cat.organisational',
    chips: new Set([
      // Wildfire template
      'Multi-agency silos',
      'Alert fatigue',
      'Training gap',
      'Decision-making speed',
      'Volunteer coordination',
      'Cross-border incidents',
      // Generic template
      'User training',
      'Coordination gap',
      'User adoption',
      'Stakeholder alignment',
    ]),
  },
  {
    nameKey: 'chip_cat.resources',
    chips: new Set([
      // Wildfire template
      'Budget cuts',
      'Resource allocation',
      // Generic template
      'Budget limits',
      'Budget',
      'Timeline',
    ]),
  },
  {
    nameKey: 'chip_cat.legal',
    chips: new Set([
      // Wildfire template
      'Jurisdiction overlap',
      'Legal liability',
      'Data sharing protocols',
      // Generic template
      'Legal constraints',
    ]),
  },
  {
    nameKey: 'chip_cat.communication',
    chips: new Set([
      // Wildfire template
      'Language barriers',
      'Public communication',
      'Media pressure',
    ]),
  },
  {
    nameKey: 'chip_cat.operational',
    chips: new Set([
      // Wildfire template
      'Early detection gap',
      'Evacuation routing',
    ]),
  },
]

export const groupProblemChips = categoriser(CATEGORIES, 'chip_cat.other')
