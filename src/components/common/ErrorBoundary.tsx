/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RakshaGrid ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-[#0d1117] text-[#e6edf3]">
          <div className="max-w-xl w-full bg-[#161b22] border border-[#f85149]/40 rounded-xl p-8 shadow-2xl shadow-black/80">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-[#f85149]/10 rounded-lg text-[#f85149] border border-[#f85149]/30">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-wide">
                  {this.props.fallbackTitle || 'Tactical Subsystem Failure Intercepted'}
                </h2>
                <p className="text-xs text-[#8b949e] font-mono mt-0.5">
                  STATUS: FAULT_CONTAINED // CORE ENGINE ONLINE
                </p>
              </div>
            </div>

            <p className="text-sm text-[#c9d1d9] mb-4 leading-relaxed">
              An unexpected component exception occurred in the operational workspace. RakshaGrid’s containment
              layer prevented a system-wide crash. Operational telemetry and audit logs remain secured.
            </p>

            {this.state.error && (
              <div className="mb-6 p-3 bg-[#0d1117] border border-[#30363d] rounded-lg font-mono text-xs text-[#f85149] overflow-x-auto max-h-36">
                <div className="font-semibold text-white/80 mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#f85149]" /> Exception Detail:
                </div>
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#30363d]">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center space-x-2 transition-colors cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Subsystem</span>
              </button>

              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] rounded-lg text-xs font-medium uppercase tracking-wider flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Hard Reload</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] rounded-lg text-xs font-medium uppercase tracking-wider flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Command Center</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
