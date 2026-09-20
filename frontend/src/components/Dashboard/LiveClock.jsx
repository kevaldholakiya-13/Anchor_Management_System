import { useState, useEffect } from 'react';

export default function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const h = String(time.getHours()).padStart(2, '0');
  const m = String(time.getMinutes()).padStart(2, '0');
  const s = String(time.getSeconds()).padStart(2, '0');

  return (
    <div style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', userSelect: 'none' }}>
      <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{h}:{m}</span>
      <span style={{ fontSize: 16, color: 'var(--primary)', fontWeight: 600 }}>{s !== undefined ? `:${s}` : ''}</span>
    </div>
  );
}
