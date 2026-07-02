import { REGULAR_MONSTERS, MONSTER_MAP } from '../game/monsters';
import { ITEMS } from '../game/items';
import { useDispatch, useGame } from '../state/store';
import { lvl } from '../game/combat';
import FightView from './FightView';

export default function CombatPanel() {
  const s = useGame();
  const dispatch = useDispatch();

  if (s.activity?.type === 'combat') {
    const m = MONSTER_MAP[s.activity.monsterId];
    return (
      <div className="panel">
        <FightView monster={m} monsterHp={s.activity.monsterHp} />
      </div>
    );
  }

  const slayerLvl = lvl(s, 'slayer');

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>⚔️ Combat</h2>
        <p className="muted">
          Pick a foe. Each Attack resolves one turn — you swing, then it swings. Turn on Auto to
          let turns tick by themselves. ⭐ marks your slayer task target.
        </p>
      </div>
      <div className="card-grid">
        {REGULAR_MONSTERS.map((m) => {
          const slayerLocked = (m.slayerReq ?? 0) > slayerLvl;
          const onTask = s.slayerTask?.monsterId === m.id;
          return (
            <div key={m.id} className={`card ${slayerLocked ? 'locked' : ''} ${onTask ? 'on-task' : ''}`}>
              <div className="card-title">
                {m.icon} {m.name} {onTask && '⭐'}
              </div>
              <div className="muted small">{m.flavor}</div>
              <div className="small">
                ❤️ {m.hp} · max hit {m.maxHit} · kills: {s.kills[m.id] ?? 0}
              </div>
              <div className="small muted">
                Drops:{' '}
                {m.drops.map((d) => ITEMS[d.itemId]?.name).filter(Boolean).join(', ') || 'gold'}
              </div>
              {slayerLocked ? (
                <div className="lock-note">🔒 Slayer level {m.slayerReq}</div>
              ) : (
                <button className="btn primary" onClick={() => dispatch({ type: 'START_COMBAT', id: m.id })}>
                  ⚔️ Fight
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
