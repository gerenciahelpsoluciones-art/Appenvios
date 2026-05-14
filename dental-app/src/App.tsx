import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './components/Dashboard';
import Appointments from './components/appointments/Appointments';
import Patients from './components/patients/Patients';
import Doctors from './components/doctors/Doctors';
import Treatments from './components/treatments/Treatments';
import Billing from './components/billing/Billing';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="citas" element={<Appointments />} />
          <Route path="pacientes" element={<Patients />} />
          <Route path="doctores" element={<Doctors />} />
          <Route path="tratamientos" element={<Treatments />} />
          <Route path="facturacion" element={<Billing />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
