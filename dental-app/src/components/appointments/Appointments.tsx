import { useState, useMemo } from 'react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek,
  isSameMonth, isToday, parseISO, isSameDay, addMonths, subMonths, addDays, subDays,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Calendar, List, Clock, Trash2, Edit2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { statusClass, statusLabel, formatTime, formatCurrency } from '../../utils/helpers';
import AppointmentModal from './AppointmentModal';
import type { Appointment } from '../../types';

type View = 'month' | 'week' | 'list';

export default function Appointments() {
  const { appointments, patients, doctors, treatments, deleteAppointment } = useStore();
  const [view, setView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingApt, setEditingApt] = useState<Appointment | undefined>();

  const getPatient = (id: string) => patients.find((p) => p.id === id);
  const getDoctor = (id: string) => doctors.find((d) => d.id === id);
  const getTreatment = (id: string) => treatments.find((t) => t.id === id);

  const getAptsByDate = (date: Date) =>
    appointments.filter((a) => isSameDay(parseISO(a.date), date)).sort((a, b) => a.time.localeCompare(b.time));

  /* ---------- MONTH VIEW ---------- */
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  /* ---------- WEEK VIEW ---------- */
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const navigate = (dir: 1 | -1) => {
    if (view === 'month') setCurrentDate(dir === 1 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    else setCurrentDate(dir === 1 ? addDays(currentDate, 7) : subDays(currentDate, 7));
  };

  const openNew = (date?: string) => {
    setEditingApt(undefined);
    setSelectedDate(date || null);
    setShowModal(true);
  };

  const openEdit = (apt: Appointment) => {
    setEditingApt(apt);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar esta cita?')) deleteAppointment(id);
  };

  const AptChip = ({ apt }: { apt: Appointment }) => {
    const doc = getDoctor(apt.doctor_id);
    const pat = getPatient(apt.patient_id);
    return (
      <div
        className="text-xs px-1.5 py-0.5 rounded text-white truncate cursor-pointer hover:opacity-90"
        style={{ background: doc?.color || '#0d9488' }}
        onClick={(e) => { e.stopPropagation(); openEdit(apt); }}
        title={`${pat?.full_name} — ${formatTime(apt.time)}`}
      >
        {formatTime(apt.time)} {pat?.full_name.split(' ')[0]}
      </div>
    );
  };

  const AptCard = ({ apt }: { apt: Appointment }) => {
    const pat = getPatient(apt.patient_id);
    const doc = getDoctor(apt.doctor_id);
    const treat = getTreatment(apt.treatment_id);
    return (
      <div className="card p-4 flex items-center gap-3 group hover:shadow-md transition-shadow">
        <div className="w-1 self-stretch rounded-full" style={{ background: doc?.color || '#0d9488' }} />
        <div className="w-12 text-center">
          <p className="text-sm font-bold text-gray-900">{formatTime(apt.time)}</p>
          <p className="text-xs text-gray-400">{apt.date.slice(5)}</p>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{pat?.full_name}</p>
          <p className="text-xs text-gray-500">{treat?.name} · {doc?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={statusClass[apt.status]}>{statusLabel[apt.status]}</span>
          <p className="text-sm font-medium text-gray-700 hidden sm:block">{formatCurrency(apt.amount)}</p>
          <button onClick={() => openEdit(apt)} className="p-1.5 text-gray-400 hover:text-dental-600 opacity-0 group-hover:opacity-100 transition-all">
            <Edit2 size={14} />
          </button>
          <button onClick={() => handleDelete(apt.id)} className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  };

  const headerTitle = view === 'month'
    ? format(currentDate, 'MMMM yyyy', { locale: es })
    : `${format(weekDays[0], "d MMM", { locale: es })} – ${format(weekDays[6], "d MMM yyyy", { locale: es })}`;

  const listApts = useMemo(() =>
    [...appointments].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
    [appointments]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Citas</h1>
          <p className="text-gray-500 text-sm">{appointments.filter(a => a.status !== 'cancelled').length} citas activas</p>
        </div>
        <button onClick={() => openNew()} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nueva Cita
        </button>
      </div>

      {/* Toolbar */}
      <div className="card p-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={18} /></button>
          <button onClick={() => setCurrentDate(new Date())} className="text-sm font-medium text-dental-700 hover:underline px-2">Hoy</button>
          <button onClick={() => navigate(1)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight size={18} /></button>
          <span className="text-base font-semibold text-gray-800 capitalize ml-2">{headerTitle}</span>
        </div>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {(['month', 'week', 'list'] as View[]).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 transition-colors ${view === v ? 'bg-dental-600 text-white' : 'hover:bg-gray-50 text-gray-600'}`}>
              {v === 'month' && <Calendar size={14} />}
              {v === 'week' && <Clock size={14} />}
              {v === 'list' && <List size={14} />}
              {v === 'month' ? 'Mes' : v === 'week' ? 'Semana' : 'Lista'}
            </button>
          ))}
        </div>
      </div>

      {/* Month View */}
      {view === 'month' && (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-7 border-b">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-500 py-3">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map((day, i) => {
              const apts = getAptsByDate(day);
              const inMonth = isSameMonth(day, currentDate);
              const todayClass = isToday(day);
              return (
                <div key={i}
                  onClick={() => openNew(format(day, 'yyyy-MM-dd'))}
                  className={`min-h-[90px] p-1.5 border-b border-r cursor-pointer transition-colors hover:bg-dental-50
                    ${!inMonth ? 'bg-gray-50/60' : ''} ${i % 7 === 0 ? '' : ''}`}>
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1
                    ${todayClass ? 'bg-dental-600 text-white' : inMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {apts.slice(0, 3).map((a) => <AptChip key={a.id} apt={a} />)}
                    {apts.length > 3 && (
                      <p className="text-xs text-gray-400 pl-1">+{apts.length - 3} más</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {view === 'week' && (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-7 border-b">
            {weekDays.map((day) => (
              <div key={day.toISOString()} className={`p-3 text-center border-r last:border-r-0 ${isToday(day) ? 'bg-dental-50' : ''}`}>
                <p className="text-xs text-gray-500 font-medium capitalize">{format(day, 'EEE', { locale: es })}</p>
                <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold mx-auto mt-1
                  ${isToday(day) ? 'bg-dental-600 text-white' : 'text-gray-800'}`}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 min-h-[300px]">
            {weekDays.map((day) => {
              const apts = getAptsByDate(day);
              return (
                <div key={day.toISOString()} className={`p-2 border-r last:border-r-0 space-y-1.5 cursor-pointer hover:bg-gray-50 ${isToday(day) ? 'bg-dental-50/40' : ''}`}
                  onClick={() => openNew(format(day, 'yyyy-MM-dd'))}>
                  {apts.map((a) => {
                    const doc = getDoctor(a.doctor_id);
                    const pat = getPatient(a.patient_id);
                    const treat = getTreatment(a.treatment_id);
                    return (
                      <div key={a.id} className="rounded-lg p-2 text-white text-xs cursor-pointer hover:opacity-90"
                        style={{ background: doc?.color || '#0d9488' }}
                        onClick={(e) => { e.stopPropagation(); openEdit(a); }}>
                        <p className="font-semibold">{formatTime(a.time)}</p>
                        <p className="truncate">{pat?.full_name.split(' ')[0]}</p>
                        <p className="truncate opacity-80">{treat?.name}</p>
                      </div>
                    );
                  })}
                  {apts.length === 0 && (
                    <div className="h-full flex items-center justify-center">
                      <Plus size={14} className="text-gray-300" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="space-y-2">
          {listApts.length === 0 ? (
            <div className="card p-10 text-center text-gray-400">No hay citas registradas</div>
          ) : (
            listApts.map((a) => <AptCard key={a.id} apt={a} />)
          )}
        </div>
      )}

      {showModal && (
        <AppointmentModal
          appointment={editingApt}
          defaultDate={selectedDate || undefined}
          onClose={() => { setShowModal(false); setEditingApt(undefined); setSelectedDate(null); }}
        />
      )}
    </div>
  );
}
