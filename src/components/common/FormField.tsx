/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  id?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  hint,
  required,
  children,
  id,
}) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-xs font-mono text-slate-300 uppercase tracking-wider flex items-center gap-1"
        >
          <span>{label}</span>
          {required && <span className="text-rose-400 font-bold">*</span>}
        </label>
        {hint && !error && (
          <span className="text-[11px] text-slate-500">{hint}</span>
        )}
      </div>
      {children}
      {error && (
        <span className="text-[11px] font-mono text-rose-400 flex items-center gap-1">
          <span>⚠</span> {error}
        </span>
      )}
    </div>
  );
};
