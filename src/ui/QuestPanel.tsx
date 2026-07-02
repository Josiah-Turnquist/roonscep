import { QUESTS } from '../game/quests';
import { Quest, QuestObjective } from '../game/types';
import { MONSTER_MAP } from '../game/monsters';
import { ITEMS } from '../game/items';
import { SKILL_MAP } from '../game/skills';
import { useDispatch, useGame } from '../state/store';
import { combatLevel } from '../game/combat';

function objectiveLabel(o: QuestObjective): string {
  if (o.type === 'kill') return `Slay ${o.count}× ${MONSTER_MAP[o.monsterId]?.name}`;
  if (o.type === 'item') return `Deliver ${o.qty}× ${ITEMS[o.itemId]?.name}`;
  const statLabels: Record<string, string> = { bonesBuried: 'Bury bones', pickpockets: 'Pickpocket successfully' };
  return `${statLabels[o.stat] ?? o.stat} ×${o.count}`;
}

export default function QuestPanel() {
  const s = useGame();
  const dispatch = useDispatch();
  const cb = combatLevel(s);
  const done = QUESTS.filter((q) => s.quests[q.id]?.status === 'done').length;

  const progressOf = (q: Quest, o: QuestObjective): [number, number] => {
    const p = s.quests[q.id];
    if (o.type === 'kill') {
      const base = p?.killSnapshot[o.monsterId] ?? s.kills[o.monsterId] ?? 0;
      return [Math.min(o.count, (s.kills[o.monsterId] ?? 0) - base), o.count];
    }
    if (o.type === 'item') return [Math.min(o.qty, s.inventory[o.itemId] ?? 0), o.qty];
    const base = p?.statSnapshot[o.stat] ?? s.stats[o.stat];
    return [Math.min(o.count, s.stats[o.stat] - base), o.count];
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>📜 Quests</h2>
        <p className="muted">
          {done}/{QUESTS.length} complete. Accept a quest first — kill counts start from that moment.
        </p>
      </div>
      <div className="boss-list">
        {QUESTS.map((q) => {
          const p = s.quests[q.id];
          const status = p?.status;
          const reqsMet =
            (!q.reqCombat || cb >= q.reqCombat) &&
            (!q.reqQuests || q.reqQuests.every((id) => s.quests[id]?.status === 'done'));
          const complete =
            status === 'active' &&
            q.objectives.every((o) => {
              const [cur, total] = progressOf(q, o);
              return cur >= total;
            });
          return (
            <div
              key={q.id}
              className={`card boss-card ${status === 'done' ? 'defeated' : ''} ${!reqsMet && !status ? 'locked' : ''}`}
            >
              <div className="boss-icon">{q.icon}</div>
              <div className="boss-info">
                <div className="card-title">
                  {q.name} {status === 'done' && <span className="kill-badge">✓ Complete</span>}
                </div>
                <div className="muted small">{q.flavor}</div>
                {q.reqCombat || q.reqQuests ? (
                  <div className="small muted">
                    Requires: {q.reqCombat ? `combat ${q.reqCombat}` : ''}
                    {q.reqCombat && q.reqQuests?.length ? ' · ' : ''}
                    {q.reqQuests?.map((id) => QUESTS.find((x) => x.id === id)?.name).join(', ')}
                  </div>
                ) : null}
                {status !== 'done' && (
                  <ul className="objective-list">
                    {q.objectives.map((o, i) => {
                      const [cur, total] = progressOf(q, o);
                      const met = status === 'active' && cur >= total;
                      return (
                        <li key={i} className={`small ${met ? 'have' : ''}`}>
                          {met ? '✅' : '▫️'} {objectiveLabel(o)}
                          {status === 'active' ? ` (${cur}/${total})` : ''}
                        </li>
                      );
                    })}
                  </ul>
                )}
                <div className="small muted">
                  Rewards: {q.rewards.gold ? `🪙 ${q.rewards.gold.toLocaleString()}` : ''}
                  {q.rewards.xp?.map((x) => ` · ${x.amount.toLocaleString()} ${SKILL_MAP[x.skill].name} xp`).join('')}
                  {q.rewards.items?.map((it) => ` · ${it.qty}× ${ITEMS[it.itemId]?.name}`).join('')}
                </div>
              </div>
              {status === 'done' ? null : status === 'active' ? (
                <button
                  className="btn primary"
                  disabled={!complete}
                  onClick={() => dispatch({ type: 'COMPLETE_QUEST', id: q.id })}
                >
                  🏵️ Turn in
                </button>
              ) : (
                <button
                  className="btn"
                  disabled={!reqsMet}
                  onClick={() => dispatch({ type: 'ACCEPT_QUEST', id: q.id })}
                >
                  📜 Accept
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
