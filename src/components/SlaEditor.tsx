import React, { useMemo, useRef, useState } from 'react';
import { FileUp, RotateCcw, Plus, Trash2, Loader2 } from 'lucide-react';
import type { PropuestaSlas, SlaFila } from '../App';
import { slaEstandar } from '../data/servicioTemplates';
import { extraerSlasDeRfp, RFP_ACCEPT } from '../services/slaExtractor';

interface Props {
  value: PropuestaSlas | null | undefined;
  onChange: (slas: PropuestaSlas | null) => void;
}

const COLS: { key: keyof Omit<SlaFila, 'id'>; label: string; width: string }[] = [
  { key: 'criticidad', label: 'Criticidad', width: '12%' },
  { key: 'descripcion', label: 'Descripción / tipo de incidente', width: '40%' },
  { key: 'tiempoRespuesta', label: 'T. respuesta', width: '14%' },
  { key: 'tiempoSolucion', label: 'T. solución', width: '14%' },
  { key: 'canal', label: 'Canal', width: '14%' },
];

const inputCls = 'w-full bg-white border border-[#D6E3F3] rounded px-2 py-1 text-xs text-slate-800';

const SlaEditor: React.FC<Props> = ({ value, onChange }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importando, setImportando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  // Sin SLA propios se muestran (y se editan a partir de) los estándar
  const estandar = useMemo(() => slaEstandar(), []);
  const slas = value && value.filas.length > 0 ? value : null;
  const vista = slas || estandar;
  const esEstandar = !slas;

  const editar = (cambio: Partial<PropuestaSlas>) => onChange({ ...vista, ...cambio });
  const editarFila = (id: string, key: keyof SlaFila, val: string) =>
    editar({ filas: vista.filas.map(f => (f.id === id ? { ...f, [key]: val } : f)) });

  const importar = async (file: File) => {
    setImportando(true);
    setMensaje(null);
    try {
      const resultado = await extraerSlasDeRfp(file);
      if (resultado.filas.length === 0) {
        setMensaje({ tipo: 'error', texto: `No se encontraron SLA en "${file.name}". ${resultado.notas[0] || ''}`.trim() });
      } else {
        onChange(resultado);
        setMensaje({ tipo: 'ok', texto: `Se importaron ${resultado.filas.length} niveles de servicio de "${file.name}". Revíselos antes de guardar.` });
      }
    } catch (e) {
      setMensaje({ tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudo importar el documento.' });
    } finally {
      setImportando(false);
      if (fileRef.current) fileRef.current.value = '';
    }
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
              ? 'Usando los SLA estándar de Help Soluciones. Importe el RFP del cliente para usar los suyos.'
              : vista.fuente ? `SLA del cliente · ${vista.fuente}` : 'SLA personalizados para esta propuesta.'}
          </p>
        </div>
        <div className="flex gap-2">
          {!esEstandar && (
            <button
              type="button"
              onClick={() => { onChange(null); setMensaje(null); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-[#D6E3F3] text-slate-600 hover:bg-slate-50 rounded-lg"
            >
              <RotateCcw size={13} /> Usar estándar
            </button>
          )}
          <button
            type="button"
            disabled={importando}
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#004A99] hover:bg-[#003366] text-white rounded-lg"
          >
            {importando ? <Loader2 size={13} className="spin" /> : <FileUp size={13} />}
            {importando ? 'Analizando documento…' : 'Importar desde RFP'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept={RFP_ACCEPT}
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) importar(f); }}
          />
        </div>
      </div>

      {mensaje && (
        <div className={`text-xs rounded-lg px-3 py-2 mb-3 ${mensaje.tipo === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
          {mensaje.texto}
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

      <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mt-4 mb-1.5">
        Notas de los acuerdos (una por línea)
      </label>
      <textarea
        rows={Math.max(3, vista.notas.length + 1)}
        value={vista.notas.join('\n')}
        onChange={e => editar({ notas: e.target.value.split('\n') })}
        className="w-full bg-white border border-[#D6E3F3] rounded-lg px-3 py-2 text-xs text-slate-700"
      />
    </div>
  );
};

export default SlaEditor;
