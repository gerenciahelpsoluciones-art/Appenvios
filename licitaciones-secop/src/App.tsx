import { LicitacionesHub } from './components/licitaciones/LicitacionesHub';

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-brand">
          <div className="header-brand-icon">🏗️</div>
          <div>
            <div className="header-brand-title">Licitaciones SECOP</div>
            <div className="header-brand-sub">Help Soluciones Informáticas</div>
          </div>
        </div>

        <div className="header-meta">
          <span className="header-badge">SECOP I + II</span>
          <div className="header-status">
            <span className="header-status-dot" />
            Colombia · Contratación Pública
          </div>
        </div>
      </header>

      <main className="app-main">
        <LicitacionesHub />
      </main>
    </div>
  );
}

export default App;
