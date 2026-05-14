import { format, parseISO, isToday, isThisWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Appointment, AppointmentStatus } from '../types';

export const formatDate = (date: string) =>
  format(parseISO(date), "d 'de' MMMM, yyyy", { locale: es });

export const formatDateShort = (date: string) =>
  format(parseISO(date), 'dd/MM/yyyy', { locale: es });

export const formatTime = (time: string) => {
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
};

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);

export const formatDateLong = (date: Date) =>
  format(date, "EEEE d 'de' MMMM", { locale: es });

export const statusLabel: Record<AppointmentStatus, string> = {
  scheduled: 'Programada',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No asistió',
};

export const statusClass: Record<AppointmentStatus, string> = {
  scheduled: 'badge-scheduled',
  confirmed: 'badge-confirmed',
  completed: 'badge-completed',
  cancelled: 'badge-cancelled',
  no_show: 'badge-pending',
};

export const getTodayAppointments = (appointments: Appointment[]) =>
  appointments.filter((a) => isToday(parseISO(a.date)) && a.status !== 'cancelled');

export const getWeekAppointments = (appointments: Appointment[]) =>
  appointments.filter((a) => isThisWeek(parseISO(a.date), { weekStartsOn: 1 }) && a.status !== 'cancelled');

export const getMonthRevenue = (appointments: Appointment[]) => {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  return appointments
    .filter((a) => a.paid && isWithinInterval(parseISO(a.date), { start, end }))
    .reduce((sum, a) => sum + a.amount, 0);
};

export const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);
