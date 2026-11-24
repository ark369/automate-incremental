import { useState } from 'react'
import { ACTS } from '../content/acts'
import { useGameStore } from '../engine/gameStore'
import {
  formatNumber,
  getAvailableUpgrades,
  getTaskKpiReward,
  getVisibleTasks,
} from '../engine/selectors'

export function DrawerPanel() {
  const state = useGameStore()
  const [activeTab, setActiveTab] = useState<'upgrades' | 'twin'>('upgrades')

  // Unmounts completely once player approves "Declutter Configuration Controls" or enters Act 5
  if (state.uiFlags.drawerHidden || state.act >= 5 || state.humanRemoved) {
    return null
  }

  const availableUpgrades = getAvailableUpgrades(state)
  const affordableCount = availableUpgrades.filter(
    (u) => state.kpis >= u.costKpis && state.spareHrs >= u.costSpareHrs,
  ).length

  const automatedList = getVisibleTasks(state).filter(
    (t) => state.automatedTasks[t.id],
  )
  const kpiUnit = ACTS[state.act].kpiLabel

  return (
    <section
      className="drawer-panel"
      id="drawer-panel"
      aria-label="Tools and Digital Twin Roster"
    >
      <div className="drawer-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'upgrades'}
          className={`drawer-tab ${activeTab === 'upgrades' ? 'active' : ''}`}
          onClick={() => setActiveTab('upgrades')}
        >
          <span>Tools & Macros</span>
          {affordableCount > 0 && (
            <span className="tab-pill">{affordableCount}</span>
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'twin'}
          className={`drawer-tab ${activeTab === 'twin' ? 'active' : ''}`}
          onClick={() => setActiveTab('twin')}
        >
          <span>Digital Twin ({automatedList.length})</span>
        </button>
      </div>

      {activeTab === 'upgrades' && (
        <div className="upgrade-list">
          {availableUpgrades.length === 0 ? (
            <p className="task-sub" style={{ margin: '2px 0' }}>
              All available modules installed. Automate more schedule blocks to
              unlock deeper capabilities.
            </p>
          ) : (
            availableUpgrades.map((upg) => {
              const canAfford =
                state.kpis >= upg.costKpis && state.spareHrs >= upg.costSpareHrs
              return (
                <div key={upg.id} className="upgrade-row">
                  <div className="upgrade-info">
                    <span className="upgrade-name">{upg.name}</span>
                    <span className="upgrade-desc">{upg.description}</span>
                  </div>
                  <button
                    type="button"
                    id={`btn-upgrade-${upg.id}`}
                    className="btn-buy"
                    disabled={!canAfford}
                    onClick={() => state.buyUpgrade(upg.id)}
                  >
                    {formatNumber(upg.costKpis)} {kpiUnit}
                    {upg.costSpareHrs > 0 ? ` · ${upg.costSpareHrs}h` : ''}
                  </button>
                </div>
              )
            })
          )}
        </div>
      )}

      {activeTab === 'twin' && (
        <div className="upgrade-list">
          {automatedList.length === 0 ? (
            <p className="task-sub" style={{ margin: '2px 0' }}>
              No blocks delegated yet. Perform a task manually to collect
              calibration samples for your Digital Twin.
            </p>
          ) : (
            automatedList.map((task) => {
              const autoReward = getTaskKpiReward(state, task, true)
              return (
                <div key={task.id} className="automated-summary-item">
                  <div>
                    <div className="automated-summary-name">
                      {task.name} ({task.durationHours}h)
                    </div>
                    <div className="automated-summary-note">
                      {task.automatedNote}
                    </div>
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.68rem',
                      color: 'var(--accent-auto)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    +{formatNumber(autoReward)}/d
                  </span>
                </div>
              )
            })
          )}
        </div>
      )}
    </section>
  )
}
