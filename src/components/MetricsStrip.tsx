import { ACTS } from '../content/acts'
import { useGameStore } from '../engine/gameStore'
import {
  formatNumber,
  getFreeHoursPerDay,
  getKpisPerDay,
  getSpareTimePerDay,
  getTotalCalendarHours,
  getTwinFidelity,
} from '../engine/selectors'

export function MetricsStrip() {
  const state = useGameStore()

  if (state.uiFlags.metricsHidden) {
    return null
  }

  const actConfig = ACTS[state.act]
  const freeHrs = getFreeHoursPerDay(state)
  const totalHrs = getTotalCalendarHours(state)
  const kpisPerDay = getKpisPerDay(state)
  const sparePerDay = getSpareTimePerDay(state)
  const fidelity = getTwinFidelity(state)

  return (
    <section
      className="metrics-strip"
      id="metrics-strip"
      aria-label="Key Metrics"
    >
      <div className="metric-card">
        <span className="metric-label">{actConfig.kpiLabel}</span>
        <span className="metric-value">{formatNumber(state.kpis)}</span>
        <span className={`metric-sub ${kpisPerDay > 0 ? 'positive' : ''}`}>
          {kpisPerDay > 0 ? `+${formatNumber(kpisPerDay)}/day` : 'manual only'}
        </span>
      </div>

      <div className="metric-card">
        <span className="metric-label">Spare Time</span>
        <span className="metric-value">{state.spareHrs.toFixed(1)}h</span>
        <span className={`metric-sub ${freeHrs > 0 ? 'positive' : ''}`}>
          {freeHrs}h/{totalHrs}h free
          {sparePerDay > freeHrs ? ` (+${sparePerDay.toFixed(1)}/d)` : ''}
        </span>
      </div>

      <div className="metric-card">
        <span className="metric-label">Twin Fidelity</span>
        <span className="metric-value">{fidelity.toFixed(1)}%</span>
        <span className="metric-sub">{actConfig.permissionTier}</span>
      </div>
    </section>
  )
}
