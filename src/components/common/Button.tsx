import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'safe' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  restricted?: boolean;
  restrictedReason?: string;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  restricted = false,
  restrictedReason,
  loading = false,
  className = '',
  disabled,
  title,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-charcoal rounded select-none cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5 font-semibold'
  };

  const variantStyles = {
    primary: 'bg-primary text-charcoal-deep font-semibold hover:bg-white focus:ring-primary',
    secondary: 'bg-panel-elevated text-primary border border-border hover:bg-panel-subtle hover:border-primary-dim focus:ring-border',
    danger: 'bg-emergency text-white hover:bg-emergency-dark focus:ring-emergency',
    warning: 'bg-hazard text-charcoal-deep font-semibold hover:bg-hazard-light focus:ring-hazard',
    safe: 'bg-safe text-white hover:bg-safe-dark focus:ring-safe',
    outline: 'bg-transparent text-primary border border-border hover:bg-panel-elevated focus:ring-border',
    ghost: 'bg-transparent text-primary-muted hover:text-primary hover:bg-panel-subtle focus:ring-border'
  };

  const isDisabled = disabled || restricted || loading;
  const tooltipText = restricted ? restrictedReason || 'This action is restricted for your current persona role.' : title;

  return (
    <button
      {...props}
      disabled={isDisabled}
      title={tooltipText}
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${isDisabled ? 'opacity-40 cursor-not-allowed hover:bg-transparent pointer-events-auto' : ''}
        ${className}
      `}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {!loading && Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
    </button>
  );
};
