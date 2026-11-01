/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LoadingStateProps {
  message?: string;
  subtext?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading operational telemetry...',
  subtext = 'Synchronizing with state disaster command node',
}) => {
  return (
    <div className="w-full py-16 flex flex-col items-center justify-center text-center p-6 bg-[#12171e] border border-slate-800 rounded">
      <div className="relative w-10 h-10 mb-4">
        <div className="absolute inset-0 rounded-full border-2 border-slate-700 opacity-30" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-500 border-r-amber-500 animate-spin" />
      </div>
      <p className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
        {message}
      </p>
      {subtext && (
        <p className="mt-1 text-[11px] text-slate-500">
          {subtext}
        </p>
      )}
    </div>
  );
};
