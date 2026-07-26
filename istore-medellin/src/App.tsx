import { useState, useMemo, useEffect, type FormEvent } from 'react';
import jsPDF from 'jspdf';
import {
  Phone,
  X,
  LogOut,
  BarChart3,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  LayoutDashboard,
  PlusCircle,
  Package,
  Users,
  Smartphone,
  TrendingUp,
  Camera,
  FileText,
  AlertTriangle,
  Tag,
  Zap,
  ClipboardList,
  Clock,
  Wrench,
  MessageCircle,
  Star,
  ShoppingCart,
  Printer,
  Trash2,
  Edit2,
  Key,
  Check,
  Plus,
  Minus,
  Mail,
  DollarSign,
} from 'lucide-react';
import type { Product, Profile, Repair, SaleRecord } from './types';
import { INITIAL_PRODUCTS, INITIAL_PROFILES, INITIAL_REPAIRS, RETOMA_DATA } from './mockData';
import { supabase } from './supabaseClient';

const mapRepairToJS = (row: any): Repair => ({
  id: row.id,
  consecutivoRecepcion: row.consecutivo_recepcion || undefined,
  imei: row.imei,
  reference: row.reference,
  color: row.color,
  capacity: row.capacity,
  repairType: row.repair_type,
  clientName: row.client_name,
  clientType: row.client_type,
  assignedTechId: row.assigned_tech_id,
  status: row.status,
  physicalDetails: row.physical_details || undefined,
  photoUrl: row.photo_url || undefined,
  quotePrice: row.quote_price ? Number(row.quote_price) : undefined,
  quoteStatus: row.quote_status || undefined,
  priceAdjustmentReason: row.price_adjustment_reason || undefined,
  createdAt: row.created_at,
  partsCost: row.parts_cost ? Number(row.parts_cost) : undefined,
  paymentStatus: row.payment_status || undefined,
  commissionStatus: row.commission_status || 'pendiente',
  commissionPaidAt: row.commission_paid_at || undefined,
  commissionRate: row.commission_rate ? Number(row.commission_rate) : undefined
});

const mapRepairToDB = (r: Repair) => ({
  id: r.id,
  consecutivo_recepcion: r.consecutivoRecepcion || null,
  imei: r.imei,
  reference: r.reference,
  color: r.color,
  capacity: r.capacity,
  repair_type: r.repairType,
  client_name: r.clientName,
  client_type: r.clientType,
  assigned_tech_id: r.assignedTechId,
  status: r.status,
  physical_details: r.physicalDetails || null,
  photo_url: r.photoUrl || null,
  quote_price: r.quotePrice || null,
  quote_status: r.quoteStatus || null,
  price_adjustment_reason: r.priceAdjustmentReason || null,
  created_at: r.createdAt,
  parts_cost: r.partsCost || 0,
  payment_status: r.paymentStatus || 'pendiente',
  commission_status: r.commissionStatus || 'pendiente',
  commission_paid_at: r.commissionPaidAt || null,
  commission_rate: r.commissionRate || null
});

function App() {
  // Navigation & Auth Role
  const [userRole, setUserRole] = useState<'guest' | 'admin' | 'tecnico' | 'vendedor' | 'preferencial'>('guest');
  const [prefClientUser, setPrefClientUser] = useState('');
  const [prefClientPass, setPrefClientPass] = useState('');
  const [loggedClientName, setLoggedClientName] = useState('');
  const [loggedUserId, setLoggedUserId] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Active sub-tabs
  const [adminTab, setAdminTab] = useState<'inicio' | 'inventario' | 'ingreso' | 'perfiles' | 'informes' | 'ventas' | 'cuentas' | 'comisiones'>('inicio');
  const [prefTab, setPrefTab] = useState<'equipos' | 'ingresar' | 'cuentas'>('equipos');

  // Database states with localStorage persistence
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('istore_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const saved = localStorage.getItem('istore_profiles');
    return saved ? JSON.parse(saved) : INITIAL_PROFILES;
  });
  const [repairs, setRepairs] = useState<Repair[]>(() => {
    const saved = localStorage.getItem('istore_repairs');
    return saved ? JSON.parse(saved) : INITIAL_REPAIRS;
  });
  const [sales, setSales] = useState<SaleRecord[]>([]);

  // Load from Supabase on mount
  useEffect(() => {
    // Clear old test data cache from localStorage if found to start clean without reloading
    const savedRepairs = localStorage.getItem('istore_repairs');
    if (savedRepairs && (savedRepairs.includes('REP-101') || savedRepairs.includes('iPhone 13 Pro'))) {
      localStorage.removeItem('istore_repairs');
      localStorage.removeItem('istore_products');
      localStorage.removeItem('istore_profiles');
      setRepairs([]);
      setProducts([]);
      setProfiles([
        { id: 'pf-admin', name: 'Administrador General', role: 'admin', status: 'active', username: 'admin', password: 'Help.2026*' }
      ]);
    }

    const fetchSupabaseData = async (isPoll = false) => {
      try {
        const { data: dbProducts, error: prodErr } = await supabase.from('istore_products').select('*');
        if (!prodErr && dbProducts && dbProducts.length > 0) {
          const mappedProds = dbProducts.map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            stock: Number(p.stock),
            price: Number(p.price),
            purchasePrice: p.purchase_price ? Number(p.purchase_price) : 0,
            specs: p.specs || '',
            imei: p.imei || ''
          }));
          setProducts(mappedProds);
          localStorage.setItem('istore_products', JSON.stringify(mappedProds));
        }
        
        const { data: dbProfiles, error: profErr } = await supabase.from('istore_profiles').select('*');
        if (!profErr && dbProfiles && dbProfiles.length > 0) {
          const mappedProfs = dbProfiles.map((p: any) => ({
            id: p.id,
            name: p.name,
            role: p.role,
            status: p.status,
            username: p.username || undefined,
            password: p.password || undefined
          }));
          setProfiles(mappedProfs);
          localStorage.setItem('istore_profiles', JSON.stringify(mappedProfs));
        } else if (!profErr && dbProfiles && dbProfiles.length === 0) {
          // Supabase vacío — migrar perfiles de localStorage a Supabase
          const localRaw = localStorage.getItem('istore_profiles');
          if (localRaw) {
            try {
              const localProfs = JSON.parse(localRaw);
              if (Array.isArray(localProfs) && localProfs.length > 0) {
                await supabase.from('istore_profiles').upsert(
                  localProfs.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    role: p.role,
                    status: p.status,
                    username: p.username || null,
                    password: p.password || null
                  })),
                  { onConflict: 'id' }
                );
              }
            } catch (_) {}
          }
        }

        const { data: dbRepairs, error: repErr } = await supabase.from('istore_repairs').select('*');
        if (!repErr && dbRepairs) {
          const mapped = dbRepairs.map(mapRepairToJS);
          if (isPoll) {
            setRepairs(current => {
              const currentIds = new Set(current.map(r => r.id));
              const newRepairs = mapped.filter(r => !currentIds.has(r.id));
              if (current.length > 0 && newRepairs.length > 0) {
                newRepairs.forEach(rep => {
                  playAlarmSound();
                  setActiveAlarms(alarms => [rep, ...alarms]);
                });
              }
              return mapped;
            });
          } else {
            setRepairs(mapped);
          }
          localStorage.setItem('istore_repairs', JSON.stringify(mapped));
        }

        const { data: dbSales, error: salesErr } = await supabase.from('istore_sales').select('*');
        if (!salesErr && dbSales) {
          const mappedSales = dbSales.map((s: any) => ({
            id: s.id,
            customerName: s.customer_name || '',
            customerPhone: s.customer_phone || '',
            paymentMethod: s.payment_method || '',
            total: Number(s.total || 0),
            createdAt: s.created_at,
            items: Array.isArray(s.items) ? s.items : [],
            sellerId: s.seller_id || '',
            sellerName: s.seller_name || ''
          }));
          setSales(mappedSales);
        }

        const { data: dbRcv, error: rcvErr } = await supabase.from('istore_receivables').select('*');
        if (!rcvErr && dbRcv) {
          setReceivables(dbRcv.map((r: any) => ({
            id: r.id, clientName: r.client_name || '', clientPhone: r.client_phone || '',
            clientCedula: r.client_cedula || '', clientProfileId: r.client_profile_id || '',
            description: r.description || '', periodStart: r.period_start || undefined,
            periodEnd: r.period_end || undefined,
            total: Number(r.total || 0), amountPaid: Number(r.amount_paid || 0),
            dueDate: r.due_date || undefined, status: r.status || 'pendiente',
            items: Array.isArray(r.items) ? r.items : [],
            payments: Array.isArray(r.payments) ? r.payments : [],
            repairIds: Array.isArray(r.repair_ids) ? r.repair_ids : [],
            proofUrl: r.proof_url || undefined, validatedAt: r.validated_at || undefined,
            createdAt: r.created_at || '', sellerName: r.seller_name || '',
          })));
        }
      } catch (err) {
        console.error("Failed to fetch data from Supabase, running in offline/local mode:", err);
      }
    };

    fetchSupabaseData(false);

    // Poll every 10 seconds to keep data updated in real-time
    const intervalId = setInterval(() => {
      fetchSupabaseData(true);
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    localStorage.setItem('istore_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('istore_profiles', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem('istore_repairs', JSON.stringify(repairs));
  }, [repairs]);

  // WhatsApp Send helper
  const sendWhatsAppMessage = (text: string) => {
    const number = '+573242981343';
    const url = `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // New Product Form
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<'iphone' | 'mac' | 'repuesto'>('iphone');
  const [newProdStock, setNewProdStock] = useState(5);
  const [newProdPrice, setNewProdPrice] = useState(150000);
  const [newProdPurchasePrice, setNewProdPurchasePrice] = useState(100000);
  const [newProdSpecs, setNewProdSpecs] = useState('');
  const [newProdImei, setNewProdImei] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      (p.specs && p.specs.toLowerCase().includes(inventorySearch.toLowerCase())) ||
      (p.imei && p.imei.toLowerCase().includes(inventorySearch.toLowerCase())) ||
      p.category.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      p.id.toLowerCase().includes(inventorySearch.toLowerCase())
    );
  }, [products, inventorySearch]);


  // Editing Product states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdCategory, setEditProdCategory] = useState<'iphone' | 'mac' | 'repuesto'>('iphone');
  const [editProdStock, setEditProdStock] = useState(0);
  const [editProdPrice, setEditProdPrice] = useState(0);
  const [editProdPurchasePrice, setEditProdPurchasePrice] = useState(0);
  const [editProdSpecs, setEditProdSpecs] = useState('');
  const [editProdImei, setEditProdImei] = useState('');

  // New Profile Form
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileRole, setNewProfileRole] = useState<'admin' | 'tecnico' | 'vendedor' | 'preferencial'>('tecnico');
  const [newProfileUsername, setNewProfileUsername] = useState('');
  const [newProfilePassword, setNewProfilePassword] = useState('');

  // Delivery Dialog states
  const [deliveryRepair, setDeliveryRepair] = useState<Repair | null>(null);
  const [deliveryPartsCost, setDeliveryPartsCost] = useState(0);
  const [deliveryPaymentStatus, setDeliveryPaymentStatus] = useState<'pendiente' | 'pagado'>('pendiente');
  const [techCommissionRate, setTechCommissionRate] = useState(40); // 40% default commission
  const [commStart, setCommStart] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0]; });
  const [commEnd, setCommEnd] = useState(() => new Date().toISOString().split('T')[0]);
  const [commTechId, setCommTechId] = useState('');
  const [commRate, setCommRate] = useState(40);
  const [commSelected, setCommSelected] = useState<Set<string>>(new Set());
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [prefReportStart, setPrefReportStart] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0]; });
  const [prefReportEnd, setPrefReportEnd] = useState(() => new Date().toISOString().split('T')[0]);


  // Intake Form (Ingreso de Equipo)
  const [intakeImei, setIntakeImei] = useState('');
  const [intakeRef, setIntakeRef] = useState('');
  const [intakeColor, setIntakeColor] = useState('');
  const [intakeCapacity, setIntakeCapacity] = useState('');
  const [intakeRepairType, setIntakeRepairType] = useState('');
  const [intakeClientName, setIntakeClientName] = useState('');
  const [intakeClientType, setIntakeClientType] = useState<'regular' | 'preferencial'>('regular');
  const [imeiLoading, setImeiLoading] = useState(false);
  const [imeiSuccess, setImeiSuccess] = useState(false);
  const [isImeiSimulated, setIsImeiSimulated] = useState(false);
  const [intakeSuccessMsg, setIntakeSuccessMsg] = useState(false);

  // Physical Validation Form states
  const [selectedRepairForValidation, setSelectedRepairForValidation] = useState<Repair | null>(null);
  const [valConsecutivo, setValConsecutivo] = useState('');
  const [valPhysicalDetails, setValPhysicalDetails] = useState('');
  const [valPhotoType, setValPhotoType] = useState('phone_front_ok');
  const [editingPassId, setEditingPassId] = useState<string | null>(null);
  const [activeAlarms, setActiveAlarms] = useState<Repair[]>([]);

  // Synthesizes a premium double-beep alarm for new incoming services
  const playAlarmSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);

      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1100, audioCtx.currentTime);
        gain2.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.4);
      }, 140);
    } catch (e) {
      console.warn("AudioContext failed:", e);
    }
  };

  // Notification for Admin Panel
  const [adminNotifications, setAdminNotifications] = useState<string[]>([
    'Cliente preferencial "Juan Ochoa" ingresó iPhone 15 Pro Max con IMEI 35900...',
  ]);

  // Quoting modal inside Admin
  const [selectedRepairForQuote, setSelectedRepairForQuote] = useState<Repair | null>(null);
  const [quoteAmount, setQuoteAmount] = useState(0);
  const [modalTechId, setModalTechId] = useState('pf1');
  const [priceReasonType, setPriceReasonType] = useState('normal');
  const [customReasonText, setCustomReasonText] = useState('');


  // TAC → Modelo Apple (lookup local, gratis, sin API, sin créditos)

  // Defaults de color y capacidad por modelo (el técnico puede editar)
  const MODEL_DEFAULTS: Record<string, { color: string; capacity: string }> = {
    'iPhone 17 Pro Max': { color: 'Titanio Blanco', capacity: '256GB' },
    'iPhone 17 Pro':     { color: 'Titanio Negro', capacity: '256GB' },
    'iPhone 17 Plus':    { color: 'Negro', capacity: '128GB' },
    'iPhone 17':         { color: 'Negro', capacity: '128GB' },
    'iPhone 16 Pro Max': { color: 'Titanio Natural', capacity: '256GB' },
    'iPhone 16 Pro':     { color: 'Titanio Negro', capacity: '128GB' },
    'iPhone 16 Plus':    { color: 'Negro', capacity: '128GB' },
    'iPhone 16':         { color: 'Negro', capacity: '128GB' },
    'iPhone 15 Pro Max': { color: 'Titanio Natural', capacity: '256GB' },
    'iPhone 15 Pro':     { color: 'Titanio Negro', capacity: '128GB' },
    'iPhone 15 Plus':    { color: 'Negro', capacity: '128GB' },
    'iPhone 15':         { color: 'Negro', capacity: '128GB' },
    'iPhone 14 Pro Max': { color: 'Negro Espacial', capacity: '128GB' },
    'iPhone 14 Pro':     { color: 'Negro Espacial', capacity: '128GB' },
    'iPhone 14 Plus':    { color: 'Azul', capacity: '128GB' },
    'iPhone 14':         { color: 'Negro de medianoche', capacity: '128GB' },
    'iPhone 13 Pro Max': { color: 'Grafito', capacity: '128GB' },
    'iPhone 13 Pro':     { color: 'Grafito', capacity: '128GB' },
    'iPhone 13 mini':    { color: 'Negro de medianoche', capacity: '128GB' },
    'iPhone 13':         { color: 'Negro de medianoche', capacity: '128GB' },
    'iPhone 12 Pro Max': { color: 'Grafito', capacity: '128GB' },
    'iPhone 12 Pro':     { color: 'Grafito', capacity: '128GB' },
    'iPhone 12 mini':    { color: 'Negro', capacity: '64GB' },
    'iPhone 12':         { color: 'Negro', capacity: '64GB' },
    'iPhone 11 Pro Max': { color: 'Gris Espacial', capacity: '64GB' },
    'iPhone 11 Pro':     { color: 'Gris Espacial', capacity: '64GB' },
    'iPhone 11':         { color: 'Negro', capacity: '64GB' },
    'iPhone XS Max':     { color: 'Gris Espacial', capacity: '64GB' },
    'iPhone XS':         { color: 'Gris Espacial', capacity: '64GB' },
    'iPhone XR':         { color: 'Negro', capacity: '64GB' },
    'MacBook Air M2':    { color: 'Medianoche', capacity: '256GB SSD' },
    'MacBook Pro M2':    { color: 'Gris Espacial', capacity: '512GB SSD' },
    'MacBook Air M3':    { color: 'Medianoche', capacity: '256GB SSD' },
    'MacBook Pro M3':    { color: 'Gris Espacial', capacity: '512GB SSD' },
  };

  const COLOR_CODES: Record<string, string> = {
    SLV:'Silver', BLK:'Negro', WHT:'Blanco', BLU:'Azul', RED:'Rojo',
    GLD:'Dorado', GRN:'Verde', YLW:'Amarillo', PRE:'Púrpura', PKN:'Rosa',
    MDN:'Medianoche', STL:'Luz Estelar', TNA:'Titanio Natural',
    TBL:'Titanio Negro', TWH:'Titanio Blanco', TBE:'Titanio Desierto',
    COR:'Naranja Cósmico', DEP:'Deep Purple', GRA:'Grafito',
    SPN:'Alpine Green', SBL:'Sierra Blue', PRL:'Perla',
  };

  const applyImeiResult = (model: string, capacity: string, color: string) => {
    const defaults = MODEL_DEFAULTS[model] ?? { color: 'Por verificar', capacity: 'Por verificar' };
    setIntakeRef(model);
    setIntakeCapacity(capacity || defaults.capacity);
    setIntakeColor(color || defaults.color);
    setIsImeiSimulated(false);
    setImeiLoading(false);
    setImeiSuccess(true);
  };

  // IMEI Lookup: historial → caché Supabase → sickw.com → vacío
  const handleImeiLookup = async () => {
    if (!intakeImei || intakeImei.length < 5) return;
    setImeiLoading(true);
    setImeiSuccess(false);

    const cleanImei = intakeImei.trim().replace(/\s+/g, '');

    // 1. Historial de reparaciones — datos exactos ya verificados
    const existingRepair = repairs.find(r => r.imei.trim().replace(/\s+/g, '') === cleanImei);
    if (existingRepair) {
      applyImeiResult(existingRepair.reference, existingRepair.capacity, existingRepair.color);
      return;
    }

    // 2. Caché Supabase — evita gastar créditos en IMEIs ya consultados
    try {
      const { data: cacheRows } = await supabase
        .from('istore_imei_cache')
        .select('model, capacity, color')
        .eq('imei', cleanImei)
        .limit(1);
      const cached = cacheRows?.[0] ?? null;
      if (cached?.model && (cached.model as string).length > 3) {
        applyImeiResult(cached.model as string, (cached.capacity as string) ?? '', (cached.color as string) ?? '');
        return;
      }
    } catch (_) { /* caché no disponible, continúa */ }

    // 3. sickw.com service 12 — Apple DB oficial
    try {
      const apiKey = import.meta.env.VITE_SICKW_API_KEY || '71V-N1V-PQQ-2DI-57R-GXB-AKV-BT8';
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(
        `/api/sickw?format=json&key=${apiKey}&imei=${cleanImei}&service=12`,
        { signal: controller.signal }
      );
      clearTimeout(timer);
      if (res.ok) {
        const text = await res.text();
        if (text.trim().startsWith('{')) {
          const data = JSON.parse(text);
          if (data.status === 'success' && typeof data.result === 'string') {
            const raw = data.result as string;
            // "Model: iPhone 17 Pro Max"
            const modelMatch = raw.match(/\bModel:\s*([^<\n\r]+)/i);
            const model = (modelMatch?.[1] ?? '').replace(/^Apple\s+/i, '').trim();
            // "Description: IPHONE 17 PRO MAX,NAUS,256GB,SLV"
            const descMatch = raw.match(/Description:\s*([^<\n\r]+)/i);
            const descParts = (descMatch?.[1] ?? '').split(',');
            const capacity  = (descParts[2] ?? '').trim();
            const colorCode = (descParts[3] ?? '').trim();
            const color     = COLOR_CODES[colorCode] || colorCode;
            if (model.length > 3) {
              // Guardar en caché para próxima vez (sin bloquear UI)
              void (async () => { try { await supabase.from('istore_imei_cache').upsert({ imei: cleanImei, model, capacity, color, updated_at: new Date().toISOString() }); } catch (_) {} })();
              applyImeiResult(model, capacity, color);
              return;
            }
          }
        }
      }
    } catch (_) {
      // sickw no disponible — continúa al fallback vacío
    }

    // 4. IMEI desconocido — dejar campos vacíos para entrada manual
    setIsImeiSimulated(true);
    setIntakeRef('');
    setIntakeColor('');
    setIntakeCapacity('');
    setImeiLoading(false);
    setImeiSuccess(true);
  };

  // Submit Intake Form (remote or direct)
  const handleIntakeSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const finalClientName = userRole === 'preferencial' ? loggedClientName : intakeClientName;
    const finalClientType = userRole === 'preferencial' ? 'preferencial' : intakeClientType;

    const newRepair: Repair = {
      id: `REP-${Date.now().toString(36).toUpperCase()}`,
      imei: intakeImei,
      reference: intakeRef,
      color: intakeColor,
      capacity: intakeCapacity,
      repairType: intakeRepairType,
      clientName: finalClientName,
      clientType: finalClientType,
      assignedTechId: userRole === 'tecnico' ? loggedUserId : '',
      status: 'recibido',
      createdAt: new Date().toISOString().split('T')[0]
    };

    const updatedRepairs = [newRepair, ...repairs];
    setRepairs(updatedRepairs);
    localStorage.setItem('istore_repairs', JSON.stringify(updatedRepairs));

    try {
      await supabase.from('istore_repairs').insert([mapRepairToDB(newRepair)]);
    } catch (err) {
      console.error("Supabase insert repair failed:", err);
    }

    // Alert Admin
    const notifyText = `¡ALERTA ADM! El cliente Preferencial "${finalClientName}" ingresó un equipo: ${intakeRef} (${intakeColor}). Pendiente de validación física.`;
    setAdminNotifications([notifyText, ...adminNotifications]);

    // WhatsApp al admin cuando es cliente preferencial
    if (finalClientType === 'preferencial') {
      const waText = [
        `🔧 *Sr Tech — Nuevo Ingreso Preferencial*`,
        ``,
        `*Cliente:* ${finalClientName}`,
        `*Equipo:* ${intakeRef} — ${intakeColor} ${intakeCapacity}`,
        `*IMEI:* ${intakeImei}`,
        `*Falla:* ${intakeRepairType}`,
        `*Estado:* Pendiente validación física`,
        `*Orden:* ${newRepair.id}`,
      ].join('\n');
      sendWhatsAppMessage(waText);
    }

    // Reset Form
    setIntakeImei('');
    setIntakeRef('');
    setIntakeColor('');
    setIntakeCapacity('');
    setIntakeRepairType('');
    setIntakeClientName('');
    setImeiSuccess(false);
    
    setIntakeSuccessMsg(true);
    setTimeout(() => setIntakeSuccessMsg(false), 4000);
  };

  // Save Physical Validation by Administrator
  const handleSavePhysicalValidation = async () => {
    if (!selectedRepairForValidation) return;
    const updatedRepairs = repairs.map(r => r.id === selectedRepairForValidation.id ? {
      ...r,
      consecutivoRecepcion: valConsecutivo,
      physicalDetails: valPhysicalDetails,
      photoUrl: valPhotoType,
      status: 'validado_fisico' as const // advances status to physically validated
    } : r);
    setRepairs(updatedRepairs);
    localStorage.setItem('istore_repairs', JSON.stringify(updatedRepairs));

    try {
      await supabase.from('istore_repairs').update({
        consecutivo_recepcion: valConsecutivo,
        physical_details: valPhysicalDetails,
        photo_url: valPhotoType,
        status: 'validado_fisico'
      }).eq('id', selectedRepairForValidation.id);
    } catch (err) {
      console.error("Supabase update validation failed:", err);
    }
    setSelectedRepairForValidation(null);
    setValConsecutivo('');
    setValPhysicalDetails('');
  };

  // Open Quoting & Assignment Modal
  const openQuoteModal = (rep: Repair) => {
    setSelectedRepairForQuote(rep);
    setQuoteAmount(rep.quotePrice || 450000);
    setModalTechId(rep.assignedTechId || profiles.find(p => p.role === 'tecnico')?.id || '');
    if (rep.priceAdjustmentReason) {
      if (rep.priceAdjustmentReason.includes('Alta demanda')) {
        setPriceReasonType('demanda');
      } else if (rep.priceAdjustmentReason.includes('Baja disponibilidad')) {
        setPriceReasonType('stock');
      } else if (rep.priceAdjustmentReason.includes('fidelidad')) {
        setPriceReasonType('descuento');
      } else if (rep.priceAdjustmentReason.includes('urgencia')) {
        setPriceReasonType('urgencia');
      } else {
        setPriceReasonType('otro');
        setCustomReasonText(rep.priceAdjustmentReason);
      }
    } else {
      setPriceReasonType('normal');
      setCustomReasonText('');
    }
  };

  // Save Technician Assignment & Quote Price (updates quotePrice and resets decision to pending)
  const handleSaveQuote = async () => {
    if (!selectedRepairForQuote) return;
    
    let finalReason = '';
    if (priceReasonType === 'demanda') finalReason = 'Alta demanda de repuestos (pantalla/batería)';
    else if (priceReasonType === 'stock') finalReason = 'Baja disponibilidad de stock importado';
    else if (priceReasonType === 'descuento') finalReason = 'Descuento por fidelidad (Cliente Preferencial)';
    else if (priceReasonType === 'urgencia') finalReason = 'Costo de urgencia (Envío prioritario)';
    else if (priceReasonType === 'otro') finalReason = customReasonText;

    const updatedRepairs = repairs.map(r => r.id === selectedRepairForQuote.id ? { 
      ...r, 
      assignedTechId: modalTechId,
      quotePrice: quoteAmount, 
      quoteStatus: 'pending' as const, // reset decision to pending so client approves new price
      priceAdjustmentReason: finalReason,
      status: r.status === 'validado_fisico' ? ('en_reparacion' as const) : r.status // advances to in repair if first assignment
    } : r);
    setRepairs(updatedRepairs);
    localStorage.setItem('istore_repairs', JSON.stringify(updatedRepairs));

    try {
      await supabase.from('istore_repairs').update({
        assigned_tech_id: modalTechId,
        quote_price: quoteAmount,
        quote_status: 'pending',
        price_adjustment_reason: finalReason,
        status: selectedRepairForQuote.status === 'validado_fisico' ? 'en_reparacion' : selectedRepairForQuote.status
      }).eq('id', selectedRepairForQuote.id);
    } catch (err) {
      console.error("Supabase save quote failed:", err);
    }
    setSelectedRepairForQuote(null);
    setQuoteAmount(0);
    setPriceReasonType('normal');
    setCustomReasonText('');
  };

  // Preferential client approves/declines quote
  const handleQuoteDecision = async (repairId: string, decision: 'approved' | 'declined') => {
    const updatedRepairs = repairs.map(r => r.id === repairId ? { 
      ...r, 
      quoteStatus: decision, 
      status: decision === 'approved' ? ('en_reparacion' as const) : ('no_reparado' as const) 
    } : r);
    setRepairs(updatedRepairs);
    localStorage.setItem('istore_repairs', JSON.stringify(updatedRepairs));

    try {
      await supabase.from('istore_repairs').update({
        quote_status: decision,
        status: decision === 'approved' ? 'en_reparacion' : 'no_reparado'
      }).eq('id', repairId);
    } catch (err) {
      console.error("Supabase quote decision failed:", err);
    }
  };

  // User Authentication Handler
  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const adminPass = import.meta.env.VITE_ADMIN_PASSWORD || 'Help.2026*';

    // Fallback admin hardwired (password from .env.local, no en código fuente)
    if (prefClientUser === 'admin' && prefClientPass === adminPass) {
      setUserRole('admin');
      setLoggedUserId('pf-admin');
      setLoginError(false);
      return;
    }

    // Lookup dinámico desde Supabase / localStorage
    const foundProfile = profiles.find(
      p => p.username?.toLowerCase() === prefClientUser.toLowerCase() && p.password === prefClientPass && p.status === 'active'
    );

    if (foundProfile) {
      setUserRole(foundProfile.role);
      setLoggedUserId(foundProfile.id);
      setLoggedClientName(foundProfile.name);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  // Phone lookup for preferred clients (demo values)
  const PREF_PHONES: Record<string, string> = {
    'Juan Fernando Ochoa': '573112345678',
    'Alcaldía de Medellín': '574123456789',
  };

  const notifyRepairByWA = (rep: Repair) => {
    const statusMsg: Record<string, string> = {
      recibido:        'Su solicitud fue recibida. Pronto realizaremos la inspección física del equipo.',
      validado_fisico: 'Su equipo ha sido inspeccionado y recibido en nuestra tienda. El técnico iniciará el diagnóstico.',
      en_reparacion:   'Su equipo se encuentra en proceso de reparación en nuestro taller. Le notificaremos cuando esté listo.',
      entregado:       '¡Su equipo está listo! Puede pasar a recogerlo en cualquier momento en Sr Tech Medellín.',
      no_reparado:     'Lamentamos informar que no fue posible completar la reparación. Por favor contáctenos para más información.',
    };
    const lines = [
      `📱 *Sr Tech — Estado de Reparación*`,
      ``,
      `Estimado(a) *${rep.clientName}*,`,
      ``,
      statusMsg[rep.status] ?? `Estado actualizado: ${rep.status}`,
      ``,
      `*Equipo:* ${rep.reference} (${rep.color})`,
      `*Orden:* ${rep.id}`,
      rep.quotePrice ? `*Presupuesto:* $${rep.quotePrice.toLocaleString('es-CO')} COP` : '',
      ``,
      `Sr Tech Medellín · Tecnología y Servicio Técnico`,
    ].filter(Boolean).join('\n');
    const phone = PREF_PHONES[rep.clientName] ?? '';
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(lines)}`
      : `https://wa.me/?text=${encodeURIComponent(lines)}`;
    window.open(url, '_blank');
  };

  // Status updating handler for repairs
  const handleUpdateRepairStatus = async (repairId: string, newStatus: Repair['status']) => {
    if (newStatus === 'entregado') {
      const rep = repairs.find(r => r.id === repairId);
      if (rep) {
        setDeliveryRepair(rep);
        setDeliveryPartsCost(rep.partsCost || 0);
        setDeliveryPaymentStatus(rep.paymentStatus || 'pendiente');
        return; // Open confirmation modal instead of applying directly
      }
    }

    const updatedRepairs = repairs.map(r => r.id === repairId ? { ...r, status: newStatus } : r);
    setRepairs(updatedRepairs);
    localStorage.setItem('istore_repairs', JSON.stringify(updatedRepairs));

    try {
      await supabase.from('istore_repairs').update({
        status: newStatus
      }).eq('id', repairId);
    } catch (err) {
      console.error("Supabase status update failed:", err);
    }
  };

  // Save Delivery details (parts cost, payment status) and complete repair
  const handleSaveDelivery = async () => {
    if (!deliveryRepair) return;
    const updatedRepairs = repairs.map(r => r.id === deliveryRepair.id ? {
      ...r,
      status: 'entregado' as const,
      partsCost: deliveryPartsCost,
      paymentStatus: deliveryPaymentStatus
    } : r);
    setRepairs(updatedRepairs);
    localStorage.setItem('istore_repairs', JSON.stringify(updatedRepairs));

    try {
      await supabase.from('istore_repairs').update({
        status: 'entregado',
        parts_cost: deliveryPartsCost,
        payment_status: deliveryPaymentStatus
      }).eq('id', deliveryRepair.id);
    } catch (err) {
      console.error("Supabase delivery update failed:", err);
    }
    setDeliveryRepair(null);
  };

  // Inventario management handler to add new product
  const handleAddProduct = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newProduct: Product = {
      id: `p-${Date.now()}`,
      name: newProdName,
      category: newProdCategory,
      stock: newProdStock,
      price: newProdPrice,
      purchasePrice: newProdPurchasePrice,
      specs: newProdSpecs,
      imei: newProdImei
    };
    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    localStorage.setItem('istore_products', JSON.stringify(updatedProducts));

    try {
      await supabase.from('istore_products').insert([{
        id: newProduct.id,
        name: newProduct.name,
        category: newProduct.category,
        stock: newProduct.stock,
        price: newProduct.price,
        purchase_price: newProduct.purchasePrice,
        specs: newProduct.specs,
        imei: newProduct.imei
      }]);
    } catch (err) {
      console.error("Supabase insert product failed:", err);
    }
    setNewProdName('');
    setNewProdStock(5);
    setNewProdPrice(150000);
    setNewProdPurchasePrice(100000);
    setNewProdSpecs('');
    setNewProdImei('');
  };

  // Start editing product
  const startEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setEditProdName(prod.name);
    setEditProdCategory(prod.category);
    setEditProdStock(prod.stock);
    setEditProdPrice(prod.price);
    setEditProdPurchasePrice(prod.purchasePrice);
    setEditProdSpecs(prod.specs);
    setEditProdImei(prod.imei || '');
  };

  // Save edited product
  const handleSaveProductEdit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;

    const updated = products.map(p => p.id === editingProduct.id ? {
      ...p,
      name: editProdName,
      category: editProdCategory,
      stock: editProdStock,
      price: editProdPrice,
      purchasePrice: editProdPurchasePrice,
      specs: editProdSpecs,
      imei: editProdImei
    } : p);
    setProducts(updated);
    localStorage.setItem('istore_products', JSON.stringify(updated));

    try {
      await supabase.from('istore_products').update({
        name: editProdName,
        category: editProdCategory,
        stock: editProdStock,
        price: editProdPrice,
        purchase_price: editProdPurchasePrice,
        specs: editProdSpecs,
        imei: editProdImei
      }).eq('id', editingProduct.id);
    } catch (err) {
      console.error("Supabase update product failed:", err);
    }
    setEditingProduct(null);
  };

  // Delete product handler
  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este producto del inventario?")) return;
    const updated = products.filter(p => p.id !== productId);
    setProducts(updated);
    localStorage.setItem('istore_products', JSON.stringify(updated));
    try {
      await supabase.from('istore_products').delete().eq('id', productId);
    } catch (err) {
      console.error("Supabase delete product failed:", err);
    }
  };

  // Delete repair handler
  const handleDeleteRepair = async (repairId: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este registro de reparación de la cola?")) return;
    const updated = repairs.filter(r => r.id !== repairId);
    setRepairs(updated);
    localStorage.setItem('istore_repairs', JSON.stringify(updated));
    try {
      await supabase.from('istore_repairs').delete().eq('id', repairId);
    } catch (err) {
      console.error("Supabase delete repair failed:", err);
    }
  };

  // Technical, Sales & Preferential profile creation handler
  const handleAddProfile = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newProfile: Profile = {
      id: `pf-${Date.now()}`,
      name: newProfileName,
      role: newProfileRole,
      status: 'active',
      username: newProfileUsername || undefined,
      password: newProfilePassword || undefined
    };
    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    localStorage.setItem('istore_profiles', JSON.stringify(updatedProfiles));

    try {
      await supabase.from('istore_profiles').insert([{
        id: newProfile.id,
        name: newProfile.name,
        role: newProfile.role,
        status: newProfile.status,
        username: newProfile.username || null,
        password: newProfile.password || null
      }]);
    } catch (err) {
      console.error("Supabase insert profile failed:", err);
    }
    setNewProfileName('');
    setNewProfileRole('tecnico');
    setNewProfileUsername('');
    setNewProfilePassword('');
  };

  const handleUpdatePassword = async (profileId: string, newPass: string) => {
    if (!newPass.trim()) return;
    const updated = profiles.map(p => p.id === profileId ? { ...p, password: newPass } : p);
    setProfiles(updated);
    localStorage.setItem('istore_profiles', JSON.stringify(updated));
    try {
      await supabase
        .from('istore_profiles')
        .update({ password: newPass })
        .eq('id', profileId);
    } catch (err) {
      console.error("Supabase update profile password failed:", err);
    }
  };



  // ── Cuentas por Cobrar ──────────────────────────────────────────────────────
  interface ReceivablePayment { date: string; amount: number; method: string; note: string; }
  interface Receivable {
    id: string; clientName: string; clientPhone: string; clientCedula: string;
    clientProfileId: string;
    description: string; periodStart?: string; periodEnd?: string;
    total: number; amountPaid: number; dueDate?: string;
    status: 'pendiente' | 'en_revision' | 'pagado';
    items: { repairId?: string; name: string; qty: number; price: number }[];
    payments: ReceivablePayment[];
    repairIds: string[];
    proofUrl?: string; validatedAt?: string;
    createdAt: string; sellerName: string;
  }
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [rcvGenModal, setRcvGenModal] = useState(false);
  const [rcvGenClientId, setRcvGenClientId] = useState('');
  const [rcvGenStart, setRcvGenStart] = useState('');
  const [rcvGenEnd, setRcvGenEnd] = useState('');
  const [rcvGenSelected, setRcvGenSelected] = useState<Set<string>>(new Set());
  const [rcvPayModal, setRcvPayModal] = useState<Receivable | null>(null);
  const [rcvPayAmount, setRcvPayAmount] = useState('');
  const [rcvPayMethod, setRcvPayMethod] = useState('efectivo');
  const [rcvPayNote, setRcvPayNote] = useState('');
  const [rcvProofModal, setRcvProofModal] = useState<string | null>(null);
  const [rcvUploadFile, setRcvUploadFile] = useState<File | null>(null);

  const rcvBalance = (r: Receivable) => r.total - r.amountPaid;
  const rcvColor = (r: Receivable) => r.status === 'pagado' ? '#4ade80' : r.status === 'en_revision' ? '#fbbf24' : '#f87171';
  const rcvLabel = (r: Receivable) => r.status === 'pagado' ? 'PAGADO' : r.status === 'en_revision' ? 'EN REVISIÓN' : 'PENDIENTE';

  const handleGenerateReceivable = async () => {
    const clientProfile = profiles.find(p => p.id === rcvGenClientId);
    if (!clientProfile || !rcvGenStart || !rcvGenEnd) return;
    const billed = new Set(
      receivables
        .filter(r => r.status === 'en_revision' || r.status === 'pagado')
        .flatMap(r => r.repairIds)
    );
    const allRepairs = repairs.filter(r =>
      r.clientName.toLowerCase() === clientProfile.name.toLowerCase() &&
      r.createdAt >= rcvGenStart && r.createdAt <= rcvGenEnd &&
      r.status === 'entregado' && r.quotePrice && r.quotePrice > 0 &&
      !billed.has(r.id)
    );
    const selectedRepairs = rcvGenSelected.size > 0
      ? allRepairs.filter(r => rcvGenSelected.has(r.id))
      : allRepairs;
    if (selectedRepairs.length === 0) { alert('Selecciona al menos una reparación'); return; }
    const items = selectedRepairs.map(r => ({
      repairId: r.id,
      name: `${r.reference} ${r.color} ${r.capacity} — ${r.repairType}`.trim(),
      qty: 1, price: r.quotePrice || 0,
    }));
    const total = items.reduce((s, i) => s + i.price, 0);
    const newRcv: Receivable = {
      id: `COB-${Date.now().toString(36).toUpperCase()}`,
      clientName: clientProfile.name, clientPhone: '', clientCedula: '',
      clientProfileId: clientProfile.id,
      description: `Servicios período ${rcvGenStart} al ${rcvGenEnd}`,
      periodStart: rcvGenStart, periodEnd: rcvGenEnd,
      total, amountPaid: 0, status: 'pendiente',
      items, payments: [], repairIds: selectedRepairs.map(r => r.id),
      createdAt: new Date().toISOString().split('T')[0], sellerName: 'Administrador',
    };
    setReceivables(prev => [newRcv, ...prev]);
    setRcvGenModal(false); setRcvGenClientId(''); setRcvGenStart(''); setRcvGenEnd(''); setRcvGenSelected(new Set());
    try {
      await supabase.from('istore_receivables').insert([{
        id: newRcv.id, client_name: newRcv.clientName, client_phone: '', client_cedula: '',
        client_profile_id: newRcv.clientProfileId, description: newRcv.description,
        period_start: newRcv.periodStart, period_end: newRcv.periodEnd,
        total: newRcv.total, amount_paid: 0, status: 'pendiente',
        items: newRcv.items, payments: [], repair_ids: newRcv.repairIds,
        created_at: newRcv.createdAt, seller_name: 'Administrador',
      }]);
    } catch (err) { console.error('insert receivable failed', err); }
  };

  const handleAddPayment = async () => {
    if (!rcvPayModal || !rcvPayAmount) return;
    const amount = Number(rcvPayAmount);
    if (amount <= 0) return;
    const payment: ReceivablePayment = { date: new Date().toISOString().split('T')[0], amount, method: rcvPayMethod, note: rcvPayNote };
    const newPaid = rcvPayModal.amountPaid + amount;
    const newStatus: Receivable['status'] = newPaid >= rcvPayModal.total ? 'pagado' : 'pendiente';
    const updated = { ...rcvPayModal, amountPaid: newPaid, status: newStatus, payments: [...rcvPayModal.payments, payment] };
    setReceivables(prev => prev.map(r => r.id === updated.id ? updated : r));
    setRcvPayModal(null); setRcvPayAmount(''); setRcvPayMethod('efectivo'); setRcvPayNote('');
    try {
      await supabase.from('istore_receivables').update({ amount_paid: newPaid, status: newStatus, payments: updated.payments }).eq('id', updated.id);
    } catch (err) { console.error('update payment failed', err); }
  };

  const handleValidatePayment = async (rcv: Receivable) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = { ...rcv, status: 'pagado' as const, validatedAt: today, amountPaid: rcv.total };
    setReceivables(prev => prev.map(r => r.id === rcv.id ? updated : r));
    try {
      await supabase.from('istore_receivables').update({ status: 'pagado', validated_at: today, amount_paid: rcv.total }).eq('id', rcv.id);
    } catch (err) { console.error('validate payment failed', err); }
  };

  const handleUploadProof = async (rcvId: string) => {
    if (!rcvUploadFile) return;
    const path = `${rcvId}/${Date.now()}-${rcvUploadFile.name}`;
    try {
      const { error: upErr } = await supabase.storage.from('payment-proofs').upload(path, rcvUploadFile, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('payment-proofs').getPublicUrl(path);
      const proofUrl = urlData.publicUrl;
      setReceivables(prev => prev.map(r => r.id === rcvId ? { ...r, proofUrl, status: 'en_revision' as const } : r));
      await supabase.from('istore_receivables').update({ proof_url: proofUrl, status: 'en_revision' }).eq('id', rcvId);
      setRcvProofModal(null); setRcvUploadFile(null);
    } catch (err) { console.error('upload proof failed', err); }
  };

  const handlePayCommissions = async () => {
    if (commSelected.size === 0) return;
    const today = new Date().toISOString().split('T')[0];
    const ids = Array.from(commSelected);
    setRepairs(prev => prev.map(r => ids.includes(r.id)
      ? { ...r, commissionStatus: 'pagado' as const, commissionPaidAt: today, commissionRate: commRate }
      : r));
    try {
      await supabase.from('istore_repairs')
        .update({ commission_status: 'pagado', commission_paid_at: today, commission_rate: commRate })
        .in('id', ids);
    } catch (err) { console.error('pay commissions failed', err); }
    setCommSelected(new Set());
  };

  const generateReceivablePDF = (r: Receivable) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const blue = [37,99,235] as [number,number,number], dark = [15,23,42] as [number,number,number];
    const gray = [100,116,139] as [number,number,number], white = [255,255,255] as [number,number,number];
    const light = [241,245,249] as [number,number,number];
    doc.setFillColor(...dark); doc.rect(0,0,210,42,'F');
    doc.setTextColor(...white); doc.setFontSize(24); doc.setFont('helvetica','bold');
    doc.text('SR TECH', 15, 20); doc.setFontSize(10); doc.setFont('helvetica','normal');
    doc.text('Cuenta de Cobro', 15, 28); doc.text(`N° ${r.id}`, 15, 34);
    doc.setTextColor(...gray); doc.setFontSize(8);
    doc.text(`Fecha: ${r.createdAt}`, 140, 22);
    if (r.dueDate) doc.text(`Vence: ${r.dueDate}`, 140, 28);
    doc.text(`Estado: ${rcvLabel(r)}`, 140, 34);
    let y = 55;
    doc.setTextColor(51,51,51); doc.setFont('helvetica','bold'); doc.setFontSize(10);
    doc.text('CLIENTE', 15, y); doc.setFont('helvetica','normal'); doc.setFontSize(9); y += 6;
    doc.text(`Nombre: ${r.clientName}`, 15, y); y += 5;
    if (r.clientCedula) { doc.text(`Cédula: ${r.clientCedula}`, 15, y); y += 5; }
    if (r.clientPhone) { doc.text(`Celular: ${r.clientPhone}`, 15, y); y += 5; }
    if (r.description) { doc.text(`Concepto: ${r.description}`, 15, y); y += 5; }
    y += 6; doc.setDrawColor(200,200,200); doc.line(15, y, 195, y); y += 8;
    doc.setFillColor(...blue); doc.rect(15, y, 180, 9, 'F');
    doc.setTextColor(...white); doc.setFont('helvetica','bold'); doc.setFontSize(9);
    doc.text('DESCRIPCIÓN', 18, y+6); doc.text('CANT.', 122, y+6); doc.text('PRECIO', 140, y+6); doc.text('SUBTOTAL', 172, y+6);
    y += 9;
    r.items.forEach((item, idx) => {
      doc.setFillColor(...(idx % 2 === 0 ? light : white));
      doc.rect(15, y, 180, 8, 'F');
      doc.setTextColor(51,51,51); doc.setFont('helvetica','normal'); doc.setFontSize(9);
      doc.text(item.name.substring(0,42), 18, y+5.5);
      doc.text(String(item.qty), 125, y+5.5);
      doc.text(`$${item.price.toLocaleString('es-CO')}`, 140, y+5.5);
      doc.text(`$${(item.price * item.qty).toLocaleString('es-CO')}`, 172, y+5.5);
      y += 8;
    });
    y += 8;
    doc.setFillColor(...blue); doc.rect(120, y-4, 75, 10, 'F');
    doc.setTextColor(...white); doc.setFont('helvetica','bold'); doc.setFontSize(11);
    doc.text(`TOTAL: $${r.total.toLocaleString('es-CO')} COP`, 124, y+3);
    if (r.payments.length > 0) {
      y += 18; doc.setTextColor(51,51,51); doc.setFont('helvetica','bold'); doc.setFontSize(9);
      doc.text('HISTORIAL DE PAGOS', 15, y); y += 6;
      r.payments.forEach(p => {
        doc.setFont('helvetica','normal');
        doc.text(`${p.date}  |  $${p.amount.toLocaleString('es-CO')}  |  ${p.method}  ${p.note ? '— '+p.note : ''}`, 15, y);
        y += 5;
      });
      y += 4; doc.setFont('helvetica','bold');
      doc.text(`Abonado: $${r.amountPaid.toLocaleString('es-CO')} COP`, 15, y); y += 5;
      const bal = r.total - r.amountPaid;
      if (bal > 0) { doc.setTextColor(200,0,0); doc.text(`Saldo pendiente: $${bal.toLocaleString('es-CO')} COP`, 15, y); }
    }
    doc.setTextColor(...gray); doc.setFontSize(8); doc.setFont('helvetica','normal');
    doc.text('Sr Tech — Gracias por su confianza', 105, 285, { align: 'center' });
    doc.save(`cuenta_cobro_${r.id}.pdf`);
  };

  // ── Venta Mostrador ─────────────────────────────────────────────────────────
  interface SaleCartItem { product: Product; qty: number; salePrice: number; }
  interface LastSaleInfo {
    saleId: string;
    items: { name: string; qty: number; price: number }[];
    customerName: string;
    customerPhone: string;
    customerCedula?: string;
    payment: string;
    total: number;
    imei?: string;
    warrantyDays?: number;
  }
  const [saleCart, setSaleCart]                 = useState<SaleCartItem[]>([]);
  const [saleSearch, setSaleSearch]             = useState('');
  const [saleCustomerName, setSaleCustomerName] = useState('');
  const [saleCustomerPhone, setSaleCustomerPhone] = useState('');
  const [saleCustomerCedula, setSaleCustomerCedula] = useState('');
  const [salePaymentMethod, setSalePaymentMethod] = useState<'efectivo' | 'nequi' | 'daviplata' | 'llave'>('efectivo');
  const [saleImei, setSaleImei]                 = useState('');
  const [saleWarrantyDays, setSaleWarrantyDays] = useState<number>(30);
  const [saleSuccess, setSaleSuccess]           = useState(false);
  const [lastSale, setLastSale]                 = useState<LastSaleInfo | null>(null);
  const [saleCategoryFilter, setSaleCategoryFilter] = useState<'all' | 'iphone' | 'mac' | 'repuesto'>('all');

  const saleCartTotal = useMemo(
    () => saleCart.reduce((sum, i) => sum + i.salePrice * i.qty, 0),
    [saleCart]
  );

  const addToSaleCart = (product: Product) => {
    setSaleCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, qty: 1, salePrice: product.price }];
    });
  };

  const removeFromSaleCart = (productId: string) =>
    setSaleCart(prev => prev.filter(i => i.product.id !== productId));

  const updateSaleQty = (productId: string, delta: number) =>
    setSaleCart(prev => prev
      .map(i => i.product.id === productId ? { ...i, qty: Math.max(1, i.qty + delta) } : i)
    );

  const updateSaleItemPrice = (productId: string, price: number) =>
    setSaleCart(prev => prev
      .map(i => i.product.id === productId ? { ...i, salePrice: Math.max(0, price) } : i)
    );

  const generateSalePDF = (cart: SaleCartItem[], customerName: string, payment: string, saleId: string, imei?: string, warrantyDays?: number, cedula?: string) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const blue  = [37, 99, 235] as [number,number,number];
    const dark  = [15, 23, 42]  as [number,number,number];
    const gray  = [100,116,139] as [number,number,number];
    const white = [255,255,255] as [number,number,number];
    const light = [241,245,249] as [number,number,number];

    // Header bar
    doc.setFillColor(...dark); doc.rect(0, 0, 210, 42, 'F');
    doc.setTextColor(...white);
    doc.setFontSize(26); doc.setFont('helvetica','bold');
    doc.text('SR TECH', 15, 22);
    doc.setFontSize(10); doc.setFont('helvetica','normal');
    doc.text('Tecnología y Servicio Técnico', 15, 30);
    doc.setFontSize(9);
    doc.text(`Recibo N°: ${saleId}`, 15, 38);
    doc.text(new Date().toLocaleDateString('es-CO', { day:'2-digit', month:'long', year:'numeric' }), 150, 38);

    // Client info
    let y = 56;
    doc.setTextColor(51,51,51); doc.setFontSize(10);
    doc.setFont('helvetica','bold'); doc.text('Cliente:', 15, y);
    doc.setFont('helvetica','normal'); doc.text(customerName || 'Cliente mostrador', 45, y);
    if (cedula) {
      y += 7;
      doc.setFont('helvetica','bold'); doc.text('Cédula:', 15, y);
      doc.setFont('helvetica','normal'); doc.text(cedula, 40, y);
    }
    y += 7;
    doc.setFont('helvetica','bold'); doc.text('Forma de pago:', 15, y);
    doc.setFont('helvetica','normal');
    const payLabel: Record<string,string> = { efectivo:'Efectivo', tarjeta:'Tarjeta', transferencia:'Transferencia' };
    doc.text(payLabel[payment] ?? payment, 55, y);
    if (imei) {
      y += 7;
      doc.setFont('helvetica','bold'); doc.text('IMEI:', 15, y);
      doc.setFont('helvetica','normal'); doc.text(imei, 35, y);
    }
    if (warrantyDays && warrantyDays > 0) {
      y += 7;
      const wLabel = warrantyDays >= 365
        ? `${Math.round(warrantyDays / 365)} año(s)`
        : warrantyDays >= 30
          ? `${Math.round(warrantyDays / 30)} mes(es) (${warrantyDays} días)`
          : `${warrantyDays} días`;
      doc.setFont('helvetica','bold'); doc.text('Garantía:', 15, y);
      doc.setFont('helvetica','normal'); doc.text(wLabel, 48, y);
    }

    // Divider
    y += 10; doc.setDrawColor(200,200,200); doc.line(15, y, 195, y); y += 8;

    // Table header
    doc.setFillColor(...blue); doc.rect(15, y, 180, 9, 'F');
    doc.setTextColor(...white); doc.setFont('helvetica','bold'); doc.setFontSize(9);
    doc.text('PRODUCTO', 18, y + 6);
    doc.text('CANT.', 122, y + 6);
    doc.text('PRECIO UNIT.', 138, y + 6);
    doc.text('SUBTOTAL', 172, y + 6);
    y += 9;

    // Rows
    cart.forEach((item, idx) => {
      doc.setFillColor(...(idx % 2 === 0 ? light : white));
      doc.rect(15, y, 180, 8, 'F');
      doc.setTextColor(51,51,51); doc.setFont('helvetica','normal'); doc.setFontSize(9);
      doc.text(item.product.name.substring(0, 42), 18, y + 5.5);
      doc.text(String(item.qty), 125, y + 5.5);
      doc.text(`$${item.salePrice.toLocaleString('es-CO')}`, 138, y + 5.5);
      doc.text(`$${(item.salePrice * item.qty).toLocaleString('es-CO')}`, 172, y + 5.5);
      y += 8;
    });

    // Total
    y += 6; doc.setDrawColor(200,200,200); doc.line(15, y, 195, y); y += 10;
    doc.setFillColor(...blue); doc.rect(120, y - 4, 75, 12, 'F');
    doc.setTextColor(...white); doc.setFont('helvetica','bold'); doc.setFontSize(13);
    doc.text(`TOTAL: $${saleCartTotal.toLocaleString('es-CO')} COP`, 126, y + 4);

    // Footer
    y += 30;
    doc.setTextColor(...gray); doc.setFontSize(8); doc.setFont('helvetica','normal');
    doc.text('Gracias por su compra en Sr Tech', 105, y, { align:'center' });
    y += 5; doc.text('Garantía según condiciones del producto · Conserve este recibo', 105, y, { align:'center' });

    doc.save(`recibo_${saleId}.pdf`);
  };

  const buildShareText = (sale: LastSaleInfo) => {
    const payLabel: Record<string, string> = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia' };
    const date = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
    const lines = sale.items.map(i => `• ${i.name} (x${i.qty}) — $${(i.price * i.qty).toLocaleString('es-CO')}`).join('\n');
    const cedulaLine = sale.customerCedula ? `\nCédula: ${sale.customerCedula}` : '';
    const imeiLine = sale.imei ? `\nIMEI: ${sale.imei}` : '';
    const warrantyLine = sale.warrantyDays && sale.warrantyDays > 0
      ? `\nGarantía: ${sale.warrantyDays >= 365 ? `${Math.round(sale.warrantyDays/365)} año(s)` : sale.warrantyDays >= 30 ? `${Math.round(sale.warrantyDays/30)} mes(es)` : `${sale.warrantyDays} días`}`
      : '';
    return `*Recibo Sr Tech* — N° ${sale.saleId}\nFecha: ${date}\nCliente: ${sale.customerName || 'Mostrador'}${cedulaLine}\nPago: ${payLabel[sale.payment] ?? sale.payment}${imeiLine}${warrantyLine}\n\n*Productos:*\n${lines}\n\n*TOTAL: $${sale.total.toLocaleString('es-CO')} COP*\n\nGracias por su compra en Sr Tech`;
  };

  const sendViaWhatsApp = (sale: LastSaleInfo) => {
    const text = encodeURIComponent(buildShareText(sale));
    const num = sale.customerPhone.replace(/\D/g, '');
    window.open(num ? `https://wa.me/${num}?text=${text}` : `https://wa.me/?text=${text}`, '_blank');
  };

  const sendViaEmail = (sale: LastSaleInfo) => {
    const plain = buildShareText(sale).replace(/\*/g, '');
    const subject = encodeURIComponent(`Recibo de Compra Sr Tech — ${sale.saleId}`);
    window.open(`mailto:?subject=${subject}&body=${encodeURIComponent(plain)}`, '_blank');
  };

  const handleCompleteSale = async () => {
    if (saleCart.length === 0) return;
    const saleId = `VTA-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;
    const updatedProducts = products.map(p => {
      const item = saleCart.find(i => i.product.id === p.id);
      return item ? { ...p, stock: Math.max(0, p.stock - item.qty) } : p;
    });
    setProducts(updatedProducts);
    localStorage.setItem('istore_products', JSON.stringify(updatedProducts));

    for (const item of saleCart) {
      try {
        const { data: currentProd } = await supabase.from('istore_products').select('stock').eq('id', item.product.id).single();
        if (currentProd) {
          const newStock = Math.max(0, currentProd.stock - item.qty);
          await supabase.from('istore_products').update({ stock: newStock }).eq('id', item.product.id);
        }
      } catch (err) {
        console.error("Supabase decrement stock failed:", err);
      }
    }
    const saleItems = saleCart.map(i => ({
      name: i.product.name,
      qty: i.qty,
      price: i.salePrice,
      purchasePrice: i.product.purchasePrice
    }));

    const sale: LastSaleInfo = {
      saleId,
      items: saleItems,
      customerName: saleCustomerName,
      customerPhone: saleCustomerPhone,
      customerCedula: saleCustomerCedula.trim() || undefined,
      payment: salePaymentMethod,
      total: saleCartTotal,
      imei: saleImei.trim() || undefined,
      warrantyDays: saleWarrantyDays,
    };
    setLastSale(sale);

    try {
      await supabase.from('istore_sales').insert([{
        id: saleId,
        customer_name: saleCustomerName || 'Cliente mostrador',
        customer_phone: saleCustomerPhone || '',
        customer_cedula: saleCustomerCedula.trim() || null,
        payment_method: salePaymentMethod,
        total: saleCartTotal,
        created_at: new Date().toISOString().split('T')[0],
        items: saleItems,
        seller_id: 'pf-admin',
        seller_name: 'Administrador General',
        imei: saleImei.trim() || null,
        warranty_days: saleWarrantyDays,
      }]);

      const newRecord: SaleRecord = {
        id: saleId,
        customerName: saleCustomerName || 'Cliente mostrador',
        customerPhone: saleCustomerPhone || '',
        paymentMethod: salePaymentMethod,
        total: saleCartTotal,
        createdAt: new Date().toISOString().split('T')[0],
        items: saleItems,
        sellerId: 'pf-admin',
        sellerName: 'Administrador General',
        imei: saleImei.trim() || undefined,
        warrantyDays: saleWarrantyDays,
      };
      setSales(prev => [newRecord, ...prev]);
    } catch (err) {
      console.error("Supabase save sale record failed:", err);
    }

    generateSalePDF(saleCart, saleCustomerName, salePaymentMethod, saleId, saleImei.trim(), saleWarrantyDays, saleCustomerCedula.trim());
    setSaleCart([]);
    setSaleCustomerName('');
    setSaleCustomerPhone('');
    setSaleCustomerCedula('');
    setSalePaymentMethod('efectivo');
    setSaleImei('');
    setSaleWarrantyDays(30);
    setSaleSuccess(true);
  };

  // Reports calculations
  const totalRepairsCost = useMemo(() => {
    const relevant = userRole === 'tecnico'
      ? repairs.filter(r => r.assignedTechId === loggedUserId)
      : repairs;
    return relevant.filter(r => r.status === 'entregado').reduce((sum, r) => sum + (r.quotePrice || 0), 0);
  }, [repairs, userRole, loggedUserId]);

  const totalRepairsParts = useMemo(() => {
    const relevant = userRole === 'tecnico'
      ? repairs.filter(r => r.assignedTechId === loggedUserId)
      : repairs;
    return relevant.filter(r => r.status === 'entregado').reduce((sum, r) => sum + (r.partsCost || 0), 0);
  }, [repairs, userRole, loggedUserId]);

  const totalSales = useMemo(() => {
    return sales.reduce((sum, s) => sum + s.total, 0);
  }, [sales]);

  const totalRetomas = useMemo(() => {
    return RETOMA_DATA.reduce((sum, r) => sum + r.tradeInVal, 0);
  }, []);

  const salesUtility = useMemo(() => {
    return sales.reduce((sum, s) => {
      const saleUtil = s.items.reduce((sSum, item: any) => {
        const pPrice = item.purchasePrice || 0;
        return sSum + (item.price - pPrice) * item.qty;
      }, 0);
      return sum + saleUtil;
    }, 0);
  }, [sales]);

  const repairsUtility = useMemo(() => {
    const relevant = userRole === 'tecnico'
      ? repairs.filter(r => r.assignedTechId === loggedUserId)
      : repairs;
    return relevant.filter(r => r.status === 'entregado').reduce((sum, r) => {
      const parts = r.partsCost || 0;
      return sum + ((r.quotePrice || 0) - parts);
    }, 0);
  }, [repairs, userRole, loggedUserId]);

  const totalNetUtility = useMemo(() => {
    if (userRole === 'tecnico') {
      return repairsUtility;
    }
    return salesUtility + repairsUtility;
  }, [salesUtility, repairsUtility, userRole]);

  // ── Informe Diario ──────────────────────────────────────────────────────────
  const dailySales = useMemo(() =>
    sales.filter(s => s.createdAt?.startsWith(reportDate)),
    [sales, reportDate]
  );

  const dailyRepairs = useMemo(() => {
    const completed = repairs.filter(r => r.status === 'entregado' && r.createdAt === reportDate);
    return userRole === 'tecnico' ? completed.filter(r => r.assignedTechId === loggedUserId) : completed;
  }, [repairs, reportDate, userRole, loggedUserId]);

  const dailySalesTotal   = useMemo(() => dailySales.reduce((s, v) => s + v.total, 0), [dailySales]);
  const dailyRepairRev    = useMemo(() => dailyRepairs.reduce((s, r) => s + (r.quotePrice || 0), 0), [dailyRepairs]);
  const dailyRepairParts  = useMemo(() => dailyRepairs.reduce((s, r) => s + (r.partsCost || 0), 0), [dailyRepairs]);
  const dailyRepairUtil   = useMemo(() => dailyRepairRev - dailyRepairParts, [dailyRepairRev, dailyRepairParts]);

  const dailySalesBySeller = useMemo(() =>
    dailySales.reduce((acc, s) => {
      const key = s.sellerName || 'Mostrador';
      if (!acc[key]) acc[key] = { count: 0, total: 0 };
      acc[key].count++; acc[key].total += s.total;
      return acc;
    }, {} as Record<string, { count: number; total: number }>),
    [dailySales]
  );

  const dailyRepairsByTech = useMemo(() =>
    dailyRepairs.reduce((acc, r) => {
      const tech = profiles.find(p => p.id === r.assignedTechId);
      const key = tech?.name || 'Sin asignar';
      if (!acc[key]) acc[key] = { count: 0, revenue: 0, utility: 0, commission: 0 };
      acc[key].count++;
      acc[key].revenue += r.quotePrice || 0;
      const util = (r.quotePrice || 0) - (r.partsCost || 0);
      acc[key].utility += util;
      acc[key].commission += Math.round(util * techCommissionRate / 100);
      return acc;
    }, {} as Record<string, { count: number; revenue: number; utility: number; commission: number }>),
    [dailyRepairs, profiles, techCommissionRate]
  );
  // ────────────────────────────────────────────────────────────────────────────

  const technicianStats = useMemo(() => {
    const stats: Record<string, { id: string; name: string; role: string; count: number; revenue: number; utility: number }> = {};
    profiles.forEach(p => {
      stats[p.id] = { id: p.id, name: p.name, role: p.role, count: 0, revenue: 0, utility: 0 };
    });

    repairs.filter(r => r.status === 'entregado' && r.assignedTechId).forEach(r => {
      const tech = stats[r.assignedTechId];
      if (tech) {
        const netUtility = (r.quotePrice || 0) - (r.partsCost || 0);
        tech.count += 1;
        tech.revenue += (r.quotePrice || 0);
        tech.utility += Math.round(netUtility * (techCommissionRate / 100));
      }
    });
    const allStats = Object.values(stats).filter(s => s.role === 'tecnico' && s.count > 0);
    if (userRole === 'tecnico') {
      return allStats.filter(s => s.id === loggedUserId);
    }
    return allStats;
  }, [repairs, profiles, userRole, loggedUserId]);

  // Filter client's repairs list dynamically based on logged in name
  const filteredRepairs = useMemo(() => {
    return repairs.filter(r => r.clientName.toLowerCase().includes(loggedClientName.split(' ')[0].toLowerCase()));
  }, [repairs, loggedClientName]);

  return (
    <div className="app-layout">
      {/* ── DESKTOP SIDEBAR ── */}
      {userRole !== 'guest' && (
        <aside className="sidebar">
          <div>
            <div className="sidebar-logo">
              <div className="sidebar-logo-icon" style={{ background: 'none', padding: 0, overflow: 'hidden' }}>
                <img src="/logo-icon.svg" alt="iStore" style={{ width: 34, height: 34 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.textContent = 'iS'; }} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">iStore</h3>
                <span className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider">Medellín</span>
              </div>
            </div>

             <nav className="sidebar-menu">
               {userRole === 'admin' || userRole === 'tecnico' || userRole === 'vendedor' ? (
                 <>
                   <button 
                     onClick={() => setAdminTab('inicio')} 
                     className={`sidebar-btn ${adminTab === 'inicio' ? 'active' : ''}`}
                   >
                     <LayoutDashboard size={18} />
                     <span>Cola de Soporte</span>
                   </button>
                   <button 
                     onClick={() => setAdminTab('ingreso')} 
                     className={`sidebar-btn ${adminTab === 'ingreso' ? 'active' : ''}`}
                   >
                     <PlusCircle size={18} />
                     <span>Ingresar Equipo</span>
                   </button>
                   <button 
                     onClick={() => setAdminTab('inventario')} 
                     className={`sidebar-btn ${adminTab === 'inventario' ? 'active' : ''}`}
                   >
                     <Package size={18} />
                     <span>Inventario</span>
                   </button>
                   {userRole === 'admin' && (
                     <button 
                       onClick={() => setAdminTab('perfiles')} 
                       className={`sidebar-btn ${adminTab === 'perfiles' ? 'active' : ''}`}
                     >
                       <Users size={18} />
                       <span>Personal</span>
                     </button>
                   )}
                   {(userRole === 'admin' || userRole === 'tecnico') && (
                     <button
                       onClick={() => setAdminTab('informes')}
                       className={`sidebar-btn ${adminTab === 'informes' ? 'active' : ''}`}
                     >
                       <BarChart3 size={18} />
                       <span>Informes</span>
                     </button>
                   )}
                   {(userRole === 'admin' || userRole === 'vendedor') && (
                     <button
                       onClick={() => setAdminTab('ventas')}
                       className={`sidebar-btn ${adminTab === 'ventas' ? 'active' : ''}`}
                     >
                       <ShoppingCart size={18} />
                       <span>Venta Mostrador</span>
                     </button>
                   )}
                   {(userRole === 'admin' || userRole === 'vendedor') && (
                     <button
                       onClick={() => setAdminTab('cuentas')}
                       className={`sidebar-btn ${adminTab === 'cuentas' ? 'active' : ''}`}
                     >
                       <FileText size={18} />
                       <span>Cuentas por Cobrar</span>
                     </button>
                   )}
                   {userRole === 'admin' && (
                     <button
                       onClick={() => setAdminTab('comisiones')}
                       className={`sidebar-btn ${adminTab === 'comisiones' ? 'active' : ''}`}
                     >
                       <DollarSign size={18} />
                       <span>Comisiones Técnicos</span>
                     </button>
                   )}
                 </>
               ) : (
                 <>
                   <button 
                     onClick={() => setPrefTab('equipos')}
                     className={`sidebar-btn ${prefTab === 'equipos' ? 'active' : ''}`}
                   >
                     <Smartphone size={18} />
                     <span>Mis Equipos</span>
                   </button>
                   <button
                     onClick={() => setPrefTab('ingresar')}
                     className={`sidebar-btn ${prefTab === 'ingresar' ? 'active' : ''}`}
                   >
                     <PlusCircle size={18} />
                     <span>Ingresar Equipo</span>
                   </button>
                   <button
                     onClick={() => setPrefTab('cuentas')}
                     className={`sidebar-btn ${prefTab === 'cuentas' ? 'active' : ''}`}
                   >
                     <FileText size={18} />
                     <span>Mis Cuentas</span>
                   </button>
                   <button
                     onClick={() => sendWhatsAppMessage(`Hola Sr Tech, soy el cliente preferencial ${loggedClientName}. Tengo una consulta técnica...`)}
                     className="sidebar-btn"
                   >
                     <Phone size={18} />
                     <span>WhatsApp Soporte</span>
                   </button>
                 </>
               )}
             </nav>
          </div>

          <div className="sidebar-footer">
            <div className="sidebar-user-card">
              <div className="sidebar-user-avatar">
                {userRole === 'admin' ? 'AD' : userRole === 'tecnico' ? 'TE' : userRole === 'vendedor' ? 'VE' : loggedClientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">
                  {userRole === 'admin' ? 'Administrador' : loggedClientName || (userRole === 'tecnico' ? 'Técnico' : 'Vendedor')}
                </span>
                <span className="sidebar-user-role text-indigo-400">
                  {userRole === 'admin' ? 'Gerente General' : userRole === 'tecnico' ? 'Técnico de Soporte' : userRole === 'vendedor' ? 'Ventas' : 'Cliente Preferencial'}
                </span>
              </div>
            </div>
            <button 
              onClick={() => setUserRole('guest')}
              className="flex items-center justify-center gap-2 w-full bg-red-500/10 border border-red-500/20 hover:bg-red-500/25 py-2.5 rounded-lg text-xs font-semibold text-red-500 transition-all duration-200"
            >
              <LogOut size={14} /> Salir del Portal
            </button>
          </div>
        </aside>
      )}

      <div className="main-viewport">
        {/* ── MOBILE HEADER ── */}
        {userRole !== 'guest' && (
          <header className="mobile-header">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#007AFF] to-[#0055CC] flex items-center justify-center font-bold text-white text-sm shadow-md">ST</div>
              <span className="font-bold text-sm tracking-tight text-white">Sr Tech</span>
            </div>
            <button 
              onClick={() => setUserRole('guest')}
              className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </header>
        )}

        {/* ── MAIN CONTENT AREA ── */}
        <main className="main-content no-scrollbar">
          
          {/* ── SCREEN 0: LOGIN / AUTH ── */}
          {userRole === 'guest' && (
            <div className="animate-fade-in flex items-center justify-center" style={{minHeight:'100vh', background:'#0a0a12'}}>
              {/* Glow background */}
              <div className="fixed inset-0 pointer-events-none" style={{background:'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(197,160,89,0.08) 0%, transparent 70%)'}}/>

              <div className="relative z-10 w-full max-w-[320px] mx-auto px-4 py-10 space-y-8">

                {/* Logo + nombre */}
                <div className="flex flex-col items-center gap-4">
                  <div style={{
                    width:72, height:72, borderRadius:18,
                    background:'linear-gradient(145deg,#1c1c2a,#111118)',
                    border:'1.5px solid rgba(197,160,89,0.25)',
                    boxShadow:'0 8px 32px rgba(197,160,89,0.15), 0 0 0 1px rgba(197,160,89,0.05)',
                    display:'flex', alignItems:'center', justifyContent:'center'
                  }}>
                    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                      <rect x="8" y="3" width="24" height="34" rx="5" fill="none" stroke="#C5A059" strokeWidth="1.8"/>
                      <rect x="11" y="7" width="18" height="24" rx="2.5" fill="rgba(197,160,89,0.07)"/>
                      <rect x="15" y="3" width="10" height="3" rx="1.5" fill="#111118"/>
                      <circle cx="20" cy="11.5" r="2.2" fill="#C5A059"/>
                      <rect x="18.2" y="15.5" width="3.6" height="12" rx="1.8" fill="#C5A059"/>
                      <rect x="15.5" y="33" width="9" height="2" rx="1" fill="rgba(197,160,89,0.35)"/>
                      <rect x="6.2" y="14" width="1.8" height="6" rx="0.9" fill="rgba(197,160,89,0.45)"/>
                      <rect x="6.2" y="22" width="1.8" height="8" rx="0.9" fill="rgba(197,160,89,0.45)"/>
                      <rect x="32" y="17" width="1.8" height="7" rx="0.9" fill="rgba(197,160,89,0.45)"/>
                    </svg>
                  </div>
                  <div className="text-center">
                    <div className="text-[28px] font-black tracking-tight leading-none" style={{
                      background:'linear-gradient(135deg,#E8C97A 0%,#C5A059 50%,#9A7230 100%)',
                      WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'
                    }}>iStore</div>
                    <div className="text-[10px] font-semibold tracking-[0.3em] uppercase mt-1" style={{color:'rgba(255,255,255,0.3)'}}>Medellín · Soporte Técnico</div>
                  </div>
                </div>

                {/* Card del formulario */}
                <div style={{
                  background:'rgba(255,255,255,0.03)',
                  border:'1px solid rgba(255,255,255,0.07)',
                  borderRadius:16,
                  padding:'28px 24px',
                  backdropFilter:'blur(12px)'
                }}>
                  <h2 className="text-base font-bold text-white mb-1 text-center">Iniciar sesión</h2>
                  <p className="text-xs mb-6 text-center" style={{color:'rgba(255,255,255,0.35)'}}>Ingresa tus credenciales para acceder</p>

                  <form onSubmit={handleLogin} className="space-y-4" style={{maxWidth:260, margin:'0 auto'}}>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider" style={{color:'rgba(255,255,255,0.4)'}}>Usuario</label>
                      <input type="text" value={prefClientUser}
                        onChange={(e) => setPrefClientUser(e.target.value)}
                        placeholder="Ingresa tu usuario" required style={{maxWidth:'100%'}} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider" style={{color:'rgba(255,255,255,0.4)'}}>Contraseña</label>
                      <input type="password" value={prefClientPass}
                        onChange={(e) => setPrefClientPass(e.target.value)}
                        placeholder="••••••••" required style={{maxWidth:'100%'}} />
                    </div>
                    {loginError && (
                      <p className="text-xs text-red-400 text-center font-medium bg-red-500/10 py-2 px-3 rounded-lg border border-red-500/20">
                        Usuario o contraseña incorrectos.
                      </p>
                    )}
                    <button type="submit" className="btn-primary py-3 mt-1" style={{width:'100%'}}>
                      Ingresar al Sistema
                    </button>
                  </form>
                </div>

                <p className="text-center text-[10px]" style={{color:'rgba(255,255,255,0.2)'}}>© 2026 iStore Medellín</p>
              </div>
            </div>
          )}

          {/* ── ROLE: ADMINISTRADOR ── */}
          {(userRole === 'admin' || userRole === 'tecnico' || userRole === 'vendedor') && (
            <div className="animate-fade-in space-y-6">
              
              {/* Admin Header Section */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/5 pb-5">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">
                    {userRole === 'admin' ? 'Panel Administrativo' : userRole === 'tecnico' ? 'Panel de Técnico' : 'Panel de Ventas'}
                  </h2>
                  <p className="text-xs text-neutral-400">
                    {userRole === 'admin' ? 'Gestión integral' : userRole === 'tecnico' ? 'Soporte y Diagnóstico' : 'Ventas y Atención'} · Sr Tech Medellín
                  </p>
                </div>
                <div className="self-start sm:self-center flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-[#C5A059] px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md">
                  <span className="w-2 h-2 rounded-full bg-[#007AFF] animate-pulse"></span>
                  Modo {userRole === 'admin' ? 'Administrador' : userRole === 'tecnico' ? 'Técnico' : 'Vendedor'}
                </div>
              </div>

              {/* Sub-tab 1: Inicio (Reparaciones activas & Notificaciones) */}
              {adminTab === 'inicio' && (
                <div className="space-y-6 animate-fade-in">

                  {/* Repairs visible según rol: técnico ve los sin asignar + los suyos; admin ve todo */}
                  {(() => {
                    const visibleRepairs = userRole === 'tecnico'
                      ? repairs.filter(r => r.status === 'recibido' || r.assignedTechId === loggedUserId)
                      : repairs;

                  return <>
                  {/* KPI Summary Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="glass-card no-hover p-4 flex items-center gap-3">
                      <div className="kpi-icon kpi-icon-blue"><ClipboardList size={18} /></div>
                      <div>
                        <div className="kpi-value">{visibleRepairs.length}</div>
                        <div className="kpi-label">{userRole === 'tecnico' ? 'Mis Órdenes' : 'Total Órdenes'}</div>
                      </div>
                    </div>
                    <div className="glass-card no-hover p-4 flex items-center gap-3">
                      <div className="kpi-icon kpi-icon-amber"><Clock size={18} /></div>
                      <div>
                        <div className="kpi-value">{visibleRepairs.filter(r => r.status === 'recibido').length}</div>
                        <div className="kpi-label">Pend. Validación</div>
                      </div>
                    </div>
                    <div className="glass-card no-hover p-4 flex items-center gap-3">
                      <div className="kpi-icon kpi-icon-purple"><Wrench size={18} /></div>
                      <div>
                        <div className="kpi-value">{visibleRepairs.filter(r => r.status === 'validado_fisico' || r.status === 'en_reparacion').length}</div>
                        <div className="kpi-label">En Proceso</div>
                      </div>
                    </div>
                    <div className="glass-card no-hover p-4 flex items-center gap-3">
                      <div className="kpi-icon kpi-icon-green"><CheckCircle2 size={18} /></div>
                      <div>
                        <div className="kpi-value">{visibleRepairs.filter(r => r.status === 'entregado').length}</div>
                        <div className="kpi-label">Entregados</div>
                      </div>
                    </div>
                  </div>

                  {/* Notifications Alert */}
                  {adminNotifications.length > 0 && (
                    <div className="glass-card p-5 border-l-4 border-l-indigo-500 space-y-3 bg-indigo-500/5">
                      <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs tracking-wider">
                        <ShieldAlert size={16} /> NOTIFICACIONES DE INGRESO
                      </div>
                      <div className="space-y-1.5">
                        {adminNotifications.map((note, idx) => (
                          <p key={idx} className="text-xs leading-relaxed text-neutral-200 font-medium">{note}</p>
                        ))}
                      </div>
                      <button
                        onClick={() => setAdminNotifications([])}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold underline block pt-1"
                      >
                        Marcar todas como leídas
                      </button>
                    </div>
                  )}

                  {/* Repairs List */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      {userRole === 'tecnico' ? 'Mis equipos asignados' : 'Cola de soporte técnico'}
                    </h3>
                    {visibleRepairs.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-16 text-center gap-3 border border-dashed border-white/10 rounded-xl">
                        <CheckCircle2 size={32} className="text-neutral-600" />
                        <p className="text-sm font-semibold text-neutral-500">
                          {userRole === 'tecnico' ? 'No tienes equipos asignados' : 'No hay órdenes en la cola'}
                        </p>
                        <p className="text-xs text-neutral-600">
                          {userRole === 'tecnico' ? 'Los equipos que ingreses o te asignen aparecerán aquí.' : 'Las reparaciones ingresadas aparecerán aquí.'}
                        </p>
                      </div>
                    )}
                    <div className="responsive-grid-2">
                      {visibleRepairs.map(rep => {
                        const tech = profiles.find(p => p.id === rep.assignedTechId);
                        return (
                          <div key={rep.id} className="glass-card p-6 flex flex-col justify-between space-y-5">
                            <div className="space-y-3">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                    {rep.id} {rep.consecutivoRecepcion && `· Recepción: ${rep.consecutivoRecepcion}`}
                                  </span>
                                  <h4 className="font-semibold text-base mt-1.5 text-white">{rep.reference} <span className="font-normal text-neutral-400">({rep.color})</span></h4>
                                  <p className="text-[11px] text-neutral-500 font-medium mt-0.5">IMEI: {rep.imei}</p>
                                </div>
                                <span className={`flex items-center gap-1.5 text-[10px] font-semibold tracking-wide flex-shrink-0 ${
                                  rep.status === 'recibido' ? 'text-amber-400' :
                                  rep.status === 'validado_fisico' ? 'text-blue-400' :
                                  rep.status === 'en_reparacion' ? 'text-blue-400' :
                                  rep.status === 'entregado' ? 'text-green-400' :
                                  'text-red-400'
                                }`}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0"></span>
                                  {rep.status === 'recibido' ? 'Pendiente' :
                                   rep.status === 'validado_fisico' ? 'Validado' :
                                   rep.status === 'en_reparacion' ? 'En Taller' :
                                   rep.status === 'entregado' ? 'Entregado' : 'No Reparado'}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-300 bg-neutral-950/40 p-2.5 rounded-lg border border-white/5 italic">Falla: {rep.repairType}</p>
                              
                              {/* Display physical details and photos if validated */}
                              {rep.physicalDetails && (
                                <div className="bg-white/3 p-3 rounded-lg border border-white/5 text-xs space-y-2">
                                  <span className="text-[9px] text-neutral-400 uppercase font-semibold tracking-wider block">Inspección Física</span>
                                  <p className="text-neutral-300">• {rep.physicalDetails}</p>
                                  {rep.photoUrl && (
                                    <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] pt-1">
                                      <Camera size={12} />
                                      <span>Registro fotográfico ({rep.photoUrl})</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs border-t border-white/5 pt-4">
                              <div>
                                <span className="text-[9px] text-neutral-400 uppercase font-bold tracking-wider block mb-0.5">Técnico Asignado</span>
                                <span className="font-semibold text-white">
                                  {tech ? tech.name : (rep.status === 'recibido' ? 'Pendiente de validación' : 'Sin asignar')}
                                </span>
                              </div>
                              <div>
                                <span className="text-[9px] text-neutral-400 uppercase font-bold tracking-wider block mb-0.5">Cliente</span>
                                <span className="font-semibold text-white capitalize">{rep.clientName} ({rep.clientType})</span>
                              </div>
                            </div>

                            {/* Quote display or Workflow actions */}
                            <div className="bg-neutral-900/40 p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                              {rep.status === 'recibido' ? (
                                <div className="w-full">
                                  <button 
                                    onClick={() => {
                                      setSelectedRepairForValidation(rep);
                                      setValConsecutivo(`REC-2026-${Math.floor(100 + Math.random() * 900)}`);
                                      setValPhysicalDetails('Biseles con desgaste menor, pantalla original en buen estado, cámaras operativas.');
                                    }}
                                    className="btn-primary py-2.5 px-4 text-xs font-bold w-full flex items-center justify-center gap-1.5 bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/10"
                                  >
                                    <FileText size={14} /> Realizar Validación Física
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div>
                                    <span className="text-[9px] text-neutral-400 uppercase font-bold tracking-wider block mb-0.5">Presupuesto</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-white text-sm">
                                        {rep.quotePrice ? `COP $${rep.quotePrice.toLocaleString('es-CO')}` : 'Sin Cotizar'}
                                      </span>
                                      {rep.quoteStatus && (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                          rep.quoteStatus === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                          rep.quoteStatus === 'declined' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                        }`}>
                                          {rep.quoteStatus}
                                        </span>
                                      )}
                                    </div>
                                    {rep.priceAdjustmentReason && (
                                      <div className="text-[10px] text-indigo-300 mt-1 italic flex items-center gap-1">
                                        <TrendingUp size={11} className="flex-shrink-0" /> {rep.priceAdjustmentReason}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                    {rep.status === 'validado_fisico' ? (
                                      <button
                                        onClick={() => openQuoteModal(rep)}
                                        className="btn-primary py-2 px-3 text-[11px] font-bold flex-1 sm:flex-none"
                                      >
                                        Asignar y Cotizar
                                      </button>
                                    ) : (
                                      rep.status !== 'entregado' && (
                                        <button
                                          onClick={() => openQuoteModal(rep)}
                                          className="bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold px-3 py-2 rounded-lg text-center flex-1 sm:flex-none"
                                        >
                                          Editar Cotización
                                        </button>
                                      )
                                    )}

                                    {rep.status !== 'validado_fisico' && rep.status !== 'entregado' && (
                                      <button
                                        onClick={() => handleUpdateRepairStatus(rep.id, 'entregado')}
                                        className="bg-green-500 hover:bg-green-600 text-neutral-950 text-[11px] font-bold px-3 py-2 rounded-lg flex-1 sm:flex-none text-center"
                                      >
                                        Entregar
                                      </button>
                                    )}

                                    {rep.status !== 'validado_fisico' && rep.status !== 'no_reparado' && rep.status !== 'entregado' && (
                                      <button
                                        onClick={() => handleUpdateRepairStatus(rep.id, 'no_reparado')}
                                        className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[11px] font-bold px-3 py-2 rounded-lg flex-1 sm:flex-none text-center"
                                      >
                                        No Reparar
                                      </button>
                                    )}

                                    {rep.clientType === 'preferencial' && (
                                      <button
                                        onClick={() => notifyRepairByWA(rep)}
                                        className="flex items-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-[11px] font-bold px-3 py-2 rounded-lg flex-1 sm:flex-none"
                                      >
                                        <MessageCircle size={12} /> Notificar WA
                                      </button>
                                    )}

                                    <button
                                      onClick={() => handleDeleteRepair(rep.id)}
                                      className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[11px] font-bold px-3 py-2 rounded-lg flex-1 sm:flex-none text-center"
                                    >
                                      Borrar
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  </>;
                  })()}
                </div>
              )}

              {/* Sub-tab 2: Ingreso de Equipo (Intake with IMEI Lookup) */}
              {adminTab === 'ingreso' && (
                <form onSubmit={handleIntakeSubmit} className="glass-card p-6 space-y-6 animate-fade-in max-w-2xl mx-auto">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-indigo-400 border-b border-white/5 pb-3">Registro de Equipo en Taller</h3>
                  
                  {intakeSuccessMsg && (
                    <div className="bg-green-500/10 text-green-400 p-4 rounded-xl text-xs font-semibold text-center border border-green-500/25">
                      ✓ Equipo registrado exitosamente en la cola de soporte.
                    </div>
                  )}

                  {/* IMEI lookup */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Buscar por IMEI / Número de Serie</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input 
                        type="text" 
                        value={intakeImei}
                        onChange={(e) => setIntakeImei(e.target.value)}
                        placeholder="Ej: 35890... o 35900..."
                        required
                      />
                      <button 
                        type="button" 
                        onClick={handleImeiLookup} 
                        className="btn-secondary py-3"
                      >
                        {imeiLoading ? 'Buscando...' : 'Consultar'}
                      </button>
                    </div>

                  </div>

                  {imeiSuccess && (
                    <div className="space-y-2">
                      <div className="bg-indigo-500/5 p-4 rounded-xl text-xs space-y-2 border border-indigo-500/20 animate-fade-in">
                        <span className="font-bold text-indigo-400 uppercase text-[9px] tracking-wider block">
                          {isImeiSimulated ? 'IMEI no reconocido — ingresa manualmente:' : 'Datos verificados (base TAC):'}
                        </span>
                        <div className="grid grid-cols-3 gap-2 text-white">
                          <p><span className="text-neutral-400">Referencia:</span> <br/><span className="font-semibold text-sm">{intakeRef || '-'}</span></p>
                          <p><span className="text-neutral-400">Color:</span> <br/><span className="font-semibold text-sm">{intakeColor || '-'}</span></p>
                          <p><span className="text-neutral-400">Capacidad:</span> <br/><span className="font-semibold text-sm">{intakeCapacity || '-'}</span></p>
                        </div>
                      </div>
                      {isImeiSimulated && (
                        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-lg text-[10px] flex items-center gap-2">
                          <AlertTriangle size={14} className="shrink-0" />
                          <span>IMEI no encontrado en la base de datos. Ingresa el modelo, color y capacidad manualmente según el equipo.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Locked details (loaded from IMEI lookup) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Referencia</label>
                      <input 
                        type="text" 
                        value={intakeRef}
                        onChange={(e) => setIntakeRef(e.target.value)}
                        placeholder="Ej: iPhone 15 Pro Max"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Color</label>
                      <input 
                        type="text" 
                        value={intakeColor}
                        onChange={(e) => setIntakeColor(e.target.value)}
                        placeholder="Ej: Titanio Natural"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Capacidad</label>
                      <input 
                        type="text" 
                        value={intakeCapacity}
                        onChange={(e) => setIntakeCapacity(e.target.value)}
                        placeholder="Ej: 256GB"
                        required
                      />
                    </div>
                  </div>

                  {/* Repair description */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Tipo de arreglo / Falla</label>
                    <textarea 
                      value={intakeRepairType}
                      onChange={(e) => setIntakeRepairType(e.target.value)}
                      placeholder="Describe detalladamente el daño o servicio requerido..."
                      rows={3}
                      required
                    />
                  </div>

                  {/* Client detail */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Nombre del Cliente</label>
                      <input 
                        type="text" 
                        value={intakeClientName}
                        onChange={(e) => setIntakeClientName(e.target.value)}
                        placeholder="Ej: Juan Ochoa"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Tipo Cliente</label>
                      <select 
                        value={intakeClientType}
                        onChange={(e) => setIntakeClientType(e.target.value as any)}
                      >
                        <option value="regular">Regular</option>
                        <option value="preferencial">Preferencial (Usuario CRM)</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary w-full py-3.5">
                    Registrar Ingreso de Equipo (Cola Recibidos)
                  </button>
                </form>
              )}

              {/* Sub-tab 3: Inventario (Equipos y Repuestos) */}
              {adminTab === 'inventario' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Form to add item */}
                  <form onSubmit={handleAddProduct} className="glass-card p-6 space-y-4 max-w-2xl mx-auto">
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-neutral-400 border-b border-white/5 pb-2">Agregar Equipo o Repuesto</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Nombre</label>
                        <input 
                          type="text" 
                          value={newProdName}
                          onChange={(e) => setNewProdName(e.target.value)}
                          placeholder="Ej: Pantalla iPhone 14"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Categoría</label>
                        <select 
                          value={newProdCategory}
                          onChange={(e) => setNewProdCategory(e.target.value as any)}
                        >
                          <option value="iphone">iPhone</option>
                          <option value="mac">Mac / Computadora</option>
                          <option value="repuesto">Repuestos / Partes</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Stock inicial</label>
                        <input 
                          type="number" 
                          value={newProdStock}
                          onChange={(e) => setNewProdStock(parseInt(e.target.value))}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Precio Compra (COP)</label>
                        <input 
                          type="number" 
                          value={newProdPurchasePrice}
                          onChange={(e) => setNewProdPurchasePrice(parseInt(e.target.value))}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Precio Venta (COP)</label>
                        <input 
                          type="number" 
                          value={newProdPrice}
                          onChange={(e) => setNewProdPrice(parseInt(e.target.value))}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Especificaciones</label>
                        <input 
                          type="text" 
                          value={newProdSpecs}
                          onChange={(e) => setNewProdSpecs(e.target.value)}
                          placeholder="Color, capacidad, estado, etc."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">IMEI / Serial (Garantía)</label>
                        <input 
                          type="text" 
                          value={newProdImei}
                          onChange={(e) => setNewProdImei(e.target.value)}
                          placeholder="Opcional. Ej: 350578807..."
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn-primary w-full py-3">Agregar al Inventario</button>
                  </form>

                  {/* Inventory List (Excel-style) */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <h4 className="font-semibold text-xs uppercase tracking-wider text-neutral-400">Hoja de Inventario</h4>
                      <div className="w-full sm:w-80">
                        <input
                          type="text"
                          placeholder="Buscar por nombre, categoría o especificaciones..."
                          value={inventorySearch}
                          onChange={(e) => setInventorySearch(e.target.value)}
                          className="w-full text-xs bg-black/40 border border-white/10 rounded-xl text-white py-2 px-3 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto border border-white/5 rounded-xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-white/5 text-neutral-400 uppercase tracking-wider font-bold text-[10px] border-b border-white/10">
                            <th className="p-3 border-r border-white/5">ID</th>
                            <th className="p-3 border-r border-white/5">Nombre</th>
                            <th className="p-3 border-r border-white/5">Categoría</th>
                            <th className="p-3 border-r border-white/5">Especificaciones</th>
                            <th className="p-3 border-r border-white/5">IMEI / Serial</th>
                            <th className="p-3 border-r border-white/5 text-right">Precio Compra</th>
                            <th className="p-3 border-r border-white/5 text-right">Precio Venta</th>
                            <th className="p-3 border-r border-white/5 text-center">Stock</th>
                            <th className="p-3 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProducts.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="p-4 text-center text-neutral-500">No se encontraron productos en el inventario.</td>
                            </tr>
                          ) : (
                            filteredProducts.map((prod) => (
                              <tr key={prod.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                                <td className="p-3 border-r border-white/5 font-mono text-[10px] text-neutral-400">{prod.id}</td>
                                <td className="p-3 border-r border-white/5 font-semibold text-white">{prod.name}</td>
                                <td className="p-3 border-r border-white/5 uppercase text-[10px] text-indigo-400 font-semibold">{prod.category}</td>
                                <td className="p-3 border-r border-white/5 text-neutral-300 max-w-[200px] truncate" title={prod.specs}>{prod.specs || '-'}</td>
                                <td className="p-3 border-r border-white/5 font-mono text-neutral-300">{prod.imei || '-'}</td>
                                <td className="p-3 border-r border-white/5 text-right font-medium text-neutral-300">${prod.purchasePrice?.toLocaleString('es-CO') || 0}</td>
                                <td className="p-3 border-r border-white/5 text-right font-bold text-indigo-300">${prod.price.toLocaleString('es-CO')}</td>
                                <td className="p-3 border-r border-white/5 text-center">
                                  <span className={`font-bold text-[11px] px-2.5 py-0.5 rounded ${
                                    prod.stock <= 3 
                                      ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                                      : 'bg-green-500/10 text-green-400 border border-green-500/20'
                                  }`}>
                                    {prod.stock} uds {prod.stock <= 3 && '⚠️'}
                                  </span>
                                </td>
                                <td className="p-3 text-center flex gap-1.5 justify-center">
                                  <button 
                                    onClick={() => startEditProduct(prod)}
                                    className="bg-[#C5A059]/10 hover:bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/20 p-2 rounded-lg transition-all shadow-sm flex items-center justify-center"
                                    title="Editar Producto"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteProduct(prod.id)}
                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 p-2 rounded-lg transition-all shadow-sm flex items-center justify-center"
                                    title="Borrar Producto"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Modal: Editar Producto */}
                  {editingProduct && (
                    <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="glass-card max-w-lg w-full p-6 space-y-4 animate-scale-up relative">
                        <button 
                          onClick={() => setEditingProduct(null)}
                          className="absolute top-4 right-4 text-neutral-400 hover:text-white"
                        >
                          <X size={18} />
                        </button>
                        
                        <h3 className="font-bold text-sm uppercase tracking-wider text-[#C5A059] border-b border-white/5 pb-2">Editar Producto</h3>
                        
                        <form onSubmit={handleSaveProductEdit} className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Nombre</label>
                            <input 
                              type="text" 
                              value={editProdName} 
                              onChange={(e) => setEditProdName(e.target.value)} 
                              required 
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Categoría</label>
                              <select 
                                value={editProdCategory} 
                                onChange={(e) => setEditProdCategory(e.target.value as any)}
                              >
                                <option value="iphone">iPhone</option>
                                <option value="mac">Mac / Computadora</option>
                                <option value="repuesto">Repuestos / Partes</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Stock</label>
                              <input 
                                type="number" 
                                value={editProdStock} 
                                onChange={(e) => setEditProdStock(parseInt(e.target.value))} 
                                required 
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">P. Compra (COP)</label>
                              <input 
                                type="number" 
                                value={editProdPurchasePrice} 
                                onChange={(e) => setEditProdPurchasePrice(parseInt(e.target.value))} 
                                required 
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">P. Venta (COP)</label>
                              <input 
                                type="number" 
                                value={editProdPrice} 
                                onChange={(e) => setEditProdPrice(parseInt(e.target.value))} 
                                required 
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Especificaciones</label>
                              <input 
                                type="text" 
                                value={editProdSpecs} 
                                onChange={(e) => setEditProdSpecs(e.target.value)} 
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">IMEI / Serial (Garantía)</label>
                              <input 
                                type="text" 
                                value={editProdImei} 
                                onChange={(e) => setEditProdImei(e.target.value)} 
                              />
                            </div>
                          </div>

                          <div className="flex gap-3 pt-2">
                            <button 
                              type="submit" 
                              className="btn-primary flex-1 py-2.5 text-xs font-bold"
                            >
                              Guardar Cambios
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setEditingProduct(null)}
                              className="bg-white/5 border border-white/10 hover:bg-white/10 text-white flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 4: Personal (Técnicos, Vendedores & Clientes Preferenciales) */}
              {adminTab === 'perfiles' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Form to add profile */}
                  <form onSubmit={handleAddProfile} className="glass-card p-6 space-y-4 max-w-2xl mx-auto">
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-neutral-400 border-b border-white/5 pb-2">Crear Perfil de Usuario (Roles)</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Nombre Completo</label>
                        <input 
                          type="text" 
                          value={newProfileName}
                          onChange={(e) => setNewProfileName(e.target.value)}
                          placeholder="Ej: Mateo Henao o Juan Ochoa"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Rol de Sistema</label>
                        <select 
                          value={newProfileRole}
                          onChange={(e) => setNewProfileRole(e.target.value as any)}
                        >
                          <option value="admin">Administrador</option>
                          <option value="tecnico">Técnico de Taller</option>
                          <option value="vendedor">Vendedor de Mostrador</option>
                          <option value="preferencial">Cliente Preferencial</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Nombre de Usuario (Login)</label>
                        <input 
                          type="text" 
                          value={newProfileUsername}
                          onChange={(e) => setNewProfileUsername(e.target.value)}
                          placeholder="Ej: mateo_h"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Clave de Acceso</label>
                        <input 
                          type="password" 
                          value={newProfilePassword}
                          onChange={(e) => setNewProfilePassword(e.target.value)}
                          placeholder="Clave numérica o texto"
                          required
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn-primary w-full py-3">Crear Perfil de Usuario</button>
                  </form>

                  {/* Profiles List */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-neutral-400">Usuarios y Roles Registrados</h4>
                    <div className="responsive-grid-3">
                      {profiles.map(prof => (
                        <div key={prof.id} className="glass-card p-5 flex flex-col justify-between space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 text-sm">
                                {prof.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                              <div>
                                <h5 className="font-bold text-sm text-white leading-tight">{prof.name}</h5>
                                <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold capitalize">{prof.role === 'preferencial' ? 'preferencial / cliente' : prof.role}</span>
                              </div>
                            </div>
                            <span className="bg-green-500/10 text-green-400 border border-green-500/20 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                              {prof.status}
                            </span>
                          </div>
                          {prof.username && (
                            <div className="bg-neutral-900/40 p-2.5 rounded-lg border border-white/5 text-[11px] text-neutral-450 font-mono space-y-2">
                              <div className="flex justify-between items-center">
                                <div className="flex flex-col gap-1">
                                  <span>user: <span className="text-white">{prof.username}</span></span>
                                  <span>pass: <span className="text-white">{'*'.repeat(prof.password?.length || 6)}</span></span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setEditingPassId(editingPassId === prof.id ? null : prof.id)}
                                  className="p-1 rounded bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition flex items-center justify-center"
                                  title="Editar clave"
                                >
                                  <Key size={13} />
                                </button>
                              </div>
                              {editingPassId === prof.id && (
                                <div className="flex gap-1.5 mt-1.5 pt-1.5 border-t border-white/5 animate-fade-in">
                                  <input
                                    type="password"
                                    placeholder="Nueva clave"
                                    defaultValue={prof.password || ''}
                                    id={`edit-pass-${prof.id}`}
                                    className="flex-1 bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-white focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      const input = document.getElementById(`edit-pass-${prof.id}`) as HTMLInputElement;
                                      if (input) {
                                        await handleUpdatePassword(prof.id, input.value);
                                        setEditingPassId(null);
                                      }
                                    }}
                                    style={{ background: 'linear-gradient(135deg, #FFD700, #DAA520)' }}
                                    className="hover:opacity-90 text-white p-1 rounded transition shrink-0 flex items-center justify-center w-6 h-6"
                                    title="Guardar"
                                  >
                                    <Check size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab 5: Informes */}
              {adminTab === 'informes' && (
                <div className="space-y-6 animate-fade-in">

                  {/* ── Informe Diario ─────────────────────────────────── */}
                  <div className="glass-card p-6 space-y-5" style={{borderLeft: '3px solid #C5A059'}}>
                    {/* Header con selector de fecha */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                      <div>
                        <h3 className="font-bold text-sm uppercase tracking-wider text-[#C5A059]">
                          Informe del Día
                        </h3>
                        <p className="text-[10px] text-neutral-500 mt-0.5">
                          {userRole === 'tecnico' ? 'Tus resultados del día seleccionado' : 'Resumen operativo de la empresa'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const d = new Date(reportDate); d.setDate(d.getDate() - 1);
                            setReportDate(d.toISOString().split('T')[0]);
                          }}
                          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-all text-sm"
                        >‹</button>
                        <input
                          type="date"
                          value={reportDate}
                          onChange={e => setReportDate(e.target.value)}
                          className="bg-black/40 border border-white/10 rounded-lg text-xs text-white px-3 py-1.5 focus:outline-none focus:border-[#C5A059]"
                        />
                        <button
                          onClick={() => {
                            const d = new Date(reportDate); d.setDate(d.getDate() + 1);
                            const today = new Date().toISOString().split('T')[0];
                            if (d.toISOString().split('T')[0] <= today)
                              setReportDate(d.toISOString().split('T')[0]);
                          }}
                          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-all text-sm"
                        >›</button>
                        <button
                          onClick={() => setReportDate(new Date().toISOString().split('T')[0])}
                          className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-[rgba(197,160,89,0.1)] border border-[rgba(197,160,89,0.2)] text-[#C5A059] hover:bg-[rgba(197,160,89,0.18)] transition-all"
                        >Hoy</button>
                      </div>
                    </div>

                    {/* KPIs del día */}
                    <div className={`grid gap-3 ${userRole === 'tecnico' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-4'}`}>
                      {userRole !== 'tecnico' && (
                        <div className="bg-black/30 rounded-xl p-4 border border-white/5 space-y-1">
                          <span className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider block">Ventas POS</span>
                          <p className="text-lg font-extrabold text-[#C5A059]">${dailySalesTotal.toLocaleString('es-CO')}</p>
                          <p className="text-[10px] text-neutral-400">{dailySales.length} transacciones</p>
                        </div>
                      )}
                      <div className="bg-black/30 rounded-xl p-4 border border-white/5 space-y-1">
                        <span className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider block">Reparaciones</span>
                        <p className="text-lg font-extrabold text-white">${dailyRepairRev.toLocaleString('es-CO')}</p>
                        <p className="text-[10px] text-neutral-400">{dailyRepairs.length} entregadas</p>
                      </div>
                      <div className="bg-black/30 rounded-xl p-4 border border-white/5 space-y-1">
                        <span className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider block">Costo Repuestos</span>
                        <p className="text-lg font-extrabold text-red-400">${dailyRepairParts.toLocaleString('es-CO')}</p>
                        <p className="text-[10px] text-neutral-400">materiales usados</p>
                      </div>
                      <div className="bg-black/30 rounded-xl p-4 border border-[rgba(197,160,89,0.15)] bg-[rgba(197,160,89,0.04)] space-y-1">
                        <span className="text-[9px] uppercase font-bold text-[#C5A059] tracking-wider block">
                          {userRole === 'tecnico' ? `Mi Comisión (${techCommissionRate}%)` : 'Utilidad Neta'}
                        </span>
                        <p className="text-lg font-extrabold text-emerald-400">
                          {userRole === 'tecnico'
                            ? `$${Math.round(dailyRepairUtil * techCommissionRate / 100).toLocaleString('es-CO')}`
                            : `$${(dailySalesTotal * 0.2 + dailyRepairUtil).toLocaleString('es-CO')}`}
                        </p>
                        <p className="text-[10px] text-neutral-400">
                          {userRole === 'tecnico' ? `sobre $${dailyRepairUtil.toLocaleString('es-CO')} utilidad` : 'estimada'}
                        </p>
                      </div>
                    </div>

                    {/* Detalle por vendedor / técnico */}
                    {userRole !== 'tecnico' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* POS por vendedor */}
                        <div className="space-y-2">
                          <h4 className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Ventas POS por Vendedor</h4>
                          {Object.keys(dailySalesBySeller).length === 0 ? (
                            <p className="text-xs text-neutral-600 italic">Sin ventas POS este día</p>
                          ) : (
                            <div className="space-y-1.5">
                              {Object.entries(dailySalesBySeller).map(([seller, data]) => (
                                <div key={seller} className="flex items-center justify-between text-xs bg-black/20 rounded-lg px-3 py-2 border border-white/5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-[rgba(197,160,89,0.15)] flex items-center justify-center text-[#C5A059] text-[9px] font-bold">
                                      {seller.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-medium text-white">{seller}</span>
                                    <span className="text-neutral-500">· {data.count} vta{data.count !== 1 ? 's' : ''}</span>
                                  </div>
                                  <span className="font-bold text-[#C5A059]">${data.total.toLocaleString('es-CO')}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Reparaciones por técnico */}
                        <div className="space-y-2">
                          <h4 className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Reparaciones por Técnico</h4>
                          {Object.keys(dailyRepairsByTech).length === 0 ? (
                            <p className="text-xs text-neutral-600 italic">Sin reparaciones entregadas este día</p>
                          ) : (
                            <div className="space-y-1.5">
                              {Object.entries(dailyRepairsByTech).map(([tech, data]) => (
                                <div key={tech} className="flex items-center justify-between text-xs bg-black/20 rounded-lg px-3 py-2 border border-white/5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-neutral-300 text-[9px] font-bold">
                                      {tech.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-medium text-white">{tech}</span>
                                    <span className="text-neutral-500">· {data.count} eq.</span>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-white">${data.revenue.toLocaleString('es-CO')}</p>
                                    <p className="text-[9px] text-emerald-400">Comisión: ${data.commission.toLocaleString('es-CO')}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Vista técnico: detalle de sus reparaciones del día */}
                    {userRole === 'tecnico' && dailyRepairs.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Mis reparaciones del día</h4>
                        <div className="space-y-1.5">
                          {dailyRepairs.map(r => (
                            <div key={r.id} className="flex items-center justify-between text-xs bg-black/20 rounded-lg px-3 py-2 border border-white/5">
                              <div>
                                <span className="font-semibold text-white">{r.reference}</span>
                                <span className="text-neutral-400 ml-2">{r.color} · {r.repairType}</span>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-white">${(r.quotePrice || 0).toLocaleString('es-CO')}</p>
                                <p className="text-[9px] text-emerald-400">
                                  Comisión: ${Math.round(((r.quotePrice || 0) - (r.partsCost || 0)) * techCommissionRate / 100).toLocaleString('es-CO')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sin actividad */}
                    {dailySales.length === 0 && dailyRepairs.length === 0 && (
                      <p className="text-xs text-neutral-600 italic text-center py-2">
                        Sin actividad registrada para {new Date(reportDate + 'T12:00:00').toLocaleDateString('es-CO', {weekday: 'long', day: 'numeric', month: 'long'})}
                      </p>
                    )}
                  </div>
                  {/* ─────────────────────────────────────────────────────── */}

                  {/* Executive Summary widgets */}
                  {userRole === 'tecnico' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="glass-card p-6 flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Mis Trabajos Facturados</span>
                          <h4 className="text-xl font-extrabold text-[#C5A059]">${totalRepairsCost.toLocaleString('es-CO')}</h4>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-sm">
                          <CheckCircle2 size={20} />
                        </div>
                      </div>
                      <div className="glass-card p-6 flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Costo de Repuestos Usados</span>
                          <h4 className="text-xl font-extrabold text-red-400">${totalRepairsParts.toLocaleString('es-CO')}</h4>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shadow-sm">
                          <Package size={20} />
                        </div>
                      </div>
                      <div className="glass-card p-6 flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Utilidad Neta Taller</span>
                          <h4 className="text-xl font-extrabold text-emerald-400">${repairsUtility.toLocaleString('es-CO')}</h4>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-sm">
                          <Zap size={20} />
                        </div>
                      </div>
                      <div className="glass-card p-6 flex items-center justify-between bg-indigo-500/5 border border-indigo-500/10">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Mi Comisión ({techCommissionRate}%)</span>
                          <h4 className="text-xl font-extrabold text-indigo-400">${Math.round(repairsUtility * techCommissionRate / 100).toLocaleString('es-CO')}</h4>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-sm">
                          <BarChart3 size={20} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="glass-card p-6 flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Ventas Directas</span>
                          <h4 className="text-xl font-extrabold text-indigo-400">${totalSales.toLocaleString('es-CO')}</h4>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-sm">
                          <BarChart3 size={20} />
                        </div>
                      </div>
                      <div className="glass-card p-6 flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Reparaciones</span>
                          <h4 className="text-xl font-extrabold text-[#C5A059]">${totalRepairsCost.toLocaleString('es-CO')}</h4>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-sm">
                          <CheckCircle2 size={20} />
                        </div>
                      </div>
                      <div className="glass-card p-6 flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Retomas</span>
                          <h4 className="text-xl font-extrabold text-amber-500">${totalRetomas.toLocaleString('es-CO')}</h4>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-sm">
                          <TrendingUp size={20} />
                        </div>
                      </div>
                      <div className="glass-card p-6 flex items-center justify-between bg-emerald-500/5 border border-emerald-500/10">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Utilidad Neta</span>
                          <h4 className="text-xl font-extrabold text-emerald-400">${totalNetUtility.toLocaleString('es-CO')}</h4>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-sm">
                          <Zap size={20} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Profit breakdown by category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userRole !== 'tecnico' && (
                      <div className="glass-card p-6 space-y-4">
                        <h4 className="font-semibold text-xs uppercase tracking-wider text-neutral-400 flex items-center gap-2 border-b border-white/5 pb-2">
                          <Package size={16} /> UTILIDAD POR VENTAS DIRECTAS
                        </h4>
                        <div className="space-y-3 text-xs">
                          <div className="flex justify-between">
                            <span className="text-neutral-400">Ingresos Totales Ventas:</span>
                            <span className="text-white font-medium">${totalSales.toLocaleString('es-CO')}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-neutral-400">Margen de Utilidad Estimado:</span>
                            <span className="text-emerald-400 font-bold">${salesUtility.toLocaleString('es-CO')}</span>
                          </div>
                          <p className="text-[10px] text-neutral-500 italic mt-2">Calculado restando el precio de compra del precio de venta facturado en cada producto del POS.</p>
                        </div>
                      </div>
                    )}

                    <div className={`glass-card p-6 space-y-4 ${userRole === 'tecnico' ? 'col-span-2' : ''}`}>
                      <h4 className="font-semibold text-xs uppercase tracking-wider text-neutral-400 flex items-center gap-2 border-b border-white/5 pb-2">
                        <Wrench size={16} /> UTILIDAD POR SOPORTE TÉCNICO
                      </h4>
                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Ingresos Totales Reparaciones:</span>
                          <span className="text-white font-medium">${totalRepairsCost.toLocaleString('es-CO')}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-neutral-400">Costo Neto Utilidad:</span>
                          <span className="text-emerald-400 font-bold">${repairsUtility.toLocaleString('es-CO')}</span>
                        </div>
                        <p className="text-[10px] text-neutral-500 italic mt-2">Calculado restando el costo de repuestos registrados en el taller de la cotización final aprobada.</p>
                      </div>
                    </div>
                  </div>

                  {/* Repairs by Technician */}
                  <div className="glass-card p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <h4 className="font-semibold text-xs uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                        <Users size={16} /> RENDIMIENTO Y COMISIONES POR TÉCNICO (TALLER)
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-neutral-400 font-medium">% Comisión:</span>
                        <select 
                          value={techCommissionRate}
                          onChange={(e) => setTechCommissionRate(parseInt(e.target.value))}
                          className="bg-black/40 border border-white/10 rounded-lg text-xs text-white px-2 py-1 focus:outline-none"
                        >
                          <option value={20}>20%</option>
                          <option value={30}>30%</option>
                          <option value={40}>40%</option>
                          <option value={50}>50%</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto min-w-0">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 text-neutral-400 uppercase tracking-wider font-bold text-[10px]">
                            <th className="py-2.5">Técnico</th>
                            <th className="py-2.5 text-center">Reparaciones</th>
                            <th className="py-2.5 text-right">Facturación</th>
                            <th className="py-2.5 text-right text-emerald-450">Utilidad</th>
                            <th className="py-2.5 text-right text-indigo-400">Comisión ({techCommissionRate}%)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {technicianStats.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-4 text-center text-neutral-500">No hay reparaciones completadas por técnicos.</td>
                            </tr>
                          ) : (
                            technicianStats.map((item, idx) => {
                              const comm = Math.round(item.utility * techCommissionRate / 100);
                              return (
                                <tr key={idx} className="border-b border-white/5 last:border-0 hover:bg-white/2">
                                  <td className="py-3 font-semibold text-white">{item.name}</td>
                                  <td className="py-3 text-center text-neutral-300">{item.count} equipos</td>
                                  <td className="py-3 text-right font-medium text-white">${item.revenue.toLocaleString('es-CO')}</td>
                                  <td className="py-3 text-right font-bold text-emerald-400">${item.utility.toLocaleString('es-CO')}</td>
                                  <td className="py-3 text-right font-bold text-indigo-400">${comm.toLocaleString('es-CO')}</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Trade-ins details */}
                  <div className="glass-card p-6 space-y-4">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-400 border-b border-white/5 pb-2">DETALLE DE RETOMAS RECIENTES</h4>
                    <div className="space-y-3">
                      {RETOMA_DATA.map((ret, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs border-b border-white/5 pb-2 last:border-0 last:pb-0">
                          <div>
                            <h5 className="font-semibold text-white">{ret.device}</h5>
                            <p className="text-[10px] text-neutral-400">Recibido de: {ret.client}</p>
                          </div>
                          <span className="font-bold text-amber-500 text-sm">${ret.tradeInVal.toLocaleString('es-CO')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Informe Clientes Preferenciales ─────────────────── */}
                  {userRole === 'admin' && (() => {
                    const prefRepairs = repairs.filter(r =>
                      r.clientType === 'preferencial' &&
                      r.createdAt >= prefReportStart && r.createdAt <= prefReportEnd
                    );
                    const byClient: Record<string, { total: number; count: number; entregados: number; enProceso: number; valor: number; partsCost: number }> = {};
                    prefRepairs.forEach(r => {
                      if (!byClient[r.clientName]) byClient[r.clientName] = { total: 0, count: 0, entregados: 0, enProceso: 0, valor: 0, partsCost: 0 };
                      byClient[r.clientName].count++;
                      byClient[r.clientName].valor += r.quotePrice || 0;
                      byClient[r.clientName].partsCost += r.partsCost || 0;
                      if (r.status === 'entregado') byClient[r.clientName].entregados++;
                      else byClient[r.clientName].enProceso++;
                    });
                    const rows = Object.entries(byClient).sort((a, b) => b[1].valor - a[1].valor);
                    const totalValor = rows.reduce((s, [, v]) => s + v.valor, 0);
                    const totalCount = rows.reduce((s, [, v]) => s + v.count, 0);
                    return (
                      <div className="glass-card p-6 space-y-5" style={{ borderLeft: '3px solid #818cf8' }}>
                        {/* Header + filtro */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                          <div>
                            <h4 className="font-bold text-sm uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                              <Star size={14} /> Clientes Preferenciales
                            </h4>
                            <p className="text-[10px] text-neutral-500 mt-0.5">Arreglos y facturación por cliente en el período</p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <input type="date" value={prefReportStart} onChange={e => setPrefReportStart(e.target.value)}
                              className="bg-black/40 border border-white/10 rounded-lg text-xs text-white px-3 py-1.5 focus:outline-none focus:border-indigo-500" />
                            <span className="text-neutral-500 text-xs">→</span>
                            <input type="date" value={prefReportEnd} onChange={e => setPrefReportEnd(e.target.value)}
                              className="bg-black/40 border border-white/10 rounded-lg text-xs text-white px-3 py-1.5 focus:outline-none focus:border-indigo-500" />
                          </div>
                        </div>

                        {/* KPIs rápidos */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-black/30 rounded-xl p-4 border border-white/5 space-y-1">
                            <span className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider block">Clientes Activos</span>
                            <p className="text-lg font-extrabold text-indigo-400">{rows.length}</p>
                            <p className="text-[10px] text-neutral-400">con actividad</p>
                          </div>
                          <div className="bg-black/30 rounded-xl p-4 border border-white/5 space-y-1">
                            <span className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider block">Total Arreglos</span>
                            <p className="text-lg font-extrabold text-white">{totalCount}</p>
                            <p className="text-[10px] text-neutral-400">en el período</p>
                          </div>
                          <div className="bg-black/30 rounded-xl p-4 border border-indigo-500/15 bg-indigo-500/5 space-y-1">
                            <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-wider block">Valor Facturado</span>
                            <p className="text-lg font-extrabold text-indigo-400">${totalValor.toLocaleString('es-CO')}</p>
                            <p className="text-[10px] text-neutral-400">COP</p>
                          </div>
                        </div>

                        {/* Tabla */}
                        {rows.length === 0 ? (
                          <p className="text-xs text-neutral-600 italic text-center py-4">Sin reparaciones de clientes preferenciales en este período</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-white/5 text-neutral-400 uppercase tracking-wider font-bold text-[10px]">
                                  <th className="py-2.5 pr-4">#</th>
                                  <th className="py-2.5 pr-4">Cliente</th>
                                  <th className="py-2.5 text-center">Arreglos</th>
                                  <th className="py-2.5 text-center">Entregados</th>
                                  <th className="py-2.5 text-center">En Proceso</th>
                                  <th className="py-2.5 text-right">Valor Facturado</th>
                                  <th className="py-2.5 text-right text-emerald-400">Utilidad</th>
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map(([name, d], idx) => {
                                  const util = d.valor - d.partsCost;
                                  const isTop = idx === 0;
                                  return (
                                    <tr key={name} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                                      <td className="py-3 pr-4">
                                        <span style={{ fontSize: '10px', fontWeight: 800, color: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : idx === 2 ? '#cd7c3a' : '#475569' }}>
                                          {idx === 0 ? '★' : `#${idx + 1}`}
                                        </span>
                                      </td>
                                      <td className="py-3 pr-4">
                                        <div className="flex items-center gap-2">
                                          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: isTop ? 'rgba(251,191,36,0.15)' : 'rgba(99,102,241,0.1)', border: `1px solid ${isTop ? 'rgba(251,191,36,0.3)' : 'rgba(99,102,241,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: isTop ? '#fbbf24' : '#818cf8', flexShrink: 0 }}>
                                            {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                          </div>
                                          <span className="font-semibold text-white">{name}</span>
                                        </div>
                                      </td>
                                      <td className="py-3 text-center font-bold text-white">{d.count}</td>
                                      <td className="py-3 text-center">
                                        <span className="text-emerald-400 font-medium">{d.entregados}</span>
                                      </td>
                                      <td className="py-3 text-center">
                                        {d.enProceso > 0
                                          ? <span className="text-amber-400 font-medium">{d.enProceso}</span>
                                          : <span className="text-neutral-600">—</span>}
                                      </td>
                                      <td className="py-3 text-right font-bold text-white">${d.valor.toLocaleString('es-CO')}</td>
                                      <td className="py-3 text-right font-bold text-emerald-400">${util.toLocaleString('es-CO')}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot>
                                <tr className="border-t border-white/10">
                                  <td colSpan={2} className="py-3 text-xs font-bold text-neutral-400 uppercase tracking-wider">Total</td>
                                  <td className="py-3 text-center font-bold text-white">{totalCount}</td>
                                  <td className="py-3 text-center font-bold text-emerald-400">{rows.reduce((s,[,v])=>s+v.entregados,0)}</td>
                                  <td className="py-3 text-center font-bold text-amber-400">{rows.reduce((s,[,v])=>s+v.enProceso,0) || '—'}</td>
                                  <td className="py-3 text-right font-bold text-indigo-400">${totalValor.toLocaleString('es-CO')}</td>
                                  <td className="py-3 text-right font-bold text-emerald-400">${rows.reduce((s,[,v])=>s+(v.valor-v.partsCost),0).toLocaleString('es-CO')}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Sección: Mis Comisiones (solo técnico) */}
                  {userRole === 'tecnico' && (() => {
                    const myRepairs = repairs.filter(r =>
                      r.assignedTechId === loggedUserId &&
                      r.status === 'entregado' &&
                      r.quotePrice && r.quotePrice > 0 &&
                      r.createdAt >= commStart && r.createdAt <= commEnd
                    );
                    const pending = myRepairs.filter(r => r.commissionStatus !== 'pagado');
                    const paid = myRepairs.filter(r => r.commissionStatus === 'pagado');
                    const pendingUtil = pending.reduce((s, r) => s + Math.max(0, (r.quotePrice||0) - (r.partsCost||0)), 0);
                    const paidUtil = paid.reduce((s, r) => s + Math.max(0, (r.quotePrice||0) - (r.partsCost||0)), 0);
                    const paidComm = paid.reduce((s, r) => s + Math.round(Math.max(0,(r.quotePrice||0)-(r.partsCost||0)) * (r.commissionRate||techCommissionRate) / 100), 0);
                    const pendingComm = Math.round(pendingUtil * techCommissionRate / 100);
                    return (
                      <div className="glass-card p-6 space-y-5" style={{ borderLeft: '3px solid #6366f1' }}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                          <div>
                            <h3 className="font-bold text-sm uppercase tracking-wider text-indigo-400">Mis Comisiones</h3>
                            <p className="text-[10px] text-neutral-500 mt-0.5">Servicios entregados y estado de pago de comisión</p>
                          </div>
                          <div className="flex gap-2 items-center">
                            <input type="date" value={commStart} onChange={e => setCommStart(e.target.value)}
                              className="bg-black/40 border border-white/10 rounded-lg text-xs text-white px-3 py-1.5 focus:outline-none focus:border-indigo-500" />
                            <span className="text-neutral-600 text-xs">→</span>
                            <input type="date" value={commEnd} onChange={e => setCommEnd(e.target.value)}
                              className="bg-black/40 border border-white/10 rounded-lg text-xs text-white px-3 py-1.5 focus:outline-none focus:border-indigo-500" />
                          </div>
                        </div>

                        {/* KPIs */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-black/30 rounded-xl p-4 border border-white/5 space-y-1">
                            <span className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider block">Total Servicios</span>
                            <p className="text-lg font-extrabold text-white">{myRepairs.length}</p>
                          </div>
                          <div className="bg-black/30 rounded-xl p-4 border border-white/5 space-y-1">
                            <span className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider block">Pendientes</span>
                            <p className="text-lg font-extrabold text-red-400">{pending.length}</p>
                            <p className="text-[10px] text-neutral-400">${pendingComm.toLocaleString('es-CO')}</p>
                          </div>
                          <div className="bg-black/30 rounded-xl p-4 border border-white/5 space-y-1">
                            <span className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider block">Pagados</span>
                            <p className="text-lg font-extrabold text-emerald-400">{paid.length}</p>
                            <p className="text-[10px] text-neutral-400">${paidComm.toLocaleString('es-CO')}</p>
                          </div>
                          <div className="bg-black/30 rounded-xl p-4 border border-indigo-500/15 bg-indigo-500/5 space-y-1">
                            <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-wider block">Utilidad pendiente</span>
                            <p className="text-lg font-extrabold text-indigo-400">${pendingUtil.toLocaleString('es-CO')}</p>
                            <p className="text-[10px] text-neutral-400">× {techCommissionRate}% = ${pendingComm.toLocaleString('es-CO')}</p>
                          </div>
                        </div>

                        {/* List */}
                        {myRepairs.length === 0 ? (
                          <div className="text-center text-neutral-500 text-xs py-6">No hay servicios en el período seleccionado.</div>
                        ) : (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                  {['Fecha','Servicio','Valor','Repuestos','Utilidad','Comisión','Estado'].map(h => (
                                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.06em' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {myRepairs.map(r => {
                                  const util = Math.max(0, (r.quotePrice||0) - (r.partsCost||0));
                                  const rate = r.commissionStatus === 'pagado' ? (r.commissionRate||techCommissionRate) : techCommissionRate;
                                  const comm = Math.round(util * rate / 100);
                                  const isPaid = r.commissionStatus === 'pagado';
                                  return (
                                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: isPaid ? 'rgba(74,222,128,0.03)' : 'transparent' }}>
                                      <td style={{ padding: '8px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>{r.createdAt}</td>
                                      <td style={{ padding: '8px 12px', maxWidth: '180px' }}>
                                        <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{r.reference}</div>
                                        <div style={{ fontSize: '10px', color: '#475569' }}>{r.repairType.slice(0,50)}{r.repairType.length>50?'…':''}</div>
                                      </td>
                                      <td style={{ padding: '8px 12px', color: '#f1f5f9', fontWeight: 700 }}>${(r.quotePrice||0).toLocaleString('es-CO')}</td>
                                      <td style={{ padding: '8px 12px', color: '#f87171' }}>${(r.partsCost||0).toLocaleString('es-CO')}</td>
                                      <td style={{ padding: '8px 12px', color: '#4ade80', fontWeight: 700 }}>${util.toLocaleString('es-CO')}</td>
                                      <td style={{ padding: '8px 12px', color: '#a5b4fc', fontWeight: 800 }}>${comm.toLocaleString('es-CO')}<span style={{ fontSize: '9px', color: '#64748b', marginLeft: '3px' }}>({rate}%)</span></td>
                                      <td style={{ padding: '8px 12px' }}>
                                        <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '999px', textTransform: 'uppercase', background: isPaid ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.12)', color: isPaid ? '#4ade80' : '#f87171', border: `1px solid ${isPaid ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.25)'}` }}>
                                          {isPaid ? 'Pagado' : 'Pendiente'}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                </div>
              )}

              {/* Sub-tab 6: Nueva Factura (POS) */}
              {adminTab === 'ventas' && (
                <div className="animate-fade-in" style={{ display: 'flex', gap: '16px', height: 'calc(100vh - 160px)', overflow: 'hidden' }}>

                  {/* ── LEFT: Catálogo ── */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="text" value={saleSearch}
                        onChange={(e) => setSaleSearch(e.target.value)}
                        placeholder="🔍 Buscar producto..."
                        autoFocus
                        style={{ flex: 1, minWidth: '140px', fontSize: '13px', padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', outline: 'none' }}
                      />
                      {(['all','iphone','mac','repuesto'] as const).map(cat => (
                        <button key={cat} type="button" onClick={() => setSaleCategoryFilter(cat)}
                          style={{ padding: '7px 11px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, border: '1px solid', whiteSpace: 'nowrap', cursor: 'pointer', background: saleCategoryFilter === cat ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)', borderColor: saleCategoryFilter === cat ? 'rgb(99,102,241)' : 'rgba(255,255,255,0.08)', color: saleCategoryFilter === cat ? '#818cf8' : '#94a3b8' }}>
                          {cat === 'all' ? 'Todos' : cat === 'iphone' ? 'iPhones' : cat === 'mac' ? 'Macs' : 'Repuestos'}
                        </button>
                      ))}
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: '8px', alignContent: 'start', paddingRight: '4px' }}>
                      {products
                        .filter(p => saleCategoryFilter === 'all' || p.category === saleCategoryFilter)
                        .filter(p => p.name.toLowerCase().includes(saleSearch.toLowerCase()) || p.specs.toLowerCase().includes(saleSearch.toLowerCase()))
                        .map(prod => {
                          const inCart = saleCart.find(i => i.product.id === prod.id);
                          return (
                            <button key={prod.id} type="button" onClick={() => addToSaleCart(prod)} disabled={prod.stock === 0}
                              style={{ position: 'relative', padding: '10px', borderRadius: '10px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '5px', cursor: prod.stock === 0 ? 'not-allowed' : 'pointer', opacity: prod.stock === 0 ? 0.35 : 1, transition: 'all 0.15s', background: inCart ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)', border: `1px solid ${inCart ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.06)'}` }}>
                              {inCart && <span style={{ position: 'absolute', top: '5px', right: '5px', background: '#6366f1', color: '#fff', borderRadius: '999px', fontSize: '9px', fontWeight: 800, padding: '1px 6px' }}>×{inCart.qty}</span>}
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#f1f5f9', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{prod.name}</span>
                              <span style={{ fontSize: '9px', color: '#64748b', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{prod.specs}</span>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '5px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 'auto' }}>
                                <span style={{ fontSize: '9px', fontWeight: 700, color: prod.stock <= 2 ? '#f87171' : '#4ade80' }}>{prod.stock} uds</span>
                                <span style={{ fontSize: '12px', fontWeight: 800, color: '#818cf8' }}>${prod.price.toLocaleString('es-CO')}</span>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* ── RIGHT: Factura ── */}
                  <div style={{ width: '340px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>

                    {/* Venta completada */}
                    {saleSuccess && lastSale ? (
                      <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4ade80', fontWeight: 700, fontSize: '12px' }}>
                          <CheckCircle2 size={14} /> Factura {lastSale.saleId} generada
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <button onClick={() => sendViaWhatsApp(lastSale)} style={{ background: '#22c55e', color: '#000', border: 'none', borderRadius: '8px', padding: '9px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}><MessageCircle size={12} /> WhatsApp</button>
                          <button onClick={() => sendViaEmail(lastSale)} style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '9px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}><Mail size={12} /> E-mail</button>
                        </div>
                        <button onClick={() => { setSaleSuccess(false); setLastSale(null); }} style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '12px', fontWeight: 700, cursor: 'pointer', paddingTop: '4px' }}>+ Nueva Factura</button>
                      </div>
                    ) : (
                      <>
                        {/* Encabezado con botón Nueva Factura */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '4px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#f1f5f9' }}>Nueva Factura</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSaleCart([]);
                              setSaleCustomerName(''); setSaleCustomerPhone('');
                              setSaleCustomerCedula(''); setSaleImei('');
                              setSaleWarrantyDays(30); setSalePaymentMethod('efectivo');
                            }}
                            style={{ padding: '5px 12px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '7px', color: '#818cf8', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            + Nueva Factura
                          </button>
                        </div>

                        {/* Datos del cliente */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Datos del Cliente</span>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
                            {[
                              { label: 'Nombre', value: saleCustomerName, onChange: (v: string) => setSaleCustomerName(v), placeholder: 'Nombre o mostrador', type: 'text' },
                              { label: 'Cédula', value: saleCustomerCedula, onChange: (v: string) => setSaleCustomerCedula(v.replace(/\D/g,'').slice(0,12)), placeholder: 'Opcional', type: 'text' },
                              { label: 'Celular / WhatsApp', value: saleCustomerPhone, onChange: (v: string) => setSaleCustomerPhone(v), placeholder: '573001234567', type: 'tel' },
                              { label: 'IMEI (opcional)', value: saleImei, onChange: (v: string) => setSaleImei(v.replace(/\D/g,'').slice(0,15)), placeholder: '15 dígitos', type: 'text' },
                            ].map(f => (
                              <div key={f.label}>
                                <label style={{ fontSize: '9px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>{f.label}</label>
                                <input type={f.type} value={f.value} onChange={e => f.onChange(e.target.value)} placeholder={f.placeholder}
                                  style={{ width: '100%', fontSize: '11px', padding: '6px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '7px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
                              </div>
                            ))}
                          </div>
                          <div>
                            <label style={{ fontSize: '9px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>Garantía</label>
                            <select value={saleWarrantyDays} onChange={e => setSaleWarrantyDays(Number(e.target.value))}
                              style={{ width: '100%', fontSize: '11px', padding: '6px 8px', background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '7px', color: '#fff', outline: 'none' }}>
                              <option value={0}>Sin garantía</option><option value={15}>15 días</option><option value={30}>1 mes</option>
                              <option value={90}>3 meses</option><option value={180}>6 meses</option><option value={365}>1 año</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: '9px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>Medio de Pago</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {[{ id: 'efectivo', label: '💵 Efectivo' }, { id: 'nequi', label: '🟣 Nequi' }, { id: 'daviplata', label: '🔴 Daviplata' }, { id: 'llave', label: '🔑 Llave' }].map(m => (
                                <button key={m.id} type="button" onClick={() => setSalePaymentMethod(m.id as any)}
                                  style={{ padding: '7px 10px', borderRadius: '7px', border: '1px solid', textAlign: 'left', cursor: 'pointer', fontSize: '11px', fontWeight: salePaymentMethod === m.id ? 700 : 500, background: salePaymentMethod === m.id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)', borderColor: salePaymentMethod === m.id ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.06)', color: salePaymentMethod === m.id ? '#a5b4fc' : '#94a3b8' }}>
                                  {m.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Productos en factura */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Productos ({saleCart.length})
                            </span>
                            {saleCart.length > 0 && <button onClick={() => setSaleCart([])} style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>Limpiar</button>}
                          </div>

                          {saleCart.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '16px 0', color: '#475569' }}>
                              <p style={{ fontSize: '11px' }}>← Selecciona productos del catálogo</p>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {saleCart.map(item => (
                                <div key={item.product.id} style={{ display: 'flex', flexDirection: 'column', gap: '5px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#f1f5f9', flex: 1, marginRight: '8px', lineHeight: 1.3 }}>{item.product.name}</span>
                                    <button onClick={() => removeFromSaleCart(item.product.id)} style={{ width: '18px', height: '18px', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '5px', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Trash2 size={9} /></button>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '6px', padding: '2px 4px' }}>
                                      <button onClick={() => updateSaleQty(item.product.id, -1)} style={{ width: '18px', height: '18px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={9} /></button>
                                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff', width: '18px', textAlign: 'center' }}>{item.qty}</span>
                                      <button onClick={() => updateSaleQty(item.product.id, 1)} style={{ width: '18px', height: '18px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={9} /></button>
                                    </div>
                                    <span style={{ fontSize: '9px', color: '#475569' }}>×</span>
                                    <div style={{ flex: 1, position: 'relative' }}>
                                      <span style={{ position: 'absolute', left: '7px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: '#64748b', pointerEvents: 'none' }}>$</span>
                                      <input
                                        type="number" value={item.salePrice}
                                        onChange={e => updateSaleItemPrice(item.product.id, Number(e.target.value))}
                                        style={{ width: '100%', fontSize: '11px', fontWeight: 700, padding: '5px 6px 5px 16px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '6px', color: '#a5b4fc', outline: 'none', boxSizing: 'border-box' }}
                                      />
                                    </div>
                                    <span style={{ fontSize: '10px', color: '#64748b', flexShrink: 0 }}>= ${(item.salePrice * item.qty).toLocaleString('es-CO')}</span>
                                  </div>
                                </div>
                              ))}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>TOTAL</span>
                                <span style={{ fontSize: '20px', fontWeight: 800, color: '#818cf8' }}>${saleCartTotal.toLocaleString('es-CO')}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {saleCart.length > 0 && (
                          <button type="button" onClick={handleCompleteSale}
                            style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <Printer size={15} /> Generar Factura · ${saleCartTotal.toLocaleString('es-CO')}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Sub-tab 7: Cuentas por Cobrar */}
              {adminTab === 'cuentas' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: 'calc(100vh - 160px)', overflow: 'hidden' }}>

                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#f1f5f9' }}>Cuentas por Cobrar</h3>
                      <p style={{ fontSize: '11px', color: '#64748b' }}>
                        {receivables.length} cuenta{receivables.length !== 1 ? 's' : ''} ·
                        Pendiente: ${receivables.filter(r => r.status !== 'pagado').reduce((s,r) => s + rcvBalance(r), 0).toLocaleString('es-CO')} ·
                        En revisión: {receivables.filter(r => r.status === 'en_revision').length}
                      </p>
                    </div>
                    <button onClick={() => setRcvGenModal(true)}
                      style={{ padding: '8px 16px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', border: 'none', borderRadius: '9px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Plus size={13} /> Generar Cuenta
                    </button>
                  </div>

                  {/* Grilla de cuentas */}
                  <div style={{ flex: 1, overflowY: 'auto', paddingRight: '2px' }}>
                    {receivables.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>
                        <FileText size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                        <p style={{ fontSize: '13px' }}>No hay cuentas por cobrar</p>
                        <p style={{ fontSize: '11px', marginTop: '4px' }}>Genera una cuenta de cobro seleccionando las reparaciones del cliente</p>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '12px' }}>
                        {receivables.map(r => {
                          const color = rcvColor(r);
                          const bgMap: Record<string, string> = { pagado: 'rgba(74,222,128,0.04)', en_revision: 'rgba(251,191,36,0.04)', pendiente: 'rgba(248,113,113,0.04)' };
                          return (
                            <div key={r.id} style={{ background: bgMap[r.status] || 'rgba(255,255,255,0.02)', border: `1px solid ${color}25`, borderTop: `3px solid ${color}`, borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {/* Top row */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '999px', background: `${color}18`, color, border: `1px solid ${color}35`, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>{rcvLabel(r)}</span>
                                    <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>{r.id}</span>
                                  </div>
                                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#f1f5f9', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.clientName}</div>
                                  <div style={{ fontSize: '10px', color: '#64748b' }}>
                                    {r.periodStart ? `${r.periodStart} → ${r.periodEnd}` : r.createdAt}
                                    {r.validatedAt && <span style={{ color: '#4ade80', marginLeft: '6px' }}>· Validado {r.validatedAt}</span>}
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em' }}>${r.total.toLocaleString('es-CO')}</div>
                                  <div style={{ fontSize: '9px', color: '#64748b' }}>COP · {r.items.length} ítem{r.items.length !== 1 ? 's' : ''}</div>
                                </div>
                              </div>

                              {/* Items mini-list */}
                              {r.items.length > 0 && (
                                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  {r.items.slice(0, 3).map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                                      <span style={{ color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{item.name}</span>
                                      <span style={{ color: '#f1f5f9', fontWeight: 700, flexShrink: 0, marginLeft: '8px' }}>${item.price.toLocaleString('es-CO')}</span>
                                    </div>
                                  ))}
                                  {r.items.length > 3 && <div style={{ fontSize: '10px', color: '#475569' }}>+{r.items.length - 3} más</div>}
                                </div>
                              )}

                              {/* Actions */}
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: 'auto' }}>
                                {r.status === 'en_revision' && (
                                  <>
                                    {r.proofUrl && (
                                      <a href={r.proofUrl} target="_blank" rel="noreferrer"
                                        style={{ padding: '5px 12px', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '7px', color: '#fbbf24', fontSize: '10px', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        Ver Soporte
                                      </a>
                                    )}
                                    <button onClick={() => handleValidatePayment(r)}
                                      style={{ padding: '5px 12px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '7px', color: '#4ade80', fontSize: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <Check size={10} /> Validar Pago
                                    </button>
                                  </>
                                )}
                                {r.status === 'pendiente' && (
                                  <button onClick={() => { setRcvPayModal(r); setRcvPayAmount(''); setRcvPayNote(''); }}
                                    style={{ padding: '5px 12px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '7px', color: '#818cf8', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>
                                    + Pago Manual
                                  </button>
                                )}
                                <button onClick={() => generateReceivablePDF(r)}
                                  style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px', color: '#64748b', fontSize: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                                  <Printer size={10} /> PDF
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Modal Generar Cuenta — con selector de reparaciones */}
                  {rcvGenModal && (() => {
                    const cp = profiles.find(p => p.id === rcvGenClientId);
                    const alreadyBilled = new Set(
                      receivables
                        .filter(r => r.status === 'en_revision' || r.status === 'pagado')
                        .flatMap(r => r.repairIds)
                    );
                    const availableRepairs = cp && rcvGenStart && rcvGenEnd
                      ? repairs.filter(r =>
                          r.clientName.toLowerCase() === cp.name.toLowerCase() &&
                          r.createdAt >= rcvGenStart && r.createdAt <= rcvGenEnd &&
                          r.status === 'entregado' && r.quotePrice && r.quotePrice > 0 &&
                          !alreadyBilled.has(r.id)
                        )
                      : [];
                    const selectedTotal = availableRepairs
                      .filter(r => rcvGenSelected.has(r.id))
                      .reduce((s, r) => s + (r.quotePrice || 0), 0);
                    const allSelected = availableRepairs.length > 0 && availableRepairs.every(r => rcvGenSelected.has(r.id));
                    const toggleAll = () => {
                      if (allSelected) setRcvGenSelected(new Set());
                      else setRcvGenSelected(new Set(availableRepairs.map(r => r.id)));
                    };
                    const toggleOne = (id: string) => {
                      const next = new Set(rcvGenSelected);
                      next.has(id) ? next.delete(id) : next.add(id);
                      setRcvGenSelected(next);
                    };
                    return (
                      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
                        <div style={{ background: '#0f172a', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '18px', padding: '24px', width: '100%', maxWidth: '520px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {/* Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                            <div>
                              <div style={{ fontSize: '15px', fontWeight: 800, color: '#f1f5f9' }}>Generar Cuenta de Cobro</div>
                              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Selecciona el cliente, período y las reparaciones a incluir</div>
                            </div>
                            <button onClick={() => { setRcvGenModal(false); setRcvGenClientId(''); setRcvGenStart(''); setRcvGenEnd(''); setRcvGenSelected(new Set()); }}
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <X size={14} />
                            </button>
                          </div>

                          {/* Cliente */}
                          <div style={{ flexShrink: 0 }}>
                            <label style={{ fontSize: '9px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>Cliente Preferencial *</label>
                            <select value={rcvGenClientId}
                              onChange={e => { setRcvGenClientId(e.target.value); setRcvGenSelected(new Set()); }}
                              style={{ width: '100%', fontSize: '12px', padding: '9px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', color: rcvGenClientId ? '#f1f5f9' : '#64748b', outline: 'none', boxSizing: 'border-box' }}>
                              <option value="">-- Seleccionar cliente --</option>
                              {profiles.filter(p => p.role === 'preferencial' && p.status === 'active').map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Rango de fechas */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', flexShrink: 0 }}>
                            <div>
                              <label style={{ fontSize: '9px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>Desde *</label>
                              <input type="date" value={rcvGenStart}
                                onChange={e => { setRcvGenStart(e.target.value); setRcvGenSelected(new Set()); }}
                                style={{ width: '100%', fontSize: '12px', padding: '9px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                            <div>
                              <label style={{ fontSize: '9px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>Hasta *</label>
                              <input type="date" value={rcvGenEnd}
                                onChange={e => { setRcvGenEnd(e.target.value); setRcvGenSelected(new Set()); }}
                                style={{ width: '100%', fontSize: '12px', padding: '9px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                          </div>

                          {/* Lista de reparaciones seleccionables */}
                          {rcvGenClientId && rcvGenStart && rcvGenEnd && (
                            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                              {availableRepairs.length === 0 ? (
                                <div style={{ fontSize: '12px', color: '#f87171', padding: '14px', background: 'rgba(239,68,68,0.06)', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)', textAlign: 'center' }}>
                                  Sin reparaciones entregadas con valor en este período
                                </div>
                              ) : (
                                <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
                                  {/* Header con "seleccionar todo" */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'rgba(99,102,241,0.08)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <input type="checkbox" checked={allSelected} onChange={toggleAll}
                                      style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: '#6366f1' }} />
                                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', flex: 1 }}>
                                      {availableRepairs.length} ingreso{availableRepairs.length !== 1 ? 's' : ''} encontrado{availableRepairs.length !== 1 ? 's' : ''}
                                    </span>
                                    <span style={{ fontSize: '10px', color: '#64748b' }}>{rcvGenSelected.size} seleccionado{rcvGenSelected.size !== 1 ? 's' : ''}</span>
                                  </div>
                                  {/* Filas */}
                                  {availableRepairs.map((r, idx) => {
                                    const sel = rcvGenSelected.has(r.id);
                                    return (
                                      <div key={r.id} onClick={() => toggleOne(r.id)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', cursor: 'pointer', background: sel ? 'rgba(99,102,241,0.08)' : 'transparent', borderBottom: idx < availableRepairs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.15s' }}>
                                        <input type="checkbox" checked={sel} onChange={() => toggleOne(r.id)}
                                          onClick={e => e.stopPropagation()}
                                          style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: '#6366f1', flexShrink: 0 }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ fontSize: '12px', fontWeight: sel ? 700 : 500, color: sel ? '#f1f5f9' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {r.reference} {r.color} {r.capacity}
                                          </div>
                                          <div style={{ fontSize: '10px', color: '#475569' }}>{r.repairType} · {r.createdAt}</div>
                                        </div>
                                        <div style={{ fontSize: '13px', fontWeight: 800, color: sel ? '#818cf8' : '#64748b', flexShrink: 0 }}>
                                          ${(r.quotePrice || 0).toLocaleString('es-CO')}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Total seleccionado + botones */}
                          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {rcvGenSelected.size > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(99,102,241,0.1)', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.25)' }}>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8' }}>{rcvGenSelected.size} ítem{rcvGenSelected.size !== 1 ? 's' : ''} seleccionado{rcvGenSelected.size !== 1 ? 's' : ''}</span>
                                <span style={{ fontSize: '16px', fontWeight: 800, color: '#f1f5f9' }}>${selectedTotal.toLocaleString('es-CO')}</span>
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => { setRcvGenModal(false); setRcvGenClientId(''); setRcvGenStart(''); setRcvGenEnd(''); setRcvGenSelected(new Set()); }}
                                style={{ flex: 1, padding: '11px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#94a3b8', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                                Cancelar
                              </button>
                              <button onClick={handleGenerateReceivable}
                                disabled={rcvGenSelected.size === 0}
                                style={{ flex: 2, padding: '11px', background: rcvGenSelected.size > 0 ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '10px', color: rcvGenSelected.size > 0 ? '#fff' : '#475569', fontSize: '12px', fontWeight: 800, cursor: rcvGenSelected.size > 0 ? 'pointer' : 'default' }}>
                                Generar Cuenta · ${selectedTotal.toLocaleString('es-CO')}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Modal pago manual */}
                  {rcvPayModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                      <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', width: '380px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: '#f1f5f9' }}>Registrar Pago Manual</span>
                          <button onClick={() => setRcvPayModal(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>×</button>
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          <b style={{ color: '#f1f5f9' }}>{rcvPayModal.clientName}</b> · Total: <b style={{ color: '#f87171' }}>${rcvPayModal.total.toLocaleString('es-CO')}</b>
                        </div>
                        <div>
                          <label style={{ fontSize: '9px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Monto *</label>
                          <input type="number" value={rcvPayAmount} placeholder={`Total: $${rcvPayModal.total.toLocaleString('es-CO')}`}
                            onChange={e => setRcvPayAmount(e.target.value)}
                            style={{ width: '100%', fontSize: '14px', fontWeight: 700, padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '9px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>Medio de pago</label>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {[{ id: 'efectivo', label: 'Efectivo' }, { id: 'nequi', label: 'Nequi' }, { id: 'daviplata', label: 'Daviplata' }, { id: 'llave', label: 'Llave' }].map(m => (
                              <button key={m.id} type="button" onClick={() => setRcvPayMethod(m.id)}
                                style={{ padding: '6px 12px', borderRadius: '7px', border: '1px solid', cursor: 'pointer', fontSize: '11px', fontWeight: 700, background: rcvPayMethod === m.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)', borderColor: rcvPayMethod === m.id ? '#6366f1' : 'rgba(255,255,255,0.08)', color: rcvPayMethod === m.id ? '#a5b4fc' : '#94a3b8' }}>
                                {m.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label style={{ fontSize: '9px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Nota (opcional)</label>
                          <input type="text" value={rcvPayNote} placeholder="Ej: Pago completo en efectivo"
                            onChange={e => setRcvPayNote(e.target.value)}
                            style={{ width: '100%', fontSize: '11px', padding: '7px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => setRcvPayModal(null)} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9px', color: '#94a3b8', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
                          <button onClick={handleAddPayment} style={{ flex: 2, padding: '10px', background: 'linear-gradient(135deg,#22c55e,#16a34a)', border: 'none', borderRadius: '9px', color: '#fff', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>Confirmar Pago</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 8: Comisiones Técnicos */}
              {adminTab === 'comisiones' && (
                <div className="animate-fade-in space-y-5">

                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#f1f5f9' }}>Comisiones Técnicos</h3>
                      <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Selecciona los servicios y aplica el % de comisión sobre la utilidad</p>
                    </div>
                  </div>

                  {/* Filters */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Desde</label>
                      <input type="date" value={commStart} onChange={e => setCommStart(e.target.value)}
                        style={{ fontSize: '11px', padding: '7px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Hasta</label>
                      <input type="date" value={commEnd} onChange={e => setCommEnd(e.target.value)}
                        style={{ fontSize: '11px', padding: '7px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Técnico</label>
                      <select value={commTechId} onChange={e => { setCommTechId(e.target.value); setCommSelected(new Set()); }}
                        style={{ fontSize: '11px', padding: '7px 10px', background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', outline: 'none' }}>
                        <option value="">Todos los técnicos</option>
                        {profiles.filter(p => p.role === 'tecnico' && p.status === 'active').map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>% Comisión</label>
                      <select value={commRate} onChange={e => setCommRate(Number(e.target.value))}
                        style={{ fontSize: '11px', padding: '7px 10px', background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', outline: 'none' }}>
                        {[10,15,20,25,30,35,40,45,50,60,70,80].map(n => (
                          <option key={n} value={n}>{n}%</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {(() => {
                    const techProfiles = profiles.filter(p => p.role === 'tecnico');
                    const visibleRepairs = repairs.filter(r =>
                      r.status === 'entregado' &&
                      r.quotePrice && r.quotePrice > 0 &&
                      r.createdAt >= commStart && r.createdAt <= commEnd &&
                      (commTechId === '' || r.assignedTechId === commTechId)
                    );
                    const selectedItems = visibleRepairs.filter(r => commSelected.has(r.id));
                    const totalUtil = selectedItems.reduce((s, r) => s + Math.max(0, (r.quotePrice||0) - (r.partsCost||0)), 0);
                    const totalComm = Math.round(totalUtil * commRate / 100);

                    const toggleAll = () => {
                      const pendientes = visibleRepairs.filter(r => r.commissionStatus !== 'pagado');
                      if (commSelected.size === pendientes.length) {
                        setCommSelected(new Set());
                      } else {
                        setCommSelected(new Set(pendientes.map(r => r.id)));
                      }
                    };
                    const toggleOne = (id: string) => {
                      setCommSelected(prev => {
                        const n = new Set(prev);
                        n.has(id) ? n.delete(id) : n.add(id);
                        return n;
                      });
                    };

                    if (visibleRepairs.length === 0) return (
                      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#475569', fontSize: '12px' }}>
                        No hay servicios entregados en el período seleccionado.
                      </div>
                    );

                    return (
                      <>
                        {/* Table */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', overflow: 'hidden' }}>
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                              <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                  <th style={{ padding: '10px 14px', textAlign: 'left', width: '32px' }}>
                                    <input type="checkbox"
                                      checked={commSelected.size > 0 && commSelected.size === visibleRepairs.filter(r => r.commissionStatus !== 'pagado').length}
                                      onChange={toggleAll}
                                      style={{ cursor: 'pointer' }} />
                                  </th>
                                  {['Fecha','Técnico','Servicio','Cliente','Valor','Repuestos','Utilidad',`Comisión (${commRate}%)`, 'Estado'].map(h => (
                                    <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Estado' ? 'center' : 'left', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {visibleRepairs.map((r, i) => {
                                  const tech = techProfiles.find(p => p.id === r.assignedTechId);
                                  const util = Math.max(0, (r.quotePrice||0) - (r.partsCost||0));
                                  const comm = Math.round(util * commRate / 100);
                                  const isPaid = r.commissionStatus === 'pagado';
                                  return (
                                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: isPaid ? 'rgba(74,222,128,0.03)' : commSelected.has(r.id) ? 'rgba(99,102,241,0.06)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                                      <td style={{ padding: '9px 14px' }}>
                                        {!isPaid && (
                                          <input type="checkbox" checked={commSelected.has(r.id)} onChange={() => toggleOne(r.id)} style={{ cursor: 'pointer' }} />
                                        )}
                                      </td>
                                      <td style={{ padding: '9px 14px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{r.createdAt}</td>
                                      <td style={{ padding: '9px 14px', color: '#e2e8f0', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                        {tech?.name || 'Sin asignar'}
                                      </td>
                                      <td style={{ padding: '9px 14px', color: '#94a3b8', maxWidth: '160px' }}>
                                        <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{r.reference}</div>
                                        <div style={{ fontSize: '10px', color: '#475569' }}>{r.repairType.slice(0, 40)}{r.repairType.length > 40 ? '…' : ''}</div>
                                      </td>
                                      <td style={{ padding: '9px 14px', color: '#94a3b8' }}>{r.clientName}</td>
                                      <td style={{ padding: '9px 14px', color: '#f1f5f9', fontWeight: 700, whiteSpace: 'nowrap' }}>${(r.quotePrice||0).toLocaleString('es-CO')}</td>
                                      <td style={{ padding: '9px 14px', color: '#f87171', whiteSpace: 'nowrap' }}>${(r.partsCost||0).toLocaleString('es-CO')}</td>
                                      <td style={{ padding: '9px 14px', color: '#4ade80', fontWeight: 700, whiteSpace: 'nowrap' }}>${util.toLocaleString('es-CO')}</td>
                                      <td style={{ padding: '9px 14px', color: '#a5b4fc', fontWeight: 800, whiteSpace: 'nowrap' }}>${comm.toLocaleString('es-CO')}</td>
                                      <td style={{ padding: '9px 14px', textAlign: 'center' }}>
                                        <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '999px', textTransform: 'uppercase', background: isPaid ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)', color: isPaid ? '#4ade80' : '#f87171', border: `1px solid ${isPaid ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}` }}>
                                          {isPaid ? `Pagado${r.commissionPaidAt ? ' ' + r.commissionPaidAt : ''}` : 'Pendiente'}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Summary & Action */}
                        <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '14px', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                            <div>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '3px' }}>Servicios seleccionados</div>
                              <div style={{ fontSize: '20px', fontWeight: 800, color: '#f1f5f9' }}>{commSelected.size}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '3px' }}>Utilidad neta seleccionada</div>
                              <div style={{ fontSize: '20px', fontWeight: 800, color: '#4ade80' }}>${totalUtil.toLocaleString('es-CO')}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', marginBottom: '3px' }}>Comisión a pagar ({commRate}%)</div>
                              <div style={{ fontSize: '24px', fontWeight: 900, color: '#818cf8' }}>${totalComm.toLocaleString('es-CO')}</div>
                            </div>
                          </div>
                          <button
                            onClick={handlePayCommissions}
                            disabled={commSelected.size === 0}
                            style={{ padding: '12px 24px', background: commSelected.size === 0 ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg,#6366f1,#4f46e5)', border: commSelected.size === 0 ? '1px solid rgba(255,255,255,0.08)' : 'none', borderRadius: '10px', color: commSelected.size === 0 ? '#475569' : '#fff', fontSize: '13px', fontWeight: 800, cursor: commSelected.size === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Check size={15} /> Marcar como Pagado
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

            </div>
          )}

          {/* ── ROLE: CLIENTE PREFERENCIAL ── */}
          {userRole === 'preferencial' && (
            <div className="animate-fade-in space-y-6">
              
              {/* Client Welcome Card */}
              <div className="client-welcome-card">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#007AFF] flex items-center justify-center font-bold text-white text-lg flex-shrink-0 shadow-lg" style={{boxShadow: '0 6px 20px rgba(0,122,255,0.35)'}}>
                    {loggedClientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Cliente Preferencial</p>
                      <span className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                        Activo
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-white tracking-tight">{loggedClientName}</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">Sr Tech Medellín · Portal de Soporte</p>
                  </div>
                </div>
                <div className="flex items-center gap-5 flex-shrink-0">
                  <div className="text-center">
                    <div className="text-xl font-bold text-white" style={{letterSpacing: '-0.03em'}}>
                      {filteredRepairs.filter(r => r.status !== 'entregado' && r.status !== 'no_reparado').length}
                    </div>
                    <div className="text-[10px] text-neutral-400 uppercase tracking-wider mt-0.5">Activas</div>
                  </div>
                  <div className="w-px h-8 bg-white/8"></div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-400" style={{letterSpacing: '-0.03em'}}>
                      {filteredRepairs.filter(r => r.status === 'entregado').length}
                    </div>
                    <div className="text-[10px] text-neutral-400 uppercase tracking-wider mt-0.5">Completadas</div>
                  </div>
                  <button
                    onClick={() => sendWhatsAppMessage(`Hola Sr Tech, soy el cliente preferencial ${loggedClientName}. Tengo una consulta técnica...`)}
                    className="flex items-center gap-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all duration-200 flex-shrink-0"
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </button>
                </div>
              </div>

              {/* View 1: Repairs List */}
              {prefTab === 'equipos' && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 border-b border-white/5 pb-2 flex items-center gap-2">
                    <Smartphone size={15} /> Mis Reparaciones
                  </h3>
                  
                  {filteredRepairs.length === 0 ? (
                    <div className="glass-card p-8 text-center text-neutral-400 text-xs">
                      No tienes reparaciones registradas actualmente. Si deseas ingresar una nueva solicitud, ve a la pestaña **Ingresar Equipo**.
                    </div>
                  ) : (
                    <div className="responsive-grid-2">
                      {filteredRepairs.map(rep => (
                        <div key={rep.id} className="glass-card p-6 flex flex-col justify-between space-y-5">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className="text-[10px] font-bold text-neutral-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5 uppercase">
                                  {rep.id} {rep.consecutivoRecepcion && `· Consecutivo: ${rep.consecutivoRecepcion}`}
                                </span>
                                <h4 className="font-bold text-lg mt-2 text-white">{rep.reference} ({rep.color})</h4>
                                <p className="text-xs text-neutral-400 mt-1">Servicio solicitado: {rep.repairType}</p>
                              </div>
                              
                              <span className={`flex items-center gap-1.5 text-[10px] font-semibold tracking-wide flex-shrink-0 ${
                                rep.status === 'recibido' ? 'text-amber-400' :
                                rep.status === 'validado_fisico' ? 'text-blue-400' :
                                rep.status === 'en_reparacion' ? 'text-blue-400' :
                                rep.status === 'entregado' ? 'text-green-400' :
                                'text-red-400'
                              }`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0"></span>
                                {rep.status === 'recibido' ? 'Pendiente recepción' :
                                 rep.status === 'validado_fisico' ? 'Validado' :
                                 rep.status === 'en_reparacion' ? 'En taller' :
                                 rep.status === 'entregado' ? 'Entregado' : 'No reparado'}
                              </span>
                            </div>

                            {/* Stepper Timeline */}
                            {rep.status !== 'no_reparado' && (
                              <div className="py-4 border-t border-white/5 border-b mb-1">
                                <div className="stepper-container">
                                  <div className="stepper-line"></div>
                                  <div 
                                    className="stepper-line-active" 
                                    style={{ 
                                      width: 
                                        rep.status === 'entregado' ? '75%' : 
                                        rep.status === 'en_reparacion' ? '50%' : 
                                        rep.status === 'validado_fisico' ? '25%' : '0%'
                                    }}
                                  ></div>
                                  
                                  <div className="stepper-step active">
                                    <div className="stepper-circle">1</div>
                                    <span className="stepper-label">Pre-Registro</span>
                                  </div>
                                  
                                  <div className={`stepper-step ${rep.status === 'validado_fisico' || rep.status === 'en_reparacion' || rep.status === 'entregado' ? 'active' : ''} ${rep.status === 'en_reparacion' || rep.status === 'entregado' ? 'completed' : ''}`}>
                                    <div className="stepper-circle">2</div>
                                    <span className="stepper-label">Recibido en Tienda</span>
                                  </div>
                                  
                                  <div className={`stepper-step ${rep.status === 'en_reparacion' || rep.status === 'entregado' ? 'active' : ''} ${rep.status === 'entregado' ? 'completed' : ''}`}>
                                    <div className="stepper-circle">3</div>
                                    <span className="stepper-label">En Taller</span>
                                  </div>
                                  
                                  <div className={`stepper-step ${rep.status === 'entregado' ? 'active' : ''}`}>
                                    <div className="stepper-circle">4</div>
                                    <span className="stepper-label">Entregado</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Account Statement (Estado de Cuenta) */}
                            {rep.status === 'entregado' && (
                              <div className="bg-neutral-900/50 p-4 rounded-xl border border-white/5 text-xs space-y-2.5 mt-2">
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-neutral-400 uppercase text-[9px] tracking-wider">Estado de Cuenta</span>
                                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase border ${
                                    rep.paymentStatus === 'pagado'
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                                  }`}>
                                    {rep.paymentStatus === 'pagado' ? 'PAGADO / CANCELADO' : 'DEBIENDO / PENDIENTE'}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-neutral-300">
                                  <span>Total por Reparación:</span>
                                  <span className="font-bold text-white">${rep.quotePrice?.toLocaleString('es-CO') || 0} COP</span>
                                </div>
                              </div>
                            )}

                            {/* Verification info display for client */}
                            {rep.consecutivoRecepcion ? (
                              <div className="bg-neutral-900/40 p-3.5 rounded-xl border border-white/5 text-xs space-y-2">
                                <span className="font-bold text-indigo-400 block">Validación Física de Tienda:</span>
                                <p className="text-neutral-300">• <span className="font-semibold text-neutral-200">Detalle:</span> {rep.physicalDetails}</p>
                                <p className="text-neutral-300">• <span className="font-semibold text-neutral-200">Consecutivo:</span> {rep.consecutivoRecepcion}</p>
                                {rep.photoUrl && (
                                  <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] pt-1">
                                    <Camera size={12} className="text-indigo-400" />
                                    <span>Inspección fotográfica de recepción completada</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="bg-amber-950/15 p-3.5 rounded-xl border border-amber-500/10 text-xs">
                                <span className="font-bold text-amber-400 block mb-1">Paso Necesario:</span>
                                <p className="text-neutral-300">
                                  Debes entregar físicamente el dispositivo en nuestro local. El personal realizará la validación física, te asignará un código consecutivo y luego el técnico procederá con el diagnóstico en el taller.
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Interactive Quote Approval section */}
                          {rep.quotePrice && (
                            <div className="border-t border-white/5 pt-4 space-y-4">
                              <div className="flex justify-between items-center text-xs">
                                <div>
                                  <span className="text-[10px] text-neutral-400 block mb-0.5">COSTO ESTIMADO REPUESTOS</span>
                                  <span className="font-extrabold text-indigo-400 text-base">COP ${rep.quotePrice.toLocaleString('es-CO')}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-neutral-400 block mb-0.5">ESTADO COTIZACIÓN</span>
                                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                                    rep.quoteStatus === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                                    rep.quoteStatus === 'declined' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-450 border border-amber-500/20'
                                  }`}>
                                    {rep.quoteStatus === 'approved' ? (
                                      <span className="flex items-center gap-1"><CheckCircle2 size={11} /> Autorizado</span>
                                    ) : rep.quoteStatus === 'declined' ? (
                                      <span className="flex items-center gap-1"><XCircle size={11} /> Rechazado</span>
                                    ) : 'Pendiente'}
                                  </span>
                                </div>
                              </div>
                              {rep.priceAdjustmentReason && (
                                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-[11px] text-indigo-300 flex items-start gap-2">
                                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-bold block mb-0.5">Ajuste de Tarifa Aplicado</span>
                                    <span>Esta cotización ha sido ajustada según disponibilidad y demanda: <strong>{rep.priceAdjustmentReason}</strong>.</span>
                                  </div>
                                </div>
                              )}

                              {rep.quoteStatus === 'pending' && (
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <button 
                                    onClick={() => handleQuoteDecision(rep.id, 'approved')}
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-neutral-950 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-green-500/10 transition-colors"
                                  >
                                    <CheckCircle2 size={14} /> Autorizar Arreglo
                                  </button>
                                  <button 
                                    onClick={() => handleQuoteDecision(rep.id, 'declined')}
                                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                                  >
                                    <XCircle size={14} /> No Autorizar
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* General Guidance */}
                  <div className="glass-card p-6 text-xs text-neutral-400 space-y-3 max-w-xl mx-auto text-center">
                    <span className="font-bold text-white uppercase text-[10px] tracking-wider block">¿Tienes alguna duda adicional?</span>
                    <p>Como cliente preferencial de Sr Tech Medellín, cuentas con prioridad absoluta en cola y soporte directo vía WhatsApp corporativo.</p>
                    <button 
                      onClick={() => sendWhatsAppMessage(`Hola Sr Tech, soy el cliente preferencial ${loggedClientName}. Tengo una consulta técnica...`)}
                      className="btn-primary py-3 px-6 text-xs mt-2 mx-auto"
                    >
                      <Phone size={14} className="mr-1" /> Contactar Soporte WhatsApp
                    </button>
                  </div>
                </div>
              )}

              {/* View 2: Registrar Equipo */}
              {prefTab === 'ingresar' && (
                <form onSubmit={handleIntakeSubmit} className="glass-card p-6 space-y-6 max-w-2xl mx-auto animate-fade-in">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-indigo-400 border-b border-white/5 pb-3 flex items-center gap-2">
                    <Star size={14} /> Registrar Equipo para Soporte
                  </h3>
                  
                  {intakeSuccessMsg && (
                    <div className="bg-green-500/10 text-green-400 p-4 rounded-xl text-xs font-semibold text-center border border-green-500/25">
                      ✓ Equipo registrado exitosamente. El administrador ha sido notificado.
                    </div>
                  )}

                  {/* IMEI simulator check */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Ingresa el IMEI del celular (Simulación sickw.com)</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input 
                        type="text" 
                        value={intakeImei}
                        onChange={(e) => setIntakeImei(e.target.value)}
                        placeholder="Ej: 35890... o 35900..."
                        required
                      />
                      <button 
                        type="button" 
                        onClick={handleImeiLookup} 
                        className="btn-secondary py-3"
                      >
                        {imeiLoading ? 'Buscando...' : 'Consultar IMEI'}
                      </button>
                    </div>

                  </div>

                  {imeiSuccess && (
                    <div className="space-y-2">
                      <div className="bg-indigo-500/5 p-4 rounded-xl text-xs space-y-2 border border-indigo-500/20 animate-fade-in">
                        <span className="font-bold text-indigo-400 uppercase text-[9px] tracking-wider block">
                          {isImeiSimulated ? 'IMEI no reconocido — ingresa manualmente:' : 'Datos verificados (base TAC):'}
                        </span>
                        <div className="grid grid-cols-3 gap-2 text-white">
                          <p><span className="text-neutral-400">Referencia:</span> <br/><span className="font-semibold text-sm">{intakeRef || '-'}</span></p>
                          <p><span className="text-neutral-400">Color:</span> <br/><span className="font-semibold text-sm">{intakeColor || '-'}</span></p>
                          <p><span className="text-neutral-400">Capacidad:</span> <br/><span className="font-semibold text-sm">{intakeCapacity || '-'}</span></p>
                        </div>
                      </div>
                      {isImeiSimulated && (
                        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-lg text-[10px] flex items-center gap-2">
                          <AlertTriangle size={14} className="shrink-0" />
                          <span>IMEI no encontrado en la base de datos. Ingresa el modelo, color y capacidad manualmente según el equipo.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Locked details (loaded from IMEI lookup) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Referencia</label>
                      <input 
                        type="text" 
                        value={intakeRef}
                        onChange={(e) => setIntakeRef(e.target.value)}
                        placeholder="Ej: iPhone 15 Pro Max"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Color</label>
                      <input 
                        type="text" 
                        value={intakeColor}
                        onChange={(e) => setIntakeColor(e.target.value)}
                        placeholder="Ej: Titanio Natural"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Capacidad</label>
                      <input 
                        type="text" 
                        value={intakeCapacity}
                        onChange={(e) => setIntakeCapacity(e.target.value)}
                        placeholder="Ej: 256GB"
                        required
                      />
                    </div>
                  </div>

                  {/* Repair description */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Falla reportada / Arreglo requerido</label>
                    <textarea 
                      value={intakeRepairType}
                      onChange={(e) => setIntakeRepairType(e.target.value)}
                      placeholder="Describe de la forma más detallada posible el problema que presenta el equipo..."
                      rows={3}
                      required
                    />
                  </div>

                  <button type="submit" className="btn-primary w-full py-3.5">
                    Enviar Solicitud de Reparación
                  </button>
                </form>
              )}

              {/* View 3: Mis Cuentas */}
              {prefTab === 'cuentas' && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 border-b border-white/5 pb-2 flex items-center gap-2">
                    <FileText size={15} /> Mis Cuentas por Cobrar
                  </h3>
                  {(() => {
                    const myCuentas = receivables.filter(r =>
                      r.clientProfileId === loggedUserId ||
                      r.clientName.toLowerCase() === loggedClientName.toLowerCase()
                    );
                    if (myCuentas.length === 0) return (
                      <div className="glass-card p-8 text-center text-neutral-400 text-xs">
                        No tienes cuentas de cobro generadas aún. Cuando el administrador genere una cuenta para ti, aparecerá aquí.
                      </div>
                    );
                    return myCuentas.map(r => {
                      const color = r.status === 'pagado' ? '#4ade80' : rcvColor(r);
                      const clientLabel = r.status === 'pagado' ? 'CANCELADO' : rcvLabel(r);
                      const bgCard = r.status === 'pagado' ? 'rgba(74,222,128,0.04)' : 'rgba(255,255,255,0.02)';
                      return (
                        <div key={r.id} style={{ background: bgCard, border: `1px solid ${color}30`, borderLeft: `3px solid ${color}`, borderRadius: '12px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 800, color: '#f1f5f9' }}>{r.id}</span>
                                <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '999px', background: `${color}18`, color, border: `1px solid ${color}40`, textTransform: 'uppercase' }}>{clientLabel}</span>
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                                {r.description}
                                {r.periodStart && ` · ${r.periodStart} → ${r.periodEnd}`}
                              </div>
                              {r.items.length > 0 && (
                                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                  {r.items.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
                                      <span>{item.name}</span>
                                      <span style={{ fontWeight: 700, color: '#f1f5f9' }}>${item.price.toLocaleString('es-CO')}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '16px' }}>
                              <div style={{ fontSize: '20px', fontWeight: 800, color: '#f1f5f9' }}>${r.total.toLocaleString('es-CO')}</div>
                              <div style={{ fontSize: '10px', color: '#64748b' }}>COP</div>
                            </div>
                          </div>

                          {r.status === 'pendiente' && (
                            <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '10px', padding: '12px' }}>
                              <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '10px' }}>
                                Adjunta el comprobante de pago (captura de transferencia, Nequi, Daviplata, etc.) y lo revisaremos a la brevedad.
                              </p>
                              {rcvProofModal === r.id ? (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <input type="file" accept="image/*,application/pdf"
                                    onChange={e => setRcvUploadFile(e.target.files?.[0] || null)}
                                    style={{ fontSize: '11px', color: '#94a3b8', flex: 1 }} />
                                  <button onClick={() => handleUploadProof(r.id)}
                                    disabled={!rcvUploadFile}
                                    style={{ padding: '7px 14px', background: rcvUploadFile ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', color: rcvUploadFile ? '#fff' : '#475569', fontSize: '11px', fontWeight: 700, cursor: rcvUploadFile ? 'pointer' : 'default' }}>
                                    Enviar
                                  </button>
                                  <button onClick={() => { setRcvProofModal(null); setRcvUploadFile(null); }}
                                    style={{ padding: '7px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#64748b', fontSize: '11px', cursor: 'pointer' }}>
                                    ×
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => setRcvProofModal(r.id)}
                                  style={{ padding: '8px 16px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                                  Adjuntar Comprobante de Pago
                                </button>
                              )}
                            </div>
                          )}

                          {r.status === 'en_revision' && (
                            <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '10px', padding: '10px 14px', fontSize: '11px', color: '#fbbf24' }}>
                              Comprobante recibido. El administrador está revisando tu pago. Te notificaremos cuando sea validado.
                              {r.proofUrl && (
                                <a href={r.proofUrl} target="_blank" rel="noreferrer"
                                  style={{ display: 'inline-block', marginLeft: '8px', color: '#fbbf24', fontWeight: 700, textDecoration: 'underline' }}>
                                  Ver soporte enviado
                                </a>
                              )}
                            </div>
                          )}

                          {r.status === 'pagado' && (
                            <div style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '10px', padding: '10px 14px', fontSize: '11px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <CheckCircle2 size={14} /> Pago validado por el administrador{r.validatedAt ? ` el ${r.validatedAt}` : ''}. ¡Gracias!
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => generateReceivablePDF(r)}
                              style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px', color: '#94a3b8', fontSize: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Printer size={10} /> Descargar PDF
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          )}
        </main>

        {/* ── MOBILE BOTTOM NAVIGATION ── */}
        {(userRole === 'admin' || userRole === 'tecnico' || userRole === 'vendedor') && (
          <nav className="mobile-nav">
            <button onClick={() => setAdminTab('inicio')} className={`mobile-nav-btn ${adminTab === 'inicio' ? 'active' : ''}`}>
              <LayoutDashboard size={20} />
              <span>Cola</span>
            </button>
            <button onClick={() => setAdminTab('ingreso')} className={`mobile-nav-btn ${adminTab === 'ingreso' ? 'active' : ''}`}>
              <PlusCircle size={20} />
              <span>Ingreso</span>
            </button>
            <button onClick={() => setAdminTab('inventario')} className={`mobile-nav-btn ${adminTab === 'inventario' ? 'active' : ''}`}>
              <Package size={20} />
              <span>Inventario</span>
            </button>
            {userRole === 'admin' && (
              <button onClick={() => setAdminTab('perfiles')} className={`mobile-nav-btn ${adminTab === 'perfiles' ? 'active' : ''}`}>
                <Users size={20} />
                <span>Personal</span>
              </button>
            )}
            {(userRole === 'admin' || userRole === 'tecnico') && (
              <button onClick={() => setAdminTab('informes')} className={`mobile-nav-btn ${adminTab === 'informes' ? 'active' : ''}`}>
                <BarChart3 size={20} />
                <span>Informes</span>
              </button>
            )}
            {(userRole === 'admin' || userRole === 'vendedor') && (
              <button onClick={() => setAdminTab('ventas')} className={`mobile-nav-btn ${adminTab === 'ventas' ? 'active' : ''}`}>
                <ShoppingCart size={20} />
                <span>Ventas</span>
              </button>
            )}
            {userRole === 'admin' && (
              <button onClick={() => setAdminTab('comisiones')} className={`mobile-nav-btn ${adminTab === 'comisiones' ? 'active' : ''}`}>
                <DollarSign size={20} />
                <span>Comisiones</span>
              </button>
            )}
          </nav>
        )}
        {userRole === 'preferencial' && (
          <nav className="mobile-nav">
            <button onClick={() => setPrefTab('equipos')} className={`mobile-nav-btn ${prefTab === 'equipos' ? 'active' : ''}`}>
              <Smartphone size={20} />
              <span>Equipos</span>
            </button>
            <button onClick={() => setPrefTab('ingresar')} className={`mobile-nav-btn ${prefTab === 'ingresar' ? 'active' : ''}`}>
              <PlusCircle size={20} />
              <span>Ingresar</span>
            </button>
            <button onClick={() => setPrefTab('cuentas')} className={`mobile-nav-btn ${prefTab === 'cuentas' ? 'active' : ''}`}>
              <FileText size={20} />
              <span>Cuentas</span>
            </button>
            <button
              onClick={() => sendWhatsAppMessage(`Hola Sr Tech, soy el cliente preferencial ${loggedClientName}. Tengo una consulta técnica...`)}
              className="mobile-nav-btn"
            >
              <Phone size={20} />
              <span>Soporte</span>
            </button>
          </nav>
        )}
      </div>

      {/* ── MODAL: VALIDACIÓN FÍSICA Y CONSECUTIVO ── */}
      {selectedRepairForValidation && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-[480px] space-y-6 animate-fade-in" style={{ background: 'var(--bg-card-solid)' }}>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white">Validación Física de Recepción</h3>
                <p className="text-xs text-neutral-400">Verifica el estado del equipo y asigna el consecutivo.</p>
              </div>
              <button 
                onClick={() => setSelectedRepairForValidation(null)}
                className="p-1.5 bg-white/5 rounded-full text-neutral-400 hover:text-white border border-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-neutral-900/40 p-4 rounded-xl text-xs space-y-1.5 border border-white/5 text-neutral-300">
                <p><span className="text-neutral-400 font-bold uppercase text-[9px] block">Dispositivo</span> <span className="font-semibold text-white text-sm">{selectedRepairForValidation.reference} ({selectedRepairForValidation.color})</span></p>
                <p><span className="text-neutral-400 font-bold uppercase text-[9px] block mt-1">IMEI</span> <span className="font-semibold text-white">{selectedRepairForValidation.imei}</span></p>
                <p><span className="text-neutral-400 font-bold uppercase text-[9px] block mt-1">Falla Reportada</span> <span className="italic text-neutral-200">{selectedRepairForValidation.repairType}</span></p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Consecutivo de Recepción Física</label>
                <input 
                  type="text" 
                  value={valConsecutivo}
                  onChange={(e) => setValConsecutivo(e.target.value)}
                  placeholder="Ej: REC-2026-102"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Detalles del Estado Físico (Rayones, golpes, etc.)</label>
                <textarea 
                  value={valPhysicalDetails}
                  onChange={(e) => setValPhysicalDetails(e.target.value)}
                  placeholder="Ingresa los hallazgos físicos del equipo..."
                  rows={2}
                  required
                />
              </div>

              {/* Photo Registration selector */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider flex items-center gap-1">
                  <Camera size={12} className="text-indigo-400" />
                  Registro Fotográfico (Simulación de Captura)
                </label>
                <select 
                  value={valPhotoType}
                  onChange={(e) => setValPhotoType(e.target.value)}
                  className="text-xs"
                >
                  <option value="phone_front_scratched">Vista Frontal (Rayones menores detectados)</option>
                  <option value="phone_back_glass_ok">Vista Trasera (Impecable)</option>
                  <option value="phone_edges_dent">Bisel Esquina Inferior (Ligero golpe por caída)</option>
                  <option value="phone_all_ok">Estado Físico Impecable (Como nuevo)</option>
                </select>

                <div className="bg-neutral-950/60 p-2 rounded-lg border border-white/5 text-[10px] text-neutral-400 flex items-center justify-center gap-2">
                  <Camera size={14} className="text-green-400" />
                  <span>Foto simulada vinculada exitosamente al expediente.</span>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleSavePhysicalValidation}
                  className="btn-primary w-full py-3"
                >
                  Confirmar Recepción Física
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: MONTAR / EDITAR COTIZACIÓN DE REPUESTOS ── */}
      {selectedRepairForQuote && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-[460px] space-y-6 animate-fade-in" style={{ background: 'var(--bg-card-solid)' }}>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white">
                  {selectedRepairForQuote.quotePrice ? 'Editar Cotización' : 'Asignación y Cotización'}
                </h3>
                <p className="text-xs text-neutral-400">Asigna el técnico y establece el precio final de reparación.</p>
              </div>
              <button 
                onClick={() => setSelectedRepairForQuote(null)}
                className="p-1.5 bg-white/5 rounded-full text-neutral-400 hover:text-white border border-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-neutral-900/40 p-4 rounded-xl text-xs space-y-2 border border-white/5 text-neutral-300">
                <p className="flex justify-between"><span className="text-neutral-400">Equipo:</span> <span className="font-semibold text-white">{selectedRepairForQuote.reference} ({selectedRepairForQuote.color})</span></p>
                <p className="flex justify-between"><span className="text-neutral-400">Falla reportada:</span> <span className="font-semibold text-white italic">{selectedRepairForQuote.repairType}</span></p>
                {selectedRepairForQuote.consecutivoRecepcion && (
                  <p className="flex justify-between"><span className="text-neutral-400">Consecutivo de Tienda:</span> <span className="font-semibold text-indigo-400">{selectedRepairForQuote.consecutivoRecepcion}</span></p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Asignar Técnico</label>
                <select 
                  value={modalTechId}
                  onChange={(e) => setModalTechId(e.target.value)}
                >
                  {profiles.filter(p => p.role === 'tecnico').map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Ajuste por disponibilidad y demanda */}
              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3.5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Ajustar por Disponibilidad / Demanda</span>
                  <span className="text-[9px] bg-indigo-500/15 text-indigo-300 font-semibold px-1.5 py-0.5 rounded">COP</span>
                </div>
                
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setQuoteAmount(Math.round(quoteAmount * 1.15));
                      setPriceReasonType('demanda');
                    }}
                    className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold p-2 rounded-lg transition-all text-left flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1"><TrendingUp size={11} />Alta Demanda</span>
                    <span className="bg-indigo-500/20 text-[9px] px-1 rounded">+15%</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuoteAmount(Math.round(quoteAmount * 1.25));
                      setPriceReasonType('stock');
                    }}
                    className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold p-2 rounded-lg transition-all text-left flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1"><AlertTriangle size={11} />Stock Mínimo</span>
                    <span className="bg-indigo-500/20 text-[9px] px-1 rounded">+25%</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuoteAmount(Math.round(quoteAmount * 0.90));
                      setPriceReasonType('descuento');
                    }}
                    className="bg-green-500/10 hover:bg-green-500/20 text-green-300 border border-green-500/20 text-[10px] font-bold p-2 rounded-lg transition-all text-left flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1"><Tag size={11} />Desc. Preferencial</span>
                    <span className="bg-green-500/20 text-[9px] px-1 rounded">-10%</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuoteAmount(Math.round(quoteAmount * 1.10));
                      setPriceReasonType('urgencia');
                    }}
                    className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold p-2 rounded-lg transition-all text-left flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1"><Zap size={11} />Envío Express</span>
                    <span className="bg-indigo-500/20 text-[9px] px-1 rounded">+10%</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">Motivo de Ajuste de Cotización</label>
                  <select 
                    value={priceReasonType}
                    onChange={(e) => {
                      setPriceReasonType(e.target.value);
                      if (e.target.value === 'normal') {
                        setCustomReasonText('');
                      }
                    }}
                    className="w-full text-xs bg-black/40 border border-white/10 rounded-lg text-white p-2"
                  >
                    <option value="normal">Estándar (Sin ajuste especial)</option>
                    <option value="demanda">Alta demanda de repuestos (pantalla/batería)</option>
                    <option value="stock">Baja disponibilidad de stock importado</option>
                    <option value="descuento">Descuento por fidelidad (Cliente Preferencial)</option>
                    <option value="urgencia">Costo de urgencia (Envío prioritario)</option>
                    <option value="otro">Otro motivo (Especificar abajo)</option>
                  </select>
                </div>

                {priceReasonType === 'otro' && (
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">Detallar Motivo Especial</label>
                    <input 
                      type="text"
                      value={customReasonText}
                      onChange={(e) => setCustomReasonText(e.target.value)}
                      placeholder="Ej: Costo de importación adicional por aduana"
                      className="text-xs bg-black/40 border border-white/10 rounded-lg text-white py-2 px-3 w-full"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Valor de Reparación Final (COP)</label>
                <input 
                  type="number" 
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(parseInt(e.target.value) || 0)}
                  placeholder="Ej: 450000"
                  required
                />
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleSaveQuote}
                  className="btn-primary w-full py-3.5"
                >
                  Guardar y Enviar al Cliente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRMAR ENTREGA Y REGISTRAR PAGO ── */}
      {deliveryRepair && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-[460px] space-y-6 animate-scale-up relative" style={{ background: 'var(--bg-card-solid)' }}>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white">Confirmar Entrega de Dispositivo</h3>
                <p className="text-xs text-neutral-400">Registra costos de repuestos y estado de pago.</p>
              </div>
              <button 
                onClick={() => setDeliveryRepair(null)}
                className="p-1.5 bg-white/5 rounded-full text-neutral-400 hover:text-white border border-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-neutral-900/40 p-4 rounded-xl text-xs space-y-2 border border-white/5 text-neutral-300">
                <p className="flex justify-between"><span className="text-neutral-400">Equipo:</span> <span className="font-semibold text-white">{deliveryRepair.reference}</span></p>
                <p className="flex justify-between"><span className="text-neutral-400">Cliente:</span> <span className="font-semibold text-white">{deliveryRepair.clientName}</span></p>
                <p className="flex justify-between"><span className="text-neutral-400">Total Cotizado:</span> <span className="font-bold text-indigo-400">${deliveryRepair.quotePrice?.toLocaleString('es-CO') || 0} COP</span></p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Costo de Repuestos Usados (COP)</label>
                <input 
                  type="number" 
                  value={deliveryPartsCost}
                  onChange={(e) => setDeliveryPartsCost(parseInt(e.target.value) || 0)}
                  placeholder="Ej: 150000"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Estado del Pago</label>
                <select 
                  value={deliveryPaymentStatus}
                  onChange={(e) => setDeliveryPaymentStatus(e.target.value as any)}
                >
                  <option value="pagado">Cancelado (Pagado)</option>
                  <option value="pendiente">Pendiente (Debiendo)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={handleSaveDelivery}
                  className="btn-primary flex-1 py-3 text-xs font-bold"
                >
                  Confirmar Entrega
                </button>
                <button 
                  onClick={() => setDeliveryRepair(null)}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-white flex-1 py-3 rounded-xl text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FLOATING ALARMS FOR NEW SERVICES ── */}
      {activeAlarms.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full p-4 pointer-events-none">
          {activeAlarms.map((alarm) => (
            <div 
              key={alarm.id} 
              className="pointer-events-auto bg-[#0b0c10]/95 border-2 border-red-500/85 rounded-xl p-4 shadow-2xl flex flex-col gap-2 animate-pulse relative"
              style={{
                boxShadow: '0 10px 30px rgba(239, 68, 68, 0.4)',
                backdropFilter: 'blur(12px)'
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle size={18} className="animate-bounce" />
                  <span className="font-bold text-[10px] uppercase tracking-wider">¡NUEVO INGRESO EN COLA!</span>
                </div>
                <button 
                  onClick={() => setActiveAlarms(current => current.filter(a => a.id !== alarm.id))}
                  className="text-neutral-400 hover:text-white transition p-0.5 rounded-full hover:bg-white/10"
                >
                  <X size={14} />
                </button>
              </div>
              
              <div className="space-y-1 text-xs">
                <p className="text-white font-bold"><span className="text-neutral-400 font-normal">Equipo:</span> {alarm.reference} ({alarm.color} {alarm.capacity})</p>
                <p className="text-white"><span className="text-neutral-400">Cliente:</span> {alarm.clientName} ({alarm.clientType === 'preferencial' ? '⭐ Preferencial' : 'Regular'})</p>
                <p className="text-[#C5A059] font-medium"><span className="text-neutral-400">Falla:</span> {alarm.repairType}</p>
                <p className="text-neutral-500 font-mono text-[9px] mt-1">ID: {alarm.id} · IMEI: {alarm.imei}</p>
              </div>
              
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => {
                    setAdminTab('inicio');
                    setActiveAlarms(current => current.filter(a => a.id !== alarm.id));
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold text-[10px] py-1.5 px-3 rounded-lg transition-all text-center flex-1 shadow-md shadow-red-500/20"
                >
                  Ver en Cola
                </button>
                <button
                  onClick={() => {
                    setActiveAlarms(current => current.filter(a => a.id !== alarm.id));
                  }}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-[10px] py-1.5 px-3 rounded-lg transition-all text-center flex-1"
                >
                  Descartar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
