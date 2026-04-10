import { useState } from 'react';
import { analyzeRentalService } from '../services/geminiService';

interface RentalResult {
    suggestedPrice: string;
    marketVibe: string;
    sellingPoints: string[];
    strategy: string;
}

export const RentalAnalyzer = () => {
    const [equipment, setEquipment] = useState('Laptops Corporativas i5/16GB');
    const [quantity, setQuantity] = useState(10);
    const [duration, setDuration] = useState(12);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<RentalResult | null>(null);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            const data = await analyzeRentalService(equipment, quantity, duration);
            setResult(data);
        } catch (err) {
            alert("Error en el análisis. Intenta de nuevo.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <h1>Rental Services Analyzer</h1>
            <p style={{ color: 'hsl(var(--text-muted))', marginBottom: '2.5rem' }}>Structure profitable leasing models for your equipment fleet.</p>

            <div className="glass-card" style={{ marginBottom: '2.5rem', textAlign: 'left' }}>
                <h3 style={{ marginTop: 0 }}>Configure Rental Option</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div>
                        <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontWeight: '600' }}>Equipment Type</label>
                        <input
                            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', padding: '0.8rem', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '12px', marginTop: '0.5rem' }}
                            value={equipment}
                            onChange={(e) => setEquipment(e.target.value)}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontWeight: '600' }}>Quantity</label>
                        <input
                            type="number"
                            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', padding: '0.8rem', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '12px', marginTop: '0.5rem' }}
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontWeight: '600' }}>Duration (Months)</label>
                        <input
                            type="number"
                            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', padding: '0.8rem', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '12px', marginTop: '0.5rem' }}
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                        />
                    </div>
                </div>
                <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    style={{ width: '100%' }}
                >
                    {isAnalyzing ? 'Crunching Numbers with AI...' : 'Analyze Profitability & Strategy'}
                </button>
            </div>

            {result && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    <div className="glass-card" style={{ background: 'linear-gradient(135deg, hsla(var(--primary), 0.1), hsla(var(--background), 0))', textAlign: 'left' }}>
                        <h4 style={{ marginTop: 0, fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--text-muted))' }}>💰 Suggested Price</h4>
                        <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'hsl(var(--primary))', margin: '0.5rem 0' }}>{result.suggestedPrice}</div>
                        <div style={{ fontSize: '0.9rem', color: 'hsl(var(--text-muted))' }}>per unit / month</div>
                        <div style={{ marginTop: '1.2rem' }}>
                            <span className="badge badge-success">{result.marketVibe} Market Fit</span>
                        </div>
                    </div>

                    <div className="glass-card" style={{ textAlign: 'left' }}>
                        <h4 style={{ marginTop: 0, fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--text-muted))' }}>🛡️ Commercial Selling Points</h4>
                        <ul style={{ padding: 0, margin: '1rem 0 0 0', fontSize: '0.95rem', lineHeight: '1.8', listStyle: 'none' }}>
                            {result.sellingPoints.map((p, i) => (
                                <li key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <span style={{ color: 'hsl(var(--primary))' }}>•</span> {p}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="glass-card" style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem', textAlign: 'left' }}>
                        <h4 style={{ marginTop: 0, color: 'hsl(var(--accent))', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase' }}>🚀 Agent Strategy Note</h4>
                        <p style={{ fontStyle: 'italic', lineHeight: '1.7', fontSize: '1.05rem', marginTop: '1rem', color: 'hsl(var(--text-main))' }}>"{result.strategy}"</p>
                    </div>
                </div>
            )}
        </div>
    );
};
