const STATUS_CONFIG = {
  ACTIVE:                  { bg: 'bg-emerald-50',  text: 'text-emerald-700',  dot: 'bg-emerald-500',  ring: 'ring-emerald-600/20' },
  CLOSED:                  { bg: 'bg-slate-50',    text: 'text-slate-600',    dot: 'bg-slate-400',    ring: 'ring-slate-500/20' },
  COLLECTED:               { bg: 'bg-blue-50',     text: 'text-blue-700',     dot: 'bg-blue-500',     ring: 'ring-blue-600/20' },
  SUBMITTED:               { bg: 'bg-amber-50',    text: 'text-amber-700',    dot: 'bg-amber-500',    ring: 'ring-amber-600/20' },
  VERIFIED:                { bg: 'bg-emerald-50',  text: 'text-emerald-700',  dot: 'bg-emerald-500',  ring: 'ring-emerald-600/20' },
  DEPOSITED:               { bg: 'bg-violet-50',   text: 'text-violet-700',   dot: 'bg-violet-500',   ring: 'ring-violet-600/20' },
  SETTLED:                 { bg: 'bg-teal-50',     text: 'text-teal-700',     dot: 'bg-teal-500',     ring: 'ring-teal-600/20' },
  PENDING:                 { bg: 'bg-amber-50',    text: 'text-amber-700',    dot: 'bg-amber-500',    ring: 'ring-amber-600/20' },
  APPROVED:                { bg: 'bg-emerald-50',  text: 'text-emerald-700',  dot: 'bg-emerald-500',  ring: 'ring-emerald-600/20' },
  APPROVED_WITH_DISCREPANCY: { bg: 'bg-orange-50', text: 'text-orange-700',   dot: 'bg-orange-500',   ring: 'ring-orange-600/20' },
  REJECTED:                { bg: 'bg-red-50',      text: 'text-red-700',      dot: 'bg-red-500',      ring: 'ring-red-600/20' },
  FAILED:                  { bg: 'bg-red-50',      text: 'text-red-700',      dot: 'bg-red-500',      ring: 'ring-red-600/20' },
  DELAYED:                 { bg: 'bg-orange-50',   text: 'text-orange-700',   dot: 'bg-orange-500',   ring: 'ring-orange-600/20' },
  PARTIALLY_PAID:          { bg: 'bg-blue-50',     text: 'text-blue-700',     dot: 'bg-blue-500',     ring: 'ring-blue-600/20' },
  PAID:                    { bg: 'bg-emerald-50',  text: 'text-emerald-700',  dot: 'bg-emerald-500',  ring: 'ring-emerald-600/20' },
  OVERDUE:                 { bg: 'bg-red-50',      text: 'text-red-700',      dot: 'bg-red-500',      ring: 'ring-red-600/20' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.CLOSED;
  const label = status?.replace(/_/g, ' ') || 'Unknown';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${config.bg} ${config.text} ${config.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {label}
    </span>
  );
}
