import React, { useState } from 'react';

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

    // API Credentials state (In a real app, these come from .env or a secure backend)
    const [username, setUsername] = useState(localStorage.getItem('siigo_username') || '');
    const [accessKey, setAccessKey] = useState(localStorage.getItem('siigo_access_key') || '');
    const [token, setToken] = useState<string | null>(null);

    // Using the local Vite proxy defined in vite.config.ts
    const API_BASE_URL = '/siigo-api';

    const authenticate = async () => {
        if (!username || !accessKey) {
            setError('Por favor ingrese Usuario y Access Key de Siigo.');
            return null;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`${API_BASE_URL}/v1/auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, access_key: accessKey })
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Error (404): No se encontró la ruta del Proxy. Asegúrese de estar ejecutando "npm run dev" en desarrollo.');
                }
                const errorData = await response.json().catch(() => ({}));
                console.error('Siigo Auth Error:', errorData);
                throw new Error(`Error de autenticación (${response.status}): ${errorData.Errors?.[0]?.Message || 'Verifique sus credenciales.'}`);
            }

            const data = await response.json();
            setToken(data.access_token);
            localStorage.setItem('siigo_username', username);
            localStorage.setItem('siigo_access_key', accessKey);
            return data.access_token;
        } catch (err: any) {
            setError(err.message);
            console.error('Auth handler error:', err);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async (accessToken: string) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/v1/products`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Partner-Id': 'AppEnvios'
                }
            });

            if (!response.ok) throw new Error('Error al obtener productos de Siigo.');

            const data = await response.json();
            // Map Siigo data to our interface
            const mapped = data.results.map((p: any) => ({
                id: p.id,
                code: p.code,
                description: p.description,
                price: p.prices?.[0]?.price_list?.[0]?.value || 0,
                stock: p.stock_control ? p.available_quantity : 0
            }));
            setProducts(mapped);
            setError(null);
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
                <h2>Inventario Real (Siigo Nube)</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="search-container" style={{ width: '300px' }}>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Buscar en Siigo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={handleRefresh} disabled={loading} className="btn-primary">
                        {loading ? '🔄 Cargando...' : '🔃 Sincronizar'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="card" style={{ borderLeft: '4px solid var(--error)', marginBottom: '1.5rem', background: '#fef2f2' }}>
                    <p style={{ color: 'var(--error)', fontWeight: '600' }}>⚠️ {error}</p>
                </div>
            )}

            {!token && (
                <div className="card animate-fade-in" style={{ marginBottom: '2rem' }}>
                    <h3>Configuración de API Siigo</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Ingrese sus credenciales para habilitar la sincronización en tiempo real.</p>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Usuario (Siigo Email)</label>
                            <input
                                className="input-field"
                                type="email"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="usuario@empresa.com"
                            />
                        </div>
                        <div className="form-group">
                            <label>Access Key (API Key)</label>
                            <input
                                className="input-field"
                                type="password"
                                value={accessKey}
                                onChange={e => setAccessKey(e.target.value)}
                                placeholder="Clave de acceso API"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="btn-success"
                        style={{ marginTop: '1rem' }}
                        disabled={loading}
                    >
                        Conectar y Sincronizar
                    </button>
                </div>
            )}

            <div className="card table-card animate-fade-in">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Descripción</th>
                            <th className="text-right">Costo/Precio</th>
                            <th className="text-center">Stock</th>
                            <th className="text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.length > 0 ? filteredProducts.map(p => (
                            <tr key={p.id}>
                                <td><code className="part-number-badge">{p.code}</code></td>
                                <td>{p.description}</td>
                                <td className="text-right"><strong>${p.price.toLocaleString()}</strong></td>
                                <td className="text-center">
                                    <span style={{
                                        color: p.stock > 0 ? 'var(--success)' : 'var(--error)',
                                        fontWeight: '700'
                                    }}>
                                        {p.stock}
                                    </span>
                                </td>
                                <td className="text-center">
                                    <span className={`status-badge status-${p.stock > 0 ? 'ganado' : 'perdido'}`}>
                                        {p.stock > 0 ? 'Disponible' : 'Sin Stock'}
                                    </span>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="text-center" style={{ padding: '3rem', color: 'var(--text-muted)' }}>
                                    {loading ? 'Buscando productos en Siigo...' : 'No hay datos. Presione "Sincronizar" para traer el inventario.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <style>{`
                .part-number-badge {
                    background: #f1f5f9;
                    padding: 0.2rem 0.6rem;
                    border-radius: 4px;
                    font-family: monospace;
                    font-weight: 600;
                    color: var(--primary-blue);
                }
                .search-input {
                    transition: all 0.3s ease;
                }
                .search-input:focus {
                    width: 350px;
                    border-color: var(--primary-blue);
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                }
            `}</style>
        </div>
    );
};

export default InventarioModule;
