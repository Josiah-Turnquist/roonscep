import { useState } from 'react';
import { SkillId } from '../game/types';
import { useGame } from '../state/store';
import { combatLevel, maxHp } from '../game/combat';
import { levelForXp } from '../game/xp';
import Sidebar from './Sidebar';
import SkillPanel from './SkillPanel';
import CombatPanel from './CombatPanel';
import BossPanel from './BossPanel';
import InventoryPanel from './InventoryPanel';
import ShopPanel from './ShopPanel';
import LogPanel from './LogPanel';

export type Tab = 'skills' | 'combat' | 'bosses' | 'inventory' | 'shop';

const TABS: { id: Tab; label: string }[] = [
  { id: 'skills', label: '🛠️ Skills' },
  { id: 'combat', label: '⚔️ Combat' },
  { id: 'bosses', label: '👹 Bosses' },
  { id: 'inventory', label: '🎒 Inventory' },
  { id: 'shop', label: '🛒 Shop' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('skills');
  const [selectedSkill, setSelectedSkill] = useState<SkillId>('woodcutting');
  const s = useGame();

  const totalLevel = Object.values(s.xp).reduce((sum, xp) => sum + levelForXp(xp), 0);
  const hp = maxHp(s);

  return (
    <div className="app">
      <header className="header">
        <h1 className="brand">⚔️ Skillbound</h1>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="header-stats">
          <span title="Hitpoints" className="hp-pill">
            ❤️ {s.currentHp}/{hp}
          </span>
          <span title="Combat level">⚔️ {combatLevel(s)}</span>
          <span title="Total level">📜 {totalLevel}</span>
          <span title="Gold">🪙 {s.gold.toLocaleString()}</span>
        </div>
      </header>
      <div className="layout">
        <Sidebar
          selectedSkill={selectedSkill}
          onSelect={(id) => {
            setSelectedSkill(id);
            setTab('skills');
          }}
        />
        <main className="main">
          {tab === 'skills' && <SkillPanel skill={selectedSkill} onGoCombat={() => setTab('combat')} />}
          {tab === 'combat' && <CombatPanel />}
          {tab === 'bosses' && <BossPanel />}
          {tab === 'inventory' && <InventoryPanel />}
          {tab === 'shop' && <ShopPanel />}
        </main>
        <LogPanel />
      </div>
    </div>
  );
}
