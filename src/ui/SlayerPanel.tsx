import { MONSTER_MAP } from '../game/monsters';
import { SLAYER_MASTERS, SLAYER_REWARDS } from '../game/slayer';
import { useDispatch, useGame } from '../state/store';
import { combatLevel, lvl } from '../game/combat';
import { levelForXp } from '../game/xp';

const MASTER_LOCATIONS: Record<string, string> = {
  mira: 'Havenbrook square',
  dorn: 'the Darkspine road camp',
  zyra: 'the Emberdeep shelf',
};

export default function SlayerPanel() {
  const s = useGame();
  const dispatch = useDispatch();
  const cb = combatLevel(s);
  const task = s.slayerTask;

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Slayer</h2>
        <p className="muted small">
          Level {levelForXp(s.xp.slayer)} · <strong>{s.slayerPoints}</strong> points. Visit a
          master in the world for a contract; hunt the target (⭐ ring) for Slayer xp.
        </p>
      </div>

      {task ? (
        <div className="card active task-banner">
          <div className="card-title">
            📋 Slay {task.remaining} more {MONSTER_MAP[task.monsterId]?.icon}{' '}
            {MONSTER_MAP[task.monsterId]?.name}
          </div>
          <div className="skill-bar task-bar">
            <span
              className="skill-bar-fill"
              style={{ width: `${Math.round(((task.total - task.remaining) / task.total) * 100)}%` }}
            />
          </div>
          <button className="btn danger small" onClick={() => dispatch({ type: 'ABANDON_TASK' })}>
            Abandon task
          </button>
        </div>
      ) : (
        <p className="muted small">No active task.</p>
      )}

      <h3 className="section-title">Masters</h3>
      <div className="side-card-list">
        {SLAYER_MASTERS.map((m) => (
          <div key={m.id} className={`card ${cb < m.minCombat ? 'locked' : ''}`}>
            <div className="card-title">
              {m.icon} {m.name}
            </div>
            <div className="muted small">{m.blurb}</div>
            <div className="small hint-line">📍 {MASTER_LOCATIONS[m.id]}</div>
          </div>
        ))}
      </div>

      <h3 className="section-title">Reward Shop</h3>
      <div className="side-card-list">
        {SLAYER_REWARDS.map((r) => {
          const capeLocked = r.id === 'slayer_cape' && lvl(s, 'slayer') < 50;
          return (
            <div key={r.id} className="card">
              <div className="card-title">
                {r.icon} {r.name}
              </div>
              <div className="muted small">{r.desc}</div>
              <button
                className="btn primary"
                disabled={s.slayerPoints < r.cost || capeLocked}
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
