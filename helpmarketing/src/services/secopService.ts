import type { Licitacion, HistorialContrato, LicitacionFiltros } from '../types/licitaciones.types';

const SECOP2_BASE = 'https://www.datos.gov.co/resource/p6dx-8zbt.json';
const SECOP1_BASE = 'https://www.datos.gov.co/resource/xvdy-vvsk.json';

// Socrata OData app token (optional but helps with rate limits)
// Can be set via VITE_SOCRATA_APP_TOKEN env var
const APP_TOKEN = import.meta.env.VITE_SOCRATA_APP_TOKEN || '';

function buildHeaders(): HeadersInit {
  const h: Record<string, string> = { 'Accept': 'application/json' };
  if (APP_TOKEN) h['X-App-Token'] = APP_TOKEN;
  return h;
}

function cleanStr(v: unknown): string {
  if (!v) return '';
  return String(v).trim();
}

function cleanNum(v: unknown): number {
  const n = parseFloat(String(v || '0').replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
}

// ─── Map SECOP II row → Licitacion ──────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSecop2(row: any): Licitacion {
  return {
    id: cleanStr(row.id_proceso || row.referencia_del_proceso || Math.random().toString(36).slice(2)),
    numero_proceso: cleanStr(row.referencia_del_proceso || row.id_proceso),
    entidad_nombre: cleanStr(row.nombre_entidad),
    entidad_nit: cleanStr(row.nit_entidad),
    descripcion: cleanStr(row.descripcion_del_procedimiento || row.descripcion),
    modalidad: cleanStr(row.modalidad_de_contratacion),
    estado: cleanStr(row.estado_del_procedimiento || row.fase),
    fecha_publicacion: cleanStr(row.fecha_de_publicacion_del || row.fecha_publicacion_del_proceso),
    fecha_limite: cleanStr(row.fecha_limite_de_recepcion || row.fecha_limite),
    presupuesto: cleanNum(row.precio_base || row.valor_total_adjudicacion || row.presupuesto_oficial),
    municipio: cleanStr(row.nombre_municipio),
    departamento: cleanStr(row.nombre_departamento),
    url_proceso: cleanStr(row.link_al_proceso || row.url_proceso),
    tipo_contrato: cleanStr(row.tipo_de_contrato),
    fuente: 'SECOP_II',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSecop1(row: any): Licitacion {
  return {
    id: cleanStr(row.id_del_proceso || row.numero_de_constancia || Math.random().toString(36).slice(2)),
    numero_proceso: cleanStr(row.numero_de_constancia || row.id_del_proceso),
    entidad_nombre: cleanStr(row.nombre_entidad),
    entidad_nit: cleanStr(row.nit_entidad),
    descripcion: cleanStr(row.descripcion_del_proceso || row.objeto_a_contratar),
    modalidad: cleanStr(row.tipo_de_proceso),
    estado: cleanStr(row.estado_del_proceso),
    fecha_publicacion: cleanStr(row.fecha_de_publicacion || row.fecha_de_cargue),
    fecha_limite: cleanStr(row.fecha_de_cierre),
    presupuesto: cleanNum(row.presupuesto_oficial || row.valor_contrato),
    municipio: cleanStr(row.municipio),
    departamento: cleanStr(row.departamento),
    url_proceso: cleanStr(row.url_proceso),
    tipo_contrato: cleanStr(row.tipo_contrato),
    fuente: 'SECOP_I',
  };
}

// ─── Buscar en SECOP II ──────────────────────────────────────────────────────

export async function buscarLicitacionesSecop2(
  filtros: LicitacionFiltros,
  limit = 50
): Promise<Licitacion[]> {
  const where: string[] = [];

  if (filtros.keywords.trim()) {
    const kw = filtros.keywords.trim().replace(/'/g, "''");
    where.push(
      `(upper(descripcion_del_procedimiento) like upper('%${kw}%') OR upper(nombre_entidad) like upper('%${kw}%'))`
    );
  }

  if (filtros.entidad.trim()) {
    const e = filtros.entidad.trim().replace(/'/g, "''");
    where.push(`upper(nombre_entidad) like upper('%${e}%')`);
  }

  if (filtros.departamento) {
    where.push(`upper(nombre_departamento)=upper('${filtros.departamento}')`);
  }

  if (filtros.modalidad) {
    const m = filtros.modalidad.replace(/'/g, "''");
    where.push(`upper(modalidad_de_contratacion) like upper('%${m}%')`);
  }

  if (filtros.soloActivas) {
    where.push(`(upper(estado_del_procedimiento) like upper('%activ%') OR upper(fase) like upper('%seleccion%') OR upper(fase) like upper('%publicado%'))`);
  }

  if (filtros.presupuestoMin) {
    where.push(`precio_base >= ${filtros.presupuestoMin}`);
  }

  if (filtros.presupuestoMax) {
    where.push(`precio_base <= ${filtros.presupuestoMax}`);
  }

  const params = new URLSearchParams({
    $limit: String(limit),
    $order: 'fecha_de_publicacion_del DESC',
  });

  if (where.length > 0) {
    params.set('$where', where.join(' AND '));
  }

  if (!filtros.keywords.trim() && !filtros.entidad.trim() && !filtros.departamento && !filtros.modalidad) {
    params.set('$q', 'tecnologia software sistemas infraestructura');
  }

  const url = `${SECOP2_BASE}?${params.toString()}`;

  try {
    const res = await fetch(url, { headers: buildHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any[] = await res.json();
    return data.map(mapSecop2).filter(l => l.descripcion.length > 5);
  } catch (err) {
    console.error('SECOP II fetch error:', err);
    return [];
  }
}

// ─── Buscar en SECOP I (histórico) ──────────────────────────────────────────

export async function buscarLicitacionesSecop1(
  filtros: LicitacionFiltros,
  limit = 30
): Promise<Licitacion[]> {
  const where: string[] = [];

  if (filtros.keywords.trim()) {
    const kw = filtros.keywords.trim().replace(/'/g, "''");
    where.push(`(upper(descripcion_del_proceso) like upper('%${kw}%') OR upper(nombre_entidad) like upper('%${kw}%'))`);
  }

  if (filtros.entidad.trim()) {
    const e = filtros.entidad.trim().replace(/'/g, "''");
    where.push(`upper(nombre_entidad) like upper('%${e}%')`);
  }

  if (filtros.departamento) {
    where.push(`upper(departamento)=upper('${filtros.departamento}')`);
  }

  const params = new URLSearchParams({
    $limit: String(limit),
    $order: 'fecha_de_publicacion DESC',
  });

  if (where.length > 0) {
    params.set('$where', where.join(' AND '));
  } else {
    params.set('$q', 'tecnologia software sistemas');
  }

  const url = `${SECOP1_BASE}?${params.toString()}`;

  try {
    const res = await fetch(url, { headers: buildHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any[] = await res.json();
    return data.map(mapSecop1).filter(l => l.descripcion.length > 5);
  } catch (err) {
    console.error('SECOP I fetch error:', err);
    return [];
  }
}

// ─── Buscar historial de contratos de una entidad ───────────────────────────

export async function buscarHistorialEntidad(
  entidadNombreONit: string,
  limit = 50
): Promise<HistorialContrato[]> {
  const q = entidadNombreONit.trim().replace(/'/g, "''");

  const where = `upper(nombre_entidad) like upper('%${q}%') OR nit_entidad like '%${q}%'`;

  const params = new URLSearchParams({
    $limit: String(limit),
    $where: where,
    $order: 'fecha_de_firma_del_contrato DESC',
  });

  const url = `${SECOP2_BASE}?${params.toString()}`;

  try {
    const res = await fetch(url, { headers: buildHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any[] = await res.json();
    return data
      .filter(r => r.nombre_entidad)
      .map((row): HistorialContrato => ({
        id_proceso: cleanStr(row.id_proceso || row.referencia_del_proceso),
        entidad_nombre: cleanStr(row.nombre_entidad),
        entidad_nit: cleanStr(row.nit_entidad),
        descripcion: cleanStr(row.descripcion_del_procedimiento || row.objeto_del_contrato),
        contratista_nombre: cleanStr(row.nombre_proveedor || row.proveedor_adjudicado),
        contratista_nit: cleanStr(row.nit_proveedor),
        valor_contrato: cleanNum(row.valor_total_adjudicacion || row.valor_contrato),
        fecha_firma: cleanStr(row.fecha_de_firma_del_contrato),
        modalidad: cleanStr(row.modalidad_de_contratacion),
        estado: cleanStr(row.estado_del_procedimiento),
        departamento: cleanStr(row.nombre_departamento),
        municipio: cleanStr(row.nombre_municipio),
        tipo_contrato: cleanStr(row.tipo_de_contrato),
        fuente: 'SECOP_II',
      }));
  } catch (err) {
    console.error('Historial entidad error:', err);
    return [];
  }
}

// ─── Buscar historial en SECOP I ─────────────────────────────────────────────

export async function buscarHistorialEntidadSecop1(
  entidadNombreONit: string,
  limit = 30
): Promise<HistorialContrato[]> {
  const q = entidadNombreONit.trim().replace(/'/g, "''");
  const where = `upper(nombre_entidad) like upper('%${q}%') OR nit_entidad like '%${q}%'`;

  const params = new URLSearchParams({
    $limit: String(limit),
    $where: where,
    $order: 'fecha_de_publicacion DESC',
  });

  const url = `${SECOP1_BASE}?${params.toString()}`;

  try {
    const res = await fetch(url, { headers: buildHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any[] = await res.json();
    return data
      .filter(r => r.nombre_entidad)
      .map((row): HistorialContrato => ({
        id_proceso: cleanStr(row.id_del_proceso || row.numero_de_constancia),
        entidad_nombre: cleanStr(row.nombre_entidad),
        entidad_nit: cleanStr(row.nit_entidad),
        descripcion: cleanStr(row.descripcion_del_proceso || row.objeto_a_contratar),
        contratista_nombre: cleanStr(row.nombre_proveedor || row.contratista),
        contratista_nit: cleanStr(row.nit_proveedor),
        valor_contrato: cleanNum(row.valor_contrato || row.presupuesto_oficial),
        fecha_firma: cleanStr(row.fecha_de_publicacion),
        modalidad: cleanStr(row.tipo_de_proceso),
        estado: cleanStr(row.estado_del_proceso),
        departamento: cleanStr(row.departamento),
        municipio: cleanStr(row.municipio),
        tipo_contrato: cleanStr(row.tipo_contrato),
        fuente: 'SECOP_I',
      }));
  } catch (err) {
    console.error('Historial SECOP I error:', err);
    return [];
  }
}
