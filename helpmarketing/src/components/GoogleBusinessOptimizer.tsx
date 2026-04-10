import { useState } from 'react';
import { optimizeGoogleBusiness } from '../services/geminiService';

interface GmbOptimization {
    keywords: string[];
    description: string;
    postIdea: {
        title: string;
        content: string;
    };
}

export const GoogleBusinessOptimizer = () => {
    const [info, setInfo] = useState('Help Soluciones SAS - Mantenimiento de computadores y servidores en Bogotá.');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<GmbOptimization | null>(null);

    const handleOptimize = async () => {
        setIsAnalyzing(true);
        try {
            const data = await optimizeGoogleBusiness(info);
            setResult(data);
        } catch (err) {
            alert("Error al optimizar. Verifica tu conexión.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <h1>Google Business Profile Optimizer</h1>
            <p style={{ color: 'hsl(var(--text-muted))', marginBottom: '2rem' }}>Dominate local search results and Google Maps for Bogotá.</p>

            <div className="glass-card" style={{ marginBottom: '2.5rem', textAlign: 'left' }}>
                <h3 style={{ marginTop: 0 }}>Current Profile Status</h3>
                <textarea
                    style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '16px',
                        padding: '1.2rem',
                        color: 'white',
                        fontFamily: 'inherit',
                        fontSize: '1rem',
                        minHeight: '100px',
                        marginBottom: '1.5rem',
                        resize: 'vertical'
                    }}
                    value={info}
                    onChange={(e) => setInfo(e.target.value)}
                    placeholder="Paste your current GMB description or business summary..."
                />
                <button
                    onClick={handleOptimize}
                    disabled={isAnalyzing}
                    style={{ width: '100%' }}
                >
                    {isAnalyzing ? 'Auditing GMB Profile...' : 'Optimize My Business Profile'}
                </button>
            </div>

            {result && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    <div className="glass-card" style={{ textAlign: 'left' }}>
                        <h4 style={{ color: 'hsl(var(--accent))', marginTop: 0, fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📍 Local Keywords</h4>
                        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                            {result.keywords.map((k, i) => <span key={i} className="badge badge-success">{k}</span>)}
                        </div>
                    </div>

                    <div className="glass-card" style={{ textAlign: 'left' }}>
                        <h4 style={{ color: 'hsl(var(--accent))', marginTop: 0, fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📝 Optimized Description</h4>
                        <p style={{ fontSize: '0.95rem', lineHeight: '1.6', marginTop: '1rem' }}>{result.description}</p>
                    </div>

                    <div className="glass-card" style={{ gridColumn: '1 / -1', borderLeft: '4px solid hsl(var(--primary))', textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                            <h4 style={{ margin: 0, fontSize: '1.1rem' }}>🏙️ Recommended Google Post</h4>
                            <span className="badge">GMB Update</span>
                        </div>
                        <div style={{ background: 'hsla(var(--primary), 0.05)', padding: '1.5rem', borderRadius: '16px' }}>
                            <div style={{ fontWeight: '800', marginBottom: '0.6rem', color: 'hsl(var(--text-main))' }}>{result.postIdea.title}</div>
                            <p style={{ fontSize: '0.95rem', color: 'hsl(var(--text-muted))', margin: 0, lineHeight: '1.6' }}>{result.postIdea.content}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
