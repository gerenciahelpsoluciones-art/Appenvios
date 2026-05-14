import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Appointment, Patient, Doctor, Treatment } from '../types';

interface AppState {
  patients: Patient[];
  doctors: Doctor[];
  treatments: Treatment[];
  appointments: Appointment[];
  addPatient: (p: Patient) => void;
  updatePatient: (id: string, p: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  addDoctor: (d: Doctor) => void;
  updateDoctor: (id: string, d: Partial<Doctor>) => void;
  deleteDoctor: (id: string) => void;
  addTreatment: (t: Treatment) => void;
  updateTreatment: (id: string, t: Partial<Treatment>) => void;
  deleteTreatment: (id: string) => void;
  addAppointment: (a: Appointment) => void;
  updateAppointment: (id: string, a: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
}

const SEED_DOCTORS: Doctor[] = [
  { id: 'd1', name: 'Dra. Ana García', specialty: 'Odontología General', phone: '3001234567', email: 'ana@dental.com', color: '#0d9488', active: true, created_at: new Date().toISOString() },
  { id: 'd2', name: 'Dr. Luis Martínez', specialty: 'Ortodoncia', phone: '3009876543', email: 'luis@dental.com', color: '#0284c7', active: true, created_at: new Date().toISOString() },
  { id: 'd3', name: 'Dra. Sofía Torres', specialty: 'Endodoncia', phone: '3005551234', email: 'sofia@dental.com', color: '#7c3aed', active: true, created_at: new Date().toISOString() },
];

const SEED_TREATMENTS: Treatment[] = [
  { id: 't1', name: 'Consulta General', description: 'Revisión y diagnóstico general', duration_minutes: 30, price: 50000, category: 'Preventivo', active: true },
  { id: 't2', name: 'Limpieza Dental', description: 'Profilaxis y detartraje', duration_minutes: 45, price: 80000, category: 'Preventivo', active: true },
  { id: 't3', name: 'Extracción Simple', description: 'Extracción de pieza dental sin complicaciones', duration_minutes: 30, price: 120000, category: 'Cirugía', active: true },
  { id: 't4', name: 'Resina Compuesta', description: 'Restauración con resina de fotopolimerización', duration_minutes: 60, price: 150000, category: 'Restauración', active: true },
  { id: 't5', name: 'Tratamiento de Conducto', description: 'Endodoncia de 1 conducto', duration_minutes: 90, price: 350000, category: 'Endodoncia', active: true },
  { id: 't6', name: 'Corona Porcelana', description: 'Corona en porcelana libre de metal', duration_minutes: 60, price: 600000, category: 'Prótesis', active: true },
  { id: 't7', name: 'Blanqueamiento', description: 'Blanqueamiento dental con luz LED', duration_minutes: 90, price: 280000, category: 'Estética', active: true },
  { id: 't8', name: 'Brackets Metálicos', description: 'Ortodoncia con brackets metálicos', duration_minutes: 60, price: 2500000, category: 'Ortodoncia', active: true },
];

const SEED_PATIENTS: Patient[] = [
  { id: 'p1', full_name: 'María López Herrera', document_id: '1020304050', birth_date: '1990-05-15', gender: 'F', phone: '3101112233', email: 'maria@gmail.com', address: 'Cra 7 #45-12', blood_type: 'O+', allergies: 'Ninguna', notes: '', created_at: new Date().toISOString() },
  { id: 'p2', full_name: 'Carlos Pérez Gómez', document_id: '1030405060', birth_date: '1985-11-20', gender: 'M', phone: '3152223344', email: 'carlos@gmail.com', address: 'Cll 50 #10-30', blood_type: 'A+', allergies: 'Penicilina', notes: 'Paciente ansioso', created_at: new Date().toISOString() },
  { id: 'p3', full_name: 'Valentina Ruiz Díaz', document_id: '1040506070', birth_date: '2000-03-08', gender: 'F', phone: '3183334455', email: 'vale@gmail.com', address: 'Av 19 #80-60', blood_type: 'B+', allergies: 'Ninguna', notes: '', created_at: new Date().toISOString() },
];

const today = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

const SEED_APPOINTMENTS: Appointment[] = [
  { id: 'a1', patient_id: 'p1', doctor_id: 'd1', treatment_id: 't2', date: fmt(today), time: '09:00', status: 'confirmed', notes: '', amount: 80000, paid: false, created_at: new Date().toISOString() },
  { id: 'a2', patient_id: 'p2', doctor_id: 'd1', treatment_id: 't1', date: fmt(today), time: '10:30', status: 'scheduled', notes: 'Primera consulta', amount: 50000, paid: false, created_at: new Date().toISOString() },
  { id: 'a3', patient_id: 'p3', doctor_id: 'd2', treatment_id: 't8', date: fmt(addDays(today, 1)), time: '14:00', status: 'scheduled', notes: '', amount: 2500000, paid: true, created_at: new Date().toISOString() },
  { id: 'a4', patient_id: 'p1', doctor_id: 'd3', treatment_id: 't5', date: fmt(addDays(today, 2)), time: '11:00', status: 'scheduled', notes: 'Dolor persistente', amount: 350000, paid: false, created_at: new Date().toISOString() },
  { id: 'a5', patient_id: 'p2', doctor_id: 'd1', treatment_id: 't4', date: fmt(addDays(today, -1)), time: '09:00', status: 'completed', notes: '', amount: 150000, paid: true, created_at: new Date().toISOString() },
];

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      patients: SEED_PATIENTS,
      doctors: SEED_DOCTORS,
      treatments: SEED_TREATMENTS,
      appointments: SEED_APPOINTMENTS,

      addPatient: (p) => set((s) => ({ patients: [...s.patients, p] })),
      updatePatient: (id, p) => set((s) => ({ patients: s.patients.map((x) => x.id === id ? { ...x, ...p } : x) })),
      deletePatient: (id) => set((s) => ({ patients: s.patients.filter((x) => x.id !== id) })),

      addDoctor: (d) => set((s) => ({ doctors: [...s.doctors, d] })),
      updateDoctor: (id, d) => set((s) => ({ doctors: s.doctors.map((x) => x.id === id ? { ...x, ...d } : x) })),
      deleteDoctor: (id) => set((s) => ({ doctors: s.doctors.filter((x) => x.id !== id) })),

      addTreatment: (t) => set((s) => ({ treatments: [...s.treatments, t] })),
      updateTreatment: (id, t) => set((s) => ({ treatments: s.treatments.map((x) => x.id === id ? { ...x, ...t } : x) })),
      deleteTreatment: (id) => set((s) => ({ treatments: s.treatments.filter((x) => x.id !== id) })),

      addAppointment: (a) => set((s) => ({ appointments: [...s.appointments, a] })),
      updateAppointment: (id, a) => set((s) => ({ appointments: s.appointments.map((x) => x.id === id ? { ...x, ...a } : x) })),
      deleteAppointment: (id) => set((s) => ({ appointments: s.appointments.filter((x) => x.id !== id) })),
    }),
    { name: 'dental-app-store' }
  )
);
