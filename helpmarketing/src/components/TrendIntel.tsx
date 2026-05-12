import { useState, useEffect } from 'react';
import { getTrendingAdvice, sendToN8n } from '../services/geminiService';

interface TrendIdea {
  trend: string;
  description: string;
  actionableIdea: string;
  platform: string;
  priority: 'Alta' | 'Media' | 'Baja';
}

const platformEmoji: Record<string, string> = {
  LinkedIn: '💼', Instagram: '📸', WhatsApp: '💬', TikTok: '🎵', Blog: '📝', default: '📣',
};

const priorityStyle: Record<string, { bg: string; color: string }> = {
  Alta: { bg: 'hsla(var(--success), 0.15)', color: 'hsl(var(--success))' },
  Media: { bg: 'hsla(45, 100%, 55%, 0.15)', color: 'hsl(45 100% 65%)' },
  Baja: { bg: 'hsla(var(--text-muted), 0.15)', color: 'hsl(var(--text-muted))' },
};

export const TrendIntel = () => {
  const [ideas, setIdeas] = useState<TrendIdea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sendingIndex, setSendingIndex] = useState<number | null>(null);
  const [sentIndexes, setSentIndexes] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');

  const fetchTrends = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getTrendingAdvice();
      setIdeas(Array.isArray(data) ? data : []);
      setSentIndexes(new Set());
    } catch (err: any) {
      setError(err.message || 'Error al obtener tendencias');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToN8n = async (idea: TrendIdea, index: number) => {
    setSendingIndex(index);
    try {
      await sendToN8n({
        title: idea.trend,
        copy: `${idea.description}\n\n${idea.actionableIdea}`,
        hashtags: ['#HelpSoluciones', '#TIColombia', '#MarketingDigital'],
        platform: idea.platform,
        priority: idea.priority,
        isTrend: true,
      });
      setSentIndexes(prev => new Set([...prev, index]));
    } catch {
      // fallo silencioso, el usuario ve el botón volver a su estado original
    } finally {
      setSendingIndex(null);
    }
  };

  useEffect(() => { fetchTrends(); }, []);

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Trend Intelligence</h1>
          <p style={{ color: 'hsl(var(--text-muted))', marginTop: '0.4rem', marginBottom: 0 }}>
            Tendencias de marketing digital para TI en Colombia — generadas con IA.
          </p>
        </div>
        <button onClick={fetchTrends} disabled={isLoading} style={{ width: 'auto', padding: '0.8rem 1.5rem' }}>
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg aria-hidden="true" className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              Analizando mercado...
            </span>
          ) : 'Actualizar Tendencias'}
        </button>
      </div>

      {error && (
        <div className="glass-card" style={{ borderLeft: '4px solid hsl(0 80% 60%)', marginBottom: '2rem', color: 'hsl(0 80% 70%)' }}>
          {error}
        </div>
      )}

      {isLoading && ideas.length === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card" style={{ height: '280px', background: 'hsla(var(--text-muted), 0.05)', animation: 'pulse 2s infinite' }} />
          ))}
        </div>
      )}

      {ideas.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
          {ideas.map((idea, index) => {
            const pStyle = priorityStyle[idea.priority] || priorityStyle.Media;
            const emoji = platformEmoji[idea.platform] || platformEmoji.default;
            return (
              <div key={index} className="glass-card" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.7rem', borderRadius: '12px', background: 'hsla(var(--primary), 0.12)', color: 'hsl(var(--primary))' }}>
                      {emoji} {idea.platform}
                    </span>
                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.7rem', borderRadius: '12px', background: pStyle.bg, color: pStyle.color, fontWeight: '700' }}>
                      {idea.priority}
                    </span>
                  </div>
                  <button
                    onClick={() => handleSendToN8n(idea, index)}
                    disabled={sendingIndex !== null || sentIndexes.has(index)}
                    style={{ width: 'auto', padding: '0.45rem 0.9rem', fontSize: '0.78rem', margin: 0, boxShadow: 'none', background: sentIndexes.has(index) ? 'hsla(var(--success), 0.15)' : undefined, color: sentIndexes.has(index) ? 'hsl(var(--success))' : undefined }}
                  >
                    {sentIndexes.has(index) ? '✓ Enviado' : sendingIndex === index ? 'Enviando...' : 'Enviar a n8n'}
                  </button>
                </div>

                <h3 style={{ marginTop: 0, fontSize: '1.2rem', color: 'hsl(var(--primary))', lineHeight: '1.4', marginBottom: '1rem' }}>{idea.trend}</h3>

                <p style={{ fontSize: '0.92rem', color: 'hsl(var(--text-muted))', lineHeight: '1.6', marginBottom: '1.25rem', flex: 1 }}>{idea.description}</p>

                <div style={{ padding: '1rem', background: 'hsla(var(--accent), 0.08)', borderRadius: '12px', borderLeft: '3px solid hsl(var(--accent))' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'hsl(var(--accent))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Idea accionable</div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#fff', lineHeight: '1.5' }}>{idea.actionableIdea}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
