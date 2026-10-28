import React from 'react';
import { AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';

interface AlertBannerProps {
  type?: 'info' | 'warning' | 'emergency' | 'safe';
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type = 'info',
  title,
  children,
  className = '',
  action
}) => {
  const styles = {
    info: {
      container: 'bg-operational-cyan/10 border-operational-cyan/30 text-primary',
      icon: <Info className="w-4 h-4 text-operational-cyan shrink-0 mt-0.5" />
    },
    warning: {
      container: 'bg-hazard-bg border-hazard/40 text-primary',
      icon: <AlertTriangle className="w-4 h-4 text-hazard shrink-0 mt-0.5" />
    },
    emergency: {
      container: 'bg-emergency-bg border-emergency/40 text-primary',
      icon: <XCircle className="w-4 h-4 text-emergency shrink-0 mt-0.5" />
    },
    safe: {
      container: 'bg-safe-bg border-safe/40 text-primary',
      icon: <CheckCircle2 className="w-4 h-4 text-safe shrink-0 mt-0.5" />
    }
  };

  const current = styles[type];

  return (
    <div className={`flex items-start justify-between gap-3 p-3.5 rounded border text-xs leading-relaxed ${current.container} ${className}`}>
      <div className="flex items-start gap-2.5">
        {current.icon}
        <div>
          {title && <span className="font-bold block text-primary mb-0.5">{title}</span>}
          <div className="text-primary-muted">{children}</div>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

