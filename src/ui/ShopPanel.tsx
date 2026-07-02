import { SHOP } from '../game/shop';
import { ITEMS } from '../game/items';
import { useDispatch, useGame } from '../state/store';

export default function ShopPanel() {
  const s = useGame();
  const dispatch = useDispatch();

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
    </div>
  );
}
