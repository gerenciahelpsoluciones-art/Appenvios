import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { generateId } from '../../utils/helpers';
import type { Patient } from '../../types';

const schema = z.object({
  full_name: z.string().min(2, 'Mínimo 2 caracteres'),
  document_id: z.string().min(5, 'Documento inválido'),
  birth_date: z.string().min(1, 'Ingrese fecha de nacimiento'),
  gender: z.enum(['M', 'F', 'otro']),
  phone: z.string().min(7, 'Teléfono inválido'),
  email: z.string().email('Email inválido').or(z.literal('')),
  address: z.string().optional(),
  blood_type: z.string().optional(),
  allergies: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props { patient?: Patient; onClose: () => void; }

export default function PatientModal({ patient, onClose }: Props) {
  const { addPatient, updatePatient } = useStore();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: patient || { gender: 'F', blood_type: '', allergies: '', notes: '', address: '', email: '' },
  });

  const onSubmit = (data: FormData) => {
    if (patient) {
      updatePatient(patient.id, data);
    } else {
      addPatient({ ...data, id: generateId(), created_at: new Date().toISOString() } as Patient);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-900">{patient ? 'Editar Paciente' : 'Nuevo Paciente'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <p className="text-xs font-semibold text-dental-700 uppercase tracking-wider">Datos Personales</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Nombre Completo *</label>
              <input className="input" placeholder="Nombres y apellidos" {...register('full_name')} />
              {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
            </div>
            <div>
              <label className="label">Documento *</label>
              <input className="input" placeholder="CC / TI / NIT" {...register('document_id')} />
              {errors.document_id && <p className="text-red-500 text-xs mt-1">{errors.document_id.message}</p>}
            </div>
            <div>
              <label className="label">Género *</label>
              <select className="input" {...register('gender')}>
                <option value="F">Femenino</option>
                <option value="M">Masculino</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="label">Fecha de Nacimiento *</label>
              <input type="date" className="input" {...register('birth_date')} />
              {errors.birth_date && <p className="text-red-500 text-xs mt-1">{errors.birth_date.message}</p>}
            </div>
            <div>
              <label className="label">Grupo Sanguíneo</label>
              <select className="input" {...register('blood_type')}>
                <option value="">Desconocido</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-xs font-semibold text-dental-700 uppercase tracking-wider pt-2">Contacto</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Teléfono *</label>
              <input className="input" placeholder="3XXXXXXXXX" {...register('phone')} />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="correo@email.com" {...register('email')} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div className="col-span-2">
              <label className="label">Dirección</label>
              <input className="input" placeholder="Cra / Cll..." {...register('address')} />
            </div>
          </div>

          <p className="text-xs font-semibold text-dental-700 uppercase tracking-wider pt-2">Información Médica</p>
          <div className="space-y-3">
            <div>
              <label className="label">Alergias</label>
              <input className="input" placeholder="Medicamentos, materiales..." {...register('allergies')} />
            </div>
            <div>
              <label className="label">Notas</label>
              <textarea className="input resize-none" rows={2} placeholder="Observaciones del paciente..." {...register('notes')} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">{patient ? 'Guardar' : 'Registrar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
