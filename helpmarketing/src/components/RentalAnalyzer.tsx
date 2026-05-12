import { useState } from 'react';
import { analyzeRentalService } from '../services/geminiService';

interface RentalResult {
  suggestedPrice: string;
  marketVibe: string;
  sellingPoints: string[];
  strategy: string;
  targetClients: string[];
  competitiveAdvantage: string;
}

export const RentalAnalyzer = () => {
  const [equipment, setEquipment] = useState('Laptops Corporativas i5/16GB RAM');
  const [quantity, setQuantity] = useState(10);
  const [duration, setDuration] = useState(12);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<RentalResult | null>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!equipment.trim()) return;
    setIsAnalyzing(true);
    setError('');
    try {
      const data = await analyzeRentalService(equipment, quantity, duration);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error en el análisis. Intenta de nuevo.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h1>Rental Services Analyzer</h1>
      <p style={{ color: 'hsl(var(--text-muted))', marginBottom: '2.5rem' }}>
        Estructura modelos de renta rentables para tu flota de equipos en el mercado colombiano.
      </p>

      <div className="glass-card" style={{ marginBottom: '2.5rem', textAlign: 'left' }}>
        <h3 style={{ marginTop: 0 }}>Configurar análisis de renta</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))', fontWeight: '700', textTransform: 'uppercase' }}>Tipo de equipo</label>
            <input
              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', padding: '0.85rem', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '12px', marginTop: '0.5rem', boxSizing: 'border-box', outline: 'none' }}
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="ej: Laptop i7, Servidor, Switch..."
              onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
              onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))', fontWeight: '700', textTransform: 'uppercase' }}>Cantidad de unidades</label>
            <input
              type="number"
              min={1}
              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', padding: '0.85rem', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '12px', marginTop: '0.5rem', boxSizing: 'border-box', outline: 'none' }}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
              onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))', fontWeight: '700', textTransform: 'uppercase' }}>Duración (meses)</label>
            <input
              type="number"
              min={1}
              max={60}
              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', padding: '0.85rem', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '12px', marginTop: '0.5rem', boxSizing: 'border-box', outline: 'none' }}
              value={duration}
              onChange={(e) => setDuration(Math.max(1, Number(e.target.value)))}
              onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
              onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
            />
          </div>
        </div>
        <button onClick={handleAnalyze} disabled={isAnalyzing} style={{ width: '100%' }}>
          {isAnalyzing ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
              <svg aria-hidden="true" className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              Analizando mercado con IA...
            </span>
          ) : 'Analizar Rentabilidad y Estrategia'}
        </button>
        {error && <div style={{ marginTop: '1rem', color: 'hsl(0 80% 70%)', fontSize: '0.9rem' }}>{error}</div>}
      </div>

      {result && (
        <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div className="glass-card" style={{ background: 'linear-gradient(135deg, hsla(var(--primary), 0.1), transparent)', textAlign: 'left' }}>
            <h4 style={{ marginTop: 0, fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--text-muted))' }}>Precio sugerido</h4>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'hsl(var(--primary))', margin: '0.5rem 0', lineHeight: '1.2' }}>{result.suggestedPrice}</div>
            <div style={{ fontSize: '0.82rem', color: 'hsl(var(--text-muted))', marginBottom: '1rem' }}>por unidad · {quantity} equipos · {duration} meses</div>
            <div style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem', borderRadius: '20px', background: 'hsla(var(--success), 0.12)', color: 'hsl(var(--success))', display: 'inline-block' }}>{result.marketVibe}</div>
          </div>

          <div className="glass-card" style={{ textAlign: 'left' }}>
            <h4 style={{ marginTop: 0, fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--text-muted))' }}>Argumentos comerciales</h4>
            <ul style={{ padding: 0, margin: '1rem 0 0 0', fontSize: '0.92rem', lineHeight: '1.9', listStyle: 'none' }}>
              {result.sellingPoints.map((p, i) => (
                <li key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'hsl(var(--primary))' }}>▸</span> {p}
                </li>
              ))}
            </ul>
          </div>

          {result.targetClients?.length > 0 && (
            <div className="glass-card" style={{ textAlign: 'left' }}>
              <h4 style={{ marginTop: 0, fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--text-muted))' }}>Clientes objetivo</h4>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                {result.targetClients.map((c, i) => (
                  <span key={i} style={{ fontSize: '0.82rem', padding: '0.3rem 0.8rem', borderRadius: '20px', background: 'hsla(var(--accent), 0.12)', color: 'hsl(var(--accent))' }}>{c}</span>
                ))}
              </div>
            </div>
          )}

          {result.competitiveAdvantage && (
            <div className="glass-card" style={{ textAlign: 'left', borderLeft: '4px solid hsl(var(--accent))' }}>
              <h4 style={{ marginTop: 0, fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--accent))' }}>Ventaja competitiva</h4>
              <p style={{ fontSize: '0.95rem', lineHeight: '1.6', margin: '0.75rem 0 0 0', fontStyle: 'italic', color: '#fff' }}>"{result.competitiveAdvantage}"</p>
            </div>
          )}

          <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'left' }}>
            <h4 style={{ marginTop: 0, color: 'hsl(var(--accent))', fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase' }}>Estrategia recomendada</h4>
            <p style={{ fontStyle: 'italic', lineHeight: '1.7', fontSize: '1rem', marginTop: '0.75rem', color: 'hsl(var(--text-main))' }}>"{result.strategy}"</p>
          </div>
        </div>
      )}
    </div>
  );
};
