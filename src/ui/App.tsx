import { useState } from 'react';
import { SkillId } from '../game/types';
import { useGame } from '../state/store';
import { combatLevel, maxHp, maxPrayerPoints } from '../game/combat';
import { levelForXp } from '../game/xp';
import { MONSTER_MAP } from '../game/monsters';
import Sidebar from './Sidebar';
import SkillPanel from './SkillPanel';
import CombatPanel from './CombatPanel';
import SlayerPanel from './SlayerPanel';
import BossPanel from './BossPanel';
import QuestPanel from './QuestPanel';
import InventoryPanel from './InventoryPanel';
import ShopPanel from './ShopPanel';
import CharacterPanel from './CharacterPanel';
import LogPanel from './LogPanel';

export type Tab = 'skills' | 'combat' | 'slayer' | 'bosses' | 'quests' | 'inventory' | 'shop' | 'character';

const TABS: { id: Tab; label: string }[] = [
  { id: 'skills', label: '🛠️ Skills' },
  { id: 'combat', label: '⚔️ Combat' },
  { id: 'slayer', label: '💀 Slayer' },
  { id: 'bosses', label: '👹 Bosses' },
  { id: 'quests', label: '📜 Quests' },
  { id: 'inventory', label: '🎒 Inventory' },
  { id: 'shop', label: '🛒 Shop' },
  { id: 'character', label: '🧙 Character' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('skills');
  const [selectedSkill, setSelectedSkill] = useState<SkillId>('woodcutting');
  const s = useGame();

  const totalLevel = Object.values(s.xp).reduce((sum, xp) => sum + levelForXp(xp), 0);
  const hp = maxHp(s);
  const task = s.slayerTask;

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
          {task && (
            <button className="task-chip" title="Current slayer task" onClick={() => setTab('slayer')}>
              💀 {MONSTER_MAP[task.monsterId]?.icon} {task.remaining}/{task.total}
            </button>
          )}
          <span title="Hitpoints" className="hp-pill">
            ❤️ {s.currentHp}/{hp}
          </span>
          <span title="Prayer points" className="prayer-pill">
            🙏 {s.prayerPoints}/{maxPrayerPoints(s)}
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
          {tab === 'skills' && (
            <SkillPanel
              skill={selectedSkill}
              onGoCombat={() => setTab('combat')}
              onGoSlayer={() => setTab('slayer')}
            />
          )}
          {tab === 'combat' && <CombatPanel />}
          {tab === 'slayer' && <SlayerPanel />}
          {tab === 'bosses' && <BossPanel />}
          {tab === 'quests' && <QuestPanel />}
          {tab === 'inventory' && <InventoryPanel />}
          {tab === 'shop' && <ShopPanel />}
          {tab === 'character' && <CharacterPanel />}
        </main>
        <LogPanel />
      </div>
    </div>
  );
}
