import React, { useState } from 'react';
import type { AppUser, Cotizacion, Despacho } from '../types/crm';

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const SUPABASE_PROJECT_URL = import.meta.env.VITE_SUPABASE_URL || 'https://matyjysinegbibdwzhoq.supabase.co';
const EDGE_FUNCTION_URL = `${SUPABASE_PROJECT_URL}/functions/v1/siigo-proxy`;

interface VentaManual { fecha: string; usuarioNombre: string; monto: number; costo?: number; tipoVenta?: string; }
interface Alquiler { usuarioId: string; valorMensual: number; estado: string; }

interface IProps {
    users: AppUser[];
    cotizaciones: Cotizacion[];
    despachos: Despacho[];
    ventasManuales: VentaManual[];
    alquileres: Alquiler[];
}

type MainTab = 'siigo' | 'local';
type SiigoSubTab = 'resumen' | 'detalle';

interface ManualNC {
    id: string;
    vendedorId: string;
    vendedorName: string;
    ncNum: string;
    amount: number;
    month: number;
    year: number;
}

interface VendedorRow {
    id: string; name: string;
    ventasBruto: number; devoluciones: number; ventasNetas: number;
    costos: number; utilidad: number; comision: number;
    countFacturas: number; countDevoluciones: number;
}

interface LineaDetalle {
    vendedorId: string; vendedorName: string;
    facturaNum: string; facturaFecha: string; clienteNombre: string;
    code: string; description: string;
    quantity: number; unitPrice: number; totalVenta: number;
    unitCost: number; totalCosto: number; utilidad: number;
    esDevolucion: boolean;
}

const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`;
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const ComisionesModule: React.FC<IProps> = ({ users, cotizaciones, despachos, ventasManuales, alquileres }) => {
    const [mainTab, setMainTab] = useState<MainTab>('siigo');
    const [siigoSubTab, setSiigoSubTab] = useState<SiigoSubTab>('resumen');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [selectedVendedor, setSelectedVendedor] = useState('');
    const [selectedComercial, setSelectedComercial] = useState('');

    // Siigo raw data
    const [siigoInvoices, setSiigoInvoices] = useState<any[]>([]);
    const [siigoCreditNotes, setSiigoCreditNotes] = useState<any[]>([]);
    const [productCosts, setProductCosts] = useState<Record<string, number>>({});
    const [usersMap, setUsersMap] = useState<Record<string, string>>({}); // id → name
    const [costCentersMap, setCostCentersMap] = useState<Record<string, string>>({}); // id → name
    const [token, setToken] = useState<string | null>(null);
    const [syncLog, setSyncLog] = useState<string[]>([]);
    const [showDiag, setShowDiag] = useState(false);
    const [diagInfo, setDiagInfo] = useState<{ invoices: number; creditNotes: number; purchases: number; supportDocs: number; debitNotes: number; lastSync: string; firstCN?: any }>({ invoices: 0, creditNotes: 0, purchases: 0, supportDocs: 0, debitNotes: 0, lastSync: '' });

    // Mapa manual de centros de costo (persiste en localStorage, tiene prioridad sobre API)
    const DEFAULT_CC_MAP: Record<string, string> = {
        '14146': 'Deicy Rodriguez',
        '15087': 'Lidy Hernandez',
        '13847': 'Carlos Arturo Saenz',
        '14152': 'Juan Andres Perez',
        '14536': 'Angelica Villanueva',
    };
    const [manualCCMap, setManualCCMap] = useState<Record<string, string>>(() => {
        try {
            const stored = localStorage.getItem('comisiones_cc_map');
            if (!stored) {
                localStorage.setItem('comisiones_cc_map', JSON.stringify(DEFAULT_CC_MAP));
                return DEFAULT_CC_MAP;
            }
            return JSON.parse(stored);
        } catch { return DEFAULT_CC_MAP; }
    });
    const [showCCEditor, setShowCCEditor] = useState(false);
    const [ccEditText, setCCEditText] = useState('');

    const saveManualCCMap = (map: Record<string, string>) => {
        setManualCCMap(map);
        localStorage.setItem('comisiones_cc_map', JSON.stringify(map));
    };
    const openCCEditor = () => {
        const lines = Object.entries(manualCCMap).map(([id, name]) => `${id}=${name}`).join('\n');
        setCCEditText(lines || '14146=Deicy Rodriguez\n15087=Lidy Hernandez\n13847=Carlos Arturo Saenz\n14152=Juan Andres Perez\n14536=Angelica Villanueva');
        setShowCCEditor(true);
    };
    const saveCCEditor = () => {
        const map: Record<string, string> = {};
        ccEditText.split('\n').forEach(line => {
            const eq = line.indexOf('=');
            if (eq > 0) {
                const id = line.slice(0, eq).trim();
                const name = line.slice(eq + 1).trim();
                if (id && name) map[id] = name;
            }
        });
        saveManualCCMap(map);
        setShowCCEditor(false);
    };

    // Notas crédito manuales (persisten en localStorage)
    const [manualNCs, setManualNCs] = useState<ManualNC[]>(() => {
        try { return JSON.parse(localStorage.getItem('comisiones_manual_nc') ?? '[]'); }
        catch { return []; }
    });
    const [ncForm, setNcForm] = useState({ vendedorId: '', ncNum: '', amount: '' });

    const saveNCs = (list: ManualNC[]) => {
        setManualNCs(list);
        localStorage.setItem('comisiones_manual_nc', JSON.stringify(list));
    };
    const addManualNC = () => {
        if (!ncForm.vendedorId || !ncForm.amount || Number(ncForm.amount) <= 0) return;
        const v = vendedoresUnicos.find(v => v.id === ncForm.vendedorId);
        saveNCs([...manualNCs, {
            id: Date.now().toString(),
            vendedorId: ncForm.vendedorId,
            vendedorName: v?.name ?? ncForm.vendedorId,
            ncNum: ncForm.ncNum,
            amount: Math.abs(Number(ncForm.amount)),
            month, year,
        }]);
        setNcForm({ vendedorId: '', ncNum: '', amount: '' });
    };
    const deleteManualNC = (id: string) => saveNCs(manualNCs.filter(n => n.id !== id));

    const addLog = (msg: string) => setSyncLog(prev => [...prev.slice(-29), `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const baseHeaders = (): Record<string, string> => ({
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    });

    // ── Autenticación ─────────────────────────────────────────────────────────
    const authenticate = async (): Promise<string | null> => {
        const username = localStorage.getItem('siigo_username');
        const accessKey = localStorage.getItem('siigo_access_key');
        if (!username || !accessKey) {
            setError('Credenciales Siigo no configuradas. Conecte primero en el módulo Inventario.');
            return null;
        }
        try {
            const res = await fetch(`${EDGE_FUNCTION_URL}?action=auth`, {
                method: 'POST', headers: baseHeaders(),
                body: JSON.stringify({ username, access_key: accessKey }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Autenticación fallida');
            setToken(data.access_token);
            return data.access_token;
        } catch (e: any) { setError(e.message); return null; }
    };

    // ── Paginador genérico ────────────────────────────────────────────────────
    const fetchPages = async (tk: string, action: string, extra = '') => {
        let all: any[] = [];
        for (let p = 1; p <= 50; p++) {
            const sep = extra ? '&' : '';
            const url = `${EDGE_FUNCTION_URL}?action=${action}${sep}${extra}&page=${p}&page_size=100`;
            try {
                const res = await fetch(url, { headers: { ...baseHeaders(), 'x-siigo-token': tk } });
                if (!res.ok) {
                    const txt = await res.text();
                    addLog(`⚠️ ${action} p${p}: HTTP ${res.status} — ${txt.slice(0, 120)}`);
                    break;
                }
                const data = await res.json();
                const rows = data.results ?? data.data ?? (Array.isArray(data) ? data : []);
                if (!rows.length) break;
                all = [...all, ...rows];
                if (rows.length < 100) break;
            } catch (e: any) {
                addLog(`⚠️ ${action} p${p}: ${e.message}`);
                break;
            }
        }
        return all;
    };

    // ── Paginador con URLSearchParams (codifica correctamente fechas RFC3339) ──
    const fetchPagesSafe = async (tk: string, action: string, params: Record<string, string> = {}) => {
        let all: any[] = [];
        for (let p = 1; p <= 100; p++) {
            const qs = new URLSearchParams({ action, ...params, page: String(p), page_size: '100' }).toString();
            const url = `${EDGE_FUNCTION_URL}?${qs}`;
            try {
                const res = await fetch(url, { headers: { ...baseHeaders(), 'x-siigo-token': tk } });
                const rawText = await res.text();
                if (!res.ok) {
                    addLog(`⚠️ ${action} p${p}: HTTP ${res.status} — ${rawText.slice(0, 200)}`);
                    break;
                }
                let data: any;
                try { data = JSON.parse(rawText); } catch { addLog(`⚠️ ${action} p${p}: JSON inválido — ${rawText.slice(0, 150)}`); break; }
                const rows = data.results ?? data.data ?? (Array.isArray(data) ? data : []);
                if (rows.length === 0) {
                    addLog(`  ${action} p${p}: 0 resultados (total=${data.pagination?.total_results ?? '?'}) → ${rawText.slice(0, 280)}`);
                    break;
                }
                addLog(`  ${action} p${p}: ${rows.length} resultados (total=${data.pagination?.total_results ?? '?'})`);
                all = [...all, ...rows];
                if (rows.length < 100) break;
            } catch (e: any) {
                addLog(`⚠️ ${action} p${p}: ${e.message}`);
                break;
            }
        }
        return all;
    };

    // ── Test directo NC ───────────────────────────────────────────────────────
    const testCreditNotes = async () => {
        let tk = token ?? await authenticate();
        if (!tk) return;
        setShowDiag(true);
        addLog('🔬 ── TEST DIRECTO credit-notes ──');
        try {
            // Test 1: sin filtros
            const url1 = `${EDGE_FUNCTION_URL}?action=credit-notes&page=1&page_size=5`;
            const res1 = await fetch(url1, { headers: { ...baseHeaders(), 'x-siigo-token': tk } });
            const raw1 = await res1.text();
            try {
                const j = JSON.parse(raw1);
                const total = j.pagination?.total_results ?? j.total_results ?? '?';
                const count = (j.results ?? j.data ?? []).length;
                addLog(`Sin filtros → HTTP ${res1.status} | total_results=${total} | en página=${count}`);
                if (count > 0) {
                    const first = (j.results ?? j.data ?? [])[0];
                    addLog(`Primera NC: id=${first.id} | date=${first.date} | name=${first.name} | total=${first.total}`);
                }
            } catch { addLog(`Sin filtros → HTTP ${res1.status}: ${raw1.slice(0, 300)}`); }

            // Test 2: con fecha del mes actual
            const now = new Date();
            const mm = String(now.getMonth()+1).padStart(2,'0');
            const yy = now.getFullYear();
            const lastDay = new Date(yy, now.getMonth()+1, 0).getDate();
            const qs2 = new URLSearchParams({ action: 'credit-notes', page: '1', page_size: '5', date_start: `${yy}-${mm}-01T00:00:00Z`, date_end: `${yy}-${mm}-${lastDay}T23:59:59Z` }).toString();
            const res2 = await fetch(`${EDGE_FUNCTION_URL}?${qs2}`, { headers: { ...baseHeaders(), 'x-siigo-token': tk } });
            const raw2 = await res2.text();
            try {
                const j2 = JSON.parse(raw2);
                const total2 = j2.pagination?.total_results ?? '?';
                addLog(`Con date_start mes actual → HTTP ${res2.status} | total_results=${total2}`);
            } catch { addLog(`Con fecha → HTTP ${res2.status}: ${raw2.slice(0, 200)}`); }
        } catch (e: any) { addLog(`🚨 Test NC error: ${e.message}`); }
    };

    // ── Sincronización completa ───────────────────────────────────────────────
    const syncSiigo = async () => {
        let tk = token ?? await authenticate();
        if (!tk) return;
        setLoading(true); setError(null); setSyncLog([]);
        addLog('─── Iniciando Sincronización Siigo ───');
        addLog(`Periodo: ${MONTHS[month-1]} ${year}`);
        try {
            // Mapa de usuarios id→nombre para resolver vendedores por ID
            addLog('Cargando lista de usuarios Siigo...');
            const usersList = await fetchPages(tk, 'users');
            const uMap: Record<string, string> = {};
            usersList.forEach((u: any) => {
                const id = String(u.id ?? u.code ?? '');
                const parts = [u.first_name, u.last_name].filter(Boolean).join(' ');
                const fullName = u.name ?? u.full_name ?? (parts || u.username) ?? `Usuario ${id}`;
                if (id) uMap[id] = fullName;
            });
            addLog(`Usuarios mapeados: ${Object.entries(uMap).slice(0,5).map(([k,v])=>`${k}→${v}`).join(', ')}`);

            setUsersMap(uMap);
            addLog(`Usuarios cargados: ${usersList.length}`);

            // Mapa de centros de costo id→nombre via listado completo
            addLog('Cargando Centros de Costo...');
            const ccList = await fetchPages(tk, 'cost-centers');
            const ccMap: Record<string, string> = {};
            ccList.forEach((cc: any) => {
                const id = String(cc.id ?? cc.code ?? '');
                const name = cc.name ?? cc.description ?? '';
                if (id && name) ccMap[id] = name;
            });
            addLog(`Centros de costo (listado): ${ccList.length}, con nombre: ${Object.keys(ccMap).length}`);

            const lastDay = new Date(year, month, 0).getDate();
            const dateQ = `created_start=${year}-${String(month).padStart(2,'0')}-01&created_end=${year}-${String(month).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;

            // Facturas de venta con detalle de ítems
            addLog('Cargando Facturas de Venta...');
            const rawInv = await fetchPages(tk, 'invoices', dateQ);
            addLog(`Facturas encontradas: ${rawInv.length}. Cargando detalles...`);
            const detailedInv: any[] = [];
            for (let i = 0; i < rawInv.length; i++) {
                addLog(`  Detallando ${i+1}/${rawInv.length}: ${rawInv[i].number ?? rawInv[i].id}`);
                try {
                    const r = await fetch(`${EDGE_FUNCTION_URL}?action=invoice-detail&id=${rawInv[i].id}`, {
                        headers: { ...baseHeaders(), 'x-siigo-token': tk }
                    });
                    detailedInv.push(r.ok ? await r.json() : rawInv[i]);
                } catch { detailedInv.push(rawInv[i]); }
                if (i % 5 === 0) await new Promise(r => setTimeout(r, 80));
            }
            setSiigoInvoices(detailedInv);

            // Buscar nombres de CC por ID individual para los que aún no tenemos nombre
            const uniqueCcIds = [...new Set(
                detailedInv.map(inv => inv.cost_center).filter(v => v != null).map(v => String(typeof v === 'object' ? (v.id ?? v.code ?? '') : v)).filter(Boolean)
            )];
            addLog(`IDs de centros de costo en facturas: ${uniqueCcIds.join(', ') || '(ninguno)'}`);
            for (const ccId of uniqueCcIds) {
                if (ccMap[ccId]) continue; // ya tenemos el nombre del listado
                try {
                    const r = await fetch(`${EDGE_FUNCTION_URL}?action=cost-center-detail&id=${ccId}`, {
                        headers: { ...baseHeaders(), 'x-siigo-token': tk }
                    });
                    if (r.ok) {
                        const cc = await r.json();
                        const name = cc.name ?? cc.description ?? '';
                        if (name) { ccMap[ccId] = name; addLog(`CC ${ccId} → "${name}"`); }
                        else addLog(`CC ${ccId}: sin nombre en respuesta — ${JSON.stringify(cc).slice(0,100)}`);
                    } else {
                        addLog(`CC ${ccId}: HTTP ${r.status}`);
                    }
                } catch (e: any) { addLog(`CC ${ccId}: error ${e.message}`); }
            }
            setCostCentersMap({ ...ccMap });
            addLog(`Centros de costo resueltos: ${Object.keys(ccMap).length}`);

            // Notas de crédito — Usar exactamente el mismo filtro que las facturas (dateQ: created_start / created_end)
            addLog('Cargando Notas de Crédito...');
            let rawCN = await fetchPages(tk, 'credit-notes', dateQ);
            addLog(`Notas de crédito encontradas: ${rawCN.length}. Cargando detalles...`);

            // Los detalles ya vienen en el listado; solo buscamos detalle si faltan items
            const detailedCN: any[] = [];
            for (const cn of rawCN) {
                if (cn.items?.length > 0) { detailedCN.push(cn); continue; }
                try {
                    const r = await fetch(`${EDGE_FUNCTION_URL}?action=credit-note-detail&id=${cn.id}`, {
                        headers: { ...baseHeaders(), 'x-siigo-token': tk }
                    });
                    detailedCN.push(r.ok ? await r.json() : cn);
                } catch { detailedCN.push(cn); }
            }
            setSiigoCreditNotes(detailedCN);
            addLog(`Notas de crédito cargadas: ${detailedCN.length}`);

            // Facturas de compra → mapa de costos por código (último costo)
            addLog('Cargando Historial de Compras (últimos 365 días)...');
            // Calculamos 1 año atrás desde la fecha de corte para encontrar compras antiguas
            const dateRef = new Date(year, month - 1, lastDay);
            const dateStart = new Date(dateRef);
            dateStart.setDate(dateStart.getDate() - 365);
            
            const pStart = dateStart.toISOString().split('T')[0];
            const pEnd   = dateRef.toISOString().split('T')[0];
            const pq = `date_start=${pStart}&date_end=${pEnd}`;
            const [purchases, bills, supportDocs] = await Promise.all([
                fetchPages(tk, 'purchases', pq),
                fetchPages(tk, 'bills', pq),
                fetchPages(tk, 'purchase-support-documents', pq),
            ]);
            
            // Ordenamos de la compra más reciente a la más antigua
            const allPurchases = [...purchases, ...bills, ...supportDocs].sort((a, b) => {
                const dA = new Date(a.date ?? a.created_at ?? 0).getTime();
                const dB = new Date(b.date ?? b.created_at ?? 0).getTime();
                return dB - dA;
            });
            addLog(`Documentos de compra encontrados en el año: ${allPurchases.length}. Detallando los más recientes...`);
            
            // Construir mapa código → costo unitario (tomar estrictamente el ÚLTIMO costo)
            const costs: Record<string, number> = {};
            const costsByDesc: Record<string, number> = {};
            
            const registerCost = (item: any) => {
                const c = String(item.code || item.product_code || '').trim();
                const rawDesc = String(item.description || '').trim().toLowerCase();
                // Normalización robusta de tildes
                const d = rawDesc.replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e').replace(/[íìïî]/g, 'i').replace(/[óòöô]/g, 'o').replace(/[úùüû]/g, 'u');
                
                let price = Number(item.price ?? item.unit_price ?? item.value ?? 0);

                // EXCEPCIÓN: Servicios y logística (forzar a $0)
                const keywords = ['flete', 'envio', 'visita tecnica', 'mensajer', 'transporte', 'domicilio'];
                const isExcluded = ['6035', '9289'].includes(c) || keywords.some(k => d.includes(k));
                
                if (isExcluded) {
                    if (c) costs[c] = 0;
                    if (d) costsByDesc[d] = 0;
                    // Log silencioso solo la primera vez que lo bloqueamos
                    if (c && costs[c] === 0) { /* ya bloqueado */ } 
                    return;
                }

                if (price <= 0) return;

                // Regla simple: El primero que encontremos (el más nuevo) gana
                if (c && costs[c] === undefined) costs[c] = price;
                if (d && costsByDesc[d] === undefined) costsByDesc[d] = price;
            };

            // Heurística: Algunos documentos ya traen ítems en la lista inicial
            allPurchases.forEach((p: any) => {
                (p.items ?? []).forEach(registerCost);
            });

            // Detallado profundo (top 200 para cubrir todo el periodo)
            const docsToDetail = allPurchases.slice(0, 200);
            
            for (let i = 0; i < docsToDetail.length; i++) {
                const doc = docsToDetail[i];
                let detailAction = 'purchase-detail';
                
                if (supportDocs.some((sd: any) => sd.id === doc.id)) detailAction = 'purchase-support-document-detail';
                else if (bills.some((b: any) => b.id === doc.id)) detailAction = 'bill-detail';

                // Solo detallamos si no hemos encontrado todos los costos (opcional, por ahora detallamos todos los top 200)
                try {
                    const r = await fetch(`${EDGE_FUNCTION_URL}?action=${detailAction}&id=${doc.id}`, {
                        headers: { ...baseHeaders(), 'x-siigo-token': tk }
                    });
                    if (r.ok) {
                        const fullDoc = await r.json();
                        (fullDoc.items ?? []).forEach(registerCost);
                    }
                } catch (e: any) {
                    addLog(`  Error detallando ${doc.id}: ${e.message}`);
                }
                
                // Concurrencia leve: pausa cada 10 docs para no saturar
                if (i % 10 === 0) await new Promise(r => setTimeout(r, 50));
            }

            setProductCosts(costs);
            // Guardamos también el mapa de descripciones en un estado para usarlo en processReport
            // (Necesitaremos agregar setProductCostsByDesc al componente)
            (window as any)._costsByDesc = costsByDesc; // Fallback rápido
            addLog(`Códigos con costo: ${Object.keys(costs).length}. Descripciones con costo: ${Object.keys(costsByDesc).length}`);

            // Notas débito
            addLog('Cargando Notas Débito...');
            const debitNotes = await fetchPages(tk, 'debit-notes', dateQ);
            addLog(`Notas débito: ${debitNotes.length}`);

            setDiagInfo({
                invoices: detailedInv.length, creditNotes: detailedCN.length,
                purchases: allPurchases.length, supportDocs: supportDocs.length,
                debitNotes: debitNotes.length,
                lastSync: new Date().toLocaleTimeString(),
                firstCN: detailedCN[0] ?? null,
            });
            addLog('✅ Sincronización completada.');
        } catch (e: any) {
            addLog(`🚨 ERROR: ${e.message}`);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    const getSeller = (doc: any): { id: string; name: string } => {
        // Resolver nombre: mapa manual tiene prioridad sobre API lookup
        const resolveCCName = (id: string) =>
            manualCCMap[id] ?? costCentersMap[id] ?? null;

        const cc = doc.cost_center;
        if (cc != null) {
            if (typeof cc === 'object') {
                const id = String(cc.id ?? cc.code ?? '');
                const name = cc.name ?? resolveCCName(id) ?? (id ? `CC-${id}` : null);
                if (id && name) return { id, name };
            } else {
                const id = String(cc);
                const name = resolveCCName(id) ?? `CC-${id}`;
                return { id, name };
            }
        }
        // Fallback: campo seller/user
        const raw = doc.seller ?? doc.user ?? doc.salesperson ?? doc.seller_id ?? doc.user_id;
        if (raw != null) {
            if (typeof raw === 'object') {
                const id = String(raw.id ?? raw.code ?? '');
                const name = raw.name ?? raw.full_name ?? manualCCMap[id] ?? usersMap[id] ?? `Vendedor ${id}`;
                if (id) return { id, name };
            } else {
                const id = String(raw);
                const name = manualCCMap[id] ?? usersMap[id] ?? `Vendedor ${id}`;
                return { id, name };
            }
        }
        return { id: 'sin_vendedor', name: 'Sin Vendedor' };
    };

    const getClient = (doc: any): string => {
        const c = doc.customer ?? doc.client ?? doc.buyer;
        if (!c) return '—';
        return c.name ?? c.commercial_name ?? c.social_reason ?? c.business_name ?? String(c.identification ?? '—');
    };

    const lineTotal = (item: any): number => {
        const qty = Number(item.quantity ?? 1);
        const price = Number(item.price ?? item.unit_price ?? 0);
        const disc = Number(item.discount ?? 0);
        return Math.round(price * qty * (1 - disc / 100) * 100) / 100;
    };

    // ── Resumen por vendedor ──────────────────────────────────────────────────
    const getVendedorSummary = (): VendedorRow[] => {
        const map: Record<string, VendedorRow> = {};
        const get = (id: string, name: string): VendedorRow => {
            if (!map[id]) map[id] = {
                id, name,
                ventasBruto: 0, devoluciones: 0, ventasNetas: 0,
                costos: 0, utilidad: 0, comision: 0,
                countFacturas: 0, countDevoluciones: 0,
            };
            return map[id];
        };

        // Facturas de venta
        // Construimos también un índice number→vendedorId para que las notas crédito
        // puedan encontrar al vendedor correcto aunque la nota no tenga cost_center
        const invByNumber: Record<string, string> = {};
        siigoInvoices.forEach(inv => {
            const { id, name } = getSeller(inv);
            const row = get(id, name);
            row.countFacturas++;
            const num = String(inv.number ?? inv.id ?? '');
            if (num) invByNumber[num] = id;
            (inv.items ?? []).forEach((item: any) => {
                const venta = lineTotal(item);
                const c = String(item.code || '').trim();
                const d = String(item.description || '').trim().toLowerCase().replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e').replace(/[íìïî]/g, 'i').replace(/[óòöô]/g, 'o').replace(/[úùüû]/g, 'u');
                
                // CINTURON DE SEGURIDAD: Forzar 0 si es servicio/logística
                const isSvc = ['6035', '9289'].includes(c) || d.includes('flete') || d.includes('envio') || d.includes('mensajer') || d.includes('visita tecnica');
                const uCost = isSvc ? 0 : (productCosts[c] ?? (window as any)._costsByDesc?.[d] ?? 0);
                
                const costo = uCost * Number(item.quantity ?? 1);
                row.ventasBruto += venta;
                row.costos += costo;
            });
        });

        // Notas de crédito (descuentan ventas y costos del vendedor de la factura original)
        // Siigo devuelve cn.invoice = {id, name} apuntando a la factura original
        const invById: Record<string, string> = {};
        siigoInvoices.forEach(inv => { if (inv.id) invById[String(inv.id)] = getSeller(inv).id; });

            siigoCreditNotes.forEach(cn => {
                const refId  = String(cn.invoice?.id ?? '');
                const refNum = String(cn.invoice?.name ?? cn.document?.number ?? cn.invoice_number ?? cn.number ?? '');
                const refVendorId = invById[refId] ?? invByNumber[refNum];
                const { id: cnId, name: cnName } = getSeller(cn);
                const vendorId = refVendorId ?? cnId;
                const vendorName = refVendorId ? (map[refVendorId]?.name ?? cnName) : cnName;

                const row = map[vendorId] ?? get(vendorId, vendorName);
                row.countDevoluciones++;
                (cn.items ?? []).forEach((item: any) => {
                    const devol = Math.abs(lineTotal(item));
                    const c = String(item.code || '').trim();
                    const d = String(item.description || '').trim().toLowerCase().replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e').replace(/[íìïî]/g, 'i').replace(/[óòöô]/g, 'o').replace(/[úùüû]/g, 'u');
                    
                    const isSvc = ['6035', '9289'].includes(c) || d.includes('flete') || d.includes('envio') || d.includes('mensajer') || d.includes('visita tecnica');
                    const uCost = isSvc ? 0 : (productCosts[c] ?? (window as any)._costsByDesc?.[d] ?? 0);
                    
                    const costo = uCost * Math.abs(Number(item.quantity ?? 1));
                    row.devoluciones += devol;
                    row.costos -= costo;
                });
            });

        // Notas crédito ingresadas manualmente para este periodo
        manualNCs.filter(nc => nc.month === month && nc.year === year).forEach(nc => {
            const row = map[nc.vendedorId] ?? get(nc.vendedorId, nc.vendedorName);
            row.countDevoluciones++;
            row.devoluciones += nc.amount;
        });

        return Object.values(map)
            .map(r => {
                const ventasNetas = r.ventasBruto - r.devoluciones;
                const utilidad = ventasNetas - r.costos;
                return { ...r, ventasNetas, utilidad, comision: Math.round(utilidad * 0.10 * 100) / 100 };
            })
            .filter(r => selectedVendedor ? r.id === selectedVendedor : true)
            .sort((a, b) => b.utilidad - a.utilidad);
    };

    // ── Detalle línea a línea ─────────────────────────────────────────────────
    const getLineas = (): LineaDetalle[] => {
        const lines: LineaDetalle[] = [];

        siigoInvoices.forEach(inv => {
            const { id: vid, name: vname } = getSeller(inv);
            if (selectedVendedor && vid !== selectedVendedor) return;
            const cliente = getClient(inv);
            const num = inv.number ?? inv.id ?? '—';
            const fecha = inv.date ? new Date(inv.date).toLocaleDateString('es-CO') : '—';
            (inv.items ?? []).forEach((item: any) => {
                const qty = Number(item.quantity ?? 1);
                const price = Number(item.price ?? item.unit_price ?? 0);
                const disc = Number(item.discount ?? 0);
                const totalV = Math.round(price * qty * (1 - disc / 100) * 100) / 100;
                const c = String(item.code || '').trim();
                const d = String(item.description || '').trim().toLowerCase().replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e').replace(/[íìïî]/g, 'i').replace(/[óòöô]/g, 'o').replace(/[úùüû]/g, 'u');
                const isSvc = ['6035', '9289'].includes(c) || d.includes('flete') || d.includes('envio') || d.includes('mensajer') || d.includes('visita tecnica');
                const unitCost = isSvc ? 0 : (productCosts[c] ?? (window as any)._costsByDesc?.[d] ?? 0);
                const totalC = Math.round(unitCost * qty * 100) / 100;
                lines.push({
                    vendedorId: vid, vendedorName: vname,
                    facturaNum: num, facturaFecha: fecha, clienteNombre: cliente,
                    code: item.code ?? '—', description: item.description ?? '—',
                    quantity: qty, unitPrice: price, totalVenta: totalV,
                    unitCost, totalCosto: totalC,
                    utilidad: Math.round((totalV - totalC) * 100) / 100,
                    esDevolucion: false,
                });
            });
        });

        siigoCreditNotes.forEach(cn => {
            const { id: vid, name: vname } = getSeller(cn);
            if (selectedVendedor && vid !== selectedVendedor) return;
            const cliente = getClient(cn);
            const num = cn.number ?? cn.id ?? '—';
            const fecha = cn.date ? new Date(cn.date).toLocaleDateString('es-CO') : '—';
            (cn.items ?? []).forEach((item: any) => {
                const qty = Number(item.quantity ?? 1);
                const price = Number(item.price ?? item.unit_price ?? 0);
                const disc = Number(item.discount ?? 0);
                const totalV = Math.round(price * qty * (1 - disc / 100) * 100) / 100;
                const c = String(item.code || '').trim();
                const d = String(item.description || '').trim().toLowerCase().replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e').replace(/[íìïî]/g, 'i').replace(/[óòöô]/g, 'o').replace(/[úùüû]/g, 'u');
                const isSvc = ['6035', '9289'].includes(c) || d.includes('flete') || d.includes('envio') || d.includes('mensajer') || d.includes('visita tecnica');
                const unitCost = isSvc ? 0 : (productCosts[c] ?? (window as any)._costsByDesc?.[d] ?? 0);
                const totalC = Math.round(unitCost * qty * 100) / 100;
                lines.push({
                    vendedorId: vid, vendedorName: vname,
                    facturaNum: num, facturaFecha: fecha, clienteNombre: cliente,
                    code: item.code ?? '—', description: item.description ?? '—',
                    quantity: qty, unitPrice: price, totalVenta: -totalV,
                    unitCost, totalCosto: -totalC,
                    utilidad: -Math.round((totalV - totalC) * 100) / 100,
                    esDevolucion: true,
                });
            });
        });

        return lines;
    };

    // ── Vendedores únicos para el filtro ──────────────────────────────────────
    const vendedoresUnicos = Array.from(
        new Map(siigoInvoices.map(inv => {
            const { id, name } = getSeller(inv);
            return [id, { id, name }];
        })).values()
    ).sort((a, b) => a.name.localeCompare(b.name));

    // ── Resumen local CRM ─────────────────────────────────────────────────────
    const getLocalSummary = () => {
        const mp = `${year}-${String(month).padStart(2,'0')}`;
        const s: Record<string, { name: string; utility: number; commission: number; salesCount: number }> = {};
        const add = (name: string, util: number) => {
            if (!s[name]) s[name] = { name, utility: 0, commission: 0, salesCount: 0 };
            s[name].utility += util; s[name].salesCount++;
        };
        despachos.filter(d => d?.facturado && d.fechaFacturado?.startsWith(mp)).forEach(d => {
            const q = cotizaciones.find(c => c.id === d.cotizacionId || c.consecutivo === d.consecutivoCotizacion);
            let util = 0;
            if (q) {
                const qi = [...q.items];
                d.items.forEach(di => {
                    const idx = qi.findIndex(x => (x.productoId && x.productoId === di.productoId) || (x.id && x.id === di.productoId));
                    if (idx >= 0) {
                        const it = qi.splice(idx, 1)[0];
                        let sp = Number(it.precioVenta ?? 0);
                        const cp = Number(it.costoUnitario ?? 0);
                        const mg = Number(it.utilidad ?? 0);
                        if (sp <= 0 && mg > 0 && mg < 100) sp = cp / (1 - mg / 100);
                        util += (sp - cp) * di.cantidad;
                    }
                });
            } else util = Number(d.total ?? 0) * 0.15;
            add(q?.ejecutivo ?? 'Desconocido', Math.round(util * 100) / 100);
        });
        ventasManuales.filter(v => v?.fecha?.startsWith(mp)).forEach(v => add(v.usuarioNombre ?? 'Desconocido', Number(v.monto ?? 0) - Number(v.costo ?? 0)));
        alquileres.filter(a => a?.estado === 'Alquilado').forEach(a => {
            const u = users.find(u => u.id === a.usuarioId);
            add(u?.nombre ?? 'Desconocido', Number(a.valorMensual ?? 0));
        });
        return Object.values(s)
            .map(r => ({ ...r, commission: Math.round(r.utility * 0.10 * 100) / 100 }))
            .filter(r => {
                const u = users.find(u => u.nombre.toLowerCase() === r.name.toLowerCase());
                if (!u) return false;
                const c = (u.cargo ?? '').toLowerCase(), rl = (u.rol ?? '').toLowerCase();
                return c.includes('comercial') || c.includes('ejecutiv') || c.includes('gerente') || c.includes('ventas') || c.includes('asesor') || rl === 'comercial';
            })
            .filter(r => selectedComercial ? r.name === selectedComercial : true);
    };

    const generatePDF = async () => {
        setLoading(true);
        try {
            const { jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');
            const doc = new jsPDF({ orientation: 'landscape' });
            const period = `${MONTHS[month-1]} ${year}`;

            if (siigoSubTab === 'resumen') {
                const summary = getVendedorSummary();
                const totals = summary.reduce((a, r) => ({
                    v: a.v + r.ventasNetas, c: a.c + r.costos, u: a.u + r.utilidad, cm: a.cm + r.comision
                }), { v: 0, c: 0, u: 0, cm: 0 });

                doc.setFontSize(16); doc.text('Reporte de Comisiones por Vendedor — Siigo', 14, 18);
                doc.setFontSize(11); doc.text(`Periodo: ${period}  |  Fecha: ${new Date().toLocaleDateString('es-CO')}`, 14, 27);
                // @ts-ignore
                autoTable(doc, {
                    startY: 33,
                    head: [['Vendedor', '# Facturas', 'Ventas Brutas', 'Devoluciones', 'Ventas Netas', 'Costos', 'Utilidad', 'Comisión 10%']],
                    body: summary.map(r => [
                        r.name, r.countFacturas,
                        fmt(r.ventasBruto), fmt(r.devoluciones), fmt(r.ventasNetas),
                        fmt(r.costos), fmt(r.utilidad), fmt(r.comision),
                    ]),
                    foot: [['TOTALES', '', '', '', fmt(totals.v), fmt(totals.c), fmt(totals.u), fmt(totals.cm)]],
                    theme: 'grid',
                    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
                    footStyles: { fillColor: [241, 245, 249], fontStyle: 'bold' },
                    styles: { fontSize: 8 },
                });
                doc.save(`Comisiones_Vendedores_${month}_${year}.pdf`);
            } else {
                // Detalle por línea
                const lines = getLineas();
                doc.setFontSize(16); doc.text('Detalle de Comisiones por Línea — Siigo', 14, 18);
                doc.setFontSize(11); doc.text(`Periodo: ${period}  |  Fecha: ${new Date().toLocaleDateString('es-CO')}`, 14, 27);
                
                // Group lines by vendedorId
                const grouped: Record<string, {name: string, lines: LineaDetalle[]}> = {};
                lines.forEach(l => {
                    if (!grouped[l.vendedorId]) grouped[l.vendedorId] = { name: l.vendedorName, lines: [] };
                    grouped[l.vendedorId].lines.push(l);
                });

                let currentY = 33;
                
                Object.values(grouped).sort((a,b) => a.name.localeCompare(b.name)).forEach((group) => {
                    // Check if we need a page break before starting a new group
                    if (currentY > 170) {
                        doc.addPage();
                        currentY = 20;
                    }
                    doc.setFontSize(12);
                    doc.setFont("helvetica", "bold");
                    doc.text(`Comercial: ${group.name}`, 14, currentY);
                    
                    const groupTotals = group.lines.reduce((acc, l) => {
                        acc.totalVenta += l.totalVenta;
                        acc.totalCosto += l.totalCosto;
                        acc.utilidad += l.utilidad;
                        return acc;
                    }, { totalVenta: 0, totalCosto: 0, utilidad: 0 });

                    // @ts-ignore
                    autoTable(doc, {
                        startY: currentY + 4,
                        head: [['Factura', 'Fecha', 'Cliente', 'Código', 'Desc.', 'Cant.', 'Vr. Venta', 'Vr. Costo', 'Utilidad', 'Tipo']],
                        body: group.lines.map(l => [
                            l.facturaNum, l.facturaFecha, l.clienteNombre.length > 25 ? l.clienteNombre.substring(0, 25) + '...' : l.clienteNombre, 
                            l.code, l.description.length > 30 ? l.description.substring(0, 30) + '...' : l.description, l.quantity,
                            fmt(l.totalVenta), fmt(l.totalCosto), fmt(l.utilidad),
                            l.esDevolucion ? 'DEV' : 'VTA'
                        ]),
                        foot: [['TOTAL', '', '', '', '', '', fmt(groupTotals.totalVenta), fmt(groupTotals.totalCosto), fmt(groupTotals.utilidad), '']],
                        theme: 'grid',
                        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
                        footStyles: { fillColor: [241, 245, 249], fontStyle: 'bold' },
                        styles: { fontSize: 7, cellPadding: 2 },
                        columnStyles: {
                            0: { cellWidth: 20 },
                            1: { cellWidth: 20 },
                            2: { cellWidth: 45 },
                            3: { cellWidth: 25 },
                            4: { cellWidth: 55 },
                        }
                    });
                    // @ts-ignore
                    currentY = (doc as any).lastAutoTable.finalY + 15;
                });
                
                doc.save(`Comisiones_Detalle_${month}_${year}.pdf`);
            }
        } catch (e: any) { alert('Error PDF: ' + e.message); }
        finally { setLoading(false); }
    };

    // ── Export CSV (abre en Excel) ────────────────────────────────────────────
    const exportCSV = (mode: 'resumen' | 'detalle') => {
        const period = `${MONTHS[month-1]}_${year}`;
        const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const num = (n: number) => Math.round(n);

        let csv = '';
        if (mode === 'resumen') {
            const rows = getVendedorSummary();
            csv = [
                ['Vendedor', 'Facturas', 'Devoluciones', 'Ventas Brutas', 'Notas Crédito', 'Ventas Netas', 'Costos Compra', 'Utilidad', 'Comisión 10%'].map(esc).join(';'),
                ...rows.map(r => [r.name, r.countFacturas, r.countDevoluciones, num(r.ventasBruto), num(r.devoluciones), num(r.ventasNetas), num(r.costos), num(r.utilidad), num(r.comision)].map(esc).join(';')),
            ].join('\n');
        } else {
            const lines = getLineas();
            csv = [
                ['Vendedor', 'Factura', 'Fecha', 'Cliente', 'Código', 'Descripción', 'Cantidad', 'Precio Unit.', 'Total Venta', 'Costo Unit.', 'Total Costo', 'Utilidad', 'Tipo'].map(esc).join(';'),
                ...lines.map(l => [l.vendedorName, l.facturaNum, l.facturaFecha, l.clienteNombre, l.code, l.description, l.quantity, num(l.unitPrice), num(l.totalVenta), num(l.unitCost), num(l.totalCosto), num(l.utilidad), l.esDevolucion ? 'DEVOLUCIÓN' : 'VENTA'].map(esc).join(';')),
            ].join('\n');
        }

        const bom = '﻿'; // BOM para UTF-8 en Excel
        const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `Comisiones_${mode}_${period}.csv`;
        a.click(); URL.revokeObjectURL(url);
    };

    // ── Cálculo de totales ────────────────────────────────────────────────────
    const summary = getVendedorSummary();
    const totals = summary.reduce((a, r) => ({
        bruto: a.bruto + r.ventasBruto,
        devoluciones: a.devoluciones + r.devoluciones,
        netas: a.netas + r.ventasNetas,
        costos: a.costos + r.costos,
        utilidad: a.utilidad + r.utilidad,
        comision: a.comision + r.comision,
    }), { bruto: 0, devoluciones: 0, netas: 0, costos: 0, utilidad: 0, comision: 0 });

    const lineas = getLineas();

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="module-container" id="comisiones-module">
            {/* Header */}
            <div className="module-header">
                <div>
                    <h2>Módulo de Comisiones</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Siigo — agrupado por Vendedor · Utilidad = Ventas Netas − Costos de Compra</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button onClick={() => setShowDiag(v => !v)} className="btn-secondary" style={{ border: '1px solid #cbd5e1', color: '#64748b' }}>
                        {showDiag ? '✕ Cerrar Diag' : '🔍 Diag'}
                    </button>
                    {mainTab === 'siigo' && (
                        <>
                            <button onClick={generatePDF} className="btn-secondary" style={{ border: '1px solid var(--primary-blue)', color: 'var(--primary-blue)' }}>
                                📄 PDF
                            </button>
                            <button onClick={() => exportCSV(siigoSubTab === 'detalle' ? 'detalle' : 'resumen')} className="btn-secondary" style={{ border: '1px solid #16a34a', color: '#16a34a' }}>
                                📊 Excel
                            </button>
                            <button onClick={syncSiigo} disabled={loading} className="btn-success">
                                {loading ? '⏳ Sincronizando...' : '🔄 Sincronizar Siigo'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Diagnóstico */}
            {showDiag && (
                <div className="card" style={{ marginBottom: '1.5rem', background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                    <h4 style={{ margin: '0 0 1rem' }}>Panel de Diagnóstico</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        {[
                            { label: 'Token', val: token ? '✅ ACTIVO' : '❌ INACTIVO', color: token ? '#22c55e' : '#ef4444' },
                            { label: 'Fact. Venta', val: diagInfo.invoices },
                            { label: 'N. Crédito', val: diagInfo.creditNotes },
                            { label: 'Fact. Compra', val: diagInfo.purchases },
                            { label: 'Doc. Soporte', val: diagInfo.supportDocs || 0 },
                            { label: 'N. Débito', val: diagInfo.debitNotes },
                            { label: 'Última Sync', val: diagInfo.lastSync || 'N/A' },
                        ].map(({ label, val, color }) => (
                            <div key={label}><small style={{ color: '#64748b', display: 'block' }}>{label}</small><span style={{ fontWeight: 700, color: color ?? '#1e293b' }}>{String(val)}</span></div>
                        ))}
                    </div>
                    <div style={{ background: '#0f172a', padding: '0.75rem', borderRadius: 6, fontFamily: 'monospace', color: '#4ade80', fontSize: '0.75rem', maxHeight: 200, overflowY: 'auto' }}>
                        {syncLog.length ? syncLog.map((l, i) => <div key={i}>{l}</div>) : '> Esperando sincronización...'}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        <button onClick={testCreditNotes} style={{ padding: '4px 12px', background: 'none', border: '1px solid #7c3aed', borderRadius: 6, color: '#7c3aed', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                            🔬 Probar NC directo
                        </button>
                        <button onClick={openCCEditor} style={{ padding: '4px 12px', background: 'none', border: '1px solid #0891b2', borderRadius: 6, color: '#0891b2', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                            👥 Centros de Costo ({Object.keys(manualCCMap).length})
                        </button>
                    </div>

                    {/* Editor de centros de costo */}
                    {showCCEditor && (
                        <div style={{ marginTop: '0.75rem', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '0.75rem' }}>
                            <strong style={{ fontSize: '0.85rem', color: '#0369a1' }}>👥 Mapa Centros de Costo — formato: ID=Nombre (uno por línea)</strong>
                            <textarea
                                value={ccEditText}
                                onChange={e => setCCEditText(e.target.value)}
                                style={{ width: '100%', minHeight: 140, fontFamily: 'monospace', fontSize: '0.82rem', marginTop: '0.5rem', padding: '0.5rem', border: '1px solid #7dd3fc', borderRadius: 6, resize: 'vertical', boxSizing: 'border-box' }}
                                placeholder="14146=Deicy Rodriguez&#10;15087=Lidy Hernandez"
                            />
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                                <button onClick={saveCCEditor} style={{ padding: '4px 14px', background: '#0891b2', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>
                                    💾 Guardar
                                </button>
                                <button onClick={() => setShowCCEditor(false)} style={{ padding: '4px 12px', background: 'none', border: '1px solid #94a3b8', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem' }}>
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}
                    {siigoInvoices[0] && (
                        <>
                            <div style={{ marginTop: '0.75rem', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 6, padding: '0.6rem 1rem', fontSize: '0.8rem' }}>
                                <strong>🔎 Campos vendedor en primera factura:</strong>
                                <code style={{ display: 'block', marginTop: '0.25rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                                    {['cost_center','seller','user','salesperson','seller_id','user_id','created_by','document_user','observations']
                                        .filter(k => siigoInvoices[0][k] !== undefined)
                                        .map(k => `${k}: ${JSON.stringify(siigoInvoices[0][k])}`)
                                        .join('\n') || '⚠️ Ningún campo conocido encontrado. Ver JSON completo abajo.'}
                                </code>
                            </div>
                            <details style={{ marginTop: '0.5rem' }}>
                                <summary style={{ cursor: 'pointer', fontSize: '0.8rem', color: '#1e40af', fontWeight: 700 }}>🔍 JSON completo primera factura</summary>
                                <pre style={{ fontSize: '0.7rem', marginTop: '0.5rem', overflow: 'auto', maxHeight: 250 }}>
                                    {JSON.stringify(siigoInvoices[0], (k, v) => k === 'items' ? `[${v?.length ?? 0} ítems]` : v, 2)}
                                </pre>
                            </details>
                        </>
                    )}
                    {diagInfo.firstCN ? (
                        <>
                            <div style={{ marginTop: '0.75rem', background: '#fce7f3', border: '1px solid #f9a8d4', borderRadius: 6, padding: '0.6rem 1rem', fontSize: '0.8rem' }}>
                                <strong>🔎 Primera Nota Crédito — campos clave:</strong>
                                <code style={{ display: 'block', marginTop: '0.25rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                                    {['number','document','invoice_number','number_document','reference','cost_center','items']
                                        .filter(k => diagInfo.firstCN[k] !== undefined)
                                        .map(k => `${k}: ${JSON.stringify(diagInfo.firstCN[k])}`)
                                        .join('\n') || '⚠️ Campos esperados no encontrados.'}
                                </code>
                            </div>
                            <details style={{ marginTop: '0.5rem' }}>
                                <summary style={{ cursor: 'pointer', fontSize: '0.8rem', color: '#be185d', fontWeight: 700 }}>🔍 JSON completo primera nota crédito</summary>
                                <pre style={{ fontSize: '0.7rem', marginTop: '0.5rem', overflow: 'auto', maxHeight: 250 }}>
                                    {JSON.stringify(diagInfo.firstCN, (k, v) => k === 'items' ? `[${v?.length ?? 0} ítems]` : v, 2)}
                                </pre>
                            </details>
                        </>
                    ) : (
                        <div style={{ marginTop: '0.75rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, padding: '0.6rem 1rem', fontSize: '0.8rem', color: '#b91c1c' }}>
                            ⚠️ <strong>No se encontraron Notas Crédito</strong> en el periodo seleccionado. Verifica que el mes/año sea correcto y que la edge function soporte el endpoint <code>credit-notes</code>.
                        </div>
                    )}
                </div>
            )}

            {/* Filtros */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                    <div>
                        <label>Mes</label>
                        <select className="input-field" value={month} onChange={e => setMonth(Number(e.target.value))}>
                            {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label>Año</label>
                        <select className="input-field" value={year} onChange={e => setYear(Number(e.target.value))}>
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    {mainTab === 'siigo' && vendedoresUnicos.length > 0 && (
                        <div>
                            <label>Vendedor</label>
                            <select className="input-field" value={selectedVendedor} onChange={e => setSelectedVendedor(e.target.value)}>
                                <option value="">Todos</option>
                                {vendedoresUnicos.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                    )}
                    {mainTab === 'local' && (
                        <div>
                            <label>Asesor</label>
                            <select className="input-field" value={selectedComercial} onChange={e => setSelectedComercial(e.target.value)}>
                                <option value="">Todos</option>
                                {getLocalSummary().map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs principales */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '2px solid var(--border-color)' }}>
                {([['siigo','🌐 Siigo'], ['local','🏠 CRM Local']] as [MainTab, string][]).map(([id, label]) => (
                    <button key={id} onClick={() => setMainTab(id)}
                        style={{ background: 'none', border: 'none', padding: '0.6rem 1.25rem', cursor: 'pointer', fontWeight: mainTab === id ? 700 : 500, color: mainTab === id ? 'var(--primary-blue)' : 'var(--text-muted)', borderBottom: mainTab === id ? '3px solid var(--primary-blue)' : '3px solid transparent', fontSize: '0.9rem' }}>
                        {label}
                    </button>
                ))}
            </div>

            {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem', border: '1px solid #fecaca' }}>{error}</div>}

            {/* ── TAB SIIGO ── */}
            {mainTab === 'siigo' && (
                <>
                    {/* Sub-tabs */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                        {([
                            ['resumen', '📊 Resumen por Vendedor', '#8b5cf6'],
                            ['detalle', '📋 Detalle por Línea',    '#0ea5e9'],
                        ] as [SiigoSubTab, string, string][]).map(([id, label, color]) => (
                            <button key={id} onClick={() => setSiigoSubTab(id)}
                                style={{ padding: '0.4rem 1rem', borderRadius: 8, cursor: 'pointer', fontWeight: siigoSubTab === id ? 700 : 500, fontSize: '0.82rem', background: siigoSubTab === id ? `${color}22` : 'transparent', border: `1px solid ${siigoSubTab === id ? color : 'var(--border-color)'}`, color: siigoSubTab === id ? color : 'var(--text-muted)' }}>
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* ─── Notas Crédito Manuales ─── */}
                    {siigoInvoices.length > 0 && (
                        <div className="card" style={{ marginBottom: '1.25rem', border: '1px solid #fda4af', background: '#fff1f2' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '1.1rem' }}>📋</span>
                                <strong style={{ color: '#be123c' }}>Notas Crédito Manuales</strong>
                                <span style={{ fontSize: '0.75rem', color: '#9f1239', background: '#ffe4e6', padding: '1px 8px', borderRadius: 4, border: '1px solid #fda4af' }}>
                                    {manualNCs.filter(n => n.month === month && n.year === year).length} ingresadas este periodo
                                </span>
                            </div>

                            {/* Formulario */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 160px auto', gap: '0.5rem', alignItems: 'end', marginBottom: '0.75rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 2 }}>Vendedor</label>
                                    <select className="input-field" value={ncForm.vendedorId} onChange={e => setNcForm(f => ({ ...f, vendedorId: e.target.value }))}>
                                        <option value="">— Seleccionar —</option>
                                        {vendedoresUnicos.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 2 }}>N° Nota (ej: NC-2-379)</label>
                                    <input className="input-field" placeholder="NC-2-379" value={ncForm.ncNum} onChange={e => setNcForm(f => ({ ...f, ncNum: e.target.value }))} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: 2 }}>Monto sin IVA</label>
                                    <input className="input-field" type="number" placeholder="50000" value={ncForm.amount} onChange={e => setNcForm(f => ({ ...f, amount: e.target.value }))} />
                                </div>
                                <button onClick={addManualNC} disabled={!ncForm.vendedorId || !ncForm.amount} className="btn-success" style={{ height: 38, whiteSpace: 'nowrap' }}>
                                    + Agregar
                                </button>
                            </div>

                            {/* Lista de NCs del periodo */}
                            {manualNCs.filter(n => n.month === month && n.year === year).length > 0 && (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                    <thead>
                                        <tr style={{ background: '#ffe4e6' }}>
                                            <th style={{ padding: '4px 8px', textAlign: 'left', fontWeight: 600 }}>Vendedor</th>
                                            <th style={{ padding: '4px 8px', textAlign: 'left', fontWeight: 600 }}>N° Nota</th>
                                            <th style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 600 }}>Monto</th>
                                            <th style={{ padding: '4px 4px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {manualNCs.filter(n => n.month === month && n.year === year).map(nc => (
                                            <tr key={nc.id} style={{ borderTop: '1px solid #fecdd3' }}>
                                                <td style={{ padding: '4px 8px' }}>{nc.vendedorName}</td>
                                                <td style={{ padding: '4px 8px', color: '#be123c', fontWeight: 600 }}>{nc.ncNum || '—'}</td>
                                                <td style={{ padding: '4px 8px', textAlign: 'right', color: '#f43f5e', fontWeight: 700 }}>−{fmt(nc.amount)}</td>
                                                <td style={{ padding: '4px 4px', textAlign: 'center' }}>
                                                    <button onClick={() => deleteManualNC(nc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontWeight: 700, fontSize: '1rem', lineHeight: 1 }} title="Eliminar">×</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {siigoInvoices.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: 12, border: '1px dashed var(--border-color)' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔄</div>
                            <p style={{ fontWeight: 600 }}>No hay datos sincronizados</p>
                            <p style={{ fontSize: '0.875rem' }}>Haz clic en <strong>Sincronizar Siigo</strong> para cargar los movimientos del periodo.</p>
                        </div>
                    )}

                    {/* ─── Sub-tab: Resumen por Vendedor ─── */}
                    {siigoSubTab === 'resumen' && summary.length > 0 && (
                        <>
                            {/* KPIs */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                {[
                                    { label: 'Ventas Brutas', val: fmt(totals.bruto), color: '#10b981' },
                                    { label: 'Devoluciones', val: fmt(totals.devoluciones), color: '#f43f5e' },
                                    { label: 'Ventas Netas', val: fmt(totals.netas), color: '#0ea5e9' },
                                    { label: 'Costos Compra', val: fmt(totals.costos), color: '#f59e0b' },
                                    { label: 'Utilidad Total', val: fmt(totals.utilidad), color: '#8b5cf6' },
                                    { label: 'Comisión 10%', val: fmt(totals.comision), color: '#3b82f6' },
                                ].map(({ label, val, color }) => (
                                    <div key={label} className="card" style={{ padding: '0.85rem', borderTop: `3px solid ${color}` }}>
                                        <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>{label}</small>
                                        <span style={{ fontWeight: 800, fontSize: '1rem', color }}>{val}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="card table-card">
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Vendedor</th>
                                                <th className="num">Facturas</th>
                                                <th className="num">Devoluciones</th>
                                                <th className="num">Ventas Brutas (sin IVA)</th>
                                                <th className="num">Notas Crédito</th>
                                                <th className="num">Ventas Netas</th>
                                                <th className="num">Costos Compra</th>
                                                <th className="num">Utilidad</th>
                                                <th className="num">Margen %</th>
                                                <th className="num">Comisión 10%</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {summary.map(row => {
                                                const mrgn = row.ventasNetas > 0 ? (row.utilidad / row.ventasNetas) * 100 : 0;
                                                return (
                                                <tr key={row.id}>
                                                    <td>
                                                        <strong>{row.name}</strong>
                                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>ID: {row.id}</div>
                                                    </td>
                                                    <td className="num">{row.countFacturas}</td>
                                                    <td className="num">{row.countDevoluciones}</td>
                                                    <td className="num" style={{ color: '#10b981', fontWeight: 600 }}>{fmt(row.ventasBruto)}</td>
                                                    <td className="num" style={{ color: '#f43f5e', fontWeight: 600 }}>{row.devoluciones > 0 ? `−${fmt(row.devoluciones)}` : '—'}</td>
                                                    <td className="num" style={{ color: '#0ea5e9', fontWeight: 700 }}>{fmt(row.ventasNetas)}</td>
                                                    <td className="num" style={{ color: '#f59e0b', fontWeight: 600 }}>{fmt(row.costos)}</td>
                                                    <td className="num" style={{ color: row.utilidad >= 0 ? '#8b5cf6' : '#ef4444', fontWeight: 700 }}>{fmt(row.utilidad)}</td>
                                                    <td className="num" style={{ color: mrgn < 10 ? '#ef4444' : '#10b981', fontWeight: 700 }}>{mrgn.toFixed(2)}%</td>
                                                    <td className="num" style={{ color: '#3b82f6', fontWeight: 800, fontSize: '1.05rem' }}>{fmt(row.comision)}</td>
                                                </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr style={{ background: '#f1f5f9', fontWeight: 800 }}>
                                                <td>TOTALES</td>
                                                <td className="num">{summary.reduce((s,r)=>s+r.countFacturas,0)}</td>
                                                <td className="num">{summary.reduce((s,r)=>s+r.countDevoluciones,0)}</td>
                                                <td className="num" style={{ color: '#10b981' }}>{fmt(totals.bruto)}</td>
                                                <td className="num" style={{ color: '#f43f5e' }}>{totals.devoluciones > 0 ? `−${fmt(totals.devoluciones)}` : '—'}</td>
                                                <td className="num" style={{ color: '#0ea5e9' }}>{fmt(totals.netas)}</td>
                                                <td className="num" style={{ color: '#f59e0b' }}>{fmt(totals.costos)}</td>
                                                <td className="num" style={{ color: '#8b5cf6' }}>{fmt(totals.utilidad)}</td>
                                                <td className="num" style={{ color: (totals.netas > 0 ? (totals.utilidad / totals.netas) * 100 : 0) < 10 ? '#ef4444' : '#10b981' }}>{(totals.netas > 0 ? (totals.utilidad / totals.netas) * 100 : 0).toFixed(2)}%</td>
                                                <td className="num" style={{ color: '#3b82f6' }}>{fmt(totals.comision)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ─── Sub-tab: Detalle por línea ─── */}
                    {siigoSubTab === 'detalle' && lineas.length > 0 && (
                        <div className="card table-card animate-fade-in">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0, color: '#0ea5e9' }}>📋 {lineas.length} líneas de detalle</h3>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    Precio antes de IVA · Costo según última compra por código
                                </span>
                            </div>
                            <div style={{ overflowX: 'auto', maxHeight: 600 }}>
                                <table className="data-table" style={{ fontSize: '0.82rem' }}>
                                    <thead>
                                        <tr>
                                            <th>Vendedor</th>
                                            <th>Factura</th>
                                            <th>Fecha</th>
                                            <th>Cliente</th>
                                            <th>Código</th>
                                            <th>Descripción</th>
                                            <th className="num">Cant.</th>
                                            <th className="num">Precio Unit.</th>
                                            <th className="num">Total Venta</th>
                                            <th className="num">Costo Unit.</th>
                                            <th className="num">Total Costo</th>
                                            <th className="num">Utilidad</th>
                                            <th className="num">Margen %</th>
                                            <th>Tipo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lineas.map((l, i) => {
                                            const mLine = Math.abs(l.totalVenta) > 0 ? (l.utilidad / Math.abs(l.totalVenta)) * 100 : 0;
                                            return (
                                            <tr key={i} style={{ background: l.esDevolucion ? '#fff1f2' : undefined }}>
                                                <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{l.vendedorName}</td>
                                                <td style={{ color: '#0ea5e9', fontWeight: 600 }}>{l.facturaNum}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{l.facturaFecha}</td>
                                                <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.clienteNombre}>{l.clienteNombre}</td>
                                                <td><code style={{ fontSize: '0.78rem', background: '#f1f5f9', padding: '1px 4px', borderRadius: 3 }}>{l.code}</code></td>
                                                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.description}>{l.description}</td>
                                                <td className="num">{l.quantity}</td>
                                                <td className="num">{fmt(l.unitPrice)}</td>
                                                <td className="num" style={{ color: l.esDevolucion ? '#f43f5e' : '#10b981', fontWeight: 600 }}>{fmt(Math.abs(l.totalVenta))}</td>
                                                <td className="num" style={{ color: '#f59e0b' }}>{l.unitCost > 0 ? fmt(l.unitCost) : <span style={{ color: '#94a3b8' }}>N/D</span>}</td>
                                                <td className="num" style={{ color: '#f59e0b' }}>{l.totalCosto !== 0 ? fmt(Math.abs(l.totalCosto)) : <span style={{ color: '#94a3b8' }}>N/D</span>}</td>
                                                <td className="num" style={{ color: l.utilidad >= 0 ? '#8b5cf6' : '#ef4444', fontWeight: 700 }}>{fmt(l.utilidad)}</td>
                                                <td className="num" style={{ color: mLine < 10 ? '#ef4444' : '#10b981', fontWeight: 700 }}>{mLine.toFixed(2)}%</td>
                                                <td>
                                                    <span style={{ background: l.esDevolucion ? '#fee2e2' : '#dcfce7', color: l.esDevolucion ? '#b91c1c' : '#166534', padding: '2px 7px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700 }}>
                                                        {l.esDevolucion ? 'DEVOL.' : 'VENTA'}
                                                    </span>
                                                </td>
                                            </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ background: '#f1f5f9', fontWeight: 800 }}>
                                            <td colSpan={8}>TOTALES</td>
                                            <td className="num" style={{ color: '#10b981' }}>{fmt(lineas.reduce((s,l)=>s+l.totalVenta,0))}</td>
                                            <td></td>
                                            <td className="num" style={{ color: '#f59e0b' }}>{fmt(lineas.reduce((s,l)=>s+l.totalCosto,0))}</td>
                                            <td className="num" style={{ color: '#8b5cf6' }}>{fmt(lineas.reduce((s,l)=>s+l.utilidad,0))}</td>
                                            {(() => {
                                                const sumV = lineas.reduce((s,l)=>s+Math.abs(l.totalVenta),0);
                                                const sumU = lineas.reduce((s,l)=>s+l.utilidad,0);
                                                const mT = sumV > 0 ? (sumU / sumV) * 100 : 0;
                                                return <td className="num" style={{ color: mT < 10 ? '#ef4444' : '#10b981' }}>{mT.toFixed(2)}%</td>;
                                            })()}
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ── TAB LOCAL CRM ── */}
            {mainTab === 'local' && (
                <div className="card table-card animate-fade-in">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Asesor Comercial</th>
                                <th className="num">N° Ventas</th>
                                <th className="num">Utilidad</th>
                                <th className="num">Comisión 10%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getLocalSummary().length === 0 ? (
                                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>No hay datos para este periodo.</td></tr>
                            ) : getLocalSummary().map((row, i) => (
                                <tr key={i}>
                                    <td><strong>{row.name}</strong></td>
                                    <td className="num">{row.salesCount}</td>
                                    <td className="num" style={{ color: 'var(--success)', fontWeight: 700 }}>{fmt(row.utility)}</td>
                                    <td className="num" style={{ color: 'var(--primary-blue)', fontWeight: 800, fontSize: '1.05rem' }}>{fmt(row.commission)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <style>{`
                #comisiones-module .num { text-align: right; }
                #comisiones-module .data-table tfoot td { font-weight: 800; }
            `}</style>
        </div>
    );
};

export default ComisionesModule;
