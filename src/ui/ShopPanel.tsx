import { SHOP } from '../game/shop';
import { ITEMS } from '../game/items';
import { SKILLS } from '../game/skills';
import { useDispatch, useGame } from '../state/store';
import { levelForXp } from '../game/xp';

export default function ShopPanel() {
  const s = useGame();
  const dispatch = useDispatch();
  const maxedSkills = SKILLS.filter((sk) => levelForXp(s.xp[sk.id]) >= 99);

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>🛒 General Store</h2>
        <p className="muted">
          Starter gear, food and potions. You have 🪙 {s.gold.toLocaleString()} gold. Sell your own
          loot from the Inventory tab.
        </p>
      </div>
      <div className="card-grid">
        {SHOP.map((e) => {
          const it = ITEMS[e.itemId];
          const affordable = s.gold >= e.price;
          return (
            <div key={e.itemId} className="card">
              <div className="card-title">
                {it.icon} {it.name}
              </div>
              <div className="muted small">
                {it.heals ? `Heals ${it.heals} HP` : ''}
                {it.boost ? `+${it.boost.amount} ${it.boost.skill} in combat` : ''}
                {it.restorePrayer ? `Restores ${it.restorePrayer} prayer points` : ''}
                {it.slot ? `Equipment (${it.slot})` : ''}
              </div>
              <button
                className="btn primary"
                disabled={!affordable}
                onClick={() => dispatch({ type: 'BUY', itemId: e.itemId })}
              >
                Buy — 🪙 {e.price.toLocaleString()}
              </button>
            </div>
          );
        })}
      </div>

      <h3 className="section-title">🧣 Capes of Accomplishment</h3>
      {maxedSkills.length === 0 ? (
        <p className="muted small">
          Reach level 99 in a skill and the Cape Merchant will sell you its cape (99,000 gold).
        </p>
      ) : (
        <div className="card-grid">
          {maxedSkills.map((sk) => (
            <div key={sk.id} className="card">
              <div className="card-title">
                🧣 {sk.name} Cape
              </div>
              <div className="muted small">A mark of true mastery. +8 defence.</div>
              <button
                className="btn primary"
                disabled={s.gold < 99000}
                onClick={() => dispatch({ type: 'BUY_CAPE', skill: sk.id })}
              >
                Buy — 🪙 99,000
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
