import React, { useState } from 'react';
import { useRaksha } from '../../context/RakshaContext';
import { PERSONAS } from '../../utils/permissions';
import { PersonaId } from '../../types/role';
import { Shield, ChevronDown, Check } from 'lucide-react';
import { Modal } from '../common/Modal';

export const PersonaSelector: React.FC = () => {
  const { activePersonaId, setActivePersonaId } = useRaksha();
  const [isOpen, setIsOpen] = useState(false);
  const activePersona = PERSONAS[activePersonaId];

  const handleSelect = (id: PersonaId) => {
    setActivePersonaId(id);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-panel-elevated hover:bg-panel-subtle border border-border transition-colors text-left"
        title="Switch Demo Persona / Role"
      >
        <div className="w-6 h-6 rounded bg-emergency/20 text-emergency border border-emergency/40 flex items-center justify-center font-bold text-xs font-mono">
          {activePersona.avatarInitials}
        </div>
        <div className="hidden sm:block">
          <div className="text-xs font-semibold text-primary truncate max-w-[140px]">
            {activePersona.name}
          </div>
          <div className="text-[10px] text-primary-muted font-mono truncate max-w-[140px]">
            {activePersona.roleLabel}
          </div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-primary-dim ml-1" />
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Operational Role & Persona Switcher"
        subtitle="Simulate distinct responder authorities and role-based action permissions (Demo Mode only)."
        maxWidth="lg"
      >
        <div className="space-y-3">
          <div className="p-3 bg-hazard/10 border border-hazard/30 rounded text-xs text-primary-muted flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-hazard shrink-0 mt-0.5" />
            <span>
              <strong>DEMO SIMULATION ONLY:</strong> This persona switcher modifies client-side capability tokens for interface evaluation. Phase 2 introduces genuine zero-trust server-side authentication.
            </span>
          </div>

          <div className="space-y-2 mt-4">
            {Object.values(PERSONAS).map((p) => {
              const isSelected = p.id === activePersonaId;
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelect(p.id)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-start justify-between gap-3 ${
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
                      <p className="text-xs text-primary-muted mt-1.5 leading-relaxed">
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
      </Modal>
    </>
  );
};
