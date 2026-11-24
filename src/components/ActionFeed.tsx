import { ACTS } from '../content/acts'
import { useGameStore } from '../engine/gameStore'
import {
  formatNumber,
  getActiveProposal,
  getTaskKpiReward,
  getVisibleTasks,
} from '../engine/selectors'

export function ActionFeed() {
  const state = useGameStore()
  const activeProposal = getActiveProposal(state, state.simTimeSec)
  const visibleTasks = getVisibleTasks(state)
  const manualTasks = visibleTasks.filter((t) => !state.automatedTasks[t.id])
  const kpiUnit = ACTS[state.act].kpiLabel
  const hasBatchApprove = Boolean(state.purchasedUpgrades['batch_approve'])

  // In Act 5 or once human is removed, EndingStage owns the center canvas
  if (state.act === 5 || state.humanRemoved) {
    return null
  }

  return (
    <main className="feed-column" id="action-feed">
      {/* Act / Snooze Banner */}
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

      {/* Corporate / Wellness Pings (disappears once silenced in Act 4) */}
      {!state.uiFlags.pingsHidden && state.activePings.length > 0 && (
        <section className="pings-stack" aria-label="Incoming Pings">
          {state.activePings.map((ping) => (
            <div key={ping.id} className={`ping-row ${ping.tone}`}>
              <div>
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

      {/* THE APPROVAL TRAP: Cadence Permission Proposal */}
      {activeProposal && (
        <section
          className="proposal-card"
          id={`proposal-${activeProposal.id}`}
          aria-label="Cadence Proposal"
        >
          <span className="proposal-eyebrow">{activeProposal.eyebrow}</span>
          <h2 className="proposal-title">{activeProposal.title}</h2>
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
              {activeProposal.approveLabel}
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

      {/* Twin Draft Approval Queue */}
      {state.pendingDrafts.length > 0 && (
        <section aria-label="Twin Draft Approvals">
          <div className="section-header">
            <h2 className="section-title">
              Twin Drafts ({state.pendingDrafts.length})
            </h2>
            {hasBatchApprove && state.pendingDrafts.length > 1 && (
              <button
                type="button"
                id="btn-approve-all-drafts"
                className="btn-approve"
                style={{ minHeight: '28px', padding: '4px 10px', fontSize: '0.72rem' }}
                onClick={state.approveAllDrafts}
              >
                Approve All ({state.pendingDrafts.length})
              </button>
            )}
          </div>
          <div className="feed-column">
            {state.pendingDrafts.map((draft) => (
              <div key={draft.id} className="draft-card">
                <div className="draft-info">
                  <span className="draft-tag">Ready for approval</span>
                  <span className="draft-title">{draft.title}</span>
                  <span className="draft-detail">{draft.detail}</span>
                </div>
                <button
                  type="button"
                  className="btn-approve"
                  onClick={() => state.approveDraft(draft.id)}
                >
                  Approve
                  <span className="btn-cost-line">
                    +{formatNumber(draft.kpiReward)}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* DEMONSTRATE-TO-AUTOMATE: Manual Tasks Queue */}
      {manualTasks.length > 0 && (
        <section aria-label="Manual Schedule Blocks">
          <div className="section-header">
            <h2 className="section-title">
              {state.calendarMode === '24h'
                ? 'Unoptimized Blocks — Demonstrate to Calibrate'
                : 'Manual Work — Demonstrate to Calibrate Twin'}
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

              return (
                <article
                  key={task.id}
                  id={`task-${task.id}`}
                  className={`task-card ${
                    isCalibrated ? 'ready-to-automate' : ''
                  }`}
                >
                  <div className="task-top">
                    <div>
                      <div className="task-title-row">
                        <span className="task-name">{task.name}</span>
                        <span className="task-hours">{task.durationHours}h/day</span>
                        {task.unoptimizedScore && (
                          <span className="task-score-chip">
                            {task.unoptimizedScore}
                          </span>
                        )}
                      </div>
                      <p className="task-sub" style={{ margin: '2px 0 0' }}>
                        {samples > 0 && !isCalibrated
                          ? task.calibrationNote
                          : task.manualSubtitle}
                      </p>
                    </div>
                  </div>

                  <div className="task-sample-row">
                    <span>
                      {isCalibrated
                        ? `Digital Twin calibrated (+${task.fidelityContribution}% Fidelity)`
                        : `Twin calibration: ${samples}/${task.samplesRequired} samples`}
                    </span>
                    <span
                      className="sample-dots"
                      aria-label={`${samples} of ${task.samplesRequired} calibration samples`}
                    >
                      {Array.from({ length: task.samplesRequired }).map(
                        (_, i) => (
                          <span
                            key={i}
                            className={`sample-dot ${
                              i < samples ? 'filled' : ''
                            }`}
                          />
                        ),
                      )}
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
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.7rem',
                            color: 'var(--text-secondary)',
                          }}
                        >
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
                        <span>Automate</span>
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
