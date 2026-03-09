import React, { useState } from 'react';

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

interface SiigoProduct {
    id: string;
    code: string;
    description: string;
    price: number;
    cost: number;
    stock: number;
}

// URL directa de la Edge Function de Supabase (hardcoded para máxima confiabilidad)
const SUPABASE_PROJECT_URL = import.meta.env.VITE_SUPABASE_URL || 'https://matyjysinegbibdwzhoq.supabase.co';
const EDGE_FUNCTION_URL = `${SUPABASE_PROJECT_URL}/functions/v1/siigo-proxy`;

const InventarioModule: React.FC = () => {
    const [products, setProducts] = useState<SiigoProduct[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [username, setUsername] = useState(localStorage.getItem('siigo_username') || '');
    const [accessKey, setAccessKey] = useState(localStorage.getItem('siigo_access_key') || '');
    const [token, setToken] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<any>(null);

    const getBaseHeaders = (): Record<string, string> => ({
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    });

    const authenticate = async (): Promise<string | null> => {
        if (!username || !accessKey) {
            setError('Por favor ingrese Usuario y Access Key de Siigo.');
            return null;
        }
        try {
            setLoading(true);
            setError(null);
            console.log('Autenticando vía Supabase Edge Function...');

            const res = await fetch(`${EDGE_FUNCTION_URL}?action=auth`, {
                method: 'POST',
                headers: getBaseHeaders(),
                body: JSON.stringify({ username, access_key: accessKey }),
            });

            const data = await res.json();
            if (!res.ok) {
                const hint = data.hint ? `\n\n💡 ${data.hint}` : '';
                throw new Error(`${data.error || 'Error de autenticación'}.${hint}`);
            }

            console.log('Autenticación exitosa con Siigo.');
            setToken(data.access_token);
            localStorage.setItem('siigo_username', username);
            localStorage.setItem('siigo_access_key', accessKey);
            return data.access_token;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async (accessToken: string) => {
        try {
            setLoading(true);
            setError(null);
            console.log('Obteniendo productos de Siigo...');

            const res = await fetch(`${EDGE_FUNCTION_URL}?action=products`, {
                method: 'GET',
                headers: {
                    ...getBaseHeaders(),
                    'x-siigo-token': accessToken,
                },
            });

            const data = await res.json();
            setDebugInfo(data); // Guardar para diagnóstico

            console.log('Sync Inventario - Metadatos:', {
                resultsLength: data.results?.length,
                total: data.total,
                hasSample: !!data._sample,
                hasDebugRaw: !!data._debug_first_raw
            });

            if (!res.ok) {
                throw new Error(`Error al obtener productos: ${data.error || res.status}`);
            }

            if (!data.results || data.results.length === 0) {
                setProducts([]);
                const now = new Date().toLocaleTimeString();
                setError(`(v3 @ ${now}) La cuenta de Siigo respondió pero no devolvió productos. Revise el panel de depuración abajo.`);
                return;
            }

            // DEBUG: Loguear el primer producto para ver campos reales de Siigo
            if (data.results.length > 0) {
                const raw = data.results[0];
                console.log('=== SIIGO PRODUCTO RAW (primer item) ===');
                console.log('Data:', JSON.stringify(raw, null, 2));
            }

            const mapped: SiigoProduct[] = data.results
                .map((p: any) => {
                    const desc = [
                        p.name,
                        p.description,
                        p.account_group?.name,
                        p.unit_label,
                    ].map(v => (typeof v === 'string' ? v.trim() : '')).find(v => v.length > 0) || '(Sin descripción)';

                    return {
                        id: p.id,
                        code: p.code || '—',
                        description: desc,
                        price: p.prices?.[0]?.price_list?.[0]?.value ?? 0,
                        cost: Number(p.costs?.[0]?.cost_list?.[0]?.value ?? p.unit_cost ?? 0),
                        stock: Number(p.stock_control ? (p.available_quantity ?? 0) : 0),
                    };
                }).filter((p: SiigoProduct) => p.stock > 0);
            setProducts(mapped);
            console.log(`${mapped.length} productos con stock > 0 cargados.`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        let currentToken = token;
        if (!currentToken) {
            currentToken = await authenticate();
        }
        if (currentToken) {
            await fetchProducts(currentToken);
        }
    };

    const handleDisconnect = () => {
        setToken(null);
        setProducts([]);
        setError(null);
    };

    const filteredProducts = products.filter(p => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = (p.code?.toLowerCase() ?? '').includes(term) ||
            (p.description?.toLowerCase() ?? '').includes(term);
        return matchesSearch && p.stock > 0;
    });

    return (
        <div className="module-container">
            <div className="module-header" style={{ position: 'relative' }}>
                <div>
                    <h2>Inventario Siigo Nube</h2>
                    <span style={{ fontSize: '0.7rem', color: '#10b981', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px', border: '1px solid #10b981' }}>
                        VERSIÓN ACTIVA: v4-SOLO-STOCK
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="search-container" style={{ width: '280px' }}>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Buscar código o descripción..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {token && (
                        <button onClick={handleDisconnect} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', color: '#64748b' }}>
                            🔌 Desconectar
                        </button>
                    )}
                    <button onClick={handleRefresh} disabled={loading} className="btn-primary">
                        {loading ? '⏳ Sincronizando...' : '🔃 Sincronizar'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="card" style={{ borderLeft: '4px solid #ef4444', marginBottom: '1.5rem', background: '#fef2f2', padding: '1rem' }}>
                    <p style={{ color: '#ef4444', fontWeight: '600', margin: 0 }}>⚠️ {error}</p>
                </div>
            )}

            {!token && (
                <div className="card animate-fade-in" style={{ marginBottom: '2rem' }}>
                    <h3>🔗 Conectar con Siigo Nube</h3>
                    <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        La conexión se realiza de forma segura a través del servidor (sin riesgo de bloqueo por firewall o CORS).
                    </p>
                    <div className="form-grid" style={{ marginBottom: '1rem' }}>
                        <div className="form-group">
                            <label>Usuario (Email de Siigo)</label>
                            <input
                                className="input-field"
                                type="email"
                                placeholder="ejemplo@empresa.com"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Access Key (API Key)</label>
                            <input
                                className="input-field"
                                type="password"
                                placeholder="••••••••••••••••••"
                                value={accessKey}
                                onChange={e => setAccessKey(e.target.value)}
                            />
                        </div>
                    </div>
                    <button onClick={handleRefresh} className="btn-success" disabled={loading}>
                        {loading ? '⏳ Conectando...' : '✅ Conectar y Traer Datos'}
                    </button>
                </div>
            )}

            {token && (
                <div style={{ marginBottom: '1rem', padding: '0.5rem 1rem', background: '#f0fdf4', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#16a34a', fontWeight: '600' }}>● Conectado a Siigo Nube</span>
                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>— {products.length} productos cargados</span>
                </div>
            )}

            {token && !loading && (
                <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid #cbd5e1', opacity: debugInfo ? 1 : 0.7 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#1e293b' }}>
                        <span style={{ fontSize: '1.2rem' }}>🔍</span>
                        <h4 style={{ margin: 0 }}>Panel de Control y Depuración (v3)</h4>
                    </div>
                    {debugInfo ? (
                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ background: 'white', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Productos en API</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b' }}>{debugInfo.total ?? 0}</div>
                                </div>
                                <div style={{ background: 'white', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Páginas detectadas</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b' }}>{debugInfo._debug_info?.totalPages ?? 1}</div>
                                </div>
                                <div style={{ background: 'white', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Último Sync</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#1e293b' }}>{new Date().toLocaleTimeString()}</div>
                                </div>
                            </div>

                            <details style={{ marginTop: '1rem' }}>
                                <summary style={{ cursor: 'pointer', fontWeight: '600', color: '#475569', fontSize: '0.85rem' }}>Ver JSON Crudo de Respuesta</summary>
                                <pre style={{ marginTop: '0.5rem', fontSize: '0.75rem', overflowX: 'auto', whiteSpace: 'pre-wrap', maxHeight: '250px', background: '#0f172a', color: '#f8fafc', padding: '1rem', borderRadius: '6px' }}>
                                    {JSON.stringify(debugInfo, null, 2)}
                                </pre>
                            </details>
                        </div>
                    ) : (
                        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                            Presione "Sincronizar" para capturar datos de depuración de la API.
                        </p>
                    )}
                </div>
            )}

            <div className="card table-card animate-fade-in">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Descripción</th>
                            <th className="text-right">Costo</th>
                            <th className="text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.length > 0 ? filteredProducts.map(p => (
                            <tr key={p.id}>
                                <td><code>{p.code}</code></td>
                                <td>{p.description}</td>
                                <td className="text-right" style={{ color: '#64748b', fontWeight: 'bold' }}>
                                    {p.cost > 0 ? `$${p.cost.toLocaleString('es-CO')}` : '—'}
                                </td>
                                <td className="text-center">
                                    <span className={`status-badge status-${p.stock > 0 ? 'ganado' : 'perdido'}`}>
                                        {p.stock > 0 ? 'En Stock' : 'Agotado'}
                                    </span>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="text-center" style={{ padding: '3rem', color: 'var(--text-muted)' }}>
                                    {loading ? '⏳ Consultando Siigo...' : 'No hay productos. Presione "Sincronizar" para cargar.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InventarioModule;
