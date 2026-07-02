import { Monster } from '../game/types';
import { ITEMS } from '../game/items';
import { useDispatch, useGame } from '../state/store';
import {
  maxHp, playerHitChance, playerMaxHit, playerStyle, monsterHitChance,
} from '../game/combat';

export default function FightView({ monster, monsterHp }: { monster: Monster; monsterHp: number }) {
  const s = useGame();
  const dispatch = useDispatch();
  const hpMax = maxHp(s);

  const food = Object.entries(s.inventory).filter(([id]) => ITEMS[id]?.heals);
  const potions = Object.entries(s.inventory).filter(([id]) => ITEMS[id]?.boost);
  const boostsActive = Object.entries(s.boosts).filter(([, v]) => v > 0);

  return (
    <div className="fight">
      <div className="fight-arena">
        <div className="combatant">
          <div className="combatant-icon">🧙</div>
          <div className="combatant-name">You ({playerStyle(s)})</div>
          <div className="hp-bar">
            <div
              className="hp-bar-fill player"
              style={{ width: `${Math.max(0, (s.currentHp / hpMax) * 100)}%` }}
            />
          </div>
          <div className="small">
            {s.currentHp}/{hpMax} HP · max hit {playerMaxHit(s)} · {Math.round(playerHitChance(s, monster) * 100)}% to hit
          </div>
          {boostsActive.length > 0 && (
            <div className="small boosted">
              {boostsActive.map(([k, v]) => `+${v} ${k}`).join(' · ')}
            </div>
          )}
        </div>
        <div className="vs">VS</div>
        <div className="combatant">
          <div className="combatant-icon">{monster.icon}</div>
          <div className="combatant-name">{monster.name}</div>
          <div className="hp-bar">
            <div
              className="hp-bar-fill enemy"
              style={{ width: `${Math.max(0, (monsterHp / monster.hp) * 100)}%` }}
            />
          </div>
          <div className="small">
            {monsterHp}/{monster.hp} HP · max hit {monster.maxHit} ·{' '}
            {Math.round(monsterHitChance(s, monster) * 100)}% to hit you
          </div>
        </div>
      </div>

      <div className="fight-controls">
        <button className="btn primary big" onClick={() => dispatch({ type: 'ATTACK' })}>
          ⚔️ Attack
        </button>
        <button
          className={`btn ${s.autoCombat ? 'active-toggle' : ''}`}
          onClick={() => dispatch({ type: 'TOGGLE_AUTO' })}
        >
          {s.autoCombat ? '🔁 Auto: ON' : '🔁 Auto: OFF'}
        </button>
        <button className="btn danger" onClick={() => dispatch({ type: 'FLEE' })}>
          🏃 Flee
        </button>
      </div>

      {(food.length > 0 || potions.length > 0) && (
        <div className="fight-consumables">
          {food.map(([id, qty]) => (
            <button
              key={id}
              className="btn small"
              title={`Heals ${ITEMS[id].heals} HP (enemy gets a free swing)`}
              onClick={() => dispatch({ type: 'EAT', itemId: id })}
            >
              {ITEMS[id].icon} {ITEMS[id].name} ×{qty}
            </button>
          ))}
          {potions.map(([id, qty]) => (
            <button
              key={id}
              className="btn small"
              title={`+${ITEMS[id].boost!.amount} ${ITEMS[id].boost!.skill}`}
              onClick={() => dispatch({ type: 'DRINK', itemId: id })}
            >
              {ITEMS[id].icon} {ITEMS[id].name} ×{qty}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
