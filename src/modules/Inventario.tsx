import React, { useState } from 'react';

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

interface SiigoProduct {
    id: string;
    code: string;
    description: string;
    price: number;
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
                throw new Error(`Error de autenticación: ${data.error || res.status}. Verifique sus credenciales.`);
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
            if (!res.ok) {
                throw new Error(`Error al obtener productos: ${data.error || res.status}`);
            }

            if (!data.results || data.results.length === 0) {
                setProducts([]);
                setError('La cuenta de Siigo no tiene productos registrados o la consulta no devolvió resultados.');
                return;
            }

            const mapped: SiigoProduct[] = data.results.map((p: any) => ({
                id: p.id,
                code: p.code,
                description: p.description,
                price: p.prices?.[0]?.price_list?.[0]?.value || 0,
                stock: p.stock_control ? (p.available_quantity || 0) : 0,
            }));
            setProducts(mapped);
            console.log(`${mapped.length} productos cargados desde Siigo.`);
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

    const filteredProducts = products.filter(p =>
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="module-container">
            <div className="module-header">
                <h2>Inventario Siigo Nube</h2>
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

            <div className="card table-card animate-fade-in">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Descripción</th>
                            <th className="text-right">Precio</th>
                            <th className="text-center">Stock</th>
                            <th className="text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.length > 0 ? filteredProducts.map(p => (
                            <tr key={p.id}>
                                <td><code>{p.code}</code></td>
                                <td>{p.description}</td>
                                <td className="text-right">${p.price.toLocaleString()}</td>
                                <td className="text-center">{p.stock}</td>
                                <td className="text-center">
                                    <span className={`status-badge status-${p.stock > 0 ? 'ganado' : 'perdido'}`}>
                                        {p.stock > 0 ? 'En Stock' : 'Agotado'}
                                    </span>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="text-center" style={{ padding: '3rem', color: 'var(--text-muted)' }}>
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
