import { useState } from 'react';
import { analyzeCompetitor } from '../services/geminiService';

interface Analysis {
  strengths: string[];
  weaknesses: string[];
  differentiator: string;
  threatLevel: string;
  marketStrategy: string;
  opportunities: string[];
}

interface Competitor {
  id: number;
  name: string;
  website: string;
  analysis?: Analysis;
  isAnalyzing?: boolean;
  error?: string;
}

const threatColor: Record<string, string> = {
  Alto: 'hsl(var(--error, 0 80% 60%))',
  Medio: 'hsl(45 100% 55%)',
  Bajo: 'hsl(var(--success))',
};

export const CompetitorTracker = () => {
  const [competitors, setCompetitors] = useState<Competitor[]>([
    { id: 1, name: 'Sistemas.com.co', website: 'https://sistemas.com.co' },
    { id: 2, name: 'Torus Systems', website: 'https://torusystems.co' },
    { id: 3, name: 'CMLABTEC', website: 'https://cmlabtec.com' },
  ]);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const handleAdd = () => {
    if (!newName.trim() || !newUrl.trim()) return;
    setCompetitors(prev => [...prev, {
      id: Date.now(),
      name: newName.trim(),
      website: newUrl.startsWith('http') ? newUrl.trim() : `https://${newUrl.trim()}`,
    }]);
    setNewName('');
    setNewUrl('');
  };

  const handleRemove = (id: number) => {
    setCompetitors(prev => prev.filter(c => c.id !== id));
  };

  const handleAnalyze = async (id: number) => {
    const comp = competitors.find(c => c.id === id);
    if (!comp) return;
    setCompetitors(prev => prev.map(c => c.id === id ? { ...c, isAnalyzing: true, error: undefined } : c));
    try {
      const result = await analyzeCompetitor(comp.name, comp.website);
      setCompetitors(prev => prev.map(c => c.id === id ? { ...c, analysis: result, isAnalyzing: false } : c));
    } catch (err: any) {
      setCompetitors(prev => prev.map(c => c.id === id ? { ...c, isAnalyzing: false, error: err.message || 'Error al analizar' } : c));
    }
  };

  return (
    <div className="animate-fade-in">
      <h1>Competitor Tracker</h1>
      <p style={{ color: 'hsl(var(--text-muted))', marginBottom: '2.5rem' }}>
        Analiza a tu competencia con IA para encontrar ventajas estratégicas en el mercado colombiano.
      </p>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginTop: 0 }}>Agregar Competidor</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label htmlFor="comp-name" style={{ fontSize: '0.75rem', fontWeight: '700', color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Nombre</label>
            <input
              id="comp-name"
              name="comp-name"
              autoComplete="organization"
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', padding: '0.8rem', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '12px', marginTop: '0.4rem', boxSizing: 'border-box', outline: 'none' }}
              placeholder="ej: Sistemas Andinos…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
              onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
            />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label htmlFor="comp-url" style={{ fontSize: '0.75rem', fontWeight: '700', color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Website</label>
            <input
              id="comp-url"
              name="comp-url"
              type="url"
              autoComplete="url"
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', padding: '0.8rem', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '12px', marginTop: '0.4rem', boxSizing: 'border-box', outline: 'none' }}
              placeholder="ej: sistemasandinos.co…"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
              onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
            />
          </div>
          <button onClick={handleAdd} style={{ padding: '0.8rem 1.5rem', width: 'auto' }}>Agregar</button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {competitors.map(comp => (
          <div key={comp.id} className="glass-card" style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: comp.analysis ? '1.5rem' : 0 }}>
              <div>
                <h3 style={{ margin: 0 }}>{comp.name}</h3>
                <a href={comp.website} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: 'hsl(var(--accent))', textDecoration: 'none' }}>{comp.website}</a>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button
                  onClick={() => handleAnalyze(comp.id)}
                  disabled={comp.isAnalyzing}
                  style={{ fontSize: '0.85rem', width: 'auto', padding: '0.6rem 1.2rem' }}
                >
                  {comp.isAnalyzing ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <svg aria-hidden="true" className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                      Analizando...
                    </span>
                  ) : comp.analysis ? 'Actualizar' : 'Analizar con IA'}
                </button>
                <button
                  onClick={() => handleRemove(comp.id)}
                  aria-label={`Eliminar ${comp.name}`}
                  style={{ background: 'transparent', border: '1px solid var(--glass-border)', boxShadow: 'none', padding: '0.6rem', width: 'auto', color: 'hsl(var(--text-muted))' }}
                >
                  <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>
                </button>
              </div>
            </div>

            {comp.error && (
              <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'hsla(0, 80%, 60%, 0.1)', borderRadius: '10px', color: 'hsl(0 80% 70%)', fontSize: '0.9rem' }}>
                {comp.error}
              </div>
            )}

            {comp.analysis && (
              <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                <div>
                  <div style={{ color: 'hsl(var(--success))', fontSize: '0.75rem', fontWeight: '800', marginBottom: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Fortalezas</div>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'hsl(var(--text-main))', fontSize: '0.9rem', lineHeight: '1.8' }}>
                    {comp.analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div>
                  <div style={{ color: 'hsl(var(--error, 0 80% 60%))', fontSize: '0.75rem', fontWeight: '800', marginBottom: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Debilidades</div>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'hsl(var(--text-main))', fontSize: '0.9rem', lineHeight: '1.8' }}>
                    {comp.analysis.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
                {comp.analysis.opportunities?.length > 0 && (
                  <div>
                    <div style={{ color: 'hsl(var(--accent))', fontSize: '0.75rem', fontWeight: '800', marginBottom: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Oportunidades para Help</div>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'hsl(var(--text-main))', fontSize: '0.9rem', lineHeight: '1.8' }}>
                      {comp.analysis.opportunities.map((o, i) => <li key={i}>{o}</li>)}
                    </ul>
                  </div>
                )}
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ background: 'hsla(var(--primary), 0.06)', padding: '1.2rem 1.5rem', borderRadius: '14px', borderLeft: '4px solid hsl(var(--primary))', marginBottom: '1rem' }}>
                    <div style={{ fontWeight: '800', fontSize: '0.8rem', marginBottom: '0.4rem', color: 'hsl(var(--primary))', textTransform: 'uppercase' }}>Diferenciador Help Soluciones</div>
                    <div style={{ color: 'hsl(var(--text-main))', fontStyle: 'italic', fontSize: '1rem', lineHeight: '1.6' }}>"{comp.analysis.differentiator}"</div>
                  </div>
                  <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ color: 'hsl(var(--text-muted))' }}>Nivel de amenaza: </span>
                      <span style={{ color: threatColor[comp.analysis.threatLevel] || '#fff', fontWeight: '800' }}>{comp.analysis.threatLevel}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ color: 'hsl(var(--text-muted))' }}>Estrategia: </span>
                      <span style={{ color: 'hsl(var(--text-main))' }}>{comp.analysis.marketStrategy}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
