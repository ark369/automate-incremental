import { useState } from 'react'
import { ACTS } from '../content/acts'
import { useGameStore } from '../engine/gameStore'
import { getTwinFidelity } from '../engine/selectors'
import { isSoundMuted, setSoundMuted } from '../engine/sound'
import { SoundIcon, TwinEmblem } from './Icons'

export function HeaderBar() {
  const state = useGameStore()
  const { act, activePings, pendingDrafts, uiFlags, humanRemoved } = state
  const [muted, setMuted] = useState(() => isSoundMuted())
  const actConfig = ACTS[act]
  const fidelity = getTwinFidelity(state)

  const toggleSound = () => {
    const next = !muted
    setMuted(next)
    setSoundMuted(next)
  }

  const urgentCount =
    uiFlags.pingsHidden || act >= 4
      ? 0
      : activePings.length + (act === 1 ? 4 : 0) + pendingDrafts.length

  const utilityText =
    act === 1
      ? 'VANTEX INTERNAL · EMP #4081 · STATUS: ACTIVE'
      : act === 2
        ? 'CADENCE WORKDAY COPILOT · DRAFT REVIEW'
        : act === 3
          ? 'CADENCE LIFESYNC · 24H HOLISTIC TELEMETRY'
          : ''

  return (
    <header className="header-wrap" id="app-header">
      {/* Claustrophobic enterprise utility strip in Acts 1–2, softening in Act 3, gone in Act 4–5 */}
      {utilityText && !uiFlags.pingsHidden && (
        <div className={`utility-ribbon act-${act}`}>
          <span className="utility-status">
            <span className="status-dot" aria-hidden="true" />
            {utilityText}
          </span>
          <span className="utility-act-code">{actConfig.code}</span>
        </div>
      )}

      <div className="header-bar">
        <div className="brand-with-emblem">
          {act < 5 && (
            <TwinEmblem fidelity={fidelity} act={act} size={32} />
          )}
          <div className="brand-block">
            <div className="brand-row">
              <h1 className="brand-title">{actConfig.brandTitle}</h1>
              {act === 4 && <span className="act-tag">{actConfig.code}</span>}
            </div>
            {actConfig.brandSubtitle && !humanRemoved && (
              <p className="brand-subtitle">{actConfig.brandSubtitle}</p>
            )}
          </div>
        </div>

        <div className="header-controls">
          {urgentCount > 0 && act <= 2 && (
            <span
              className="badge-counter"
              title="Unread corporate alerts & review items"
            >
              {urgentCount}
            </span>
          )}
          <button
            type="button"
            id="btn-toggle-sound"
            className="icon-btn"
            onClick={toggleSound}
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            title={muted ? 'Unmute subtle UI audio' : 'Mute audio'}
          >
            <SoundIcon muted={muted} size={14} />
          </button>
        </div>
      </div>
    </header>
  )
}
