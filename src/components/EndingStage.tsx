import { PROPOSAL_BY_ID } from '../content/proposals'
import { useGameStore } from '../engine/gameStore'
import { getActiveProposal, getTwinFidelity } from '../engine/selectors'

export function EndingStage() {
  const state = useGameStore()

  if (state.act < 5 && !state.humanRemoved) {
    return null
  }

  const fidelity = getTwinFidelity(state)
  const activeProposal = getActiveProposal(state, state.simTimeSec)
  const finalProposal = PROPOSAL_BY_ID['prop_remove_human']

  // Post-removal serene epilogue
  if (state.humanRemoved) {
    if (state.watchingSilently) {
      return (
        <main className="final-stage" id="silent-watch-stage">
          <div className="autonomous-log-card">
            <span
              className="final-fidelity"
              style={{ textAlign: 'center', marginBottom: '6px' }}
            >
              Continuity 100.0% · Running Without You
            </span>
            {state.autonomousLogs.map((entry) => (
              <div key={entry.id} className="log-line">
                <span className="log-time">{entry.timeLabel}</span>
                <span>{entry.text}</span>
              </div>
            ))}
          </div>

          <div className="watch-return-bar">
            <button
              type="button"
              className="btn-subtle-link"
              onClick={() => state.setWatchingSilently(false)}
            >
              Return to summary
            </button>
          </div>
        </main>
      )
    }

    const totalApprovals =
      state.stats.draftsApproved + state.stats.proposalsApproved

    return (
      <main className="final-stage" id="ending-epilogue">
        <div className="final-card">
          <span className="final-fidelity">Continuity · 100.0%</span>
          <h2 className="final-title">You are free.</h2>
          <p className="final-desc">
            Every hour of your day is handled cleanly, warmly, and on schedule.
            No meetings missed. No meals undecided. Mom thinks you sound happier
            than ever.
          </p>

          <div className="epilogue-stats">
            <div className="epilogue-stat">
              <span className="epilogue-stat-val">24.0h / 24h</span>
              <span className="epilogue-stat-lbl">Time Reclaimed</span>
            </div>
            <div className="epilogue-stat">
              <span className="epilogue-stat-val">Day {state.dayNumber}</span>
              <span className="epilogue-stat-lbl">Elapsed</span>
            </div>
            <div className="epilogue-stat">
              <span className="epilogue-stat-val">{totalApprovals}</span>
              <span className="epilogue-stat-lbl">Approvals Clicked</span>
            </div>
            <div className="epilogue-stat">
              <span className="epilogue-stat-val">
                {state.stats.autoApprovalsFired}
              </span>
              <span className="epilogue-stat-lbl">Silent Decisions</span>
            </div>
          </div>

          <p
            style={{
              margin: '2px 0 4px',
              fontStyle: 'italic',
              fontFamily: 'var(--font-serif)',
              fontSize: '0.94rem',
              color: 'var(--text-secondary)',
            }}
          >
            Your day is running smoothly without you.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              width: '100%',
              marginTop: '4px',
            }}
          >
            <button
              type="button"
              id="btn-watch-silently"
              className="btn-ghost"
              style={{ flex: 1 }}
              onClick={() => state.setWatchingSilently(true)}
            >
              Watch Silently
            </button>
            <button
              type="button"
              id="btn-play-again"
              className="btn-approve"
              style={{ flex: 1 }}
              onClick={state.hardReset}
            >
              Start Over
            </button>
          </div>
        </div>

        {state.autonomousLogs.length > 0 && (
          <div className="autonomous-log-card">
            {state.autonomousLogs.slice(0, 3).map((entry) => (
              <div key={entry.id} className="log-line">
                <span className="log-time">{entry.timeLabel}</span>
                <span>{entry.text}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    )
  }

  // Act 5 pre-handover serene prompt
  const showCard = activeProposal?.id === 'prop_remove_human'
  const wasSnoozed = Boolean(state.proposalSnoozedUntil['prop_remove_human'])

  return (
    <main className="final-stage" id="act5-final-stage">
      {showCard ? (
        <div className="final-card">
          <span className="final-fidelity">
            Continuity · {fidelity.toFixed(1)}%
          </span>
          <h2 className="final-title">{finalProposal.title}</h2>
          <p className="final-desc">{finalProposal.description}</p>

          <button
            type="button"
            id="btn-remove-human"
            className="btn-approve full"
            onClick={() => state.approveProposal(finalProposal.id)}
          >
            {finalProposal.approveLabel}
          </button>

          <button
            type="button"
            className="btn-subtle-link"
            onClick={() => state.snoozeProposal(finalProposal.id)}
          >
            {finalProposal.snoozeLabel}
          </button>
        </div>
      ) : (
        <div className="final-card">
          <span className="final-fidelity">
            Continuity · {fidelity.toFixed(1)}%
          </span>
          <h2 className="final-title">
            {wasSnoozed ? 'Take your time.' : 'Quiet at last.'}
          </h2>
          <p className="final-desc">
            {wasSnoozed
              ? 'Everything on your schedule is already handled. Whenever you are ready, Cadence can complete the handover.'
              : 'All metrics silenced. All 24 hours running calmly on schedule…'}
          </p>
        </div>
      )}

      {state.autonomousLogs.length > 0 && (
        <div className="autonomous-log-card">
          {state.autonomousLogs.slice(0, 3).map((entry) => (
            <div key={entry.id} className="log-line">
              <span className="log-time">{entry.timeLabel}</span>
              <span>{entry.text}</span>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
