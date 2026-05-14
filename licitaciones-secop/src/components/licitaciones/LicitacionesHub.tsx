import { useState } from 'react';
import { MonitorAgente }   from './MonitorAgente';
import { MatchScoreIA }    from './MatchScoreIA';
import { DocumentosBase }  from './DocumentosBase';
import { HitosProceso }    from './HitosProceso';
import { HistorialEntidad }from './HistorialEntidad';
import { RupManager }      from './RupManager';

type SubTab = 'monitor' | 'match' | 'documentos' | 'hitos' | 'historial' | 'rup';

const TABS: { id: SubTab; label: string; icon: string; color: string }[] = [
  { id: 'monitor',    label: 'Monitor Agente',   icon: '🔍', color: '#3b82f6' },
  { id: 'match',      label: 'Match IA',          icon: '🧠', color: '#8b5cf6' },
  { id: 'documentos', label: 'Documentos Base',   icon: '📄', color: '#10b981' },
  { id: 'hitos',      label: 'Hitos del Proceso', icon: '📅', color: '#f59e0b' },
  { id: 'historial',  label: 'Historial Entidad', icon: '🏛️', color: '#ef4444' },
  { id: 'rup',        label: 'RUP / Experiencia', icon: '📂', color: '#06b6d4' },
];

export function LicitacionesHub() {
  const [activeTab, setActiveTab] = useState<SubTab>('monitor');
  const active = TABS.find(t => t.id === activeTab)!;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Tab navigation */}
      <div style={{
        background: 'var(--glass)',
        border: '1px solid var(--glass-border)',
        borderRadius: '14px',
        padding: '1rem 1.25rem',
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.5rem 1rem',
                border: `1px solid ${activeTab === tab.id ? tab.color : 'var(--glass-border)'}`,
                borderRadius: '8px',
                background: activeTab === tab.id ? `${tab.color}22` : 'transparent',
                color: activeTab === tab.id ? tab.color : 'hsl(var(--text-muted))',
                cursor: 'pointer',
                fontSize: '0.825rem',
                fontWeight: activeTab === tab.id ? 700 : 500,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: 'none',
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
        borderLeft: `3px solid ${active.color}`,
        paddingLeft: '0.75rem',
      }}>
        <span style={{ fontSize: '1.1rem' }}>{active.icon}</span>
        <span style={{ color: active.color, fontWeight: 700, fontSize: '1rem' }}>{active.label}</span>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'monitor'    && <MonitorAgente />}
        {activeTab === 'match'      && <MatchScoreIA />}
        {activeTab === 'documentos' && <DocumentosBase />}
        {activeTab === 'hitos'      && <HitosProceso />}
        {activeTab === 'historial'  && <HistorialEntidad />}
        {activeTab === 'rup'        && <RupManager />}
      </div>
    </div>
  );
}
