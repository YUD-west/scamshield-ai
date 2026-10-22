import React from 'react';
import { AlertCircle, AlertOctagon, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { RiskSeverity } from '../../types';

interface SeverityBadgeProps {
  severity: RiskSeverity;
  size?: 'sm' | 'md' | 'lg';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const config = {
    CRITICAL: {
      label: 'Dangerous Scam',
      bg: 'bg-red-500/15 border-red-500/40 text-red-200 shadow-red-500/10',
      badgeDot: 'bg-red-500',
      Icon: AlertOctagon,
      pulse: true,
    },
    HIGH: {
      label: 'High Risk Scam',
      bg: 'bg-orange-500/15 border-orange-500/40 text-orange-200 shadow-orange-500/10',
      badgeDot: 'bg-orange-500',
      Icon: AlertTriangle,
      pulse: false,
    },
    MEDIUM: {
      label: 'Suspicious (Be Careful)',
      bg: 'bg-amber-500/15 border-amber-500/40 text-amber-200 shadow-amber-500/10',
      badgeDot: 'bg-amber-500',
      Icon: AlertCircle,
      pulse: false,
    },
    LOW: {
      label: 'Low Suspicion',
      bg: 'bg-sky-500/15 border-sky-500/40 text-sky-200 shadow-sky-500/10',
      badgeDot: 'bg-sky-500',
      Icon: Info,
      pulse: false,
    },
    INFORMATIONAL: {
      label: 'Looks Safe & Normal',
      bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200 shadow-emerald-500/10',
      badgeDot: 'bg-emerald-500',
      Icon: CheckCircle2,
      pulse: false,
    },
  }[severity] || {
    label: severity,
    bg: 'bg-slate-800 border-slate-700 text-slate-300',
    badgeDot: 'bg-slate-500',
    Icon: Info,
    pulse: false,
  };

  const { Icon, label, bg, badgeDot, pulse } = config;

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3.5 py-1.5 text-xs font-semibold gap-2',
    lg: 'px-4 py-2 text-sm font-bold gap-2.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-sm transition-all font-medium ${bg} ${sizeClasses}`}
    >
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${badgeDot}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${badgeDot}`} />
      </span>
      <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      <span>{label}</span>
    </span>
  );
};
