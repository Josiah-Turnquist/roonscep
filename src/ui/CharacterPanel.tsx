import { useRef, useState } from 'react';
import { ACHIEVEMENTS } from '../game/achievements';
import { useDispatch, useGame, SAVE_KEY } from '../state/store';
import { StatKey } from '../game/types';

const STAT_ROWS: { key: StatKey; label: string; icon: string }[] = [
  { key: 'totalKills', label: 'Monsters slain', icon: '⚔️' },
  { key: 'deaths', label: 'Deaths', icon: '💀' },
  { key: 'damageDealt', label: 'Damage dealt', icon: '💥' },
  { key: 'damageTaken', label: 'Damage taken', icon: '🩸' },
  { key: 'goldEarned', label: 'Gold earned', icon: '🪙' },
  { key: 'goldSpent', label: 'Gold spent', icon: '🛒' },
  { key: 'itemsGathered', label: 'Resources gathered', icon: '🧺' },
  { key: 'itemsCrafted', label: 'Items crafted', icon: '🔨' },
  { key: 'foodEaten', label: 'Food eaten', icon: '🍽️' },
  { key: 'potionsDrunk', label: 'Potions drunk', icon: '🧪' },
  { key: 'bonesBuried', label: 'Bones buried', icon: '⚰️' },
  { key: 'pickpockets', label: 'Pockets picked', icon: '🎭' },
  { key: 'tasksCompleted', label: 'Slayer tasks done', icon: '📋' },
  { key: 'questsCompleted', label: 'Quests completed', icon: '📜' },
];

export default function CharacterPanel() {
  const s = useGame();
  const dispatch = useDispatch();
  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);
  const importRef = useRef<HTMLTextAreaElement>(null);

  const exportSave = async () => {
    const raw = localStorage.getItem(SAVE_KEY) ?? '';
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — select the text in the import box instead
      setImportText(raw);
      importRef.current?.select();
    }
  };

  const importSave = () => {
    try {
      const parsed = JSON.parse(importText);
      if (typeof parsed !== 'object' || !parsed.xp) throw new Error('bad save');
      localStorage.setItem(SAVE_KEY, importText);
      window.location.reload();
    } catch {
      alert('That does not look like a valid Skillbound save.');
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>🧙 Character</h2>
        <p className="muted">
          Achievements: {s.achievements.length}/{ACHIEVEMENTS.length}
        </p>
      </div>

      <h3 className="section-title">🏅 Achievements</h3>
      <div className="ach-grid">
        {ACHIEVEMENTS.map((a) => {
          const earned = s.achievements.includes(a.id);
          return (
            <div key={a.id} className={`ach ${earned ? 'earned' : ''}`} title={a.desc}>
              <span className="ach-icon">{earned ? a.icon : '🔒'}</span>
              <span className="ach-name">{a.name}</span>
              <span className="ach-desc muted small">{a.desc}</span>
            </div>
          );
        })}
      </div>

      <h3 className="section-title">📊 Statistics</h3>
      <div className="stats-grid">
        {STAT_ROWS.map((r) => (
          <div key={r.key} className="stat-row">
            <span>{r.icon} {r.label}</span>
            <strong>{s.stats[r.key].toLocaleString()}</strong>
          </div>
        ))}
      </div>

      <h3 className="section-title">⚙️ Settings</h3>
      <div className="settings">
        <label className="setting-row">
          <input
            type="checkbox"
            checked={s.settings.autoEat}
            onChange={(e) => dispatch({ type: 'SET_SETTINGS', patch: { autoEat: e.target.checked } })}
          />
          Auto-eat food in combat when HP drops below{' '}
          <select
            value={s.settings.autoEatThreshold}
            onChange={(e) =>
              dispatch({ type: 'SET_SETTINGS', patch: { autoEatThreshold: Number(e.target.value) } })
            }
          >
            <option value={0.25}>25%</option>
            <option value={0.4}>40%</option>
            <option value={0.55}>55%</option>
            <option value={0.7}>70%</option>
          </select>
        </label>
        <p className="muted small">
          Offline progress: gathering, thieving and crafting continue for up to 6 hours while the
          game is closed. Combat pauses.
        </p>
        <div className="save-tools">
          <button className="btn" onClick={exportSave}>
            {copied ? '✓ Copied!' : '📤 Export save to clipboard'}
          </button>
        </div>
        <div className="save-tools">
          <textarea
            ref={importRef}
            placeholder="Paste a save here to import…"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={3}
          />
          <button className="btn" disabled={!importText.trim()} onClick={importSave}>
            📥 Import save
          </button>
        </div>
        <button
          className="btn danger"
          onClick={() => {
            if (window.confirm('Erase all progress and start over?')) dispatch({ type: 'RESET' });
          }}
        >
          🗑️ New Game
        </button>
      </div>
    </div>
  );
}
