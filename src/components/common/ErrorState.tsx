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
  title = 'Operational Alert',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`w-full p-6 bg-[#F9EBEA] border border-[#E8C2BF] rounded-xl flex flex-col items-center text-center shadow-xs ${className}`}
      role="alert"
    >
      <div className="p-2.5 rounded-lg bg-white border border-[#E8C2BF] text-[#B9433D] mb-2.5">
        <AlertOctagon className="w-5 h-5" />
      </div>
      <h4 className="text-xs font-semibold text-[#B9433D] uppercase tracking-wider">
        {title}
      </h4>
      <p className="mt-1 max-w-md text-xs text-[#171B19] leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#B9433D] hover:bg-[#9E3530] text-white transition-colors shadow-xs"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  );
};
