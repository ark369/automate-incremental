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

  const kpiSparks = state.sparks.filter((s) => s.target === 'kpi')
  const fidelitySparks = state.sparks.filter((s) => s.target === 'fidelity')

  return (
    <section
      className="ledger-bar"
      id="metrics-strip"
      aria-label="Key Metrics"
    >
      <div className="ledger-grid">
        <div className="ledger-cell">
          <span className="ledger-label">{actConfig.kpiLabel}</span>
          <span className="ledger-value">{formatNumber(state.kpis)}</span>
          <span className={`ledger-sub ${kpisPerDay > 0 ? 'positive' : ''}`}>
            {kpisPerDay > 0 ? `+${formatNumber(kpisPerDay)}/day` : 'manual'}
          </span>
          {kpiSparks.map((sp) => (
            <span key={sp.id} className={`spark-float tone-${sp.tone}`}>
              {sp.text}
            </span>
          ))}
        </div>

        <div className="ledger-cell">
          <span className="ledger-label">Spare Time</span>
          <span className="ledger-value">{state.spareHrs.toFixed(1)}h</span>
          <span className={`ledger-sub ${freeHrs > 0 ? 'positive' : ''}`}>
            {freeHrs}/{totalHrs}h free
            {sparePerDay > freeHrs ? ` · +${sparePerDay.toFixed(1)}/d` : ''}
          </span>
        </div>

        <div className="ledger-cell">
          <span className="ledger-label">Twin Fidelity</span>
          <span className="ledger-value">{fidelity.toFixed(1)}%</span>
          <span className="ledger-sub">{actConfig.permissionTier}</span>
          {fidelitySparks.map((sp) => (
            <span key={sp.id} className={`spark-float tone-${sp.tone}`}>
              {sp.text}
            </span>
          ))}
        </div>
      </div>

      {/* Subtle continuous Fidelity progress hairline along ledger bottom */}
      <div className="ledger-fidelity-rail" aria-hidden="true">
        <div
          className="ledger-fidelity-fill"
          style={{ width: `${Math.min(100, fidelity)}%` }}
        />
      </div>
    </section>
  )
}
