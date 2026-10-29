import React, { useState } from 'react';
import { useRaksha } from '../../context/RakshaContext';
import { PERSONAS } from '../../utils/permissions';
import { PersonaId } from '../../types/role';
import { Shield, ChevronDown, Check, UserCheck, Lock, LogIn, LogOut, KeyRound } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

export const PersonaSelector: React.FC = () => {
  const { 
    activePersonaId, 
    setActivePersonaId, 
    currentUser, 
    isAuthenticated, 
    backendConnected, 
    isDemoMode,
    login, 
    logout 
  } = useRaksha();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'personas' | 'login'>('personas');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activePersona = PERSONAS[activePersonaId];

  const handleSelect = (id: PersonaId) => {
    setActivePersonaId(id);
    setIsOpen(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      setAuthError('Please enter both email and password.');
      return;
    }
    setIsSubmitting(true);
    setAuthError(null);
    const res = await login(emailInput, passwordInput);
    setIsSubmitting(false);
    if (!res.success) {
      setAuthError(res.error || 'Authentication failed');
    } else {
      setIsOpen(false);
      setEmailInput('');
      setPasswordInput('');
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-panel-elevated hover:bg-panel-subtle border border-border transition-colors text-left"
        title="Account & Persona Settings"
      >
        <div className="w-6 h-6 rounded bg-emergency/20 text-emergency border border-emergency/40 flex items-center justify-center font-bold text-xs font-mono">
          {currentUser ? currentUser.displayName.slice(0, 2).toUpperCase() : activePersona.avatarInitials}
        </div>
        <div className="hidden sm:block">
          <div className="text-xs font-semibold text-primary truncate max-w-[140px]">
            {currentUser ? currentUser.displayName : activePersona.name}
          </div>
          <div className="text-[10px] text-primary-muted font-mono truncate max-w-[140px] flex items-center gap-1">
            <span>{currentUser ? currentUser.role.toUpperCase() : activePersona.roleLabel}</span>
            {isAuthenticated && <span className="w-1.5 h-1.5 rounded-full bg-safe" />}
          </div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-primary-dim ml-1" />
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => { setIsOpen(false); setAuthError(null); }}
        title="Identity, Roles & Authentication"
        subtitle={backendConnected && !isDemoMode 
          ? "Connected to live relational backend with server-side RBAC and session security." 
          : "Operating in standalone evaluation demo simulation mode."}
        maxWidth="lg"
      >
        <div className="space-y-4">
          {/* Status banner */}
          <div className="flex items-center justify-between p-3 bg-panel-elevated border border-border rounded-lg text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${backendConnected && !isDemoMode ? 'bg-safe animate-pulse' : 'bg-hazard'}`} />
              <span className="font-semibold text-primary">
                {backendConnected && !isDemoMode ? 'Persistent Relational Database Active' : 'Standalone Simulated State (Local Demo)'}
              </span>
            </div>
            {isAuthenticated && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-safe/20 text-safe border border-safe/30 flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                Session Verified
              </span>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-border text-xs font-medium">
            <button
              onClick={() => setActiveTab('personas')}
              className={`pb-2.5 px-3 border-b-2 font-semibold transition-colors ${
                activeTab === 'personas'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-primary-dim hover:text-primary-muted'
              }`}
            >
              Simulated Personas ({Object.keys(PERSONAS).length})
            </button>
            <button
              onClick={() => setActiveTab('login')}
              className={`pb-2.5 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'login'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-primary-dim hover:text-primary-muted'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Direct Sign-In
            </button>
          </div>

          {/* Tab 1: Personas */}
          {activeTab === 'personas' && (
            <div className="space-y-3">
              <div className="p-2.5 bg-hazard/10 border border-hazard/30 rounded text-xs text-primary-muted flex items-start gap-2">
                <Shield className="w-4 h-4 text-hazard shrink-0 mt-0.5" />
                <span>
                  Select any persona below to preview client-side capability tokens and dashboard perspectives in Demo Simulation mode. Live operations require verified credentials under the Direct Sign-In tab.
                </span>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {Object.values(PERSONAS).map((p) => {
                  const isSelected = p.id === activePersonaId;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelect(p.id)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-panel-subtle border-primary text-primary ring-1 ring-primary/40'
                          : 'bg-panel-elevated border-border hover:border-border-subtle text-primary-muted hover:text-primary'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded bg-charcoal border border-border flex items-center justify-center font-mono font-bold text-xs text-primary shrink-0">
                          {p.avatarInitials}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-primary">{p.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-panel border border-border text-primary-dim">
                              {p.callsign}
                            </span>
                          </div>
                          <div className="text-xs font-medium text-hazard mt-0.5">{p.roleLabel}</div>
                          <div className="text-[11px] text-primary-dim mt-0.5">{p.department}</div>
                          <p className="text-xs text-primary-muted mt-1 leading-relaxed">
                            {p.description}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {p.permissions.slice(0, 4).map((perm) => (
                              <span
                                key={perm}
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-charcoal text-primary-dim border border-border"
                              >
                                {perm.replace(/_/g, ' ')}
                              </span>
                            ))}
                            {p.permissions.length > 4 && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-charcoal text-primary-dim border border-border">
                                +{p.permissions.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="p-1 rounded bg-safe/20 text-safe shrink-0">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Direct Sign-In Form */}
          {activeTab === 'login' && (
            <div className="space-y-4 py-1">
              {currentUser ? (
                <div className="p-4 bg-panel-elevated border border-border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-primary">{currentUser.displayName}</div>
                      <div className="text-xs text-primary-muted font-mono">{currentUser.email}</div>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-charcoal border border-border text-hazard uppercase">
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="text-xs text-primary-dim space-y-1">
                    <div>Department: <span className="text-primary-muted">{currentUser.department || 'Incident Operations'}</span></div>
                    <div>Callsign: <span className="text-primary-muted">{currentUser.callsign || 'HQ-OPERATIONS'}</span></div>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={async () => {
                        await logout();
                        setIsOpen(false);
                      }}
                      className="w-full text-xs text-emergency hover:text-emergency flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out (Switch to Local Demo)
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  {authError && (
                    <div className="p-2.5 rounded bg-emergency/10 border border-emergency/30 text-emergency text-xs">
                      {authError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-primary-muted mb-1">
                      Operations Email Address
                    </label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="e.g. admin@rakshagrid.gov.in"
                      className="w-full bg-charcoal border border-border rounded px-3 py-1.5 text-xs text-primary focus:outline-none focus:border-border-subtle"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-primary-muted mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-charcoal border border-border rounded px-3 py-1.5 text-xs text-primary focus:outline-none focus:border-border-subtle"
                      required
                    />
                  </div>

                  <div className="p-2.5 bg-panel-elevated border border-border rounded text-[11px] text-primary-dim space-y-1">
                    <div className="font-semibold text-primary-muted flex items-center gap-1">
                      <Lock className="w-3 h-3 text-hazard" />
                      Secure Operator Authentication:
                    </div>
                    <div>
                      Sign in using credentials provisioned by your Incident Command authority. In development mode, check your server console or run <code className="text-primary font-mono">npm run server:bootstrap-admin</code> to provision a console administrator.
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                    className="w-full text-xs flex items-center justify-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    {isSubmitting ? 'Authenticating...' : 'Sign In to Operations Console'}
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};
