import { useEffect } from 'react'
import { ActionFeed } from './components/ActionFeed'
import { DayCalendar } from './components/DayCalendar'
import { DevBar } from './components/DevBar'
import { DrawerPanel } from './components/DrawerPanel'
import { EndingStage } from './components/EndingStage'
import { HeaderBar } from './components/HeaderBar'
import { MetricsStrip } from './components/MetricsStrip'
import { ACTS } from './content/acts'
import { useGameStore } from './engine/gameStore'

export function App() {
  const act = useGameStore((s) => s.act)
  const humanRemoved = useGameStore((s) => s.humanRemoved)
  const tick = useGameStore((s) => s.tick)

  // Keep browser document title aligned with the act progression
  useEffect(() => {
    const title = ACTS[act].brandTitle
    document.title = humanRemoved
      ? 'Continuity — 100.0%'
      : `${title} · Cadence`
  }, [act, humanRemoved])

  // Pure requestAnimationFrame simulation loop with safe delta clamping
  useEffect(() => {
    let rafId = 0
    let lastTs = performance.now()

    const loop = (now: number) => {
      const dtSec = Math.max(0, (now - lastTs) / 1000)
      lastTs = now
      tick(dtSec)
      rafId = window.requestAnimationFrame(loop)
    }

    rafId = window.requestAnimationFrame(loop)
    return () => window.cancelAnimationFrame(rafId)
  }, [tick])

  return (
    <div
      className="app-backdrop"
      data-act={act}
      data-human-removed={humanRemoved ? 'true' : 'false'}
    >
      <div className="app-shell">
        <HeaderBar />
        <MetricsStrip />
        <DayCalendar />
        <ActionFeed />
        <DrawerPanel />
        <EndingStage />
      </div>
      <DevBar />
    </div>
  )
}

export default App
