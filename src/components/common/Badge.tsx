import React from 'react';
import { IncidentSeverity, IncidentStatus, IncidentPriority } from '../../types/incident';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emergency' | 'hazard' | 'safe' | 'info' | 'neutral' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  dot = false
}) => {
  const variantStyles = {
    emergency: 'bg-emergency-bg text-emergency border border-emergency/40',
    hazard: 'bg-hazard-bg text-hazard border border-hazard/40',
    safe: 'bg-safe-bg text-safe border border-safe/40',
    info: 'bg-operational-cyan/15 text-operational-cyan border border-operational-cyan/40',
    neutral: 'bg-panel-subtle text-primary-muted border border-border',
    subtle: 'bg-charcoal text-primary-dim border border-border-dark'
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold tracking-wide',
    lg: 'text-sm px-3 py-1.5 font-semibold'
  };

  const dotColors = {
    emergency: 'bg-emergency animate-pulse',
    hazard: 'bg-hazard',
    safe: 'bg-safe',
    info: 'bg-operational-cyan',
    neutral: 'bg-primary-muted',
    subtle: 'bg-primary-dim'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded uppercase tracking-wider font-mono ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: IncidentSeverity }> = ({ severity }) => {
  switch (severity) {
    case 'Critical':
      return <Badge variant="emergency" dot>{severity}</Badge>;
    case 'High':
      return <Badge variant="hazard" dot>{severity}</Badge>;
    case 'Moderate':
      return <Badge variant="info">{severity}</Badge>;
    case 'Low':
    default:
      return <Badge variant="safe">{severity}</Badge>;
  }
};

export const StatusBadge: React.FC<{ status: IncidentStatus }> = ({ status }) => {
  switch (status) {
    case 'Active':
      return <Badge variant="emergency" dot>{status}</Badge>;
    case 'Reported':
      return <Badge variant="hazard">{status}</Badge>;
    case 'Verified':
      return <Badge variant="info">{status}</Badge>;
    case 'Contained':
      return <Badge variant="hazard">{status}</Badge>;
    case 'Resolved':
      return <Badge variant="safe">{status}</Badge>;
    case 'Closed':
    default:
      return <Badge variant="subtle">{status}</Badge>;
  }
};

export const PriorityBadge: React.FC<{ priority: IncidentPriority }> = ({ priority }) => {
  switch (priority) {
    case 'P1':
      return <Badge variant="emergency">P1 - CRITICAL</Badge>;
    case 'P2':
      return <Badge variant="hazard">P2 - HIGH</Badge>;
    case 'P3':
      return <Badge variant="info">P3 - MEDIUM</Badge>;
    case 'P4':
    default:
      return <Badge variant="neutral">P4 - LOW</Badge>;
  }
};

