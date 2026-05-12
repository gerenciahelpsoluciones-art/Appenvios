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
  actionNeeded?: string;
  suggestedAction?: string;
  tone?: string;
}

const platformColors: Record<string, string> = {
  LinkedIn: '#0077b5', Instagram: '#e1306c', Facebook: '#1877f2', default: 'hsl(var(--primary))',
};

const sentimentIcon: Record<string, string> = {
  Positivo: '😊', Negativo: '😟', Neutro: '😐', Consulta: '❓',
};

export const CommunityHub = () => {
  const [interactions, setInteractions] = useState<Interaction[]>([
    { id: '1', user: 'Carlos Ruiz', platform: 'LinkedIn', comment: 'Excelente video. ¿Cuentan con soporte para servidores Linux en sitio?', time: 'Hace 2 horas', status: 'pending' },
    { id: '2', user: 'TechEnthusiast_99', platform: 'Instagram', comment: '¿Helpi puede ayudarme a configurar mi router MikroTik?', time: 'Hace 5 horas', status: 'pending' },
    { id: '3', user: 'Maria Gomez', platform: 'Facebook', comment: 'Me encanta el diseño de la nueva oficina, ¡felicitaciones!', time: 'Ayer', status: 'replied', aiReply: '¡Muchas gracias Maria! Te esperamos pronto por aquí.', sentiment: 'Positivo', tone: 'Conversacional' },
  ]);

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string>(interactions[0]?.id || '');
  const [newComment, setNewComment] = useState('');
  const [newUser, setNewUser] = useState('');
  const [newPlatform, setNewPlatform] = useState('LinkedIn');
  const [showAddForm, setShowAddForm] = useState(false);

  const activeItem = interactions.find(i => i.id === activeId);

  const handleSuggest = async (id: string) => {
    const item = interactions.find(i => i.id === id);
    if (!item) return;
    setLoadingId(id);
    try {
      const result = await suggestReply(item.comment, item.platform);
      setInteractions(prev => prev.map(i =>
        i.id === id ? { ...i, aiReply: result.reply, sentiment: result.sentiment, actionNeeded: result.actionNeeded, suggestedAction: result.suggestedAction, tone: result.tone } : i
      ));
    } catch (err: any) {
      console.error('Error generando respuesta:', err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleSend = (id: string) => {
    setInteractions(prev => prev.map(i => i.id === id ? { ...i, status: 'replied' } : i));
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !newUser.trim()) return;
    const id = Date.now().toString();
    setInteractions(prev => [...prev, { id, user: newUser.trim(), platform: newPlatform, comment: newComment.trim(), time: 'Ahora', status: 'pending' }]);
    setActiveId(id);
    setNewComment('');
    setNewUser('');
    setShowAddForm(false);
  };

  const pending = interactions.filter(i => i.status === 'pending');
  const replied = interactions.filter(i => i.status === 'replied');

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, marginBottom: '0.3rem' }}>Community Hub</h1>
          <p style={{ color: 'hsl(var(--text-muted))', margin: 0 }}>Monitorea y responde a tu audiencia con IA.</p>
        </div>
        <button onClick={() => setShowAddForm(v => !v)} style={{ width: 'auto', padding: '0.7rem 1.2rem', fontSize: '0.88rem' }}>
          {showAddForm ? 'Cancelar' : '+ Nuevo comentario'}
        </button>
      </div>

      {showAddForm && (
        <div className="glass-card animate-fade-in" style={{ marginBottom: '2rem', textAlign: 'left' }}>
          <h4 style={{ marginTop: 0 }}>Registrar comentario</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Usuario</label>
              <input style={{ width: '100%', background: 'rgba(255,255,255,0.05)', padding: '0.7rem', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '10px', marginTop: '0.4rem', boxSizing: 'border-box', outline: 'none' }} value={newUser} onChange={(e) => setNewUser(e.target.value)} placeholder="Nombre del usuario" />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Plataforma</label>
              <select style={{ width: '100%', background: 'rgba(30,30,50,0.9)', padding: '0.7rem', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '10px', marginTop: '0.4rem', outline: 'none' }} value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)}>
                {['LinkedIn', 'Instagram', 'Facebook', 'WhatsApp', 'Twitter'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <textarea style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '0.9rem', color: 'white', fontFamily: 'inherit', fontSize: '0.92rem', minHeight: '80px', marginBottom: '1rem', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }} value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Pega el comentario aquí..." />
          <button onClick={handleAddComment} style={{ width: '100%' }}>Agregar y analizar</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {pending.length > 0 && (
            <>
              <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 0.5rem', marginBottom: '0.3rem' }}>Pendientes ({pending.length})</div>
              {pending.map(item => (
                <div key={item.id} onClick={() => setActiveId(item.id)} className="glass-card" style={{ padding: '1rem', cursor: 'pointer', textAlign: 'left', borderLeft: `4px solid ${platformColors[item.platform] || platformColors.default}`, background: activeId === item.id ? 'hsla(var(--primary), 0.08)' : undefined, margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '0.15rem 0.5rem', borderRadius: '8px', background: `${platformColors[item.platform] || platformColors.default}22`, color: platformColors[item.platform] || platformColors.default }}>{item.platform}</span>
                    <span style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))' }}>{item.time}</span>
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '0.88rem', marginBottom: '0.3rem' }}>{item.user}</div>
                  <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.comment}</p>
                </div>
              ))}
            </>
          )}
          {replied.length > 0 && (
            <>
              <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0.5rem 0.5rem 0.3rem', marginTop: '0.5rem' }}>Respondidos ({replied.length})</div>
              {replied.map(item => (
                <div key={item.id} onClick={() => setActiveId(item.id)} className="glass-card" style={{ padding: '1rem', cursor: 'pointer', textAlign: 'left', opacity: 0.6, margin: 0, background: activeId === item.id ? 'hsla(var(--success), 0.05)' : undefined }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>{item.platform}</span>
                    <span style={{ fontSize: '0.68rem', color: 'hsl(var(--success))' }}>✓ Respondido</span>
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '0.88rem' }}>{item.user}</div>
                </div>
              ))}
            </>
          )}
        </div>

        <div>
          {activeItem ? (
            <div className="glass-card animate-fade-in" style={{ textAlign: 'left', padding: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: platformColors[activeItem.platform] || 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.2rem', flexShrink: 0 }}>
                  {activeItem.user[0].toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>{activeItem.user}</h3>
                  <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.82rem' }}>Comentó en {activeItem.platform} · {activeItem.time}</span>
                </div>
                {activeItem.sentiment && (
                  <span style={{ marginLeft: 'auto', fontSize: '1.4rem' }} title={activeItem.sentiment}>{sentimentIcon[activeItem.sentiment] || '💬'}</span>
                )}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--glass-border)', marginBottom: '1.75rem' }}>
                <p style={{ margin: 0, fontSize: '1.05rem', fontStyle: 'italic', lineHeight: '1.6' }}>"{activeItem.comment}"</p>
              </div>

              {activeItem.aiReply ? (
                <div className="animate-fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: '700', padding: '0.25rem 0.7rem', borderRadius: '12px', background: 'hsla(var(--success), 0.12)', color: 'hsl(var(--success))' }}>
                        Helpi sugiere · {activeItem.sentiment} {sentimentIcon[activeItem.sentiment || ''] || ''}
                      </span>
                      {activeItem.tone && (
                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '10px', background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))' }}>{activeItem.tone}</span>
                      )}
                    </div>
                    <button onClick={() => handleSuggest(activeItem.id)} disabled={loadingId === activeItem.id} style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem', background: 'transparent', border: '1px solid var(--glass-border)', width: 'auto', boxShadow: 'none' }}>
                      Regenerar
                    </button>
                  </div>

                  <textarea
                    value={activeItem.aiReply}
                    onChange={(e) => setInteractions(prev => prev.map(i => i.id === activeItem.id ? { ...i, aiReply: e.target.value } : i))}
                    style={{ width: '100%', minHeight: '100px', background: 'rgba(0,180,0,0.04)', border: '1px solid hsla(var(--success), 0.3)', borderRadius: '12px', padding: '1rem', color: 'white', fontFamily: 'inherit', fontSize: '0.95rem', marginBottom: '1rem', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
                  />

                  {activeItem.actionNeeded === 'Sí' && activeItem.suggestedAction && (
                    <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'hsla(45, 100%, 55%, 0.08)', borderRadius: '10px', borderLeft: '3px solid hsl(45 100% 55%)', fontSize: '0.88rem' }}>
                      <span style={{ fontWeight: '700', color: 'hsl(45 100% 65%)' }}>Acción recomendada: </span>
                      <span style={{ color: 'hsl(var(--text-main))' }}>{activeItem.suggestedAction}</span>
                    </div>
                  )}

                  {activeItem.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button onClick={() => handleSend(activeItem.id)} style={{ flex: 1 }}>Marcar como respondido</button>
                      <button style={{ background: 'transparent', border: '1px solid var(--glass-border)', boxShadow: 'none', width: 'auto', padding: '0 1rem' }}>Ignorar</button>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={() => handleSuggest(activeItem.id)} disabled={loadingId === activeItem.id} style={{ width: '100%' }}>
                  {loadingId === activeItem.id ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                      <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                      Helpi está analizando...
                    </span>
                  ) : 'Generar Respuesta con IA'}
                </button>
              )}
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '4rem', opacity: 0.5 }}>
              <h2>Todo al día</h2>
              <p>No hay mensajes pendientes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
