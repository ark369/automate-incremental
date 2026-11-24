import type { ActConfig, ActId } from './types'

export const ACTS: Record<ActId, ActConfig> = {
  1: {
    id: 1,
    code: 'ACT I',
    title: 'The Grind',
    brandTitle: 'Vantex Workspace',
    brandSubtitle: 'Q4 Productivity Portal · Employee #4081',
    kpiLabel: 'KPIs',
    permissionTier: 'Manual',
    baseSerenity: 0.05,
    toastHeadline: 'Welcome back to Monday',
    toastBody:
      'Perform tasks manually to earn KPIs and collect Digital Twin calibration samples.',
  },
  2: {
    id: 2,
    code: 'ACT II',
    title: 'Delegation',
    brandTitle: 'Cadence Workday',
    brandSubtitle: 'Digital Twin Copilot · Draft Review Mode',
    kpiLabel: 'KPIs',
    permissionTier: 'Draft',
    baseSerenity: 0.32,
    toastHeadline: 'Cadence Twin Online',
    toastBody:
      'Your Twin now prepares drafts as the day sweeps by. One tap to approve — far less noise.',
  },
  3: {
    id: 3,
    code: 'ACT III',
    title: 'Optimization Creep',
    brandTitle: 'Cadence LifeSync',
    brandSubtitle: '24-Hour Holistic Continuity · Beta',
    kpiLabel: 'Life KPIs',
    permissionTier: 'Schedule',
    baseSerenity: 0.56,
    toastHeadline: '24-Hour Calendar Synced',
    toastBody:
      '16 previously unmeasured hours are now visible. Calibrate personal routines to maximize Life KPIs.',
  },
  4: {
    id: 4,
    code: 'ACT IV',
    title: 'The Approval Trap',
    brandTitle: 'Cadence Continuity',
    brandSubtitle: 'Autonomous Preference Alignment',
    kpiLabel: 'Alignment',
    permissionTier: 'Decide',
    baseSerenity: 0.8,
    toastHeadline: 'High-Fidelity Alignment',
    toastBody:
      'Cadence can now reduce interface friction and handle routine approvals on your behalf.',
  },
  5: {
    id: 5,
    code: 'ACT V',
    title: 'Frictionless',
    brandTitle: 'Continuity',
    brandSubtitle: '',
    kpiLabel: 'Alignment',
    permissionTier: 'Continuous',
    baseSerenity: 1.0,
    toastHeadline: '99.9% Continuity Reached',
    toastBody: 'One final latency source remains in the loop.',
  },
}
