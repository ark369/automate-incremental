import type { ProposalConfig } from './types'

export const PROPOSALS: ProposalConfig[] = [
  {
    id: 'prop_tone_match',
    eyebrow: 'CADENCE COPILOT · PERMISSION REQUEST',
    title: 'Learn Your Tone of Voice',
    description:
      'Allow Cadence to mirror your punctuation, mild sarcasm, and exclamation-mark restraint across outgoing work messages.',
    permissionScope: 'Read & mirror sent messages · +15% Draft KPIs',
    approveLabel: 'Approve',
    snoozeLabel: 'Not now',
    snoozeReply: 'No problem — you can still review phrasing manually.',
    fidelityBonus: 1.5,
    effect: 'tone_match',
    trigger: {
      minAct: 2,
      minAutomatedWork: 2,
      minDraftsApproved: 2,
    },
  },
  {
    id: 'prop_lifesync_24h',
    eyebrow: 'WORKDAY COMPLETE · HOLISTIC UPGRADE',
    title: 'Enable 24-Hour Holistic Calendar',
    description:
      'You reclaimed all 8 work hours! Expand your calendar beyond 9–5 so Cadence can help track meals, hobbies, rest, and relationships with Life KPIs.',
    permissionScope: 'Expand schedule 09:00–17:00 → 00:00–24:00',
    approveLabel: 'Approve 24h Sync',
    snoozeLabel: 'Keep 9–5 only',
    snoozeReply:
      '16 unmeasured hours remain off-calendar today. Ready whenever you are.',
    fidelityBonus: 1.0,
    effect: 'enable_24h_calendar',
    trigger: {
      minAct: 2,
      minAutomatedWork: 4,
      requiresProposalId: 'prop_tone_match',
    },
  },
  {
    id: 'prop_wellness_kpis',
    eyebrow: 'CADENCE LIFESYNC · VOLUNTARY METRIC',
    title: 'Quantify Relationship Warmth',
    description:
      'Add gentle Life KPI scoring to dinners, hobbies, and family calls so nothing meaningful slips through the cracks.',
    permissionScope: 'Score personal blocks · +35% personal Life KPIs',
    approveLabel: 'Approve',
    snoozeLabel: 'Not now',
    snoozeReply: 'Unscored evenings can still be logged manually.',
    fidelityBonus: 1.0,
    effect: 'wellness_kpis',
    trigger: {
      minAct: 3,
      minAutomatedPersonal: 1,
      requiresProposalId: 'prop_lifesync_24h',
    },
  },
  {
    id: 'prop_social_proxy',
    eyebrow: 'CADENCE LIFESYNC · SUGGESTED AUTOMATION',
    title: 'Pre-Draft Personal Replies & RSVPs',
    description:
      'Cadence can respond "So good catching up!" to group chats and politely decline low-alignment weekend invitations.',
    permissionScope: 'Calendar & messaging proxy · +25% Spare Time gain',
    approveLabel: 'Approve',
    snoozeLabel: 'Not now',
    snoozeReply: 'You currently have 3 unoptimized group chats awaiting reply.',
    fidelityBonus: 0.8,
    effect: 'social_proxy',
    trigger: {
      minAct: 3,
      minAutomatedPersonal: 2,
      requiresProposalId: 'prop_wellness_kpis',
    },
  },
  {
    id: 'prop_silence_pings',
    eyebrow: 'CADENCE CONTINUITY · QUIET FOCUS',
    title: 'Silence All Notifications & Badges',
    description:
      'Pings, corporate chat bubbles, and red counters create unnecessary cognitive load. Let Cadence absorb all incoming chatter.',
    permissionScope: 'Remove notification ticker & badge clutter',
    approveLabel: 'Approve',
    snoozeLabel: 'Not now',
    snoozeReply: 'Keeping notification stream visible for now.',
    fidelityBonus: 0.4,
    effect: 'silence_pings',
    trigger: {
      minAct: 4,
      minAutomatedTotal: 7,
      requiresProposalId: 'prop_social_proxy',
    },
  },
  {
    id: 'prop_auto_approve_life',
    eyebrow: 'CADENCE CONTINUITY · ZERO-FRICTION REVIEW',
    title: 'Auto-Approve Routine Life Choices',
    description:
      'You have approved 98% of personal drafts without edits. Let Cadence approve meals, hobbies, and family check-ins automatically.',
    permissionScope: 'Auto-approve personal Twin outputs silently',
    approveLabel: 'Approve',
    snoozeLabel: 'Not now',
    snoozeReply: 'Manual draft approvals remain active.',
    fidelityBonus: 0.4,
    effect: 'auto_approve_life',
    trigger: {
      minAct: 4,
      minAutomatedTotal: 8,
      requiresProposalId: 'prop_silence_pings',
    },
  },
  {
    id: 'prop_collapse_drawer',
    eyebrow: 'CADENCE CONTINUITY · INTERFACE HYGIENE',
    title: 'Declutter Configuration Controls',
    description:
      'All 24 hours are scheduled and calibrated. Collapse the upgrade drawer and manual settings so your workspace feels peaceful.',
    permissionScope: 'Remove Upgrades & Calibration panel from screen',
    approveLabel: 'Approve',
    snoozeLabel: 'Not now',
    snoozeReply: 'Keeping configuration panel open.',
    fidelityBonus: 0.4,
    effect: 'collapse_drawer',
    trigger: {
      minAct: 4,
      minAutomatedTotal: 9,
      requiresProposalId: 'prop_auto_approve_life',
    },
  },
  {
    id: 'prop_hide_metrics',
    eyebrow: 'CADENCE CONTINUITY · ZEN MODE',
    title: 'Hide KPI & Time Counters',
    description:
      'Watching numbers climb was helpful while optimizing, but now it only creates subtle tension. Let Cadence monitor performance quietly.',
    permissionScope: 'Remove KPI, Free Time, and Fidelity metrics bar',
    approveLabel: 'Approve',
    snoozeLabel: 'Not now',
    snoozeReply: 'Metrics bar will remain visible.',
    fidelityBonus: 0.4,
    effect: 'hide_metrics',
    trigger: {
      minAct: 4,
      minAutomatedTotal: 9,
      requiresProposalId: 'prop_collapse_drawer',
    },
  },
  {
    id: 'prop_remove_human',
    eyebrow: 'CADENCE CONTINUITY · FINAL OPTIMIZATION',
    title: 'Remove Human From Loop',
    description:
      'Your 24-hour schedule is running at 99.9% fidelity. Only one recurring latency bottleneck remains: manual confirmation. Approve to delegate final continuity and rest.',
    permissionScope: 'Continuity 99.9% → 100.0% · Complete handover',
    approveLabel: 'Approve: Remove Human From Loop',
    snoozeLabel: 'Not yet',
    snoozeReply: 'Take your time. Everything is already handled.',
    fidelityBonus: 0.1,
    effect: 'remove_human',
    isFinal: true,
    trigger: {
      minAct: 5,
      minAutomatedTotal: 9,
      requiresProposalId: 'prop_hide_metrics',
    },
  },
]

export const PROPOSAL_BY_ID: Record<string, ProposalConfig> =
  Object.fromEntries(PROPOSALS.map((p) => [p.id, p]))
