/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { FormField } from '../components/common/FormField';

interface RegisterPageProps {
  onSuccess: () => void;
  onNavigateToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onSuccess,
  onNavigateToLogin,
}) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    agency: 'State Disaster Management Authority',
    badgeNumber: '',
    role: 'field_responder' as Role,
    phone: '',
    region: 'Eastern Command Zone',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.badgeNumber) {
      setError('Please provide full name, official email, and agency badge ID.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      const res = await register(formData);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch {
      setError('Operational registry communication error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto mb-3">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold font-mono tracking-tight text-slate-100 uppercase">
          Enlist Agency Personnel
        </h2>
        <p className="mt-1 text-xs text-slate-400 font-mono">
          Register official credentials for emergency coordination
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-[#12171e] p-6 rounded border border-slate-800 shadow-xl">
          {error && (
            <div className="mb-4 p-2.5 rounded bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Full Name" required id="reg-name">
                <input
                  id="reg-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Meera Sen"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/80"
                />
              </FormField>

              <FormField label="Official Email" required id="reg-email">
                <input
                  id="reg-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="m.sen@sdma.gov.in"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/80"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Agency / Department" required id="reg-agency">
                <select
                  id="reg-agency"
                  value={formData.agency}
                  onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500/80"
                >
                  <option value="National Disaster Response Force (NDRF)">National Disaster Response Force (NDRF)</option>
                  <option value="State Disaster Management Authority (SDMA)">State Disaster Management Authority (SDMA)</option>
                  <option value="State Disaster Response Force (SDRF)">State Disaster Response Force (SDRF)</option>
                  <option value="District Disaster Management Authority (DDMA)">District Disaster Management Authority (DDMA)</option>
                  <option value="Disaster Relief Logistics Consortium">Disaster Relief Logistics Consortium</option>
                  <option value="Indian Meteorological Dept (IMD)">Indian Meteorological Dept (IMD)</option>
                </select>
              </FormField>

              <FormField label="Badge / Service ID" required id="reg-badge" hint="Format: ORG-DIV-NUM">
                <input
                  id="reg-badge"
                  type="text"
                  value={formData.badgeNumber}
                  onChange={(e) => setFormData({ ...formData, badgeNumber: e.target.value })}
                  placeholder="NDRF-BN02-771"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/80"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Assigned Operational Role" required id="reg-role">
                <select
                  id="reg-role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500/80"
                >
                  <option value="field_responder">Field Responder</option>
                  <option value="incident_commander">Incident Commander</option>
                  <option value="logistics_officer">Logistics Officer</option>
                  <option value="administrator">System Administrator</option>
                  <option value="read_only_analyst">Read-Only Analyst</option>
                </select>
              </FormField>

              <FormField label="Assigned Operational Region" id="reg-region">
                <input
                  id="reg-region"
                  type="text"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="Odisha Coastal Belt"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/80"
                />
              </FormField>
            </div>

            <FormField label="Emergency Contact Phone" id="reg-phone">
              <input
                id="reg-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 94370 00000"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/80"
              />
            </FormField>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 text-xs font-mono font-bold rounded bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Enlist Personnel Profile</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-slate-850 text-center">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Terminal Sign In</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
