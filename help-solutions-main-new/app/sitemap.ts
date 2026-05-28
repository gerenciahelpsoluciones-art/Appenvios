import { MetadataRoute } from 'next';
import { blogPosts } from '../data/blog';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.helpsoluciones.com.co';

  // Páginas estáticas principales
  const staticPages = [
    '',
    '/sobre-nosotros',
    '/contactenos',
    '/agendar-cita',
    '/blog',
    '/servidores',
    '/networking',
    '/ciberseguridad',
    '/mantenimiento',
    '/redes-y-cableado',
    '/datacenter',
    '/cctv',
    '/productos',
    '/ingenieria-social',
    '/politica-privacidad',
    '/politica-garantias',
    '/terminos-condiciones',
    '/pqrs',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Páginas dinámicas del blog
  const blogEntries = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...blogEntries];
}
