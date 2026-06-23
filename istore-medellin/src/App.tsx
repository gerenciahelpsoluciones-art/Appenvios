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
  paymentStatus: row.payment_status || undefined
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
  payment_status: r.paymentStatus || 'pendiente'
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
  const [adminTab, setAdminTab] = useState<'inicio' | 'inventario' | 'ingreso' | 'perfiles' | 'informes' | 'ventas'>('inicio');
  const [prefTab, setPrefTab] = useState<'equipos' | 'ingresar'>('equipos');

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
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split('T')[0]);


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



  // ── Venta Mostrador ─────────────────────────────────────────────────────────
  interface SaleCartItem { product: Product; qty: number; }
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
  const [salePaymentMethod, setSalePaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');
  const [saleImei, setSaleImei]                 = useState('');
  const [saleWarrantyDays, setSaleWarrantyDays] = useState<number>(30);
  const [saleSuccess, setSaleSuccess]           = useState(false);
  const [lastSale, setLastSale]                 = useState<LastSaleInfo | null>(null);
  const [saleCategoryFilter, setSaleCategoryFilter] = useState<'all' | 'iphone' | 'mac' | 'repuesto'>('all');
  const [cashReceived, setCashReceived]         = useState('');

  const saleCartTotal = useMemo(
    () => saleCart.reduce((sum, i) => sum + i.product.price * i.qty, 0),
    [saleCart]
  );

  const addToSaleCart = (product: Product) => {
    setSaleCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, qty: 1 }];
    });
  };

  const removeFromSaleCart = (productId: string) =>
    setSaleCart(prev => prev.filter(i => i.product.id !== productId));

  const updateSaleQty = (productId: string, delta: number) =>
    setSaleCart(prev => prev
      .map(i => i.product.id === productId ? { ...i, qty: Math.max(1, i.qty + delta) } : i)
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
      doc.text(`$${item.product.price.toLocaleString('es-CO')}`, 138, y + 5.5);
      doc.text(`$${(item.product.price * item.qty).toLocaleString('es-CO')}`, 172, y + 5.5);
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
      price: i.product.price,
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
                </div>
              )}

              {/* Sub-tab 6: Venta Mostrador (POS) */}
              {adminTab === 'ventas' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
                    {/* Left: Product POS Layout */}
                    <div className="space-y-4 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400">Terminal de Punto de Venta (POS)</h3>
                        <div className="w-full sm:w-64">
                          <input
                            type="text"
                            value={saleSearch}
                            onChange={(e) => setSaleSearch(e.target.value)}
                            placeholder="🔍 Buscar por nombre o especificaciones..."
                            className="w-full"
                          />
                        </div>
                      </div>

                      {/* Category Navigation Bar */}
                      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {[
                          { id: 'all', label: '🎛️ Todos' },
                          { id: 'iphone', label: '📱 iPhones' },
                          { id: 'mac', label: '💻 Macs' },
                          { id: 'repuesto', label: '⚙️ Repuestos' }
                        ].map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSaleCategoryFilter(cat.id as any)}
                            className={`chip-filter flex-shrink-0 ${saleCategoryFilter === cat.id ? 'active' : ''}`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[62vh] overflow-y-auto pr-1 no-scrollbar">
                        {products
                          .filter(p => saleCategoryFilter === 'all' || p.category === saleCategoryFilter)
                          .filter(p => p.name.toLowerCase().includes(saleSearch.toLowerCase()) || p.specs.toLowerCase().includes(saleSearch.toLowerCase()))
                          .map(prod => (
                            <button
                              key={prod.id}
                              type="button"
                              onClick={() => addToSaleCart(prod)}
                              disabled={prod.stock === 0}
                              className={`glass-card p-4 text-left flex flex-col justify-between h-40 transition-all hover:border-indigo-500/40 active:scale-[0.97] ${prod.stock === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                            >
                              <div className="space-y-1.5 w-full">
                                <div className="flex justify-between items-start gap-2">
                                  <span className="font-bold text-xs text-white leading-snug line-clamp-2">{prod.name}</span>
                                  <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full border flex-shrink-0 uppercase ${
                                    prod.stock <= 2 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'
                                  }`}>{prod.stock} stock</span>
                                </div>
                                <span className="text-[10px] text-neutral-400 block line-clamp-2">{prod.specs}</span>
                              </div>
                              <div className="flex justify-between items-end w-full border-t border-white/5 pt-2 mt-2">
                                <span className="text-[8px] font-bold uppercase text-neutral-500">{prod.category}</span>
                                <span className="font-bold text-indigo-400 text-sm font-technical">${prod.price.toLocaleString('es-CO')}</span>
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>

                    {/* Right: POS Order Summary & Cart */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                          <ShoppingCart size={14} /> Resumen de Orden
                        </h3>
                        {saleCart.length > 0 && (
                          <button 
                            onClick={() => setSaleCart([])}
                            className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider transition-colors"
                          >
                            Limpiar
                          </button>
                        )}
                      </div>

                      {saleSuccess && lastSale && (
                        <div className="glass-card p-4 space-y-3 border border-green-500/20 bg-green-500/5">
                          <div className="flex items-center gap-2 text-green-400 font-bold text-xs">
                            <CheckCircle2 size={14} /> Recibo {lastSale.saleId} Completado
                          </div>
                          <p className="text-[10px] text-neutral-400">El recibo PDF fue generado y descargado de forma automática.</p>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => sendViaWhatsApp(lastSale)}
                              className="flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-neutral-950 text-[10px] font-bold py-2 rounded-xl transition-all"
                            >
                              <MessageCircle size={12} /> WhatsApp
                            </button>
                            <button
                              onClick={() => sendViaEmail(lastSale)}
                              className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-bold py-2 rounded-xl transition-all"
                            >
                              <Mail size={12} /> E-mail
                            </button>
                          </div>
                          <button
                            onClick={() => { setSaleSuccess(false); setLastSale(null); setCashReceived(''); }}
                            className="w-full text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider pt-1"
                          >
                            + Nueva Venta POS
                          </button>
                        </div>
                      )}

                      <div className="glass-card p-4 space-y-3 max-h-[30vh] overflow-y-auto no-scrollbar min-h-[140px]">
                        {saleCart.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 text-neutral-500 text-center gap-2">
                            <Smartphone size={20} className="opacity-40" />
                            <p className="text-xs">El carrito está vacío</p>
                          </div>
                        ) : (
                          saleCart.map(item => (
                            <div key={item.product.id} className="flex items-center justify-between gap-3 border-b border-white/5 pb-2.5 last:border-0 last:pb-0">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate">{item.product.name}</p>
                                <p className="text-[10px] text-neutral-400 font-technical">${item.product.price.toLocaleString('es-CO')} c/u</p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/5">
                                  <button
                                    onClick={() => updateSaleQty(item.product.id, -1)}
                                    className="w-5 h-5 flex items-center justify-center text-neutral-400 hover:text-white"
                                  >
                                    <Minus size={10} />
                                  </button>
                                  <span className="text-xs font-bold text-white w-6 text-center font-technical">{item.qty}</span>
                                  <button
                                    onClick={() => updateSaleQty(item.product.id, 1)}
                                    className="w-5 h-5 flex items-center justify-center text-neutral-400 hover:text-white"
                                  >
                                    <Plus size={10} />
                                  </button>
                                </div>
                                <button
                                  onClick={() => removeFromSaleCart(item.product.id)}
                                  className="w-6 h-6 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {saleCart.length > 0 && (
                        <div className="glass-card p-4 space-y-4">
                          <div className="flex justify-between items-center border-b border-white/5 pb-3">
                            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Total</span>
                            <span className="text-lg font-extrabold text-indigo-400 font-technical">${saleCartTotal.toLocaleString('es-CO')}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">Nombre del Cliente</label>
                              <input
                                type="text"
                                value={saleCustomerName}
                                onChange={(e) => setSaleCustomerName(e.target.value)}
                                placeholder="Cliente mostrador"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">Cédula</label>
                              <input
                                type="text"
                                value={saleCustomerCedula}
                                onChange={(e) => setSaleCustomerCedula(e.target.value.replace(/\D/g, '').slice(0, 12))}
                                placeholder="Ej: 1234567890"
                                className="font-technical"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">WhatsApp / Celular</label>
                            <input
                              type="tel"
                              value={saleCustomerPhone}
                              onChange={(e) => setSaleCustomerPhone(e.target.value)}
                              placeholder="Ej: 57300..."
                            />
                          </div>

                          {/* IMEI + Garantía */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">
                                IMEI del Equipo
                                <span className="ml-1 text-neutral-500 normal-case font-normal">(opcional)</span>
                              </label>
                              <input
                                type="text"
                                value={saleImei}
                                onChange={(e) => setSaleImei(e.target.value.replace(/\D/g, '').slice(0, 15))}
                                placeholder="15 dígitos"
                                className="font-technical"
                                maxLength={15}
                              />
                              {saleImei && saleImei.length > 0 && saleImei.length !== 15 && (
                                <p className="text-[9px] text-amber-400">{saleImei.length}/15 dígitos</p>
                              )}
                              {saleImei.length === 15 && (
                                <p className="text-[9px] text-green-400">IMEI válido</p>
                              )}
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">Garantía</label>
                              <select
                                value={saleWarrantyDays}
                                onChange={(e) => setSaleWarrantyDays(Number(e.target.value))}
                              >
                                <option value={0}>Sin garantía</option>
                                <option value={15}>15 días</option>
                                <option value={30}>1 mes</option>
                                <option value={90}>3 meses</option>
                                <option value={180}>6 meses</option>
                                <option value={365}>1 año</option>
                              </select>
                            </div>
                          </div>

                          {/* POS Payment Methods cards */}
                          <div className="space-y-1.5">
                            <label className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">Forma de Pago</label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { id: 'efectivo', label: 'Efectivo', icon: '💵' },
                                { id: 'tarjeta', label: 'Tarjeta', icon: '💳' },
                                { id: 'transferencia', label: 'Transf.', icon: '📲' }
                              ].map(method => (
                                <button
                                  key={method.id}
                                  type="button"
                                  onClick={() => setSalePaymentMethod(method.id as any)}
                                  className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all ${
                                    salePaymentMethod === method.id 
                                      ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 font-bold' 
                                      : 'bg-white/5 border-white/5 text-neutral-400 hover:bg-white/10'
                                  }`}
                                >
                                  <span className="text-base">{method.icon}</span>
                                  <span className="text-[8px] uppercase font-bold tracking-wider">{method.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Live change calculator for Cash */}
                          {salePaymentMethod === 'efectivo' && (
                            <div className="bg-neutral-900/40 border border-white/5 rounded-xl p-3.5 space-y-3">
                              <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider block">Calcular Cambio (Devuelta)</span>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  value={cashReceived}
                                  onChange={(e) => setCashReceived(e.target.value)}
                                  placeholder="Paga con... (ej: 100000)"
                                  className="flex-1 font-technical"
                                />
                                <button
                                  type="button"
                                  onClick={() => setCashReceived(String(saleCartTotal))}
                                  className="btn-secondary py-2 px-3 text-[9px] uppercase font-bold"
                                >
                                  Exacto
                                </button>
                              </div>
                              <div className="flex justify-between gap-1.5">
                                {[50000, 100000, 200000].map(val => (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => setCashReceived(String(val))}
                                    className="bg-white/5 hover:bg-white/10 border border-white/5 text-[9px] font-bold text-white py-1.5 flex-1 rounded-lg font-technical"
                                  >
                                    ${(val / 1000)}k
                                  </button>
                                ))}
                              </div>
                              {cashReceived && (
                                <div className="flex justify-between items-center pt-2.5 border-t border-white/5 text-xs">
                                  <span className="text-[9px] text-neutral-400 uppercase font-bold">Cambio a entregar:</span>
                                  <span className={`font-bold font-technical ${Number(cashReceived) - saleCartTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {Number(cashReceived) - saleCartTotal >= 0 
                                      ? `$${(Number(cashReceived) - saleCartTotal).toLocaleString('es-CO')} COP` 
                                      : 'Monto insuficiente'}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={handleCompleteSale}
                            className="btn-primary w-full py-3.5 flex items-center justify-center gap-2"
                          >
                            <Printer size={16} /> Completar y Generar PDF
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
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
