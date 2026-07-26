import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog TI',
  description: 'Artículos técnicos sobre ciberseguridad, servidores, redes empresariales y outsourcing TI en Colombia. Actualícese con los expertos de Help Soluciones.',
  alternates: { canonical: 'https://www.helpsoluciones.com.co/blog' },
  openGraph: {
    title: 'Blog TI | Help Soluciones',
    description: 'Artículos técnicos sobre ciberseguridad, servidores, redes empresariales y outsourcing TI en Colombia. Actualícese con los expertos de Help Soluciones.',
    url: 'https://www.helpsoluciones.com.co/blog',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
