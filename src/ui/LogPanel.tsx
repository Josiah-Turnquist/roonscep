import { useGame } from '../state/store';

export default function LogPanel() {
  const s = useGame();
  return (
    <aside className="log-panel">
      <h3 className="log-title">📜 Adventure Log</h3>
      <div className="log-entries">
        {s.log.map((e) => (
          <div key={e.id} className={`log-entry ${e.kind}`}>
            {e.text}
          </div>
        ))}
      </div>
    </aside>
  );
}
