import { useState } from 'react';
import { MonitorAgente } from './MonitorAgente';
import { MatchScoreIA } from './MatchScoreIA';
import { DocumentosBase } from './DocumentosBase';
import { HitosProceso } from './HitosProceso';
import { HistorialEntidad } from './HistorialEntidad';

type SubTab = 'monitor' | 'match' | 'documentos' | 'hitos' | 'historial';

const TABS: { id: SubTab; label: string; icon: string; color: string }[] = [
  { id: 'monitor',    label: 'Monitor Agente',   icon: '🔍', color: '#3b82f6' },
  { id: 'match',      label: 'Match IA',          icon: '🧠', color: '#8b5cf6' },
  { id: 'documentos', label: 'Documentos Base',   icon: '📄', color: '#10b981' },
  { id: 'hitos',      label: 'Hitos del Proceso', icon: '📅', color: '#f59e0b' },
  { id: 'historial',  label: 'Historial Entidad', icon: '🏛️', color: '#ef4444' },
];

export function LicitacionesHub() {
  const [activeTab, setActiveTab] = useState<SubTab>('monitor');

  const active = TABS.find(t => t.id === activeTab)!;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
      {/* Header */}
      <div style={{
        background: 'var(--glass)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'hsl(var(--text-main))' }}>
              🏗️ Licitaciones Intelligence
            </h1>
            <p style={{ margin: '0.25rem 0 0', color: 'hsl(var(--text-muted))', fontSize: '0.875rem' }}>
              Monitor inteligente de contratación pública SECOP · Colombia
            </p>
          </div>
          <div style={{
            padding: '0.5rem 1rem',
            background: 'hsla(217, 91%, 60%, 0.15)',
            border: '1px solid hsla(217, 91%, 60%, 0.3)',
            borderRadius: '20px',
            fontSize: '0.75rem',
            color: 'hsl(var(--primary))',
            fontWeight: 600,
          }}>
            SECOP I + II
          </div>
        </div>

        {/* Sub-tab navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.5rem 1rem',
                border: `1px solid ${activeTab === tab.id ? tab.color : 'var(--glass-border)'}`,
                borderRadius: '8px',
                background: activeTab === tab.id
                  ? `${tab.color}22`
                  : 'transparent',
                color: activeTab === tab.id ? tab.color : 'hsl(var(--text-muted))',
                cursor: 'pointer',
                fontSize: '0.825rem',
                fontWeight: activeTab === tab.id ? 700 : 500,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active section indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0',
        borderLeft: `3px solid ${active.color}`,
        paddingLeft: '0.75rem',
      }}>
        <span style={{ fontSize: '1.1rem' }}>{active.icon}</span>
        <span style={{ color: active.color, fontWeight: 700, fontSize: '1rem' }}>{active.label}</span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {activeTab === 'monitor'    && <MonitorAgente />}
        {activeTab === 'match'      && <MatchScoreIA />}
        {activeTab === 'documentos' && <DocumentosBase />}
        {activeTab === 'hitos'      && <HitosProceso />}
        {activeTab === 'historial'  && <HistorialEntidad />}
      </div>
    </div>
  );
}
