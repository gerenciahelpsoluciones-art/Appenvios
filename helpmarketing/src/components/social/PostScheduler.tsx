import { useEffect, useState } from 'react';
import { getPosts, approvePost, rejectPost } from '../../services/socialApiService';
import type { Post, SocialPlatform } from '../../types/social.types';

const PLATFORM_COLOR: Record<SocialPlatform, string> = {
  linkedin:  '#0077b5',
  instagram: '#e1306c',
  facebook:  '#1877f2',
  twitter:   '#14171a',
  tiktok:    '#ff0050',
};

const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  linkedin:  'LinkedIn',
  instagram: 'Instagram',
  facebook:  'Facebook',
  twitter:   'X/Twitter',
  tiktok:    'TikTok',
};

const STATUS_LABEL: Record<Post['status'], string> = {
  draft:     'Borrador',
  approved:  'Aprobado',
  scheduled: 'Programado',
  published: 'Publicado',
  failed:    'Fallido',
};

const STATUS_COLOR: Record<Post['status'], string> = {
  draft:     'hsl(var(--text-muted))',
  approved:  '#f59e0b',
  scheduled: 'hsl(var(--primary))',
  published: 'hsl(var(--success))',
  failed:    '#ef4444',
};

const DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// ─── Helpers de calendario ───────────────────────────────────────────────────

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDow    = (year: number, month: number) => new Date(year, month, 1).getDay();

// ─── Tarjeta de post individual ──────────────────────────────────────────────

const PostCard = ({ post, onApprove, onReject }: {
  post: Post;
  onApprove: (id: string) => void;
  onReject:  (id: string) => void;
}) => (
  <div style={{
    padding: '1rem', background: 'rgba(255,255,255,0.04)',
    borderRadius: '12px', border: '1px solid var(--glass-border)',
    borderLeft: `3px solid ${PLATFORM_COLOR[post.platform]}`,
    display: 'flex', flexDirection: 'column', gap: '0.5rem',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{
        fontSize: '0.7rem', fontWeight: 700,
        color: PLATFORM_COLOR[post.platform],
        background: `${PLATFORM_COLOR[post.platform]}18`,
        padding: '0.15rem 0.5rem', borderRadius: '4px',
      }}>
        {PLATFORM_LABEL[post.platform]}
      </span>
      <span style={{ fontSize: '0.7rem', color: STATUS_COLOR[post.status] }}>
        {STATUS_LABEL[post.status]}
      </span>
    </div>

    <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.4 }}>
      {post.title ?? post.copy.slice(0, 70) + (post.copy.length > 70 ? '...' : '')}
    </p>

    {post.scheduled_at && (
      <p style={{ margin: 0, fontSize: '0.72rem', opacity: 0.5 }}>
        🕐 {new Date(post.scheduled_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
      </p>
    )}

    {post.status === 'draft' && (
      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
        <button
          onClick={() => onApprove(post.id)}
          style={{
            flex: 1, fontSize: '0.72rem', padding: '0.3rem',
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
            fontSize: '0.72rem', padding: '0.3rem 0.6rem',
            background: 'rgba(239,68,68,0.1)', color: '#ef4444',
            border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px',
            cursor: 'pointer', boxShadow: 'none',
          }}
        >
          ✕
        </button>
      </div>
    )}
  </div>
);

// ─── Componente principal ────────────────────────────────────────────────────

export function PostScheduler() {
  const [posts,        setPosts]        = useState<Post[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [filterStatus, setFilterStatus] = useState<Post['status'] | 'all'>('all');
  const [viewMode,     setViewMode]     = useState<'list' | 'calendar'>('list');
  const [calYear,      setCalYear]      = useState(new Date().getFullYear());
  const [calMonth,     setCalMonth]     = useState(new Date().getMonth());

  const load = async () => {
    setLoading(true);
    const data = await getPosts({ limit: 100 });
    setPosts(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id: string) => {
    await approvePost(id);
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, status: 'approved' } : p));
  };

  const handleReject = async (id: string) => {
    await rejectPost(id);
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, status: 'failed' } : p));
  };

  const filtered = filterStatus === 'all' ? posts : posts.filter((p) => p.status === filterStatus);

  // Para el calendario: índice de posts por día
  const postsByDay: Record<string, Post[]> = {};
  posts.forEach((p) => {
    const d = p.scheduled_at ?? p.created_at;
    const key = d.slice(0, 10); // YYYY-MM-DD
    if (!postsByDay[key]) postsByDay[key] = [];
    postsByDay[key].push(p);
  });

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDow    = getFirstDow(calYear, calMonth);
  const today       = new Date();

  const filterBtn = (s: Post['status'] | 'all', label: string) => {
    const count = s === 'all' ? posts.length : posts.filter((p) => p.status === s).length;
    return (
      <button
        key={s}
        onClick={() => setFilterStatus(s)}
        style={{
          fontSize: '0.78rem', padding: '0.3rem 0.8rem', borderRadius: '20px',
          background: filterStatus === s
            ? (s === 'all' ? 'hsl(var(--primary))' : `${STATUS_COLOR[s as Post['status']]}25`)
            : 'rgba(255,255,255,0.05)',
          color: filterStatus === s
            ? (s === 'all' ? '#fff' : STATUS_COLOR[s as Post['status']])
            : 'hsl(var(--text-muted))',
          border: filterStatus === s
            ? `1px solid ${s === 'all' ? 'transparent' : STATUS_COLOR[s as Post['status']] + '50'}`
            : '1px solid var(--glass-border)',
          cursor: 'pointer', boxShadow: 'none',
        }}
      >
        {label} {count > 0 && <span style={{ opacity: 0.7 }}>({count})</span>}
      </button>
    );
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.3rem' }}>Calendario de Contenido</h1>
          <p style={{ color: 'hsl(var(--text-muted))' }}>
            Gestiona todos los posts — borradores, aprobados y publicados
          </p>
        </div>

        {/* Toggle lista / calendario */}
        <div style={{
          display: 'flex', background: 'rgba(255,255,255,0.05)',
          borderRadius: '10px', padding: '3px', border: '1px solid var(--glass-border)',
        }}>
          {(['list', 'calendar'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              style={{
                padding: '0.4rem 1rem', fontSize: '0.8rem', borderRadius: '7px',
                background: viewMode === v ? 'hsl(var(--primary))' : 'transparent',
                color: viewMode === v ? '#fff' : 'hsl(var(--text-muted))',
                border: 'none', cursor: 'pointer', boxShadow: 'none',
              }}
            >
              {v === 'list' ? '≡ Lista' : '⊞ Calendario'}
            </button>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {filterBtn('all',       'Todos')}
        {filterBtn('draft',     'Borradores')}
        {filterBtn('approved',  'Aprobados')}
        {filterBtn('scheduled', 'Programados')}
        {filterBtn('published', 'Publicados')}
        {filterBtn('failed',    'Fallidos')}
      </div>

      {loading && <p style={{ opacity: 0.5 }}>Cargando posts...</p>}

      {/* ── Vista lista ──────────────────────────────────────── */}
      {!loading && viewMode === 'list' && (
        <>
          {filtered.length === 0 && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📋</div>
              <p style={{ color: 'hsl(var(--text-muted))' }}>
                No hay posts {filterStatus !== 'all' ? `con estado "${STATUS_LABEL[filterStatus as Post['status']]}"` : ''}.
              </p>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {filtered.map((post) => (
              <PostCard key={post.id} post={post} onApprove={handleApprove} onReject={handleReject} />
            ))}
          </div>
        </>
      )}

      {/* ── Vista calendario ─────────────────────────────────── */}
      {!loading && viewMode === 'calendar' && (
        <div className="glass-card">
          {/* Navegación del mes */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <button
              onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}
              style={{ background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0.3rem 0.7rem', boxShadow: 'none' }}
            >‹</button>
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
              {MONTHS[calMonth]} {calYear}
            </span>
            <button
              onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}
              style={{ background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0.3rem 0.7rem', boxShadow: 'none' }}
            >›</button>
          </div>

          {/* Cabecera días */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
            {DOW.map((d) => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, opacity: 0.45, padding: '0.3rem 0' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Grilla días */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {/* Celdas vacías antes del día 1 */}
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`empty-${i}`} style={{ minHeight: 80 }} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day     = i + 1;
              const dateKey = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayPosts = postsByDay[dateKey] ?? [];
              const isToday  = today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === day;

              return (
                <div
                  key={day}
                  style={{
                    minHeight: 80, padding: '0.4rem',
                    background: isToday ? 'hsl(var(--primary) / 0.1)' : 'rgba(255,255,255,0.02)',
                    borderRadius: '8px',
                    border: isToday ? '1px solid hsl(var(--primary) / 0.4)' : '1px solid var(--glass-border)',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: isToday ? 800 : 400, color: isToday ? 'hsl(var(--primary))' : undefined, marginBottom: '0.3rem' }}>
                    {day}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {dayPosts.slice(0, 3).map((p) => (
                      <div
                        key={p.id}
                        title={`${PLATFORM_LABEL[p.platform]}: ${p.title ?? p.copy.slice(0, 40)}`}
                        style={{
                          height: 4, borderRadius: '2px',
                          background: PLATFORM_COLOR[p.platform],
                          opacity: p.status === 'published' ? 1 : 0.5,
                        }}
                      />
                    ))}
                    {dayPosts.length > 3 && (
                      <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>+{dayPosts.length - 3}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leyenda */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {(Object.entries(PLATFORM_COLOR) as [SocialPlatform, string][]).map(([p, color]) => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', opacity: 0.6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '2px', background: color }} />
                {PLATFORM_LABEL[p]}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
