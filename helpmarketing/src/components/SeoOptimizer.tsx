import { useState, useEffect } from 'react';
import { analyzeSeo } from '../services/geminiService';
import { getSeoHistory } from '../services/seoService';
import type { SeoSnapshot } from '../types/seo.types';

interface SeoResult {
    score: number;
    loadTime: string;
    metaTagsScore: number;
    recommendations: {
        title: string;
        desc: string;
        severity: 'high' | 'medium' | 'low';
    }[];
}

export const SeoOptimizer = () => {
    const [url, setUrl] = useState('helpsoluciones.com.co');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<SeoResult | null>(null);
    const [lastSnapshot, setLastSnapshot] = useState<SeoSnapshot | null>(null);

    useEffect(() => {
        getSeoHistory('mobile', 7).then((history) => {
            if (history.length > 0) setLastSnapshot(history[0]);
        });
    }, []);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            const data = await analyzeSeo(url);
            setResult(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <h1 style={{ marginBottom: '0.5rem' }}>Core SEO Intelligence</h1>
            <p style={{ color: 'hsl(var(--text-muted))', fontSize: '1.1rem', marginBottom: '3rem' }}>
                Technical auditing engine powered by <strong style={{ color: 'hsl(var(--accent))' }}>Google Gemini AI</strong>.
            </p>

            {lastSnapshot && (
                <div className="glass-card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid hsl(var(--success))', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, opacity: 0.55, letterSpacing: '0.06em' }}>ÚLTIMO ESCANEO REAL (PageSpeed)</span>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', opacity: 0.6 }}>
                            {new Date(lastSnapshot.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} · {lastSnapshot.device}
                        </p>
                    </div>
                    {[
                        { label: 'Performance', value: lastSnapshot.performance_score },
                        { label: 'SEO',         value: lastSnapshot.seo_score },
                        { label: 'LCP',         value: lastSnapshot.lcp_ms != null ? `${(lastSnapshot.lcp_ms / 1000).toFixed(1)}s` : null },
                        { label: 'CLS',         value: lastSnapshot.cls_score != null ? lastSnapshot.cls_score.toFixed(3) : null },
                    ].map(({ label, value }) => (
                        <div key={label} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'hsl(var(--success))' }}>{value ?? '—'}</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.55 }}>{label}</div>
                        </div>
                    ))}
                    <span style={{ fontSize: '0.75rem', opacity: 0.4, marginLeft: 'auto' }}>
                        Para ver el historial completo → Web Vitals
                    </span>
                </div>
            )}

            <div className="glass-card" style={{ borderLeft: '4px solid hsl(var(--primary))' }}>
                <h3 style={{ marginTop: 0, fontSize: '1.25rem', color: '#fff' }}>Diagnostic Target</h3>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <input
                            style={{ 
                                width: '100%',
                                background: 'hsla(var(--background-alt), 0.5)', 
                                padding: '1rem 1.25rem', 
                                color: 'white', 
                                border: '1px solid var(--glass-border)',
                                borderRadius: '14px',
                                outline: 'none',
                                transition: 'var(--transition-smooth)'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
                            placeholder="hostname.com"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                    </div>
                    <button onClick={handleAnalyze} disabled={isAnalyzing} style={{ minWidth: '180px' }}>
                        {isAnalyzing ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                                Analyzing...
                            </span>
                        ) : 'Execute Audit'}
                    </button>
                </div>
            </div>

            {result && (
                <div style={{ animation: 'slide-up 0.5s ease-out' }}>
                    <div className="stats-grid">
                        <div className="glass-card stat-item">
                            <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>SEO Score</span>
                            <span className="stat-value" style={{ color: result.score > 80 ? 'hsl(var(--success))' : result.score > 50 ? 'hsl(var(--warning))' : 'hsl(var(--error))' }}>
                                {result.score}<small style={{ fontSize: '1rem', opacity: 0.5 }}>/100</small>
                            </span>
                            <div style={{ height: '4px', width: '100%', background: 'hsla(var(--text-muted), 0.1)', borderRadius: '2px', marginTop: '0.5rem' }}>
                                <div style={{ 
                                    height: '100%', 
                                    width: `${result.score}%`, 
                                    background: result.score > 80 ? 'hsl(var(--success))' : result.score > 50 ? 'hsl(var(--warning))' : 'hsl(var(--error))',
                                    boxShadow: `0 0 10px ${result.score > 80 ? 'hsl(var(--success))' : result.score > 50 ? 'hsl(var(--warning))' : 'hsl(var(--error))'}`,
                                    borderRadius: '2px',
                                    transition: 'width 1s ease-out'
                                }}></div>
                            </div>
                        </div>
                        <div className="glass-card stat-item">
                            <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>First Contentful Paint</span>
                            <span className="stat-value">{result.loadTime}</span>
                            <span className="badge badge-success" style={{ background: 'hsla(var(--success), 0.1)', color: 'hsl(var(--success))' }}>STABLE</span>
                        </div>
                        <div className="glass-card stat-item">
                            <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Meta Integrity</span>
                            <span className="stat-value" style={{ color: result.metaTagsScore > 7 ? 'hsl(var(--success))' : 'hsl(var(--warning))' }}>
                                {result.metaTagsScore}<small style={{ fontSize: '1rem', opacity: 0.5 }}>/10</small>
                            </span>
                            <span className="badge">INDEXING READY</span>
                        </div>
                    </div>

                    <div className="glass-card">
                        <h3 style={{ marginTop: 0, fontSize: '1.4rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                            Optimization Recommendations
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
                            {result.recommendations.map((rec, i) => (
                                <div key={i} className="glass-card" style={{ 
                                    padding: '1.5rem', 
                                    margin: 0,
                                    background: 'hsla(var(--text-main), 0.02)', 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    borderLeft: `3px solid ${rec.severity === 'high' ? 'hsl(var(--error))' : rec.severity === 'medium' ? 'hsl(var(--warning))' : 'hsl(var(--accent))'}`
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.4rem', color: '#fff' }}>{rec.title}</div>
                                        <div style={{ fontSize: '0.9rem', color: 'hsl(var(--text-muted))', lineHeight: '1.4' }}>{rec.desc}</div>
                                    </div>
                                    <div style={{ marginLeft: '1.5rem' }}>
                                        <span style={{
                                            padding: '0.4rem 0.8rem',
                                            borderRadius: '8px',
                                            fontSize: '0.7rem',
                                            fontWeight: '800',
                                            background: rec.severity === 'high' ? 'hsla(var(--error), 0.1)' : rec.severity === 'medium' ? 'hsla(var(--warning), 0.1)' : 'hsla(var(--accent), 0.1)',
                                            color: rec.severity === 'high' ? 'hsl(var(--error))' : rec.severity === 'medium' ? 'hsl(var(--warning))' : 'hsl(var(--accent))',
                                            border: `1px solid ${rec.severity === 'high' ? 'hsla(var(--error), 0.3)' : rec.severity === 'medium' ? 'hsla(var(--warning), 0.3)' : 'hsla(var(--accent), 0.3)'}`,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        }}>
                                            Priority: {rec.severity}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
