import { useEffect, useState } from 'react';
import { getSocialConnections, saveSocialConnection, type SocialConnection } from '../../services/socialApiService';
import type { SocialPlatform } from '../../types/social.types';

// ─── Metadata de plataformas ─────────────────────────────────────────────────

const PLATFORM_INFO: Record<SocialPlatform, {
  label: string; color: string; icon: string;
  cost: string; authType: string; docsUrl: string; fields: string[];
}> = {
  linkedin: {
    label: 'LinkedIn', color: '#0077b5', icon: 'in',
    cost: 'Gratis',
    authType: 'OAuth 2.0 — LinkedIn Developer App',
    docsUrl: 'https://developer.linkedin.com/products/marketing/content-api',
    fields: ['Page ID (ID de la página de empresa)', 'Access Token (token de organización)'],
  },
  instagram: {
    label: 'Instagram', color: '#e1306c', icon: '📸',
    cost: 'Gratis',
    authType: 'Meta Graph API — requiere cuenta Business/Creator',
    docsUrl: 'https://developers.facebook.com/docs/instagram-api',
    fields: ['Instagram Business Account ID', 'Meta Page Access Token'],
  },
  facebook: {
    label: 'Facebook', color: '#1877f2', icon: '𝑓',
    cost: 'Gratis',
    authType: 'Meta Graph API — permiso pages_manage_posts',
    docsUrl: 'https://developers.facebook.com/docs/pages-api',
    fields: ['Facebook Page ID', 'Page Access Token (de larga duración)'],
  },
  twitter: {
    label: 'X / Twitter', color: '#14171a', icon: '𝕏',
    cost: '$100/mes (Basic API) · o Buffer $6/mes',
    authType: 'X API v2 Bearer Token — o via Buffer',
    docsUrl: 'https://developer.twitter.com/en/docs/twitter-api',
    fields: ['Bearer Token', 'API Key', 'API Secret', 'Access Token', 'Access Secret'],
  },
  tiktok: {
    label: 'TikTok', color: '#ff0050', icon: '♪',
    cost: 'Gratis (cuenta Business)',
    authType: 'TikTok for Business API',
    docsUrl: 'https://developers.tiktok.com/doc/content-posting-api-get-started',
    fields: ['Client Key', 'Access Token'],
  },
};

// ─── Tarjeta por plataforma ──────────────────────────────────────────────────

const ConnectorCard = ({
  connection, onSave,
}: {
  connection: SocialConnection;
  onSave: (updated: SocialConnection) => void;
}) => {
  const info      = PLATFORM_INFO[connection.platform];
  const [expanded, setExpanded] = useState(false);
  const [fields,   setFields]   = useState({ field1: '', field2: '', field3: '', field4: '', field5: '' });
  const [saving,   setSaving]   = useState(false);
  const [localConn, setLocalConn] = useState(connection);

  const handleSave = async () => {
    setSaving(true);
    const updated: SocialConnection = {
      ...localConn,
      connected: true,
      account_name: fields.field1 || localConn.account_name,
      token_hint: fields.field2 ? `...${fields.field2.slice(-4)}` : localConn.token_hint,
    };
    await onSave(updated);
    setLocalConn(updated);
    setExpanded(false);
    setSaving(false);
  };

  const handleDisconnect = async () => {
    const updated: SocialConnection = { ...localConn, connected: false, account_name: undefined, token_hint: undefined };
    await onSave(updated);
    setLocalConn(updated);
  };

  return (
    <div className="glass-card" style={{ borderLeft: `3px solid ${localConn.connected ? info.color : 'var(--glass-border)'}` }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '10px', flexShrink: 0,
          background: `${info.color}22`, color: info.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: '1.1rem',
        }}>
          {info.icon}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700 }}>{info.label}</p>
          {localConn.connected && localConn.account_name && (
            <p style={{ margin: 0, fontSize: '0.78rem', opacity: 0.6 }}>{localConn.account_name}</p>
          )}
          {!localConn.connected && (
            <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.5 }}>No conectado</p>
          )}
        </div>

        {/* Estado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: localConn.connected ? 'hsl(var(--success))' : 'hsl(var(--text-muted))',
            display: 'inline-block',
            boxShadow: localConn.connected ? '0 0 6px hsl(var(--success))' : 'none',
          }} />
          <span style={{ fontSize: '0.78rem', color: localConn.connected ? 'hsl(var(--success))' : 'hsl(var(--text-muted))' }}>
            {localConn.connected ? 'Activo' : 'Inactivo'}
          </span>
        </div>

        {/* Botón configurar / desconectar */}
        {localConn.connected ? (
          <button
            onClick={handleDisconnect}
            style={{
              fontSize: '0.75rem', padding: '0.3rem 0.7rem',
              background: 'rgba(239,68,68,0.1)', color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px',
              boxShadow: 'none',
            }}
          >
            Desconectar
          </button>
        ) : (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}
          >
            {expanded ? 'Cancelar' : 'Configurar'}
          </button>
        )}
      </div>

      {/* Formulario de configuración */}
      {expanded && !localConn.connected && (
        <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem' }}>
          {/* Costo y documentación */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div style={{
              fontSize: '0.75rem', padding: '0.3rem 0.7rem', borderRadius: '6px',
              background: info.cost.startsWith('Gratis') ? 'hsl(var(--success) / 0.12)' : 'rgba(245,158,11,0.12)',
              color: info.cost.startsWith('Gratis') ? 'hsl(var(--success))' : '#f59e0b',
            }}>
              💰 {info.cost}
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
              🔑 {info.authType}
            </div>
          </div>

          {/* Guía paso a paso */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
            border: '1px solid var(--glass-border)', padding: '1rem', marginBottom: '1rem',
            fontSize: '0.82rem',
          }}>
            <p style={{ margin: '0 0 0.5rem', fontWeight: 700, opacity: 0.7 }}>📋 Cómo obtener las credenciales:</p>
            <ol style={{ margin: 0, paddingLeft: '1.2rem', opacity: 0.65, lineHeight: 1.8 }}>
              <li>Crea o accede a tu app en el portal de desarrolladores de {info.label}.</li>
              <li>Configura los permisos necesarios para publicar contenido.</li>
              <li>Genera el Access Token con alcance de escritura.</li>
              <li>Pega los valores en los campos a continuación.</li>
              <li>
                <strong>Importante:</strong> Los tokens también deben configurarse en n8n para la publicación automática.
              </li>
            </ol>
          </div>

          {/* Campos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {info.fields.map((fieldLabel, idx) => {
              const key = `field${idx + 1}` as keyof typeof fields;
              return (
                <div key={fieldLabel}>
                  <label style={{ fontSize: '0.75rem', opacity: 0.6, display: 'block', marginBottom: '0.3rem' }}>
                    {fieldLabel}
                  </label>
                  <input
                    type={fieldLabel.toLowerCase().includes('token') || fieldLabel.toLowerCase().includes('secret') ? 'password' : 'text'}
                    value={fields[key]}
                    onChange={(e) => setFields((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder={`Ingresa tu ${fieldLabel.split('(')[0].trim()}`}
                    style={{
                      width: '100%', background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--glass-border)', borderRadius: '10px',
                      color: 'white', padding: '0.65rem 1rem', fontSize: '0.88rem',
                    }}
                  />
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button onClick={handleSave} disabled={saving || !fields.field1} style={{ flex: 1 }}>
              {saving ? 'Guardando...' : `✓ Conectar ${info.label}`}
            </button>
          </div>

          <p style={{ fontSize: '0.72rem', opacity: 0.4, marginTop: '0.75rem' }}>
            ⚠ Los tokens se guardan en <code>mkt_agent_config</code> de Supabase.
            Nunca los compartas públicamente. Configura también en n8n para la automatización.
          </p>
        </div>
      )}

      {/* Info si ya está conectado */}
      {localConn.connected && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', opacity: 0.5, display: 'flex', gap: '1.5rem' }}>
          {localConn.token_hint && <span>Token: ****{localConn.token_hint}</span>}
          {localConn.configured_at && (
            <span>Configurado: {new Date(localConn.configured_at).toLocaleDateString('es-CO')}</span>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Componente principal ────────────────────────────────────────────────────

export function SocialConnector() {
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    getSocialConnections().then((conns) => {
      setConnections(conns);
      setLoading(false);
    });
  }, []);

  const handleSave = async (updated: SocialConnection) => {
    await saveSocialConnection(updated);
    setConnections((prev) => prev.map((c) => c.platform === updated.platform ? updated : c));
  };

  const connectedCount = connections.filter((c) => c.connected).length;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.3rem' }}>Conectar Redes Sociales</h1>
        <p style={{ color: 'hsl(var(--text-muted))' }}>
          Configura las credenciales de cada plataforma para que el agente pueda publicar automáticamente.
        </p>
      </div>

      {/* Progreso */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: connectedCount > 0 ? 'hsl(var(--success))' : 'hsl(var(--text-muted))' }}>
            {connectedCount}/{connections.length}
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.55 }}>plataformas conectadas</div>
        </div>
        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${(connectedCount / Math.max(connections.length, 1)) * 100}%`,
            background: 'hsl(var(--success))', borderRadius: '3px',
            transition: 'width 0.5s ease-out',
          }} />
        </div>
        <div style={{ fontSize: '0.82rem', opacity: 0.6, maxWidth: 260 }}>
          Cada plataforma conectada permite al agente publicar y recopilar métricas automáticamente.
        </div>
      </div>

      {/* Nota sobre n8n */}
      <div style={{
        background: 'hsl(var(--primary) / 0.08)', border: '1px solid hsl(var(--primary) / 0.2)',
        borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', fontSize: '0.85rem',
      }}>
        <strong>💡 Importante:</strong> Guardar las credenciales aquí las almacena en Supabase para referencia.
        Para la <strong>publicación automática</strong>, debes configurar los mismos tokens en los nodos de n8n
        del workflow <em>Social Media Autonomous Poster</em>.
      </div>

      {loading && <p style={{ opacity: 0.5 }}>Cargando configuración...</p>}

      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {connections.map((conn) => (
            <ConnectorCard key={conn.platform} connection={conn} onSave={handleSave} />
          ))}
        </div>
      )}
    </div>
  );
}
