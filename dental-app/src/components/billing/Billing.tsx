import { useState, useMemo } from 'react';
import { DollarSign, CheckCircle2, Clock, TrendingUp, Search, CreditCard } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { formatCurrency, formatDateShort, formatTime, statusLabel, statusClass } from '../../utils/helpers';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

type Filter = 'all' | 'unpaid' | 'paid';

export default function Billing() {
  const { appointments, patients, doctors, treatments, updateAppointment } = useStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const getPatient = (id: string) => patients.find((p) => p.id === id);
  const getDoctor = (id: string) => doctors.find((d) => d.id === id);
  const getTreatment = (id: string) => treatments.find((t) => t.id === id);

  const completedApts = useMemo(() =>
    appointments.filter((a) => a.status === 'completed' || a.status === 'confirmed' || a.status === 'scheduled'),
    [appointments]);

  const filtered = useMemo(() =>
    completedApts.filter((a) => {
      const pat = getPatient(a.patient_id);
      const matchSearch = !search || pat?.full_name.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'all' || (filter === 'paid' && a.paid) || (filter === 'unpaid' && !a.paid);
      return matchSearch && matchFilter;
    }).sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)),
    [completedApts, filter, search, patients]);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const stats = useMemo(() => {
    const monthApts = appointments.filter((a) => isWithinInterval(parseISO(a.date), { start: monthStart, end: monthEnd }));
    const totalRevenue = monthApts.filter((a) => a.paid).reduce((s, a) => s + a.amount, 0);
    const pending = completedApts.filter((a) => !a.paid).reduce((s, a) => s + a.amount, 0);
    const totalMonth = monthApts.reduce((s, a) => s + a.amount, 0);
    return { totalRevenue, pending, totalMonth, paidCount: monthApts.filter(a => a.paid).length };
  }, [appointments, completedApts]);

  const handleTogglePaid = (id: string, paid: boolean) => {
    updateAppointment(id, { paid: !paid });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
        <p className="text-gray-500 text-sm">Gestión de cobros y pagos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <DollarSign size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Cobrado este mes</p>
            <p className="font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <Clock size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Por cobrar</p>
            <p className="font-bold text-gray-900">{formatCurrency(stats.pending)}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <TrendingUp size={20} className="text-primary-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total facturado</p>
            <p className="font-bold text-gray-900">{formatCurrency(stats.totalMonth)}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-dental-100 rounded-lg flex items-center justify-center">
            <CreditCard size={20} className="text-dental-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Citas pagadas</p>
            <p className="font-bold text-gray-900">{stats.paidCount}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-3 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Buscar paciente..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {(['all', 'unpaid', 'paid'] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${filter === f ? 'bg-dental-600 text-white' : 'hover:bg-gray-50 text-gray-600'}`}>
              {f === 'all' ? 'Todos' : f === 'paid' ? 'Pagados' : 'Pendientes'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Paciente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tratamiento</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Valor</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Pago</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Sin registros</td></tr>
              ) : filtered.map((a) => {
                const pat = getPatient(a.patient_id);
                const doc = getDoctor(a.doctor_id);
                const treat = getTreatment(a.treatment_id);
                return (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{pat?.full_name || '—'}</p>
                      <p className="text-xs text-gray-400">{doc?.name}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{treat?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDateShort(a.date)} {formatTime(a.time)}</td>
                    <td className="px-4 py-3"><span className={statusClass[a.status]}>{statusLabel[a.status]}</span></td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(a.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleTogglePaid(a.id, a.paid)}
                        className={`flex items-center gap-1 mx-auto text-xs font-medium px-2 py-1 rounded-full transition-colors ${a.paid ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}>
                        {a.paid ? <><CheckCircle2 size={12} />Pagado</> : <><Clock size={12} />Pendiente</>}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
