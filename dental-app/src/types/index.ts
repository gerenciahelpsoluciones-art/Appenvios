export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export type Gender = 'M' | 'F' | 'otro';

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  email: string;
  color: string;
  active: boolean;
  created_at: string;
}

export interface Patient {
  id: string;
  full_name: string;
  document_id: string;
  birth_date: string;
  gender: Gender;
  phone: string;
  email: string;
  address: string;
  blood_type: string;
  allergies: string;
  notes: string;
  created_at: string;
}

export interface Treatment {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  category: string;
  active: boolean;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  treatment_id: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes: string;
  amount: number;
  paid: boolean;
  created_at: string;
  patient?: Patient;
  doctor?: Doctor;
  treatment?: Treatment;
}

export interface DashboardStats {
  todayAppointments: number;
  weekAppointments: number;
  totalPatients: number;
  monthRevenue: number;
  pendingPayments: number;
  cancelledToday: number;
}
