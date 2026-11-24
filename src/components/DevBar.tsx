import { useState } from 'react'
import type { ActId } from '../content/types'
import { useGameStore } from '../engine/gameStore'

const SPEEDS: Array<1 | 5 | 20> = [1, 5, 20]
const ACT_LIST: ActId[] = [1, 2, 3, 4, 5]

export function DevBar() {
  const [open, setOpen] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  const act = useGameStore((s) => s.act)
  const speed = useGameStore((s) => s.speedMultiplier)
  const paused = useGameStore((s) => s.paused)
  const setSpeed = useGameStore((s) => s.setSpeed)
  const togglePaused = useGameStore((s) => s.togglePaused)
  const jumpToAct = useGameStore((s) => s.jumpToAct)
  const devGrantResources = useGameStore((s) => s.devGrantResources)
  const devFillSamples = useGameStore((s) => s.devFillSamples)
  const exportSave = useGameStore((s) => s.exportSave)
  const importSave = useGameStore((s) => s.importSave)
  const hardReset = useGameStore((s) => s.hardReset)

  const flashStatus = (msg: string) => {
    setStatusMsg(msg)
    window.setTimeout(() => setStatusMsg(null), 2400)
  }

  const handleExport = async () => {
    const data = exportSave()
    try {
      await navigator.clipboard.writeText(data)
      flashStatus('Save JSON copied to clipboard.')
    } catch {
      window.prompt('Copy save JSON:', data)
    }
  }

  const handleImport = () => {
    const raw = window.prompt('Paste save JSON:')
    if (!raw) return
    const ok = importSave(raw)
    flashStatus(ok ? 'Save imported.' : 'Invalid save JSON.')
  }

  return (
    <aside className="dev-anchor" aria-label="Playtest Dev Tools">
      {open && (
        <div className="dev-drawer" id="dev-drawer">
          <div className="dev-row">
            <span className="dev-label">Speed</span>
            <div className="dev-btn-group">
              <button
                type="button"
                className={`dev-btn ${paused ? 'active' : ''}`}
                onClick={togglePaused}
              >
                {paused ? 'Resume' : 'Pause'}
              </button>
              {SPEEDS.map((sp) => (
                <button
                  key={sp}
                  type="button"
                  id={`dev-speed-${sp}x`}
                  className={`dev-btn ${!paused && speed === sp ? 'active' : ''}`}
                  onClick={() => setSpeed(sp)}
                >
                  {sp}x
                </button>
              ))}
            </div>
          </div>

          <div className="dev-row">
            <span className="dev-label">Jump Act</span>
            <div className="dev-btn-group">
              {ACT_LIST.map((a) => (
                <button
                  key={a}
                  type="button"
                  id={`dev-jump-act-${a}`}
                  className={`dev-btn ${act === a ? 'active' : ''}`}
                  onClick={() => {
                    jumpToAct(a)
                    flashStatus(`Jumped to Act ${a}`)
                  }}
                >
                  A{a}
                </button>
              ))}
            </div>
          </div>

          <div className="dev-row">
            <span className="dev-label">Grants</span>
            <div className="dev-btn-group">
              <button
                type="button"
                className="dev-btn"
                onClick={() => {
                  devGrantResources(500, 0)
                  flashStatus('+500 KPIs')
                }}
              >
                +500 KPI
              </button>
              <button
                type="button"
                className="dev-btn"
                onClick={() => {
                  devGrantResources(0, 10)
                  flashStatus('+10 Spare Hrs')
                }}
              >
                +10h Spare
              </button>
              <button
                type="button"
                className="dev-btn"
                onClick={() => {
                  devFillSamples()
                  flashStatus('All visible samples filled')
                }}
              >
                Fill Samples
              </button>
            </div>
          </div>

          <div className="dev-row">
            <span className="dev-label">Save</span>
            <div className="dev-btn-group">
              <button type="button" className="dev-btn" onClick={handleExport}>
                Export
              </button>
              <button type="button" className="dev-btn" onClick={handleImport}>
                Import
              </button>
              <button
                type="button"
                className="dev-btn danger"
                onClick={() => {
                  hardReset()
                  flashStatus('Reset to Act 1')
                }}
              >
                Reset
              </button>
            </div>
          </div>

          {statusMsg && <div className="dev-status-msg">{statusMsg}</div>}
        </div>
      )}

      <button
        type="button"
        id="btn-dev-toggle"
        className="dev-toggle-pill"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? 'DEV ×' : `DEV · ${paused ? 'II' : `${speed}x`}`}
      </button>
    </aside>
  )
}
