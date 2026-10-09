import React, { useMemo, useState } from 'react';
import { ClipboardPaste, RotateCcw, Plus, Trash2 } from 'lucide-react';
import type { PropuestaSlas, SlaFila } from '../App';
import { slaEstandar } from '../data/servicioTemplates';

interface Props {
  value: PropuestaSlas | null | undefined;
  onChange: (slas: PropuestaSlas | null) => void;
}

type Campo = keyof Omit<SlaFila, 'id'>;

const COLS: { key: Campo; label: string; width: string }[] = [
  { key: 'criticidad', label: 'Criticidad', width: '12%' },
  { key: 'descripcion', label: 'Descripción / tipo de incidente', width: '40%' },
  { key: 'tiempoRespuesta', label: 'T. respuesta', width: '14%' },
  { key: 'tiempoSolucion', label: 'T. solución', width: '14%' },
  { key: 'canal', label: 'Canal', width: '14%' },
];

// Orden en que se reparten las columnas pegadas según cuántas traiga cada fila
const ORDEN_POR_CANTIDAD: Record<number, Campo[]> = {
  1: ['descripcion'],
  2: ['criticidad', 'descripcion'],
  3: ['criticidad', 'tiempoRespuesta', 'tiempoSolucion'],
  4: ['criticidad', 'descripcion', 'tiempoRespuesta', 'tiempoSolucion'],
  5: ['criticidad', 'descripcion', 'tiempoRespuesta', 'tiempoSolucion', 'canal'],
};

const ES_ENCABEZADO = /criticidad|prioridad|severidad|nivel|tiempo|respuesta|soluci[oó]n|descripci[oó]n/i;

/** Convierte una tabla copiada de Word/Excel (columnas separadas por tabulador,
 *  "|" o ";") en filas de SLA. Omite la fila de encabezados si la detecta. */
export const parsearTablaPegada = (texto: string): SlaFila[] => {
  const lineas = texto.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const sep = lineas.some(l => l.includes('\t')) ? '\t' : lineas.some(l => l.includes('|')) ? '|' : ';';
  const filas = lineas
    .map(l => l.split(sep).map(c => c.trim()).filter((c, i, arr) => c || (i > 0 && i < arr.length - 1)))
    .filter(celdas => celdas.length > 0);

  if (filas.length > 1 && filas[0].every(c => !/\d/.test(c)) && filas[0].some(c => ES_ENCABEZADO.test(c))) {
    filas.shift();
  }

  return filas.map(celdas => {
    const fila: SlaFila = { id: crypto.randomUUID(), criticidad: '', descripcion: '', tiempoRespuesta: '', tiempoSolucion: '', canal: '' };
    const n = Math.min(celdas.length, 5);
    ORDEN_POR_CANTIDAD[n].forEach((campo, i) => { fila[campo] = celdas[i]; });
    // Columnas sobrantes se agregan a la descripción para no perder texto
    if (celdas.length > 5) fila.descripcion = [fila.descripcion, ...celdas.slice(5)].filter(Boolean).join(' · ');
    return fila;
  });
};

const inputCls = 'w-full bg-white border border-[#D6E3F3] rounded px-2 py-1 text-xs text-slate-800';

const SlaEditor: React.FC<Props> = ({ value, onChange }) => {
  const [pegando, setPegando] = useState(false);
  const [textoPegado, setTextoPegado] = useState('');

  // Sin SLA propios se muestran (y se editan a partir de) los estándar
  const estandar = useMemo(() => slaEstandar(), []);
  const slas = value && value.filas.length > 0 ? value : null;
  const vista = slas || estandar;
  const esEstandar = !slas;

  const editar = (cambio: Partial<PropuestaSlas>) => onChange({ ...vista, ...cambio });
  const editarFila = (id: string, key: Campo, val: string) =>
    editar({ filas: vista.filas.map(f => (f.id === id ? { ...f, [key]: val } : f)) });

  const previa = useMemo(() => parsearTablaPegada(textoPegado), [textoPegado]);

  const aplicarPegado = () => {
    if (previa.length === 0) return;
    editar({ filas: previa });
    setTextoPegado('');
    setPegando(false);
  };

  return (
    <div className="border border-[#EDF3FA] rounded-xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold">
            ⏱️ Acuerdos de Niveles de Servicio (SLA)
          </label>
          <p className="text-xs text-slate-500 mt-0.5">
            {esEstandar
              ? 'SLA estándar de Help Soluciones. Edítelos o pegue la tabla que pide el cliente.'
              : 'SLA personalizados para esta propuesta.'}
          </p>
        </div>
        <div className="flex gap-2">
          {!esEstandar && (
            <button
              type="button"
              onClick={() => { onChange(null); setPegando(false); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-[#D6E3F3] text-slate-600 hover:bg-slate-50 rounded-lg"
            >
              <RotateCcw size={13} /> Usar estándar
            </button>
          )}
          <button
            type="button"
            onClick={() => setPegando(v => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#004A99] hover:bg-[#003366] text-white rounded-lg"
          >
            <ClipboardPaste size={13} /> Pegar tabla
          </button>
        </div>
      </div>

      {pegando && (
        <div className="mb-3 rounded-lg border border-[#BFD5F2] bg-[#F5F9FF] p-3">
          <p className="text-xs text-slate-600 mb-2">
            Copie la tabla de SLA del documento del cliente (Word, Excel o PDF) y péguela aquí.
            Una fila por línea; columnas en este orden: <b>criticidad, descripción, t. respuesta, t. solución, canal</b>.
          </p>
          <textarea
            autoFocus
            rows={5}
            value={textoPegado}
            onChange={e => setTextoPegado(e.target.value)}
            placeholder={'Crítica\tCaída total del servicio\t15 min\t2 horas\tSitio\nAlta\tUsuario sin acceso a la aplicación\t30 min\t4 horas\tRemoto'}
            className="w-full bg-white border border-[#D6E3F3] rounded-lg px-3 py-2 text-xs text-slate-700 font-mono"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
            <span className="text-xs text-slate-500">
              {textoPegado.trim() ? `${previa.length} nivel(es) detectado(s). Reemplazarán la tabla actual.` : ''}
            </span>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setPegando(false); setTextoPegado(''); }}
                className="px-3 py-1.5 text-xs bg-white border border-[#D6E3F3] text-slate-600 hover:bg-slate-50 rounded-lg">
                Cancelar
              </button>
              <button type="button" onClick={aplicarPegado} disabled={previa.length === 0}
                className="px-3 py-1.5 text-xs bg-[#004A99] hover:bg-[#003366] text-white rounded-lg">
                Usar estos SLA
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-[#D6E3F3] overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#EEF4FC]">
              {COLS.map(c => (
                <th key={c.key} style={{ width: c.width }} className="text-left text-slate-500 font-medium px-2 py-2">{c.label}</th>
              ))}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {vista.filas.map(f => (
              <tr key={f.id} className="border-t border-[#EDF3FA]">
                {COLS.map(c => (
                  <td key={c.key} className="px-1.5 py-1">
                    <input className={inputCls} value={f[c.key]} onChange={e => editarFila(f.id, c.key, e.target.value)} />
                  </td>
                ))}
                <td className="px-1 text-center">
                  <button
                    type="button"
                    title="Quitar fila"
                    onClick={() => editar({ filas: vista.filas.filter(x => x.id !== f.id) })}
                    className="text-slate-400 hover:text-red-500 bg-transparent p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={() => editar({ filas: [...vista.filas, { id: crypto.randomUUID(), criticidad: '', descripcion: '', tiempoRespuesta: '', tiempoSolucion: '', canal: '' }] })}
        className="mt-2 inline-flex items-center gap-1 text-xs text-[#004A99] bg-transparent hover:bg-[#E6F0FF] px-2 py-1 rounded"
      >
        <Plus size={13} /> Agregar nivel
      </button>

      <div className="grid gap-3 mt-4" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
            Documento de referencia del cliente (opcional)
          </label>
          <input
            className="w-full bg-white border border-[#D6E3F3] rounded-lg px-3 py-2 text-xs text-slate-700"
            placeholder="Ej.: Pliego de condiciones, numeral 4.3"
            value={vista.fuente || ''}
            onChange={e => editar({ fuente: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
            Notas de los acuerdos (una por línea)
          </label>
          <textarea
            rows={Math.max(3, vista.notas.length + 1)}
            value={vista.notas.join('\n')}
            onChange={e => editar({ notas: e.target.value.split('\n') })}
            className="w-full bg-white border border-[#D6E3F3] rounded-lg px-3 py-2 text-xs text-slate-700"
          />
        </div>
      </div>
    </div>
  );
};

export default SlaEditor;
