import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Productos TI | Help Soluciones',
  description: 'Servidores HP y Dell, switches Cisco, laptops y accesorios TI para empresas en Colombia. Distribución oficial con garantía y soporte incluido.',
  alternates: { canonical: 'https://www.helpsoluciones.com.co/productos' },
  openGraph: {
    title: 'Productos TI | Help Soluciones',
    description: 'Servidores HP y Dell, switches Cisco, laptops y accesorios TI para empresas en Colombia. Distribución oficial con garantía y soporte incluido.',
    url: 'https://www.helpsoluciones.com.co/productos',
  },
};

export default function ProductosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
