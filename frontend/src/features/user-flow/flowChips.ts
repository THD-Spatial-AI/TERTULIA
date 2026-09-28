import { categoriser } from '@/components/canvas/ChipPalette'

// ── Category definitions ─────────────────────────────────────────────────────
// Generic workflow phases that work across any domain.
// Each chip is matched to a category; unrecognised chips go to "Custom".

const CATEGORIES: { nameKey: string; chips: Set<string> }[] = [
  {
    nameKey: 'chip_cat.access',
    chips: new Set([
      'Open fire map',
      'View active incident',
      'View evacuation zones',
      'View fire history',
      'View satellite imagery',
      'Sign in',
      'Browse content',
      'Open map',
      'Access offline maps',
    ]),
  },
  {
    nameKey: 'chip_cat.check',
    chips: new Set([
      'Check current risk level',
      'Check weather data',
      'Check resource availability',
      'Track fire perimeter',
      'Search',
      'Filter results',
      'Check risk level',
      'Check evacuation zones',
      'Check alerts',
    ]),
  },
  {
    nameKey: 'chip_cat.report',
    chips: new Set([
      'Report new fire',
      'Log field observation',
      'Send situation report',
      'Update incident status',
      'Share',
      'Send alert to family',
      'Contact authorities',
    ]),
  },
  {
    nameKey: 'chip_cat.coordinate',
    chips: new Set([
      'Request air support',
      'Coordinate with units',
      'Set notification zone',
      'Find escape routes',
      'Contact emergency services',
      'Share situational update',
    ]),
  },
  {
    nameKey: 'chip_cat.receive',
    chips: new Set([
      'Receive emergency alert',
      'Receive alert',
    ]),
  },
  {
    nameKey: 'chip_cat.export',
    chips: new Set([
      'Switch to offline mode',
      'Download area map',
      'Export incident report',
      'Export data',
    ]),
  },
]

export const groupFlowChips = categoriser(CATEGORIES, 'chip_cat.custom')
