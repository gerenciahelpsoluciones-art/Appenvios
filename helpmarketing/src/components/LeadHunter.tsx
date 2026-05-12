import { useState } from 'react';
import { huntLeads } from '../services/geminiService';

interface Lead {
  company: string;
  sector: string;
  size: string;
  location: string;
  contact: string;
  painPoint: string;
  opportunity: string;
  priority: 'Alta' | 'Media' | 'Baja';
  estimatedBudget: string;
}

const priorityColor: Record<string, string> = {
  Alta: 'hsl(var(--success))',
  Media: 'hsl(var(--warning, 45 100% 55%))',
  Baja: 'hsl(var(--text-muted))',
};

const sizeIcon: Record<string, string> = { Pequeña: '🏢', Mediana: '🏬', Grande: '🏙️' };

export const LeadHunter = () => {
  const [sector, setSector] = useState('Logística');
  const [location, setLocation] = useState('Bogotá');
  const [isHunting, setIsHunting] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState('');

  const handleHunt = async () => {
    if (!sector.trim() || !location.trim()) return;
    setIsHunting(true);
    setError('');
    setLeads([]);
    try {
      const data = await huntLeads(sector, location);
      setLeads(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Error al buscar prospectos');
    } finally {
      setIsHunting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: '0.5rem' }}>Strategic Lead Hunter</h1>
      <p style={{ color: 'hsl(var(--text-muted))', fontSize: '1.1rem', marginBottom: '3rem' }}>
        Prospectos B2B generados con <strong style={{ color: 'hsl(var(--accent))' }}>Inteligencia Artificial</strong> para el mercado colombiano.
      </p>

      <div className="glass-card" style={{ borderLeft: '4px solid hsl(var(--primary))' }}>
        <h3 style={{ marginTop: 0, fontSize: '1.25rem', color: '#fff' }}>Parámetros de búsqueda</h3>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <label htmlFor="lead-sector" style={{ fontSize: '0.75rem', fontWeight: '700', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sector objetivo</label>
            <input
              id="lead-sector"
              name="sector"
              autoComplete="off"
              style={{ width: '100%', background: 'hsla(var(--background-alt), 0.5)', padding: '1rem', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '14px', marginTop: '0.5rem', outline: 'none', boxSizing: 'border-box' }}
              onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
              onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
              placeholder="ej: Logística, Salud, Fintech…"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleHunt()}
            />
          </div>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <label htmlFor="lead-location" style={{ fontSize: '0.75rem', fontWeight: '700', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ciudad / Región</label>
            <input
              id="lead-location"
              name="location"
              autoComplete="off"
              style={{ width: '100%', background: 'hsla(var(--background-alt), 0.5)', padding: '1rem', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '14px', marginTop: '0.5rem', outline: 'none', boxSizing: 'border-box' }}
              onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
              onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
              placeholder="ej: Bogotá, Medellín…"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleHunt()}
            />
          </div>
        </div>
        <button onClick={handleHunt} disabled={isHunting} style={{ marginTop: '2rem', width: '100%' }}>
          {isHunting ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
              <svg aria-hidden="true" className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              Analizando mercado con IA...
            </span>
          ) : 'Buscar Prospectos con IA'}
        </button>
      </div>

      {error && (
        <div className="glass-card" style={{ borderLeft: '4px solid hsl(var(--error, 0 80% 60%))', marginTop: '1.5rem', color: 'hsl(var(--error, 0 80% 60%))' }}>
          {error}
        </div>
      )}

      {leads.length > 0 && (
        <div style={{ marginTop: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.4rem', color: '#fff', margin: 0 }}>
              {leads.length} Prospectos Calificados — {sector} en {location}
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
              {leads.filter(l => l.priority === 'Alta').length} prioridad alta
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            {leads.map((lead, i) => (
              <div key={i} className="glass-card" style={{ padding: '1.75rem', margin: 0, borderTop: `3px solid ${priorityColor[lead.priority] || 'hsl(var(--primary))'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontWeight: '800', fontSize: '1.2rem', color: '#fff' }}>
                      {sizeIcon[lead.size] || '🏢'} {lead.company}
                    </span>
                    <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginTop: '0.2rem' }}>
                      {lead.size} · {lead.location}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '0.3rem 0.75rem', borderRadius: '20px', background: `${priorityColor[lead.priority]}20`, color: priorityColor[lead.priority], whiteSpace: 'nowrap' }}>
                    {lead.priority}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '10px', background: 'hsla(var(--primary), 0.15)', color: 'hsl(var(--primary))' }}>{lead.sector}</span>
                  <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '10px', background: 'hsla(var(--text-muted), 0.15)', color: 'hsl(var(--text-muted))' }}>Contacto: {lead.contact}</span>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Dolor principal</div>
                  <p style={{ fontSize: '0.9rem', color: 'hsl(var(--text-muted))', margin: 0, lineHeight: '1.5' }}>{lead.painPoint}</p>
                </div>

                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'hsla(var(--success), 0.05)', borderRadius: '10px', borderLeft: '3px solid hsl(var(--success))' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'hsl(var(--success))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Oportunidad</div>
                  <p style={{ fontSize: '0.9rem', color: '#fff', margin: 0, lineHeight: '1.5' }}>{lead.opportunity}</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'hsl(var(--accent))', fontWeight: '600' }}>{lead.estimatedBudget}</span>
                  <button style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}>Generar Outreach</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
