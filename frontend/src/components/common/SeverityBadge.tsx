import React from 'react';
import { AlertCircle, AlertOctagon, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { RiskSeverity } from '../../types';

interface SeverityBadgeProps {
  severity: RiskSeverity;
  size?: 'sm' | 'md' | 'lg';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const config = {
    CRITICAL: {
      label: 'CRITICAL SEVERITY',
      bg: 'bg-red-950/70 border-red-500/50 text-red-300',
      iconBg: 'bg-red-500 text-black',
      Icon: AlertOctagon,
      pulse: true,
    },
    HIGH: {
      label: 'HIGH SEVERITY',
      bg: 'bg-orange-950/70 border-orange-500/50 text-orange-300',
      iconBg: 'bg-orange-500 text-black',
      Icon: AlertTriangle,
      pulse: false,
    },
    MEDIUM: {
      label: 'MEDIUM SEVERITY',
      bg: 'bg-amber-950/60 border-amber-500/40 text-amber-300',
      iconBg: 'bg-amber-500 text-black',
      Icon: AlertCircle,
      pulse: false,
    },
    LOW: {
      label: 'LOW SEVERITY',
      bg: 'bg-blue-950/60 border-blue-500/40 text-blue-300',
      iconBg: 'bg-blue-500 text-white',
      Icon: Info,
      pulse: false,
    },
    INFORMATIONAL: {
      label: 'INFORMATIONAL / BENIGN',
      bg: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300',
      iconBg: 'bg-emerald-500 text-black',
      Icon: CheckCircle,
      pulse: false,
    },
  }[severity] || {
    label: severity,
    bg: 'bg-slate-800 border-slate-700 text-slate-300',
    iconBg: 'bg-slate-600 text-white',
    Icon: Info,
    pulse: false,
  };

  const { Icon, label, bg, iconBg, pulse } = config;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1.5',
    md: 'px-3 py-1 text-xs font-semibold tracking-wider gap-2',
    lg: 'px-4 py-1.5 text-sm font-bold tracking-wider gap-2.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-md border font-mono uppercase transition-all shadow-sm ${bg} ${sizeClasses}`}
    >
      <span className={`p-0.5 rounded ${iconBg} ${pulse ? 'animate-pulse' : ''}`}>
        <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      </span>
      <span>{label}</span>
    </span>
  );
};
