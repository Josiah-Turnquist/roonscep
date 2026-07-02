import { ReactNode } from 'react';
import { NpcDef, StationType } from '../game/world';
import { QUEST_MAP, objectiveProgress, questReadyToTurnIn, questReqsMet } from '../game/quests';
import { QuestObjective } from '../game/types';
import { MONSTER_MAP } from '../game/monsters';
import { ITEMS } from '../game/items';
import { SKILL_MAP } from '../game/skills';
import { THIEVE_MAP } from '../game/actions';
import { RECIPES } from '../game/recipes';
import { SLAYER_MASTER_MAP, SLAYER_REWARDS } from '../game/slayer';
import { useDispatch, useGame } from '../state/store';
import { combatLevel, lvl } from '../game/combat';
import ShopPanel from './ShopPanel';

function Modal({ title, icon, onClose, children }: { title: string; icon: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-head">
          <span className="dialog-title">
            {icon} {title}
          </span>
          <button className="btn small" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="dialog-body">{children}</div>
      </div>
    </div>
  );
}

function objectiveLabel(o: QuestObjective): string {
  if (o.type === 'kill') return `Slay ${o.count}× ${MONSTER_MAP[o.monsterId]?.name}`;
  if (o.type === 'item') return `Bring ${o.qty}× ${ITEMS[o.itemId]?.name}`;
  const statLabels: Record<string, string> = { bonesBuried: 'Bury bones', pickpockets: 'Pickpocket successfully' };
  return `${statLabels[o.stat] ?? o.stat} ×${o.count}`;
}

export function NpcDialog({ npc, onClose }: { npc: NpcDef; onClose: () => void }) {
  const s = useGame();
  const dispatch = useDispatch();
  const cb = combatLevel(s);

  return (
    <Modal title={npc.name} icon={npc.icon} onClose={onClose}>
      <p className="dialog-flavor">“{npc.dialog}”</p>

      {npc.kind === 'shop' && <ShopPanel />}

      {npc.kind === 'thieve' && npc.thieveId && (
        <div className="dialog-section">
          {(() => {
            const t = THIEVE_MAP[npc.thieveId!];
            const level = lvl(s, 'thieving');
            return (
              <>
                <p className="muted small">
                  Thieving {t.level} · {t.xp} xp · 🪙 {t.gold[0]}–{t.gold[1]} per pick · caught: {t.failDamage[0]}–{t.failDamage[1]} dmg + stun
                </p>
                <button
                  className="btn primary"
                  disabled={level < t.level}
                  onClick={() => {
                    dispatch({ type: 'START_THIEVE', id: t.id });
                    onClose();
                  }}
                >
                  {level < t.level ? `🔒 Thieving ${t.level}` : '🤏 Pickpocket'}
                </button>
              </>
            );
          })()}
        </div>
      )}

      {npc.kind === 'slayer' && npc.masterId && (
        <div className="dialog-section">
          {(() => {
            const master = SLAYER_MASTER_MAP[npc.masterId!];
            const task = s.slayerTask;
            if (cb < master.minCombat) {
              return <p className="muted">Come back at combat level {master.minCombat}, fledgling.</p>;
            }
            return (
              <>
                {task ? (
                  <p className="small">
                    Current task: {MONSTER_MAP[task.monsterId]?.icon} {task.remaining}/{task.total}{' '}
                    {MONSTER_MAP[task.monsterId]?.name} remaining.
                  </p>
                ) : (
                  <p className="muted small">
                    {master.count[0]}–{master.count[1]} kills · {master.points} slayer points per task
                  </p>
                )}
                <div className="inv-actions">
                  <button
                    className="btn primary"
                    disabled={!!task}
                    onClick={() => dispatch({ type: 'NEW_TASK', masterId: master.id })}
                  >
                    📋 New task
                  </button>
                  {task && (
                    <button className="btn danger" onClick={() => dispatch({ type: 'ABANDON_TASK' })}>
                      Abandon task
                    </button>
                  )}
                </div>
                <h4 className="section-title">Rewards ({s.slayerPoints} points)</h4>
                <div className="dialog-rewards">
                  {SLAYER_REWARDS.map((r) => (
                    <button
                      key={r.id}
                      className="btn small"
                      title={r.desc}
                      disabled={s.slayerPoints < r.cost || (r.id === 'slayer_cape' && lvl(s, 'slayer') < 50)}
                      onClick={() => dispatch({ type: 'BUY_SLAYER_REWARD', id: r.id })}
                    >
                      {r.icon} {r.name} — {r.cost} pts
                    </button>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {npc.kind === 'quest' &&
        npc.questIds?.map((qid) => {
          const q = QUEST_MAP[qid];
          const progress = s.quests[q.id];
          const status = progress?.status;
          const reqsMet = questReqsMet(s, q, cb);
          const ready = questReadyToTurnIn(s, q);
          const obj = objectiveProgress(s, q);
          return (
            <div key={qid} className="dialog-section quest-block">
              <div className="card-title">
                {q.icon} {q.name} {status === 'done' && <span className="kill-badge">✓ Complete</span>}
              </div>
              <p className="muted small">{q.flavor}</p>
              {status !== 'done' && (
                <ul className="objective-list">
                  {q.objectives.map((o, i) => (
                    <li key={i} className={`small ${status === 'active' && obj[i][0] >= obj[i][1] ? 'have' : ''}`}>
                      {status === 'active' && obj[i][0] >= obj[i][1] ? '✅' : '▫️'} {objectiveLabel(o)}
                      {status === 'active' ? ` (${obj[i][0]}/${obj[i][1]})` : ''}
                    </li>
                  ))}
                </ul>
              )}
              {status !== 'done' && (
                <div className="small muted">
                  Rewards: {q.rewards.gold ? `🪙 ${q.rewards.gold.toLocaleString()}` : ''}
                  {q.rewards.xp?.map((x) => ` · ${x.amount.toLocaleString()} ${SKILL_MAP[x.skill].name} xp`).join('')}
                  {q.rewards.items?.map((it) => ` · ${it.qty}× ${ITEMS[it.itemId]?.name}`).join('')}
                </div>
              )}
              {status === undefined &&
                (reqsMet ? (
                  <button className="btn primary" onClick={() => dispatch({ type: 'ACCEPT_QUEST', id: q.id })}>
                    📜 Accept quest
                  </button>
                ) : (
                  <div className="lock-note">
                    🔒 Requires {q.reqCombat ? `combat ${q.reqCombat}` : ''}
                    {q.reqCombat && q.reqQuests?.length ? ' · ' : ''}
                    {q.reqQuests?.map((id) => QUEST_MAP[id]?.name).join(', ')}
                  </div>
                ))}
              {status === 'active' && (
                <button
                  className="btn primary"
                  disabled={!ready}
                  onClick={() => dispatch({ type: 'COMPLETE_QUEST', id: q.id })}
                >
                  🏵️ Turn in
                </button>
              )}
            </div>
          );
        })}
    </Modal>
  );
}

const STATION_INFO: Record<StationType, { title: string; icon: string }> = {
  furnace: { title: 'Furnace', icon: '🔥' },
  anvil: { title: 'Anvil', icon: '⚒️' },
  range: { title: 'Cooking Range', icon: '🍲' },
};

export function StationDialog({ station, onClose }: { station: StationType; onClose: () => void }) {
  const s = useGame();
  const dispatch = useDispatch();
  const recipes = RECIPES.filter((r) => r.station === station);
  const info = STATION_INFO[station];

  return (
    <Modal title={info.title} icon={info.icon} onClose={onClose}>
      <div className="card-grid">
        {recipes.map((r) => {
          const locked = lvl(s, r.skill) < r.level;
          const affordable =
            (r.goldCost ?? 0) <= s.gold &&
            Object.entries(r.inputs).every(([id, qty]) => (s.inventory[id] ?? 0) >= qty);
          const active = s.activity?.type === 'craft' && s.activity.recipeId === r.id;
          return (
            <div key={r.id} className={`card ${locked ? 'locked' : ''} ${active ? 'active' : ''}`}>
              <div className="card-title">
                {r.icon} {r.name}
              </div>
              <div className="muted small">
                Level {r.level} · {r.xp} xp{r.burnChance !== undefined ? ' · may burn' : ''}
              </div>
              <span className="recipe-inputs">
                {Object.entries(r.inputs).map(([id, qty]) => (
                  <span key={id} className={(s.inventory[id] ?? 0) >= qty ? 'have' : 'missing'}>
                    {ITEMS[id]?.icon} {qty}× {ITEMS[id]?.name} ({s.inventory[id] ?? 0})
                  </span>
                ))}
              </span>
              {locked ? (
                <div className="lock-note">🔒 Level {r.level}</div>
              ) : active ? (
                <button className="btn danger" onClick={() => dispatch({ type: 'STOP' })}>
                  ⏹ Stop
                </button>
              ) : (
                <button
                  className="btn primary"
                  disabled={!affordable}
                  onClick={() => {
                    dispatch({ type: 'START_CRAFT', id: r.id });
                    onClose();
                  }}
                >
                  ▶ Make
                </button>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
