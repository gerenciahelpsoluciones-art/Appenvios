// @ts-nocheck
import React, { useState, useEffect } from 'react';
import type { AppUser, Cliente } from '../App';
import { RefreshCcw, Search, MessageCircle, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface IProps {
    currentUser: AppUser;
    clientes: Cliente[];
}

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const SUPABASE_PROJECT_URL = import.meta.env.VITE_SUPABASE_URL || 'https://matyjysinegbibdwzhoq.supabase.co';
const EDGE_FUNCTION_URL = `${SUPABASE_PROJECT_URL}/functions/v1/siigo-proxy`;

const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`;

const CarteraModule: React.FC<IProps> = ({ currentUser, clientes }) => {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [syncLog, setSyncLog] = useState<string[]>([]);
    const [siigoUsers, setSiigoUsers] = useState<any[]>([]);

    const addLog = (msg: string) => setSyncLog(prev => [...prev, msg]);

    const baseHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    });

    const fetchCartera = async () => {
        setLoading(true);
        setSyncLog([]);
        try {
            const username = localStorage.getItem('siigo_username');
            const accessKey = localStorage.getItem('siigo_access_key');

            if (!username || !accessKey) {
                addLog('⚠️ Faltan credenciales de Siigo en la configuración.');
                setLoading(false);
                return;
            }

            addLog('Autenticando con Siigo...');
            const authRes = await fetch(`${EDGE_FUNCTION_URL}?action=auth`, {
                method: 'POST',
                headers: baseHeaders(),
                body: JSON.stringify({ username, access_key: accessKey }),
            });

            if (!authRes.ok) throw new Error('Falló la autenticación con Siigo');
            const { access_token } = await authRes.json();

            addLog('Obteniendo usuarios de Siigo...');
            // Fetch users to map currentUser to Siigo Seller ID
            let users: any[] = [];
            for (let p = 1; p <= 3; p++) {
                const url = `${EDGE_FUNCTION_URL}?action=users&page=${p}&page_size=100`;
                const r = await fetch(url, { headers: { ...baseHeaders(), 'x-siigo-token': access_token } });
                if (r.ok) {
                    const data = await r.json();
                    if (data && data.results) {
                        users = users.concat(data.results);
                        if (data.results.length < 100) break;
                    } else if (Array.isArray(data)) {
                        users = users.concat(data);
                        if (data.length < 100) break;
                    }
                }
            }
            setSiigoUsers(users);

            // Fetch Invoices (Last 6 months to find unpaid)
            addLog('Buscando facturas en los últimos 6 meses...');
            const today = new Date();
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(today.getMonth() - 6);

            const yearStart = sixMonthsAgo.getFullYear();
            const monthStart = String(sixMonthsAgo.getMonth() + 1).padStart(2, '0');
            const dayStart = String(sixMonthsAgo.getDate()).padStart(2, '0');
            const yearEnd = today.getFullYear();
            const monthEnd = String(today.getMonth() + 1).padStart(2, '0');
            const dayEnd = String(today.getDate()).padStart(2, '0');

            const dateQ = `created_start=${yearStart}-${monthStart}-${dayStart}&created_end=${yearEnd}-${monthEnd}-${dayEnd}`;

            let allInvoices: any[] = [];
            for (let p = 1; p <= 50; p++) {
                const url = `${EDGE_FUNCTION_URL}?action=invoices&${dateQ}&page=${p}&page_size=100`;
                const r = await fetch(url, { headers: { ...baseHeaders(), 'x-siigo-token': access_token } });
                if (!r.ok) break;
                const data = await r.json();
                const items = data.results || (Array.isArray(data) ? data : []);
                allInvoices = allInvoices.concat(items);
                if (items.length < 100) break;
                addLog(`  Página ${p} escaneada...`);
            }

            // Filter unpaid invoices (balance > 0)
            const unpaid = allInvoices.filter(inv => {
                const balance = Number(inv.balance || 0);
                return balance > 0;
            });

            addLog(`¡Búsqueda completada! ${unpaid.length} facturas con saldo pendiente encontradas.`);
            setInvoices(unpaid);
        } catch (e: any) {
            addLog(`Error: ${e.message}`);
        }
        setLoading(false);
    };

    // Al montar, intentamos cargar
    useEffect(() => {
        fetchCartera();
    }, []);

    // Identificar el ID del vendedor en Siigo para el usuario actual
    const getMySiigoSellerIds = () => {
        if (!currentUser) return [];
        const myEmail = (currentUser.email || '').toLowerCase();
        const matches = siigoUsers.filter(su => {
            const fullName = `${su.first_name || ''} ${su.last_name || ''}`.toLowerCase();
            return fullName.includes(currentUser.nombre.toLowerCase()) ||
                   (su.email && myEmail && su.email.toLowerCase() === myEmail) ||
                   (su.username && myEmail && su.username.toLowerCase() === myEmail);
        });
        return matches.map(m => String(m.id));
    };

    const mySellerIds = getMySiigoSellerIds();

    const filteredInvoices = invoices.filter(inv => {
        // Filtrar por texto
        const cName = String(inv.customer?.name || inv.customer?.identification || '').toLowerCase();
        const number = String(inv.name || inv.number || '').toLowerCase();
        const matchesText = cName.includes(searchTerm.toLowerCase()) || number.includes(searchTerm.toLowerCase());
        if (!matchesText) return false;

        // Filtrar por vendedor (Si no es Admin, solo ve las suyas)
        if (currentUser.rol !== 'Admin') {
            const sellerId = String(inv.seller?.id || inv.seller || '');
            if (!mySellerIds.includes(sellerId)) return false;
        }
        return true;
    }).sort((a, b) => {
        // Sort by due_date ascending (oldest debts first)
        const dateA = new Date(a.due_date || a.date || 0).getTime();
        const dateB = new Date(b.due_date || b.date || 0).getTime();
        return dateA - dateB;
    });

    const getDaysPastDue = (dueDate: string) => {
        if (!dueDate) return 0;
        const due = new Date(dueDate);
        const now = new Date();
        const diff = now.getTime() - due.getTime();
        return Math.floor(diff / (1000 * 3600 * 24));
    };

    const openWhatsApp = (inv: any) => {
        // Buscar cliente en el CRM para sacar el teléfono
        const nit = String(inv.customer?.identification || '');
        const crmClient = clientes.find(c => String(c.nit) === nit);
        let phone = crmClient?.telefono || '';
        if (!phone && inv.customer?.phone?.number) {
            phone = inv.customer.phone.number;
        }

        const cleanPhone = phone.replace(/\D/g, '');
        if (!cleanPhone) {
            alert('No se encontró teléfono para este cliente en el CRM ni en Siigo.');
            return;
        }

        const saldo = fmt(Number(inv.balance || 0));
        const numFactura = inv.name || inv.number || '';
        const nombreCliente = inv.customer?.name || crmClient?.nombre || '';
        const msg = encodeURIComponent(`Hola ${nombreCliente}, te saludamos de Help Soluciones. Te escribimos para recordarte amablemente que la factura ${numFactura} presenta un saldo pendiente de ${saldo}. ¡Quedamos atentos a tu confirmación de pago!`);
        window.open(`https://wa.me/57${cleanPhone}?text=${msg}`, '_blank');
    };

    const totalCartera = filteredInvoices.reduce((sum, inv) => sum + Number(inv.balance || 0), 0);
    const vencidas = filteredInvoices.filter(inv => getDaysPastDue(inv.due_date || inv.date) > 0).length;

    return (
        <div className="module-container animate-fade-in">
            <div className="module-header">
                <div>
                    <h2>Cartera y Cobranza</h2>
                    <p className="module-subtitle">
                        {currentUser.rol === 'Admin' ? 'Viendo toda la cartera de la empresa.' : 'Viendo únicamente su cartera asignada.'}
                    </p>
                </div>
                <div className="header-actions">
                    <div className="search-container">
                        <Search size={16} className="search-icon" />
                        <input
                            type="text"
                            className="input-field search-input"
                            placeholder="Buscar por cliente o factura..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={fetchCartera} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <RefreshCcw size={16} className={loading ? 'spin' : ''} />
                        {loading ? 'Sincronizando...' : 'Sincronizar Siigo'}
                    </button>
                </div>
            </div>

            <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
                <div className="stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Total cartera</span>
                        <span className="stat-value" style={{ color: 'var(--error)' }}>{fmt(totalCartera)}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Facturas con saldo</span>
                        <span className="stat-value">{filteredInvoices.length}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Vencidas</span>
                        <span className="stat-value" style={{ color: vencidas ? 'var(--warning)' : 'var(--success)' }}>{vencidas}</span>
                    </div>
                </div>
            </div>

            {syncLog.length > 0 && (loading || syncLog[syncLog.length - 1].startsWith('⚠️') || syncLog[syncLog.length - 1].startsWith('Error')) && (
                <div className="sync-log">
                    {syncLog[syncLog.length - 1]}
                </div>
            )}

            <div className="card table-card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Factura</th>
                            <th>Cliente</th>
                            <th>Emisión</th>
                            <th>Vencimiento</th>
                            <th>Días mora</th>
                            <th className="num">Valor total</th>
                            <th className="num">Saldo pendiente</th>
                            {currentUser.rol === 'Admin' && <th>Comercial</th>}
                            <th style={{ textAlign: 'center' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInvoices.length === 0 ? (
                            <tr><td colSpan={currentUser.rol === 'Admin' ? 9 : 8} className="empty-row">No hay facturas con saldo pendiente para mostrar.</td></tr>
                        ) : filteredInvoices.map((inv, i) => {
                            const mora = getDaysPastDue(inv.due_date || inv.date);
                            const total = Number(inv.total || 0);
                            const balance = Number(inv.balance || 0);

                            let moraBadge = <span className="pill pill-success"><CheckCircle size={12} />Al día</span>;
                            if (mora > 0 && mora <= 15) moraBadge = <span className="pill pill-warning"><Clock size={12} />{mora} días</span>;
                            if (mora > 15) moraBadge = <span className="pill pill-danger"><AlertTriangle size={12} />{mora} días</span>;

                            return (
                                <tr key={inv.id || i} style={{ background: mora > 30 ? '#fff1f2' : undefined }}>
                                    <td style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>{inv.name || inv.number || 'N/A'}</td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{inv.customer?.name || 'Cliente sin nombre'}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NIT: {inv.customer?.identification || ''}</div>
                                    </td>
                                    <td>{inv.date || '—'}</td>
                                    <td style={{ fontWeight: 600 }}>{inv.due_date || '—'}</td>
                                    <td>{moraBadge}</td>
                                    <td className="num">{fmt(total)}</td>
                                    <td className="num" style={{ color: 'var(--error)', fontWeight: 800 }}>{fmt(balance)}</td>
                                    {currentUser.rol === 'Admin' && <td style={{ fontSize: '0.85rem' }}>{inv.seller?.name || '—'}</td>}
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            onClick={() => openWhatsApp(inv)}
                                            className="btn-whatsapp"
                                            title="Enviar recordatorio por WhatsApp"
                                        >
                                            <MessageCircle size={14} /> Cobrar
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CarteraModule;
