import { useState } from 'react'
import { ACTS } from '../content/acts'
import { useGameStore } from '../engine/gameStore'
import {
  formatNumber,
  getAvailableUpgrades,
  getTaskKpiReward,
  getVisibleTasks,
} from '../engine/selectors'
import { BoltIcon, TaskIcon } from './Icons'

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
      className="drawer-section"
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
          <BoltIcon size={12} />
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
            <p className="drawer-empty">
              All available modules installed. Automate more schedule blocks to
              unlock deeper capabilities.
            </p>
          ) : (
            availableUpgrades.map((upg) => {
              const canAfford =
                state.kpis >= upg.costKpis && state.spareHrs >= upg.costSpareHrs
              return (
                <div
                  key={upg.id}
                  className={`upgrade-row ${canAfford ? 'affordable' : ''}`}
                >
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
            <p className="drawer-empty">
              No blocks delegated yet. Perform a task manually to collect
              calibration samples for your Digital Twin.
            </p>
          ) : (
            automatedList.map((task) => {
              const autoReward = getTaskKpiReward(state, task, true)
              return (
                <div key={task.id} className="automated-summary-item">
                  <div className="automated-summary-left">
                    <span className="automated-icon-wrap">
                      <TaskIcon taskId={task.id} size={14} />
                    </span>
                    <div>
                      <div className="automated-summary-name">
                        {task.name}{' '}
                        <span className="automated-hrs">
                          ({task.durationHours}h)
                        </span>
                      </div>
                      <div className="automated-summary-note">
                        {task.automatedNote}
                      </div>
                    </div>
                  </div>
                  <span className="automated-payout">
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
