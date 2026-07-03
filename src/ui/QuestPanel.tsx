import { QUESTS, objectiveProgress, questReadyToTurnIn, questReqsMet } from '../game/quests';
import { QuestObjective } from '../game/types';
import { MONSTER_MAP } from '../game/monsters';
import { ITEMS } from '../game/items';
import { NPCS } from '../game/world';
import { useGame } from '../state/store';
import { combatLevel } from '../game/combat';

function objectiveLabel(o: QuestObjective): string {
  if (o.type === 'kill') return `Slay ${o.count}× ${MONSTER_MAP[o.monsterId]?.name}`;
  if (o.type === 'item') return `Bring ${o.qty}× ${ITEMS[o.itemId]?.name}`;
  const statLabels: Record<string, string> = { bonesBuried: 'Bury bones', pickpockets: 'Pickpocket successfully' };
  return `${statLabels[o.stat] ?? o.stat} ×${o.count}`;
}

export default function QuestPanel() {
  const s = useGame();
  const cb = combatLevel(s);
  const done = QUESTS.filter((q) => s.quests[q.id]?.status === 'done').length;
  const giverOf = (qid: string) => NPCS.find((n) => n.questIds?.includes(qid));

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Quest Journal</h2>
        <p className="muted small">
          {done}/{QUESTS.length} complete. Quests are given and turned in by folk in the world —
          look for the gold “!”.
        </p>
      </div>
      <div className="side-card-list">
        {QUESTS.map((q) => {
          const status = s.quests[q.id]?.status;
          const reqsMet = questReqsMet(s, q, cb);
          const ready = questReadyToTurnIn(s, q);
          const obj = objectiveProgress(s, q);
          const giver = giverOf(q.id);
          return (
            <div key={q.id} className={`card ${status === 'done' ? 'defeated' : ''} ${!reqsMet && !status ? 'locked' : ''}`}>
              <div className="card-title">
                {q.icon} {q.name} {status === 'done' && <span className="kill-badge">✓</span>}
                {ready && <span className="kill-badge ready-badge">Ready to turn in!</span>}
              </div>
              {status !== 'done' && (
                <>
                  <div className="muted small">{q.flavor}</div>
                  <ul className="objective-list">
                    {q.objectives.map((o, i) => (
                      <li key={i} className={`small ${status === 'active' && obj[i][0] >= obj[i][1] ? 'have' : ''}`}>
                        {status === 'active' && obj[i][0] >= obj[i][1] ? '✅' : '▫️'} {objectiveLabel(o)}
                        {status === 'active' ? ` (${obj[i][0]}/${obj[i][1]})` : ''}
                      </li>
                    ))}
                  </ul>
                  {giver && (
                    <div className="small hint-line">
                      📍 {status === 'active' ? 'Return to' : 'Speak to'} {giver.icon} {giver.name}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
