import { useState, useEffect } from 'react';
import { getTrendingAdvice, sendToN8n } from '../services/geminiService';

interface TrendIdea {
    topic: string;
    hook: string;
    whyNow: string;
    platform: string;
    callToAction: string;
}

export const TrendIntel = () => {
    const [ideas, setIdeas] = useState<TrendIdea[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [sendingIndex, setSendingIndex] = useState<number | null>(null);

    const fetchTrends = async () => {
        setIsLoading(true);
        try {
            const data = await getTrendingAdvice();
            setIdeas(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendToN8n = async (idea: TrendIdea, index: number) => {
        setSendingIndex(index);
        try {
            // Prepare data for n8n
            const postData = {
                title: idea.topic,
                copy: `${idea.hook}\n\n${idea.whyNow}`,
                hashtags: ['#HelpSoluciones', '#TIColombia', '#TechTrends'],
                platform: idea.platform,
                callToAction: idea.callToAction,
                isTrend: true
            };

            await sendToN8n(postData);
            alert("¡Idea de tendencia enviada a n8n con éxito!");
        } catch (error) {
            alert("Error al enviar a n8n. Verifica la configuración de VITE_N8N_WEBHOOK_URL.");
        } finally {
            setSendingIndex(null);
        }
    };

    useEffect(() => {
        fetchTrends();
    }, []);

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ textAlign: 'left' }}>
                    <h1 style={{ margin: 0 }}>Trend Intelligence 2025</h1>
                    <p style={{ color: 'hsl(var(--text-muted))', marginTop: '0.4rem' }}>Contenido estratégico basado en el mercado TI de Colombia.</p>
                </div>
                <button onClick={fetchTrends} disabled={isLoading} style={{ width: 'auto', padding: '0.8rem 1.5rem' }}>
                    {isLoading ? 'Analizando Mercado...' : '🔄 Actualizar Tendencias'}
                </button>
            </div>

            <div className="glass-card" style={{ background: 'hsla(38, 92%, 50%, 0.1)', borderLeft: '4px solid hsl(var(--warning))', marginBottom: '3rem', textAlign: 'left' }}>
                <h4 style={{ margin: '0 0 0.8rem 0', color: 'hsl(var(--warning))', fontSize: '1.1rem', fontWeight: '800' }}>🔥 Hot Insight:</h4>
                <p style={{ margin: 0, fontSize: '1rem', lineHeight: '1.6' }}>
                    Colombia es ahora el <strong style={{ color: 'white' }}>cuarto país más atacado</strong> en Latinoamérica. Las empresas están moviendo sus presupuestos de compra (CAPEX) a <strong style={{ color: 'hsl(var(--primary))' }}>Renta y Protección (OPEX)</strong> para mitigar riesgos financieros y técnicos.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
                {ideas.map((idea, index) => (
                    <div key={index} className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', textAlign: 'left', padding: '2.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                            <span className="badge" style={{ background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))', border: 'none' }}>{idea.platform}</span>
                            <button
                                onClick={() => handleSendToN8n(idea, index)}
                                disabled={sendingIndex !== null}
                                style={{
                                    width: 'auto',
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.8rem',
                                    margin: 0,
                                    boxShadow: 'none'
                                }}
                            >
                                🤖 {sendingIndex === index ? 'Enviando...' : 'Launch to n8n'}
                            </button>
                        </div>

                        <h3 style={{ marginTop: 0, fontSize: '1.4rem', color: 'hsl(var(--primary))', lineHeight: '1.3' }}>{idea.topic}</h3>

                        <div style={{ flex: 1, marginTop: '1.5rem' }}>
                            <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontWeight: '800', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gain Hook</p>
                            <p style={{ fontStyle: 'italic', marginBottom: '1.5rem', borderLeft: '3px solid hsla(var(--primary), 0.3)', paddingLeft: '1.2rem', fontSize: '1.05rem', lineHeight: '1.6' }}>"{idea.hook}"</p>

                            <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontWeight: '800', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Strategic Context</p>
                            <p style={{ fontSize: '1rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>{idea.whyNow}</p>
                        </div>

                        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', marginTop: 'auto' }}>
                            <p style={{ fontSize: '0.8rem', color: 'hsl(var(--accent))', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Suggested CTA:</p>
                            <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>{idea.callToAction}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
