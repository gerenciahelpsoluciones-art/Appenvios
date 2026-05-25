import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PQRS | Help Soluciones',
  description: 'Radique sus peticiones, quejas, reclamos y sugerencias a Help Soluciones. Comprometidos con la mejora continua y la satisfacción de cada cliente.',
  alternates: { canonical: 'https://www.helpsoluciones.com.co/pqrs' },
  openGraph: {
    title: 'PQRS | Help Soluciones',
    description: 'Radique sus peticiones, quejas, reclamos y sugerencias a Help Soluciones. Comprometidos con la mejora continua y la satisfacción de cada cliente.',
    url: 'https://www.helpsoluciones.com.co/pqrs',
  },
};

export default function PqrsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
