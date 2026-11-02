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
  subtext = 'Synchronizing with emergency response node',
}) => {
  return (
    <div className="w-full py-16 flex flex-col items-center justify-center text-center p-6 bg-white border border-[#E4E3DC] rounded-xl shadow-xs">
      <div className="relative w-10 h-10 mb-4">
        <div className="absolute inset-0 rounded-full border-2 border-[#E4E3DC]" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#315C46] border-r-[#315C46] animate-spin" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[#171B19]">
        {message}
      </p>
      {subtext && (
        <p className="mt-1 text-xs text-[#777D77]">
          {subtext}
        </p>
      )}
    </div>
  );
};
