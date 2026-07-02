import { BOSSES, MONSTER_MAP } from '../game/monsters';
import { ITEMS } from '../game/items';
import { useDispatch, useGame } from '../state/store';
import { combatLevel } from '../game/combat';
import FightView from './FightView';

export default function BossPanel() {
  const s = useGame();
  const dispatch = useDispatch();
  const cb = combatLevel(s);

  if (s.activity?.type === 'combat' && MONSTER_MAP[s.activity.monsterId].boss) {
    const m = MONSTER_MAP[s.activity.monsterId];
    return (
      <div className="panel">
        <FightView monster={m} monsterHp={s.activity.monsterHp} />
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>👹 Bosses</h2>
        <p className="muted">
          Five great evils, each gated by combat level (yours: <strong>{cb}</strong>). Bosses do
          not respawn mid-fight — win, and claim a shot at their unique drops.
        </p>
      </div>
      <div className="boss-list">
        {BOSSES.map((m) => {
          const locked = cb < (m.levelReq ?? 0);
          const kills = s.kills[m.id] ?? 0;
          return (
            <div key={m.id} className={`card boss-card ${locked ? 'locked' : ''} ${kills > 0 ? 'defeated' : ''}`}>
              <div className="boss-icon">{m.icon}</div>
              <div className="boss-info">
                <div className="card-title">
                  {m.name} {kills > 0 && <span className="kill-badge">×{kills} slain</span>}
                </div>
                <div className="muted small">{m.flavor}</div>
                <div className="small">
                  Combat {m.levelReq}+ · ❤️ {m.hp} · max hit {m.maxHit}
                </div>
                <div className="small muted">
                  Uniques:{' '}
                  {m.drops
                    .filter((d) => d.chance < 1)
                    .map((d) => ITEMS[d.itemId]?.name)
                    .filter(Boolean)
                    .join(', ')}
                </div>
              </div>
              {locked ? (
                <div className="lock-note">🔒 Combat {m.levelReq}</div>
              ) : (
                <button className="btn primary" onClick={() => dispatch({ type: 'START_COMBAT', id: m.id })}>
                  ⚔️ Challenge
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
