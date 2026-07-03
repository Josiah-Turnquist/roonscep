import { useState } from 'react';
import { SkillId } from '../game/types';
import { useGame } from '../state/store';
import { combatLevel, maxHp, maxPrayerPoints } from '../game/combat';
import { levelForXp } from '../game/xp';
import { MONSTER_MAP } from '../game/monsters';
import WorldView from './WorldView';
import Sidebar from './Sidebar';
import SkillPanel from './SkillPanel';
import QuestPanel from './QuestPanel';
import SlayerPanel from './SlayerPanel';
import InventoryPanel from './InventoryPanel';
import CharacterPanel from './CharacterPanel';
import LogPanel from './LogPanel';

type SideTab = 'skills' | 'inventory' | 'quests' | 'slayer' | 'character';

const SIDE_TABS: { id: SideTab; icon: string; label: string }[] = [
  { id: 'skills', icon: '🛠️', label: 'Skills' },
  { id: 'inventory', icon: '🎒', label: 'Bag' },
  { id: 'quests', icon: '📜', label: 'Quests' },
  { id: 'slayer', icon: '💀', label: 'Slayer' },
  { id: 'character', icon: '🧙', label: 'You' },
];

export default function App() {
  const [tab, setTab] = useState<SideTab>('skills');
  const [selectedSkill, setSelectedSkill] = useState<SkillId | null>(null);
  const s = useGame();

  const totalLevel = Object.values(s.xp).reduce((sum, xp) => sum + levelForXp(xp), 0);
  const hp = maxHp(s);
  const task = s.slayerTask;

  return (
    <div className="app">
      <header className="header">
        <h1 className="brand">⚔️ Roonscep</h1>
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
      <div className="game-layout">
        <div className="viewport-col">
          <WorldView />
          <LogPanel />
        </div>
        <aside className="side-panel">
          <nav className="side-tabs">
            {SIDE_TABS.map((t) => (
              <button
                key={t.id}
                className={`side-tab ${tab === t.id ? 'active' : ''}`}
                title={t.label}
                onClick={() => {
                  setTab(t.id);
                  if (t.id === 'skills') setSelectedSkill(null);
                }}
              >
                <span className="side-tab-icon">{t.icon}</span>
                <span className="side-tab-label">{t.label}</span>
              </button>
            ))}
          </nav>
          <div className="side-content">
            {tab === 'skills' &&
              (selectedSkill ? (
                <>
                  <button className="btn small back-btn" onClick={() => setSelectedSkill(null)}>
                    ← All skills
                  </button>
                  <SkillPanel skill={selectedSkill} />
                </>
              ) : (
                <Sidebar selectedSkill={null} onSelect={setSelectedSkill} />
              ))}
            {tab === 'inventory' && <InventoryPanel />}
            {tab === 'quests' && <QuestPanel />}
            {tab === 'slayer' && <SlayerPanel />}
            {tab === 'character' && <CharacterPanel />}
          </div>
        </aside>
      </div>
    </div>
  );
}
