import { SkillId } from '../game/types';
import { SKILLS, SkillCategory } from '../game/skills';
import { useDispatch, useGame } from '../state/store';
import { levelForXp, levelProgress, MAX_LEVEL } from '../game/xp';

const CATEGORIES: SkillCategory[] = ['Combat', 'Gathering', 'Artisan'];

export default function Sidebar({
  selectedSkill,
  onSelect,
}: {
  selectedSkill: SkillId;
  onSelect: (id: SkillId) => void;
}) {
  const s = useGame();
  const dispatch = useDispatch();

  return (
    <aside className="sidebar">
      {CATEGORIES.map((cat) => (
        <div key={cat} className="skill-group">
          <h3 className="skill-group-title">{cat}</h3>
          {SKILLS.filter((sk) => sk.category === cat).map((sk) => {
            const level = levelForXp(s.xp[sk.id]);
            const pct = Math.round(levelProgress(s.xp[sk.id]) * 100);
            return (
              <button
                key={sk.id}
                className={`skill-row ${selectedSkill === sk.id ? 'selected' : ''}`}
                onClick={() => onSelect(sk.id)}
              >
                <span className="skill-icon">{sk.icon}</span>
                <span className="skill-name">{sk.name}</span>
                <span className={`skill-level ${level >= MAX_LEVEL ? 'maxed' : ''}`}>{level}</span>
                <span className="skill-bar">
                  <span className="skill-bar-fill" style={{ width: `${pct}%` }} />
                </span>
              </button>
            );
          })}
        </div>
      ))}
      <button
        className="btn danger small reset-btn"
        onClick={() => {
          if (window.confirm('Erase all progress and start over?')) dispatch({ type: 'RESET' });
        }}
      >
        🗑️ New Game
      </button>
    </aside>
  );
}
