import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { AppUser, Cotizacion, SiigoInvoice, SiigoSeller, Producto } from '../types/crm';

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const SUPABASE_PROJECT_URL = import.meta.env.VITE_SUPABASE_URL || 'https://matyjysinegbibdwzhoq.supabase.co';
const EDGE_FUNCTION_URL = `${SUPABASE_PROJECT_URL}/functions/v1/siigo-proxy`;

interface IProps {
    users: AppUser[];
    cotizaciones: Cotizacion[];
    productos: Producto[];
}

const ComisionesModule: React.FC<IProps> = ({ users, cotizaciones, productos }) => {
    const [activeTab, setActiveTab] = useState<'siigo' | 'local'>('siigo');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    
    // Siigo Data
    const [siigoInvoices, setSiigoInvoices] = useState<any[]>([]);
    const [siigoCreditNotes, setSiigoCreditNotes] = useState<any[]>([]);
    const [siigoPurchases, setSiigoPurchases] = useState<any[]>([]);
    const [siigoDebitNotes, setSiigoDebitNotes] = useState<any[]>([]);
    const [siigoSellers, setSiigoSellers] = useState<any[]>([]);
    const [siigoCostCenters, setSiigoCostCenters] = useState<any[]>([]);
    const [productCosts, setProductCosts] = useState<Record<string, number>>({});
    const [aliases, setAliases] = useState<Record<string, string>>(() => {
        const saved = localStorage.getItem('siigo_seller_aliases');
        return saved ? JSON.parse(saved) : {};
    });
    const [token, setToken] = useState<string | null>(null);
    const [showDiag, setShowDiag] = useState(false);
    const [diagInfo, setDiagInfo] = useState({ fetchCount: 0, sellerCount: 0, costCenterCount: 0, lastSync: '' });
    const [detailSample, setDetailSample] = useState<any>(null);
    const [syncLog, setSyncLog] = useState<string[]>([]);

    const addLog = (msg: string) => {
        setSyncLog(prev => [...prev.slice(-19), `[${new Date().toLocaleTimeString()}] ${msg}`]);
        console.log(`[SYNC LOG] ${msg}`);
    };

    const getBaseHeaders = (): Record<string, string> => ({
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    });

    const authenticateSiigo = async (): Promise<string | null> => {
        const username = localStorage.getItem('siigo_username');
        const accessKey = localStorage.getItem('siigo_access_key');

        if (!username || !accessKey) {
            setError('Credenciales de Siigo no encontradas. Conéctese primero en el módulo de Inventario.');
            return null;
        }

        try {
            setLoading(true);
            const res = await fetch(`${EDGE_FUNCTION_URL}?action=auth`, {
                method: 'POST',
                headers: getBaseHeaders(),
                body: JSON.stringify({ username, access_key: accessKey }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Autenticación fallida');
            setToken(data.access_token);
            return data.access_token;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Super-Scanner: Recursive search for ANY potential seller-related fields
    const findSeller = (obj: any, currentSellers: any[] = [], depth = 0): any => {
        if (!obj || typeof obj !== 'object' || depth > 5) return null;
        
        const priorityKeys = [
            'cost_center',
            'seller', 'seller_id', 'salesman', 'salesman_id', 
            'sales_responsible', 'vendedor', 'asesor', 'comercial',
            'user_id', 'usuario', 'created_by', 'user'
        ];
        
        for (const key of priorityKeys) {
            const val = obj[key];
            if (val !== undefined && val !== null) {
                if (typeof val === 'number' || typeof val === 'string') return val;
                if (typeof val === 'object' && val.id) return val.id;
            }
        }

        if (Array.isArray(currentSellers) && currentSellers.length > 0) {
            for (const key in obj) {
                const val = obj[key];
                if (typeof val === 'number' && val > 10) {
                    if (currentSellers.some(s => String(s.id) === String(val))) return val;
                }
            }
        }

        const subObjects = ['header', 'metadata', 'customer', 'additional_data', 'document', 'cost_center'];
        for (const sub of subObjects) {
            if (obj[sub]) {
                const found = findSeller(obj[sub], currentSellers, depth + 1);
                if (found) return found;
            }
        }
        
        return null;
    };

    const syncSiigoData = async () => {
        let currentToken = token;
        if (!currentToken) {
            currentToken = await authenticateSiigo();
        }
        if (!currentToken) return;

        try {
            setLoading(true);
            setError(null);
            setSyncLog([]);
            addLog('--- Iniciando Sincronización Siigo ---');
            addLog(`Periodo: ${month}/${year}`);

            addLog('Solicitando lista extensa de asesores (Modo Ultra-Compatibilidad: Páginas 1-10)...');
            let allSellers: any[] = [];
            for (let page = 1; page <= 10; page++) {
                try {
                    const sellersRes = await fetch(`${EDGE_FUNCTION_URL}?action=users&page=${page}&page_size=100`, {
                        method: 'GET',
                        headers: { ...getBaseHeaders(), 'x-siigo-token': currentToken }
                    });
                    if (sellersRes.ok) {
                        const sellersData = await sellersRes.json();
                        const pageResults = sellersData.results || (Array.isArray(sellersData) ? sellersData : []);
                        if (pageResults.length === 0) break;
                        allSellers = [...allSellers, ...pageResults];
                        addLog(`   ↪️ Página ${page}: +${pageResults.length} usuarios`);
                    } else {
                        break;
                    }
                } catch (e) { break; }
            }
            setSiigoSellers(allSellers);
            addLog(`Total vendedores cargados: ${allSellers.length}`);

            addLog('Solicitando reporte masivo de Centros de Costo...');
            try {
                const ccRes = await fetch(`${EDGE_FUNCTION_URL}?action=cost-centers`, {
                    method: 'GET',
                    headers: { ...getBaseHeaders(), 'x-siigo-token': currentToken }
                });
                const ccData = await ccRes.json();
                const ccList = ccData.results || (Array.isArray(ccData) ? ccData : []);
                setSiigoCostCenters(ccList);
                addLog(`Centros de Costo cargados: ${ccList.length}`);
            } catch (e) { 
                addLog('⚠️ No se pudo cargar centros de costo masivamente.');
            }

            const lastDay = new Date(year, month, 0).getDate();
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

            const invoicesRes = await fetch(`${EDGE_FUNCTION_URL}?action=invoices&created_start=${startDate}&created_end=${endDate}`, {
                method: 'GET',
                headers: { ...getBaseHeaders(), 'x-siigo-token': currentToken }
            });
            const invoicesData = await invoicesRes.json();

            addLog('Solicitando Movimientos de Compra, Soporte y Notas Débito...');
            const [purchasesRes, billsRes, debitNotesRes] = await Promise.all([
                fetch(`${EDGE_FUNCTION_URL}?action=purchases&created_start=${startDate}&created_end=${endDate}`, {
                    method: 'GET',
                    headers: { ...getBaseHeaders(), 'x-siigo-token': currentToken }
                }),
                fetch(`${EDGE_FUNCTION_URL}?action=bills&created_start=${startDate}&created_end=${endDate}`, {
                    method: 'GET',
                    headers: { ...getBaseHeaders(), 'x-siigo-token': currentToken }
                }),
                fetch(`${EDGE_FUNCTION_URL}?action=debit-notes&created_start=${startDate}&created_end=${endDate}`, {
                    method: 'GET',
                    headers: { ...getBaseHeaders(), 'x-siigo-token': currentToken }
                })
            ]);

            const purchasesData = await purchasesRes.json();
            const billsData = await billsRes.json();
            const debitNotesData = await debitNotesRes.json();
            
            const allProcurement = [
                ...(purchasesData.results || []),
                ...(billsData.results || [])
            ];
            
            const allReturnsPurchase = [
                ...(debitNotesData.results || [])
            ];
            
            setSiigoPurchases(allProcurement);
            setSiigoDebitNotes(allReturnsPurchase);
            addLog(`Documentos de compra/soporte: ${allProcurement.length} | Notas Débito: ${allReturnsPurchase.length}`);

            const costs: Record<string, number> = {};
            allProcurement.forEach((p: any) => {
                if (p.items) {
                    p.items.forEach((item: any) => {
                        if (item.code) {
                            const price = Number(item.price || 0);
                            if (!costs[item.code] || price > 0) {
                                costs[item.code] = price;
                            }
                        }
                    });
                }
            });
            setProductCosts(costs);
            addLog(`Mapa de costos creado: ${Object.keys(costs).length} productos con precio de compra.`);
            
            if (invoicesRes.ok) {
                const rawInvoices = invoicesData.json?.results || invoicesData.results || [];
                addLog(`Facturas recibidas (resumen): ${rawInvoices.length}`);
                
                addLog('🚀 Iniciando Sincronización Profunda (Obteniendo ítems de cada venta)...');
                const detailedInvoices = [];
                for (let i = 0; i < rawInvoices.length; i++) {
                    const inv = rawInvoices[i];
                    addLog(`🔎 Detallando factura ${i + 1}/${rawInvoices.length}: ${inv.number || inv.id}...`);
                    try {
                        const detailRes = await fetch(`${EDGE_FUNCTION_URL}?action=invoice-detail&id=${inv.id}`, {
                            method: 'GET',
                            headers: { ...getBaseHeaders(), 'x-siigo-token': currentToken }
                        });
                        if (detailRes.status === 400) {
                            addLog('⚠️ El servidor no soporta Detalle Profundo. Usando datos básicos.');
                            detailedInvoices.push(inv);
                        } else {
                            const detailData = await detailRes.json();
                            if (detailRes.ok) {
                                detailedInvoices.push(detailData);
                            } else {
                                detailedInvoices.push(inv);
                            }
                        }
                    } catch (e) {
                        detailedInvoices.push(inv);
                    }
                    if (i % 5 === 0) await new Promise(r => setTimeout(r, 100));
                }

                addLog(`✅ Sincronización profunda completada: ${detailedInvoices.length} facturas detalladas.`);
                
                addLog('Solicitando Notas de Crédito (Devoluciones de Venta)...');
                const creditNotesRes = await fetch(`${EDGE_FUNCTION_URL}?action=credit-notes&created_start=${startDate}&created_end=${endDate}`, {
                    method: 'GET',
                    headers: { ...getBaseHeaders(), 'x-siigo-token': currentToken }
                });
                const creditNotesData = await creditNotesRes.json();
                const rawCreditNotes = creditNotesData.results || [];
                addLog(`Notas de Crédito recibidas: ${rawCreditNotes.length}`);
                
                const detailedCreditNotes = [];
                for (let i = 0; i < rawCreditNotes.length; i++) {
                    const cn = rawCreditNotes[i];
                    try {
                        const cnDetailRes = await fetch(`${EDGE_FUNCTION_URL}?action=credit-note-detail&id=${cn.id}`, {
                            method: 'GET',
                            headers: { ...getBaseHeaders(), 'x-siigo-token': currentToken }
                        });
                        if (cnDetailRes.ok) {
                            detailedCreditNotes.push(await cnDetailRes.json());
                        } else {
                            detailedCreditNotes.push(cn);
                        }
                    } catch (e) {
                        detailedCreditNotes.push(cn);
                    }
                }
                
                setSiigoInvoices(detailedInvoices);
                setSiigoCreditNotes(detailedCreditNotes);
                
                setDiagInfo({
                    fetchCount: detailedInvoices.length,
                    sellerCount: allSellers.length,
                    costCenterCount: siigoCostCenters.length,
                    lastSync: new Date().toLocaleTimeString()
                });
                
                if (detailedInvoices.length === 0) {
                    addLog('⚠️ No se encontraron facturas.');
                    setError(`No se encontraron facturas en Siigo para el periodo ${month}/${year}.`);
                } else {
                    addLog('Escaneando facturas en busca de IDs...');
                    const unknownIds = new Set<string>();

                    detailedInvoices.forEach((inv: any) => {
                        if (!inv) return;
                        const sid = findSeller(inv, allSellers);
                        if (sid) {
                            const skey = String(sid);
                            const isKnown = allSellers.some((s: any) => String(s.id) === skey || String(s.identification) === skey) || 
                                            siigoCostCenters.some((cc: any) => String(cc.id) === skey || String(cc.code) === skey);
                            
                            if (!isKnown) {
                                unknownIds.add(skey);
                            }
                        }
                    });

                    addLog(`Detectados ${unknownIds.size} IDs sin nombre: ${Array.from(unknownIds).join(', ')}`);

                    if (unknownIds.size > 0) {
                        addLog(`🚀 Iniciando Resolución Quirúrgica de ${unknownIds.size} IDs...`);
                        const resolvedCCs: any[] = [];
                        
                        let radarActive = true;
                        for (const skey of unknownIds) {
                            if (!radarActive) break;
                            addLog(`📡 Radar: Investigando ID ${skey}...`);
                            try {
                                let nameRes = await fetch(`${EDGE_FUNCTION_URL}?action=user-detail&id=${skey}`, {
                                    method: 'GET',
                                    headers: { ...getBaseHeaders(), 'x-siigo-token': currentToken }
                                });
                                
                                if (nameRes.status === 400) {
                                    addLog('🛑 Radar desactivado: El servidor no soporta búsqueda quirúrgica.');
                                    radarActive = false;
                                    break;
                                }
                                
                                let data = await nameRes.json();

                                if (!nameRes.ok) {
                                    addLog(`   ↪️ No es usuario (Status ${nameRes.status}). Probando como Centro de Costo...`);
                                    nameRes = await fetch(`${EDGE_FUNCTION_URL}?action=cost-center-detail&id=${skey}`, {
                                        method: 'GET',
                                        headers: { ...getBaseHeaders(), 'x-siigo-token': currentToken }
                                    });
                                    data = await nameRes.json();
                                }

                                if (nameRes.ok) {
                                    const foundName = data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.username || data.code;
                                    if (foundName) {
                                        addLog(`✅ ¡ENCONTRADO! ID ${skey} -> ${foundName}`);
                                        resolvedCCs.push({ id: skey, code: data.code || skey, name: foundName });
                                    }
                                } else {
                                    addLog(`❌ ID ${skey} no pudo ser resuelto por Siigo (Status ${nameRes.status})`);
                                }
                            } catch (e) {
                                addLog(`❌ Error de conexión al investigar ID ${skey}`);
                            }
                        }

                        if (resolvedCCs.length > 0) {
                            setSiigoCostCenters(prev => [...prev, ...resolvedCCs]);
                            addLog(`✨ Se rescataron ${resolvedCCs.length} nombres con el radar.`);
                        }
                    } else {
                        addLog('🎉 Todos los IDs comerciales son conocidos.');
                    }
                }
            } else {
                addLog('❌ Error en respuesta de Siigo.');
                throw new Error(invoicesData.error || `Error API Siigo (HTTP ${invoicesRes.status})`);
            }
        } catch (err: any) {
            addLog(`🚨 ERROR: ${err.message}`);
            setError(`Error al sincronizar: ${err.message}`);
            setDiagInfo(prev => ({ ...prev, lastSync: 'ERROR: ' + err.message }));
        } finally {
            setLoading(false);
            addLog('--- Proceso Finalizado ---');
        }
    };

    const calculateCommission = (utility: number) => Math.round(utility * 0.10 * 100) / 100;

    const getSellerSummary = () => {
        const summary: Record<string, { id: string; name: string, utility: number, commission: number, salesCount: number }> = {};
        const selectedMonthPrefix = `${year}-${String(month).padStart(2, '0')}`;

        if (activeTab === 'siigo') {
            if (!Array.isArray(siigoInvoices)) return [];
            
            siigoInvoices.forEach(inv => {
                if (!inv) return;
                
                let sellerId = findSeller(inv, siigoSellers);
                const sellerKey = String(sellerId || 'unknown');

                const seller = siigoSellers.find(s => 
                    String(s.id) === sellerKey || 
                    String(s.identification) === sellerKey ||
                    String(s.username).toLowerCase() === sellerKey.toLowerCase() ||
                    `${s.first_name || ''} ${s.last_name || ''}`.trim().toLowerCase().includes(sellerKey.toLowerCase())
                );
                const costCenter = siigoCostCenters.find(cc => 
                    String(cc.id) === sellerKey || 
                    String(cc.code) === sellerKey
                );

                let sellerName = aliases[sellerKey] || `ID: ${sellerKey}`;
                if (seller && !aliases[sellerKey]) {
                    sellerName = `${seller.first_name || ''} ${seller.last_name || ''}`.trim() || seller.username || `Asesor ${seller.id}`;
                } else if (costCenter && !aliases[sellerKey]) {
                    sellerName = costCenter.name || `Centro: ${costCenter.code}`;
                }
                
                let utility = 0;
                if (inv.items && inv.items.length > 0) {
                    inv.items.forEach((item: any) => {
                        const salePrice = Number(item.price || 0);
                        const quantity = Number(item.quantity || 1);
                        const costPrice = productCosts[item.code] || (Number(item.unit_cost) || (salePrice * 0.7));
                        const itemUtility = (salePrice - costPrice) * quantity;
                        utility += Math.round(itemUtility * 100) / 100;
                    });
                } else {
                    const totalInvoice = Number(inv.total || 0);
                    const costInvoice = Number(inv.cost || 0);
                    const rawUtility = (costInvoice > 0) ? (totalInvoice - costInvoice) : (totalInvoice * 0.3);
                    utility = Math.round(rawUtility * 100) / 100;
                }
                
                if (!summary[sellerKey]) {
                    summary[sellerKey] = { id: sellerKey, name: sellerName, utility: 0, commission: 0, salesCount: 0 };
                }
                summary[sellerKey].utility += utility;
                summary[sellerKey].commission += calculateCommission(utility);
                summary[sellerKey].salesCount += 1;
            });

            // Restar Notas de Crédito (Devoluciones de Venta)
            siigoCreditNotes.forEach(cn => {
                if (!cn) return;
                let sellerId = findSeller(cn, siigoSellers);
                const sellerKey = String(sellerId || 'unknown');
                
                if (!summary[sellerKey]) return;

                let returnUtility = 0;
                if (cn.items && cn.items.length > 0) {
                    cn.items.forEach((item: any) => {
                        const returnPrice = Number(item.price || 0);
                        const quantity = Number(item.quantity || 1);
                        const costPrice = productCosts[item.code] || (Number(item.unit_cost) || (returnPrice * 0.7));
                        const itemReturnUtility = (returnPrice - costPrice) * quantity;
                        returnUtility += Math.round(itemReturnUtility * 100) / 100;
                    });
                } else {
                    const totalCN = Number(cn.total || 0);
                    returnUtility = Math.round((totalCN * 0.3) * 100) / 100;
                }

                summary[sellerKey].utility -= returnUtility;
                summary[sellerKey].commission -= calculateCommission(returnUtility);
            });
        } else {
            if (!Array.isArray(cotizaciones)) return [];
            
            cotizaciones
                .filter(c => c && c.estado === 'Ganado' && c.fecha && c.fecha.startsWith(selectedMonthPrefix))
                .forEach(c => {
                    const sellerName = c.ejecutivo || 'Desconocido';
                    if (!summary[sellerName]) {
                        summary[sellerName] = { id: sellerName, name: sellerName, utility: 0, commission: 0, salesCount: 0 };
                    }
                    summary[sellerName].utility += Number(c.utilidadTotal || 0);
                    summary[sellerName].commission += calculateCommission(Number(c.utilidadTotal || 0));
                    summary[sellerName].salesCount += 1;
                });
        }

        return Object.values(summary);
    };

    const saveAlias = (id: string, currentName: string) => {
        const newAlias = prompt(`Asignar nombre para el ID ${id}:`, currentName.startsWith('ID:') ? '' : currentName);
        if (newAlias !== null) {
            const updated = { ...aliases, [id]: newAlias };
            setAliases(updated);
            localStorage.setItem('siigo_seller_aliases', JSON.stringify(updated));
        }
    };

    const generatePDF = async () => {
        setLoading(true);
        try {
            const { jsPDF } = await import('jspdf');
            await import('jspdf-autotable');

            const doc = new jsPDF();
            const results = getSellerSummary();
            const dateStr = `${month}/${year}`;

            doc.setFontSize(18);
            doc.text(`Reporte de Comisiones (${activeTab === 'siigo' ? 'Siigo' : 'CRM'})`, 14, 20);
            doc.setFontSize(12);
            doc.text(`Periodo: ${dateStr}`, 14, 30);
            doc.text(`Fecha de Reporte: ${new Date().toLocaleDateString()}`, 14, 38);

            const bodyData = results.map(r => [
                String(r.name || 'Desconocido'),
                String(r.salesCount || 0),
                `$ ${(r.utility || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                `$ ${(r.commission || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            ]);

            const totals = {
                count: results.reduce((s, r) => s + (r.salesCount || 0), 0),
                utility: results.reduce((s, r) => s + (r.utility || 0), 0),
                commission: results.reduce((s, r) => s + (r.commission || 0), 0)
            };

            // @ts-ignore
            doc.autoTable({
                startY: 45,
                head: [['Asesor Comercial', 'Ventas', 'Utilidad Total', 'Comisión (10%)']],
                body: bodyData,
                foot: [[
                    'TOTAL GENERAL',
                    String(totals.count),
                    `$ ${totals.utility.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    `$ ${totals.commission.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                ]],
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 185], textColor: 255 },
                footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' }
            });

            doc.save(`Reporte_Comisiones_${activeTab}_${month}_${year}.pdf`);
        } catch (error: any) {
            alert(`Error al generar el PDF: ${error.message}.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="module-container" id="comisiones-module">
            <div className="module-header">
                <div>
                    <h2>Módulo de Comisiones (Admin)</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Cálculo automático del 10% sobre la utilidad generada.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                        onClick={() => setShowDiag(!showDiag)}
                        className="btn-secondary"
                        style={{ border: '1px solid #e2e8f0', color: '#64748b' }}
                        title="Diagnóstico Técnico"
                    >
                        {showDiag ? '❌ Cerrar Diag' : '🔍 Diag'}
                    </button>
                    <button onClick={generatePDF} className="btn-secondary" style={{ border: '1px solid var(--primary-blue)', color: 'var(--primary-blue)' }}>
                        📄 Exportar PDF
                    </button>
                    {activeTab === 'siigo' && (
                        <button onClick={syncSiigoData} disabled={loading} className="btn-success">
                            {loading ? 'Sincronizando...' : '🔄 Sincronizar Siigo'}
                        </button>
                    )}
                </div>
            </div>

            {showDiag && (
                <div className="card" style={{ marginBottom: '2rem', background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                    <h4 style={{ margin: '0 0 1rem 0' }}>Panel de Diagnóstico Siigo</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                        <div><small style={{ color: '#64748b', display: 'block' }}>Facturas Descargadas</small><span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{diagInfo.fetchCount}</span></div>
                        <div><small style={{ color: '#64748b', display: 'block' }}>Asesores Siigo</small><span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{diagInfo.sellerCount}</span></div>
                        <div><small style={{ color: '#64748b', display: 'block' }}>Última Sincronización</small><span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: diagInfo.lastSync.includes('ERROR') ? '#ef4444' : '#1e293b' }}>{diagInfo.lastSync || 'N/A'}</span></div>
                        <div><small style={{ color: '#64748b', display: 'block' }}>Token Siigo</small><span style={{ fontWeight: 'bold', color: token ? '#22c55e' : '#ef4444' }}>{token ? 'ACTIVO ✅' : 'INACTIVO ❌'}</span></div>
                    </div>
                    {siigoInvoices.length > 0 && (
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#1e40af' }}>🔍 CLAVES DETECTADAS EN FACTURA:</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                                {Object.keys(siigoInvoices[0]).map(k => (
                                    <span key={k} style={{ background: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>{k}</span>
                                ))}
                            </div>
                            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>JSON Crudo (Muestra):</p>
                            <pre style={{ background: '#0f172a', color: '#f8fafc', padding: '0.75rem', borderRadius: '4px', overflow: 'auto', maxHeight: '150px' }}>
                                {JSON.stringify({ id: siigoInvoices[0].id, seller: (siigoInvoices[0] as any).seller, metadata: (siigoInvoices[0] as any).metadata }, null, 2)}
                            </pre>
                        </div>
                    )}
                    <div style={{ marginTop: '1rem', background: '#000', padding: '1rem', borderRadius: '4px', fontFamily: 'monospace', color: '#4ade80', fontSize: '0.8rem', maxHeight: '200px', overflow: 'auto' }}>
                        {syncLog.length === 0 ? '> Esperando sincronización...' : syncLog.map((log, i) => <div key={i}>{log}</div>)}
                    </div>
                </div>
            )}

            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
                    <div>
                        <label>Mes de Comisión</label>
                        <select className="input-field" value={month} onChange={e => setMonth(Number(e.target.value))}>
                            {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => (
                                <option key={i} value={i + 1}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label>Año</label>
                        <select className="input-field" value={year} onChange={e => setYear(Number(e.target.value))}>
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="inner-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => setActiveTab('siigo')} className={`tab-btn ${activeTab === 'siigo' ? 'active' : ''}`}>
                    🌐 Facturas Siigo
                </button>
                <button onClick={() => setActiveTab('local')} className={`tab-btn ${activeTab === 'local' ? 'active' : ''}`}>
                    🏠 Cotizaciones CRM (Ganadas)
                </button>
            </div>

            {error && <div className="error-box">{error}</div>}

            <div className="card table-card animate-fade-in" style={{ marginTop: '2rem' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Asesor Comercial</th>
                            <th className="num">N° Ventas</th>
                            <th className="num">Utilidad Generada</th>
                            <th className="num">Comisión Estimada (10%)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {getSellerSummary().length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                                    {loading ? 'Consultando datos...' : 'No hay datos para este periodo.'}
                                </td>
                            </tr>
                        ) : (
                            getSellerSummary().map((row, idx) => (
                                <tr key={idx}>
                                    <td 
                                        onClick={() => saveAlias(row.id, row.name)}
                                        style={{ cursor: 'pointer' }}
                                        title="Haz clic para asignar un nombre real"
                                    >
                                        <strong style={{ color: row.name.startsWith('ID:') ? 'var(--primary-blue)' : 'inherit' }}>
                                            {row.name}
                                        </strong>
                                        {row.name.startsWith('ID:') && (
                                            <span style={{ fontSize: '0.7rem', opacity: 0.6, marginLeft: '8px', display: 'block' }}>
                                                ✏️ Haz clic para renombrar
                                            </span>
                                        )}
                                    </td>
                                    <td className="num">{row.salesCount}</td>
                                    <td className="num" style={{ color: 'var(--success)', fontWeight: 'bold' }}>
                                        ${row.utility.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="num" style={{ color: 'var(--primary-blue)', fontSize: '1.1rem', fontWeight: 'bold' }}>
                                        ${row.commission.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <style>{`
                #comisiones-module .inner-tabs { border-bottom: 2px solid var(--border-color); }
                #comisiones-module .tab-btn { 
                    background: none; border: none; padding: 0.75rem 1.5rem; cursor: pointer;
                    color: var(--text-muted); font-weight: 500; transition: all 0.2s;
                }
                #comisiones-module .tab-btn.active {
                    color: var(--primary-blue); font-weight: 700;
                    border-bottom: 3px solid var(--primary-blue);
                }
                #comisiones-module .num { text-align: right; }
                #comisiones-module .error-box { 
                    background: #fee2e2; color: #b91c1c; padding: 1rem; border-radius: 8px;
                    margin-bottom: 1rem; border: 1px solid #fecaca;
                }
            `}</style>
        </div>
    );
};

export default ComisionesModule;
