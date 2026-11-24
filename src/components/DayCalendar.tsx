import { useGameStore } from '../engine/gameStore'
import {
  formatClockHour,
  getCurrentClockHour,
  getFreeHoursPerDay,
  getTotalCalendarHours,
  getVisibleTasks,
} from '../engine/selectors'
import { TaskIcon } from './Icons'

interface CalendarSegment {
  key: string
  taskId: string
  name: string
  shortLabel: string
  domain: 'work' | 'personal'
  leftPct: number
  widthPct: number
  isAutomated: boolean
  isPulsing: boolean
  isActiveNow: boolean
  showContent: boolean
}

function isHourInsideRange(hour: number, start: number, duration: number): boolean {
  const end = start + duration
  if (end <= 24) {
    return hour >= start && hour < end
  }
  return hour >= start || hour < end - 24
}

export function DayCalendar() {
  const state = useGameStore()
  const visibleTasks = getVisibleTasks(state)
  const is24h = state.calendarMode === '24h'
  const startBoundary = is24h ? 0 : 9
  const spanHours = is24h ? 24 : 8

  const clockHour = getCurrentClockHour(state)
  const playheadPct = Math.min(99.5, Math.max(0.5, state.dayProgress * 100))
  const freeHrs = getFreeHoursPerDay(state)
  const totalHrs = getTotalCalendarHours(state)
  const freePct = Math.round((freeHrs / totalHrs) * 100)

  const currentTask = visibleTasks.find((t) =>
    isHourInsideRange(clockHour, t.startHour, t.durationHours),
  )

  const segments: CalendarSegment[] = []
  for (const task of visibleTasks) {
    const isAutomated = Boolean(state.automatedTasks[task.id])
    const lastPulse = state.lastBlockPulse[task.id] ?? -999
    const isPulsing = state.simTimeSec - lastPulse < 0.9
    const isActiveNow = currentTask?.id === task.id
    const endHour = task.startHour + task.durationHours

    if (endHour > 24 && is24h) {
      const morningSpan = endHour - 24
      const nightSpan = 24 - task.startHour
      segments.push({
        key: `${task.id}_am`,
        taskId: task.id,
        name: task.name,
        shortLabel: task.shortLabel,
        domain: task.domain,
        leftPct: 0,
        widthPct: (morningSpan / spanHours) * 100,
        isAutomated,
        isPulsing,
        isActiveNow,
        showContent: true,
      })
      segments.push({
        key: `${task.id}_pm`,
        taskId: task.id,
        name: task.name,
        shortLabel: task.shortLabel,
        domain: task.domain,
        leftPct: (task.startHour / spanHours) * 100,
        widthPct: (nightSpan / spanHours) * 100,
        isAutomated,
        isPulsing,
        isActiveNow,
        showContent: false,
      })
    } else {
      segments.push({
        key: task.id,
        taskId: task.id,
        name: task.name,
        shortLabel: task.shortLabel,
        domain: task.domain,
        leftPct: ((task.startHour - startBoundary) / spanHours) * 100,
        widthPct: (task.durationHours / spanHours) * 100,
        isAutomated,
        isPulsing,
        isActiveNow,
        showContent: true,
      })
    }
  }

  const axisTicks = is24h
    ? ['00:00', '06:00', '12:00', '18:00', '24:00']
    : ['09:00', '11:00', '13:00', '15:00', '17:00']

  const calendarSparks = state.sparks.filter((s) => s.target === 'calendar')

  return (
    <section
      className={`calendar-panel ${is24h ? 'mode-24h' : 'mode-work'}`}
      id="day-calendar"
      aria-label="Daily Schedule Calendar"
    >
      <div className="calendar-header">
        <div className="calendar-title-group">
          <span className="calendar-day-label">Day {state.dayNumber}</span>
          <span className="calendar-clock">{formatClockHour(clockHour)}</span>
          {currentTask && (
            <span className="calendar-now-label">
              · {currentTask.shortLabel}
            </span>
          )}
        </div>
        <span className="calendar-scope-pill">
          {state.act === 5
            ? '24h Continuity'
            : is24h
              ? `${freeHrs}/${totalHrs}h Free`
              : `9–5 · ${freeHrs}/${totalHrs}h`}
        </span>
      </div>

      {/* Time-of-day sky ribbon appears once zoomed out to 24h! */}
      {is24h && <div className="sky-ribbon" aria-hidden="true" />}

      <div className="calendar-track-wrap">
        <div className="calendar-track">
          {segments.map((seg) => {
            const blockSparks = seg.showContent
              ? calendarSparks.filter((sp) => sp.taskId === seg.taskId)
              : []
            return (
              <div
                key={seg.key}
                className={`calendar-block ${seg.domain} ${
                  seg.isAutomated ? 'automated' : 'manual'
                } ${seg.isPulsing ? 'pulsing' : ''} ${
                  seg.isActiveNow ? 'active-now' : ''
                }`}
                style={{
                  left: `${seg.leftPct}%`,
                  width: `${seg.widthPct}%`,
                }}
                title={`${seg.name} (${seg.isAutomated ? 'Twin-run' : 'Manual'})`}
              >
                {seg.showContent && (
                  <div className="calendar-block-inner">
                    <TaskIcon
                      taskId={seg.taskId}
                      size={is24h ? 13 : 14}
                      className="calendar-block-icon"
                    />
                    {!is24h && (
                      <div className="calendar-block-text">
                        <span className="calendar-block-name">
                          {seg.shortLabel}
                        </span>
                        <span className="calendar-block-meta">
                          {seg.isAutomated ? 'Twin' : 'Manual'}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {blockSparks.map((sp) => (
                  <span key={sp.id} className="calendar-spark">
                    {sp.text}
                  </span>
                ))}
              </div>
            )
          })}

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
          <div className="free-bar-wrap" aria-hidden="true">
            <div
              className="free-bar-fill"
              style={{ width: `${freePct}%` }}
            />
          </div>
          <span className="calendar-pct-label">{freePct}% automated</span>
        </div>
      )}
    </section>
  )
}
