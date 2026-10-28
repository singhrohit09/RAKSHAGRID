import React from 'react';
import { useRaksha } from '../context/RakshaContext';
import { 
  ShieldAlert, 
  AlertTriangle, 
  PhoneCall, 
  Home, 
  FileText, 
  Droplets, 
  Flame, 
  CheckCircle2, 
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDateTime } from '../utils/formatters';

export const PublicBulletinPage: React.FC = () => {
  const { alerts, shelters, settings } = useRaksha();

  const activeDemoAlerts = alerts.filter(a => a.status === 'Approved for Demo');

  // Authoritative verified public emergency numbers (India Standard)
  const emergencyContacts = [
    { name: 'National Emergency Response Helpline', number: '112', verified: true, note: 'Toll-free 24/7 unified police, fire, medical' },
    { name: 'NDRF Disaster Operations Control', number: '011-24363260', verified: true, note: 'HQ Disaster Response coordination' },
    { name: 'Disaster Management Services Helpline', number: '1078', verified: true, note: 'National Disaster Management Authority (NDMA)' },
    { name: 'Ambulance & Medical Emergency', number: '108 / 102', verified: true, note: 'State emergency medical transport' },
    { name: 'Fire Control Command', number: '101', verified: true, note: 'City & regional fire stations' }
  ];

  return (
    <div className="min-h-screen bg-charcoal-deep text-primary font-sans antialiased">
      {/* Top Warning Banner: Prototype & Simulation Disclaimer */}
      <div className="bg-emergency border-b border-emergency-dark text-white px-4 py-2.5 text-xs text-center font-bold tracking-wide flex items-center justify-center gap-2 shadow-lg">
        <ShieldAlert className="w-4 h-4 shrink-0 animate-bounce" />
        <span>
          PUBLIC NOTICE: THIS IS A DEMO & EXERCISE ENVIRONMENT (RAKSHAGRID PHASE 1). NOT AN OFFICIAL GOVERNMENT ALERT. FOR REAL EMERGENCIES IN INDIA, IMMEDIATELY DIAL 112.
        </span>
      </div>

      {/* Navigation Header */}
      <header className="bg-panel border-b border-border px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-emergency/20 border border-emergency/40 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-emergency" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-extrabold tracking-wider text-primary">
              RAKSHAGRID <span className="text-emergency">PUBLIC BULLETIN</span>
            </h1>
            <p className="text-[10px] font-mono text-primary-dim uppercase tracking-wider">
              Disaster Preparedness & Simulated Civil Warning Portal
            </p>
          </div>
        </div>

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded bg-panel-elevated hover:bg-panel-subtle border border-border text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Internal Dashboard</span>
        </Link>
      </header>

      {/* Main Public Container */}
      <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
        {/* Jurisdiction & Active Exercise Status */}
        <div className="bg-panel border border-border rounded-lg p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-hazard/15 text-hazard border border-hazard/30 uppercase font-bold tracking-wider inline-block mb-1.5">
              DRILL SCENARIO ACTIVE
            </span>
            <h2 className="text-lg font-bold text-primary">
              Monitoring Region: {settings.operatingRegion}
            </h2>
            <p className="text-xs text-primary-muted mt-0.5">
              Coordinated by {settings.operationsCenterName}
            </p>
          </div>

          <div className="text-left md:text-right font-mono text-xs text-primary-dim">
            <div>CURRENT TIME (IST):</div>
            <div className="text-primary font-bold text-sm mt-0.5">
              {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} • {new Date().toLocaleTimeString('en-GB')}
            </div>
          </div>
        </div>

        {/* Active Emergency Warnings Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <AlertTriangle className="w-5 h-5 text-emergency" />
            <h2 className="text-base font-extrabold uppercase tracking-wide text-primary">
              Active Civil Warnings & Advisories ({activeDemoAlerts.length})
            </h2>
          </div>

          {activeDemoAlerts.length === 0 ? (
            <div className="p-8 text-center bg-panel border border-border rounded-lg text-xs text-primary-muted">
              No active emergency evacuation orders or severe warnings published in the demo bulletin at this moment.
            </div>
          ) : (
            activeDemoAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-panel border-2 border-emergency/70 rounded-lg p-5 space-y-4 shadow-xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 border-b border-border pb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emergency text-white font-extrabold uppercase tracking-wider">
                        {alert.type}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-charcoal border border-border text-hazard font-bold uppercase">
                        {alert.severity} SEVERITY
                      </span>
                      <span className="text-[10px] font-mono text-primary-dim">
                        REF: {alert.id}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-white mt-1">
                      {alert.title}
                    </h3>
                    <p className="text-xs text-hazard font-mono mt-0.5">
                      AFFECTED AREA: {alert.targetRegion}
                    </p>
                  </div>

                  <div className="text-left sm:text-right font-mono text-[11px] text-primary-dim shrink-0">
                    <div>ISSUED:</div>
                    <div className="text-primary font-medium">{formatDateTime(alert.createdAt)}</div>
                  </div>
                </div>

                {/* Message Body */}
                <p className="text-xs md:text-sm text-primary leading-relaxed bg-charcoal p-3.5 rounded border border-border">
                  {alert.body}
                </p>

                {/* Protective Actions */}
                {alert.safetyActions.length > 0 && (
                  <div className="p-4 bg-panel-elevated rounded border border-border space-y-2">
                    <h4 className="text-xs font-bold text-hazard uppercase tracking-wider font-mono">
                      Recommended Public Protective Instructions:
                    </h4>
                    <ul className="space-y-1.5 text-xs text-primary">
                      {alert.safetyActions.map((action, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded bg-emergency/20 text-emergency text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="leading-snug">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </section>

        {/* Designated Evacuation Shelters Directory */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Home className="w-5 h-5 text-safe" />
            <h2 className="text-base font-extrabold uppercase tracking-wide text-primary">
              Emergency Shelter Information Directory (Simulated)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {shelters.slice(0, 4).map((s) => (
              <div
                key={s.id}
                className="bg-panel border border-border rounded-lg p-4 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-primary">{s.name}</h4>
                    <p className="text-primary-muted text-[11px]">{s.address} ({s.region})</p>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border uppercase ${
                    s.status === 'Full' 
                      ? 'bg-emergency/15 text-emergency border-emergency/30' 
                      : s.status === 'Near Capacity' 
                      ? 'bg-hazard/15 text-hazard border-hazard/30' 
                      : 'bg-safe/15 text-safe border-safe/30'
                  }`}>
                    {s.status}
                  </span>
                </div>

                <div className="flex items-center justify-between font-mono text-[11px] pt-1 text-primary-dim">
                  <span>Available Beds: {Math.max(0, s.capacity - s.currentOccupancy)}</span>
                  <span>Contact: {s.contactPhone}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-primary-dim">
            *Shelter directories are fictional for this drill exercise. In actual disasters, verify evacuation routes through official police or civil defence bulletins.
          </p>
        </section>

        {/* Public Preparedness Guides */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <FileText className="w-5 h-5 text-operational-cyan" />
            <h2 className="text-base font-extrabold uppercase tracking-wide text-primary">
              Disaster Safety & Preparedness Protocols
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Floods */}
            <div className="bg-panel border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-operational-cyan font-bold">
                <Droplets className="w-4 h-4" />
                <span>Flood & Flash Flood Survival Guide</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-primary-muted leading-relaxed">
                <li>Never drive or walk across submerged roads or bridges (&quot;Turn Around, Don&apos;t Drown&quot;).</li>
                <li>Switch off main domestic electricity board and close LPG cylinders before evacuating.</li>
                <li>Store drinking water in sanitized containers and keep emergency medication in sealed ziploc bags.</li>
                <li>Seek upper floors if rapid rising water traps you inside; do not climb into enclosed attics.</li>
              </ul>
            </div>

            {/* Industrial Hazmat */}
            <div className="bg-panel border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-hazard font-bold">
                <Flame className="w-4 h-4" />
                <span>Industrial Fire & Toxic Chemical Plume</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-primary-muted leading-relaxed">
                <li>If sheltering in place: shut all doors, windows, and turn off air conditioning ventilation.</li>
                <li>Cover nose and mouth with a wet handkerchief or N95 mask to reduce smoke inhalation.</li>
                <li>Move crosswind (perpendicular to wind direction) away from the industrial plume source.</li>
                <li>Wash exposed skin immediately with clean tap water if chemical stinging occurs.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Official Emergency Contact Directory */}
        <section className="bg-panel border border-border rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <PhoneCall className="w-5 h-5 text-safe" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-primary">
              Official 24/7 National Emergency Helplines (Verified)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {emergencyContacts.map((contact, idx) => (
              <div
                key={idx}
                className="p-3 bg-charcoal rounded border border-border flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono font-bold text-emergency">
                      {contact.number}
                    </span>
                    {contact.verified && (
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-safe/10 text-safe border border-safe/30 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> VERIFIED
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-xs text-primary mt-1">{contact.name}</h4>
                </div>
                <p className="text-[10px] text-primary-dim mt-1.5">{contact.note}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Public Footer */}
      <footer className="mt-12 border-t border-border bg-panel py-6 px-4 text-center text-xs text-primary-dim space-y-1">
        <p className="font-mono font-semibold text-primary-muted">
          RakshaGrid Disaster Intelligence Platform — Phase 1 Application Foundation
        </p>
        <p>
          Tagline: &quot;Disaster Intelligence. Coordinated Response. Safer Communities.&quot;
        </p>
        <p className="text-[10px]">
          Operational Prototype. Non-commercial emergency management software demo.
        </p>
      </footer>
    </div>
  );
};
