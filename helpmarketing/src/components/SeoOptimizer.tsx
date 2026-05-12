import { useState, useEffect } from 'react';
import { analyzeSeo } from '../services/geminiService';
import { getSeoHistory } from '../services/seoService';
import type { SeoSnapshot } from '../types/seo.types';

interface SeoRecommendation {
  priority: 'Alta' | 'Media' | 'Baja';
  issue: string;
  fix: string;
}

interface SeoResult {
  score: number;
  loadTime: string;
  metaTagsScore: number;
  recommendations: SeoRecommendation[];
  keywordSuggestions?: string[];
  technicalIssues?: string[];
}

const priorityBorder: Record<string, string> = {
  Alta: 'hsl(0 80% 60%)',
  Media: 'hsl(45 100% 55%)',
  Baja: 'hsl(var(--accent))',
};

const scoreColor = (s: number) => s > 80 ? 'hsl(var(--success))' : s > 50 ? 'hsl(45 100% 55%)' : 'hsl(0 80% 60%)';

export const SeoOptimizer = () => {
  const [url, setUrl] = useState('helpsoluciones.com.co');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<SeoResult | null>(null);
  const [lastSnapshot, setLastSnapshot] = useState<SeoSnapshot | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getSeoHistory('mobile', 7).then((history) => {
      if (history.length > 0) setLastSnapshot(history[0]);
    }).catch(() => {});
  }, []);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setIsAnalyzing(true);
    setError('');
    try {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      const data = await analyzeSeo(fullUrl);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error al analizar el sitio');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: '0.5rem' }}>SEO Intelligence</h1>
      <p style={{ color: 'hsl(var(--text-muted))', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
        Auditoría SEO impulsada por <strong style={{ color: 'hsl(var(--accent))' }}>Google Gemini AI</strong>.
      </p>

      {lastSnapshot && (
        <div className="glass-card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid hsl(var(--success))', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', opacity: 0.55, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Último escaneo real (PageSpeed)</div>
            <div style={{ marginTop: '0.2rem', fontSize: '0.8rem', opacity: 0.6 }}>
              {new Date(lastSnapshot.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} · {lastSnapshot.device}
            </div>
          </div>
          {[
            { label: 'Performance', value: lastSnapshot.performance_score },
            { label: 'SEO', value: lastSnapshot.seo_score },
            { label: 'LCP', value: lastSnapshot.lcp_ms != null ? `${(lastSnapshot.lcp_ms / 1000).toFixed(1)}s` : null },
            { label: 'CLS', value: lastSnapshot.cls_score != null ? lastSnapshot.cls_score.toFixed(3) : null },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'hsl(var(--success))' }}>{value ?? '—'}</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.55 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="glass-card" style={{ borderLeft: '4px solid hsl(var(--primary))', marginBottom: '2rem' }}>
        <h3 style={{ marginTop: 0, fontSize: '1.1rem', color: '#fff' }}>URL a analizar</h3>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <input
            style={{ flex: 1, minWidth: '200px', background: 'hsla(var(--background-alt), 0.5)', padding: '1rem 1.25rem', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '14px', outline: 'none', boxSizing: 'border-box' }}
            onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
            onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
            placeholder="ej: helpsoluciones.com.co"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          />
          <button onClick={handleAnalyze} disabled={isAnalyzing} style={{ minWidth: '160px' }}>
            {isAnalyzing ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                Analizando...
              </span>
            ) : 'Ejecutar Auditoría'}
          </button>
        </div>
        {error && <div style={{ marginTop: '1rem', color: 'hsl(0 80% 70%)', fontSize: '0.9rem' }}>{error}</div>}
      </div>

      {result && (
        <div className="animate-fade-in">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="glass-card" style={{ textAlign: 'left' }}>
              <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase' }}>SEO Score</div>
              <div style={{ fontSize: '3rem', fontWeight: '800', color: scoreColor(result.score), lineHeight: 1.1, margin: '0.5rem 0' }}>
                {result.score}<span style={{ fontSize: '1rem', opacity: 0.5 }}>/100</span>
              </div>
              <div style={{ height: '4px', width: '100%', background: 'hsla(var(--text-muted), 0.1)', borderRadius: '2px' }}>
                <div style={{ height: '100%', width: `${result.score}%`, background: scoreColor(result.score), borderRadius: '2px', transition: 'width 1s ease-out', boxShadow: `0 0 10px ${scoreColor(result.score)}` }} />
              </div>
            </div>
            <div className="glass-card" style={{ textAlign: 'left' }}>
              <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase' }}>Tiempo de carga</div>
              <div style={{ fontSize: '2.2rem', fontWeight: '800', color: 'hsl(var(--primary))', margin: '0.5rem 0' }}>{result.loadTime}</div>
              <span style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem', borderRadius: '10px', background: 'hsla(var(--success), 0.1)', color: 'hsl(var(--success))' }}>LCP estimado</span>
            </div>
            <div className="glass-card" style={{ textAlign: 'left' }}>
              <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase' }}>Meta Tags</div>
              <div style={{ fontSize: '2.2rem', fontWeight: '800', color: result.metaTagsScore > 70 ? 'hsl(var(--success))' : 'hsl(45 100% 55%)', margin: '0.5rem 0' }}>
                {result.metaTagsScore}<span style={{ fontSize: '1rem', opacity: 0.5 }}>/100</span>
              </div>
              <span style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem', borderRadius: '10px', background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))' }}>Integridad</span>
            </div>
          </div>

          {(result.keywordSuggestions?.length ?? 0) > 0 && (
            <div className="glass-card" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              <h4 style={{ marginTop: 0, fontSize: '0.82rem', fontWeight: '800', textTransform: 'uppercase', color: 'hsl(var(--accent))' }}>Keywords sugeridas</h4>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                {result.keywordSuggestions!.map((k, i) => (
                  <span key={i} style={{ fontSize: '0.82rem', padding: '0.3rem 0.8rem', borderRadius: '20px', background: 'hsla(var(--accent), 0.12)', color: 'hsl(var(--accent))' }}>{k}</span>
                ))}
              </div>
            </div>
          )}

          <div className="glass-card" style={{ textAlign: 'left' }}>
            <h3 style={{ marginTop: 0, fontSize: '1.1rem', color: '#fff', marginBottom: '1.5rem' }}>Recomendaciones de optimización</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {result.recommendations.map((rec, i) => (
                <div key={i} className="glass-card" style={{ padding: '1.25rem 1.5rem', margin: 0, background: 'hsla(var(--text-main), 0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', borderLeft: `3px solid ${priorityBorder[rec.priority] || priorityBorder.Media}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.35rem', color: '#fff' }}>{rec.issue}</div>
                    <div style={{ fontSize: '0.88rem', color: 'hsl(var(--text-muted))', lineHeight: '1.5' }}>{rec.fix}</div>
                  </div>
                  <span style={{ padding: '0.3rem 0.7rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '800', whiteSpace: 'nowrap', background: `${priorityBorder[rec.priority]}22`, color: priorityBorder[rec.priority], border: `1px solid ${priorityBorder[rec.priority]}44`, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {rec.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
