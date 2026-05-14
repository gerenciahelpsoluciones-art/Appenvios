import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Clock, Tag, CheckCircle2, XCircle, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { generateId, formatCurrency } from '../../utils/helpers';
import type { Treatment } from '../../types';

const CATEGORIES = ['Preventivo', 'Restauración', 'Cirugía', 'Endodoncia', 'Ortodoncia', 'Prótesis', 'Estética', 'Periodoncia', 'Otro'];

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  description: z.string().optional(),
  duration_minutes: z.coerce.number().min(10, 'Mínimo 10 min'),
  price: z.coerce.number().min(0, 'Precio inválido'),
  category: z.string().min(1, 'Seleccione categoría'),
  active: z.boolean(),
});
type FormData = z.infer<typeof schema>;

function TreatmentModal({ treatment, onClose }: { treatment?: Treatment; onClose: () => void }) {
  const { addTreatment, updateTreatment } = useStore();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: treatment || { active: true, duration_minutes: 30, price: 0, category: 'Preventivo', description: '' },
  });

  const onSubmit = (data: FormData) => {
    if (treatment) updateTreatment(treatment.id, data);
    else addTreatment({ ...data, description: data.description ?? '', id: generateId() });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold">{treatment ? 'Editar Tratamiento' : 'Nuevo Tratamiento'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="label">Nombre *</label>
            <input className="input" {...register('name')} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea className="input resize-none" rows={2} {...register('description')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Categoría *</label>
              <select className="input" {...register('category')}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Duración (min) *</label>
              <input type="number" className="input" {...register('duration_minutes')} />
              {errors.duration_minutes && <p className="text-red-500 text-xs mt-1">{errors.duration_minutes.message}</p>}
            </div>
            <div className="col-span-2">
              <label className="label">Precio (COP) *</label>
              <input type="number" className="input" {...register('price')} />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="active-t" className="w-4 h-4 accent-dental-600" {...register('active')} />
            <label htmlFor="active-t" className="text-sm font-medium text-gray-700">Tratamiento activo</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">{treatment ? 'Guardar' : 'Crear'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  Preventivo: 'bg-green-100 text-green-700',
  Restauración: 'bg-blue-100 text-blue-700',
  Cirugía: 'bg-red-100 text-red-700',
  Endodoncia: 'bg-purple-100 text-purple-700',
  Ortodoncia: 'bg-indigo-100 text-indigo-700',
  Prótesis: 'bg-orange-100 text-orange-700',
  Estética: 'bg-pink-100 text-pink-700',
  Periodoncia: 'bg-teal-100 text-teal-700',
  Otro: 'bg-gray-100 text-gray-700',
};

export default function Treatments() {
  const { treatments, appointments, deleteTreatment } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Treatment | undefined>();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');

  const filtered = useMemo(() =>
    treatments.filter((t) =>
      (t.name.toLowerCase().includes(search.toLowerCase())) &&
      (filterCat ? t.category === filterCat : true)
    ), [treatments, search, filterCat]);

  const openEdit = (t: Treatment) => { setEditing(t); setShowModal(true); };
  const handleDelete = (id: string) => { if (confirm('¿Eliminar tratamiento?')) deleteTreatment(id); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tratamientos</h1>
          <p className="text-gray-500 text-sm">{treatments.filter(t => t.active).length} activos en el catálogo</p>
        </div>
        <button onClick={() => { setEditing(undefined); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nuevo Tratamiento
        </button>
      </div>

      <div className="card p-3 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Buscar tratamiento..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input max-w-[180px]" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          <option value="">Todas las categorías</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((t) => {
          const usageCount = appointments.filter((a) => a.treatment_id === t.id).length;
          return (
            <div key={t.id} className={`card p-4 group hover:shadow-md transition-shadow ${!t.active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[t.category] || 'bg-gray-100 text-gray-600'}`}>
                  {t.category}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(t)} className="p-1 hover:bg-gray-100 rounded"><Edit2 size={13} className="text-gray-500" /></button>
                  <button onClick={() => handleDelete(t.id)} className="p-1 hover:bg-gray-100 rounded"><Trash2 size={13} className="text-red-400" /></button>
                </div>
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{t.name}</h3>
              {t.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{t.description}</p>}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3 text-gray-500">
                  <span className="flex items-center gap-1"><Clock size={13} />{t.duration_minutes} min</span>
                  <span className="flex items-center gap-1"><Tag size={13} />{usageCount}</span>
                </div>
                <p className="font-bold text-dental-700">{formatCurrency(t.price)}</p>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs">
                {t.active
                  ? <><CheckCircle2 size={12} className="text-green-600" /><span className="text-green-600">Activo</span></>
                  : <><XCircle size={12} className="text-gray-400" /><span className="text-gray-400">Inactivo</span></>}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-3 card p-10 text-center text-gray-400">No se encontraron tratamientos</div>
        )}
      </div>

      {showModal && <TreatmentModal treatment={editing} onClose={() => { setShowModal(false); setEditing(undefined); }} />}
    </div>
  );
}
