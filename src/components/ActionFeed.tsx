import { ACTS } from '../content/acts'
import { useGameStore } from '../engine/gameStore'
import {
  formatNumber,
  getActiveProposal,
  getTaskKpiReward,
  getTwinFidelity,
  getVisibleTasks,
} from '../engine/selectors'
import { BoltIcon, CheckIcon, TaskIcon, TwinEmblem } from './Icons'

const WORK_TICKET_CODES: Record<string, string> = {
  inbox: 'VTX-101',
  tps: 'VTX-102',
  standup: 'VTX-103',
  decks: 'VTX-104',
}

function getInitials(sender: string): string {
  const parts = sender
    .replace(/\(.*?\)/g, '')
    .trim()
    .split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return sender.slice(0, 2).toUpperCase()
}

export function ActionFeed() {
  const state = useGameStore()
  const activeProposal = getActiveProposal(state, state.simTimeSec)
  const visibleTasks = getVisibleTasks(state)
  const manualTasks = visibleTasks.filter((t) => !state.automatedTasks[t.id])
  const kpiUnit = ACTS[state.act].kpiLabel
  const hasBatchApprove = Boolean(state.purchasedUpgrades['batch_approve'])
  const fidelity = getTwinFidelity(state)

  // In Act 5 or once human is removed, EndingStage owns the center canvas
  if (state.act === 5 || state.humanRemoved) {
    return null
  }

  return (
    <main className="feed-column" id="action-feed">
      {/* Act / Snooze Notice Strip */}
      {state.toast && (
        <div
          className={`act-toast ${state.toast.kind}`}
          role="status"
          aria-live="polite"
        >
          <div>
            <p className="act-toast-headline">{state.toast.headline}</p>
            <p className="act-toast-body">{state.toast.body}</p>
          </div>
          <button
            type="button"
            className="toast-close"
            onClick={state.dismissToast}
            aria-label="Dismiss notice"
          >
            ×
          </button>
        </div>
      )}

      {/* Slack-style Corporate / Wellness Pings (disappears once silenced in Act 4) */}
      {!state.uiFlags.pingsHidden && state.activePings.length > 0 && (
        <section className="pings-stack" aria-label="Incoming Pings">
          {state.activePings.map((ping) => (
            <div key={ping.id} className={`ping-chip ${ping.tone}`}>
              <span className={`ping-avatar ${ping.tone}`} aria-hidden="true">
                {getInitials(ping.sender)}
              </span>
              <div className="ping-body">
                <div className="ping-meta">
                  <span className="ping-sender">{ping.sender}</span>
                  <span className="ping-channel">{ping.channel}</span>
                </div>
                <div className="ping-text">{ping.text}</div>
              </div>
              <button
                type="button"
                className="toast-close"
                onClick={() => state.dismissPing(ping.id)}
                aria-label="Dismiss ping"
              >
                ×
              </button>
            </div>
          ))}
        </section>
      )}

      {/* THE APPROVAL TRAP: Elevated Cadence Permission Sheet */}
      {activeProposal && (
        <section
          className="proposal-sheet"
          id={`proposal-${activeProposal.id}`}
          aria-label="Cadence Proposal"
        >
          <div className="proposal-head">
            <TwinEmblem fidelity={fidelity} act={state.act} size={28} />
            <div className="proposal-head-text">
              <span className="proposal-eyebrow">{activeProposal.eyebrow}</span>
              <h2 className="proposal-title">{activeProposal.title}</h2>
            </div>
          </div>

          <p className="proposal-desc">{activeProposal.description}</p>
          <div className="proposal-scope">{activeProposal.permissionScope}</div>

          <div className="proposal-actions">
            <button
              type="button"
              id={`btn-approve-${activeProposal.id}`}
              className="btn-approve"
              style={{ flex: 1 }}
              onClick={() => state.approveProposal(activeProposal.id)}
            >
              <CheckIcon size={14} />
              <span>{activeProposal.approveLabel}</span>
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => state.snoozeProposal(activeProposal.id)}
            >
              {activeProposal.snoozeLabel}
            </button>
          </div>
        </section>
      )}

      {/* Twin Draft Approval Queue (Distinct emerald clearance strips) */}
      {state.pendingDrafts.length > 0 && (
        <section aria-label="Twin Draft Approvals">
          <div className="section-header">
            <h2 className="section-title">
              Ready for Approval ({state.pendingDrafts.length})
            </h2>
            {hasBatchApprove && state.pendingDrafts.length > 1 && (
              <button
                type="button"
                id="btn-approve-all-drafts"
                className="btn-approve compact"
                onClick={state.approveAllDrafts}
              >
                <CheckIcon size={12} />
                <span>Approve All ({state.pendingDrafts.length})</span>
              </button>
            )}
          </div>
          <div className="feed-column">
            {state.pendingDrafts.map((draft) => (
              <div key={draft.id} className="draft-strip">
                <div className="draft-icon-wrap">
                  <TaskIcon taskId={draft.taskId} size={15} />
                </div>
                <div className="draft-info">
                  <span className="draft-title">{draft.title}</span>
                  <span className="draft-detail">{draft.detail}</span>
                </div>
                <button
                  type="button"
                  className="btn-approve draft-btn"
                  onClick={() => state.approveDraft(draft.id)}
                >
                  <CheckIcon size={13} />
                  <span>Approve</span>
                  <span className="btn-reward-pill">
                    +{formatNumber(draft.kpiReward)}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* DEMONSTRATE-TO-AUTOMATE: Recessed Work Tickets / Personal Routines */}
      {manualTasks.length > 0 && (
        <section aria-label="Manual Schedule Blocks">
          <div className="section-header">
            <h2 className="section-title">
              {state.calendarMode === '24h'
                ? 'Unoptimized Blocks · Calibrate Twin'
                : 'Manual Queue · Demonstrate to Calibrate'}
            </h2>
          </div>

          <div className="feed-column">
            {manualTasks.map((task) => {
              const samples = state.taskSamples[task.id] ?? 0
              const isCalibrated = samples >= task.samplesRequired
              const runningProg = state.manualRunning[task.id]
              const isRunning = runningProg !== undefined
              const manualPayout = getTaskKpiReward(state, task, false)
              const canAfford =
                isCalibrated &&
                state.kpis >= task.automateCostKpis &&
                state.spareHrs >= task.automateCostSpareHrs
              const ticketCode = WORK_TICKET_CODES[task.id]
              const taskSparks = state.sparks.filter(
                (sp) => sp.target === 'task' && sp.taskId === task.id,
              )

              return (
                <article
                  key={task.id}
                  id={`task-${task.id}`}
                  className={`task-ticket ${task.domain} ${
                    isCalibrated ? 'ready-to-automate' : ''
                  }`}
                >
                  {taskSparks.map((sp) => (
                    <span
                      key={sp.id}
                      className={`spark-float task-spark tone-${sp.tone}`}
                    >
                      {sp.text}
                    </span>
                  ))}

                  <div className="task-top">
                    <div className={`task-icon-badge ${task.domain}`}>
                      <TaskIcon taskId={task.id} size={15} />
                    </div>
                    <div className="task-head-body">
                      <div className="task-title-row">
                        <span className="task-name">{task.name}</span>
                        {ticketCode && state.act <= 2 && (
                          <span className="ticket-code">{ticketCode}</span>
                        )}
                        <span className="task-hours">{task.durationHours}h</span>
                        {task.unoptimizedScore && (
                          <span className="task-score-chip">
                            {task.unoptimizedScore}
                          </span>
                        )}
                      </div>
                      <p className="task-sub">
                        {samples > 0 && !isCalibrated
                          ? task.calibrationNote
                          : task.manualSubtitle}
                      </p>
                    </div>
                  </div>

                  {/* Segmented Twin Calibration Bar */}
                  <div className="calibration-row">
                    <div
                      className="calibration-segments"
                      aria-label={`${samples} of ${task.samplesRequired} calibration samples`}
                    >
                      {Array.from({ length: task.samplesRequired }).map(
                        (_, i) => (
                          <span
                            key={i}
                            className={`cal-seg ${
                              i < samples ? 'filled' : ''
                            } ${isCalibrated ? 'locked' : ''}`}
                          />
                        ),
                      )}
                    </div>
                    <span
                      className={`cal-label ${isCalibrated ? 'locked' : ''}`}
                    >
                      {isCalibrated
                        ? `Calibrated (+${task.fidelityContribution}%)`
                        : `${samples}/${task.samplesRequired} samples`}
                    </span>
                  </div>

                  <div className="task-actions">
                    <button
                      type="button"
                      id={`btn-do-${task.id}`}
                      className="btn-do-task"
                      disabled={isRunning}
                      onClick={() => state.startManualTask(task.id)}
                    >
                      {isRunning && (
                        <span
                          className="btn-do-fill"
                          style={{
                            width: `${Math.min(100, runningProg * 100)}%`,
                          }}
                        />
                      )}
                      <span className="btn-do-content">
                        <span>
                          {isRunning
                            ? 'Recording sample…'
                            : task.domain === 'work'
                              ? 'Do Manually'
                              : 'Do Yourself'}
                        </span>
                        <span className="btn-do-payout">
                          +{formatNumber(manualPayout)} {kpiUnit}
                        </span>
                      </span>
                    </button>

                    {isCalibrated && (
                      <button
                        type="button"
                        id={`btn-automate-${task.id}`}
                        className="btn-automate"
                        disabled={!canAfford}
                        onClick={() => state.automateTask(task.id)}
                      >
                        <span className="btn-automate-top">
                          <BoltIcon size={12} />
                          <span>Automate</span>
                        </span>
                        <span className="btn-cost-line">
                          {formatNumber(task.automateCostKpis)} {kpiUnit}
                          {task.automateCostSpareHrs > 0
                            ? ` · ${task.automateCostSpareHrs}h`
                            : ''}
                        </span>
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {/* When all blocks are automated in Act 2 or Act 4, show quiet live continuity log */}
      {manualTasks.length === 0 &&
        state.pendingDrafts.length === 0 &&
        !activeProposal && (
          <section className="autonomous-log-card" aria-label="Continuity Log">
            <div className="section-header">
              <h2 className="section-title">Autonomous Continuity</h2>
            </div>
            {state.autonomousLogs.length > 0 ? (
              state.autonomousLogs.slice(0, 4).map((entry) => (
                <div key={entry.id} className="log-line">
                  <span className="log-time">{entry.timeLabel}</span>
                  <span>{entry.text}</span>
                </div>
              ))
            ) : (
              <p className="task-sub">
                All scheduled hours are handled by your Digital Twin. Waiting on
                next sweep…
              </p>
            )}
          </section>
        )}
    </main>
  )
}
