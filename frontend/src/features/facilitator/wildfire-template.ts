export interface WorkshopTemplate {
  title: string
  tag: string
  description: string
  useCases: { title: string; description: string }[]
  userFlowChips: string[]
  canvasChips: string[]
  stakeholderSuggestions: string[]
}

export const WILDFIRE_TEMPLATE: WorkshopTemplate = {
  title: 'Wildfire Emergency Intelligence Workshop',
  tag: 'wildfire-workshop-2026',
  description:
    'Co-design session for a wildfire monitoring and response platform. Participants map their role in the emergency chain, describe their digital workflow, and identify coordination gaps.',

  useCases: [
    {
      title: 'Early Detection & Alerting',
      description:
        'A new fire is reported via sensors, aerial surveillance, or citizen reports. Teams verify the incident, validate severity, and trigger the alert chain across agencies.',
    },
    {
      title: 'Active Fire Coordination',
      description:
        'Fire is spreading. Ground crews, helicopters, and coordination centres need shared real-time situational awareness — perimeter, weather, resource positions, and escape routes.',
    },
    {
      title: 'Evacuation & Public Safety',
      description:
        'Affected communities need clear guidance on which zones to evacuate, which routes are safe, where shelters are located, and live updates on fire progression.',
    },
    {
      title: 'Post-Fire Recovery & Documentation',
      description:
        'After containment: damage assessment, environmental monitoring, reforestation planning, and formal incident reports for national authorities and insurance.',
    },
  ],

  // 20 action steps participants can drag onto their User Flow canvas
  userFlowChips: [
    'Open fire map',
    'Check current risk level',
    'Report new fire',
    'View active incident',
    'Track fire perimeter',
    'Check weather data',
    'View evacuation zones',
    'Request air support',
    'Log field observation',
    'Send situation report',
    'Switch to offline mode',
    'Coordinate with units',
    'Check resource availability',
    'View fire history',
    'Export incident report',
    'Set notification zone',
    'View satellite imagery',
    'Update incident status',
    'Download area map',
    'Receive emergency alert',
  ],

  // 24 keywords participants can drag into Problem Board sections
  canvasChips: [
    'Poor network coverage',
    'Data latency',
    'Battery drain in field',
    'No offline mode',
    'Multi-agency silos',
    'Alert fatigue',
    'Jurisdiction overlap',
    'Language barriers',
    'Sensor unreliability',
    'Budget cuts',
    'Training gap',
    'Data sharing protocols',
    'Decision-making speed',
    'Resource allocation',
    'Public communication',
    'Weather data integration',
    'Satellite coverage gaps',
    'Volunteer coordination',
    'Cross-border incidents',
    'Equipment incompatibility',
    'Legal liability',
    'Early detection gap',
    'Evacuation routing',
    'Media pressure',
  ],

  // 21 stakeholders pre-seeded in the Stakeholder Map sidebar
  // Ordered roughly Customer → Internal → External → Public so the
  // sidebar list reflects natural drop zones on the canvas
  stakeholderSuggestions: [
    // Customer / User zone — daily app users on the ground
    'Ground Crew Lead',
    'Forest Ranger',
    'Emergency Dispatcher',
    'Field Observer',

    // Internal zone — coordination inside the fire service
    'Incident Commander',
    'Civil Protection Director',
    'GIS Analyst',
    'Coordination Centre (RLZ)',

    // External zone — partner organisations
    'Mayor / Municipal Government',
    'Meteorologist (AEMET)',
    'Regional Forest Authority',
    'Volunteer Fire Brigade (VVFF)',
    'Military Emergency Unit (UME)',
    'Air Support Coordinator',
    'Regional Police',

    // Public zone — broader ecosystem
    'National Ministry',
    'Citizens / Evacuees',
    'Media & Press',
    'NGO / Red Cross',
    'Research Institution',
    'EU Observer',
  ],
}
