/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertOctagon, RotateCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Operational Communication Fault',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`w-full p-6 bg-rose-950/20 border border-rose-900/50 rounded flex flex-col items-center text-center ${className}`}
      role="alert"
    >
      <div className="p-2.5 rounded bg-rose-950/60 border border-rose-800 text-rose-400 mb-2.5">
        <AlertOctagon className="w-5 h-5" />
      </div>
      <h4 className="text-xs font-mono font-semibold text-rose-300 uppercase tracking-wider">
        {title}
      </h4>
      <p className="mt-1 max-w-md text-xs text-rose-200/80 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono rounded bg-rose-900/40 hover:bg-rose-900/70 border border-rose-800 text-rose-200 transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Re-establish Connection</span>
        </button>
      )}
    </div>
  );
};
