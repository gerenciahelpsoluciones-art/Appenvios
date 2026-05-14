import { useState } from 'react';
import { Plus, Edit2, Trash2, Phone, Mail, Stethoscope, CheckCircle2, XCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { generateId } from '../../utils/helpers';
import type { Doctor } from '../../types';

const COLORS = ['#0d9488', '#0284c7', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#d97706', '#dc2626'];

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  specialty: z.string().min(2, 'Ingrese especialidad'),
  phone: z.string().min(7),
  email: z.string().email('Email inválido').or(z.literal('')),
  color: z.string(),
  active: z.boolean(),
});
type FormData = z.infer<typeof schema>;

function DoctorModal({ doctor, onClose }: { doctor?: Doctor; onClose: () => void }) {
  const { addDoctor, updateDoctor } = useStore();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: doctor || { color: COLORS[0], active: true, email: '' },
  });

  const selectedColor = watch('color');

  const onSubmit = (data: FormData) => {
    if (doctor) updateDoctor(doctor.id, data);
    else addDoctor({ ...data, id: generateId(), created_at: new Date().toISOString() });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold">{doctor ? 'Editar Doctor' : 'Nuevo Doctor'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="label">Nombre completo *</label>
            <input className="input" {...register('name')} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Especialidad *</label>
            <input className="input" placeholder="Ej: Ortodoncia, Endodoncia..." {...register('specialty')} />
            {errors.specialty && <p className="text-red-500 text-xs mt-1">{errors.specialty.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Teléfono *</label>
              <input className="input" {...register('phone')} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" {...register('email')} />
            </div>
          </div>
          <div>
            <label className="label">Color en calendario</label>
            <div className="flex gap-2 flex-wrap mt-1">
              {COLORS.map((c) => (
                <button type="button" key={c} onClick={() => setValue('color', c)}
                  className={`w-8 h-8 rounded-full transition-transform ${selectedColor === c ? 'ring-2 ring-offset-2 ring-gray-500 scale-110' : ''}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="active" className="w-4 h-4 accent-dental-600" {...register('active')} />
            <label htmlFor="active" className="text-sm font-medium text-gray-700">Doctor activo</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">{doctor ? 'Guardar' : 'Registrar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Doctors() {
  const { doctors, appointments, deleteDoctor } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Doctor | undefined>();

  const openEdit = (d: Doctor) => { setEditing(d); setShowModal(true); };
  const handleDelete = (id: string) => { if (confirm('¿Eliminar doctor?')) deleteDoctor(id); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctores</h1>
          <p className="text-gray-500 text-sm">{doctors.filter(d => d.active).length} activos</p>
        </div>
        <button onClick={() => { setEditing(undefined); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nuevo Doctor
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {doctors.map((d) => {
          const aptCount = appointments.filter((a) => a.doctor_id === d.id).length;
          return (
            <div key={d.id} className="card p-5 group hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ background: d.color }}>
                  <Stethoscope size={22} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(d)} className="p-1.5 hover:bg-gray-100 rounded"><Edit2 size={14} className="text-gray-500" /></button>
                  <button onClick={() => handleDelete(d.id)} className="p-1.5 hover:bg-gray-100 rounded"><Trash2 size={14} className="text-red-400" /></button>
                </div>
              </div>
              <h3 className="font-bold text-gray-900">{d.name}</h3>
              <p className="text-sm text-dental-700 font-medium mb-3">{d.specialty}</p>
              <div className="space-y-1.5 text-sm text-gray-600">
                <div className="flex items-center gap-2"><Phone size={13} className="text-gray-400" />{d.phone}</div>
                {d.email && <div className="flex items-center gap-2"><Mail size={13} className="text-gray-400" /><span className="truncate">{d.email}</span></div>}
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <span className="text-xs text-gray-500">{aptCount} citas</span>
                <div className="flex items-center gap-1 text-xs">
                  {d.active
                    ? <><CheckCircle2 size={12} className="text-green-600" /><span className="text-green-600">Activo</span></>
                    : <><XCircle size={12} className="text-gray-400" /><span className="text-gray-400">Inactivo</span></>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && <DoctorModal doctor={editing} onClose={() => { setShowModal(false); setEditing(undefined); }} />}
    </div>
  );
}
