import React, { useState } from 'react';
import type { Cliente, Propuesta, PropuestaItem, AppUser, Producto, PasoInfografia, ProtocoloData } from '../App';
import SlaEditor from '../components/SlaEditor';
import { SERVICIO_TEMPLATES } from '../data/servicioTemplates';
import { generatePropuestaPDF } from '../services/propuestaPdf';

interface IProps {
  propuestas: Propuesta[];
  clientes: Cliente[];
  productos: Producto[];
  currentUser: AppUser;
  onAdd: (p: Omit<Propuesta, 'id' | 'consecutivo'>) => Promise<void>;
  onUpdate: (p: Propuesta) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

type View = 'list' | 'form';
type EstadoFilter = 'Todos' | 'Borrador' | 'Enviada' | 'Aceptada';

const ESTADO_COLORS: Record<string, string> = {
  Borrador: 'bg-[#E6F0FF] text-[#004A99]',
  Enviada:  'bg-amber-100 text-amber-800',
  Aceptada: 'bg-emerald-100 text-emerald-800',
};

const newItem = (): PropuestaItem => ({
  id: crypto.randomUUID(),
  descripcion: '',
  productoId: '',
  numPart: '',
  cantidad: 1,
  valorUnitario: 0,
});

const makeEmpty = (currentUser: AppUser): Omit<Propuesta, 'id' | 'consecutivo'> => ({
  fecha: new Date().toISOString().split('T')[0],
  clienteId: '', clienteNombre: '', clienteNit: '', clienteCiudad: '', clienteContacto: '',
  tipoServicioId: '', tipoServicioNombre: '',
  moneda: 'COP', valor: 0, items: [newItem()], incluyeIva: false,
  vigencia: '30 días', observaciones: '',
  objetivo: 'Proveer un servicio integral de mantenimiento preventivo para los equipos tecnológicos, garantizando su óptimo funcionamiento y continuidad operativa.',
  personal: [{ id: crypto.randomUUID(), nombre: currentUser.nombre, cargo: 'Ingeniero de Soporte' }],
  visitas: [{ id: crypto.randomUUID(), sede: '', horario: '' }],
  obligacionesCliente: [
    'Proporcionar acceso a las instalaciones y los equipos.',
    'Notificar incidencias o fallos de manera oportuna.',
    'Cumplir con los plazos acordados.',
  ],
  incluirProtocolo: true,
  protocolo: null,
  estado: 'Borrador',
  comercialNombre: currentUser.nombre,
  comercialTelefono: currentUser.telefono || '',
  usuarioId: currentUser.id,
});

const PropuestasModule: React.FC<IProps> = ({ propuestas, clientes, productos, currentUser, onAdd, onUpdate, onDelete }) => {
  const [view, setView] = useState<View>('list');
  const [editTarget, setEditTarget] = useState<Propuesta | null>(null);
  const [form, setForm] = useState<Omit<Propuesta, 'id' | 'consecutivo'>>(makeEmpty(currentUser));
  const [saving, setSaving] = useState(false);
  const [itemSearches, setItemSearches] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [servicioFilter, setServicioFilter] = useState('Todos');
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('Todos');
  const [categoriaFilter, setCategoriaFilter] = useState<'todos' | 'mantenimiento' | 'cloud'>('todos');
  const [previewPropuesta, setPreviewPropuesta] = useState<Propuesta | null>(null);

  const openNew = () => {
    setEditTarget(null);
    setForm(makeEmpty(currentUser));
    setItemSearches({});
    setView('form');
  };

  const openEdit = (p: Propuesta) => {
    setEditTarget(p);
    const { id: _id, consecutivo: _c, ...rest } = p;
    setForm({
      ...rest,
      incluirProtocolo: p.incluirProtocolo !== false,
      protocolo: p.protocolo || null,
    });
    setItemSearches({});
    setView('form');
  };

  const handleClienteChange = (clienteId: string) => {
    const c = clientes.find(cl => cl.id === clienteId);
    const prevProp = propuestas.find(p => p.clienteId === clienteId);
    setForm(f => ({
      ...f,
      clienteId,
      clienteNombre: c?.nombre || '',
      clienteNit: c?.nit || '',
      clienteCiudad: c?.ciudad || '',
      clienteContacto: c?.contacto || '',
      ...(editTarget ? {} : (prevProp ? { incluirProtocolo: prevProp.incluirProtocolo !== false } : {})),
    }));
  };

  const handleServicioChange = (id: string) => {
    const t = SERVICIO_TEMPLATES.find(t => t.id === id);
    const defaultProtocolo: ProtocoloData | null = t ? {
      nombre: t.nombre,
      intro: t.introProtocolo,
      pasosInfografia: t.pasosInfografia.map(p => ({ ...p })),
      pasosLista: [...t.pasosLista],
    } : null;

    if (id === 'mesa-de-ayuda') {
      setForm(f => ({
        ...f,
        tipoServicioId: id,
        tipoServicioNombre: t?.nombre || '',
        protocolo: defaultProtocolo,
        objetivo: 'El objetivo de la presente propuesta es establecer una alianza estratégica para garantizar la continuidad operativa de la plataforma tecnológica de la compañía mediante el suministro de un servicio integral de Mesa de Ayuda (Help Desk). Nuestra solución combina personal técnico especializado, un riguroso plan de mantenimientos preventivos y correctivos anuales, soporte técnico con un esquema híbrido de 3 días presenciales en su sede y 2 días de forma remota, junto con soporte en tiempo real para incidentes críticos. Todo gestionado bajo estrictos Acuerdos de Niveles de Servicio (SLA) a través de nuestra plataforma digital, con el fin de minimizar la inactividad y potenciar la productividad operativa de sus colaboradores.',
        observaciones: 'Resumen del Aplicativo de Mesa de Ayuda:\n• Canal de Reporte Oficial: Portal Web (helpsoluciones.com.co/soportetecnico/index.php) activo 24/7 para registro de tickets.\n• Niveles de Servicio (SLA Nivel 1):\n  - Crítica (Falla total): Respuesta <= 15 min / Solución <= 2h\n  - Alta (Bloqueos/Sin internet): Respuesta <= 30 min / Solución <= 4h\n  - Media (Lentitud/Periféricos): Respuesta <= 1h / Solución <= 12h\n  - Baja (Dudas/Consultas): Respuesta <= 2h / Solución <= 48h\n• Garantía Operativa: Préstamo de hasta 2 equipos de cómputo de backup en caso de superar tiempos de solución en criticidad alta/crítica.'
      }));
    } else if (id === 'tecnico-inhouse') {
      setForm(f => ({
        ...f,
        tipoServicioId: id,
        tipoServicioNombre: 'Técnico Inhouse (Outsourcing IT) - Nivel 1',
        protocolo: defaultProtocolo,
        objetivo: 'Proveer un técnico en sitio perfil Nivel 1 (Soporte Técnico Básico y Help Desk) de manera exclusiva, garantizando la continuidad operativa y atención inmediata a los incidentes reportados por los usuarios de la sede.',
        visitas: [{ id: crypto.randomUUID(), sede: 'Sede Principal (Inhouse)', horario: 'Lunes a Viernes de 8:00 AM a 5:00 PM' }]
      }));
    } else {
      setForm(f => ({
        ...f,
        tipoServicioId: id,
        tipoServicioNombre: t?.nombre || '',
        protocolo: defaultProtocolo,
      }));
    }
  };
  const calcTotal = (items: PropuestaItem[], incluyeIva: boolean) => {
    const sub = items.reduce((s, it) => s + it.cantidad * it.valorUnitario, 0);
    const iva = incluyeIva ? Math.round(sub * 0.19) : 0;
    return sub + iva;
  };

  const updateItem = (itemId: string, changes: Partial<PropuestaItem>) => {
    setForm(f => {
      const items = f.items.map(it => it.id === itemId ? { ...it, ...changes } : it);
      return { ...f, items, valor: calcTotal(items, f.incluyeIva) };
    });
  };

  const addItemRow = () => {
    setForm(f => {
      const items = [...f.items, newItem()];
      return { ...f, items };
    });
  };

  const removeItem = (itemId: string) => {
    setForm(f => {
      const items = f.items.filter(it => it.id !== itemId);
      return { ...f, items: items.length ? items : [newItem()], valor: calcTotal(items, f.incluyeIva) };
    });
    setItemSearches(s => { const next = { ...s }; delete next[itemId]; return next; });
  };

  const selectProductoForItem = (itemId: string, productoId: string) => {
    const p = productos.find(pr => pr.id === productoId);
    if (!p) return;
    setForm(f => {
      const items = f.items.map(it =>
        it.id === itemId
          ? { ...it, productoId: p.id, descripcion: p.nombre, numPart: p.numPart || '', valorUnitario: p.precioCompra || 0 }
          : it
      );
      return { ...f, items, moneda: p.moneda || f.moneda, valor: calcTotal(items, f.incluyeIva) };
    });
    setItemSearches(s => ({ ...s, [itemId]: '' }));
  };

  const validate = (): boolean => {
    if (!form.clienteId) { alert('Selecciona un cliente.'); return false; }
    if (!form.tipoServicioId) { alert('Selecciona un tipo de servicio.'); return false; }
    if (!form.items.length || form.items.every(it => it.valorUnitario <= 0)) {
      alert('Agrega al menos un ítem con valor mayor a 0.'); return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!validate()) return;
    setSaving(true);
    if (editTarget) {
      await onUpdate({ ...editTarget, ...form, estado: 'Borrador' });
    } else {
      await onAdd({ ...form, estado: 'Borrador' });
    }
    setSaving(false);
    setView('list');
  };

  const handleGeneratePDF = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload = { ...form, estado: 'Enviada' as const };
    try {
      if (editTarget) {
        await onUpdate({ ...editTarget, ...payload });
        generatePropuestaPDF({ ...editTarget, ...payload }, 'save');
      } else {
        await onAdd(payload);
        // Use temp object for PDF since we don't have the DB-assigned id/consecutivo yet
        generatePropuestaPDF({ id: 'temp', consecutivo: 'P-???', ...payload }, 'save');
      }
      setView('list');
    } catch (err: any) {
      console.error('Error generando o guardando la propuesta:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (!form.clienteId || !form.tipoServicioId || !form.valor) {
      alert('Completa cliente, tipo de servicio y valor para ver la vista previa.');
      return;
    }
    setPreviewPropuesta({
      id: editTarget?.id || 'preview',
      consecutivo: editTarget?.consecutivo || 'P-PREV',
      ...form,
    });
  };

  const filtered = propuestas.filter(p => {
    const matchSearch = p.clienteNombre.toLowerCase().includes(search.toLowerCase());
    const matchServicio = servicioFilter === 'Todos' || p.tipoServicioId === servicioFilter;
    const matchEstado = estadoFilter === 'Todos' || p.estado === estadoFilter;
    return matchSearch && matchServicio && matchEstado;
  });

  const selectedTemplate = SERVICIO_TEMPLATES.find(t => t.id === form.tipoServicioId);
  const fmtMoney = (n: number, moneda: string = 'COP') => {
  if (moneda === 'USD' || (n < 5000 && n > 0)) {
    return `USD $${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${Math.round(n).toLocaleString('es-CO')}`;
};
const fmtCOP = (n: number) => fmtMoney(n, 'COP');

  // Protocolo activo: personalizado o del template estándar
  const activePasosInfografia: PasoInfografia[] = form.protocolo?.pasosInfografia
    ?? selectedTemplate?.pasosInfografia
    ?? [];

  const activePasosLista: string[] = form.protocolo?.pasosLista
    ?? selectedTemplate?.pasosLista
    ?? [];

  const activeIntro: string = form.protocolo?.intro
    ?? selectedTemplate?.introProtocolo
    ?? '';

  const getBaseProtocolo = (): ProtocoloData => ({
    nombre: form.protocolo?.nombre || selectedTemplate?.nombre || '',
    intro: activeIntro,
    pasosInfografia: activePasosInfografia.map(p => ({ ...p })),
    pasosLista: [...activePasosLista],
  });

  const updatePasoInfografia = (idx: number, changes: Partial<PasoInfografia>) => {
    const base = getBaseProtocolo();
    base.pasosInfografia = base.pasosInfografia.map((p, i) => i === idx ? { ...p, ...changes } : p);
    setForm(f => ({ ...f, protocolo: base }));
  };

  const removePasoInfografia = (idx: number) => {
    const base = getBaseProtocolo();
    base.pasosInfografia = base.pasosInfografia.filter((_, i) => i !== idx);
    setForm(f => ({ ...f, protocolo: base }));
  };

  const addPasoInfografia = () => {
    const base = getBaseProtocolo();
    base.pasosInfografia.push({
      icono: '🔧',
      titulo: 'Nuevo Punto',
      descripcion: 'Detalle de la actividad o alcance específico para este cliente.',
    });
    setForm(f => ({ ...f, protocolo: base }));
  };

  const updatePasoLista = (idx: number, text: string) => {
    const base = getBaseProtocolo();
    base.pasosLista = base.pasosLista.map((item, i) => i === idx ? text : item);
    setForm(f => ({ ...f, protocolo: base }));
  };

  const removePasoLista = (idx: number) => {
    const base = getBaseProtocolo();
    base.pasosLista = base.pasosLista.filter((_, i) => i !== idx);
    setForm(f => ({ ...f, protocolo: base }));
  };

  const addPasoLista = () => {
    const base = getBaseProtocolo();
    base.pasosLista.push('Nuevo compromiso o alcance del servicio.');
    setForm(f => ({ ...f, protocolo: base }));
  };

  const moverListaATarjeta = (idx: number) => {
    const base = getBaseProtocolo();
    const texto = base.pasosLista[idx] || '';
    base.pasosLista = base.pasosLista.filter((_, i) => i !== idx);
    const partes = texto.split(':');
    const titulo = partes.length > 1 ? partes[0].trim() : (texto.length > 30 ? texto.slice(0, 28) + '...' : texto);
    const descripcion = partes.length > 1 ? partes.slice(1).join(':').trim() : texto;
    base.pasosInfografia.push({
      icono: '📌',
      titulo: titulo || 'Nuevo Punto',
      descripcion: descripcion || texto,
    });
    setForm(f => ({ ...f, protocolo: base }));
  };

  const moverTarjetaALista = (idx: number) => {
    const base = getBaseProtocolo();
    const card = base.pasosInfografia[idx];
    if (!card) return;
    base.pasosInfografia = base.pasosInfografia.filter((_, i) => i !== idx);
    const textoCompleto = card.titulo && card.descripcion ? `${card.titulo}: ${card.descripcion}` : (card.titulo || card.descripcion);
    base.pasosLista.push(textoCompleto);
    setForm(f => ({ ...f, protocolo: base }));
  };

  const updateIntroProtocolo = (text: string) => {
    const base = getBaseProtocolo();
    base.intro = text;
    setForm(f => ({ ...f, protocolo: base }));
  };

  const resetProtocoloToDefault = () => {
    if (!selectedTemplate) return;
    if (window.confirm('¿Restaurar los puntos del protocolo al estándar original de este servicio?')) {
      setForm(f => ({
        ...f,
        protocolo: {
          nombre: selectedTemplate.nombre,
          intro: selectedTemplate.introProtocolo,
          pasosInfografia: selectedTemplate.pasosInfografia.map(p => ({ ...p })),
          pasosLista: [...selectedTemplate.pasosLista],
        },
      }));
    }
  };

  // ── PREVIEW MODAL (shared between list and form views) ──────────────────────
  const PreviewModal = () => {
    if (!previewPropuesta) return null;

    const pvSub = previewPropuesta.items.reduce((s, it) => s + it.cantidad * it.valorUnitario, 0);
    const pvIva = previewPropuesta.incluyeIva ? Math.round(pvSub * 0.19) : 0;
    const pvTotal = pvSub + pvIva;
    const visibleItems = previewPropuesta.items.filter(it => it.valorUnitario > 0);

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl border border-[#D6E3F3] max-w-lg w-full p-6">
          <h3 className="text-lg font-bold mb-1">
            Vista Previa — {previewPropuesta.consecutivo}
          </h3>
          <p className="text-slate-500 text-sm mb-4">
            {previewPropuesta.clienteNombre} · {previewPropuesta.tipoServicioNombre}
          </p>
          <div className="bg-white rounded-lg p-4 text-sm text-slate-700 space-y-2 mb-4">
            {visibleItems.length > 0 && (
              <div className="space-y-1 pb-2 border-b border-[#D6E3F3]">
                {visibleItems.slice(0, 3).map(it => (
                  <div key={it.id} className="flex justify-between text-xs">
                    <span className="text-slate-500 truncate flex-1 mr-2">{it.descripcion || '—'}</span>
                    <span className="text-slate-700 whitespace-nowrap">
                      {it.cantidad > 1 ? `${it.cantidad} × ` : ''}{fmtCOP(it.cantidad * it.valorUnitario)}
                    </span>
                  </div>
                ))}
                {visibleItems.length > 3 && (
                  <p className="text-xs text-slate-500">+ {visibleItems.length - 3} ítem(s) más</p>
                )}
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal:</span>
              <span>{fmtCOP(pvSub)}</span>
            </div>
            {previewPropuesta.incluyeIva && (
              <div className="flex justify-between">
                <span className="text-slate-500">IVA (19%):</span>
                <span>{fmtCOP(pvIva)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-[#D6E3F3] pt-2">
              <span className="font-bold">Total:</span>
              <span className="font-bold text-[#004A99]">{fmtCOP(pvTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Vigencia:</span>
              <span>{previewPropuesta.vigencia}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Protocolo:</span>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                previewPropuesta.incluirProtocolo !== false
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {previewPropuesta.incluirProtocolo !== false ? '✓ Incluido en PDF' : '⊘ Excluido del PDF'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Estado:</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full ${ESTADO_COLORS[previewPropuesta.estado]}`}>
                {previewPropuesta.estado}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Comercial:</span>
              <span>{previewPropuesta.comercialNombre}</span>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setPreviewPropuesta(null)}
              className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cerrar
            </button>
            <button
              onClick={() => {
                generatePropuestaPDF(previewPropuesta, 'save');
                setPreviewPropuesta(null);
              }}
              className="px-4 py-2 text-sm bg-[#004A99] hover:bg-[#003366] text-white rounded-lg"
            >
              📥 Descargar PDF
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div className="p-4 text-slate-800">
        <PreviewModal />
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">Propuestas Comerciales</h2>
            <span className="bg-[#E6F0FF] text-[#004A99] text-xs px-3 py-0.5 rounded-full">
              {propuestas.length} propuestas
            </span>
          </div>
          <button
            onClick={openNew}
            className="bg-[#004A99] hover:bg-[#003366] text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Nueva Propuesta
          </button>
        </div>

        {/* PESTAÑAS DE CATEGORIZACIÓN */}
        <div className="flex gap-2 mb-4 border-b border-[#D6E3F3] pb-2">
          <button
            onClick={() => setCategoriaFilter('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              categoriaFilter === 'todos' ? 'bg-[#001f3f] text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-[#D6E3F3]'
            }`}
          >
            📋 Todas ({propuestas.length})
          </button>
          <button
            onClick={() => setCategoriaFilter('mantenimiento')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              categoriaFilter === 'mantenimiento' ? 'bg-[#004A99] text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-[#D6E3F3]'
            }`}
          >
            🛠️ Mesa de Ayuda & Soporte ({propuestas.filter(p => p.tipoServicioId !== 'cloud-backup' && p.tipoServicioId !== 'cloud_backup').length})
          </button>
          <button
            onClick={() => setCategoriaFilter('cloud')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              categoriaFilter === 'cloud' ? 'bg-[#0d9488] text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-[#D6E3F3]'
            }`}
          >
            ☁️ Propuestas Comerciales & Cloud ({propuestas.filter(p => p.tipoServicioId === 'cloud-backup' || p.tipoServicioId === 'cloud_backup').length})
          </button>
        </div>

        <div className="flex gap-3 mb-4 flex-wrap">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Buscar cliente..."
            className="bg-white border border-[#D6E3F3] rounded-lg px-3 py-1.5 text-sm text-slate-800 w-52"
          />
          <select
            value={servicioFilter}
            onChange={e => setServicioFilter(e.target.value)}
            className="bg-white border border-[#D6E3F3] rounded-lg px-3 py-1.5 text-sm text-slate-700"
          >
            <option value="Todos">Todos los servicios</option>
            {SERVICIO_TEMPLATES.map(t => (
              <option key={t.id} value={t.id}>{t.icono} {t.nombre.split('de ')[1] || t.nombre}</option>
            ))}
          </select>
          <select
            value={estadoFilter}
            onChange={e => setEstadoFilter(e.target.value as EstadoFilter)}
            className="bg-white border border-[#D6E3F3] rounded-lg px-3 py-1.5 text-sm text-slate-700"
          >
            {(['Todos', 'Borrador', 'Enviada', 'Aceptada'] as const).map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-xl border border-[#D6E3F3] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#D6E3F3] bg-[#EEF4FC]">
                {['#', 'Cliente', 'Tipo de Servicio', 'Fecha', 'Valor', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className={`text-slate-500 font-medium px-4 py-3 ${h === 'Valor' ? 'text-right' : h === 'Estado' || h === 'Acciones' ? 'text-center' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-slate-500 py-10">
                    No hay propuestas. Crea la primera con "+ Nueva Propuesta".
                  </td>
                </tr>
              ) : filtered.map(p => {
                const t = SERVICIO_TEMPLATES.find(t => t.id === p.tipoServicioId);
                const rowTotal = p.valor + (p.incluyeIva ? Math.round(p.valor * 0.19) : 0);
                return (
                  <tr key={p.id} className="border-b border-[#EDF3FA] hover:bg-[#F5F9FF]">
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{p.consecutivo}</td>
                    <td className="px-4 py-3 font-medium">{p.clienteNombre}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{ background: `${t?.color || '#004A99'}22`, color: t?.color || '#004A99' }}
                        >
                          {t?.icono} {t ? (t.nombre.split('de ')[1] || t.nombre) : p.tipoServicioNombre}
                        </span>
                        {p.incluirProtocolo === false && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 font-medium"
                            title="Esta propuesta no incluye hoja de protocolo en el PDF"
                          >
                            Sin protocolo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{p.fecha}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-400">
                      {fmtMoney(rowTotal, p.moneda)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full ${ESTADO_COLORS[p.estado] || ''}`}>
                        {p.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button title="Vista previa" onClick={() => setPreviewPropuesta(p)} className="bg-transparent mx-1 opacity-60 hover:opacity-100">👁️</button>
                      <button
                        title="Copiar enlace para el cliente"
                        onClick={() => {
                          const url = `${window.location.origin}/?p=${encodeURIComponent(p.consecutivo)}`;
                          navigator.clipboard.writeText(url);
                          alert(`Enlace copiado para compartir:\n${url}`);
                        }}
                        className="bg-transparent mx-1 opacity-60 hover:opacity-100"
                      >
                        🔗
                      </button>
                      <a
                        title="Abrir enlace público en pestaña nueva"
                        href={`/?p=${encodeURIComponent(p.consecutivo)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-transparent mx-1 opacity-60 hover:opacity-100 inline-block no-underline"
                      >
                        ↗️
                      </a>
                      <button title="Descargar PDF" onClick={() => generatePropuestaPDF(p, 'save')} className="bg-transparent mx-1 opacity-60 hover:opacity-100">📥</button>
                      <button title="Editar" onClick={() => openEdit(p)} className="bg-transparent mx-1 opacity-60 hover:opacity-100">✏️</button>
                      <button
                        title="Eliminar"
                        onClick={() => { if (window.confirm(`¿Eliminar ${p.consecutivo}?`)) onDelete(p.id); }}
                        className="bg-transparent mx-1 opacity-60 hover:opacity-100 text-red-400"
                      >
                        🗑️
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
  }

  // ── FORM VIEW ──────────────────────────────────────────────────────────────
  return (
    <div className="p-4 text-slate-800">
      <PreviewModal />
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setView('list')} className="bg-transparent text-slate-500 hover:text-[#004A99] text-sm">
          ← Volver
        </button>
        <h2 className="text-xl font-bold">
          {editTarget ? `Editar ${editTarget.consecutivo}` : 'Nueva Propuesta Comercial'}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Form fields */}
        <div className="space-y-5">
          {/* Cliente */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">Cliente *</label>
            <select
              value={form.clienteId}
              onChange={e => handleClienteChange(e.target.value)}
              className="w-full bg-white border border-[#D6E3F3] rounded-lg px-4 py-3 text-base text-slate-800"
            >
              <option value="">Seleccionar cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            {form.clienteId && (() => {
              const c = clientes.find(cl => cl.id === form.clienteId);
              return (
                <div className="mt-2 bg-white border border-[#D6E3F3] rounded-lg px-3 py-2 space-y-0.5">
                  {form.clienteNit && (
                    <p className="text-xs text-slate-500">NIT: <span className="text-slate-700">{form.clienteNit}</span></p>
                  )}
                  {form.clienteContacto && (
                    <p className="text-xs text-slate-500">Contacto: <span className="text-slate-700">{form.clienteContacto}</span></p>
                  )}
                  {c?.telefono && (
                    <p className="text-xs text-slate-500">Tel: <span className="text-slate-700">{c.telefono}</span></p>
                  )}
                  {c?.correo && (
                    <p className="text-xs text-slate-500">Email: <span className="text-slate-700">{c.correo}</span></p>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Ciudad */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">Ciudad</label>
            <input
              value={form.clienteCiudad || ''}
              onChange={e => setForm(f => ({ ...f, clienteCiudad: e.target.value }))}
              placeholder="Ciudad del servicio"
              className="w-full bg-white border border-[#D6E3F3] rounded-lg px-3 py-2 text-sm text-slate-800"
            />
          </div>

          {/* Tipo de Servicio */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">Categoría / Servicio Principal *</label>
            <p className="text-xs text-slate-600 mb-2">Selecciona la categoría general. Puedes detallar múltiples equipos y ciudades en los ítems.</p>
            <div className="grid grid-cols-2 gap-2">
              {SERVICIO_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleServicioChange(t.id)}
                  className={`border rounded-lg p-3 text-center transition-all ${
                    form.tipoServicioId === t.id
                      ? 'border-[#004A99] bg-[#E6F0FF]'
                      : 'border-[#D6E3F3] bg-white opacity-60 hover:opacity-80'
                  }`}
                >
                  <div className="text-xl">{t.icono}</div>
                  <div
                    className="text-xs font-semibold mt-1"
                    style={{ color: form.tipoServicioId === t.id ? t.color : '#94a3b8' }}
                  >
                    {t.nombre.split('de ')[1] || t.nombre}
                  </div>
                </button>
              ))}
              <button
                type="button"
                disabled
                title="Disponible en v2"
                className="bg-white border border-dashed border-slate-300 rounded-lg p-3 text-center opacity-30 cursor-not-allowed"
              >
                <div className="text-xl">➕</div>
                <div className="text-xs text-slate-500 mt-1">Nuevo tipo</div>
              </button>
            </div>
            
            {form.tipoServicioId === 'tecnico-inhouse' && (
              <div className="mt-4 p-4 bg-[#F5F9FF] border border-[#BFD5F2] rounded-lg space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#004A99] mb-1.5">Nivel del Técnico *</label>
                  <select
                    value={form.tipoServicioNombre.includes('Nivel 1') ? 'Nivel 1' : form.tipoServicioNombre.includes('Nivel 2') ? 'Nivel 2' : form.tipoServicioNombre.includes('Nivel 3') ? 'Nivel 3' : ''}
                    onChange={e => {
                      const nivel = e.target.value;
                      const map: Record<string, string> = {
                        'Nivel 1': 'Nivel 1 (Soporte Técnico Básico y Help Desk)',
                        'Nivel 2': 'Nivel 2 (Soporte Especializado y Redes)',
                        'Nivel 3': 'Nivel 3 (Administrador de Infraestructura / Sysadmin)'
                      };
                      setForm(f => ({
                        ...f,
                        tipoServicioNombre: `Técnico Inhouse (Outsourcing IT) - ${nivel}`,
                        objetivo: `Proveer un técnico en sitio perfil ${map[nivel] || nivel} de manera exclusiva, garantizando la continuidad operativa y atención inmediata a los incidentes reportados por los usuarios de la sede.`
                      }));
                    }}
                    className="w-full bg-white border border-[#D6E3F3] rounded-lg px-3 py-2 text-sm text-slate-800"
                  >
                    <option value="">Seleccione el nivel del técnico...</option>
                    <option value="Nivel 1">Nivel 1 (Soporte Técnico Básico y Help Desk)</option>
                    <option value="Nivel 2">Nivel 2 (Soporte Especializado y Redes)</option>
                    <option value="Nivel 3">Nivel 3 (Administrador de Infraestructura / Sysadmin)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#004A99] mb-1.5">Horario de Servicio *</label>
                  <input
                    type="text"
                    placeholder="Ej: Lunes a Viernes de 8:00 AM a 5:00 PM"
                    value={form.visitas[0]?.horario || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setForm(f => ({
                        ...f,
                        visitas: [{ id: f.visitas[0]?.id || crypto.randomUUID(), sede: f.visitas[0]?.sede || 'Sede Principal (Inhouse)', horario: val }]
                      }));
                    }}
                    className="w-full bg-white border border-[#D6E3F3] rounded-lg px-3 py-2 text-sm text-slate-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                Ítems de la Propuesta *
              </label>
              <select
                value={form.moneda}
                onChange={e => setForm(f => ({ ...f, moneda: e.target.value as 'COP' | 'USD' }))}
                className="bg-white border border-[#D6E3F3] rounded px-2 py-1 text-xs text-slate-700"
              >
                <option value="COP">COP</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <div className="bg-white rounded-xl border border-[#D6E3F3] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#D6E3F3] bg-[#EEF4FC]">
                    <th className="text-slate-500 font-medium px-3 py-2 text-left text-xs uppercase tracking-wider">
                      Descripción / Producto
                    </th>
                    <th className="text-slate-500 font-medium px-3 py-2 text-center text-xs uppercase tracking-wider w-16">
                      Cant.
                    </th>
                    <th className="text-slate-500 font-medium px-3 py-2 text-right text-xs uppercase tracking-wider w-36">
                      Valor Unit.
                    </th>
                    <th className="text-slate-500 font-medium px-3 py-2 text-right text-xs uppercase tracking-wider w-28">
                      Total
                    </th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {form.items.map(item => (
                    <tr key={item.id} className="border-b border-[#EDF3FA] hover:bg-[#F5F9FF]">
                      <td className="px-3 py-2">
                        <div className="relative mb-1.5">
                          <input
                            type="text"
                            value={itemSearches[item.id] || ''}
                            onChange={e => setItemSearches(s => ({ ...s, [item.id]: e.target.value }))}
                            placeholder="Buscar en catálogo..."
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 placeholder-slate-400"
                          />
                          {(itemSearches[item.id] || '').length > 1 && (() => {
                            const q = (itemSearches[item.id] || '').toLowerCase();
                            const matches = productos.filter(p =>
                              p.nombre.toLowerCase().includes(q) ||
                              (p.numPart || '').toLowerCase().includes(q)
                            );
                            return (
                              <div className="absolute z-10 w-full mt-0.5 bg-white border border-[#D6E3F3] rounded shadow-xl max-h-40 overflow-y-auto">
                                {matches.slice(0, 6).map(p => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => selectProductoForItem(item.id, p.id)}
                                    className="bg-white w-full text-left px-2 py-1.5 hover:bg-[#E6F0FF] text-xs border-b border-[#EDF3FA] last:border-0"
                                  >
                                    <span className="text-slate-800 font-medium">{p.nombre}</span>
                                    {p.numPart && (
                                      <span className="ml-1.5 font-mono text-[#004A99]">{p.numPart}</span>
                                    )}
                                    <span className="ml-1.5 text-slate-500">
                                      {p.moneda === 'USD'
                                        ? `USD ${p.precioCompra}`
                                        : `$${(p.precioCompra || 0).toLocaleString('es-CO')}`}
                                    </span>
                                  </button>
                                ))}
                                {matches.length === 0 && (
                                  <p className="px-2 py-1.5 text-xs text-slate-500">Sin resultados</p>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        <input
                          type="text"
                          value={item.descripcion}
                          onChange={e => updateItem(item.id, { descripcion: e.target.value })}
                          placeholder="Descripción del ítem..."
                          className="w-full bg-white border border-[#D6E3F3] rounded px-2 py-1 text-xs text-slate-800"
                        />
                        {item.numPart && (
                          <span className="text-xs font-mono text-[#004A99] mt-0.5 inline-block">
                            Ref: {item.numPart}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="1"
                          value={item.cantidad}
                          onChange={e => updateItem(item.id, { cantidad: parseInt(e.target.value, 10) || 1 })}
                          className="w-full bg-white border border-[#D6E3F3] rounded px-2 py-1 text-xs text-slate-800 text-center"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.valorUnitario || ''}
                          onChange={e => updateItem(item.id, { valorUnitario: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          className="w-full bg-white border border-[#D6E3F3] rounded px-2 py-1 text-xs text-slate-800 text-right"
                        />
                      </td>
                      <td className="px-3 py-2 text-right text-emerald-400 font-semibold text-xs">
                        {fmtCOP(item.cantidad * item.valorUnitario)}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="bg-transparent text-slate-500 hover:text-red-400 text-base font-bold leading-none"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={addItemRow}
              className="bg-transparent mt-2 w-full text-xs text-[#004A99] border border-dashed border-slate-300 rounded-lg py-2 hover:border-[#004A99] hover:bg-[#E6F0FF] transition-colors"
            >
              + Agregar ítem
            </button>

            <label className="flex items-center gap-2 mt-3 text-sm text-slate-500 cursor-pointer">
              <input
                type="checkbox"
                checked={form.incluyeIva}
                onChange={e => setForm(f => ({
                  ...f,
                  incluyeIva: e.target.checked,
                  valor: calcTotal(f.items, e.target.checked),
                }))}
              />
              Incluir IVA (19%)
            </label>

            {(() => {
              const sub = form.items.reduce((s, it) => s + it.cantidad * it.valorUnitario, 0);
              const ivaAmt = form.incluyeIva ? Math.round(sub * 0.19) : 0;
              return sub > 0 ? (
                <p className="text-xs text-slate-500 mt-1 text-right">
                  Subtotal: {fmtCOP(sub)}
                  {form.incluyeIva && <span> · IVA: {fmtCOP(ivaAmt)}</span>}
                  {' · '}Total:{' '}
                  <span className="text-emerald-400 font-semibold">{fmtCOP(sub + ivaAmt)}</span>
                </p>
              ) : null;
            })()}
          </div>

          {/* Vigencia */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">Vigencia</label>
            <input
              value={form.vigencia}
              onChange={e => setForm(f => ({ ...f, vigencia: e.target.value }))}
              className="w-full bg-white border border-[#D6E3F3] rounded-lg px-3 py-2 text-sm text-slate-800"
            />
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">Observaciones adicionales</label>
            <textarea
              value={form.observaciones}
              onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
              rows={3}
              className="w-full bg-white border border-[#D6E3F3] rounded-lg px-3 py-2 text-sm text-slate-700 resize-none"
            />
          </div>
        </div>

        {/* RIGHT: Protocol preview & interactive point editor */}
        <div className={`border rounded-xl p-4 overflow-y-auto max-h-[560px] transition-all ${
          form.incluirProtocolo !== false
            ? 'border-[#D6E3F3] bg-[#F5F9FF]'
            : 'border-slate-300 bg-slate-50'
        }`}>
          <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase tracking-wider text-[#004A99] font-bold">
                Protocolo del Servicio
              </span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-semibold transition-colors ${
                  form.incluirProtocolo !== false
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-200 text-slate-700 border border-slate-300'
                }`}
              >
                {form.incluirProtocolo !== false ? `✓ Incluido (${activePasosInfografia.length} puntos)` : '⊘ Excluido'}
              </span>
            </div>

            {/* Acciones principales del protocolo */}
            <div className="flex items-center gap-2">
              {selectedTemplate && form.incluirProtocolo !== false && (
                <button
                  type="button"
                  onClick={resetProtocoloToDefault}
                  className="text-[11px] text-slate-500 hover:text-[#004A99] hover:underline px-1.5 py-0.5"
                  title="Restaurar los puntos originales de este servicio"
                >
                  ↺ Restaurar estándar
                </button>
              )}
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, incluirProtocolo: f.incluirProtocolo === false }))}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all shadow-sm flex items-center gap-1.5 ${
                  form.incluirProtocolo !== false
                    ? 'bg-white text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300'
                    : 'bg-[#004A99] text-white hover:bg-[#003366]'
                }`}
                title={form.incluirProtocolo !== false ? 'Quitar la hoja completa de protocolo' : 'Incluir la hoja de protocolo'}
              >
                {form.incluirProtocolo !== false ? (
                  <><span>✕</span> Omitir protocolo</>
                ) : (
                  <><span>✓</span> Incluir protocolo</>
                )}
              </button>
            </div>
          </div>

          {selectedTemplate && (
            <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-[#D6E3F3]">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: `${selectedTemplate.color}22`, color: selectedTemplate.color }}
              >
                {selectedTemplate.icono} {selectedTemplate.nombre.split('de ')[1] || selectedTemplate.nombre}
              </span>
              <span className="text-[11px] text-slate-500">
                {form.incluirProtocolo !== false
                  ? '💡 Haz clic en los textos para editar o usa ✕ para quitar puntos'
                  : '🚫 Hoja de protocolo omitida en el PDF'}
              </span>
            </div>
          )}

          {form.incluirProtocolo === false ? (
            <div className="py-8 px-4 text-center bg-white rounded-xl border border-dashed border-slate-300 my-2">
              <div className="w-11 h-11 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xl mb-2">
                📋
              </div>
              <p className="font-semibold text-slate-800 text-sm">Protocolo desactivado para este cliente</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                Esta propuesta <strong>no incluirá</strong> la página del protocolo operativo ni la infografía en el PDF.
                Ideal para compras directas de equipos o clientes con protocolos propios.
              </p>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, incluirProtocolo: true }))}
                className="mt-3.5 px-3.5 py-1.5 text-xs font-semibold text-[#004A99] bg-[#E6F0FF] hover:bg-[#D0E4FF] rounded-lg transition-colors"
              >
                + Volver a incluir protocolo
              </button>
            </div>
          ) : !selectedTemplate ? (
            <p className="text-slate-500 text-sm">Selecciona un tipo de servicio para ver y editar el protocolo.</p>
          ) : (
            <div className="space-y-3">
              {/* Título e introducción editable */}
              <div>
                <p className="font-semibold text-slate-800 text-sm mb-1">{form.protocolo?.nombre || selectedTemplate.nombre}</p>
                <textarea
                  value={activeIntro}
                  onChange={e => updateIntroProtocolo(e.target.value)}
                  rows={2}
                  placeholder="Texto introductorio del protocolo..."
                  className="w-full text-xs text-slate-600 bg-white border border-[#D6E3F3] rounded-lg p-2 resize-none focus:outline-none focus:border-[#004A99] leading-relaxed"
                  title="Párrafo introductorio del protocolo en el PDF"
                />
              </div>

              {/* Puntos principales del protocolo (Infografía) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Puntos del Procedimiento ({activePasosInfografia.length})
                  </span>
                  <button
                    type="button"
                    onClick={addPasoInfografia}
                    className="text-xs font-semibold text-[#004A99] hover:underline flex items-center gap-1"
                  >
                    + Agregar punto
                  </button>
                </div>

                {activePasosInfografia.length === 0 ? (
                  <div className="py-4 text-center bg-white rounded-lg border border-dashed border-slate-300 text-xs text-slate-500">
                    No hay puntos en la infografía. Haz clic en <strong>+ Agregar punto</strong> para añadir uno.
                  </div>
                ) : (
                  activePasosInfografia.map((paso, i) => (
                    <div key={i} className="bg-white rounded-lg p-2.5 border border-[#D6E3F3] shadow-sm hover:border-[#004A99]/50 transition-all">
                      <div className="flex items-start gap-2.5">
                        {/* Número y emoji */}
                        <div className="flex flex-col items-center gap-1 pt-0.5">
                          <span className="w-5 h-5 rounded-full bg-[#004A99] text-white text-[11px] flex items-center justify-center font-bold flex-shrink-0">
                            {i + 1}
                          </span>
                          <input
                            type="text"
                            value={paso.icono}
                            onChange={e => updatePasoInfografia(i, { icono: e.target.value })}
                            className="w-7 h-7 text-center text-xs border border-slate-200 rounded hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#004A99] bg-slate-50"
                            title="Emoji del punto"
                          />
                        </div>

                        {/* Título y Descripción editables */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <input
                              type="text"
                              value={paso.titulo}
                              onChange={e => updatePasoInfografia(i, { titulo: e.target.value })}
                              placeholder="Título del punto"
                              className="font-semibold text-slate-800 text-xs w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#004A99] focus:outline-none px-2 py-1 rounded transition-all"
                            />
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => moverTarjetaALista(i)}
                                className="!bg-slate-100 hover:!bg-slate-200 !text-slate-600 px-1.5 py-1 rounded text-[11px] font-medium transition-colors border border-slate-200"
                                title="Mover este punto a las especificaciones adicionales de abajo"
                              >
                                ⬇ A lista
                              </button>
                              <button
                                type="button"
                                onClick={() => removePasoInfografia(i)}
                                className="!bg-red-50 hover:!bg-red-100 !text-red-600 px-2 py-1 rounded text-xs transition-colors font-medium border border-red-200"
                                title="Quitar este punto del protocolo"
                              >
                                ✕ Quitar
                              </button>
                            </div>
                          </div>
                          <textarea
                            value={paso.descripcion}
                            onChange={e => updatePasoInfografia(i, { descripcion: e.target.value })}
                            rows={2}
                            placeholder="Descripción de la actividad..."
                            className="text-xs text-slate-700 w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#004A99] focus:outline-none p-1.5 rounded transition-all resize-none leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Especificaciones adicionales (pasosLista: puntos a partir del 6) */}
              <div className="mt-4 pt-3 border-t border-[#D6E3F3]">
                <div className="flex justify-between items-center mb-2.5">
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Compromisos y Especificaciones Adicionales ({activePasosLista.length})
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Puntos numerados complementarios incluidos en el protocolo
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={addPasoLista}
                    className="!bg-[#E6F0FF] hover:!bg-[#D0E4FF] !text-[#004A99] text-xs font-semibold px-2.5 py-1 rounded-lg border border-[#004A99]/20 transition-colors shadow-2xs"
                  >
                    + Agregar ítem
                  </button>
                </div>
                <div className="space-y-2">
                  {activePasosLista.map((paso, i) => (
                    <div key={i} className="bg-white rounded-lg p-2 border border-[#D6E3F3] shadow-2xs hover:border-[#004A99]/40 transition-all">
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-bold flex-shrink-0 mt-1">
                          {activePasosInfografia.length + i + 1}
                        </span>
                        <textarea
                          value={paso}
                          onChange={e => updatePasoLista(i, e.target.value)}
                          rows={2}
                          className="text-xs text-slate-800 flex-1 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#004A99] focus:outline-none rounded-md p-1.5 leading-relaxed resize-none transition-all"
                          placeholder="Compromiso o condición adicional..."
                        />
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => removePasoLista(i)}
                            className="!bg-red-50 hover:!bg-red-100 !text-red-600 text-xs px-2 py-1 rounded border border-red-200 font-medium transition-colors"
                            title="Quitar esta especificación"
                          >
                            ✕ Quitar
                          </button>
                          <button
                            type="button"
                            onClick={() => moverListaATarjeta(i)}
                            className="!bg-[#E6F0FF] hover:!bg-[#D0E4FF] !text-[#004A99] text-[10px] px-1.5 py-0.5 rounded border border-[#004A99]/20 font-medium transition-colors text-center"
                            title="Convertir esta especificación en una tarjeta principal con icono"
                          >
                            ⬆ A tarjeta
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-slate-500 pt-2 border-t border-[#D6E3F3]">
                ✨ Los cambios que hagas aquí se guardan con la propuesta y se plasman en el PDF.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Secciones de Detalle del Servicio */}
      <div className="mt-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-[#D6E3F3] pb-2">
          Detalles del Servicio
        </h3>

        {/* Objetivo */}
        <div className="border border-[#EDF3FA] rounded-xl p-4">
          <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
            🎯 Objetivo de la Propuesta
          </label>
          <textarea
            value={form.objetivo}
            onChange={e => setForm(f => ({ ...f, objetivo: e.target.value }))}
            rows={3}
            className="w-full bg-white border border-[#D6E3F3] rounded-lg px-3 py-2 text-sm text-slate-800 resize-none"
          />
        </div>

        {/* SLA (solo Mesa de Ayuda): estándar o importados del RFP del cliente */}
        {form.tipoServicioId === 'mesa-de-ayuda' && (
          <SlaEditor value={form.slas} onChange={slas => setForm(f => ({ ...f, slas }))} />
        )}

        {/* Personal a Cargo */}
        <div className="border border-[#EDF3FA] rounded-xl p-4">
          <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">
            👥 Personal a Cargo
          </label>
          <div className="space-y-2">
            {form.personal.map((persona, idx) => (
              <div key={persona.id} className="grid grid-cols-2 gap-2 items-center">
                <input
                  type="text"
                  value={persona.nombre}
                  onChange={e => setForm(f => ({
                    ...f,
                    personal: f.personal.map((item, i) => i === idx ? { ...item, nombre: e.target.value } : item),
                  }))}
                  placeholder="Nombre"
                  className="bg-white border border-[#D6E3F3] rounded-lg px-3 py-2 text-sm text-slate-800"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={persona.cargo}
                    onChange={e => setForm(f => ({
                      ...f,
                      personal: f.personal.map((item, i) => i === idx ? { ...item, cargo: e.target.value } : item),
                    }))}
                    placeholder="Cargo / Rol"
                    className="flex-1 bg-white border border-[#D6E3F3] rounded-lg px-3 py-2 text-sm text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, personal: f.personal.filter((_, i) => i !== idx) }))}
                    className="bg-transparent text-slate-500 hover:text-red-400 font-bold text-base leading-none"
                  >×</button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setForm(f => ({
              ...f,
              personal: [...f.personal, { id: crypto.randomUUID(), nombre: '', cargo: '' }],
            }))}
            className="bg-transparent mt-2 w-full text-xs text-[#004A99] border border-dashed border-slate-300 rounded-lg py-2 hover:border-[#004A99] hover:bg-[#E6F0FF] transition-colors"
          >
            + Agregar persona
          </button>
        </div>

        {/* Visitas a Sedes y Horarios */}
        <div className="border border-[#EDF3FA] rounded-xl p-4">
          <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
            📅 Visitas a Sedes y Horarios
          </label>
          <p className="text-xs text-slate-600 mb-3">El mantenimiento se realizará en la ventana propuesta por el cliente.</p>
          <div className="space-y-2">
            {form.visitas.map((visita, idx) => (
              <div key={visita.id} className="grid grid-cols-2 gap-2 items-center">
                <input
                  type="text"
                  value={visita.sede}
                  onChange={e => setForm(f => ({
                    ...f,
                    visitas: f.visitas.map((item, i) => i === idx ? { ...item, sede: e.target.value } : item),
                  }))}
                  placeholder="Sede / Ciudad"
                  className="bg-white border border-[#D6E3F3] rounded-lg px-3 py-2 text-sm text-slate-800"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={visita.horario}
                    onChange={e => setForm(f => ({
                      ...f,
                      visitas: f.visitas.map((item, i) => i === idx ? { ...item, horario: e.target.value } : item),
                    }))}
                    placeholder="Horario (ej: Lunes 8am–12pm)"
                    className="flex-1 bg-white border border-[#D6E3F3] rounded-lg px-3 py-2 text-sm text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, visitas: f.visitas.filter((_, i) => i !== idx) }))}
                    className="bg-transparent text-slate-500 hover:text-red-400 font-bold text-base leading-none"
                  >×</button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setForm(f => ({
              ...f,
              visitas: [...f.visitas, { id: crypto.randomUUID(), sede: '', horario: '' }],
            }))}
            className="bg-transparent mt-2 w-full text-xs text-[#004A99] border border-dashed border-slate-300 rounded-lg py-2 hover:border-[#004A99] hover:bg-[#E6F0FF] transition-colors"
          >
            + Agregar sede
          </button>
        </div>

        {/* Obligaciones del Cliente */}
        <div className="border border-[#EDF3FA] rounded-xl p-4">
          <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">
            📋 Obligaciones del Cliente
          </label>
          <div className="space-y-2">
            {form.obligacionesCliente.map((oblig, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-[#004A99] text-sm flex-shrink-0">●</span>
                <input
                  type="text"
                  value={oblig}
                  onChange={e => setForm(f => ({
                    ...f,
                    obligacionesCliente: f.obligacionesCliente.map((v, i) => i === idx ? e.target.value : v),
                  }))}
                  className="flex-1 bg-white border border-[#D6E3F3] rounded-lg px-3 py-2 text-sm text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setForm(f => ({
                    ...f,
                    obligacionesCliente: f.obligacionesCliente.filter((_, i) => i !== idx),
                  }))}
                  className="bg-transparent text-slate-500 hover:text-red-400 font-bold text-base leading-none"
                >×</button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setForm(f => ({
              ...f,
              obligacionesCliente: [...f.obligacionesCliente, ''],
            }))}
            className="bg-transparent mt-2 w-full text-xs text-[#004A99] border border-dashed border-slate-300 rounded-lg py-2 hover:border-[#004A99] hover:bg-[#E6F0FF] transition-colors"
          >
            + Agregar obligación
          </button>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#D6E3F3]">
        <button
          onClick={() => setView('list')}
          disabled={saving}
          className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handlePreview}
          disabled={saving}
          className="px-4 py-2 text-sm border border-indigo-600/50 bg-[#E6F0FF] text-[#004A99] hover:bg-indigo-900/50 rounded-lg disabled:opacity-50"
        >
          👁️ Vista Previa
        </button>
        <button
          onClick={handleSaveDraft}
          disabled={saving}
          className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-50"
        >
          {saving ? 'Guardando...' : '💾 Guardar Borrador'}
        </button>
        <button
          onClick={handleGeneratePDF}
          disabled={saving}
          className="px-4 py-2 text-sm bg-[#004A99] hover:bg-[#003366] text-white rounded-lg disabled:opacity-50"
        >
          {saving ? 'Generando...' : '📥 Generar PDF'}
        </button>
      </div>
    </div>
  );
};

export default PropuestasModule;
