import React, { useState } from 'react';
import { generateContent } from '../services/gemini';
import { type Producto } from '../types/crm';

interface IProps {
    onRestore: (products: Partial<Producto>[]) => void;
    onClose: () => void;
}

const RecoveryAssistant: React.FC<IProps> = ({ onRestore, onClose }) => {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<Partial<Producto>[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!text.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const prompt = `Extrae una lista de productos en formato JSON desde este texto de cotización/factura.
            Para cada producto busca: nombre, precioVenta (como número), costoUnitario (como número), unidad (ej: Und, Par, Lote), minStock (como número).
            Texto: ${text}`;
            
            const response = await generateContent(prompt);
            const jsonStr = response.replace(/```json|```/g, '').trim();
            const data = JSON.parse(jsonStr);
            setResults(Array.isArray(data) ? data : [data]);
        } catch (err: any) {
            setError('Error analizando el texto: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="recovery-overlay animate-fade-in" style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(15, 23, 42, 0.9)', zIndex: 1000, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '2rem'
        }}>
            <div className="recovery-modal" style={{
                background: 'white', width: '100%', maxWidth: '800px', borderRadius: '16px',
                padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0 }}>🧠 Asistente de Recuperación Inteligente (V2.0)</h2>
                    <button className="btn-close" onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                </div>

                {!results ? (
                    <>
                        <p style={{ color: '#64748b', marginBottom: '1rem' }}>
                            Pega el texto de tu cotización o factura PDF aquí para que la IA extraiga los productos automáticamente. 💎✨
                        </p>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Ej: STARNET TECH SAS... Producto: Disco Duro... Precio: 250.000..."
                            style={{ width: '100%', height: '200px', padding: '1rem', borderRadius: '8px', border: '2px solid #e2e8f0', marginBottom: '1rem' }}
                        />
                        <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading || !text.trim()} style={{ width: '100%', padding: '1rem' }}>
                            {loading ? '🤖 Analizando con IA...' : '🚀 Analizar Texto'}
                        </button>
                    </>
                ) : (
                    <>
                        <h3 style={{ color: '#059669' }}>🛒 Resultados Encontrados ({results.length})</h3>
                        <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f8fafc' }}>
                                    <tr><th style={{ textAlign: 'left', padding: '0.5rem' }}>Nombre</th><th style={{ textAlign: 'right', padding: '0.5rem' }}>Venta</th><th style={{ textAlign: 'right', padding: '0.5rem' }}>Costo</th></tr>
                                </thead>
                                <tbody>
                                    {results.map((r, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                            <td style={{ padding: '0.5rem' }}>{r.nombre}</td>
                                            <td style={{ padding: '0.5rem', textAlign: 'right' }}>${r.precioVenta?.toLocaleString()}</td>
                                            <td style={{ padding: '0.5rem', textAlign: 'right' }}>${r.costoUnitario?.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-outline" onClick={() => setResults(null)} style={{ flex: 1 }}>Reintentar</button>
                            <button className="btn btn-primary" onClick={() => { onRestore(results); onClose(); }} style={{ flex: 2 }}>📦 Integrar al Catálogo</button>
                        </div>
                    </>
                )}
                {error && <div style={{ color: '#ef4444', marginTop: '1rem' }}>{error}</div>}
            </div>
        </div>
    );
};

export default RecoveryAssistant;
