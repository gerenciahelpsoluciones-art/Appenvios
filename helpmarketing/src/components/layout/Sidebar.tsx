import type { Tab } from '../../App';

const Icon = ({ name }: { name: string }) => {
  const icons: Record<string, React.ReactNode> = {
    dashboard: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
    agent: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
      </svg>
    ),
    log: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    studio: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L4 2l3.5 12.5L13 18l5-5z"/>
        <path d="M2 22l5-5"/><path d="M8 14l-4 4"/>
      </svg>
    ),
    calendar: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    social: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
    ),
    article: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
    seo: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    keyword: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    vitals: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
    leads: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    trends: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
        <polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
    competitors: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/>
        <path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        <path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/>
        <path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/>
        <path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"/>
        <path d="M15.5 9H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/>
        <path d="M10 9.5c0 .83-.67 1.5-1.5 1.5h-5C2.67 11 2 10.33 2 9.5S2.67 8 3.5 8h5c.83 0 1.5.67 1.5 1.5z"/>
        <path d="M8.5 15H10v-1.5c0-.83-.67-1.5-1.5-1.5S7 12.67 7 13.5s.67 1.5 1.5 1.5z"/>
      </svg>
    ),
    gmb: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    visitors: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    rental: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    remission: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
      </svg>
    ),
  };
  return <>{icons[name] ?? null}</>;
};

interface SidebarProps {
  activeTab: Tab;
  onNavigate: (tab: Tab) => void;
}

export function Sidebar({ activeTab, onNavigate }: SidebarProps) {
  const navItem = (tab: Tab, icon: string, label: string, highlight?: string) => (
    <div
      className={`nav-item ${activeTab === tab ? 'active' : ''}`}
      onClick={() => onNavigate(tab)}
    >
      <Icon name={icon} />
      <span style={highlight ? { color: highlight, fontWeight: 'bold' } : undefined}>
        {label}
      </span>
    </div>
  );

  const sectionDivider = (label: string) => (
    <>
      <div style={{ margin: '1.5rem 0 0.5rem', height: '1px', background: 'var(--glass-border)' }} />
      <small style={{ color: 'hsl(var(--text-muted))', fontWeight: 'bold', marginLeft: '1rem', fontSize: '0.7rem', letterSpacing: '0.08em' }}>
        {label}
      </small>
    </>
  );

  return (
    <aside className="sidebar">
      <div className="logo-section">
        <div style={{ padding: '8px', background: 'hsl(var(--primary))', borderRadius: '8px' }}>🚀</div>
        <span>HelpMarketer</span>
      </div>

      <nav className="nav-links">
        <small style={{ color: 'hsl(var(--text-muted))', fontWeight: 'bold', marginLeft: '1rem', fontSize: '0.7rem', letterSpacing: '0.08em' }}>
          AGENTE
        </small>
        {navItem('dashboard',  'dashboard',   'Command Center')}
        {navItem('agent',      'agent',       'Controlador', 'hsl(var(--primary))')}
        {navItem('agentlog',   'log',         'Registro del Agente')}

        {sectionDivider('CONTENIDO & SOCIAL')}
        {navItem('studio',          'studio',   'Creative Studio', 'hsl(var(--primary))')}
        {navItem('social',          'social',   'Social Hub')}
        {navItem('social-calendar', 'calendar', 'Calendario')}
        {navItem('social-connect',  'social',   'Conectar RRSS')}
        {navItem('factory',         'article',  'Article Factory')}

        {sectionDivider('SEO & WEB')}
        {navItem('seo',        'seo',         'SEO Audit')}
        {navItem('keywords',   'keyword',     'Keyword Tracker')}
        {navItem('vitals',     'vitals',      'Web Vitals')}
        {navItem('visitors',   'visitors',    'Visitantes En Vivo', 'hsl(var(--success))')}

        {sectionDivider('INTELIGENCIA')}
        {navItem('leads',      'leads',       'Lead Hunter')}
        {navItem('trends',     'trends',      'Market Trends')}
        {navItem('competitors','competitors', 'Competidores')}

        {sectionDivider('HERRAMIENTAS')}
        {navItem('gmb',        'gmb',         'Google Business')}
        {navItem('rental',     'rental',      'Rent ROI')}

        {sectionDivider('VENTAS & CRM')}
        {navItem('remisiones', 'remission',   'Remisiones', 'hsl(var(--success))')}
      </nav>
    </aside>
  );
}
