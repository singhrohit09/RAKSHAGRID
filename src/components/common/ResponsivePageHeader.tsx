/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface ResponsivePageHeaderProps {
  title: string;
  kicker?: string;
  description?: string;
  actions?: React.ReactNode;
  metadata?: React.ReactNode;
}

export const ResponsivePageHeader: React.FC<ResponsivePageHeaderProps> = ({
  title,
  kicker,
  description,
  actions,
  metadata,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 mb-6 border-b border-slate-800">
      <div>
        {kicker && (
          <div className="text-[11px] font-mono tracking-wider uppercase text-amber-500/90 font-medium mb-1">
            {kicker}
          </div>
        )}
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 text-balance">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-2xl">
            {description}
          </p>
        )}
        {metadata && (
          <div className="mt-2 text-xs text-slate-500">
            {metadata}
          </div>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
};
