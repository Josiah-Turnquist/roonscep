import { useEffect, useMemo, useRef } from 'react';
import { useGame } from '../state/store';

export default function LogPanel() {
  const s = useGame();
  const boxRef = useRef<HTMLDivElement>(null);
  // state stores newest-first; the chat reads oldest → newest like any chat
  const entries = useMemo(() => [...s.log].reverse(), [s.log]);
  const newestId = s.log[0]?.id;

  useEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [newestId]);

  return (
    <aside className="log-panel">
      <h3 className="log-title">Adventure Log</h3>
      <div className="log-entries" ref={boxRef}>
        {entries.map((e) => (
          <div key={e.id} className={`log-entry ${e.kind}`}>
            {e.text}
          </div>
        ))}
      </div>
    </aside>
  );
}
