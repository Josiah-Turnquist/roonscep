import { MONSTER_MAP } from '../game/monsters';
import { SLAYER_MASTERS, SLAYER_REWARDS } from '../game/slayer';
import { useDispatch, useGame } from '../state/store';
import { combatLevel, lvl } from '../game/combat';
import { levelForXp } from '../game/xp';

export default function SlayerPanel() {
  const s = useGame();
  const dispatch = useDispatch();
  const cb = combatLevel(s);
  const task = s.slayerTask;

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>💀 Slayer</h2>
        <p className="muted">
          Slayer level {levelForXp(s.xp.slayer)} · <strong>{s.slayerPoints}</strong> slayer points.
          Take a contract, hunt the target in the Combat tab (⭐), earn Slayer xp per kill and
          points on completion.
        </p>
      </div>

      {task ? (
        <div className="card active task-banner">
          <div className="card-title">
            📋 Current task: slay {task.remaining} more {MONSTER_MAP[task.monsterId]?.icon}{' '}
            {MONSTER_MAP[task.monsterId]?.name}
          </div>
          <div className="skill-bar task-bar">
            <span
              className="skill-bar-fill"
              style={{ width: `${Math.round(((task.total - task.remaining) / task.total) * 100)}%` }}
            />
          </div>
          <div className="muted small">
            {task.total - task.remaining}/{task.total} slain · assigned by {SLAYER_MASTERS.find((m) => m.id === task.masterId)?.name}
          </div>
          <button className="btn danger small" onClick={() => dispatch({ type: 'ABANDON_TASK' })}>
            Abandon task
          </button>
        </div>
      ) : (
        <p className="muted">No active task — visit a master below.</p>
      )}

      <h3 className="section-title">Slayer Masters</h3>
      <div className="card-grid">
        {SLAYER_MASTERS.map((m) => {
          const locked = cb < m.minCombat;
          return (
            <div key={m.id} className={`card ${locked ? 'locked' : ''}`}>
              <div className="card-title">
                {m.icon} {m.name}
              </div>
              <div className="muted small">{m.blurb}</div>
              <div className="small">
                {m.count[0]}–{m.count[1]} kills · {m.points} points per task
              </div>
              {locked ? (
                <div className="lock-note">🔒 Combat {m.minCombat}</div>
              ) : (
                <button
                  className="btn primary"
                  disabled={!!task}
                  title={task ? 'Finish or abandon your current task first' : ''}
                  onClick={() => dispatch({ type: 'NEW_TASK', masterId: m.id })}
                >
                  📋 New task
                </button>
              )}
            </div>
          );
        })}
      </div>

      <h3 className="section-title">Reward Shop</h3>
      <div className="card-grid">
        {SLAYER_REWARDS.map((r) => {
          const affordable = s.slayerPoints >= r.cost;
          const capeLocked = r.id === 'slayer_cape' && lvl(s, 'slayer') < 50;
          return (
            <div key={r.id} className="card">
              <div className="card-title">
                {r.icon} {r.name}
              </div>
              <div className="muted small">{r.desc}</div>
              <button
                className="btn primary"
                disabled={!affordable || capeLocked}
                onClick={() => dispatch({ type: 'BUY_SLAYER_REWARD', id: r.id })}
              >
                Redeem — {r.cost} pts
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
