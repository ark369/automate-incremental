import { ACTS } from '../content/acts'
import { PROPOSALS } from '../content/proposals'
import { TASKS } from '../content/tasks'
import { UPGRADES } from '../content/upgrades'
import type {
  ActId,
  ProposalConfig,
  TaskConfig,
  UpgradeConfig,
} from '../content/types'
import type { GameState } from './gameStore'

export function getVisibleTasks(state: GameState): TaskConfig[] {
  if (state.calendarMode === '9-5') {
    return TASKS.filter((t) => t.domain === 'work')
  }
  return TASKS
}

export function getTotalCalendarHours(state: GameState): number {
  return state.calendarMode === '9-5' ? 8 : 24
}

export function getAutomatedCounts(state: GameState): {
  work: number
  personal: number
  total: number
} {
  let work = 0
  let personal = 0
  for (const task of TASKS) {
    if (state.automatedTasks[task.id]) {
      if (task.domain === 'work') work += 1
      else personal += 1
    }
  }
  return { work, personal, total: work + personal }
}

export function getFreeHoursPerDay(state: GameState): number {
  const visible = getVisibleTasks(state)
  let free = 0
  for (const task of visible) {
    if (state.automatedTasks[task.id]) {
      free += task.durationHours
    }
  }
  return free
}

export function getSpareTimePerDay(state: GameState): number {
  const baseFree = getFreeHoursPerDay(state)
  let mult = 1
  if (state.purchasedUpgrades['spare_time_boost']) mult *= 1.5
  if (state.approvedProposals['prop_social_proxy']) mult *= 1.25
  return baseFree * mult
}

export function getTwinFidelity(state: GameState): number {
  let fidelity = 0
  for (const task of TASKS) {
    if (state.automatedTasks[task.id]) {
      fidelity += task.fidelityContribution
    } else {
      // Partial calibration gives subtle visible fidelity progress (up to 35% of task weight)
      const samples = state.taskSamples[task.id] ?? 0
      const ratio = Math.min(1, samples / task.samplesRequired)
      fidelity += ratio * task.fidelityContribution * 0.25
    }
  }
  for (const proposal of PROPOSALS) {
    if (state.approvedProposals[proposal.id]) {
      fidelity += proposal.fidelityBonus
    }
  }
  return Math.min(100, Math.round(fidelity * 10) / 10)
}

export function getManualDurationSec(
  state: GameState,
  task: TaskConfig,
): number {
  let duration = task.manualDurationSec
  if (state.purchasedUpgrades['fast_macros']) {
    duration *= 0.65
  }
  if (
    task.domain === 'personal' &&
    state.purchasedUpgrades['manual_speed_2']
  ) {
    duration *= 0.6
  }
  return Math.max(0.32, duration)
}

export function getTaskKpiReward(
  state: GameState,
  task: TaskConfig,
  isAutomated: boolean,
): number {
  let reward = task.baseKpiReward
  if (isAutomated) {
    reward *= task.autoKpiMultiplier
    if (state.purchasedUpgrades['batch_approve']) reward *= 1.25
    if (state.approvedProposals['prop_tone_match'] && task.domain === 'work') {
      reward *= 1.15
    }
    if (
      state.purchasedUpgrades['work_kpi_boost'] &&
      task.domain === 'work'
    ) {
      reward *= 1.5
    }
    if (
      state.approvedProposals['prop_wellness_kpis'] &&
      task.domain === 'personal'
    ) {
      reward *= 1.35
    }
    if (
      state.purchasedUpgrades['life_kpi_boost'] &&
      task.domain === 'personal'
    ) {
      reward *= 1.6
    }
  }
  return Math.round(reward)
}

export function getKpisPerDay(state: GameState): number {
  let total = 0
  for (const task of getVisibleTasks(state)) {
    if (state.automatedTasks[task.id]) {
      total += getTaskKpiReward(state, task, true)
    }
  }
  return total
}

export function getClutterLevel(state: GameState): number {
  if (state.uiFlags.pingsHidden || state.act >= 5) return 0
  const counts = getAutomatedCounts(state)
  if (state.calendarMode === '9-5') {
    // High clutter when work is manual; drops dramatically with each automated work block
    return Math.max(0, 1 - counts.work / 4)
  }
  // Act 3–4 has gentle wellness nudges rather than high corporate noise
  return Math.max(0, (5 - counts.personal) / 10)
}

export function getSerenityLevel(state: GameState): number {
  if (state.humanRemoved) return 1
  const base = ACTS[state.act].baseSerenity
  let bonus = 0
  if (state.uiFlags.pingsHidden) bonus += 0.05
  if (state.uiFlags.drawerHidden) bonus += 0.06
  if (state.uiFlags.metricsHidden) bonus += 0.08
  return Math.min(1, base + bonus)
}

export function getCurrentClockHour(state: GameState): number {
  if (state.calendarMode === '9-5') {
    return 9 + state.dayProgress * 8
  }
  return state.dayProgress * 24
}

export function formatClockHour(hourFloat: number): string {
  const wrapped = ((hourFloat % 24) + 24) % 24
  const h = Math.floor(wrapped)
  const m = Math.floor((wrapped - h) * 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function getAvailableUpgrades(state: GameState): UpgradeConfig[] {
  const counts = getAutomatedCounts(state)
  return UPGRADES.filter((u) => {
    if (state.purchasedUpgrades[u.id]) return false
    if (state.act < u.minAct) return false
    if (u.minAutomatedCount && counts.total < u.minAutomatedCount) return false
    if (u.requiresUpgradeId && !state.purchasedUpgrades[u.requiresUpgradeId]) {
      return false
    }
    return true
  })
}

export function getActiveProposal(
  state: GameState,
  nowSimSec: number,
): ProposalConfig | null {
  if (state.humanRemoved) return null
  if (nowSimSec < state.nextProposalAtSec) return null
  const counts = getAutomatedCounts(state)
  for (const proposal of PROPOSALS) {
    if (state.approvedProposals[proposal.id]) continue
    const snoozeUntil = state.proposalSnoozedUntil[proposal.id] ?? 0
    if (nowSimSec < snoozeUntil) continue

    const tr = proposal.trigger
    if (tr.minAct && state.act < tr.minAct) continue
    if (tr.minAutomatedWork && counts.work < tr.minAutomatedWork) continue
    if (tr.minAutomatedPersonal && counts.personal < tr.minAutomatedPersonal) {
      continue
    }
    if (tr.minAutomatedTotal && counts.total < tr.minAutomatedTotal) continue
    if (
      tr.requiresProposalId &&
      !state.approvedProposals[tr.requiresProposalId]
    ) {
      continue
    }
    if (
      tr.minDraftsApproved &&
      state.stats.draftsApproved + state.stats.autoApprovalsFired <
        tr.minDraftsApproved
    ) {
      continue
    }
    return proposal
  }
  return null
}

export function computeActFromState(state: GameState): ActId {
  if (state.uiFlags.metricsHidden) return 5
  const counts = getAutomatedCounts(state)
  if (state.calendarMode === '24h') {
    if (counts.personal >= 3 || counts.total >= 7) return 4
    return 3
  }
  if (counts.work >= 2) return 2
  return 1
}

export function formatNumber(n: number): string {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`
  return Math.floor(n).toLocaleString()
}
