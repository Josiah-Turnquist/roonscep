import { Recipe, SkillId } from '../game/types';
import { SKILL_MAP, COMBAT_SKILLS } from '../game/skills';
import { GATHER_ACTIONS, THIEVE_ACTIONS } from '../game/actions';
import { RECIPES } from '../game/recipes';
import { ITEMS } from '../game/items';
import { PRAYERS } from '../game/prayers';
import { useDispatch, useGame } from '../state/store';
import { levelForXp, xpForLevel, MAX_LEVEL } from '../game/xp';
import { lvl, maxPrayerPoints } from '../game/combat';

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

function PrayerPanel() {
  const s = useGame();
  const dispatch = useDispatch();
  const level = lvl(s, 'prayer');
  const bones = Object.entries(s.inventory).filter(([id]) => ITEMS[id]?.bury);

  return (
    <>
      <h3 className="section-title">⚰️ Bury Bones</h3>
      {bones.length === 0 ? (
        <p className="muted small">No bones in your bag. Monsters drop them generously.</p>
      ) : (
        <div className="card-grid">
          {bones.map(([id, qty]) => {
            const it = ITEMS[id];
            return (
              <div key={id} className="card">
                <div className="card-title">
                  {it.icon} {it.name} <span className="muted">×{qty}</span>
                </div>
                <div className="muted small">
                  {it.bury!.xp} xp + {it.bury!.points} prayer points each
                </div>
                <div className="inv-actions">
                  <button className="btn small" onClick={() => dispatch({ type: 'BURY', itemId: id, qty: 1 })}>
                    Bury 1
                  </button>
                  <button className="btn small primary" onClick={() => dispatch({ type: 'BURY', itemId: id, qty })}>
                    Bury all
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <h3 className="section-title">
        🙏 Prayers <span className="muted small">({s.prayerPoints}/{maxPrayerPoints(s)} points — drain per combat round)</span>
      </h3>
      <div className="card-grid">
        {PRAYERS.map((p) => {
          const locked = level < p.level;
          const active = s.activePrayers.includes(p.id);
          return (
            <div key={p.id} className={`card ${locked ? 'locked' : ''} ${active ? 'active' : ''}`}>
              <div className="card-title">
                {p.icon} {p.name}
              </div>
              <div className="muted small">
                Level {p.level} · {p.desc} · drains {p.drain}/round
              </div>
              {locked ? (
                <div className="lock-note">🔒 Requires level {p.level}</div>
              ) : (
                <button
                  className={`btn ${active ? 'active-toggle' : 'primary'}`}
                  onClick={() => dispatch({ type: 'TOGGLE_PRAYER', id: p.id })}
                >
                  {active ? '✓ Active' : 'Activate'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function ThievingPanel() {
  const s = useGame();
  const dispatch = useDispatch();
  const level = lvl(s, 'thieving');

  return (
    <div className="card-grid">
      {THIEVE_ACTIONS.map((t) => {
        const locked = level < t.level;
        const active = s.activity?.type === 'thieve' && s.activity.targetId === t.id;
        return (
          <div key={t.id} className={`card ${locked ? 'locked' : ''} ${active ? 'active' : ''}`}>
            <div className="card-title">
              {t.icon} {t.name}
            </div>
            <div className="muted small">
              Level {t.level} · {t.xp} xp · 🪙 {t.gold[0]}–{t.gold[1]} per pick
            </div>
            <div className="muted small">Caught: {t.failDamage[0]}–{t.failDamage[1]} damage + stun</div>
            {locked ? (
              <div className="lock-note">🔒 Requires level {t.level}</div>
            ) : active ? (
              <button className="btn danger" onClick={() => dispatch({ type: 'STOP' })}>
                ⏹ Stop
              </button>
            ) : (
              <button className="btn primary" onClick={() => dispatch({ type: 'START_THIEVE', id: t.id })}>
                🤏 Pickpocket
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function SkillPanel({
  skill,
  onGoCombat,
  onGoSlayer,
}: {
  skill: SkillId;
  onGoCombat: () => void;
  onGoSlayer: () => void;
}) {
  const s = useGame();
  const dispatch = useDispatch();

  if (skill === 'prayer') {
    return (
      <div className="panel">
        <ProgressHeader skill={skill} />
        <PrayerPanel />
      </div>
    );
  }

  if (skill === 'thieving') {
    return (
      <div className="panel">
        <ProgressHeader skill={skill} />
        <ThievingPanel />
      </div>
    );
  }

  if (skill === 'slayer') {
    return (
      <div className="panel">
        <ProgressHeader skill={skill} />
        <p>Take kill contracts from slayer masters to earn Slayer xp and points.</p>
        <button className="btn primary" onClick={onGoSlayer}>
          💀 Visit the Slayer Masters
        </button>
      </div>
    );
  }

  if (COMBAT_SKILLS.includes(skill)) {
    return (
      <div className="panel">
        <ProgressHeader skill={skill} />
        <p>
          {skill === 'ranged'
            ? 'Equip a bow and fight to train Ranged.'
            : skill === 'magic'
              ? 'Equip a staff and fight to train Magic.'
              : 'Fight monsters and bosses to train this skill. Pick an attack style in combat to direct your xp.'}
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
                {r.outputQty && r.outputQty > 1 ? ` · makes ${r.outputQty}` : ''}
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
