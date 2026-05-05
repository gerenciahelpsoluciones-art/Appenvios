export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  readTime: string;
  category: string;
  image: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  featured?: boolean;
}

export const blogPosts: BlogPost[] = [
  {
    id: 'post-1',
    slug: 'futuro-ciberseguridad-empresarial-2026',
    title: 'El futuro de la ciberseguridad empresarial en 2026',
    excerpt: 'Descubre cómo la IA predictiva y las arquitecturas Zero Trust están redefiniendo la forma en que las empresas protegen sus activos vitales contra ataques de ransomware más sofisticados.',
    content: '<p>En la era digital actual, la ciberseguridad ya no es solo un departamento de TI, sino una prioridad a nivel de junta directiva. El 2026 marca un punto de inflexión donde las arquitecturas tradicionales basadas en perímetros ceden su lugar definitivamente a enfoques más dinámicos.</p><h2>La era del Zero Trust</h2><p>El modelo Zero Trust o "Confianza Cero" asume que las amenazas ya están dentro de la red. Por lo tanto, exige una verificación continua de la identidad y del contexto del dispositivo antes de conceder acceso a cualquier recurso crítico.</p>',
    date: '15 Mar 2026',
    readTime: '6 min de lectura',
    category: 'Ciberseguridad',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80',
    author: {
      name: 'Carlos Mendoza',
      role: 'Consultor Ti',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100'
    },
    featured: true
  },
  {
    id: 'post-2',
    slug: 'ventajas-migracion-cloud-nube-hibrida',
    title: 'Migración a la Nube Híbrida: Maximizando la Flexibilidad B2B',
    excerpt: '¿Por qué las empresas líderes eligen entornos híbridos sobre implementaciones de nube puramente públicas o privadas? Un análisis en profundidad de costos y agilidad.',
    content: '<p>La nube híbrida combina infraestructuras privadas (on-premise) con nubes públicas, permitiendo que los datos y aplicaciones se muevan entre ambas plataformas. Esto proporciona a las empresas una mayor flexibilidad y más opciones de implementación de datos.</p>',
    date: '10 Mar 2026',
    readTime: '5 min de lectura',
    category: 'Nube y Cloud',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80',
    author: {
      name: 'Diana López',
      role: 'Cloud Architect',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100'
    }
  },
  {
    id: 'post-3',
    slug: 'renovacion-hardware-oficinas-post-pandemia',
    title: 'Hardware de Oficina: El nuevo estándar para entornos de trabajo 3.0',
    excerpt: 'Desde monitores curvos ultrawide hasta mini-PCs ultracompactos, exploramos el equipamiento esencial para mantener la productividad.',
    content: '<p>La configuración del puesto de trabajo ha cambiado drásticamente. Las empresas buscan dotar a sus empleados no solo de potencia de cómputo, sino de ergonomía superior y versatilidad de transporte.</p>',
    date: '05 Mar 2026',
    readTime: '4 min de lectura',
    category: 'Hardware',
    image: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&q=80',
    author: {
      name: 'Luis Ramírez',
      role: 'Tech Specialist',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100'
    }
  },
  {
    id: 'post-4',
    slug: 'monitoreo-predictivo-servidores',
    title: 'El Monitoreo Predictivo en Servidores Críticos',
    excerpt: 'La importancia de predecir fallas antes de que ocurran mediante herramientas de monitoreo avanzadas y Machine Learning.',
    content: '<p>El tiempo de inactividad (downtime) de los servidores puede costar miles de dólares por minuto a las grandes corporaciones. El monitoreo predictivo utiliza registros históricos para alertar a los administradores de red.</p>',
    date: '01 Mar 2026',
    readTime: '7 min de lectura',
    category: 'Infraestructura TI',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80',
    author: {
      name: 'Carlos Mendoza',
      role: 'Consultor Ti',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100'
    }
  },
  {
    id: 'post-ai-1',
    slug: 'infraestructura-con-cerebro-n8n-ia',
    title: 'Infraestructura con Cerebro: El Futuro del Soporte Tecnológico',
    excerpt: '¿Tu infraestructura TI solo funciona o también piensa? Cómo la integración de n8n y Agentes de IA está eliminando el tiempo de inactividad en empresas colombianas.',
    content: '<h2>La Evolución del Soporte</h2><p>En Help Soluciones hemos dado el paso hacia la <strong>Infraestructura Inteligente</strong>. Ya no solo monitorizamos; orquestamos. Gracias a nodos de IA y flujos autónomos, nuestros sistemas ahora pueden predecir y resolver fallos de red y saturación de servidores sin intervención humana directa.</p>',
    date: '21 Mar 2026',
    readTime: '5 min de lectura',
    category: 'IA & Automatización',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800',
    author: {
      name: 'HelpMarketer IA',
      role: 'CDO Digital',
      avatar: 'https://images.unsplash.com/photo-1620712943543-bcc4628c9757?auto=format&fit=crop&q=80&w=100'
    }
  },
  {
    id: 'post-5',
    slug: 'guia-cableado-estructurado-bogota-eficiencia',
    title: 'Cableado Estructurado en Bogotá: La Clave de la Velocidad Empresarial',
    excerpt: '¿Su oficina tiene cuellos de botella en la red? Descubra por qué una infraestructura de cableado profesional es la inversión más rentable para su empresa en 2026.',
    content: '<h2>Más que solo cables</h2><p>Un sistema de <strong>cableado estructurado</strong> bien diseñado es el sistema nervioso de cualquier organización moderna. En Bogotá, donde la competencia empresarial es feroz, contar con una red de datos certificada (Categoría 6A o superior) marca la diferencia entre una operación fluida y una llena de interrupciones constantes.</p><h3>Beneficios de la Certificación</h3><p>Implementar redes certificadas no solo mejora la velocidad, sino que reduce drásticamente el ruido electromagnético y prepara a su empresa para tecnologías futuras como el IoT industrial y la videovigilancia 4K.</p>',
    date: '25 Abr 2026',
    readTime: '8 min de lectura',
    category: 'Infraestructura TI',
    image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=800',
    author: {
      name: 'Carlos Mendoza',
      role: 'Consultor Ti',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100'
    }
  },
  {
    id: 'post-6',
    slug: 'mantenimiento-preventivo-servidores-ahorro-costos',
    title: 'Mantenimiento de Servidores: El Seguro de Vida de su Información',
    excerpt: 'El costo de una hora de inactividad puede ser devastador. Aprenda cómo el mantenimiento preventivo programado salva empresas de desastres financieros.',
    content: '<h2>La cultura de la prevención vs. la reacción</h2><p>Esperar a que un servidor falle para llamar a soporte es el error más costoso que una empresa puede cometer. El <strong>mantenimiento preventivo de servidores</strong> en Help Soluciones incluye limpieza física profunda, actualización de firmware, revisión de arreglos RAID y optimización de software crítico.</p><h3>Seguridad y Rendimiento</h3><p>Un servidor bien mantenido consume menos energía, genera menos calor y, lo más importante, reduce la superficie de ataque para vulnerabilidades conocidas.</p>',
    date: '02 May 2026',
    readTime: '6 min de lectura',
    category: 'Soporte Técnico',
    image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&q=80&w=800',
    author: {
      name: 'Luis Ramírez',
      role: 'Tech Specialist',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100'
    }
  }
];
