// src/data/servicioTemplates.ts

export interface PasoInfografia {
  icono: string;
  titulo: string;
  descripcion: string;
}

export interface ServicioTemplate {
  id: string;
  nombre: string;
  icono: string;
  color: string;      // hex para badges y acentos
  descripcion: string;
  introProtocolo: string;
  pasosInfografia: PasoInfografia[]; // primeros 6 pasos (van en grid visual)
  pasosLista: string[];               // pasos adicionales (van en lista)
}

export const SERVICIO_TEMPLATES: ServicioTemplate[] = [
  {
    id: 'servidores',
    nombre: 'Mantenimiento Preventivo de Servidores',
    icono: '🖥️',
    color: '#6366f1',
    descripcion: 'Servicio integral de mantenimiento preventivo para servidores físicos y virtuales.',
    introProtocolo:
      'Nuestro servicio incluye una revisión integral del hardware y software del servidor, ' +
      'garantizando su correcto funcionamiento, seguridad y disponibilidad. ' +
      'Cada visita genera un informe técnico detallado con hallazgos y recomendaciones.',
    pasosInfografia: [
      { icono: '🔍', titulo: 'Inspección Visual', descripcion: 'Revisión visual del hardware y chequeo de temperatura' },
      { icono: '🌬️', titulo: 'Limpieza Interna', descripcion: 'Limpieza con aire comprimido y contactores' },
      { icono: '💾', titulo: 'Revisión Discos', descripcion: 'Verificación S.M.A.R.T. de discos duros' },
      { icono: '🔒', titulo: 'Actualizaciones', descripcion: 'Firmware, parches de seguridad y SO' },
      { icono: '⚡', titulo: 'Redundancia', descripcion: 'Prueba de UPS y sistemas eléctricos' },
      { icono: '📋', titulo: 'Informe Técnico', descripcion: 'Entrega de reporte con hallazgos' },
    ],
    pasosLista: [
      'Verificación de redundancia RAID y fuentes de poder',
      'Revisión de logs de eventos y errores del sistema operativo',
      'Verificación de conectividad de red y configuración de interfaces',
    ],
  },
  {
    id: 'portatiles',
    nombre: 'Mantenimiento Preventivo de Portátiles',
    icono: '💻',
    color: '#f59e0b',
    descripcion: 'Servicio de mantenimiento preventivo para equipos portátiles y de escritorio.',
    introProtocolo:
      'Mantenimiento especializado para equipos portátiles que garantiza rendimiento óptimo, ' +
      'seguridad del sistema y vida útil prolongada del hardware.',
    pasosInfografia: [
      { icono: '🔍', titulo: 'Inspección Física', descripcion: 'Revisión de puertos, teclado y pantalla' },
      { icono: '🌬️', titulo: 'Limpieza Interna', descripcion: 'Limpieza de ventiladores y disipadores' },
      { icono: '🔋', titulo: 'Revisión Batería', descripcion: 'Diagnóstico del estado y ciclos de carga' },
      { icono: '🛡️', titulo: 'Seguridad', descripcion: 'Actualización SO, antivirus y parches' },
      { icono: '📡', titulo: 'Conectividad', descripcion: 'Wi-Fi, Bluetooth y puertos USB' },
      { icono: '📋', titulo: 'Informe Técnico', descripcion: 'Reporte con hallazgos y recomendaciones' },
    ],
    pasosLista: [
      'Optimización de inicio y rendimiento general del sistema',
      'Verificación de integridad de archivos del sistema operativo',
    ],
  },
  {
    id: 'impresoras',
    nombre: 'Mantenimiento Preventivo de Impresoras',
    icono: '🖨️',
    color: '#ec4899',
    descripcion: 'Servicio de mantenimiento preventivo para impresoras láser e inyección de tinta.',
    introProtocolo:
      'Servicio técnico especializado en mantenimiento de impresoras que asegura calidad ' +
      'de impresión, disponibilidad del equipo y reducción de fallas inesperadas.',
    pasosInfografia: [
      { icono: '🧹', titulo: 'Limpieza Cabezales', descripcion: 'Limpieza de cabezales y sistema de tinta' },
      { icono: '⚙️', titulo: 'Revisión Rodillos', descripcion: 'Inspección y limpieza de rodillos de arrastre' },
      { icono: '🎯', titulo: 'Calibración', descripcion: 'Calibración de alineación y calidad de impresión' },
      { icono: '💾', titulo: 'Firmware', descripcion: 'Actualización de firmware del equipo' },
      { icono: '🖨️', titulo: 'Prueba Impresión', descripcion: 'Impresión de prueba y verificación de calidad' },
      { icono: '📋', titulo: 'Informe Técnico', descripcion: 'Reporte con hallazgos y recomendaciones' },
    ],
    pasosLista: [
      'Revisión del nivel de tóner/tinta y estado de cartuchos',
      'Verificación de conectividad de red (impresoras en red)',
    ],
  },
];
