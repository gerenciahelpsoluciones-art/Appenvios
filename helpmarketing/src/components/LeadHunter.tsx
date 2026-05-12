import { useState } from 'react';
import { huntLeads, huntNearbyLeads } from '../services/geminiService';

// ── Tipos ────────────────────────────────────────────────────────────────────

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

interface NearbyLead {
  company: string;
  type: string;
  sector: string;
  zone: string;
  address: string;
  employees: string;
  webPresence: string;
  painPoint: string;
  opportunity: string;
  estimatedBudget: string;
  howToFind: string;
  approachScript: string;
  priority: 'Alta' | 'Media' | 'Baja';
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const priorityColor: Record<string, string> = {
  Alta:  'hsl(var(--success))',
  Media: 'hsl(45 100% 55%)',
  Baja:  'hsl(var(--text-muted))',
};

const webPresenceColor: Record<string, string> = {
  'Sin web':           'hsl(0 80% 60%)',
  'Solo Facebook':     'hsl(45 100% 55%)',
  'Web desactualizada':'hsl(45 100% 55%)',
  'Sin redes':         'hsl(0 80% 60%)',
};

const sizeIcon: Record<string, string> = { Pequeña: '🏢', Mediana: '🏬', Grande: '🏙️' };

const ZONAS = ['Fontibón', 'Engativá', 'Salitre', 'El Dorado', 'Modelia', 'Puente Aranda', 'Chapinero', 'Teusaquillo', 'Suba', 'Kennedy'];
const SECTORES_NEAR = ['Salud y clínicas', 'Restaurantes y comida', 'Ferreterías y construcción', 'Transporte y logística', 'Educación y academias', 'Comercio minorista', 'Servicios automotriz', 'Consultorios y profesionales'];
const RADIOS = ['500 metros', '1 km', '2 km', '5 km'];

// ── Componente ───────────────────────────────────────────────────────────────

export const LeadHunter = () => {
  const [mode, setMode] = useState<'sector' | 'nearby'>('sector');

  // modo sector
  const [sector, setSector]     = useState('Logística');
  const [location, setLocation] = useState('Bogotá');

  // modo nearby
  const [zona, setZona]         = useState('Fontibón');
  const [nearSector, setNearSector] = useState('Salud y clínicas');
  const [radio, setRadio]       = useState('1 km');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [isHunting, setIsHunting] = useState(false);
  const [leads, setLeads]         = useState<Lead[]>([]);
  const [nearbyLeads, setNearbyLeads] = useState<NearbyLead[]>([]);
  const [error, setError]         = useState('');

  const handleHunt = async () => {
    setIsHunting(true);
    setError('');
    setLeads([]);
    setNearbyLeads([]);
    try {
      if (mode === 'sector') {
        const data = await huntLeads(sector, location);
        setLeads(Array.isArray(data) ? data : []);
      } else {
        const data = await huntNearbyLeads(zona, nearSector, radio);
        setNearbyLeads(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      setError(err.message || 'Error al buscar prospectos');
    } finally {
      setIsHunting(false);
    }
  };

  const selectStyle = {
    background: 'hsla(var(--background-alt), 0.5)',
    padding: '1rem',
    color: 'white',
    border: '1px solid var(--glass-border)',
    borderRadius: '14px',
    marginTop: '0.5rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
    cursor: 'pointer',
  };

  const inputStyle = {
    ...selectStyle,
  };

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: '0.5rem' }}>Strategic Lead Hunter</h1>
      <p style={{ color: 'hsl(var(--text-muted))', fontSize: '1.1rem', marginBottom: '2rem' }}>
        Prospectos B2B generados con <strong style={{ color: 'hsl(var(--accent))' }}>Inteligencia Artificial</strong> para el mercado colombiano.
      </p>

      {/* Selector de modo */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { key: 'sector', icon: '🎯', label: 'Por Sector e Industria' },
          { key: 'nearby', icon: '📍', label: 'PYMEs sin Web — Cerca de Help Soluciones' },
        ].map(m => (
          <button key={m.key} onClick={() => { setMode(m.key as any); setLeads([]); setNearbyLeads([]); setError(''); }}
            style={{ flex: 1, padding: '0.85rem 1.25rem', fontWeight: 700, fontSize: '0.88rem', borderRadius: '12px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              background: mode === m.key ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.06)',
              color: mode === m.key ? '#fff' : 'hsl(var(--text-muted))',
              boxShadow: mode === m.key ? '0 4px 20px hsla(var(--primary), 0.3)' : 'none',
            }}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* Panel de búsqueda */}
      <div className="glass-card" style={{ borderLeft: `4px solid ${mode === 'nearby' ? 'hsl(var(--success))' : 'hsl(var(--primary))'}`, marginBottom: '2rem' }}>

        {mode === 'sector' ? (
          <>
            <h3 style={{ marginTop: 0, fontSize: '1.1rem', color: '#fff' }}>🎯 Búsqueda por sector</h3>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sector objetivo</label>
                <input style={inputStyle} placeholder="ej: Logística, Salud, Fintech…" value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleHunt()}
                  onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
                />
              </div>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ciudad / Región</label>
                <input style={inputStyle} placeholder="ej: Bogotá, Medellín…" value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleHunt()}
                  onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <h3 style={{ marginTop: 0, fontSize: '1.1rem', color: '#fff' }}>📍 PYMEs sin presencia web cerca de Help Soluciones</h3>
            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', margin: '0.5rem 0 1.25rem', lineHeight: 1.5 }}>
              Busca negocios físicos cercanos que <strong style={{ color: '#fff' }}>no tienen página web</strong> y son candidatos ideales para sus servicios. Incluye cómo encontrarlos y un guión de acercamiento.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Zona / Barrio</label>
                <select style={selectStyle} value={zona} onChange={(e) => setZona(e.target.value)}>
                  {ZONAS.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sector del negocio</label>
                <select style={selectStyle} value={nearSector} onChange={(e) => setNearSector(e.target.value)}>
                  {SECTORES_NEAR.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Radio de búsqueda</label>
                <select style={selectStyle} value={radio} onChange={(e) => setRadio(e.target.value)}>
                  {RADIOS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </>
        )}

        <button onClick={handleHunt} disabled={isHunting} style={{ marginTop: '1.5rem', width: '100%' }}>
          {isHunting ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              {mode === 'nearby' ? 'Buscando negocios en la zona...' : 'Analizando mercado con IA...'}
            </span>
          ) : mode === 'nearby' ? '📍 Buscar PYMEs sin Web Cercanas' : '🎯 Buscar Prospectos con IA'}
        </button>
      </div>

      {error && (
        <div className="glass-card" style={{ borderLeft: '4px solid hsl(0 80% 60%)', marginBottom: '1.5rem', color: 'hsl(0 80% 70%)' }}>
          ⚠ {error}
        </div>
      )}

      {/* Resultados modo sector */}
      {leads.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.3rem', color: '#fff', margin: 0 }}>
              {leads.length} Prospectos — {sector} en {location}
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'hsl(var(--text-muted))' }}>
              {leads.filter(l => l.priority === 'Alta').length} prioridad alta
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {leads.map((lead, i) => (
              <div key={i} className="glass-card" style={{ padding: '1.75rem', margin: 0, borderTop: `3px solid ${priorityColor[lead.priority]}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>{sizeIcon[lead.size] || '🏢'} {lead.company}</div>
                    <div style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))', marginTop: '0.2rem' }}>{lead.size} · {lead.location}</div>
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '20px', background: `${priorityColor[lead.priority]}20`, color: priorityColor[lead.priority] }}>{lead.priority}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '10px', background: 'hsla(var(--primary), 0.15)', color: 'hsl(var(--primary))' }}>{lead.sector}</span>
                  <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', color: 'hsl(var(--text-muted))' }}>Contacto: {lead.contact}</span>
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Dolor principal</div>
                  <p style={{ fontSize: '0.87rem', color: 'hsl(var(--text-muted))', margin: 0, lineHeight: 1.5 }}>{lead.painPoint}</p>
                </div>
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'hsla(var(--success), 0.06)', borderRadius: '10px', borderLeft: '3px solid hsl(var(--success))' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'hsl(var(--success))', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Oportunidad</div>
                  <p style={{ fontSize: '0.87rem', color: '#fff', margin: 0, lineHeight: 1.5 }}>{lead.opportunity}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'hsl(var(--accent))', fontWeight: 600 }}>{lead.estimatedBudget}</span>
                  <button style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}>Generar Outreach</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resultados modo nearby */}
      {nearbyLeads.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.3rem', color: '#fff', margin: 0 }}>
              📍 {nearbyLeads.length} PYMEs sin web — {nearSector} en {zona}
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'hsl(var(--text-muted))' }}>
              {nearbyLeads.filter(l => l.priority === 'Alta').length} oportunidad alta
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {nearbyLeads.map((lead, i) => (
              <div key={i} className="glass-card" style={{ margin: 0, padding: 0, overflow: 'hidden', borderLeft: `4px solid ${priorityColor[lead.priority]}` }}>

                {/* Header — siempre visible */}
                <div
                  style={{ padding: '1.25rem 1.5rem', cursor: 'pointer', display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center' }}
                  onClick={() => setExpandedId(expandedId === i ? null : i)}
                >
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>{lead.company}</div>
                      <div style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))', marginTop: '0.15rem' }}>
                        {lead.type} · 📍 {lead.zone} · 👥 {lead.employees} empleados
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '8px', background: `${webPresenceColor[lead.webPresence] ?? 'hsl(0 80% 60%)'}22`, color: webPresenceColor[lead.webPresence] ?? 'hsl(0 80% 60%)' }}>
                        🌐 {lead.webPresence}
                      </span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '8px', background: `${priorityColor[lead.priority]}20`, color: priorityColor[lead.priority] }}>
                        {lead.priority}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: '1rem', color: 'hsl(var(--text-muted))', transition: 'transform 0.2s', transform: expandedId === i ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</div>
                </div>

                {/* Detalle expandible */}
                {expandedId === i && (
                  <div style={{ padding: '0 1.5rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', paddingTop: '1.25rem' }}>

                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '0.4rem' }}>🗺 Cómo encontrarlo</div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#fff', lineHeight: 1.55 }}>{lead.howToFind}</p>
                      <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'hsl(var(--text-muted))' }}>📌 {lead.address}</div>
                    </div>

                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'hsl(0 80% 60%)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>⚡ Dolor detectado</div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'hsl(var(--text-muted))', lineHeight: 1.55 }}>{lead.painPoint}</p>
                    </div>

                    <div style={{ padding: '1rem', background: 'hsla(var(--success), 0.06)', borderRadius: '10px', borderLeft: '3px solid hsl(var(--success))' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'hsl(var(--success))', textTransform: 'uppercase', marginBottom: '0.4rem' }}>💼 Primer servicio a ofrecer</div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#fff', lineHeight: 1.55 }}>{lead.opportunity}</p>
                      <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'hsl(var(--accent))', fontWeight: 600 }}>{lead.estimatedBudget}</div>
                    </div>

                    <div style={{ padding: '1rem', background: 'hsla(var(--primary), 0.08)', borderRadius: '10px', borderLeft: '3px solid hsl(var(--primary))', gridColumn: 'span 2' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'hsl(var(--primary))', textTransform: 'uppercase', marginBottom: '0.4rem' }}>🗣 Guión de acercamiento</div>
                      <p style={{ margin: 0, fontSize: '0.88rem', color: '#fff', lineHeight: 1.65, fontStyle: 'italic' }}>"{lead.approachScript}"</p>
                      <button
                        onClick={() => navigator.clipboard?.writeText(lead.approachScript)}
                        style={{ marginTop: '0.75rem', fontSize: '0.75rem', padding: '0.35rem 0.8rem', background: 'hsla(var(--primary), 0.2)', color: 'hsl(var(--primary))', border: '1px solid hsla(var(--primary), 0.3)', width: 'auto' }}
                      >
                        📋 Copiar guión
                      </button>
                    </div>

                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
