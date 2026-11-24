import { useGameStore } from '../engine/gameStore'
import {
  formatClockHour,
  getCurrentClockHour,
  getFreeHoursPerDay,
  getTotalCalendarHours,
  getVisibleTasks,
} from '../engine/selectors'

interface CalendarSegment {
  key: string
  taskId: string
  shortLabel: string
  domain: 'work' | 'personal'
  leftPct: number
  widthPct: number
  isAutomated: boolean
  isPulsing: boolean
  showLabel: boolean
}

export function DayCalendar() {
  const state = useGameStore()
  const visibleTasks = getVisibleTasks(state)
  const is24h = state.calendarMode === '24h'
  const startBoundary = is24h ? 0 : 9
  const spanHours = is24h ? 24 : 8

  const clockHour = getCurrentClockHour(state)
  const playheadPct = Math.min(99.6, Math.max(0.4, state.dayProgress * 100))
  const freeHrs = getFreeHoursPerDay(state)
  const totalHrs = getTotalCalendarHours(state)
  const freePct = Math.round((freeHrs / totalHrs) * 100)

  const segments: CalendarSegment[] = []
  for (const task of visibleTasks) {
    const isAutomated = Boolean(state.automatedTasks[task.id])
    const lastPulse = state.lastBlockPulse[task.id] ?? -999
    const isPulsing = state.simTimeSec - lastPulse < 0.9
    const endHour = task.startHour + task.durationHours

    if (endHour > 24 && is24h) {
      // Split wrap-around overnight block into 00:00..end-24 and start..24
      const morningSpan = endHour - 24
      const nightSpan = 24 - task.startHour
      segments.push({
        key: `${task.id}_am`,
        taskId: task.id,
        shortLabel: task.shortLabel,
        domain: task.domain,
        leftPct: 0,
        widthPct: (morningSpan / spanHours) * 100,
        isAutomated,
        isPulsing,
        showLabel: true,
      })
      segments.push({
        key: `${task.id}_pm`,
        taskId: task.id,
        shortLabel: task.shortLabel,
        domain: task.domain,
        leftPct: (task.startHour / spanHours) * 100,
        widthPct: (nightSpan / spanHours) * 100,
        isAutomated,
        isPulsing,
        showLabel: false,
      })
    } else {
      segments.push({
        key: task.id,
        taskId: task.id,
        shortLabel: task.shortLabel,
        domain: task.domain,
        leftPct: ((task.startHour - startBoundary) / spanHours) * 100,
        widthPct: (task.durationHours / spanHours) * 100,
        isAutomated,
        isPulsing,
        showLabel: true,
      })
    }
  }

  const axisTicks = is24h
    ? ['00:00', '06:00', '12:00', '18:00', '24:00']
    : ['09:00', '11:00', '13:00', '15:00', '17:00']

  return (
    <section
      className="calendar-panel"
      id="day-calendar"
      aria-label="Daily Schedule Calendar"
    >
      <div className="calendar-header">
        <div className="calendar-title-group">
          <span className="calendar-day-label">Day {state.dayNumber}</span>
          <span className="calendar-clock">{formatClockHour(clockHour)}</span>
        </div>
        <span className="calendar-scope-pill">
          {is24h ? '24h Holistic' : '9–5 Workday'}
        </span>
      </div>

      <div className="calendar-track-wrap">
        <div className="calendar-track">
          {segments.map((seg) => (
            <div
              key={seg.key}
              className={`calendar-block ${seg.domain} ${
                seg.isAutomated ? 'automated' : 'manual'
              } ${seg.isPulsing ? 'pulsing' : ''}`}
              style={{
                left: `${seg.leftPct}%`,
                width: `${seg.widthPct}%`,
              }}
              title={`${seg.shortLabel} (${seg.isAutomated ? 'Twin-run' : 'Manual'})`}
            >
              {seg.showLabel && (
                <>
                  <span className="calendar-block-name">{seg.shortLabel}</span>
                  {!is24h && (
                    <span className="calendar-block-meta">
                      {seg.isAutomated ? 'Twin' : 'Manual'}
                    </span>
                  )}
                </>
              )}
            </div>
          ))}

          <div
            className="calendar-playhead"
            style={{ left: `${playheadPct}%` }}
            aria-hidden="true"
          />
        </div>

        <div className="calendar-axis">
          {axisTicks.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
      </div>

      {!state.uiFlags.metricsHidden && (
        <div className="calendar-legend">
          <span>
            Reclaimed: <strong>{freeHrs}h</strong> / {totalHrs}h
          </span>
          <div className="free-bar-wrap" aria-hidden="true">
            <div
              className="free-bar-fill"
              style={{ width: `${freePct}%` }}
            />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}>
            {freePct}%
          </span>
        </div>
      )}
    </section>
  )
}
