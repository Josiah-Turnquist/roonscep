import { EquipSlot } from '../game/types';
import { ITEMS } from '../game/items';
import { useDispatch, useGame } from '../state/store';
import { equipmentBonuses } from '../game/combat';

const SLOTS: { slot: EquipSlot; label: string; empty: string }[] = [
  { slot: 'weapon', label: 'Weapon', empty: '🤜' },
  { slot: 'helmet', label: 'Helmet', empty: '🪖' },
  { slot: 'body', label: 'Body', empty: '🎽' },
  { slot: 'legs', label: 'Legs', empty: '👖' },
  { slot: 'shield', label: 'Shield', empty: '🛡️' },
  { slot: 'amulet', label: 'Amulet', empty: '📿' },
  { slot: 'cape', label: 'Cape', empty: '🧣' },
];

function bonusLine(id: string): string {
  const it = ITEMS[id];
  const parts: string[] = [];
  if (it.attackBonus) parts.push(`+${it.attackBonus} att`);
  if (it.strengthBonus) parts.push(`+${it.strengthBonus} str`);
  if (it.rangedBonus) parts.push(`+${it.rangedBonus} rng`);
  if (it.magicBonus) parts.push(`+${it.magicBonus} mag`);
  if (it.defenceBonus) parts.push(`+${it.defenceBonus} def`);
  return parts.join(' ');
}

export default function InventoryPanel() {
  const s = useGame();
  const dispatch = useDispatch();
  const b = equipmentBonuses(s);
  const items = Object.entries(s.inventory).sort(([a], [z]) =>
    (ITEMS[a]?.name ?? a).localeCompare(ITEMS[z]?.name ?? z),
  );

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Inventory & Equipment</h2>
        <p className="muted small">
          Totals: +{b.attack} att · +{b.strength} str · +{b.ranged} rng · +{b.magic} mag · +{b.defence} def
        </p>
      </div>

      <div className="equip-row">
        {SLOTS.map(({ slot, label, empty }) => {
          const id = s.equipment[slot];
          return (
            <button
              key={slot}
              className={`equip-slot ${id ? 'filled' : ''}`}
              title={id ? `${ITEMS[id].name} (${bonusLine(id)}) — click to unequip` : `${label} (empty)`}
              onClick={() => id && dispatch({ type: 'UNEQUIP', slot })}
            >
              <span className="equip-icon">{id ? ITEMS[id].icon : empty}</span>
              <span className="equip-label">{id ? ITEMS[id].name : label}</span>
            </button>
          );
        })}
      </div>

      {items.length === 0 ? (
        <p className="muted">Your bag is empty. Go gather, fight, or shop!</p>
      ) : (
        <div className="inv-grid">
          {items.map(([id, qty]) => {
            const it = ITEMS[id];
            if (!it) return null;
            return (
              <div key={id} className="inv-item">
                <div className="inv-head">
                  <span className="inv-icon">{it.icon}</span>
                  <span className="inv-name">
                    {it.name} <span className="muted">×{qty}</span>
                  </span>
                </div>
                <div className="muted small">
                  {bonusLine(id)}
                  {it.heals ? `heals ${it.heals}` : ''}
                  {it.boost ? `+${it.boost.amount} ${it.boost.skill}` : ''}
                  {it.restorePrayer ? `restores ${it.restorePrayer} prayer` : ''}
                  {it.bury ? `${it.bury.xp} prayer xp buried` : ''}
                  {!bonusLine(id) && !it.heals && !it.boost && !it.restorePrayer && !it.bury
                    ? `worth ${it.value.toLocaleString()} gold`
                    : ''}
                </div>
                <div className="inv-actions">
                  {it.slot && (
                    <button className="btn small" onClick={() => dispatch({ type: 'EQUIP', itemId: id })}>
                      Equip
                    </button>
                  )}
                  {it.heals && (
                    <button className="btn small" onClick={() => dispatch({ type: 'EAT', itemId: id })}>
                      Eat
                    </button>
                  )}
                  {(it.boost || it.restorePrayer) && (
                    <button className="btn small" onClick={() => dispatch({ type: 'DRINK', itemId: id })}>
                      Drink
                    </button>
                  )}
                  {it.bury && (
                    <button className="btn small" onClick={() => dispatch({ type: 'BURY', itemId: id, qty })}>
                      Bury all
                    </button>
                  )}
                  <button className="btn small" onClick={() => dispatch({ type: 'SELL', itemId: id, qty: 1 })}>
                    Sell ({it.value.toLocaleString()})
                  </button>
                  {qty > 1 && (
                    <button className="btn small" onClick={() => dispatch({ type: 'SELL', itemId: id, qty })}>
                      Sell all
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
