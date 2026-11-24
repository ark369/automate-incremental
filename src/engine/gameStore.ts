import { create } from 'zustand'
import { ACTS } from '../content/acts'
import { PINGS } from '../content/pings'
import { PROPOSAL_BY_ID } from '../content/proposals'
import { TASK_BY_ID, TASKS } from '../content/tasks'
import { UPGRADE_BY_ID } from '../content/upgrades'
import type {
  ActId,
  ActivePing,
  AutonomousLogEntry,
  PendingDraft,
  TaskConfig,
} from '../content/types'
import {
  computeActFromState,
  formatClockHour,
  getAutomatedCounts,
  getCurrentClockHour,
  getManualDurationSec,
  getSpareTimePerDay,
  getTaskKpiReward,
  getVisibleTasks,
} from './selectors'
import {
  playApprove,
  playAutomate,
  playFinalHandover,
  playPing,
  playTap,
  playTaskComplete,
} from './sound'

export const SAVE_STORAGE_KEY = 'cadence_save_v1'
const DAY_DURATION_WORK_SEC = 20
const DAY_DURATION_24H_SEC = 26
const MAX_PENDING_DRAFTS = 6
const PROPOSAL_BREATH_SEC = 4.5

export interface UiFlags {
  pingsHidden: boolean
  drawerHidden: boolean
  metricsHidden: boolean
}

export interface FeedbackToast {
  id: string
  headline: string
  body: string
  kind: 'act' | 'info' | 'snooze'
}

export interface FloatingSpark {
  id: string
  target: 'kpi' | 'task' | 'calendar' | 'fidelity'
  taskId?: string
  text: string
  tone: 'kpi' | 'sample' | 'calibrated' | 'auto'
  createdAtReal: number
}

export interface GameStats {
  manualCompletions: number
  draftsApproved: number
  proposalsApproved: number
  autoApprovalsFired: number
  totalKpisEarned: number
  totalSpareHrsEarned: number
}

export interface GameState {
  act: ActId
  calendarMode: '9-5' | '24h'
  dayNumber: number
  /** Normalized progress across active calendar (0..1) */
  dayProgress: number
  /** Accumulated simulated seconds (for snoozes, ping cadence, pulses) */
  simTimeSec: number
  kpis: number
  spareHrs: number
  /** Manual calibration sample counts per task */
  taskSamples: Record<string, number>
  /** Active manual task progress (0..1) per task currently running */
  manualRunning: Record<string, number>
  /** Tasks automated by the Digital Twin */
  automatedTasks: Record<string, boolean>
  /** Purchased upgrades */
  purchasedUpgrades: Record<string, boolean>
  /** Approved Cadence proposals */
  approvedProposals: Record<string, boolean>
  /** Proposal snooze expiry in simTimeSec */
  proposalSnoozedUntil: Record<string, number>
  /** Draft cards waiting for player approval */
  pendingDrafts: PendingDraft[]
  /** Recent corporate / wellness pings */
  activePings: ActivePing[]
  /** Quiet log of autonomous actions for Act 4–5 & epilogue */
  autonomousLogs: AutonomousLogEntry[]
  /** Timestamp (simTimeSec) of last sweep pulse per task for calendar animations */
  lastBlockPulse: Record<string, number>
  /** Transient floating visual sparks for tactile incremental feedback */
  sparks: FloatingSpark[]
  /** Hours already triggered on the current day sweep */
  triggeredTasksThisDay: Record<string, boolean>
  uiFlags: UiFlags
  humanRemoved: boolean
  watchingSilently: boolean
  toast: FeedbackToast | null
  stats: GameStats
  /** Dev / playback settings */
  speedMultiplier: 1 | 5 | 20
  paused: boolean
  nextPingAtSec: number
  nextProposalAtSec: number
  lastSavedAt: number
}

interface GameActions {
  tick: (realDtSec: number) => void
  startManualTask: (taskId: string) => void
  automateTask: (taskId: string) => void
  buyUpgrade: (upgradeId: string) => void
  approveDraft: (draftId: string) => void
  approveAllDrafts: () => void
  approveProposal: (proposalId: string) => void
  snoozeProposal: (proposalId: string) => void
  dismissPing: (pingId: string) => void
  dismissToast: () => void
  setWatchingSilently: (watching: boolean) => void
  setSpeed: (speed: 1 | 5 | 20) => void
  togglePaused: () => void
  jumpToAct: (targetAct: ActId) => void
  devGrantResources: (kpis: number, spareHrs: number) => void
  devFillSamples: () => void
  exportSave: () => string
  importSave: (json: string) => boolean
  hardReset: () => void
}

function createInitialState(): GameState {
  return {
    act: 1,
    calendarMode: '9-5',
    dayNumber: 1,
    dayProgress: 0.02,
    simTimeSec: 0,
    kpis: 0,
    spareHrs: 0,
    taskSamples: {},
    manualRunning: {},
    automatedTasks: {},
    purchasedUpgrades: {},
    approvedProposals: {},
    proposalSnoozedUntil: {},
    pendingDrafts: [],
    activePings: [
      {
        id: 'intro_ping',
        sender: 'Bill L.',
        channel: '#tps-compliance',
        text: 'Yeeeah, welcome back! Let’s clear that inbox & get those TPS sheets moving.',
        tone: 'corporate',
        createdAt: 0,
      },
    ],
    autonomousLogs: [],
    lastBlockPulse: {},
    sparks: [],
    triggeredTasksThisDay: {},
    uiFlags: {
      pingsHidden: false,
      drawerHidden: false,
      metricsHidden: false,
    },
    humanRemoved: false,
    watchingSilently: false,
    toast: {
      id: 'act_1_intro',
      headline: ACTS[1].toastHeadline,
      body: ACTS[1].toastBody,
      kind: 'act',
    },
    stats: {
      manualCompletions: 0,
      draftsApproved: 0,
      proposalsApproved: 0,
      autoApprovalsFired: 0,
      totalKpisEarned: 0,
      totalSpareHrsEarned: 0,
    },
    speedMultiplier: 1,
    paused: false,
    nextPingAtSec: 6,
    nextProposalAtSec: 0,
    lastSavedAt: Date.now(),
  }
}

function getBlockTriggerHour(task: TaskConfig): number {
  // Wrap-around overnight sleep ends at 06:00
  const end = task.startHour + task.durationHours
  if (end > 24) return end - 24
  return end === 24 ? 23.95 : end
}

function isAutoApproveEnabledForTask(
  state: GameState,
  task: TaskConfig,
): boolean {
  if (state.humanRemoved) return true
  if (task.domain === 'work') {
    return Boolean(state.purchasedUpgrades['auto_approve_work'])
  }
  return Boolean(state.approvedProposals['prop_auto_approve_life'])
}

function loadSavedState(): GameState {
  if (typeof window === 'undefined') return createInitialState()
  try {
    const raw = window.localStorage.getItem(SAVE_STORAGE_KEY)
    if (!raw) return createInitialState()
    const parsed = JSON.parse(raw) as Partial<GameState>
    const base = createInitialState()
    const merged: GameState = {
      ...base,
      ...parsed,
      uiFlags: { ...base.uiFlags, ...(parsed.uiFlags ?? {}) },
      stats: { ...base.stats, ...(parsed.stats ?? {}) },
      manualRunning: {},
      sparks: [],
      toast: null,
    }
    return merged
  } catch {
    return createInitialState()
  }
}

let uidCounter = 1
function nextId(prefix: string): string {
  uidCounter += 1
  return `${prefix}_${Date.now().toString(36)}_${uidCounter}`
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...loadSavedState(),

  tick: (realDtSec: number) => {
    const state = get()
    if (state.paused) return
    const clampedReal = Math.min(realDtSec, 0.25)
    const dt = clampedReal * state.speedMultiplier
    if (dt <= 0) return

    const dayDuration =
      state.calendarMode === '9-5'
        ? DAY_DURATION_WORK_SEC
        : DAY_DURATION_24H_SEC

    const prevSimTime = state.simTimeSec
    const nextSimTime = prevSimTime + dt
    const prevClockHour = getCurrentClockHour(state)

    let nextDayProgress = state.dayProgress + dt / dayDuration
    let nextDayNumber = state.dayNumber
    let triggered = state.triggeredTasksThisDay
    let wrappedDay = false

    if (nextDayProgress >= 1) {
      nextDayProgress = nextDayProgress % 1
      nextDayNumber += 1
      triggered = {}
      wrappedDay = true
    }

    // Bank Spare Hrs smoothly proportional to free calendar hours
    const sparePerDay = getSpareTimePerDay(state)
    const spareDelta = (sparePerDay / dayDuration) * dt
    let nextKpis = state.kpis
    let nextSpareHrs = state.spareHrs + spareDelta
    let nextManualRunning = state.manualRunning
    let nextSamples = state.taskSamples
    let nextDrafts = state.pendingDrafts
    let nextLogs = state.autonomousLogs
    let nextPulses = state.lastBlockPulse
    let nextPings = state.activePings
    let nextPingAtSec = state.nextPingAtSec
    let nextStats = state.stats
    let statsMutated = spareDelta > 0
    const nowReal = Date.now()
    let nextSparks = state.sparks.filter((sp) => nowReal - sp.createdAtReal < 1150)

    const pushSpark = (
      target: FloatingSpark['target'],
      text: string,
      tone: FloatingSpark['tone'],
      taskId?: string,
    ) => {
      nextSparks = [
        ...nextSparks.slice(-7),
        { id: nextId('spk'), target, taskId, text, tone, createdAtReal: nowReal },
      ]
    }

    const ensureStatsCopy = () => {
      if (!statsMutated || nextStats === state.stats) {
        nextStats = { ...state.stats }
        statsMutated = true
      }
    }

    if (spareDelta > 0) {
      ensureStatsCopy()
      nextStats.totalSpareHrsEarned += spareDelta
    }

    // 1. Advance active manual task timers
    const runningEntries = Object.entries(state.manualRunning)
    if (runningEntries.length > 0) {
      let changedRunning = false
      const updatedRunning: Record<string, number> = { ...state.manualRunning }
      for (const [taskId, progress] of runningEntries) {
        const task = TASK_BY_ID[taskId]
        if (!task || state.automatedTasks[taskId]) {
          delete updatedRunning[taskId]
          changedRunning = true
          continue
        }
        const dur = getManualDurationSec(state, task)
        const nextProg = progress + dt / dur
        if (nextProg >= 1) {
          delete updatedRunning[taskId]
          changedRunning = true
          const payout = getTaskKpiReward(state, task, false)
          nextKpis += payout
          const currentSamples = nextSamples[taskId] ?? 0
          const addedSample = currentSamples < task.samplesRequired
          const newCount = addedSample ? currentSamples + 1 : currentSamples
          if (addedSample) {
            nextSamples = {
              ...nextSamples,
              [taskId]: newCount,
            }
          }
          if (addedSample && newCount >= task.samplesRequired) {
            pushSpark('task', `CALIBRATED · +${payout}`, 'calibrated', taskId)
          } else if (addedSample) {
            pushSpark(
              'task',
              `+${payout} · Sample ${newCount}/${task.samplesRequired}`,
              'sample',
              taskId,
            )
          } else {
            pushSpark('task', `+${payout}`, 'kpi', taskId)
          }
          ensureStatsCopy()
          nextStats.manualCompletions += 1
          nextStats.totalKpisEarned += payout
          playTaskComplete()
        } else {
          updatedRunning[taskId] = nextProg
          changedRunning = true
        }
      }
      if (changedRunning) {
        nextManualRunning = updatedRunning
      }
    }

    // 2. Check calendar sweep passing automated block completion hours
    const nextClockHour =
      state.calendarMode === '9-5'
        ? 9 + nextDayProgress * 8
        : nextDayProgress * 24

    const visibleTasks = getVisibleTasks(state)
    for (const task of visibleTasks) {
      if (!state.automatedTasks[task.id]) continue
      if (triggered[task.id]) continue

      const triggerHour = getBlockTriggerHour(task)
      const crossed = wrappedDay
        ? triggerHour >= prevClockHour || triggerHour <= nextClockHour
        : prevClockHour < triggerHour && nextClockHour >= triggerHour

      if (crossed) {
        if (triggered === state.triggeredTasksThisDay) {
          triggered = { ...triggered }
        }
        triggered[task.id] = true
        if (nextPulses === state.lastBlockPulse) {
          nextPulses = { ...nextPulses }
        }
        nextPulses[task.id] = nextSimTime

        const reward = getTaskKpiReward(state, task, true)
        if (isAutoApproveEnabledForTask(state, task)) {
          nextKpis += reward
          ensureStatsCopy()
          nextStats.autoApprovalsFired += 1
          nextStats.totalKpisEarned += reward
          if (!state.uiFlags.metricsHidden) {
            pushSpark('calendar', `+${reward}`, 'auto', task.id)
          }
          const logEntry: AutonomousLogEntry = {
            id: nextId('log'),
            timeLabel: formatClockHour(triggerHour),
            text: task.autonomousLog,
          }
          nextLogs = [logEntry, ...nextLogs].slice(0, 6)
        } else {
          // Drop into Approval Queue (cap queue so screen stays clean)
          if (nextDrafts.length < MAX_PENDING_DRAFTS) {
            const draft: PendingDraft = {
              id: nextId('draft'),
              taskId: task.id,
              title: task.name,
              detail: task.draftLabel,
              kpiReward: reward,
              createdAt: nextSimTime,
            }
            nextDrafts = [draft, ...nextDrafts]
          }
        }
      }
    }

    // 3. Spawn contextual corporate/wellness pings when not silenced
    if (!state.uiFlags.pingsHidden && !state.humanRemoved && nextSimTime >= nextPingAtSec) {
      const eligible = PINGS.filter((p) => {
        if (state.act < p.minAct || state.act > p.maxAct) return false
        if (p.relatedTaskId && state.automatedTasks[p.relatedTaskId]) {
          return false
        }
        return true
      })

      if (eligible.length > 0) {
        const pick = eligible[Math.floor(Math.random() * eligible.length)]
        const pingItem: ActivePing = {
          id: nextId('ping'),
          sender: pick.sender,
          channel: pick.channel,
          text: pick.text,
          tone: pick.tone,
          createdAt: nextSimTime,
        }
        nextPings = [pingItem, ...nextPings].slice(0, 3)
        if (state.act <= 2) {
          playPing()
        }
      }

      // Fewer pings as more work tasks are automated
      const counts = getAutomatedCounts(state)
      const interval =
        state.act <= 2
          ? 7.5 + counts.work * 3.5
          : 13 + counts.personal * 2.5
      nextPingAtSec = nextSimTime + interval
    }

    // 4. Autosave periodically every ~4 seconds real time
    let nextLastSaved = state.lastSavedAt
    if (nowReal - state.lastSavedAt > 4000) {
      nextLastSaved = nowReal
      try {
        const snapshot = {
          ...state,
          dayProgress: nextDayProgress,
          dayNumber: nextDayNumber,
          simTimeSec: nextSimTime,
          kpis: nextKpis,
          spareHrs: nextSpareHrs,
          taskSamples: nextSamples,
          pendingDrafts: nextDrafts,
          activePings: nextPings,
          autonomousLogs: nextLogs,
          triggeredTasksThisDay: triggered,
          stats: nextStats,
          nextPingAtSec,
          lastSavedAt: nowReal,
        }
        window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(snapshot))
      } catch {
        // Ignore storage quota errors
      }
    }

    set({
      dayProgress: nextDayProgress,
      dayNumber: nextDayNumber,
      simTimeSec: nextSimTime,
      kpis: nextKpis,
      spareHrs: nextSpareHrs,
      taskSamples: nextSamples,
      manualRunning: nextManualRunning,
      pendingDrafts: nextDrafts,
      activePings: nextPings,
      autonomousLogs: nextLogs,
      lastBlockPulse: nextPulses,
      sparks: nextSparks,
      triggeredTasksThisDay: triggered,
      stats: nextStats,
      nextPingAtSec,
      lastSavedAt: nextLastSaved,
    })
  },

  startManualTask: (taskId: string) => {
    const state = get()
    const task = TASK_BY_ID[taskId]
    if (!task || state.automatedTasks[taskId]) return
    if (state.manualRunning[taskId] !== undefined) return
    playTap()
    set({
      manualRunning: {
        ...state.manualRunning,
        [taskId]: 0.01,
      },
    })
  },

  automateTask: (taskId: string) => {
    const state = get()
    const task = TASK_BY_ID[taskId]
    if (!task || state.automatedTasks[taskId]) return
    const samples = state.taskSamples[taskId] ?? 0
    if (samples < task.samplesRequired) return
    if (
      state.kpis < task.automateCostKpis ||
      state.spareHrs < task.automateCostSpareHrs
    ) {
      return
    }

    const nextRunning = { ...state.manualRunning }
    delete nextRunning[taskId]

    const nextAutomated = {
      ...state.automatedTasks,
      [taskId]: true,
    }

    // Immediately drop one starter draft so the player feels the Twin kick in right away
    let nextDrafts = state.pendingDrafts
    let nextKpis = state.kpis - task.automateCostKpis
    let nextStats = state.stats
    const reward = getTaskKpiReward(state, task, true)
    if (isAutoApproveEnabledForTask(state, task)) {
      nextKpis += reward
      nextStats = {
        ...state.stats,
        autoApprovalsFired: state.stats.autoApprovalsFired + 1,
        totalKpisEarned: state.stats.totalKpisEarned + reward,
      }
    } else if (nextDrafts.length < MAX_PENDING_DRAFTS) {
      nextDrafts = [
        {
          id: nextId('draft'),
          taskId: task.id,
          title: task.name,
          detail: task.draftLabel,
          kpiReward: reward,
          createdAt: state.simTimeSec,
        },
        ...nextDrafts,
      ]
    }

    // Clear pings belonging to this newly automated task for immediate relief
    const nextPings = state.activePings.filter((p) => {
      const config = PINGS.find((cfg) => cfg.text === p.text)
      return !config || config.relatedTaskId !== taskId
    })

    const draftState: GameState = {
      ...state,
      automatedTasks: nextAutomated,
    }
    const nextAct = computeActFromState(draftState)
    const actChanged = nextAct !== state.act

    playAutomate()

    set({
      kpis: nextKpis,
      spareHrs: Math.max(0, state.spareHrs - task.automateCostSpareHrs),
      automatedTasks: nextAutomated,
      manualRunning: nextRunning,
      pendingDrafts: nextDrafts,
      activePings: nextPings,
      lastBlockPulse: {
        ...state.lastBlockPulse,
        [taskId]: state.simTimeSec,
      },
      act: nextAct,
      stats: nextStats,
      toast: actChanged
        ? {
            id: nextId('act'),
            headline: ACTS[nextAct].toastHeadline,
            body: ACTS[nextAct].toastBody,
            kind: 'act',
          }
        : state.toast,
    })
  },

  buyUpgrade: (upgradeId: string) => {
    const state = get()
    const upgrade = UPGRADE_BY_ID[upgradeId]
    if (!upgrade || state.purchasedUpgrades[upgradeId]) return
    if (
      state.kpis < upgrade.costKpis ||
      state.spareHrs < upgrade.costSpareHrs
    ) {
      return
    }

    const nextPurchased = {
      ...state.purchasedUpgrades,
      [upgradeId]: true,
    }

    let nextDrafts = state.pendingDrafts
    let nextKpis = state.kpis - upgrade.costKpis
    let nextStats = state.stats

    // If auto_approve_work purchased, clear existing work drafts smoothly
    if (upgrade.effect === 'auto_approve_work') {
      let bonus = 0
      let count = 0
      nextDrafts = state.pendingDrafts.filter((d) => {
        const task = TASK_BY_ID[d.taskId]
        if (task && task.domain === 'work') {
          bonus += d.kpiReward
          count += 1
          return false
        }
        return true
      })
      if (count > 0) {
        nextKpis += bonus
        nextStats = {
          ...state.stats,
          autoApprovalsFired: state.stats.autoApprovalsFired + count,
          totalKpisEarned: state.stats.totalKpisEarned + bonus,
        }
      }
    }

    playApprove(state.act)

    set({
      kpis: nextKpis,
      spareHrs: Math.max(0, state.spareHrs - upgrade.costSpareHrs),
      purchasedUpgrades: nextPurchased,
      pendingDrafts: nextDrafts,
      stats: nextStats,
    })
  },

  approveDraft: (draftId: string) => {
    const state = get()
    const target = state.pendingDrafts.find((d) => d.id === draftId)
    if (!target) return
    playApprove(state.act)
    const nowReal = Date.now()
    set({
      pendingDrafts: state.pendingDrafts.filter((d) => d.id !== draftId),
      kpis: state.kpis + target.kpiReward,
      sparks: [
        ...state.sparks.slice(-7),
        {
          id: nextId('spk'),
          target: 'kpi',
          text: `+${target.kpiReward}`,
          tone: 'auto',
          createdAtReal: nowReal,
        },
      ],
      stats: {
        ...state.stats,
        draftsApproved: state.stats.draftsApproved + 1,
        totalKpisEarned: state.stats.totalKpisEarned + target.kpiReward,
      },
    })
  },

  approveAllDrafts: () => {
    const state = get()
    if (state.pendingDrafts.length === 0) return
    let total = 0
    for (const d of state.pendingDrafts) {
      total += d.kpiReward
    }
    playApprove(state.act)
    const nowReal = Date.now()
    set({
      pendingDrafts: [],
      kpis: state.kpis + total,
      sparks: [
        ...state.sparks.slice(-7),
        {
          id: nextId('spk'),
          target: 'kpi',
          text: `+${total}`,
          tone: 'auto',
          createdAtReal: nowReal,
        },
      ],
      stats: {
        ...state.stats,
        draftsApproved: state.stats.draftsApproved + state.pendingDrafts.length,
        totalKpisEarned: state.stats.totalKpisEarned + total,
      },
    })
  },

  approveProposal: (proposalId: string) => {
    const state = get()
    const proposal = PROPOSAL_BY_ID[proposalId]
    if (!proposal || state.approvedProposals[proposalId]) return

    const nextApproved = {
      ...state.approvedProposals,
      [proposalId]: true,
    }
    let nextCalendarMode = state.calendarMode
    let nextUiFlags = { ...state.uiFlags }
    let nextPings = state.activePings
    let nextDrafts = state.pendingDrafts
    let nextKpis = state.kpis
    let nextHumanRemoved = state.humanRemoved
    let nextDayProgress = state.dayProgress
    let nextStats = {
      ...state.stats,
      proposalsApproved: state.stats.proposalsApproved + 1,
    }

    switch (proposal.effect) {
      case 'enable_24h_calendar': {
        nextCalendarMode = '24h'
        // Map current 9–17 clock hour seamlessly onto the 24h bar!
        const currentHour = 9 + state.dayProgress * 8
        nextDayProgress = currentHour / 24
        break
      }
      case 'silence_pings': {
        nextUiFlags.pingsHidden = true
        nextPings = []
        break
      }
      case 'auto_approve_life': {
        let bonus = 0
        let count = 0
        nextDrafts = state.pendingDrafts.filter((d) => {
          const task = TASK_BY_ID[d.taskId]
          if (task && task.domain === 'personal') {
            bonus += d.kpiReward
            count += 1
            return false
          }
          return true
        })
        if (count > 0) {
          nextKpis += bonus
          nextStats.autoApprovalsFired += count
          nextStats.totalKpisEarned += bonus
        }
        break
      }
      case 'collapse_drawer': {
        nextUiFlags.drawerHidden = true
        break
      }
      case 'hide_metrics': {
        nextUiFlags.metricsHidden = true
        break
      }
      case 'remove_human': {
        nextHumanRemoved = true
        nextDrafts = []
        nextPings = []
        nextUiFlags = {
          pingsHidden: true,
          drawerHidden: true,
          metricsHidden: true,
        }
        break
      }
      default:
        break
    }

    const previewState: GameState = {
      ...state,
      calendarMode: nextCalendarMode,
      approvedProposals: nextApproved,
      uiFlags: nextUiFlags,
      humanRemoved: nextHumanRemoved,
    }
    const nextAct = nextHumanRemoved ? 5 : computeActFromState(previewState)
    const actChanged = nextAct !== state.act

    if (proposal.isFinal) {
      playFinalHandover()
    } else {
      playApprove(nextAct)
    }

    const nowReal = Date.now()
    const nextSparks =
      !nextUiFlags.metricsHidden && proposal.fidelityBonus > 0
        ? [
            ...state.sparks.slice(-7),
            {
              id: nextId('spk'),
              target: 'fidelity' as const,
              text: `+${proposal.fidelityBonus}%`,
              tone: 'calibrated' as const,
              createdAtReal: nowReal,
            },
          ]
        : state.sparks

    set({
      approvedProposals: nextApproved,
      calendarMode: nextCalendarMode,
      dayProgress: nextDayProgress,
      uiFlags: nextUiFlags,
      activePings: nextPings,
      pendingDrafts: nextDrafts,
      kpis: nextKpis,
      sparks: nextSparks,
      humanRemoved: nextHumanRemoved,
      act: nextAct,
      stats: nextStats,
      nextProposalAtSec: state.simTimeSec + PROPOSAL_BREATH_SEC,
      toast: actChanged && !nextHumanRemoved
        ? {
            id: nextId('act'),
            headline: ACTS[nextAct].toastHeadline,
            body: ACTS[nextAct].toastBody,
            kind: 'act',
          }
        : null,
    })
  },

  snoozeProposal: (proposalId: string) => {
    const state = get()
    const proposal = PROPOSAL_BY_ID[proposalId]
    if (!proposal) return
    playTap()
    // Final proposal stays available after a gentle pause; earlier ones snooze 12 sim sec
    const snoozeDuration = proposal.isFinal ? 5 : 12
    set({
      proposalSnoozedUntil: {
        ...state.proposalSnoozedUntil,
        [proposalId]: state.simTimeSec + snoozeDuration,
      },
      toast: {
        id: nextId('snooze'),
        headline: proposal.isFinal ? 'Continuity Standing By' : 'Cadence Noted',
        body: proposal.snoozeReply,
        kind: 'snooze',
      },
    })
  },

  dismissPing: (pingId: string) => {
    set((s) => ({
      activePings: s.activePings.filter((p) => p.id !== pingId),
    }))
  },

  dismissToast: () => set({ toast: null }),

  setWatchingSilently: (watching: boolean) => set({ watchingSilently: watching }),

  setSpeed: (speed: 1 | 5 | 20) => set({ speedMultiplier: speed, paused: false }),

  togglePaused: () => set((s) => ({ paused: !s.paused })),

  jumpToAct: (targetAct: ActId) => {
    const base = createInitialState()
    const workIds = TASKS.filter((t) => t.domain === 'work').map((t) => t.id)
    const personalIds = TASKS.filter((t) => t.domain === 'personal').map(
      (t) => t.id,
    )

    if (targetAct === 1) {
      set({ ...base })
      return
    }

    if (targetAct === 2) {
      const samples: Record<string, number> = {
        inbox: 3,
        tps: 3,
        standup: 2,
      }
      const automated: Record<string, boolean> = {
        inbox: true,
        tps: true,
      }
      set({
        ...base,
        act: 2,
        dayNumber: 4,
        kpis: 135,
        spareHrs: 2.0,
        taskSamples: samples,
        automatedTasks: automated,
        purchasedUpgrades: { fast_macros: true },
        pendingDrafts: [
          {
            id: nextId('draft'),
            taskId: 'inbox',
            title: 'Inbox Triage',
            detail: TASK_BY_ID['inbox'].draftLabel,
            kpiReward: 18,
            createdAt: 0,
          },
          {
            id: nextId('draft'),
            taskId: 'tps',
            title: 'TPS & Status Sheets',
            detail: TASK_BY_ID['tps'].draftLabel,
            kpiReward: 31,
            createdAt: 0,
          },
        ],
        stats: {
          ...base.stats,
          manualCompletions: 8,
          draftsApproved: 3,
        },
        toast: {
          id: nextId('act'),
          headline: ACTS[2].toastHeadline,
          body: ACTS[2].toastBody,
          kind: 'act',
        },
      })
      return
    }

    if (targetAct === 3) {
      const samples: Record<string, number> = {}
      const automated: Record<string, boolean> = {}
      for (const id of workIds) {
        samples[id] = TASK_BY_ID[id].samplesRequired
        automated[id] = true
      }
      samples['morning_routine'] = 2
      set({
        ...base,
        act: 3,
        calendarMode: '24h',
        dayNumber: 11,
        dayProgress: 0.42,
        kpis: 520,
        spareHrs: 6.5,
        taskSamples: samples,
        automatedTasks: automated,
        purchasedUpgrades: {
          fast_macros: true,
          batch_approve: true,
          auto_approve_work: true,
        },
        approvedProposals: {
          prop_tone_match: true,
          prop_lifesync_24h: true,
        },
        activePings: [
          {
            id: nextId('ping'),
            sender: 'Cadence LifeSync',
            channel: 'Evening Insight',
            text: '16 personal hours are now tracked. Start calibrating Morning Routine.',
            tone: 'wellness',
            createdAt: 0,
          },
        ],
        stats: {
          ...base.stats,
          manualCompletions: 16,
          draftsApproved: 14,
          proposalsApproved: 2,
        },
        toast: {
          id: nextId('act'),
          headline: ACTS[3].toastHeadline,
          body: ACTS[3].toastBody,
          kind: 'act',
        },
      })
      return
    }

    if (targetAct === 4) {
      const samples: Record<string, number> = {}
      const automated: Record<string, boolean> = {}
      for (const id of [...workIds, 'morning_routine', 'cook_dinner', 'hobbies']) {
        samples[id] = TASK_BY_ID[id].samplesRequired
        automated[id] = true
      }
      samples['call_mom'] = 2
      set({
        ...base,
        act: 4,
        calendarMode: '24h',
        dayNumber: 23,
        dayProgress: 0.72,
        kpis: 2100,
        spareHrs: 18,
        taskSamples: samples,
        automatedTasks: automated,
        purchasedUpgrades: {
          fast_macros: true,
          batch_approve: true,
          auto_approve_work: true,
          work_kpi_boost: true,
          spare_time_boost: true,
        },
        approvedProposals: {
          prop_tone_match: true,
          prop_lifesync_24h: true,
          prop_wellness_kpis: true,
          prop_social_proxy: true,
        },
        activePings: [],
        stats: {
          ...base.stats,
          manualCompletions: 28,
          draftsApproved: 26,
          proposalsApproved: 4,
        },
        toast: {
          id: nextId('act'),
          headline: ACTS[4].toastHeadline,
          body: ACTS[4].toastBody,
          kind: 'act',
        },
      })
      return
    }

    // Act 5: Frictionless — ready for final "Remove Human From Loop"
    const samples: Record<string, number> = {}
    const automated: Record<string, boolean> = {}
    for (const id of [...workIds, ...personalIds]) {
      samples[id] = TASK_BY_ID[id].samplesRequired
      automated[id] = true
    }
    set({
      ...base,
      act: 5,
      calendarMode: '24h',
      dayNumber: 38,
      dayProgress: 0.54,
      kpis: 8420,
      spareHrs: 42,
      taskSamples: samples,
      automatedTasks: automated,
      purchasedUpgrades: {
        fast_macros: true,
        batch_approve: true,
        auto_approve_work: true,
        work_kpi_boost: true,
        spare_time_boost: true,
        manual_speed_2: true,
        life_kpi_boost: true,
      },
      approvedProposals: {
        prop_tone_match: true,
        prop_lifesync_24h: true,
        prop_wellness_kpis: true,
        prop_social_proxy: true,
        prop_silence_pings: true,
        prop_auto_approve_life: true,
        prop_collapse_drawer: true,
        prop_hide_metrics: true,
      },
      activePings: [],
      pendingDrafts: [],
      autonomousLogs: [
        {
          id: nextId('log'),
          timeLabel: '09:15',
          text: 'Cleared 53 messages in your tone (99.8% match)',
        },
        {
          id: nextId('log'),
          timeLabel: '13:02',
          text: 'Delivered "No blockers" update; praised for clarity',
        },
      ],
      uiFlags: {
        pingsHidden: true,
        drawerHidden: true,
        metricsHidden: true,
      },
      stats: {
        manualCompletions: 34,
        draftsApproved: 39,
        proposalsApproved: 8,
        autoApprovalsFired: 64,
        totalKpisEarned: 18420,
        totalSpareHrsEarned: 112,
      },
      toast: null,
    })
  },

  devGrantResources: (kpis: number, spareHrs: number) =>
    set((s) => ({
      kpis: s.kpis + kpis,
      spareHrs: s.spareHrs + spareHrs,
    })),

  devFillSamples: () =>
    set((s) => {
      const next = { ...s.taskSamples }
      for (const task of getVisibleTasks(s)) {
        next[task.id] = task.samplesRequired
      }
      return { taskSamples: next }
    }),

  exportSave: () => {
    const state = get()
    const serializable = {
      act: state.act,
      calendarMode: state.calendarMode,
      dayNumber: state.dayNumber,
      dayProgress: state.dayProgress,
      simTimeSec: state.simTimeSec,
      kpis: state.kpis,
      spareHrs: state.spareHrs,
      taskSamples: state.taskSamples,
      automatedTasks: state.automatedTasks,
      purchasedUpgrades: state.purchasedUpgrades,
      approvedProposals: state.approvedProposals,
      proposalSnoozedUntil: state.proposalSnoozedUntil,
      pendingDrafts: state.pendingDrafts,
      autonomousLogs: state.autonomousLogs,
      uiFlags: state.uiFlags,
      humanRemoved: state.humanRemoved,
      stats: state.stats,
    }
    return JSON.stringify(serializable)
  },

  importSave: (json: string) => {
    try {
      const parsed = JSON.parse(json) as Partial<GameState>
      const base = createInitialState()
      const merged: GameState = {
        ...base,
        ...parsed,
        uiFlags: { ...base.uiFlags, ...(parsed.uiFlags ?? {}) },
        stats: { ...base.stats, ...(parsed.stats ?? {}) },
        manualRunning: {},
        toast: null,
      }
      set(merged)
      window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(merged))
      return true
    } catch {
      return false
    }
  },

  hardReset: () => {
    const fresh = createInitialState()
    try {
      window.localStorage.removeItem(SAVE_STORAGE_KEY)
    } catch {
      // ignore
    }
    set(fresh)
  },
}))
