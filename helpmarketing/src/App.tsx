import { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar }  from './components/layout/TopBar';

// Módulos existentes
import { CreativeStudio }         from './components/CreativeStudio';
import { SeoOptimizer }           from './components/SeoOptimizer';
import { LeadHunter }             from './components/LeadHunter';
import { CompetitorTracker }      from './components/CompetitorTracker';
import { GoogleBusinessOptimizer }from './components/GoogleBusinessOptimizer';
import { RentalAnalyzer }         from './components/RentalAnalyzer';
import { TrendIntel }             from './components/TrendIntel';
import { ArticleFactory }         from './components/ArticleFactory';
import { VisitorAnalytics }       from './components/VisitorAnalytics';
import { Remissions }             from './components/Remissions';

// Módulos nuevos (Fase 1)
import { CommandCenter }          from './components/dashboard/CommandCenter';

// Módulos nuevos (Fase 4)
import { AgentController }        from './components/agent/AgentController';
import { AgentLog }               from './components/agent/AgentLog';

// Módulos nuevos (Fase 2)
import { WebVitals }              from './components/seo/WebVitals';
import { KeywordTracker }         from './components/seo/KeywordTracker';

// Módulos nuevos (Fase 3)
import { SocialHub }              from './components/social/SocialHub';
import { PostScheduler }          from './components/social/PostScheduler';
import { SocialConnector }        from './components/social/SocialConnector';
import { CommunityHub }           from './components/CommunityHub';

// Módulo Licitaciones
import { LicitacionesHub }        from './components/licitaciones/LicitacionesHub';

export type Tab =
  // Agente
  | 'dashboard' | 'agent' | 'agentlog'
  // Contenido & Social
  | 'studio' | 'social' | 'social-calendar' | 'social-connect' | 'factory' | 'community'
  // SEO & Web
  | 'seo' | 'keywords' | 'vitals' | 'visitors'
  // Inteligencia
  | 'leads' | 'trends' | 'competitors'
  // Herramientas
  | 'gmb' | 'rental'
  // Ventas & CRM
  | 'remisiones'
  // Licitaciones
  | 'licitaciones';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      // ── Agente ──────────────────────────────────────────────────
      case 'dashboard':  return <CommandCenter onNavigate={setActiveTab} />;
      case 'agent':      return <AgentController />;
      case 'agentlog':   return <AgentLog />;

      // ── Contenido & Social ───────────────────────────────────────
      case 'studio':          return <CreativeStudio />;
      case 'social':          return <SocialHub />;
      case 'social-calendar': return <PostScheduler />;
      case 'social-connect':  return <SocialConnector />;
      case 'community':       return <CommunityHub />;
      case 'factory':         return <ArticleFactory />;

      // ── SEO & Web ────────────────────────────────────────────────
      case 'seo':        return <SeoOptimizer />;
      case 'keywords':   return <KeywordTracker />;
      case 'vitals':     return <WebVitals />;
      case 'visitors':   return <VisitorAnalytics />;

      // ── Inteligencia ─────────────────────────────────────────────
      case 'leads':      return <LeadHunter />;
      case 'trends':     return <TrendIntel />;
      case 'competitors':return <CompetitorTracker />;

      // ── Herramientas ─────────────────────────────────────────────
      case 'gmb':        return <GoogleBusinessOptimizer />;
      case 'rental':     return <RentalAnalyzer />;

      // ── Ventas & CRM ─────────────────────────────────────────────
      case 'remisiones': return <Remissions />;

      // ── Licitaciones ─────────────────────────────────────────────
      case 'licitaciones': return <LicitacionesHub />;

      default:           return null;
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar activeTab={activeTab} onNavigate={setActiveTab} />

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <TopBar />
        <main className="main-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
