import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'emergency' | 'hazard' | 'safe' | 'info';
  badgeText?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  badgeText,
  onClick
}) => {
  const borderColors = {
    default: 'border-border hover:border-border-subtle',
    emergency: 'border-emergency/40 bg-gradient-to-br from-emergency/5 to-transparent',
    hazard: 'border-hazard/40 bg-gradient-to-br from-hazard/5 to-transparent',
    safe: 'border-safe/40 bg-gradient-to-br from-safe/5 to-transparent',
    info: 'border-operational-cyan/40 bg-gradient-to-br from-operational-cyan/5 to-transparent'
  };

  const iconColors = {
    default: 'text-primary-muted bg-panel-subtle',
    emergency: 'text-emergency bg-emergency/10 border border-emergency/30',
    hazard: 'text-hazard bg-hazard/10 border border-hazard/30',
    safe: 'text-safe bg-safe/10 border border-safe/30',
    info: 'text-operational-cyan bg-operational-cyan/10 border border-operational-cyan/30'
  };

  return (
    <div
      onClick={onClick}
      className={`bg-panel border rounded-lg p-4 transition-all duration-150 ${borderColors[variant]} ${onClick ? 'cursor-pointer hover:bg-panel-elevated' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary-muted">{title}</span>
        <div className={`p-2 rounded ${iconColors[variant]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-bold font-mono text-primary tracking-tight">{value}</div>
        {badgeText && (
          <span className="text-xs font-medium font-mono text-primary-muted px-1.5 py-0.5 rounded bg-panel-subtle border border-border">
            {badgeText}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-primary-dim mt-1.5 truncate">{subtitle}</p>}
    </div>
  );
};

