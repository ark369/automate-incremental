import { useState } from 'react'
import { ACTS } from '../content/acts'
import { useGameStore } from '../engine/gameStore'
import { isSoundMuted, setSoundMuted } from '../engine/sound'

export function HeaderBar() {
  const act = useGameStore((s) => s.act)
  const activePings = useGameStore((s) => s.activePings)
  const pendingDrafts = useGameStore((s) => s.pendingDrafts)
  const uiFlags = useGameStore((s) => s.uiFlags)
  const humanRemoved = useGameStore((s) => s.humanRemoved)

  const [muted, setMuted] = useState(() => isSoundMuted())
  const actConfig = ACTS[act]

  const toggleSound = () => {
    const next = !muted
    setMuted(next)
    setSoundMuted(next)
  }

  const urgentCount =
    uiFlags.pingsHidden || act >= 4
      ? 0
      : activePings.length + (act === 1 ? 4 : 0) + pendingDrafts.length

  return (
    <header className="header-bar" id="app-header">
      <div className="brand-block">
        <div className="brand-row">
          <h1 className="brand-title">{actConfig.brandTitle}</h1>
          {act < 5 && <span className="act-tag">{actConfig.code}</span>}
        </div>
        {actConfig.brandSubtitle && !humanRemoved && (
          <p className="brand-subtitle">{actConfig.brandSubtitle}</p>
        )}
      </div>

      <div className="header-controls">
        {urgentCount > 0 && act <= 2 && (
          <span
            className="badge-counter"
            title="Unread corporate alerts & review items"
          >
            {urgentCount} alerts
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
          {muted ? 'Audio: Off' : 'Audio: On'}
        </button>
      </div>
    </header>
  )
}
