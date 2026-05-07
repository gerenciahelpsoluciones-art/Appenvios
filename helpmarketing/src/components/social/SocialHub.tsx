import { useEffect, useState } from 'react';
import { getSocialMetrics, getPosts, approvePost, rejectPost } from '../../services/socialApiService';
import { suggestReply } from '../../services/geminiService';
import type { SocialMetrics, SocialPlatform, Post } from '../../types/social.types';

// ─── Datos por plataforma ────────────────────────────────────────────────────

const PLATFORM_META: Record<SocialPlatform, { label: string; color: string; icon: string }> = {
  linkedin:  { label: 'LinkedIn',  color: '#0077b5', icon: 'in' },
  instagram: { label: 'Instagram', color: '#e1306c', icon: '📸' },
  facebook:  { label: 'Facebook',  color: '#1877f2', icon: '𝑓' },
  twitter:   { label: 'X/Twitter', color: '#14171a', icon: '𝕏' },
  tiktok:    { label: 'TikTok',    color: '#ff0050', icon: '♪' },
  whatsapp:  { label: 'WhatsApp',  color: '#25d366', icon: '📞' },
};

const STATUS_META: Record<Post['status'], { label: string; color: string }> = {
  draft:     { label: 'Borrador',   color: 'hsl(var(--text-muted))' },
  approved:  { label: 'Aprobado',   color: '#f59e0b' },
  scheduled: { label: 'Programado', color: 'hsl(var(--primary))' },
  published: { label: 'Publicado',  color: 'hsl(var(--success))' },
  failed:    { label: 'Fallido',    color: '#ef4444' },
};

const formatNum = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

// ─── Tarjeta de métrica por plataforma ──────────────────────────────────────

const PlatformCard = ({ metrics }: { metrics: SocialMetrics }) => {
  const meta = PLATFORM_META[metrics.platform];
  return (
    <div className="glass-card" style={{ borderTop: `3px solid ${meta.color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.2rem' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '8px',
          background: `${meta.color}22`, color: meta.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: '1rem',
        }}>
          {meta.icon}
        </div>
        <span style={{ fontWeight: 700 }}>{meta.label}</span>
        <span style={{
          marginLeft: 'auto', fontSize: '0.65rem', fontWeight: 700,
          padding: '0.2rem 0.5rem', borderRadius: '20px',
          background: 'hsl(var(--success) / 0.15)', color: 'hsl(var(--success))',
        }}>
          CONECTADO
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {[
          { label: 'Seguidores',   value: formatNum(metrics.followers) },
          { label: 'Engagement',   value: `${(metrics.engagement_rate * 100).toFixed(1)}%` },
          { label: 'Alcance 7d',   value: formatNum(metrics.reach_7d) },
          { label: 'Impresiones',  value: formatNum(metrics.impressions_7d) },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: '0.7rem', opacity: 0.55, fontWeight: 700, letterSpacing: '0.04em' }}>{label.toUpperCase()}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.1rem' }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1rem', fontSize: '0.72rem', opacity: 0.45 }}>
        Snapshot: {new Date(metrics.snapshot_date).toLocaleDateString('es-CO')}
      </div>
    </div>
  );
};

// ─── Fila de post en la cola ─────────────────────────────────────────────────

const PostRow = ({
  post, onApprove, onReject,
}: {
  post: Post;
  onApprove: (id: string) => void;
  onReject:  (id: string) => void;
}) => {
  const meta   = PLATFORM_META[post.platform];
  const status = STATUS_META[post.status];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '28px 2fr 110px 120px 160px',
      gap: '0.75rem', padding: '0.75rem 0',
      borderBottom: '1px solid var(--glass-border)',
      alignItems: 'center', fontSize: '0.85rem',
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: '6px',
        background: `${meta.color}22`, color: meta.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.7rem', fontWeight: 900,
      }}>
        {meta.icon}
      </div>

      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {post.title ?? post.copy.slice(0, 55) + '...'}
        </p>
        <p style={{ margin: 0, fontSize: '0.72rem', opacity: 0.5 }}>
          {new Date(post.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      <span style={{
        fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem',
        borderRadius: '20px', background: `${status.color}22`, color: status.color,
        textAlign: 'center',
      }}>
        {status.label}
      </span>

      <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>
        {post.scheduled_at
          ? new Date(post.scheduled_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
          : '—'}
      </span>

      <div style={{ display: 'flex', gap: '0.4rem' }}>
        {post.status === 'draft' && (
          <>
            <button
              onClick={() => onApprove(post.id)}
              style={{
                fontSize: '0.72rem', padding: '0.25rem 0.6rem',
                background: 'hsl(var(--success) / 0.15)', color: 'hsl(var(--success))',
                border: '1px solid hsl(var(--success) / 0.3)', borderRadius: '6px',
                cursor: 'pointer', boxShadow: 'none',
              }}
            >
              ✓ Aprobar
            </button>
            <button
              onClick={() => onReject(post.id)}
              style={{
                fontSize: '0.72rem', padding: '0.25rem 0.6rem',
                background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px',
                cursor: 'pointer', boxShadow: 'none',
              }}
            >
              ✕
            </button>
          </>
        )}
        {post.status === 'published' && post.engagement && (
          <span style={{ fontSize: '0.72rem', opacity: 0.6 }}>
            ❤ {(post.engagement as any).likes ?? 0} · 💬 {(post.engagement as any).comments ?? 0}
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Panel de Community Manager ──────────────────────────────────────────────

interface Comment {
  id: string;
  user: string;
  platform: SocialPlatform;
  comment: string;
  time: string;
  status: 'pending' | 'replied';
  aiReply?: string;
  sentiment?: string;
}

const DEMO_COMMENTS: Comment[] = [
  { id: '1', user: 'Carlos Ruiz',      platform: 'linkedin',  comment: 'Excelente post. ¿Cuentan con soporte para servidores Linux en sitio?', time: 'Hace 2h', status: 'pending' },
  { id: '2', user: 'TechEnthusiast_99', platform: 'instagram', comment: '¿Pueden ayudarme a configurar un router MikroTik?',                    time: 'Hace 5h', status: 'pending' },
  { id: '3', user: 'Maria Gomez',       platform: 'facebook',  comment: '¡Me encanta el contenido que publican, muy profesional!',               time: 'Ayer',    status: 'replied', aiReply: '¡Muchas gracias Maria! Seguimos trabajando para ti.', sentiment: 'Positivo' },
];

const CommunityPanel = () => {
  const [comments,   setComments]   = useState<Comment[]>(DEMO_COMMENTS);
  const [loadingId,  setLoadingId]  = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(DEMO_COMMENTS[0]?.id ?? null);

  const selected = comments.find((c) => c.id === selectedId);

  const handleSuggest = async (id: string) => {
    const item = comments.find((c) => c.id === id);
    if (!item) return;
    setLoadingId(id);
    try {
      const result = await suggestReply(item.comment, PLATFORM_META[item.platform].label);
      setComments((prev) => prev.map((c) =>
        c.id === id ? { ...c, aiReply: result.reply, sentiment: result.sentiment } : c
      ));
    } catch {
      // silenciar error
    } finally {
      setLoadingId(null);
    }
  };

  const handleSend = (id: string) => {
    setComments((prev) => prev.map((c) => c.id === id ? { ...c, status: 'replied' } : c));
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }}>
      {/* Lista */}
      <div>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, opacity: 0.5, letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
          COMENTARIOS RECIENTES
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {comments.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                cursor: 'pointer',
                background: selectedId === c.id ? 'hsl(var(--primary) / 0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${selectedId === c.id ? 'hsl(var(--primary) / 0.4)' : 'var(--glass-border)'}`,
                borderLeft: c.status === 'pending' ? '3px solid hsl(var(--primary))' : '3px solid transparent',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{c.user}</span>
                <span style={{
                  fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px',
                  background: `${PLATFORM_META[c.platform].color}22`,
                  color: PLATFORM_META[c.platform].color,
                }}>
                  {PLATFORM_META[c.platform].label}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', opacity: 0.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.comment}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Detalle */}
      {selected ? (
        <div className="glass-card">
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'hsl(var(--primary))', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: 800, flexShrink: 0,
            }}>
              {selected.user[0]}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700 }}>{selected.user}</p>
              <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6 }}>
                {PLATFORM_META[selected.platform].label} · {selected.time}
              </p>
            </div>
            {selected.status === 'replied' && (
              <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'hsl(var(--success))' }}>✓ Respondido</span>
            )}
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.03)', padding: '1.25rem',
            borderRadius: '12px', border: '1px solid var(--glass-border)', marginBottom: '1.5rem',
          }}>
            <p style={{ margin: 0, fontStyle: 'italic', lineHeight: 1.6 }}>"{selected.comment}"</p>
          </div>

          {selected.aiReply ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'hsl(var(--success))', fontWeight: 700 }}>
                  ✦ Sugerencia Helpi · {selected.sentiment}
                </span>
                <button
                  onClick={() => handleSuggest(selected.id)}
                  style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '6px', boxShadow: 'none' }}
                >
                  Regenerar
                </button>
              </div>
              <textarea
                value={selected.aiReply}
                onChange={(e) => setComments((prev) => prev.map((c) => c.id === selected.id ? { ...c, aiReply: e.target.value } : c))}
                style={{
                  width: '100%', minHeight: '100px',
                  background: 'hsl(var(--success) / 0.05)',
                  border: '1px solid hsl(var(--success) / 0.3)',
                  borderRadius: '10px', padding: '1rem',
                  color: 'white', fontFamily: 'inherit', fontSize: '0.9rem', marginBottom: '1rem',
                }}
              />
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => handleSend(selected.id)} style={{ flex: 1 }}>Enviar Respuesta</button>
                <button style={{ background: 'transparent', border: '1px solid var(--glass-border)', boxShadow: 'none' }}>Ignorar</button>
              </div>
            </>
          ) : (
            <button
              onClick={() => handleSuggest(selected.id)}
              disabled={loadingId === selected.id || selected.status === 'replied'}
              style={{ width: '100%', height: '48px' }}
            >
              {loadingId === selected.id ? 'Helpi está analizando...' : 'Generar Respuesta con IA'}
            </button>
          )}
        </div>
      ) : (
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
          Selecciona un comentario para responder
        </div>
      )}
    </div>
  );
};

// ─── Componente principal ────────────────────────────────────────────────────

type SocialTab = 'metrics' | 'queue' | 'community';

export function SocialHub() {
  const [tab,     setTab]     = useState<SocialTab>('metrics');
  const [metrics, setMetrics] = useState<SocialMetrics[]>([]);
  const [posts,   setPosts]   = useState<Post[]>([]);
  const [counts,  setCounts]  = useState<Record<Post['status'], number> | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [m, p] = await Promise.all([getSocialMetrics(), getPosts({ limit: 30 })]);
    setMetrics(m);
    setPosts(p);

    // Contar por estado
    const c: Record<string, number> = { draft: 0, approved: 0, scheduled: 0, published: 0, failed: 0 };
    p.forEach((post) => { c[post.status] = (c[post.status] ?? 0) + 1; });
    setCounts(c as Record<Post['status'], number>);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleApprove = async (id: string) => {
    await approvePost(id);
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, status: 'approved' } : p));
  };

  const handleReject = async (id: string) => {
    await rejectPost(id);
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, status: 'failed' } : p));
  };

  const tabStyle = (t: SocialTab) => ({
    padding: '0.5rem 1.2rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600,
    background: tab === t ? 'hsl(var(--primary))' : 'transparent',
    color: tab === t ? '#fff' : 'hsl(var(--text-muted))',
    border: 'none', cursor: 'pointer', boxShadow: 'none',
  });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.3rem' }}>Social Hub</h1>
          <p style={{ color: 'hsl(var(--text-muted))' }}>
            Gestión unificada de todas tus redes sociales
          </p>
        </div>
      </div>

      {/* Resumen de cola */}
      {counts && (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {(Object.entries(counts) as [Post['status'], number][]).map(([status, count]) => (
            <div
              key={status}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.4rem 0.9rem', borderRadius: '20px',
                background: `${STATUS_META[status].color}15`,
                border: `1px solid ${STATUS_META[status].color}30`,
                fontSize: '0.8rem',
              }}
            >
              <span style={{ fontWeight: 800, color: STATUS_META[status].color }}>{count}</span>
              <span style={{ opacity: 0.7 }}>{STATUS_META[status].label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '0.25rem', marginBottom: '1.5rem',
        background: 'rgba(255,255,255,0.04)', borderRadius: '10px',
        padding: '4px', width: 'fit-content',
        border: '1px solid var(--glass-border)',
      }}>
        <button style={tabStyle('metrics')}   onClick={() => setTab('metrics')}>📊 Métricas</button>
        <button style={tabStyle('queue')}     onClick={() => setTab('queue')}>
          📅 Cola de Posts {counts?.draft ? <span style={{ marginLeft: '4px', background: '#f59e0b', color: '#000', borderRadius: '10px', padding: '0 5px', fontSize: '0.7rem' }}>{counts.draft}</span> : null}
        </button>
        <button style={tabStyle('community')} onClick={() => setTab('community')}>💬 Community</button>
      </div>

      {/* ── Métricas ─────────────────────────────────────────── */}
      {tab === 'metrics' && (
        <>
          {loading && <p style={{ opacity: 0.5 }}>Cargando métricas...</p>}
          {!loading && metrics.length === 0 && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📡</div>
              <h3>Sin métricas aún</h3>
              <p style={{ color: 'hsl(var(--text-muted))', maxWidth: 400, margin: '0.5rem auto 0' }}>
                Las métricas se rellenarán automáticamente cuando configures el workflow{' '}
                <strong>n8n Social Metrics Sync</strong> que lee los datos de cada plataforma.
              </p>
              <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 380, margin: '2rem auto 0', textAlign: 'left' }}>
                {(['linkedin', 'instagram', 'facebook'] as SocialPlatform[]).map((p) => (
                  <div key={p} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                    background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
                    border: '1px solid var(--glass-border)',
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '6px', fontSize: '0.8rem',
                      background: `${PLATFORM_META[p].color}22`, color: PLATFORM_META[p].color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900,
                    }}>
                      {PLATFORM_META[p].icon}
                    </div>
                    <span style={{ fontWeight: 600 }}>{PLATFORM_META[p].label}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.72rem', opacity: 0.4 }}>Pendiente configurar</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!loading && metrics.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {metrics.map((m) => <PlatformCard key={m.platform} metrics={m} />)}
            </div>
          )}
        </>
      )}

      {/* ── Cola de posts ─────────────────────────────────────── */}
      {tab === 'queue' && (
        <>
          {loading && <p style={{ opacity: 0.5 }}>Cargando posts...</p>}
          {!loading && posts.length === 0 && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📝</div>
              <p style={{ color: 'hsl(var(--text-muted))' }}>
                No hay posts en la cola. Crea contenido en <strong>Creative Studio</strong>.
              </p>
            </div>
          )}
          {!loading && posts.length > 0 && (
            <div className="glass-card">
              <div style={{
                display: 'grid', gridTemplateColumns: '28px 2fr 110px 120px 160px',
                gap: '0.75rem', padding: '0.4rem 0 0.75rem',
                fontSize: '0.7rem', fontWeight: 700, opacity: 0.5, letterSpacing: '0.05em',
                borderBottom: '1px solid var(--glass-border)',
              }}>
                <span />
                <span>POST</span>
                <span>ESTADO</span>
                <span>PROGRAMADO</span>
                <span>ACCIONES</span>
              </div>
              {posts.map((post) => (
                <PostRow key={post.id} post={post} onApprove={handleApprove} onReject={handleReject} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Community Manager ─────────────────────────────────── */}
      {tab === 'community' && <CommunityPanel />}
    </div>
  );
}
