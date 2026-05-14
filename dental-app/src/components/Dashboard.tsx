import { useMemo } from 'react';
import { Calendar, Users, DollarSign, Clock, TrendingUp, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  formatCurrency, formatDateLong, formatTime, statusLabel, statusClass,
  getTodayAppointments, getWeekAppointments, getMonthRevenue,
} from '../utils/helpers';
import { parseISO, isToday } from 'date-fns';

const StatCard = ({ icon: Icon, label, value, color, sub }: {
  icon: React.ElementType; label: string; value: string; color: string; sub?: string;
}) => (
  <div className="card p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

export default function Dashboard() {
  const { appointments, patients, doctors } = useStore();

  const todayList = useMemo(() => getTodayAppointments(appointments), [appointments]);
  const weekCount = useMemo(() => getWeekAppointments(appointments).length, [appointments]);
  const monthRev = useMemo(() => getMonthRevenue(appointments), [appointments]);
  const pending = useMemo(() =>
    appointments.filter((a) => !a.paid && a.status === 'completed').reduce((s, a) => s + a.amount, 0),
    [appointments]);
  const upcoming = useMemo(() =>
    appointments
      .filter((a) => ['scheduled', 'confirmed'].includes(a.status) && !isToday(parseISO(a.date)))
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
      .slice(0, 5),
    [appointments]);

  const { patients: allPatients, doctors: allDoctors, treatments: allTreatments } = useStore();
  const getPatient = (id: string) => allPatients.find((p) => p.id === id);
  const getDoctor = (id: string) => allDoctors.find((d) => d.id === id);
  const getTreatment = (id: string) => allTreatments.find((t) => t.id === id);

  const todayStats = useMemo(() => ({
    completed: todayList.filter((a) => a.status === 'completed').length,
    confirmed: todayList.filter((a) => a.status === 'confirmed').length,
    scheduled: todayList.filter((a) => a.status === 'scheduled').length,
    cancelled: appointments.filter((a) => isToday(parseISO(a.date)) && a.status === 'cancelled').length,
  }), [todayList, appointments]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1 capitalize">{formatDateLong(new Date())}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Calendar} label="Citas Hoy" value={String(todayList.length)} color="bg-dental-600" sub={`${weekCount} esta semana`} />
        <StatCard icon={Users} label="Pacientes" value={String(patients.length)} color="bg-primary-600" sub={`${doctors.filter(d => d.active).length} doctores activos`} />
        <StatCard icon={DollarSign} label="Ingresos Mes" value={formatCurrency(monthRev)} color="bg-green-600" sub="Solo pagadas" />
        <StatCard icon={AlertCircle} label="Por Cobrar" value={formatCurrency(pending)} color="bg-amber-500" sub="Citas completadas" />
      </div>

      {/* Today status bar */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-dental-600" /> Resumen de Hoy
        </h2>
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Clock size={18} className="text-blue-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-blue-700">{todayStats.scheduled}</p>
            <p className="text-xs text-blue-600">Programadas</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <CheckCircle2 size={18} className="text-green-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-green-700">{todayStats.confirmed}</p>
            <p className="text-xs text-green-600">Confirmadas</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <CheckCircle2 size={18} className="text-gray-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-gray-700">{todayStats.completed}</p>
            <p className="text-xs text-gray-500">Completadas</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <XCircle size={18} className="text-red-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-red-600">{todayStats.cancelled}</p>
            <p className="text-xs text-red-500">Canceladas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's appointments */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-dental-600" /> Citas de Hoy
          </h2>
          {todayList.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No hay citas programadas para hoy</p>
          ) : (
            <div className="space-y-3">
              {todayList
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((apt) => {
                  const patient = getPatient(apt.patient_id);
                  const doctor = getDoctor(apt.doctor_id);
                  const treatment = getTreatment(apt.treatment_id);
                  return (
                    <div key={apt.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-l-4" style={{ borderLeftColor: doctor?.color || '#0d9488' }}>
                      <div className="text-center min-w-[48px]">
                        <p className="text-sm font-bold text-gray-900">{formatTime(apt.time)}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{patient?.full_name || '—'}</p>
                        <p className="text-xs text-gray-500 truncate">{treatment?.name} · {doctor?.name}</p>
                      </div>
                      <span className={statusClass[apt.status]}>{statusLabel[apt.status]}</span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Upcoming appointments */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-primary-600" /> Próximas Citas
          </h2>
          {upcoming.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No hay citas próximas</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((apt) => {
                const patient = getPatient(apt.patient_id);
                const doctor = getDoctor(apt.doctor_id);
                const treatment = getTreatment(apt.treatment_id);
                return (
                  <div key={apt.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: doctor?.color || '#0d9488' }}>
                      {patient?.full_name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{patient?.full_name}</p>
                      <p className="text-xs text-gray-500">{treatment?.name} · {apt.date} {formatTime(apt.time)}</p>
                    </div>
                    <span className={statusClass[apt.status]}>{statusLabel[apt.status]}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
