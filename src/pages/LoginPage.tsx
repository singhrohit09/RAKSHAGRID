/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, Lock, AlertCircle, ArrowRight } from 'lucide-react';
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
  const { login, availablePersonas } = useAuth();
  const [email, setEmail] = useState('rajesh.verma@ndrf.gov.in');
  const [password, setPassword] = useState('commander123');
  const [selectedRole, setSelectedRole] = useState<Role>('incident_commander');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your official agency email.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const res = await login(email, selectedRole);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.message || 'Authentication failed. Please verify credentials.');
      }
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
    <div className="min-h-screen bg-[#F5F4EF] text-[#171B19] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-xl bg-[#315C46] flex items-center justify-center text-white mx-auto mb-3 shadow-xs">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-[#171B19]">
          RakshaGrid Command Access
        </h2>
        <p className="mt-1 text-xs text-[#777D77]">
          Disaster Intelligence & Coordinated Emergency Response Platform
        </p>

        {redirectReason && (
          <div className="mt-4 p-3 rounded-lg bg-[#F9EBEA] border border-[#E8C2BF] text-left text-xs text-[#B9433D] flex items-start gap-2 shadow-2xs" role="alert">
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-snug">{redirectReason}</div>
          </div>
        )}
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl space-y-6">
        {/* Quick Persona Picker */}
        <div className="bg-white p-6 rounded-xl border border-[#E4E3DC] shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#777D77] mb-3 flex items-center justify-between">
            <span>Select Operational Role</span>
            <span className="text-[10px] text-[#315C46] font-medium lowercase">click persona to sign in</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {availablePersonas.map((persona) => (
              <button
                key={persona.id}
                type="button"
                onClick={() => handleQuickPersona(persona.role, persona.email)}
                className="p-3 rounded-lg bg-[#FAF9F5] border border-[#E4E3DC] hover:border-[#315C46] hover:bg-white text-left transition-all duration-150 group shadow-2xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#171B19] group-hover:text-[#315C46] transition-colors">
                    {persona.name}
                  </span>
                  <span className="text-[10px] font-mono text-[#777D77] uppercase">
                    {persona.badgeNumber.split('-').slice(-1)[0]}
                  </span>
                </div>
                <div className="text-[11px] text-[#315C46] font-medium capitalize mb-0.5">
                  {persona.role.replace(/_/g, ' ')}
                </div>
                <div className="text-[10px] text-[#777D77] truncate">
                  {persona.agency}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Standard Credentials Form */}
        <div className="bg-white p-6 rounded-xl border border-[#E4E3DC] shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#777D77] mb-3">
            Or Sign In With Official Agency Credentials
          </div>

          {error && (
            <div className="mb-4 p-2.5 rounded-lg bg-[#F9EBEA] border border-[#E8C2BF] text-[#B9433D] text-xs flex items-center gap-2">
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
                className="w-full px-3 py-2 bg-white border border-[#E4E3DC] rounded-lg text-xs text-[#171B19] placeholder-[#999F99] focus:outline-none focus:border-[#315C46] focus:ring-1 focus:ring-[#315C46]/20"
              />
            </FormField>

            <FormField label="Operational Role Assignment" required id="role-select">
              <select
                id="role-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as Role)}
                className="w-full px-3 py-2 bg-white border border-[#E4E3DC] rounded-lg text-xs text-[#171B19] focus:outline-none focus:border-[#315C46]"
              >
                <option value="incident_commander">Incident Commander (Operational Command & Broadcast)</option>
                <option value="administrator">Administrator (Full System & User Management)</option>
                <option value="field_responder">Field Responder (Triage & On-Scene Reporting)</option>
                <option value="logistics_officer">Logistics Officer (Supplies & Shelter Management)</option>
                <option value="read_only_analyst">Read-Only Analyst (Geospatial & Trend Observation)</option>
              </select>
            </FormField>

            <FormField label="Terminal Access Key / Password" hint="Authorized personnel credential" id="pass">
              <input
                id="pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 bg-white border border-[#E4E3DC] rounded-lg text-xs text-[#171B19] placeholder-[#999F99] focus:outline-none focus:border-[#315C46]"
              />
            </FormField>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg bg-[#315C46] hover:bg-[#264937] text-white transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Authenticate Terminal Access</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-[#E4E3DC] flex items-center justify-between text-xs text-[#777D77]">
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="hover:text-[#315C46] transition-colors"
            >
              Register New Agency Officer
            </button>
            <button
              type="button"
              onClick={onNavigateToPublic}
              className="hover:text-[#171B19] transition-colors"
            >
              ← Public Bulletin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
