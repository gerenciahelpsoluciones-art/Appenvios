import { useState } from 'react';
import { supabase } from '../services/supabase';
import { sendToN8n } from '../services/geminiService';
import { writeAgentLog } from '../services/agentOrchestrator';

interface Article {
  id: string;
  title: string;
  platform: string;
  copy: string;
  image: string;
  status: 'draft' | 'sent' | 'error';
}

export const ArticleFactory = () => {
  const [articles, setArticles] = useState<Article[]>([
    {
      id: '1',
      platform: 'LinkedIn',
      title: 'La Revolución de los Agentes Autónomos',
      copy: "¿Estamos listos para el marketing de 2026? 🚀 Hoy, la diferencia entre una empresa que crece y una que se estanca no es el presupuesto, es la Automatización Inteligente. En 'Help Soluciones', estamos implementando agentes autónomos...",
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800',
      status: 'draft'
    },
    {
      id: '2',
      platform: 'TikTok',
      title: 'SEO en 60 Segundos',
      copy: "POV: Tu competencia está rankeando #1 mientras tú sigues editando meta-tags a mano. 💀 Mira esto. Conecté n8n a mi web para que un agente de IA audite el SEO cada 24 horas...",
      image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=800',
      status: 'draft'
    }
  ]);

  const [isSending, setIsSending] = useState<string | null>(null);

  const handleSend = async (id: string) => {
    const article = articles.find(a => a.id === id);
    if (!article) return;

    setIsSending(id);
    try {
      // 1. Guardar en mkt_posts_queue de Supabase
      const { data: post, error } = await supabase
        .from('mkt_posts_queue')
        .insert({
          title:    article.title,
          copy:     article.copy,
          platform: article.platform.toLowerCase(),
          image_url: article.image,
          status:   'approved',
        })
        .select('id')
        .single();

      if (error) throw new Error(error.message);

      // 2. Notificar a n8n para que lo procese
      await sendToN8n({ postId: post.id, ...article });

      // 3. Registrar en el log del agente
      await writeAgentLog(
        'POST_SOCIAL',
        'success',
        `Post aprobado para ${article.platform}: "${article.title}"`,
        { postId: post.id, platform: article.platform }
      );

      setArticles(prev => prev.map(a => a.id === id ? { ...a, status: 'sent' } : a));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      await writeAgentLog('POST_SOCIAL', 'error', `Error enviando post: ${message}`);
      setArticles(prev => prev.map(a => a.id === id ? { ...a, status: 'error' } : a));
    } finally {
      setIsSending(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Article Factory</h1>
          <p style={{ color: 'hsl(var(--text-muted))' }}>Revisa, edita y lanza tu contenido a n8n</p>
        </div>
        <button
          onClick={() => {/* TODO: conectar a CreativeStudio */}}
          style={{ background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))', border: '1px solid hsla(var(--primary), 0.2)', padding: '0.5rem 1.2rem', width: 'auto' }}
        >
          + Generar Nueva Idea
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {articles.map(article => (
          <div key={article.id} className="glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
              <img src={article.image} alt={article.title} width={800} height={200} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              <div style={{ position: 'absolute', top: '1rem', right: '1rem' }} className={`badge ${article.status === 'sent' ? 'badge-success' : ''}`}>
                {article.platform}
              </div>
            </div>
            
            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#fff' }}>{article.title}</h3>
              <textarea
                aria-label={`Texto del post: ${article.title}`}
                value={article.copy}
                onChange={(e) => setArticles(prev => prev.map(a => a.id === article.id ? { ...a, copy: e.target.value } : a))}
                style={{ 
                  width: '100%', 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid var(--glass-border)', 
                  borderRadius: '8px', 
                  color: 'hsl(var(--text-muted))',
                  padding: '1rem',
                  fontSize: '0.9rem',
                  minHeight: '120px',
                  resize: 'none',
                  marginBottom: '1.5rem',
                  fontFamily: 'inherit'
                }}
              />
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
                <button 
                  onClick={() => handleSend(article.id)}
                  disabled={article.status === 'sent' || isSending === article.id}
                  style={{ flex: 1, background: article.status === 'error' ? 'rgba(239,68,68,0.15)' : undefined, color: article.status === 'error' ? '#ef4444' : undefined }}
                >
                  {isSending === article.id
                    ? 'Despachando...'
                    : article.status === 'sent'
                    ? '✓ Enviado a n8n'
                    : article.status === 'error'
                    ? '✗ Reintentar'
                    : 'Aprobar y Lanzar'}
                </button>
                <button style={{ background: 'transparent', border: '1px solid var(--glass-border)', boxShadow: 'none' }}>
                  Editar Visual
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
