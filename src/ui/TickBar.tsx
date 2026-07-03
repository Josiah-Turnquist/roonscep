import { useEffect, useRef } from 'react';
import { TICK_MS, tickClock } from '../state/store';

/** A thin bar that fills toward the next game turn — continuous feedback between ticks. */
export default function TickBar({ className = '' }: { className?: string }) {
  const fillRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const p = Math.min(1, (Date.now() - tickClock.last) / TICK_MS);
      if (fillRef.current) fillRef.current.style.width = `${Math.round(p * 100)}%`;
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <span className={`tick-bar ${className}`}>
      <span ref={fillRef} className="tick-bar-fill" />
    </span>
  );
}
