// @ts-nocheck
import React, { useState, useEffect } from 'react';
import type { AppUser, Cliente } from '../App';
import { RefreshCcw, Search, MessageCircle, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface IProps {
    currentUser: AppUser;
    clientes: Cliente[];
}

const SUPABASE_PROJECT_URL = import.meta.env.VITE_SUPABASE_URL || 'https://matyjysinegbibdwzhoq.supabase.co';
const EDGE_FUNCTION_URL = ${SUPABASE_PROJECT_URL}/functions/v1/siigo-proxy;

const fmt = (n: number) => $;

const CarteraModule: React.FC<IProps> = ({ currentUser, clientes }) => {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [syncLog, setSyncLog] = useState<string[]>([]);
    const [siigoUsers, setSiigoUsers] = useState<any[]>([]);

    const addLog = (msg: string) => setSyncLog(prev => [...prev, msg]);

    const baseHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': Bearer 
    });

    const fetchCartera = async () => {
        setLoading(true);
        setSyncLog([]);
        try {
            const username = localStorage.getItem('siigo_username');
            const accessKey = localStorage.getItem('siigo_access_key');

            if (!username || !accessKey) {
                addLog('?? Faltan credenciales de Siigo en la configuración.');
                setLoading(false);
                return;
            }

            addLog('Autenticando con Siigo...');
            const authRes = await fetch(${EDGE_FUNCTION_URL}?action=auth, {
                method: 'POST',
                headers: baseHeaders(),
                body: JSON.stringify({ username, access_key: accessKey }),
            });

            if (!authRes.ok) throw new Error('Fallo la autenticación con Siigo');
            const { access_token } = await authRes.json();
            
            addLog('Obteniendo usuarios de Siigo...');
            // Fetch users to map currentUser to Siigo Seller ID
            let users: any[] = [];
            for (let p = 1; p <= 3; p++) {
                const url = ${EDGE_FUNCTION_URL}?action=users&page=&page_size=100;
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

            const dateQ = created_start=--&created_end=--;
            
            let allInvoices: any[] = [];
            for (let p = 1; p <= 50; p++) {
                const url = ${EDGE_FUNCTION_URL}?action=invoices&&page=&page_size=100;
                const r = await fetch(url, { headers: { ...baseHeaders(), 'x-siigo-token': access_token } });
                if (!r.ok) break;
                const data = await r.json();
                const items = data.results || (Array.isArray(data) ? data : []);
                allInvoices = allInvoices.concat(items);
                if (items.length < 100) break;
                addLog(  Página  escaneada...);
            }

            // Filter unpaid invoices (balance > 0)
            const unpaid = allInvoices.filter(inv => {
                const balance = Number(inv.balance || 0);
                return balance > 0;
            });

            addLog(¡Búsqueda completada!  facturas con saldo pendiente encontradas.);
            setInvoices(unpaid);
        } catch (e: any) {
            addLog(Error: );
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
        const matches = siigoUsers.filter(su => {
            const fullName = \\ \\.toLowerCase();
            return fullName.includes(currentUser.nombre.toLowerCase()) || 
                   (su.email && currentUser.correo && su.email.toLowerCase() === currentUser.correo.toLowerCase()) ||
                   (su.username && currentUser.correo && su.username.toLowerCase() === currentUser.correo.toLowerCase());
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
            const sellerId = String(inv.seller?.id || '');
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
        const msg = encodeURIComponent(\Hola \, te saludamos de Help Soluciones. Te escribimos para recordarte amablemente que la factura \ presenta un saldo pendiente de \. ¡Quedamos atentos a tu confirmación de pago!\);
        window.open(\https://wa.me/57\?text=\\, '_blank');
    };

    const totalCartera = filteredInvoices.reduce((sum, inv) => sum + Number(inv.balance || 0), 0);

    return (
        <div className="module-container animate-fade-in">
            <div className="module-header">
                <div>
                    <h2>Cartera y Cobranza</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                        {currentUser.rol === 'Admin' ? 'Viendo toda la cartera de la empresa.' : 'Viendo únicamente su cartera asignada.'}
                    </p>
                    <div className="search-container" style={{ marginTop: '1rem' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Buscar por cliente o factura..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '300px', borderRadius: '20px', paddingLeft: '2.5rem' }}
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.75rem 1.5rem', borderRadius: '12px', textAlign: 'right' }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'block' }}>TOTAL CARTERA</span>
                        <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f43f5e' }}>{fmt(totalCartera)}</span>
                    </div>
                    <button onClick={fetchCartera} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary-blue)' }}>
                        <RefreshCcw size={18} className={loading ? 'spin' : ''} />
                        {loading ? 'Sincronizando...' : 'Sincronizar Siigo'}
                    </button>
                </div>
            </div>

            {syncLog.length > 0 && loading && (
                <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', fontFamily: 'monospace', color: '#475569' }}>
                    {syncLog[syncLog.length - 1]}
                </div>
            )}

            <div className="card table-card" style={{ marginTop: '1rem' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Factura</th>
                            <th>Cliente</th>
                            <th>Emisión</th>
                            <th>Vencimiento</th>
                            <th>Días Mora</th>
                            <th className="num">Valor Total</th>
                            <th className="num">Saldo Pendiente</th>
                            {currentUser.rol === 'Admin' && <th>Comercial</th>}
                            <th style={{ textAlign: 'center' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInvoices.length === 0 ? (
                            <tr><td colSpan={currentUser.rol === 'Admin' ? 9 : 8} style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>No hay facturas con saldo pendiente para mostrar.</td></tr>
                        ) : filteredInvoices.map((inv, i) => {
                            const mora = getDaysPastDue(inv.due_date || inv.date);
                            const total = Number(inv.total || 0);
                            const balance = Number(inv.balance || 0);
                            
                            let moraBadge = <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}><CheckCircle size={12} style={{ display: 'inline', marginBottom: '-2px', marginRight: '4px' }}/>Al día</span>;
                            if (mora > 0 && mora <= 15) moraBadge = <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}><Clock size={12} style={{ display: 'inline', marginBottom: '-2px', marginRight: '4px' }}/>{mora} días</span>;
                            if (mora > 15) moraBadge = <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}><AlertTriangle size={12} style={{ display: 'inline', marginBottom: '-2px', marginRight: '4px' }}/>{mora} días</span>;

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
                                    <td className="num" style={{ color: '#f43f5e', fontWeight: 800 }}>{fmt(balance)}</td>
                                    {currentUser.rol === 'Admin' && <td style={{ fontSize: '0.85rem' }}>{inv.seller?.name || '—'}</td>}
                                    <td style={{ textAlign: 'center' }}>
                                        <button 
                                            onClick={() => openWhatsApp(inv)}
                                            style={{ background: '#25D366', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '8px', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600 }}
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

            <style>{\
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            \}</style>
        </div>
    );
};

export default CarteraModule;
