/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, Lock, AlertCircle, ArrowRight, UserCheck, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { FormField } from '../components/common/FormField';

interface LoginPageProps {
  onSuccess: () => void;
  onNavigateToRegister: () => void;
  onNavigateToPublic: () => void;
  redirectReason?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onNavigateToRegister,
  onNavigateToPublic,
  redirectReason,
}) => {
  const { login, availablePersonas, switchRole } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('incident_commander');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your agency email address.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      const res = await login(email, selectedRole);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.message || 'Authentication error.');
      }
    } catch {
      setError('Connection failure to authentication provider.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickPersona = async (roleKey: Role, personaEmail: string) => {
    setError('');
    setIsSubmitting(true);
    try {
      const res = await login(personaEmail, roleKey);
      if (res.success) {
        onSuccess();
      }
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
          RakshaGrid Command Node
        </h2>
        <p className="mt-1 text-xs text-slate-400 font-mono">
          Disaster Intelligence & Tactical Coordination Access
        </p>

        {redirectReason && (
          <div className="mt-3 p-3 rounded bg-rose-950/50 border border-rose-800 text-left text-xs font-mono text-rose-300 flex items-start gap-2 shadow-sm" role="alert">
            <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-snug">{redirectReason}</div>
          </div>
        )}

        {/* Development Mode Notice */}
        <div className="mt-3 p-2.5 rounded bg-amber-950/40 border border-amber-800/60 text-left text-xs font-mono text-amber-300/90 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-snug">
            <span className="font-bold uppercase tracking-wider text-amber-300">Phase 1 Development Mode:</span>{' '}
            Authentication abstraction active. You can authenticate instantly using any of the 5 authorized operational personas below or test custom credentials.
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl space-y-6">
        {/* Quick Persona Picker */}
        <div className="bg-[#12171e] p-5 rounded border border-slate-800 shadow-xl">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
            <span>Select Authorized Operational Persona</span>
            <span className="text-[10px] text-amber-400 font-normal">Click to sign in</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {availablePersonas.map((persona) => (
              <button
                key={persona.id}
                type="button"
                onClick={() => handleQuickPersona(persona.role, persona.email)}
                className="p-3 rounded bg-slate-900 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-850 text-left transition-all duration-150 group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-amber-400 transition-colors">
                    {persona.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    {persona.badgeNumber.split('-').slice(-1)[0]}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-amber-400/90 capitalize mb-0.5">
                  {persona.role.replace(/_/g, ' ')}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {persona.agency}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Standard Credentials Form */}
        <div className="bg-[#12171e] p-5 rounded border border-slate-800 shadow-xl">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-3">
            Or Sign In With Custom Agency Credentials
          </div>

          {error && (
            <div className="mb-4 p-2.5 rounded bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCustomLogin} className="space-y-4">
            <FormField label="Official Agency Email" required id="agency-email">
              <input
                id="agency-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="commander@ndrf.gov.in"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/20"
              />
            </FormField>

            <FormField label="Operational Role Assignment" required id="role-select">
              <select
                id="role-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as Role)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500/80"
              >
                <option value="incident_commander">Incident Commander (Operational Command & Broadcast)</option>
                <option value="administrator">Administrator (Full System & User Management)</option>
                <option value="field_responder">Field Responder (Triage & On-Scene Reporting)</option>
                <option value="logistics_officer">Logistics Officer (Supplies & Shelter Management)</option>
                <option value="read_only_analyst">Read-Only Analyst (Geospatial & Trend Observation)</option>
              </select>
            </FormField>

            <FormField label="Terminal Access Key / Password" hint="Dev Mode: Any non-empty value accepted" id="pass">
              <input
                id="pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/80"
              />
            </FormField>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 text-xs font-mono font-bold rounded bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Authenticate Terminal Access</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-slate-850 flex items-center justify-between text-xs font-mono text-slate-400">
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="hover:text-amber-400 transition-colors"
            >
              Register New Agency Officer
            </button>
            <button
              type="button"
              onClick={onNavigateToPublic}
              className="hover:text-slate-200 transition-colors"
            >
              ← Public Bulletin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
