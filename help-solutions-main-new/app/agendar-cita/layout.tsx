import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agendar Cita | Help Soluciones',
  description: 'Agende su diagnóstico técnico o visita de infraestructura TI con Help Soluciones. Ingenieros certificados en Bogotá y principales ciudades de Colombia.',
  alternates: { canonical: 'https://www.helpsoluciones.com.co/agendar-cita' },
  openGraph: {
    title: 'Agendar Cita | Help Soluciones',
    description: 'Agende su diagnóstico técnico o visita de infraestructura TI con Help Soluciones. Ingenieros certificados en Bogotá y principales ciudades de Colombia.',
    url: 'https://www.helpsoluciones.com.co/agendar-cita',
  },
};

export default function AgendarCitaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
