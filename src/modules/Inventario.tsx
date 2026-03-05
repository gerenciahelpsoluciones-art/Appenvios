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
    const [useDirectConnection, setUseDirectConnection] = useState(false);

    // Proxies Públicos con mayor soporte para POST y Headers
    const FALLBACK_PROXIES = [
        { name: 'Vite Proxy (Local)', url: '/siigo-api' },
        { name: 'AllOrigins (CORS Relay)', url: 'https://api.allorigins.win/raw?url=' },
        { name: 'ThingProxy', url: 'https://thingproxy.freeboard.io/fetch/' },
        { name: 'CORS Proxy IO', url: 'https://corsproxy.io/?' },
        { name: 'Direct (No Proxy)', url: '' }
    ];

    const authenticate = async () => {
        if (!username || !accessKey) {
            setError('Por favor ingrese Usuario y Access Key de Siigo.');
            return null;
        }

        try {
            setLoading(true);
            setError(null);
            console.log('--- Iniciando Diagnóstico de Conexión Triple-Route (v6) ---');

            const hostname = window.location.hostname;
            const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

            let response: Response | null = null;
            let lastError: any = null;
            let successMethod = '';

            // Construir lista de intentos basada en configuración
            const attempts = useDirectConnection
                ? [FALLBACK_PROXIES[4]] // Solo Directo
                : isLocal
                    ? FALLBACK_PROXIES // Todos empezando por local
                    : FALLBACK_PROXIES.filter(p => p.name !== 'Vite Proxy (Local)'); // Omitir local en prod

            for (const proxy of attempts) {
                try {
                    console.log(`Intentando Ruta: ${proxy.name}...`);
                    const target = 'https://api.siigo.com/v1/auth';
                    let url = '';

                    if (proxy.name === 'Vite Proxy (Local)') {
                        url = '/siigo-api/v1/auth';
                    } else if (proxy.url === '') {
                        url = target;
                    } else {
                        url = proxy.url.includes('?') ? `${proxy.url}${encodeURIComponent(target)}` : `${proxy.url}${target}`;
                    }

                    const res = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, access_key: accessKey })
                    });

                    if (res.ok) {
                        response = res;
                        successMethod = proxy.name;
                        break;
                    } else {
                        console.warn(`${proxy.name} falló con status: ${res.status}`);
                    }
                } catch (e: any) {
                    console.error(`Error en ${proxy.name}:`, e.message);
                    lastError = e;
                }
            }

            if (!response || !response.ok) {
                const detail = lastError?.message || 'Error de red / CORS bloqueado';
                throw new Error(`Falla de conexión Triple-Route. Su red o firewall podría estar bloqueando los canales de conexión. Detalle: ${detail}`);
            }

            console.log(`Conexión exitosa vía: ${successMethod}`);
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
            let successMethod = '';

            const attempts = useDirectConnection
                ? [FALLBACK_PROXIES[4]]
                : isLocal ? FALLBACK_PROXIES : FALLBACK_PROXIES.filter(p => p.name !== 'Vite Proxy (Local)');

            for (const proxy of attempts) {
                try {
                    const target = 'https://api.siigo.com/v1/products';
                    let url = '';

                    if (proxy.name === 'Vite Proxy (Local)') {
                        url = '/siigo-api/v1/products';
                    } else if (proxy.url === '') {
                        url = target;
                    } else {
                        url = proxy.url.includes('?') ? `${proxy.url}${encodeURIComponent(target)}` : `${proxy.url}${target}`;
                    }

                    const res = await fetch(url, {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Partner-Id': 'AppEnvios',
                            'Content-Type': 'application/json'
                        }
                    });

                    if (res.ok) {
                        response = res;
                        successMethod = proxy.name;
                        break;
                    }
                } catch (e) { }
            }

            if (!response || !response.ok) {
                throw new Error(`No se pudo obtener el inventario. Verifique su conexión y permisos.`);
            }

            console.log(`Productos obtenidos exitosamente vía: ${successMethod}`);
            const data = await response.json();
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
                <div className="card" style={{ borderLeft: '4px solid #ef4444', marginBottom: '1.5rem', background: '#fef2f2', padding: '1rem' }}>
                    <p style={{ color: '#ef4444', fontWeight: '600', margin: 0 }}>⚠️ {error}</p>
                </div>
            )}

            {!token && (
                <div className="card animate-fade-in" style={{ marginBottom: '2rem' }}>
                    <h3>Configuración de API Siigo</h3>
                    <div className="form-grid" style={{ marginBottom: '1rem' }}>
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

                    <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', marginBottom: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                            <input
                                type="checkbox"
                                checked={useDirectConnection}
                                onChange={e => setUseDirectConnection(e.target.checked)}
                                style={{ width: '18px', height: '18px' }}
                            />
                            <strong>Conexión Directa (Omitir Proxies)</strong>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                (Use esta opción si tiene una extensión de navegador para desbloquear CORS)
                            </span>
                        </label>
                    </div>

                    <button onClick={handleRefresh} className="btn-success" disabled={loading}>
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
