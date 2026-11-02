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
          className="text-xs font-semibold text-[#171B19] uppercase tracking-wider flex items-center gap-1"
        >
          <span>{label}</span>
          {required && <span className="text-[#B9433D] font-bold">*</span>}
        </label>
        {hint && !error && (
          <span className="text-[11px] text-[#777D77]">{hint}</span>
        )}
      </div>
      {children}
      {error && (
        <span className="text-[11px] font-medium text-[#B9433D] flex items-center gap-1">
          <span>⚠</span> {error}
        </span>
      )}
    </div>
  );
};
