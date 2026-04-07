import './KpiCard.css';

interface KpiCardProps {
  level: string;
  value: string;
  label: string;
  badge?: string | null;
}

export function KpiCard({ level, value, label, badge }: KpiCardProps) {
  return (
    <div className="dash-kpi" data-level={level}>
      <div className="kv">{value}</div>
      <div className="kl">{label}</div>
      {badge && <div className="ks">{badge}</div>}
    </div>
  );
}
