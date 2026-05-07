import { useEffect, useState } from 'react';
import {
  runPageSpeedAudit,
  savePageSpeedSnapshot,
  getSeoHistory,
  getUptimeStats,
  type PageSpeedResult,
} from '../../services/seoService';
import type { SeoSnapshot } from '../../types/seo.types';
import { getVitalStatus, VITAL_THRESHOLDS, type VitalStatus } from '../../types/seo.types';
import { writeAgentLog } from '../../services/agentOrchestrator';

// ─── Helpers visuales ────────────────────────────────────────────────────────

const vitalColor: Record<VitalStatus, string> = {
  good:              'hsl(var(--success))',
  'needs-improvement': '#f59e0b',
  poor:              '#ef4444',
};

const scoreColor = (score: number | null): string => {
  if (score == null)  return 'hsl(var(--text-muted))';
  if (score >= 90)    return 'hsl(var(--success))';
  if (score >= 50)    return '#f59e0b';
  return '#ef4444';
};

const formatMs = (ms: number | null): string =>
  ms == null ? '—' : ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;

// ─── Sub-componentes ─────────────────────────────────────────────────────────

const ScoreRing = ({ score, label }: { score: number | null; label: string }) => {
  const color = scoreColor(score);
  const pct = score ?? 0;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle
          cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
          style={{ transition: 'stroke-dasharray 1s ease-out' }}
        />
        <text x="36" y="41" textAnchor="middle" fill={color} fontSize="15" fontWeight="800">
          {score ?? '—'}
        </text>
      </svg>
      <span style={{ fontSize: '0.72rem', opacity: 0.65, fontWeight: 600, letterSpacing: '0.04em' }}>
        {label}
      </span>
    </div>
  );
};

const VitalBar = ({
  label, value, metric, unit = 'ms',
}: {
  label: string; value: number | null; metric: string; unit?: string;
}) => {
  const status = value != null ? getVitalStatus(metric, value) : 'good';
  const color  = vitalColor[status];
  const t      = VITAL_THRESHOLDS[metric];
  const max    = t ? t.poor * 1.3 : 100;
  const pct    = value != null ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.82rem' }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ color, fontWeight: 700 }}>
            {value != null ? (unit === 'ms' ? formatMs(value) : value.toFixed(4)) : '—'}
          </span>
          <span style={{
            fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.4rem',
            borderRadius: '4px', background: `${color}22`, color,
          }}>
            {status === 'good' ? 'BUENO' : status === 'needs-improvement' ? 'MEJORAR' : 'MALO'}
          </span>
        </div>
      </div>
      <div style={{ height: '5px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: color,
          borderRadius: '3px', transition: 'width 1s ease-out',
          boxShadow: `0 0 8px ${color}80`,
        }} />
      </div>
    </div>
  );
};

const SnapshotRow = ({ snap }: { snap: SeoSnapshot }) => (
  <div style={{
    display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 80px',
    gap: '0.5rem', padding: '0.6rem 0',
    borderBottom: '1px solid var(--glass-border)',
    fontSize: '0.82rem', alignItems: 'center',
  }}>
    <span style={{ opacity: 0.7 }}>
      {new Date(snap.created_at).toLocaleDateString('es-CO', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      })}
    </span>
    <span style={{ color: scoreColor(snap.performance_score), fontWeight: 700, textAlign: 'center' }}>
      {snap.performance_score ?? '—'}
    </span>
    <span style={{ color: scoreColor(snap.seo_score), fontWeight: 700, textAlign: 'center' }}>
      {snap.seo_score ?? '—'}
    </span>
    <span style={{ textAlign: 'center', opacity: 0.8 }}>{formatMs(snap.lcp_ms)}</span>
    <span style={{ textAlign: 'center', opacity: 0.8 }}>
      {snap.cls_score != null ? snap.cls_score.toFixed(3) : '—'}
    </span>
  </div>
);

// ─── Componente principal ────────────────────────────────────────────────────

export function WebVitals() {
  const [device,     setDevice]     = useState<'mobile' | 'desktop'>('mobile');
  const [scanning,   setScanning]   = useState(false);
  const [result,     setResult]     = useState<PageSpeedResult | null>(null);
  const [history,    setHistory]    = useState<SeoSnapshot[]>([]);
  const [uptime,     setUptime]     = useState<Awaited<ReturnType<typeof getUptimeStats>>>(null);
  const [error,      setError]      = useState<string | null>(null);
  const [loadingHist,setLoadingHist]= useState(true);

  const loadHistory = async (d: 'mobile' | 'desktop') => {
    setLoadingHist(true);
    const [hist, up] = await Promise.all([getSeoHistory(d, 30), getUptimeStats()]);
    setHistory(hist);
    setUptime(up);
    setLoadingHist(false);
  };

  useEffect(() => { loadHistory(device); }, [device]);

  const handleScan = async () => {
    setScanning(true);
    setError(null);
    try {
      const res = await runPageSpeedAudit(device);
      setResult(res);
      await savePageSpeedSnapshot(res);
      await writeAgentLog(
        'SEO_AUDIT',
        'success',
        `PageSpeed ${device}: Performance ${res.performanceScore}, SEO ${res.seoScore}`,
        { device, scores: { performance: res.performanceScore, seo: res.seoScore } }
      );
      await loadHistory(device);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al llamar a PageSpeed API';
      setError(msg);
      await writeAgentLog('SEO_AUDIT', 'error', msg);
    } finally {
      setScanning(false);
    }
  };

  const latest = result
    ? { performance_score: result.performanceScore, seo_score: result.seoScore, lcp_ms: result.lcp_ms, fid_ms: result.fid_ms, cls_score: result.cls_score, fcp_ms: result.fcp_ms, ttfb_ms: result.ttfb_ms }
    : history[0] ?? null;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.3rem' }}>Web Vitals</h1>
          <p style={{ color: 'hsl(var(--text-muted))' }}>
            Core Web Vitals reales vía <strong style={{ color: 'hsl(var(--primary))' }}>Google PageSpeed Insights</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Toggle mobile/desktop */}
          <div style={{
            display: 'flex', background: 'rgba(255,255,255,0.05)',
            borderRadius: '10px', padding: '3px', border: '1px solid var(--glass-border)',
          }}>
            {(['mobile', 'desktop'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDevice(d)}
                style={{
                  padding: '0.4rem 1rem', fontSize: '0.8rem', borderRadius: '7px',
                  background: device === d ? 'hsl(var(--primary))' : 'transparent',
                  color: device === d ? '#fff' : 'hsl(var(--text-muted))',
                  border: 'none', cursor: 'pointer', boxShadow: 'none',
                }}
              >
                {d === 'mobile' ? '📱 Móvil' : '💻 Escritorio'}
              </button>
            ))}
          </div>

          <button onClick={handleScan} disabled={scanning} style={{ minWidth: '140px' }}>
            {scanning ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Analizando...
              </span>
            ) : '⚡ Escanear Ahora'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '12px', padding: '1rem 1.5rem', marginBottom: '1.5rem', color: '#ef4444', fontSize: '0.9rem',
        }}>
          ⚠ {error}
          {!import.meta.env.VITE_PAGESPEED_API_KEY && (
            <span style={{ opacity: 0.8 }}> — Agrega <code>VITE_PAGESPEED_API_KEY</code> al .env para evitar límites de cuota.</span>
          )}
        </div>
      )}

      {/* ── Scores principales ────────────────────────────────── */}
      {latest && (
        <>
          <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '2.5rem' }}>
                <ScoreRing score={latest.performance_score} label="RENDIMIENTO" />
                <ScoreRing score={latest.seo_score}         label="SEO" />
              </div>

              {/* Core Web Vitals */}
              <div style={{ flex: 1, minWidth: 280 }}>
                <VitalBar label="LCP — Larger Contentful Paint" value={latest.lcp_ms}   metric="lcp" />
                <VitalBar label="FID — First Input Delay"       value={latest.fid_ms}   metric="fid" />
                <VitalBar label="CLS — Cumulative Layout Shift" value={latest.cls_score != null ? latest.cls_score * 1000 : null} metric="cls" unit="score" />
                <VitalBar label="FCP — First Contentful Paint"  value={latest.fcp_ms}   metric="fcp" />
                <VitalBar label="TTFB — Time to First Byte"     value={latest.ttfb_ms}  metric="ttfb" />
              </div>
            </div>
          </div>

          {/* ── Oportunidades de mejora ────────────────────────── */}
          {result?.opportunities && result.opportunities.length > 0 && (
            <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '1.2rem' }}>🔧 Oportunidades de Mejora</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {result.opportunities.map((op) => (
                  <div
                    key={op.id}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)',
                      borderRadius: '10px', borderLeft: `3px solid ${op.score < 0.5 ? '#ef4444' : '#f59e0b'}`,
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>{op.title}</p>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', opacity: 0.6, maxWidth: 500 }}>{op.description}</p>
                    </div>
                    {op.savings_ms != null && (
                      <span style={{
                        fontSize: '0.78rem', fontWeight: 700, padding: '0.25rem 0.6rem',
                        background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
                        borderRadius: '6px', whiteSpace: 'nowrap', marginLeft: '1rem',
                      }}>
                        -{formatMs(op.savings_ms)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Uptime ───────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="glass-card">
          <h3 style={{ marginBottom: '1rem' }}>🟢 Disponibilidad (24h)</h3>
          {uptime ? (
            <>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: uptime.uptimePercent >= 99 ? 'hsl(var(--success))' : '#f59e0b' }}>
                {uptime.uptimePercent}%
              </div>
              <div style={{ fontSize: '0.82rem', opacity: 0.6, marginTop: '0.25rem' }}>
                {uptime?.upCount ?? uptime?.totalChecks} / {uptime?.totalChecks} checks exitosos
              </div>
              <div style={{ fontSize: '0.82rem', marginTop: '0.75rem', opacity: 0.8 }}>
                Respuesta promedio: <strong>{uptime?.avgResponseMs}ms</strong>
              </div>
              <div style={{ fontSize: '0.72rem', opacity: 0.5, marginTop: '0.25rem' }}>
                Último check: {uptime?.lastCheck?.checked_at ? new Date(uptime.lastCheck.checked_at).toLocaleTimeString('es-CO') : '—'}
              </div>
            </>
          ) : (
            <div style={{ opacity: 0.5, fontSize: '0.9rem', paddingTop: '0.5rem' }}>
              <p>Sin datos aún.</p>
              <p style={{ fontSize: '0.78rem', marginTop: '0.5rem' }}>
                Configura el workflow <strong>n8n Uptime Monitor</strong> para llenar esta sección automáticamente.
              </p>
            </div>
          )}
        </div>

        {/* ── Historial ────────────────────────────────────────── */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>📊 Historial de Escaneos</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.5, fontWeight: 400 }}>Últimos 30 días · {device}</span>
          </h3>

          {loadingHist && <p style={{ opacity: 0.5, fontSize: '0.85rem' }}>Cargando historial...</p>}

          {!loadingHist && history.length === 0 && (
            <p style={{ opacity: 0.5, fontSize: '0.85rem' }}>
              Ningún escaneo registrado. Haz clic en <strong>Escanear Ahora</strong> para el primero.
            </p>
          )}

          {!loadingHist && history.length > 0 && (
            <>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 80px',
                gap: '0.5rem', padding: '0.4rem 0',
                fontSize: '0.72rem', fontWeight: 700, opacity: 0.5, letterSpacing: '0.04em',
              }}>
                <span>FECHA</span>
                <span style={{ textAlign: 'center' }}>PERF.</span>
                <span style={{ textAlign: 'center' }}>SEO</span>
                <span style={{ textAlign: 'center' }}>LCP</span>
                <span style={{ textAlign: 'center' }}>CLS</span>
              </div>
              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {history.map((snap) => <SnapshotRow key={snap.id} snap={snap} />)}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Nota sobre API key ────────────────────────────────── */}
      {!import.meta.env.VITE_PAGESPEED_API_KEY && (
        <div style={{
          fontSize: '0.8rem', opacity: 0.55, background: 'rgba(255,255,255,0.03)',
          borderRadius: '10px', padding: '0.75rem 1rem', border: '1px dashed var(--glass-border)',
        }}>
          💡 Para evitar límites de cuota, obtén una API key gratuita en{' '}
          <strong>Google Cloud Console</strong> y agrégala como{' '}
          <code>VITE_PAGESPEED_API_KEY</code> en tu archivo <code>.env</code>.
        </div>
      )}
    </div>
  );
}
