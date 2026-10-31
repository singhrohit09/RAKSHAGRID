import React from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';

export const RouteLoadingFallback: React.FC = () => {
  return (
    <div 
      className="flex flex-col items-center justify-center min-h-[60vh] w-full p-8"
      role="status"
      aria-live="polite"
    >
      <div className="relative mb-4">
        <div className="w-14 h-14 rounded-2xl bg-primary-900/20 border border-primary-500/30 flex items-center justify-center text-primary-400">
          <ShieldAlert className="w-7 h-7 text-primary-500 animate-pulse" />
        </div>
        <Loader2 className="w-5 h-5 text-accent-500 animate-spin absolute -bottom-1 -right-1" />
      </div>

      <div className="text-center max-w-sm">
        <h3 className="text-sm font-semibold text-gray-200 tracking-wide">
          Loading Module
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          Synchronizing RakshaGrid disaster intelligence telemetry...
        </p>
      </div>

      {/* Subtle skeleton bar */}
      <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden mt-5">
        <div className="h-full bg-primary-500 rounded-full w-2/5 animate-[pulse_1.5s_ease-in-out_infinite]" />
      </div>
    </div>
  );
};

