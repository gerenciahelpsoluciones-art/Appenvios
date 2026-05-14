import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { generateId } from '../../utils/helpers';
import type { Appointment } from '../../types';

const schema = z.object({
  patient_id: z.string().min(1, 'Seleccione un paciente'),
  doctor_id: z.string().min(1, 'Seleccione un doctor'),
  treatment_id: z.string().min(1, 'Seleccione un tratamiento'),
  date: z.string().min(1, 'Ingrese la fecha'),
  time: z.string().min(1, 'Ingrese la hora'),
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']),
  notes: z.string().optional(),
  amount: z.coerce.number().min(0),
  paid: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  appointment?: Appointment;
  defaultDate?: string;
  onClose: () => void;
}

export default function AppointmentModal({ appointment, defaultDate, onClose }: Props) {
  const { patients, doctors, treatments, addAppointment, updateAppointment } = useStore();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: appointment
      ? { ...appointment }
      : { date: defaultDate || new Date().toISOString().split('T')[0], time: '09:00', status: 'scheduled', paid: false, amount: 0, notes: '' },
  });

  const treatmentId = watch('treatment_id');
  useEffect(() => {
    const t = treatments.find((t) => t.id === treatmentId);
    if (t) setValue('amount', t.price);
  }, [treatmentId, treatments, setValue]);

  const onSubmit = (data: FormData) => {
    if (appointment) {
      updateAppointment(appointment.id, data);
    } else {
      addAppointment({ ...data, id: generateId(), created_at: new Date().toISOString() } as Appointment);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-900">
            {appointment ? 'Editar Cita' : 'Nueva Cita'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Paciente *</label>
              <select className="input" {...register('patient_id')}>
                <option value="">Seleccionar paciente...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
              {errors.patient_id && <p className="text-red-500 text-xs mt-1">{errors.patient_id.message}</p>}
            </div>

            <div>
              <label className="label">Doctor *</label>
              <select className="input" {...register('doctor_id')}>
                <option value="">Seleccionar doctor...</option>
                {doctors.filter((d) => d.active).map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              {errors.doctor_id && <p className="text-red-500 text-xs mt-1">{errors.doctor_id.message}</p>}
            </div>

            <div>
              <label className="label">Tratamiento *</label>
              <select className="input" {...register('treatment_id')}>
                <option value="">Seleccionar tratamiento...</option>
                {treatments.filter((t) => t.active).map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {errors.treatment_id && <p className="text-red-500 text-xs mt-1">{errors.treatment_id.message}</p>}
            </div>

            <div>
              <label className="label">Fecha *</label>
              <input type="date" className="input" {...register('date')} />
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
            </div>

            <div>
              <label className="label">Hora *</label>
              <input type="time" className="input" {...register('time')} />
              {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time.message}</p>}
            </div>

            <div>
              <label className="label">Estado</label>
              <select className="input" {...register('status')}>
                <option value="scheduled">Programada</option>
                <option value="confirmed">Confirmada</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Cancelada</option>
                <option value="no_show">No asistió</option>
              </select>
            </div>

            <div>
              <label className="label">Valor (COP)</label>
              <input type="number" className="input" {...register('amount')} />
            </div>

            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" id="paid" className="w-4 h-4 accent-dental-600" {...register('paid')} />
              <label htmlFor="paid" className="text-sm font-medium text-gray-700">Pago recibido</label>
            </div>

            <div className="col-span-2">
              <label className="label">Notas</label>
              <textarea className="input resize-none" rows={3} placeholder="Observaciones adicionales..." {...register('notes')} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">
              {appointment ? 'Guardar Cambios' : 'Crear Cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
