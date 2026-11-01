/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="relative w-full max-w-md bg-[#161c24] border border-slate-750 rounded shadow-2xl p-5 text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3.5 mb-4">
          <div
            className={`p-2 rounded shrink-0 ${
              isDestructive ? 'bg-rose-950/60 text-rose-400 border border-rose-800/50' : 'bg-amber-950/60 text-amber-400 border border-amber-800/50'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="confirm-dialog-title" className="text-sm font-semibold text-slate-100 tracking-tight">
              {title}
            </h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              {message}
            </p>
          </div>
          <button
            onClick={onCancel}
            aria-label="Close dialog"
            className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-5 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
                : 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold shadow-sm'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
