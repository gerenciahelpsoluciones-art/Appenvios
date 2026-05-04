import { useState, useEffect } from 'react';
import { 
  getAuthorizedUsers, 
  authorizeUser, 
  deauthorizeUser, 
  getInboundMessages, 
  subscribeToInboundMessages,
  TelegramAuth,
  TelegramInbound
} from '../../services/telegramService';

export function TelegramManager() {
  const [users, setUsers] = useState<TelegramAuth[]>([]);
  const [messages, setMessages] = useState<TelegramInbound[]>([]);
  const [loading, setLoading] = useState(true);
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadData();
    const sub = subscribeToInboundMessages((newMsg) => {
      setMessages(prev => [newMsg, ...prev].slice(0, 20));
    });
    return () => { supabase.removeChannel(sub); };
  }, []);

  const loadData = async () => {
    const [u, m] = await Promise.all([
      getAuthorizedUsers(),
      getInboundMessages()
    ]);
    setUsers(u);
    setMessages(m);
    setLoading(false);
  };

  const handleAddUser = async () => {
    if (!newId) return;
    const ok = await authorizeUser({
      telegram_id: parseInt(newId),
      full_name: newName || 'Usuario Manual',
      is_admin: false
    });
    if (ok) {
      setNewId('');
      setNewName('');
      loadData();
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('¿Revocar acceso a este usuario?')) {
      await deauthorizeUser(id);
      loadData();
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando consola de Telegram...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
        
        {/* Columna Izquierda: Usuarios Autorizados */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>
            USUARIOS AUTORIZADOS
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {users.map(user => (
              <div key={user.id} style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user.full_name || user.username}</div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>ID: {user.telegram_id}</div>
                </div>
                <button 
                  onClick={() => handleDeleteUser(user.id)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div style={{ padding: '1rem', background: 'rgba(var(--primary-rgb),0.05)', borderRadius: '8px', border: '1px dashed hsl(var(--primary))' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'hsl(var(--primary))' }}>AUTORIZAR NUEVO</div>
            <input 
              type="number" placeholder="Telegram ID (ej: 123456)" 
              value={newId} onChange={e => setNewId(e.target.value)}
              style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'black', color: 'white' }}
            />
            <input 
              type="text" placeholder="Nombre (opcional)" 
              value={newName} onChange={e => setNewName(e.target.value)}
              style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'black', color: 'white' }}
            />
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleAddUser}>+ Autorizar</button>
          </div>
        </div>

        {/* Columna Derecha: Monitor en Tiempo Real */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>
            MONITOR DE ENTRADA (INBOUND)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'hsl(var(--text-muted))', padding: '2rem' }}>
                Esperando mensajes de Telegram...
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} style={{ 
                  padding: '0.75rem', borderRadius: '6px', background: 'rgba(255,255,255,0.02)',
                  borderLeft: `3px solid ${msg.status === 'done' ? '#10b981' : '#f59e0b'}`,
                  fontSize: '0.8rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700 }}>ID: {msg.telegram_id}</span>
                    <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.7rem' }}>
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div style={{ color: 'hsl(var(--text-primary))', fontStyle: 'italic', marginBottom: '0.4rem' }}>
                    "{msg.raw_message?.message?.text || 'Mensaje multimedia'}"
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ 
                      fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px',
                      background: msg.status === 'done' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                      color: msg.status === 'done' ? '#10b981' : '#f59e0b'
                    }}>
                      {msg.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      <div className="glass-card" style={{ background: 'rgba(var(--primary-rgb),0.03)' }}>
        <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', margin: 0 }}>
          <strong>Nota de Arquitectura:</strong> Este monitor recibe datos desde la Edge Function de Supabase. 
          n8n procesa estos mensajes localmente y actualiza el estado a <code>done</code> una vez creada la cotización.
        </p>
      </div>

    </div>
  );
}

// Mock de Supabase para evitar errores si no está importado globalmente
import { supabase } from '../../services/supabase';
