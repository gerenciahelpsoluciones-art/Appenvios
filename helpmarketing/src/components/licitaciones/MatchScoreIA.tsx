import { useState, useEffect } from 'react';
import type { Licitacion, EmpresaPerfil } from '../../types/licitaciones.types';
import { calcularMatchScore } from '../../services/licitacionesAI';
import { probarConexionTelegram, getConfig, saveConfig } from '../../services/telegramLicit';
import { getLicitacionesGuardadas, updateLicitacion, getEmpresaPerfil, saveEmpresaPerfil } from './store';
import type { TelegramLicitConfig } from '../../types/licitaciones.types';

function ScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  const r = 40, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div style={{ position: 'relative', width: 100, height: 100 }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{score}</div>
        <div style={{ fontSize: '0.6rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>/ 100</div>
      </div>
    </div>
  );
}

export function MatchScoreIA() {
  const [licitaciones, setLicitaciones] = useState<Licitacion[]>([]);
  const [perfil, setPerfil] = useState<EmpresaPerfil>(getEmpresaPerfil());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [showPerfilEditor, setShowPerfilEditor] = useState(false);
  const [showTelegramConfig, setShowTelegramConfig] = useState(false);
  const [telegramCfg, setTelegramCfg] = useState<TelegramLicitConfig>(getConfig());
  const [telegramTest, setTelegramTest] = useState('');
  const [perfilDraft, setPerfilDraft] = useState(JSON.stringify(getEmpresaPerfil(), null, 2));
  const [perfilError, setPerfilError] = useState('');

  useEffect(() => {
    setLicitaciones(getLicitacionesGuardadas());
  }, []);

  const handleAnalizar = async (licit: Licitacion) => {
    setAnalyzing(licit.id);
    try {
      const result = await calcularMatchScore(licit, perfil);
      updateLicitacion(licit.id, { match_score: result.score, match_result: result });
      setLicitaciones(getLicitacionesGuardadas());
    } catch (e) {
      alert('Error IA: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setAnalyzing(null);
    }
  };

  const handleAnalizarTodas = async () => {
    for (const l of licitaciones) {
      if (l.match_score === undefined) {
        await handleAnalizar(l);
      }
    }
  };

  const handleSavePerfil = () => {
    try {
      const parsed = JSON.parse(perfilDraft);
      saveEmpresaPerfil(parsed);
      setPerfil(parsed);
      setShowPerfilEditor(false);
      setPerfilError('');
    } catch {
      setPerfilError('JSON inválido. Verifica el formato.');
    }
  };

  const handleTestTelegram = async () => {
    const result = await probarConexionTelegram(telegramCfg);
    setTelegramTest(result.ok ? '✅ Conexión exitosa' : '❌ ' + (result.error || 'Error'));
    setTimeout(() => setTelegramTest(''), 4000);
  };

  const handleSaveTelegramCfg = () => {
    saveConfig(telegramCfg);
    setShowTelegramConfig(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--glass-border)',
    borderRadius: '8px',
    color: 'hsl(var(--text-main))',
    fontSize: '0.85rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const cardStyle: React.CSSProperties = {
    background: 'var(--glass)',
    border: '1px solid var(--glass-border)',
    borderRadius: '12px',
    padding: '1.25rem',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Actions bar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          onClick={handleAnalizarTodas}
          disabled={!!analyzing || licitaciones.filter(l => l.match_score === undefined).length === 0}
          style={{
            padding: '0.55rem 1.25rem',
            background: 'rgba(139,92,246,0.2)',
            border: '1px solid rgba(139,92,246,0.4)',
            borderRadius: '8px',
            color: '#a78bfa',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          🧠 Analizar todas ({licitaciones.filter(l => l.match_score === undefined).length} pendientes)
        </button>

        <button
          onClick={() => setShowPerfilEditor(!showPerfilEditor)}
          style={{
            padding: '0.55rem 1.25rem',
            background: 'rgba(59,130,246,0.15)',
            border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: '8px',
            color: '#60a5fa',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          🏢 Perfil Empresa
        </button>

        <button
          onClick={() => setShowTelegramConfig(!showTelegramConfig)}
          style={{
            padding: '0.55rem 1.25rem',
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: '8px',
            color: '#93c5fd',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          📬 Telegram
        </button>
      </div>

      {/* Perfil Editor */}
      {showPerfilEditor && (
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 0.75rem', color: '#60a5fa', fontSize: '0.95rem', fontWeight: 700 }}>
            🏢 Perfil de Empresa (JSON)
          </h3>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
            Edita los servicios, experiencia y capacidades de tu empresa para mejorar el análisis IA.
          </p>
          <textarea
            value={perfilDraft}
            onChange={e => setPerfilDraft(e.target.value)}
            rows={16}
            style={{
              ...inputStyle,
              fontFamily: 'Fira Code, monospace',
              fontSize: '0.78rem',
              resize: 'vertical',
            }}
          />
          {perfilError && (
            <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.5rem' }}>{perfilError}</p>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button onClick={handleSavePerfil} style={{
              padding: '0.5rem 1.25rem', background: '#10b981', border: 'none',
              borderRadius: '8px', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
            }}>
              💾 Guardar Perfil
            </button>
            <button onClick={() => setShowPerfilEditor(false)} style={{
              padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--glass-border)',
              borderRadius: '8px', color: 'hsl(var(--text-muted))', cursor: 'pointer', fontSize: '0.85rem',
            }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Telegram Config */}
      {showTelegramConfig && (
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 0.75rem', color: '#93c5fd', fontSize: '0.95rem', fontWeight: 700 }}>
            📬 Configuración Telegram
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: '0.35rem' }}>
                Bot Token
              </label>
              <input
                style={inputStyle}
                type="password"
                placeholder="1234567890:ABC..."
                value={telegramCfg.bot_token}
                onChange={e => setTelegramCfg(p => ({ ...p, bot_token: e.target.value }))}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: '0.35rem' }}>
                Chat ID
              </label>
              <input
                style={inputStyle}
                placeholder="-100123456789 o @canal"
                value={telegramCfg.chat_id}
                onChange={e => setTelegramCfg(p => ({ ...p, chat_id: e.target.value }))}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: '0.35rem' }}>
                Score mínimo para notificar
              </label>
              <input
                style={inputStyle}
                type="number"
                min="0" max="100"
                value={telegramCfg.score_minimo}
                onChange={e => setTelegramCfg(p => ({ ...p, score_minimo: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            {[
              { key: 'activo', label: 'Notificaciones activas' },
              { key: 'notificar_nuevas', label: 'Nuevas licitaciones' },
              { key: 'notificar_cambios_estado', label: 'Cambios de estado' },
            ].map(({ key, label }) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={telegramCfg[key as keyof TelegramLicitConfig] as boolean}
                  onChange={e => setTelegramCfg(p => ({ ...p, [key]: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: 'hsl(var(--primary))' }}
                />
                {label}
              </label>
            ))}
          </div>

          {telegramTest && (
            <p style={{
              color: telegramTest.startsWith('✅') ? '#10b981' : '#f87171',
              fontSize: '0.85rem',
              marginTop: '0.5rem',
            }}>
              {telegramTest}
            </p>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={handleSaveTelegramCfg} style={{
              padding: '0.5rem 1.25rem', background: '#10b981', border: 'none',
              borderRadius: '8px', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
            }}>
              💾 Guardar
            </button>
            <button onClick={handleTestTelegram} style={{
              padding: '0.5rem 1.25rem', background: 'rgba(59,130,246,0.2)',
              border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px',
              color: '#60a5fa', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
            }}>
              🔔 Probar conexión
            </button>
          </div>
        </div>
      )}

      {/* Licitaciones list */}
      {licitaciones.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem', color: 'hsl(var(--text-muted))' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🧠</div>
          <p>No hay licitaciones guardadas.</p>
          <p style={{ fontSize: '0.825rem' }}>Ve al Monitor Agente, busca procesos y guárdalos aquí.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
          {licitaciones.map(licit => (
            <div
              key={licit.id}
              onClick={() => setSelectedId(selectedId === licit.id ? null : licit.id)}
              style={{
                ...cardStyle,
                cursor: 'pointer',
                border: selectedId === licit.id
                  ? '1px solid rgba(139,92,246,0.5)'
                  : '1px solid var(--glass-border)',
                transition: 'border-color 0.2s',
              }}
            >
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                {licit.match_score !== undefined ? (
                  <ScoreRing score={licit.match_score} />
                ) : (
                  <div style={{
                    width: 100, height: 100, borderRadius: '50%',
                    border: '10px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', color: 'hsl(var(--text-muted))', textAlign: 'center',
                  }}>
                    Sin<br />analizar
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: 'hsl(var(--text-main))' }}>
                    {licit.entidad_nombre}
                  </p>
                  <p style={{
                    margin: '0.25rem 0', fontSize: '0.75rem', color: 'hsl(var(--text-muted))',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {licit.descripcion}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>
                    {licit.modalidad} · {licit.departamento}
                  </p>
                </div>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); handleAnalizar(licit); }}
                disabled={analyzing === licit.id}
                style={{
                  width: '100%',
                  padding: '0.4rem',
                  background: analyzing === licit.id ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.15)',
                  border: '1px solid rgba(139,92,246,0.3)',
                  borderRadius: '6px',
                  color: '#a78bfa',
                  fontWeight: 700,
                  cursor: analyzing === licit.id ? 'not-allowed' : 'pointer',
                  fontSize: '0.78rem',
                }}
              >
                {analyzing === licit.id ? '⏳ Analizando con Claude...' : '🔄 Re-analizar'}
              </button>

              {/* Expanded match result */}
              {selectedId === licit.id && licit.match_result && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                  <p style={{ margin: '0 0 0.75rem', fontSize: '0.825rem', color: 'hsl(var(--text-main))', lineHeight: 1.5 }}>
                    {licit.match_result.justificacion}
                  </p>

                  {licit.match_result.fortalezas.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <p style={{ margin: '0 0 0.35rem', fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>
                        ✅ Fortalezas
                      </p>
                      {licit.match_result.fortalezas.map((f, i) => (
                        <p key={i} style={{ margin: '0 0 0.2rem', fontSize: '0.78rem', color: 'hsl(var(--text-main))', paddingLeft: '0.75rem' }}>
                          • {f}
                        </p>
                      ))}
                    </div>
                  )}

                  {licit.match_result.debilidades.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <p style={{ margin: '0 0 0.35rem', fontSize: '0.75rem', fontWeight: 700, color: '#f87171' }}>
                        ⚠️ Puntos débiles
                      </p>
                      {licit.match_result.debilidades.map((d, i) => (
                        <p key={i} style={{ margin: '0 0 0.2rem', fontSize: '0.78rem', color: 'hsl(var(--text-main))', paddingLeft: '0.75rem' }}>
                          • {d}
                        </p>
                      ))}
                    </div>
                  )}

                  {licit.match_result.recomendaciones.length > 0 && (
                    <div>
                      <p style={{ margin: '0 0 0.35rem', fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24' }}>
                        💡 Recomendaciones
                      </p>
                      {licit.match_result.recomendaciones.map((r, i) => (
                        <p key={i} style={{ margin: '0 0 0.2rem', fontSize: '0.78rem', color: 'hsl(var(--text-main))', paddingLeft: '0.75rem' }}>
                          • {r}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
