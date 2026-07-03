import { AttackStyle } from '../game/types';
import { ITEMS } from '../game/items';
import { PRAYERS } from '../game/prayers';
import { MONSTER_MAP } from '../game/monsters';
import { useDispatch, useGame } from '../state/store';
import {
  lvl, maxHp, maxPrayerPoints, monsterHitChance, playerHitChance, playerMaxHit, playerStyle,
} from '../game/combat';
import TickBar from './TickBar';

const STYLES: { id: AttackStyle; icon: string; hint: string }[] = [
  { id: 'accurate', icon: '🎯', hint: 'Accurate — Attack xp' },
  { id: 'aggressive', icon: '💢', hint: 'Aggressive — Strength xp' },
  { id: 'defensive', icon: '🛡️', hint: 'Defensive — Defence xp' },
  { id: 'controlled', icon: '⚖️', hint: 'Controlled — split xp' },
];

export default function CombatHud() {
  const s = useGame();
  const dispatch = useDispatch();
  if (s.activity?.type !== 'combat') return null;
  const m = MONSTER_MAP[s.activity.monsterId];
  const hpMax = maxHp(s);

  const food = Object.entries(s.inventory).filter(([id]) => ITEMS[id]?.heals).slice(0, 4);
  const potions = Object.entries(s.inventory)
    .filter(([id]) => ITEMS[id]?.boost || ITEMS[id]?.restorePrayer)
    .slice(0, 4);
  const prayers = PRAYERS.filter((p) => lvl(s, 'prayer') >= p.level);

  return (
    <div className="combat-hud">
      {s.autoCombat && <TickBar className="hud-tick" />}
      <div className="hud-row hud-bars">
        <div className="hud-bar-block">
          <div className="hud-label">
            You {s.currentHp}/{hpMax} · 🙏 {s.prayerPoints}/{maxPrayerPoints(s)}
          </div>
          <div className="hp-bar">
            <div className="hp-bar-fill player" style={{ width: `${Math.max(0, (s.currentHp / hpMax) * 100)}%` }} />
          </div>
        </div>
        <div className="hud-vs">⚔️</div>
        <div className="hud-bar-block">
          <div className="hud-label">
            {m.icon} {m.name} {s.activity.monsterHp}/{m.hp}
          </div>
          <div className="hp-bar">
            <div
              className="hp-bar-fill enemy"
              style={{ width: `${Math.max(0, (s.activity.monsterHp / m.hp) * 100)}%` }}
            />
          </div>
        </div>
      </div>
      <div className="hud-row">
        <button className="btn primary" onClick={() => dispatch({ type: 'ATTACK' })}>
          ⚔️ Attack
        </button>
        <button
          className={`btn ${s.autoCombat ? 'active-toggle' : ''}`}
          title="Swing automatically every turn"
          onClick={() => dispatch({ type: 'TOGGLE_AUTO' })}
        >
          Retaliate: {s.autoCombat ? 'on' : 'off'}
        </button>
        <button className="btn danger" onClick={() => dispatch({ type: 'FLEE' })}>
          Flee
        </button>
        <button
          className={`btn small ${s.settings.chainCombat ? 'active-toggle' : ''}`}
          title="After a kill, automatically engage the nearest monster of the same kind"
          onClick={() => dispatch({ type: 'SET_SETTINGS', patch: { chainCombat: !s.settings.chainCombat } })}
        >
          Auto-attack
        </button>
        {playerStyle(s) === 'melee' &&
          STYLES.map((st) => (
            <button
              key={st.id}
              title={st.hint}
              className={`btn small ${s.attackStyle === st.id ? 'active-toggle' : ''}`}
              onClick={() => dispatch({ type: 'SET_STYLE', style: st.id })}
            >
              {st.icon}
            </button>
          ))}
        <span className="hud-stats small muted">
          max {playerMaxHit(s)} · you {Math.round(playerHitChance(s, m) * 100)}% · foe{' '}
          {Math.round(monsterHitChance(s, m) * 100)}%
        </span>
      </div>
      {(food.length > 0 || potions.length > 0 || prayers.length > 0) && (
        <div className="hud-row hud-consumables">
          {food.map(([id, qty]) => (
            <button
              key={id}
              className="btn small"
              title={`${ITEMS[id].name} — heals ${ITEMS[id].heals} (foe gets a free swing)`}
              onClick={() => dispatch({ type: 'EAT', itemId: id })}
            >
              {ITEMS[id].icon}×{qty}
            </button>
          ))}
          {potions.map(([id, qty]) => (
            <button
              key={id}
              className="btn small"
              title={ITEMS[id].name}
              onClick={() => dispatch({ type: 'DRINK', itemId: id })}
            >
              {ITEMS[id].icon}×{qty}
            </button>
          ))}
          {prayers.map((p) => (
            <button
              key={p.id}
              className={`btn small ${s.activePrayers.includes(p.id) ? 'active-toggle' : ''}`}
              title={`${p.name} — ${p.desc} (drains ${p.drain}/round)`}
              onClick={() => dispatch({ type: 'TOGGLE_PRAYER', id: p.id })}
            >
              {p.icon}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
