import { AttackStyle, Monster } from '../game/types';
import { ITEMS } from '../game/items';
import { PRAYERS } from '../game/prayers';
import { useDispatch, useGame } from '../state/store';
import {
  lvl, maxHp, maxPrayerPoints, playerHitChance, playerMaxHit, playerStyle, monsterHitChance,
} from '../game/combat';

const STYLES: { id: AttackStyle; label: string; hint: string }[] = [
  { id: 'accurate', label: '🎯 Accurate', hint: 'Attack xp, +accuracy' },
  { id: 'aggressive', label: '💢 Aggressive', hint: 'Strength xp, +damage' },
  { id: 'defensive', label: '🛡️ Defensive', hint: 'Defence xp, +defence' },
  { id: 'controlled', label: '⚖️ Controlled', hint: 'Split xp evenly' },
];

export default function FightView({ monster, monsterHp }: { monster: Monster; monsterHp: number }) {
  const s = useGame();
  const dispatch = useDispatch();
  const hpMax = maxHp(s);
  const style = playerStyle(s);
  const onTask = s.slayerTask?.monsterId === monster.id;

  const food = Object.entries(s.inventory).filter(([id]) => ITEMS[id]?.heals);
  const potions = Object.entries(s.inventory).filter(([id]) => ITEMS[id]?.boost || ITEMS[id]?.restorePrayer);
  const boostsActive = Object.entries(s.boosts).filter(([, v]) => v > 0);
  const prayers = PRAYERS.filter((p) => lvl(s, 'prayer') >= p.level);

  return (
    <div className="fight">
      <div className="fight-arena">
        <div className="combatant">
          <div className="combatant-icon">🧙</div>
          <div className="combatant-name">You ({style})</div>
          <div className="hp-bar">
            <div
              className="hp-bar-fill player"
              style={{ width: `${Math.max(0, (s.currentHp / hpMax) * 100)}%` }}
            />
          </div>
          <div className="small">
            {s.currentHp}/{hpMax} HP · max hit {playerMaxHit(s)} · {Math.round(playerHitChance(s, monster) * 100)}% to hit
          </div>
          <div className="small muted">🙏 {s.prayerPoints}/{maxPrayerPoints(s)} prayer</div>
          {boostsActive.length > 0 && (
            <div className="small boosted">
              {boostsActive.map(([k, v]) => `+${v} ${k}`).join(' · ')}
            </div>
          )}
        </div>
        <div className="vs">VS</div>
        <div className="combatant">
          <div className="combatant-icon">{monster.icon}</div>
          <div className="combatant-name">
            {monster.name} {onTask && <span title="Slayer task target">⭐</span>}
          </div>
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

      {style === 'melee' && (
        <div className="style-row">
          {STYLES.map((st) => (
            <button
              key={st.id}
              title={st.hint}
              className={`btn small ${s.attackStyle === st.id ? 'active-toggle' : ''}`}
              onClick={() => dispatch({ type: 'SET_STYLE', style: st.id })}
            >
              {st.label}
            </button>
          ))}
        </div>
      )}

      {prayers.length > 0 && (
        <div className="fight-consumables">
          {prayers.map((p) => {
            const active = s.activePrayers.includes(p.id);
            return (
              <button
                key={p.id}
                className={`btn small ${active ? 'active-toggle' : ''}`}
                title={`${p.desc} — drains ${p.drain}/round`}
                onClick={() => dispatch({ type: 'TOGGLE_PRAYER', id: p.id })}
              >
                {p.icon} {p.name}
              </button>
            );
          })}
        </div>
      )}

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
              title={ITEMS[id].boost ? `+${ITEMS[id].boost!.amount} ${ITEMS[id].boost!.skill}` : 'Restores prayer points'}
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
