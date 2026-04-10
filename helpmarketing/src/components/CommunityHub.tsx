import { useState } from 'react';
import { suggestReply } from '../services/geminiService';

interface Interaction {
  id: string;
  user: string;
  platform: string;
  comment: string;
  time: string;
  status: 'pending' | 'replied';
  aiReply?: string;
  sentiment?: string;
}

export const CommunityHub = () => {
  const [interactions, setInteractions] = useState<Interaction[]>([
    {
      id: '1',
      user: 'Carlos Ruiz',
      platform: 'LinkedIn',
      comment: 'Excelente video de expectativa. ¿Cuentan con soporte para servidores Linux en sitio?',
      time: 'Hace 2 horas',
      status: 'pending'
    },
    {
      id: '2',
      user: 'TechEnthusiast_99',
      platform: 'Instagram',
      comment: '¿Helpi puede ayudarme a configurar mi router MikroTik?',
      time: 'Hace 5 horas',
      status: 'pending'
    },
    {
      id: '3',
      user: 'Maria Gomez',
      platform: 'Facebook',
      comment: 'Me encanta el diseño de la nueva oficina, ¡felicitaciones!',
      time: 'Ayer',
      status: 'replied',
      aiReply: '¡Muchas gracias Maria! Te esperamos pronto por aquí.',
      sentiment: 'Positivo'
    }
  ]);

  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleSuggest = async (id: string) => {
    const item = interactions.find(i => i.id === id);
    if (!item) return;

    setLoadingId(id);
    try {
      const result = await suggestReply(item.comment, item.platform);
      setInteractions(interactions.map(i => 
        i.id === id ? { ...i, aiReply: result.reply, sentiment: result.sentiment } : i
      ));
    } catch (error) {
      alert("Error generating reply");
    } finally {
      setLoadingId(null);
    }
  };

  const handleSend = (id: string) => {
    setInteractions(interactions.map(i => 
      i.id === id ? { ...i, status: 'replied' } : i
    ));
  };

  return (
    <div className="community-hub animate-fade-in">
      <h1 style={{ marginBottom: '0.5rem' }}>Community Hub</h1>
      <p style={{ color: 'hsl(var(--text-muted))', marginBottom: '2.5rem' }}>Monitorea y responde a tu audiencia con la inteligencia de Helpi.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
        <div className="inbox-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.9rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Inbox Reciente</h3>
          {interactions.map(item => (
            <div 
              key={item.id} 
              className={`glass-card ${item.status === 'replied' ? 'replied-item' : ''}`}
              style={{ padding: '1.2rem', cursor: 'pointer', textAlign: 'left', borderLeft: item.status === 'pending' ? '4px solid hsl(var(--primary))' : '4px solid transparent' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className="badge" style={{ fontSize: '0.6rem', padding: '0.2rem 0.5rem' }}>{item.platform}</span>
                <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>{item.time}</span>
              </div>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.4rem' }}>{item.user}</div>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {item.comment}
              </p>
            </div>
          ))}
        </div>

        <div className="interaction-detail">
          {interactions.filter(i => i.status === 'pending').map(item => (
            <div key={item.id} className="glass-card animate-fade-in" style={{ textAlign: 'left', padding: '2rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{item.user[0]}</div>
                <div>
                  <h3 style={{ margin: 0 }}>{item.user}</h3>
                  <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>Comentó en tu post de {item.platform}</span>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--glass-border)', marginBottom: '2rem' }}>
                <p style={{ margin: 0, fontSize: '1.1rem', fontStyle: 'italic' }}>"{item.comment}"</p>
              </div>

              {item.aiReply ? (
                <div className="ai-suggestion animate-fade-in" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span className="badge badge-success">Sugerencia de Helpi ({item.sentiment})</span>
                    <button onClick={() => handleSuggest(item.id)} style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem', background: 'transparent', border: '1px solid var(--glass-border)' }}>Regenerar</button>
                  </div>
                  <textarea 
                    value={item.aiReply}
                    onChange={(e) => setInteractions(interactions.map(i => i.id === item.id ? { ...i, aiReply: e.target.value } : i))}
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      background: 'rgba(0,180,0,0.05)',
                      border: '1px solid hsla(var(--success), 0.3)',
                      borderRadius: '12px',
                      padding: '1rem',
                      color: 'white',
                      fontFamily: 'inherit',
                      fontSize: '0.95rem',
                      marginBottom: '1rem'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => handleSend(item.id)} style={{ flex: 1 }}>Enviar Respuesta</button>
                    <button style={{ background: 'transparent', border: '1px solid var(--glass-border)' }}>Ignorar</button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => handleSuggest(item.id)} 
                  disabled={loadingId === item.id}
                  style={{ width: '100%', height: '50px' }}
                >
                  {loadingId === item.id ? 'Helpi está analizando el contexto...' : 'Generar Respuesta con IA'}
                </button>
              )}
            </div>
          ))}
          {interactions.filter(i => i.status === 'pending').length === 0 && (
            <div className="glass-card" style={{ padding: '4rem', opacity: 0.5 }}>
              <h2>¡Todo al día!</h2>
              <p>No hay mensajes pendientes por responder.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
