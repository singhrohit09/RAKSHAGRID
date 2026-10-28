import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  actionRestricted?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  actionRestricted = false
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-lg bg-panel-card/40 my-4">
      <div className="p-3 bg-panel-subtle rounded-full text-primary-dim mb-3 border border-border">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-primary mb-1">{title}</h4>
      <p className="text-xs text-primary-muted max-w-sm mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button
          size="sm"
          variant="secondary"
          onClick={onAction}
          restricted={actionRestricted}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
