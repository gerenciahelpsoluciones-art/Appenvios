import { useState } from 'react';
import { optimizeGoogleBusiness } from '../services/geminiService';

interface GmbOptimization {
  keywords: string[];
  description: string;
  postIdea: { title: string; content: string };
  categories: string[];
  tips: string[];
}

export const GoogleBusinessOptimizer = () => {
  const [info, setInfo] = useState('Help Soluciones SAS - Mantenimiento de computadores y servidores en Bogotá. Ofrecemos soporte técnico, renta de equipos, cableado estructurado y soluciones informáticas para empresas.');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<GmbOptimization | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleOptimize = async () => {
    if (!info.trim()) return;
    setIsAnalyzing(true);
    setError('');
    try {
      const data = await optimizeGoogleBusiness(info);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error al optimizar. Verifica tu conexión.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyDescription = () => {
    if (result?.description) {
      navigator.clipboard.writeText(result.description);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="animate-fade-in">
      <h1>Google Business Optimizer</h1>
      <p style={{ color: 'hsl(var(--text-muted))', marginBottom: '2rem' }}>
        Optimiza tu perfil de Google My Business para dominar la búsqueda local en Colombia.
      </p>

      <div className="glass-card" style={{ marginBottom: '2.5rem', textAlign: 'left' }}>
        <h3 style={{ marginTop: 0 }}>Información de tu negocio</h3>
        <textarea
          style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '1.2rem', color: 'white', fontFamily: 'inherit', fontSize: '0.95rem', minHeight: '120px', marginBottom: '1.5rem', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
          value={info}
          onChange={(e) => setInfo(e.target.value)}
          placeholder="Describe tu empresa: nombre, servicios, ciudad, diferenciadores..."
          onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
          onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
        />
        <button onClick={handleOptimize} disabled={isAnalyzing} style={{ width: '100%' }}>
          {isAnalyzing ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
              <svg aria-hidden="true" className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              Optimizando perfil con IA...
            </span>
          ) : 'Optimizar Perfil de Google Business'}
        </button>
        {error && <div style={{ marginTop: '1rem', color: 'hsl(0 80% 70%)', fontSize: '0.9rem' }}>{error}</div>}
      </div>

      {result && (
        <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div className="glass-card" style={{ textAlign: 'left' }}>
            <h4 style={{ color: 'hsl(var(--accent))', marginTop: 0, fontSize: '0.82rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Palabras clave locales</h4>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
              {result.keywords.map((k, i) => (
                <span key={i} style={{ fontSize: '0.82rem', padding: '0.3rem 0.8rem', borderRadius: '20px', background: 'hsla(var(--success), 0.12)', color: 'hsl(var(--success))' }}>{k}</span>
              ))}
            </div>
          </div>

          {result.categories?.length > 0 && (
            <div className="glass-card" style={{ textAlign: 'left' }}>
              <h4 style={{ color: 'hsl(var(--primary))', marginTop: 0, fontSize: '0.82rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Categorías recomendadas</h4>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                {result.categories.map((c, i) => (
                  <span key={i} style={{ fontSize: '0.82rem', padding: '0.3rem 0.8rem', borderRadius: '20px', background: 'hsla(var(--primary), 0.12)', color: 'hsl(var(--primary))' }}>{c}</span>
                ))}
              </div>
            </div>
          )}

          <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ color: 'hsl(var(--accent))', margin: 0, fontSize: '0.82rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descripción optimizada</h4>
              <button
                onClick={handleCopyDescription}
                style={{ width: 'auto', padding: '0.4rem 0.9rem', fontSize: '0.78rem', boxShadow: 'none', background: copied ? 'hsla(var(--success), 0.15)' : 'hsla(var(--text-muted), 0.1)', color: copied ? 'hsl(var(--success))' : 'hsl(var(--text-muted))' }}
              >
                {copied ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.7', margin: 0, color: 'hsl(var(--text-main))' }}>{result.description}</p>
          </div>

          <div className="glass-card" style={{ gridColumn: '1 / -1', borderLeft: '4px solid hsl(var(--primary))', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ margin: 0, fontSize: '1rem' }}>Post recomendado para Google Business</h4>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '10px', background: 'hsla(var(--primary), 0.15)', color: 'hsl(var(--primary))' }}>GMB Update</span>
            </div>
            <div style={{ background: 'hsla(var(--primary), 0.05)', padding: '1.25rem', borderRadius: '14px' }}>
              <div style={{ fontWeight: '800', marginBottom: '0.6rem', color: '#fff', fontSize: '1rem' }}>{result.postIdea.title}</div>
              <p style={{ fontSize: '0.92rem', color: 'hsl(var(--text-muted))', margin: 0, lineHeight: '1.7' }}>{result.postIdea.content}</p>
            </div>
          </div>

          {result.tips?.length > 0 && (
            <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'left' }}>
              <h4 style={{ color: 'hsl(45 100% 65%)', marginTop: 0, fontSize: '0.82rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tips de optimización</h4>
              <ul style={{ margin: '1rem 0 0 0', paddingLeft: '1.2rem', lineHeight: '1.9', fontSize: '0.92rem', color: 'hsl(var(--text-main))' }}>
                {result.tips.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
