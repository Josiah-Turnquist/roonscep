import { Recipe, SkillId } from '../game/types';
import { SKILL_MAP, COMBAT_SKILLS } from '../game/skills';
import { GATHER_ACTIONS } from '../game/actions';
import { RECIPES } from '../game/recipes';
import { ITEMS } from '../game/items';
import { useDispatch, useGame } from '../state/store';
import { levelForXp, xpForLevel, MAX_LEVEL } from '../game/xp';
import { lvl } from '../game/combat';

function ProgressHeader({ skill }: { skill: SkillId }) {
  const s = useGame();
  const def = SKILL_MAP[skill];
  const xp = s.xp[skill];
  const level = levelForXp(xp);
  const next = level >= MAX_LEVEL ? null : xpForLevel(level + 1);
  return (
    <div className="panel-header">
      <h2>
        {def.icon} {def.name} <span className="muted">— level {level}</span>
      </h2>
      <p className="muted">{def.blurb}</p>
      <p className="muted small">
        {Math.floor(xp).toLocaleString()} xp
        {next ? ` · ${(next - Math.floor(xp)).toLocaleString()} to level ${level + 1}` : ' · MAXED 🏆'}
      </p>
    </div>
  );
}

function RecipeInputs({ recipe }: { recipe: Recipe }) {
  const s = useGame();
  return (
    <span className="recipe-inputs">
      {Object.entries(recipe.inputs).map(([id, qty]) => {
        const have = s.inventory[id] ?? 0;
        return (
          <span key={id} className={have >= qty ? 'have' : 'missing'}>
            {ITEMS[id]?.icon} {qty}× {ITEMS[id]?.name} ({have})
          </span>
        );
      })}
      {recipe.goldCost ? <span className={s.gold >= recipe.goldCost ? 'have' : 'missing'}>🪙 {recipe.goldCost}</span> : null}
    </span>
  );
}

export default function SkillPanel({ skill, onGoCombat }: { skill: SkillId; onGoCombat: () => void }) {
  const s = useGame();
  const dispatch = useDispatch();

  if (COMBAT_SKILLS.includes(skill)) {
    return (
      <div className="panel">
        <ProgressHeader skill={skill} />
        <p>
          {skill === 'ranged'
            ? 'Equip a bow and fight to train Ranged.'
            : skill === 'magic'
              ? 'Equip a staff and fight to train Magic.'
              : 'Fight monsters and bosses to train this skill.'}
        </p>
        <button className="btn primary" onClick={onGoCombat}>
          ⚔️ Go to Combat
        </button>
      </div>
    );
  }

  const actions = GATHER_ACTIONS.filter((a) => a.skill === skill);
  const recipes = RECIPES.filter((r) => r.skill === skill);
  const level = lvl(s, skill);

  return (
    <div className="panel">
      <ProgressHeader skill={skill} />
      <div className="card-grid">
        {actions.map((a) => {
          const locked = level < a.level;
          const active = s.activity?.type === 'gather' && s.activity.actionId === a.id;
          return (
            <div key={a.id} className={`card ${locked ? 'locked' : ''} ${active ? 'active' : ''}`}>
              <div className="card-title">
                {a.icon} {a.name}
              </div>
              <div className="muted small">
                Level {a.level} · {a.xp} xp · yields {ITEMS[a.output]?.icon} {ITEMS[a.output]?.name}
              </div>
              {locked ? (
                <div className="lock-note">🔒 Requires level {a.level}</div>
              ) : active ? (
                <button className="btn danger" onClick={() => dispatch({ type: 'STOP' })}>
                  ⏹ Stop
                </button>
              ) : (
                <button className="btn primary" onClick={() => dispatch({ type: 'START_GATHER', id: a.id })}>
                  ▶ Start
                </button>
              )}
            </div>
          );
        })}
        {recipes.map((r) => {
          const locked = level < r.level;
          const active = s.activity?.type === 'craft' && s.activity.recipeId === r.id;
          const affordable =
            (r.goldCost ?? 0) <= s.gold &&
            Object.entries(r.inputs).every(([id, qty]) => (s.inventory[id] ?? 0) >= qty);
          return (
            <div key={r.id} className={`card ${locked ? 'locked' : ''} ${active ? 'active' : ''}`}>
              <div className="card-title">
                {r.icon} {r.name}
              </div>
              <div className="muted small">
                Level {r.level} · {r.xp} xp
                {r.burnChance !== undefined ? ' · may burn' : ''}
              </div>
              <RecipeInputs recipe={r} />
              {locked ? (
                <div className="lock-note">🔒 Requires level {r.level}</div>
              ) : active ? (
                <button className="btn danger" onClick={() => dispatch({ type: 'STOP' })}>
                  ⏹ Stop
                </button>
              ) : (
                <button
                  className="btn primary"
                  disabled={!affordable}
                  onClick={() => dispatch({ type: 'START_CRAFT', id: r.id })}
                >
                  ▶ Make
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
