// Komponen StatCard yang sudah diupgrade - pakai KPICard dari design system
import { KPICard } from './ui';
export default function StatCard({ label, value, sub, accent, delay = 0 }) {
  // Ekstrak warna dari class tailwind ke CSS var
  const colorMap = {
    'text-park-accent': 'var(--accent)',
    'text-park-danger': 'var(--danger)',
    'text-park-warn':   'var(--warn)',
    'text-blue-400':    '#60a5fa',
    'text-park-text':   'var(--text)',
  };
  const color = colorMap[accent] || 'var(--accent)';
  return <KPICard label={label} value={value} sub={sub} color={color} icon="◎" delay={delay} />;
}

