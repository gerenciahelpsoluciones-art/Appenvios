import { MetadataRoute } from 'next';
import { blogPosts } from '../data/blog';

const MESES: Record<string, number> = {
  ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
  jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
};

function parsePostDate(fecha: string): Date {
  const [dia, mes, anio] = fecha.split(' ');
  const mesIndex = MESES[mes.toLowerCase()] ?? 0;
  return new Date(Number(anio), mesIndex, Number(dia));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.helpsoluciones.com.co';

  // Fecha real de la última modificación de cada página (según historial de commits)
  const staticPages = [
    { route: '', lastModified: new Date('2026-05-28'), priority: 1 },
    { route: '/sobre-nosotros', lastModified: new Date('2026-05-25'), priority: 0.8 },
    { route: '/contactenos', lastModified: new Date('2026-05-29'), priority: 0.8 },
    { route: '/agendar-cita', lastModified: new Date('2026-04-13'), priority: 0.8 },
    {
      route: '/blog',
      lastModified: blogPosts.reduce(
        (latest, post) => {
          const d = parsePostDate(post.date);
          return d > latest ? d : latest;
        },
        new Date(0)
      ),
      priority: 0.8,
    },
    { route: '/servidores', lastModified: new Date('2026-05-27'), priority: 0.8 },
    { route: '/networking', lastModified: new Date('2026-05-27'), priority: 0.8 },
    { route: '/ciberseguridad', lastModified: new Date('2026-05-27'), priority: 0.8 },
    { route: '/mantenimiento', lastModified: new Date('2026-05-27'), priority: 0.8 },
    { route: '/redes-y-cableado', lastModified: new Date('2026-05-27'), priority: 0.8 },
    { route: '/datacenter', lastModified: new Date('2026-05-27'), priority: 0.8 },
    { route: '/cctv', lastModified: new Date('2026-05-27'), priority: 0.8 },
    { route: '/productos', lastModified: new Date('2026-04-13'), priority: 0.8 },
    { route: '/ingenieria-social', lastModified: new Date('2026-05-25'), priority: 0.8 },
    { route: '/politica-privacidad', lastModified: new Date('2026-04-13'), priority: 0.8 },
    { route: '/politica-garantias', lastModified: new Date('2026-04-13'), priority: 0.8 },
    { route: '/terminos-condiciones', lastModified: new Date('2026-06-01'), priority: 0.8 },
    { route: '/pqrs', lastModified: new Date('2026-05-29'), priority: 0.8 },
  ].map(({ route, lastModified, priority }) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority,
  }));

  // Páginas dinámicas del blog: fecha real de publicación de cada artículo
  const blogEntries = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: parsePostDate(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...blogEntries];
}
