import { useState, useEffect } from 'react';
import { analyzeSeo } from '../services/geminiService';
import { getSeoHistory } from '../services/seoService';
import type { SeoSnapshot } from '../types/seo.types';

interface Rec       { priority: 'Alta'|'Media'|'Baja'; issue: string; fix: string; impact?: string; }
interface OnPageItem{ item: string; status: 'ok'|'warning'|'error'; detail: string; }
interface Keyword   { term: string; intent: string; difficulty: string; opportunity: string; }
interface Competitor{ name: string; domain: string; fortaleza: string; debilidad: string; }
interface ContentGap{ topic: string; keyword: string; type: string; }
interface LocalItem { item: string; status: 'ok'|'warning'|'error'; detail: string; }

interface SeoResult {
  score: number;
  grade: string;
  loadTime: string;
  metaTagsScore: number;
  summary: string;
  categoryScores: Record<string, number>;
  onPage: OnPageItem[];
  recommendations: Rec[];
  keywords: Keyword[];
  competitors: Competitor[];
  contentGaps: ContentGap[];
  localSeo: { score: number; items: LocalItem[] };
  technicalIssues: string[];
}

const scoreColor = (s: number) =>
  s >= 80 ? 'hsl(var(--success))' : s >= 55 ? 'hsl(45 100% 55%)' : 'hsl(0 80% 60%)';

const priorityColor: Record<string, string> = {
  Alta: 'hsl(0 80% 60%)',
  Media: 'hsl(45 100% 55%)',
  Baja: 'hsl(var(--accent))',
};

const statusIcon: Record<string, string> = { ok: '✓', warning: '⚠', error: '✗' };
const statusColor: Record<string, string> = {
  ok: 'hsl(var(--success))',
  warning: 'hsl(45 100% 55%)',
  error: 'hsl(0 80% 60%)',
};

const catLabel: Record<string, string> = {
  tecnico: 'Técnico', contenido: 'Contenido', local: 'SEO Local',
  autoridad: 'Autoridad', experiencia: 'Experiencia',
};

const intentColor: Record<string, string> = {
  comercial: 'hsl(var(--primary))',
  informacional: 'hsl(var(--accent))',
  navegacional: 'hsl(var(--success))',
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 style={{ margin: '2rem 0 1rem', fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--text-muted))' }}>
    {children}
  </h3>
);

export const SeoOptimizer = () => {
  const [url, setUrl] = useState('helpsoluciones.com.co');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<SeoResult | null>(null);
  const [lastSnapshot, setLastSnapshot] = useState<SeoSnapshot | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'resumen'|'onpage'|'keywords'|'competidores'|'contenido'|'local'>('resumen');

  useEffect(() => {
    getSeoHistory('mobile', 7).then((h) => { if (h.length > 0) setLastSnapshot(h[0]); }).catch(() => {});
  }, []);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setIsAnalyzing(true);
    setError('');
    setResult(null);
    setActiveTab('resumen');
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

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'resumen',      label: '📊 Resumen' },
    { key: 'onpage',       label: '🔍 On-Page' },
    { key: 'keywords',     label: '🎯 Keywords' },
    { key: 'competidores', label: '🕵️ Competidores' },
    { key: 'contenido',    label: '✍️ Contenido' },
    { key: 'local',        label: '📍 SEO Local' },
  ];

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: '0.5rem' }}>SEO Intelligence</h1>
      <p style={{ color: 'hsl(var(--text-muted))', fontSize: '1.1rem', marginBottom: '2rem' }}>
        Auditoría SEO completa impulsada por <strong style={{ color: 'hsl(var(--accent))' }}>Google Gemini AI</strong>.
      </p>

      {/* Último snapshot PageSpeed */}
      {lastSnapshot && (
        <div className="glass-card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid hsl(var(--success))', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Último escaneo real — PageSpeed</div>
            <div style={{ marginTop: '0.2rem', fontSize: '0.8rem', opacity: 0.6 }}>
              {new Date(lastSnapshot.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} · {lastSnapshot.device}
            </div>
          </div>
          {[
            { label: 'Performance', value: lastSnapshot.performance_score },
            { label: 'SEO',         value: lastSnapshot.seo_score },
            { label: 'LCP',         value: lastSnapshot.lcp_ms != null ? `${(lastSnapshot.lcp_ms/1000).toFixed(1)}s` : null },
            { label: 'CLS',         value: lastSnapshot.cls_score != null ? lastSnapshot.cls_score.toFixed(3) : null },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'hsl(var(--success))' }}>{value ?? '—'}</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.55 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Input URL */}
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
          <button onClick={handleAnalyze} disabled={isAnalyzing} style={{ minWidth: '180px' }}>
            {isAnalyzing ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                Analizando sitio...
              </span>
            ) : '🔍 Ejecutar Auditoría Completa'}
          </button>
        </div>
        {error && <div style={{ marginTop: '1rem', color: 'hsl(0 80% 70%)', fontSize: '0.9rem' }}>⚠ {error}</div>}
      </div>

      {/* Resultados */}
      {result && (
        <div className="animate-fade-in">

          {/* Score hero */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Grade circle */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '140px', borderTop: `4px solid ${scoreColor(result.score)}` }}>
              <div style={{ fontSize: '3.5rem', fontWeight: 900, color: scoreColor(result.score), lineHeight: 1 }}>{result.grade ?? '—'}</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: scoreColor(result.score), marginTop: '0.25rem' }}>{result.score}/100</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.25rem', textTransform: 'uppercase' }}>SEO Score</div>
            </div>

            {/* Summary + category scores */}
            <div className="glass-card" style={{ flex: 1 }}>
              <p style={{ margin: '0 0 1.25rem', fontSize: '0.95rem', color: 'hsl(var(--text-muted))', lineHeight: 1.6 }}>{result.summary}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                {Object.entries(result.categoryScores ?? {}).map(([key, val]) => (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                      <span style={{ opacity: 0.7 }}>{catLabel[key] ?? key}</span>
                      <span style={{ color: scoreColor(val) }}>{val}</span>
                    </div>
                    <div style={{ height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px' }}>
                      <div style={{ height: '100%', width: `${val}%`, background: scoreColor(val), borderRadius: '3px', transition: 'width 1s ease-out' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Tiempo de carga', value: result.loadTime, color: 'hsl(var(--primary))' },
              { label: 'Meta Tags', value: `${result.metaTagsScore}/100`, color: scoreColor(result.metaTagsScore) },
              { label: 'Recomendaciones', value: result.recommendations?.length ?? 0, color: 'hsl(var(--accent))' },
              { label: 'Issues técnicos', value: result.technicalIssues?.length ?? 0, color: 'hsl(0 80% 60%)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: '0.72rem', opacity: 0.55, marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Issues técnicos rápidos */}
          {(result.technicalIssues?.length ?? 0) > 0 && (
            <div className="glass-card" style={{ marginBottom: '1.5rem', borderLeft: '3px solid hsl(0 80% 60%)' }}>
              <div style={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem', color: 'hsl(0 80% 60%)' }}>⚠ Issues técnicos detectados</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {result.technicalIssues.map((t, i) => (
                  <span key={i} style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem', borderRadius: '20px', background: 'hsla(0,80%,60%,0.1)', color: 'hsl(0 80% 70%)', border: '1px solid hsla(0,80%,60%,0.2)' }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                style={{ padding: '0.5rem 1.1rem', fontSize: '0.82rem', fontWeight: 700, borderRadius: '10px', border: 'none', cursor: 'pointer',
                  background: activeTab === t.key ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.06)',
                  color: activeTab === t.key ? '#fff' : 'hsl(var(--text-muted))',
                  transition: 'all 0.2s',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab: Resumen → Recomendaciones */}
          {activeTab === 'resumen' && (
            <div className="glass-card">
              <SectionTitle>Recomendaciones priorizadas</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {result.recommendations?.map((rec, i) => (
                  <div key={i} style={{ padding: '1.25rem 1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', borderLeft: `3px solid ${priorityColor[rec.priority]}`, display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.97rem', color: '#fff', marginBottom: '0.4rem' }}>{rec.issue}</div>
                      <div style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', lineHeight: 1.55, marginBottom: rec.impact ? '0.5rem' : 0 }}>{rec.fix}</div>
                      {rec.impact && (
                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--success))', fontWeight: 600 }}>📈 {rec.impact}</div>
                      )}
                    </div>
                    <span style={{ padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.68rem', fontWeight: 800, whiteSpace: 'nowrap', background: `${priorityColor[rec.priority]}22`, color: priorityColor[rec.priority], border: `1px solid ${priorityColor[rec.priority]}44`, textTransform: 'uppercase', letterSpacing: '0.05em', alignSelf: 'start' }}>
                      {rec.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: On-Page checklist */}
          {activeTab === 'onpage' && (
            <div className="glass-card">
              <SectionTitle>Checklist On-Page SEO</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {result.onPage?.map((item, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: '0.75rem', alignItems: 'start', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${statusColor[item.status]}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800, color: statusColor[item.status], flexShrink: 0 }}>
                      {statusIcon[item.status]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff', marginBottom: '0.25rem' }}>{item.item}</div>
                      <div style={{ fontSize: '0.82rem', color: 'hsl(var(--text-muted))', lineHeight: 1.5 }}>{item.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Keywords */}
          {activeTab === 'keywords' && (
            <div className="glass-card">
              <SectionTitle>Oportunidades de Keywords</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {result.keywords?.map((kw, i) => (
                  <div key={i} style={{ padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff', marginBottom: '0.6rem' }}>{kw.term}</div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 700, background: `${intentColor[kw.intent] ?? 'hsl(var(--primary))'}22`, color: intentColor[kw.intent] ?? 'hsl(var(--primary))' }}>
                        {kw.intent}
                      </span>
                      <span style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 700, background: 'rgba(255,255,255,0.06)', color: 'hsl(var(--text-muted))' }}>
                        Dificultad: {kw.difficulty}
                      </span>
                      <span style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 700, background: 'hsla(var(--success), 0.15)', color: 'hsl(var(--success))' }}>
                        Oportunidad: {kw.opportunity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Competidores */}
          {activeTab === 'competidores' && (
            <div className="glass-card">
              <SectionTitle>Análisis de Competencia</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {result.competitors?.map((c, i) => (
                  <div key={i} style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>{c.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--primary))', marginTop: '0.1rem' }}>{c.domain}</div>
                      </div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', color: 'hsl(var(--text-muted))' }}>Competidor #{i+1}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div style={{ padding: '0.75rem', background: 'hsla(0,80%,60%,0.08)', borderRadius: '8px', borderLeft: '3px solid hsl(0 80% 60%)' }}>
                        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'hsl(0 80% 60%)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Nos supera en</div>
                        <div style={{ fontSize: '0.82rem', color: 'hsl(var(--text-muted))' }}>{c.fortaleza}</div>
                      </div>
                      <div style={{ padding: '0.75rem', background: 'hsla(var(--success), 0.08)', borderRadius: '8px', borderLeft: '3px solid hsl(var(--success))' }}>
                        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'hsl(var(--success))', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Podemos superarlo en</div>
                        <div style={{ fontSize: '0.82rem', color: 'hsl(var(--text-muted))' }}>{c.debilidad}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Brechas de contenido */}
          {activeTab === 'contenido' && (
            <div className="glass-card">
              <SectionTitle>Brechas de Contenido — Oportunidades sin cubrir</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {result.contentGaps?.map((gap, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '32px 1fr auto', gap: '1rem', alignItems: 'center', padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'hsla(var(--primary), 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'hsl(var(--primary))', fontSize: '0.9rem' }}>
                      {i + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem', marginBottom: '0.2rem' }}>{gap.topic}</div>
                      <div style={{ fontSize: '0.78rem', color: 'hsl(var(--accent))' }}>🎯 {gap.keyword}</div>
                    </div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '6px', background: 'hsla(var(--accent), 0.15)', color: 'hsl(var(--accent))', whiteSpace: 'nowrap' }}>
                      {gap.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: SEO Local */}
          {activeTab === 'local' && (
            <div>
              <div className="glass-card" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: scoreColor(result.localSeo?.score ?? 0) }}>{result.localSeo?.score ?? '—'}</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase' }}>Score Local</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px' }}>
                    <div style={{ height: '100%', width: `${result.localSeo?.score ?? 0}%`, background: scoreColor(result.localSeo?.score ?? 0), borderRadius: '4px', transition: 'width 1s ease-out' }} />
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'hsl(var(--text-muted))', marginTop: '0.5rem' }}>
                    Posicionamiento para búsquedas locales en Bogotá y Colombia
                  </div>
                </div>
              </div>
              <div className="glass-card">
                <SectionTitle>Checklist SEO Local</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {result.localSeo?.items?.map((item, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: '0.75rem', alignItems: 'start', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${statusColor[item.status]}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800, color: statusColor[item.status], flexShrink: 0 }}>
                        {statusIcon[item.status]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff', marginBottom: '0.25rem' }}>{item.item}</div>
                        <div style={{ fontSize: '0.82rem', color: 'hsl(var(--text-muted))', lineHeight: 1.5 }}>{item.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
