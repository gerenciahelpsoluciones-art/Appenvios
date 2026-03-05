import React, { useState, useEffect } from 'react';

interface SiigoProduct {
    id: string;
    code: string;
    description: string;
    price: number;
    stock: number;
}

const InventarioModule: React.FC = () => {
    const [products, setProducts] = useState<SiigoProduct[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // API Credentials state
    const [username, setUsername] = useState(localStorage.getItem('siigo_username') || '');
    const [accessKey, setAccessKey] = useState(localStorage.getItem('siigo_access_key') || '');
    const [token, setToken] = useState<string | null>(null);

    // Proxies Públicos que soportan POST y paso de headers
    const FALLBACK_PROXIES = [
        'https://thingproxy.freeboard.io/fetch/', // Muy confiable para POST
        'https://corsproxy.io/?'                  // Versátil
    ];

    const authenticate = async () => {
        if (!username || !accessKey) {
            setError('Por favor ingrese Usuario y Access Key de Siigo.');
            return null;
        }

        try {
            setLoading(true);
            setError(null);
            console.log('--- Iniciando Diagnóstico de Conexión Siigo ---');

            const hostname = window.location.hostname;
            const isLocal = hostname === 'localhost' ||
                hostname === '127.0.0.1' ||
                hostname.startsWith('192.168.') ||
                hostname.startsWith('10.') ||
                hostname.startsWith('172.');

            let response: Response | null = null;
            let lastError: any = null;
            let usedMethod = 'Vite Proxy';

            // Intento 1: Proxy de Vite (Solo en local)
            if (isLocal) {
                try {
                    console.log('Probando Proxy local de Vite...');
                    const res = await fetch('/siigo-api/v1/auth', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, access_key: accessKey })
                    });
                    if (res.ok) response = res;
                } catch (e: any) {
                    console.warn('Proxy local fallido:', e.message);
                    lastError = e;
                }
            }

            // Intento 2: Proxies Públicos (Fallback)
            if (!response || !response.ok) {
                for (const proxy of FALLBACK_PROXIES) {
                    try {
                        console.log(`Probando Proxy Público: ${proxy}`);
                        const target = 'https://api.siigo.com/v1/auth';
                        const url = proxy.includes('?') ? `${proxy}${encodeURIComponent(target)}` : `${proxy}${target}`;

                        const res = await fetch(url, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ username, access_key: accessKey })
                        });
                        if (res.ok) {
                            response = res;
                            break;
                        }
                    } catch (e) {
                        lastError = e;
                    }
                }
            }

            if (!response || !response.ok) {
                const hint = isLocal ? "Asegúrese de que 'npm run dev' esté ejecutándose." : "Su red o firewall podría estar bloqueando los canales de conexión.";
                throw new Error(`Falla de conexión Triple-Route. ${hint} Detalle: ${lastError?.message || 'Sin respuesta'}`);
            }

            console.log(`Conexión exitosa vía: ${usedMethod}`);

            const data = await response.json();
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

            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            let response: Response | null = null;

            // Intento local
            if (isLocal) {
                try {
                    const res = await fetch('/siigo-api/v1/products', {
                        headers: { 'Authorization': `Bearer ${accessToken}`, 'Partner-Id': 'AppEnvios' }
                    });
                    if (res.ok) response = res;
                } catch (e) { }
            }

            // Fallback proxy
            if (!response || !response.ok) {
                for (const proxy of FALLBACK_PROXIES) {
                    try {
                        const target = 'https://api.siigo.com/v1/products';
                        const url = proxy.includes('?') ? `${proxy}${encodeURIComponent(target)}` : `${proxy}${target}`;
                        const res = await fetch(url, {
                            headers: { 'Authorization': `Bearer ${accessToken}`, 'Partner-Id': 'AppEnvios' }
                        });
                        if (res.ok) {
                            response = res;
                            break;
                        }
                    } catch (e) { }
                }
            }

            const data = await response.json();
            console.log('Datos raw de Siigo:', data);

            if (!data.results || !data.results.length) {
                console.warn('La API retornó 0 productos.');
                setProducts([]);
                setError('La cuenta de Siigo no tiene productos registrados o la consulta no devolvió resultados.');
                return;
            }

            const mapped = data.results.map((p: any) => ({
                id: p.id,
                code: p.code,
                description: p.description,
                price: p.prices?.[0]?.price_list?.[0]?.value || 0,
                stock: p.stock_control ? p.available_quantity : 0
            }));
            setProducts(mapped);
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
            fetchProducts(currentToken);
        }
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
                    <div className="search-container" style={{ width: '300px' }}>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Buscar código o descripción..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={handleRefresh} disabled={loading} className="btn-primary">
                        {loading ? 'Sincronizando...' : '🔃 Sincronizar'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="card" style={{ borderLeft: '4px solid #ef4444', marginBottom: '1.5rem', background: '#fef2f2' }}>
                    <p style={{ color: '#ef4444', fontWeight: '600' }}>⚠️ {error}</p>
                </div>
            )}

            {!token && (
                <div className="card animate-fade-in" style={{ marginBottom: '2rem' }}>
                    <h3>Configuración de API Siigo</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Usuario (Email)</label>
                            <input
                                className="input-field"
                                type="email"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Access Key (API Key)</label>
                            <input
                                className="input-field"
                                type="password"
                                value={accessKey}
                                onChange={e => setAccessKey(e.target.value)}
                            />
                        </div>
                    </div>
                    <button onClick={handleRefresh} className="btn-success" style={{ marginTop: '1rem' }} disabled={loading}>
                        Conectar y Traer Datos
                    </button>
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
                                    {loading ? 'Consultando Siigo...' : 'No se encontraron productos. Presione "Sincronizar" para intentar de nuevo.'}
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
