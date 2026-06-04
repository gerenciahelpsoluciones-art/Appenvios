import React, { useState } from 'react';
import type { Cliente, Propuesta, AppUser, Producto } from '../App';
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

const makeEmpty = (currentUser: AppUser): Omit<Propuesta, 'id' | 'consecutivo'> => ({
  fecha: new Date().toISOString().split('T')[0],
  clienteId: '', clienteNombre: '', clienteNit: '', clienteCiudad: '', clienteContacto: '',
  tipoServicioId: '', tipoServicioNombre: '',
  moneda: 'COP', valor: 0, cantidad: 1, productoId: '', productoNombre: '', numPart: '', incluyeIva: false,
  vigencia: '30 días', observaciones: '',
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
  const [productoSearch, setProductoSearch] = useState('');
  const [search, setSearch] = useState('');
  const [servicioFilter, setServicioFilter] = useState('Todos');
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('Todos');
  const [previewPropuesta, setPreviewPropuesta] = useState<Propuesta | null>(null);

  const openNew = () => {
    setEditTarget(null);
    setForm(makeEmpty(currentUser));
    setView('form');
  };

  const openEdit = (p: Propuesta) => {
    setEditTarget(p);
    const { id: _id, consecutivo: _c, ...rest } = p;
    setForm(rest);
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

  const handleProductoSelect = (productoId: string) => {
    const p = productos.find(p => p.id === productoId);
    if (!p) return;
    setForm(f => ({
      ...f,
      productoId: p.id,
      productoNombre: p.nombre,
      numPart: p.numPart || '',
      valor: p.precioCompra || f.valor,
      moneda: p.moneda || f.moneda,
    }));
    setProductoSearch('');
  };

  const validate = (): boolean => {
    if (!form.clienteId) { alert('Selecciona un cliente.'); return false; }
    if (!form.tipoServicioId) { alert('Selecciona un tipo de servicio.'); return false; }
    if (!form.valor || form.valor <= 0) { alert('Ingresa el valor de la propuesta.'); return false; }
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
  const cantidad = form.cantidad || 1;
  const subtotalForm = form.valor * cantidad;
  const iva = form.incluyeIva ? Math.round(subtotalForm * 0.19) : 0;
  const total = subtotalForm + iva;
  const fmtCOP = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`;

  // ── PREVIEW MODAL (shared between list and form views) ──────────────────────
  const PreviewModal = () => {
    if (!previewPropuesta) return null;
    const pvTotal = previewPropuesta.valor + (previewPropuesta.incluyeIva ? Math.round(previewPropuesta.valor * 0.19) : 0);
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
            <div className="flex justify-between">
              <span className="text-slate-500">Valor:</span>
              <span className="font-semibold">{fmtCOP(previewPropuesta.valor)}</span>
            </div>
            {previewPropuesta.incluyeIva && (
              <div className="flex justify-between">
                <span className="text-slate-500">IVA (19%):</span>
                <span>{fmtCOP(Math.round(previewPropuesta.valor * 0.19))}</span>
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
              <span className={`text-xs px-2 py-0.5 rounded-full ${ESTADO_COLORS[previewPropuesta.estado]}`}>
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
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
            >
              <option value="">Seleccionar cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            {form.clienteId && (
              <p className="text-xs text-slate-500 mt-1">
                {[form.clienteNit && `NIT: ${form.clienteNit}`, form.clienteContacto].filter(Boolean).join(' · ')}
              </p>
            )}
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
            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">Tipo de Servicio *</label>
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

          {/* Producto del catálogo */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">Producto del Catálogo</label>
            <div className="relative">
              <input
                type="text"
                value={productoSearch}
                onChange={e => setProductoSearch(e.target.value)}
                placeholder="Buscar por nombre o referencia..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
              />
              {productoSearch.length > 1 && (
                <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {productos
                    .filter(p =>
                      p.nombre.toLowerCase().includes(productoSearch.toLowerCase()) ||
                      p.numPart?.toLowerCase().includes(productoSearch.toLowerCase())
                    )
                    .slice(0, 8)
                    .map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleProductoSelect(p.id)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-700 text-sm border-b border-slate-700/50 last:border-0"
                      >
                        <span className="text-slate-200 font-medium">{p.nombre}</span>
                        {p.numPart && <span className="ml-2 text-xs text-indigo-400 font-mono">{p.numPart}</span>}
                        <span className="ml-2 text-xs text-slate-500">{p.moneda === 'USD' ? `USD ${p.precioCompra}` : `$${p.precioCompra.toLocaleString('es-CO')}`}</span>
                      </button>
                    ))}
                  {productos.filter(p =>
                    p.nombre.toLowerCase().includes(productoSearch.toLowerCase()) ||
                    p.numPart?.toLowerCase().includes(productoSearch.toLowerCase())
                  ).length === 0 && (
                    <p className="px-3 py-2 text-xs text-slate-500">Sin resultados</p>
                  )}
                </div>
              )}
            </div>
            {form.productoId && (
              <div className="mt-1.5 flex items-center gap-2 bg-indigo-900/20 border border-indigo-800/40 rounded-lg px-3 py-1.5">
                <span className="text-xs text-slate-300 flex-1">
                  <span className="font-semibold">{form.productoNombre}</span>
                  {form.numPart && <span className="ml-2 font-mono text-indigo-400">{form.numPart}</span>}
                </span>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, productoId: '', productoNombre: '', numPart: '' }))}
                  className="text-slate-500 hover:text-red-400 text-xs"
                >✕</button>
              </div>
            )}
          </div>

          {/* Valor */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">Valor de la Propuesta *</label>
            <div className="flex gap-2">
              <select
                value={form.moneda}
                onChange={e => setForm(f => ({ ...f, moneda: e.target.value as 'COP' | 'USD' }))}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-200 w-20"
              >
                <option value="COP">COP</option>
                <option value="USD">USD</option>
              </select>
              <input
                type="number"
                value={form.valor || ''}
                onChange={e => setForm(f => ({ ...f, valor: Number(e.target.value) }))}
                placeholder="0"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
              />
              <input
                type="number"
                min="1"
                value={form.cantidad || 1}
                onChange={e => setForm(f => ({ ...f, cantidad: Number(e.target.value) }))}
                title="Cantidad"
                className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 text-center"
              />
            </div>
            <div className="flex gap-4 mt-1">
              <span className="text-xs text-slate-600">Valor unit.</span>
              <span className="text-xs text-slate-600">Cantidad</span>
            </div>
            <label className="flex items-center gap-2 mt-2 text-sm text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={form.incluyeIva}
                onChange={e => setForm(f => ({ ...f, incluyeIva: e.target.checked }))}
              />
              Incluir IVA (19%)
            </label>
            {form.valor > 0 && (
              <p className="text-xs text-slate-500 mt-1">
                {cantidad > 1 && <span>{fmtCOP(form.valor)} × {cantidad} = <span className="text-slate-300">{fmtCOP(subtotalForm)}</span> · </span>}
                Total: <span className="text-emerald-400 font-semibold">{fmtCOP(total)}</span>
                {form.incluyeIva && ` (IVA: ${fmtCOP(iva)})`}
              </p>
            )}
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
