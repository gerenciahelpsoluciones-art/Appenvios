import React, { useState } from 'react';
import type { Cliente, Propuesta, PropuestaItem, AppUser, Producto } from '../App';
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
  Borrador: 'bg-indigo-900/30 text-indigo-300',
  Enviada:  'bg-yellow-900/30 text-yellow-300',
  Aceptada: 'bg-green-900/30 text-green-300',
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
    setForm(rest);
    setItemSearches({});
    setView('form');
  };

  const handleClienteChange = (clienteId: string) => {
    const c = clientes.find(cl => cl.id === clienteId);
    setForm(f => ({
      ...f,
      clienteId,
      clienteNombre: c?.nombre || '',
      clienteNit: c?.nit || '',
      clienteCiudad: c?.ciudad || '',
      clienteContacto: c?.contacto || '',
    }));
  };

  const handleServicioChange = (id: string) => {
    const t = SERVICIO_TEMPLATES.find(t => t.id === id);
    setForm(f => ({ ...f, tipoServicioId: id, tipoServicioNombre: t?.nombre || '' }));
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
    if (editTarget) {
      await onUpdate({ ...editTarget, ...payload });
      generatePropuestaPDF({ ...editTarget, ...payload }, 'save');
    } else {
      await onAdd(payload);
      // Use temp object for PDF since we don't have the DB-assigned id/consecutivo yet
      generatePropuestaPDF({ id: 'temp', consecutivo: 'P-???', ...payload }, 'save');
    }
    setSaving(false);
    setView('list');
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
  const fmtCOP = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`;

  // ── PREVIEW MODAL (shared between list and form views) ──────────────────────
  const PreviewModal = () => {
    if (!previewPropuesta) return null;

    const pvSub = previewPropuesta.items.reduce((s, it) => s + it.cantidad * it.valorUnitario, 0);
    const pvIva = previewPropuesta.incluyeIva ? Math.round(pvSub * 0.19) : 0;
    const pvTotal = pvSub + pvIva;
    const visibleItems = previewPropuesta.items.filter(it => it.valorUnitario > 0);

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 rounded-xl border border-slate-700 max-w-lg w-full p-6">
          <h3 className="text-lg font-bold mb-1">
            Vista Previa — {previewPropuesta.consecutivo}
          </h3>
          <p className="text-slate-400 text-sm mb-4">
            {previewPropuesta.clienteNombre} · {previewPropuesta.tipoServicioNombre}
          </p>
          <div className="bg-slate-800 rounded-lg p-4 text-sm text-slate-300 space-y-2 mb-4">
            {visibleItems.length > 0 && (
              <div className="space-y-1 pb-2 border-b border-slate-700">
                {visibleItems.slice(0, 3).map(it => (
                  <div key={it.id} className="flex justify-between text-xs">
                    <span className="text-slate-400 truncate flex-1 mr-2">{it.descripcion || '—'}</span>
                    <span className="text-slate-300 whitespace-nowrap">
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
            <div className="flex justify-between border-t border-slate-700 pt-2">
              <span className="font-bold">Total:</span>
              <span className="font-bold text-indigo-300">{fmtCOP(pvTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Vigencia:</span>
              <span>{previewPropuesta.vigencia}</span>
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
              className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg"
            >
              Cerrar
            </button>
            <button
              onClick={() => {
                generatePropuestaPDF(previewPropuesta, 'save');
                setPreviewPropuesta(null);
              }}
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
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
      <div className="p-4 text-slate-100">
        <PreviewModal />
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">Propuestas Comerciales</h2>
            <span className="bg-indigo-900/40 text-indigo-300 text-xs px-3 py-0.5 rounded-full">
              {propuestas.length} propuestas
            </span>
          </div>
          <button
            onClick={openNew}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Nueva Propuesta
          </button>
        </div>

        <div className="flex gap-3 mb-4 flex-wrap">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Buscar cliente..."
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 w-52"
          />
          <select
            value={servicioFilter}
            onChange={e => setServicioFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300"
          >
            <option value="Todos">Todos los servicios</option>
            {SERVICIO_TEMPLATES.map(t => (
              <option key={t.id} value={t.id}>{t.icono} {t.nombre.split('de ')[1] || t.nombre}</option>
            ))}
          </select>
          <select
            value={estadoFilter}
            onChange={e => setEstadoFilter(e.target.value as EstadoFilter)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300"
          >
            {(['Todos', 'Borrador', 'Enviada', 'Aceptada'] as const).map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        <div className="bg-slate-800/60 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/40">
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
                  <tr key={p.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{p.consecutivo}</td>
                    <td className="px-4 py-3 font-medium">{p.clienteNombre}</td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ background: `${t?.color || '#6366f1'}22`, color: t?.color || '#a5b4fc' }}
                      >
                        {t?.icono} {t ? (t.nombre.split('de ')[1] || t.nombre) : p.tipoServicioNombre}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{p.fecha}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-400">
                      {fmtCOP(rowTotal)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full ${ESTADO_COLORS[p.estado] || ''}`}>
                        {p.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button title="Vista previa" onClick={() => setPreviewPropuesta(p)} className="mx-1 opacity-60 hover:opacity-100">👁️</button>
                      <button title="Descargar PDF" onClick={() => generatePropuestaPDF(p, 'save')} className="mx-1 opacity-60 hover:opacity-100">📥</button>
                      <button title="Editar" onClick={() => openEdit(p)} className="mx-1 opacity-60 hover:opacity-100">✏️</button>
                      <button
                        title="Eliminar"
                        onClick={() => { if (window.confirm(`¿Eliminar ${p.consecutivo}?`)) onDelete(p.id); }}
                        className="mx-1 opacity-60 hover:opacity-100 text-red-400"
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
    <div className="p-4 text-slate-100">
      <PreviewModal />
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setView('list')} className="text-slate-400 hover:text-white text-sm">
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
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-base text-slate-200"
            >
              <option value="">Seleccionar cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            {form.clienteId && (() => {
              const c = clientes.find(cl => cl.id === form.clienteId);
              return (
                <div className="mt-2 bg-slate-800/50 border border-slate-700/60 rounded-lg px-3 py-2 space-y-0.5">
                  {form.clienteNit && (
                    <p className="text-xs text-slate-500">NIT: <span className="text-slate-300">{form.clienteNit}</span></p>
                  )}
                  {form.clienteContacto && (
                    <p className="text-xs text-slate-500">Contacto: <span className="text-slate-300">{form.clienteContacto}</span></p>
                  )}
                  {c?.telefono && (
                    <p className="text-xs text-slate-500">Tel: <span className="text-slate-300">{c.telefono}</span></p>
                  )}
                  {c?.correo && (
                    <p className="text-xs text-slate-500">Email: <span className="text-slate-300">{c.correo}</span></p>
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
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
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
                      ? 'border-indigo-500 bg-indigo-900/30'
                      : 'border-slate-700 bg-slate-800/50 opacity-60 hover:opacity-80'
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
                className="border border-dashed border-slate-600 rounded-lg p-3 text-center opacity-30 cursor-not-allowed"
              >
                <div className="text-xl">➕</div>
                <div className="text-xs text-slate-500 mt-1">Nuevo tipo</div>
              </button>
            </div>
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
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300"
              >
                <option value="COP">COP</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <div className="bg-slate-800/60 rounded-xl border border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/40">
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
                    <tr key={item.id} className="border-b border-slate-700/50 hover:bg-slate-700/10">
                      <td className="px-3 py-2">
                        <div className="relative mb-1.5">
                          <input
                            type="text"
                            value={itemSearches[item.id] || ''}
                            onChange={e => setItemSearches(s => ({ ...s, [item.id]: e.target.value }))}
                            placeholder="Buscar en catálogo..."
                            className="w-full bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-xs text-slate-300 placeholder-slate-500"
                          />
                          {(itemSearches[item.id] || '').length > 1 && (() => {
                            const q = (itemSearches[item.id] || '').toLowerCase();
                            const matches = productos.filter(p =>
                              p.nombre.toLowerCase().includes(q) ||
                              (p.numPart || '').toLowerCase().includes(q)
                            );
                            return (
                              <div className="absolute z-10 w-full mt-0.5 bg-slate-800 border border-slate-700 rounded shadow-xl max-h-40 overflow-y-auto">
                                {matches.slice(0, 6).map(p => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => selectProductoForItem(item.id, p.id)}
                                    className="w-full text-left px-2 py-1.5 hover:bg-slate-700 text-xs border-b border-slate-700/50 last:border-0"
                                  >
                                    <span className="text-slate-200 font-medium">{p.nombre}</span>
                                    {p.numPart && (
                                      <span className="ml-1.5 font-mono text-indigo-400">{p.numPart}</span>
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
                          className="w-full bg-slate-900/50 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                        />
                        {item.numPart && (
                          <span className="text-xs font-mono text-indigo-400 mt-0.5 inline-block">
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
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 text-center"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.valorUnitario || ''}
                          onChange={e => updateItem(item.id, { valorUnitario: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 text-right"
                        />
                      </td>
                      <td className="px-3 py-2 text-right text-emerald-400 font-semibold text-xs">
                        {fmtCOP(item.cantidad * item.valorUnitario)}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-slate-500 hover:text-red-400 text-base font-bold leading-none"
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
              className="mt-2 w-full text-xs text-indigo-400 border border-dashed border-slate-600 rounded-lg py-2 hover:border-indigo-500 hover:bg-indigo-900/10 transition-colors"
            >
              + Agregar ítem
            </button>

            <label className="flex items-center gap-2 mt-3 text-sm text-slate-400 cursor-pointer">
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
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
            />
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">Observaciones adicionales</label>
            <textarea
              value={form.observaciones}
              onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 resize-none"
            />
          </div>
        </div>

        {/* RIGHT: Protocol preview */}
        <div className="border border-indigo-900/40 bg-indigo-950/20 rounded-xl p-4 overflow-y-auto max-h-[520px]">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs uppercase tracking-wider text-indigo-400 font-bold">
              Protocolo incluido automáticamente
            </span>
            {selectedTemplate && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: `${selectedTemplate.color}22`, color: selectedTemplate.color }}
              >
                {selectedTemplate.icono} {selectedTemplate.nombre.split('de ')[1] || selectedTemplate.nombre}
              </span>
            )}
          </div>

          {!selectedTemplate ? (
            <p className="text-slate-500 text-sm">Selecciona un tipo de servicio para ver el protocolo.</p>
          ) : (
            <>
              <p className="font-semibold text-slate-200 mb-2 text-sm">{selectedTemplate.nombre}</p>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">{selectedTemplate.introProtocolo}</p>
              <div className="space-y-2">
                {selectedTemplate.pasosInfografia.map((paso, i) => (
                  <div key={i} className="flex items-start gap-3 bg-slate-800/60 rounded-lg px-3 py-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-700 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                      {i + 1}
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-slate-200">{paso.titulo}</span>
                      <p className="text-xs text-slate-400">{paso.descripcion}</p>
                    </div>
                  </div>
                ))}
                {selectedTemplate.pasosLista.map((paso, i) => (
                  <div key={i} className="flex items-start gap-3 bg-slate-800/60 rounded-lg px-3 py-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-700 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                      {selectedTemplate.pasosInfografia.length + i + 1}
                    </span>
                    <span className="text-xs text-slate-300">{paso}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-700">
                + Infografía visual del procedimiento incluida en el PDF
              </p>
            </>
          )}
        </div>
      </div>

      {/* Footer buttons */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
        <button
          onClick={() => setView('list')}
          disabled={saving}
          className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handlePreview}
          disabled={saving}
          className="px-4 py-2 text-sm border border-indigo-600/50 bg-indigo-900/30 text-indigo-300 hover:bg-indigo-900/50 rounded-lg disabled:opacity-50"
        >
          👁️ Vista Previa
        </button>
        <button
          onClick={handleSaveDraft}
          disabled={saving}
          className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg disabled:opacity-50"
        >
          {saving ? 'Guardando...' : '💾 Guardar Borrador'}
        </button>
        <button
          onClick={handleGeneratePDF}
          disabled={saving}
          className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
        >
          {saving ? 'Generando...' : '📥 Generar PDF'}
        </button>
      </div>
    </div>
  );
};

export default PropuestasModule;
