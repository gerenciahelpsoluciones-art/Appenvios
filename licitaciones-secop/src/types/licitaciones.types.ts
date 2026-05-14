export interface Licitacion {
  id: string;
  numero_proceso: string;
  entidad_nombre: string;
  entidad_nit?: string;
  descripcion: string;
  modalidad: string;
  estado: string;
  fecha_publicacion: string;
  fecha_limite?: string;
  presupuesto?: number;
  municipio?: string;
  departamento?: string;
  url_proceso?: string;
  tipo_contrato?: string;
  match_score?: number;
  match_result?: MatchResult;
  fuente: 'SECOP_I' | 'SECOP_II';
  guardada?: boolean;
  guardada_at?: string;
}

export interface LicitacionFiltros {
  keywords: string;
  entidad: string;
  departamento: string;
  modalidad: string;
  estado: string;
  presupuestoMin: string;
  presupuestoMax: string;
  soloActivas: boolean;
}

export interface MatchResult {
  score: number;
  nivel: 'alto' | 'medio' | 'bajo' | 'sin_match';
  justificacion: string;
  fortalezas: string[];
  debilidades: string[];
  recomendaciones: string[];
}

export interface HitoProceso {
  id: string;
  licitacion_id: string;
  licitacion_nombre: string;
  nombre: string;
  descripcion: string;
  fecha_estimada: string;
  fecha_real?: string;
  estado: 'pendiente' | 'en_progreso' | 'completado' | 'vencido';
  responsable?: string;
  notas?: string;
  created_at: string;
}

export interface HistorialContrato {
  id_proceso?: string;
  entidad_nombre: string;
  entidad_nit?: string;
  descripcion: string;
  contratista_nombre?: string;
  contratista_nit?: string;
  valor_contrato: number;
  fecha_firma?: string;
  modalidad: string;
  estado: string;
  departamento?: string;
  municipio?: string;
  tipo_contrato?: string;
  fuente: 'SECOP_I' | 'SECOP_II';
}

export interface DocumentoBase {
  id: string;
  licitacion_id: string;
  licitacion_nombre: string;
  tipo: 'carta_presentacion' | 'experiencia' | 'propuesta_tecnica' | 'propuesta_economica' | 'cronograma';
  titulo: string;
  contenido: string;
  generado_at: string;
}

export interface ExperienciaItem {
  proyecto: string;
  entidad: string;
  valor: number;
  anno: number;
  descripcion: string;
}

export interface EmpresaPerfil {
  nombre: string;
  nit: string;
  sector: string;
  descripcion: string;
  servicios: string[];
  experiencia: ExperienciaItem[];
  certificaciones: string[];
  capacidad_financiera: {
    activos_totales: number;
    ingresos_anuales: number;
    patrimonio: number;
  };
}

// ─── RUP (Registro Único de Proponentes) ────────────────────────────────────

export interface CodigoUNSPSC {
  codigo: string;
  descripcion: string;
  segmento?: string;
  familia?: string;
  clase?: string;
}

export interface CertificacionRUP {
  entidad: string;
  objeto: string;
  numero_contrato?: string;
  valor: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  codigos_unspsc?: string[];
}

export interface RupData {
  nit: string;
  razon_social: string;
  codigos_unspsc: CodigoUNSPSC[];
  certificaciones: CertificacionRUP[];
  capacidad_financiera?: {
    k_contratacion?: number;
    liquidez?: number;
    endeudamiento?: number;
    rentabilidad?: number;
  };
  fecha_inscripcion?: string;
  fecha_renovacion?: string;
  archivos_procesados: { nombre: string; procesado_at: string }[];
  ultima_actualizacion: string;
}

// ─── Telegram ────────────────────────────────────────────────────────────────

export interface TelegramLicitConfig {
  bot_token: string;
  chat_id: string;
  activo: boolean;
  score_minimo: number;
  notificar_nuevas: boolean;
  notificar_cambios_estado: boolean;
}

export const DEPARTAMENTOS_CO = [
  'AMAZON', 'ANTIOQUIA', 'ARAUCA', 'ATLÁNTICO', 'BOLÍVAR', 'BOYACÁ',
  'CALDAS', 'CAQUETÁ', 'CASANARE', 'CAUCA', 'CESAR', 'CHOCÓ',
  'CÓRDOBA', 'CUNDINAMARCA', 'GUAINÍA', 'GUAVIARE', 'HUILA', 'LA GUAJIRA',
  'MAGDALENA', 'META', 'NARIÑO', 'NORTE DE SANTANDER', 'PUTUMAYO', 'QUINDÍO',
  'RISARALDA', 'SAN ANDRÉS, PROVIDENCIA Y SANTA CATALINA', 'SANTANDER', 'SUCRE',
  'TOLIMA', 'VALLE DEL CAUCA', 'VAUPÉS', 'VICHADA', 'BOGOTÁ D.C.',
];

export const MODALIDADES = [
  'Contratación Directa',
  'Licitación Pública',
  'Mínima Cuantía',
  'Concurso de Méritos',
  'Selección Abreviada',
  'Selección Abreviada de Menor Cuantía',
  'Régimen Especial',
  'Asociación Público Privada',
];

export const EMPRESA_PERFIL_DEFAULT: EmpresaPerfil = {
  nombre: 'Help Soluciones Informaticas',
  nit: '900.000.000-0',
  sector: 'Tecnología de la Información',
  descripcion: 'Empresa especializada en soluciones de tecnología informática, infraestructura IT, ciberseguridad, desarrollo de software a medida y consultoría tecnológica para empresas públicas y privadas.',
  servicios: [
    'Infraestructura TI (servidores, redes, cableado)',
    'Ciberseguridad y pentesting',
    'Desarrollo de software a medida',
    'Soporte técnico y mantenimiento',
    'Consultoría tecnológica',
    'Implementación de sistemas ERP/CRM',
    'Soluciones en la nube (cloud computing)',
    'Licenciamiento de software',
    'Conectividad y telecomunicaciones',
    'Marketing digital y posicionamiento web',
  ],
  experiencia: [
    {
      proyecto: 'Sistema de Gestión Documental',
      entidad: 'Alcaldía Municipal',
      valor: 120000000,
      anno: 2023,
      descripcion: 'Implementación de sistema de gestión documental con digitalización de archivos',
    },
    {
      proyecto: 'Infraestructura de Red y Servidores',
      entidad: 'Hospital Regional',
      valor: 280000000,
      anno: 2022,
      descripcion: 'Renovación de infraestructura de red, instalación de servidores y firewall',
    },
    {
      proyecto: 'Soporte Técnico Integral',
      entidad: 'Gobernación',
      valor: 95000000,
      anno: 2024,
      descripcion: 'Contrato de soporte técnico y mantenimiento preventivo/correctivo para 200 equipos',
    },
  ],
  certificaciones: [
    'ISO 9001:2015',
    'Cámara de Comercio vigente',
    'RUT activo',
    'Registro SECOP activo',
  ],
  capacidad_financiera: {
    activos_totales: 850000000,
    ingresos_anuales: 600000000,
    patrimonio: 350000000,
  },
};
