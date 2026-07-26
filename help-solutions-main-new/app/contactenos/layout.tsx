import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contáctenos',
  description: 'Solicite una cotización de soporte TI para su empresa en Colombia. Ingenieros especializados disponibles. Respuesta garantizada en menos de 2 horas.',
  alternates: { canonical: 'https://www.helpsoluciones.com.co/contactenos' },
  openGraph: {
    title: 'Contáctenos | Help Soluciones',
    description: 'Solicite una cotización de soporte TI para su empresa en Colombia. Ingenieros especializados disponibles. Respuesta garantizada en menos de 2 horas.',
    url: 'https://www.helpsoluciones.com.co/contactenos',
  },
};

export default function ContactenosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
