import { useState, useMemo } from 'react';
import { Search, Plus, UserCircle, Phone, Mail, Edit2, Trash2, Calendar, ChevronRight } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { formatDateShort, formatCurrency, statusLabel, statusClass } from '../../utils/helpers';
import { differenceInYears, parseISO } from 'date-fns';
import PatientModal from './PatientModal';
import type { Patient } from '../../types';

export default function Patients() {
  const { patients, appointments, treatments, doctors, deletePatient } = useStore();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | undefined>();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const filtered = useMemo(() =>
    patients.filter((p) =>
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.document_id.includes(search) ||
      p.phone.includes(search)
    ), [patients, search]);

  const patientApts = useMemo(() =>
    selectedPatient
      ? appointments.filter((a) => a.patient_id === selectedPatient.id)
          .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
      : [], [selectedPatient, appointments]);

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar paciente? Se eliminarán sus citas asociadas.')) deletePatient(id);
  };

  const openEdit = (p: Patient) => { setEditingPatient(p); setShowModal(true); };

  if (selectedPatient) {
    const age = differenceInYears(new Date(), parseISO(selectedPatient.birth_date));
    const totalSpent = patientApts.filter((a) => a.paid).reduce((s, a) => s + a.amount, 0);
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedPatient(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
            <ChevronRight size={18} className="rotate-180" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Ficha del Paciente</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Patient card */}
          <div className="card p-5 space-y-4">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-dental-100 flex items-center justify-center mx-auto mb-3">
                <UserCircle size={48} className="text-dental-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">{selectedPatient.full_name}</h2>
              <p className="text-gray-500 text-sm">{age} años · {selectedPatient.gender === 'F' ? 'Femenino' : selectedPatient.gender === 'M' ? 'Masculino' : 'Otro'}</p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={14} className="text-dental-600" />
                <span>{selectedPatient.phone}</span>
              </div>
              {selectedPatient.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={14} className="text-dental-600" />
                  <span className="truncate">{selectedPatient.email}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Documento</span><span className="font-medium">{selectedPatient.document_id}</span></div>
              {selectedPatient.blood_type && <div className="flex justify-between"><span className="text-gray-500">Grupo sanguíneo</span><span className="font-medium text-red-600">{selectedPatient.blood_type}</span></div>}
              {selectedPatient.allergies && <div className="flex justify-between"><span className="text-gray-500">Alergias</span><span className="font-medium text-amber-600">{selectedPatient.allergies}</span></div>}
            </div>

            {selectedPatient.notes && (
              <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-800">
                {selectedPatient.notes}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t">
              <div>
                <p className="text-xl font-bold text-dental-700">{patientApts.length}</p>
                <p className="text-xs text-gray-500">Citas totales</p>
              </div>
              <div>
                <p className="text-xl font-bold text-green-600">{formatCurrency(totalSpent)}</p>
                <p className="text-xs text-gray-500">Total pagado</p>
              </div>
            </div>

            <button onClick={() => openEdit(selectedPatient)} className="btn-secondary w-full flex items-center justify-center gap-2">
              <Edit2 size={14} /> Editar Paciente
            </button>
          </div>

          {/* Appointment history */}
          <div className="lg:col-span-2 card p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-dental-600" /> Historial de Citas ({patientApts.length})
            </h3>
            {patientApts.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-10">Sin citas registradas</p>
            ) : (
              <div className="space-y-3">
                {patientApts.map((apt) => {
                  const doc = doctors.find((d) => d.id === apt.doctor_id);
                  const treat = treatments.find((t) => t.id === apt.treatment_id);
                  return (
                    <div key={apt.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-l-4"
                      style={{ borderLeftColor: doc?.color || '#0d9488' }}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-900">{treat?.name}</p>
                          <span className={statusClass[apt.status]}>{statusLabel[apt.status]}</span>
                          {apt.paid && <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">Pagado</span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{formatDateShort(apt.date)} · {apt.time} · {doc?.name}</p>
                        {apt.notes && <p className="text-xs text-gray-400 mt-1 italic">{apt.notes}</p>}
                      </div>
                      <p className="text-sm font-semibold text-gray-700">{formatCurrency(apt.amount)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {showModal && (
          <PatientModal patient={editingPatient} onClose={() => { setShowModal(false); setEditingPatient(undefined); setSelectedPatient(patients.find(p => p.id === selectedPatient.id) || null); }} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-gray-500 text-sm">{patients.length} registrados</p>
        </div>
        <button onClick={() => { setEditingPatient(undefined); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nuevo Paciente
        </button>
      </div>

      <div className="card p-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Buscar por nombre, documento o teléfono..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="card p-10 text-center text-gray-400">No se encontraron pacientes</div>
        ) : (
          filtered.map((p) => {
            const aptCount = appointments.filter((a) => a.patient_id === p.id).length;
            const age = differenceInYears(new Date(), parseISO(p.birth_date));
            return (
              <div key={p.id} className="card p-4 flex items-center gap-3 group hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedPatient(p)}>
                <div className="w-11 h-11 rounded-full bg-dental-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-dental-700 font-bold text-sm">{p.full_name.split(' ').map(w => w[0]).slice(0, 2).join('')}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{p.full_name}</p>
                  <p className="text-xs text-gray-500">{p.document_id} · {age} años · {p.phone}</p>
                </div>
                <div className="hidden sm:flex items-center gap-3 text-sm text-gray-500">
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{aptCount} citas</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); openEdit(p); }} className="p-1.5 text-gray-400 hover:text-dental-600">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="p-1.5 text-gray-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
                <ChevronRight size={16} className="text-gray-300 ml-1" />
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <PatientModal patient={editingPatient} onClose={() => { setShowModal(false); setEditingPatient(undefined); }} />
      )}
    </div>
  );
}
