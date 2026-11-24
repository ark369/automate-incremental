export type ActId = 1 | 2 | 3 | 4 | 5

export type TaskDomain = 'work' | 'personal'

export type PermissionTier =
  | 'Manual'
  | 'Draft'
  | 'Assist'
  | 'Send'
  | 'Schedule'
  | 'Decide'
  | 'Continuous'

export interface TaskConfig {
  id: string
  domain: TaskDomain
  name: string
  shortLabel: string
  /** Start hour on a 24h clock (0..24) */
  startHour: number
  /** Duration in hours on the day calendar */
  durationHours: number
  /** Seconds to manually perform once at 1x speed */
  manualDurationSec: number
  /** Base KPI payout on manual completion */
  baseKpiReward: number
  /** Multiplier applied when completed via Twin Draft / Automation */
  autoKpiMultiplier: number
  /** Number of manual demonstrations needed to calibrate Digital Twin */
  samplesRequired: number
  /** Cost to enable Twin Automation once samples are complete */
  automateCostKpis: number
  automateCostSpareHrs: number
  /** Contribution to global Twin Fidelity (%) when automated */
  fidelityContribution: number
  /** Flavor text shown while manual */
  manualSubtitle: string
  /** Calibration progress note shown as samples fill */
  calibrationNote: string
  /** Short flavor shown in Draft approval cards */
  draftLabel: string
  /** Flavor text shown once fully automated */
  automatedNote: string
  /** Quiet log entry emitted when running autonomously in Act 5 / epilogue */
  autonomousLog: string
  /** Life KPI rating shown before automating personal blocks */
  unoptimizedScore?: string
  /** Order in which work tasks unlock (optional dependency) */
  unlockAfterTaskId?: string
}

export interface UpgradeConfig {
  id: string
  name: string
  description: string
  category: 'work' | 'twin' | 'life'
  costKpis: number
  costSpareHrs: number
  minAct: ActId
  /** Optional required automated task count before appearing */
  minAutomatedCount?: number
  /** Optional prerequisite upgrade ID */
  requiresUpgradeId?: string
  /** Mechanical effect identifier */
  effect:
    | 'manual_speed_1'
    | 'manual_speed_2'
    | 'batch_approve'
    | 'auto_approve_work'
    | 'work_kpi_boost'
    | 'spare_time_boost'
    | 'life_kpi_boost'
}

export type ProposalEffect =
  | 'tone_match'
  | 'enable_24h_calendar'
  | 'wellness_kpis'
  | 'social_proxy'
  | 'silence_pings'
  | 'auto_approve_life'
  | 'collapse_drawer'
  | 'hide_metrics'
  | 'remove_human'

export interface ProposalConfig {
  id: string
  eyebrow: string
  title: string
  description: string
  permissionScope: string
  approveLabel: string
  snoozeLabel: string
  snoozeReply: string
  /** Fidelity % added upon approval */
  fidelityBonus: number
  effect: ProposalEffect
  /** Whether this proposal is the final Act 5 climax */
  isFinal?: boolean
  /** Trigger condition evaluated declaratively in engine */
  trigger: {
    minAct?: ActId
    minAutomatedWork?: number
    minAutomatedPersonal?: number
    minAutomatedTotal?: number
    requiresProposalId?: string
    minDraftsApproved?: number
  }
}

export interface ActConfig {
  id: ActId
  code: string
  title: string
  brandTitle: string
  brandSubtitle: string
  kpiLabel: string
  permissionTier: PermissionTier
  /** Base visual serenity target (0 = fluorescent office clutter, 1 = eerie minimalist calm) */
  baseSerenity: number
  toastHeadline: string
  toastBody: string
}

export interface PingMessage {
  id: string
  sender: string
  channel: string
  text: string
  /** Optional task ID whose automation silences this ping */
  relatedTaskId?: string
  minAct: ActId
  maxAct: ActId
  tone: 'urgent' | 'corporate' | 'wellness' | 'calm'
}

export interface PendingDraft {
  id: string
  taskId: string
  title: string
  detail: string
  kpiReward: number
  createdAt: number
}

export interface ActivePing {
  id: string
  sender: string
  channel: string
  text: string
  tone: PingMessage['tone']
  createdAt: number
}

export interface AutonomousLogEntry {
  id: string
  timeLabel: string
  text: string
}
