import type { Licitacion, HistorialContrato, LicitacionFiltros } from '../types/licitaciones.types';

const SECOP2_BASE = 'https://www.datos.gov.co/resource/p6dx-8zbt.json';
const SECOP1_BASE = 'https://www.datos.gov.co/resource/jbjy-vk9h.json';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSecop2(row: any): Licitacion {
  // Columnas confirmadas del dataset p6dx-8zbt (verificadas 2026-05-25)
  return {
    id: cleanStr(row.id_del_proceso || row.referencia_del_proceso || Math.random().toString(36).slice(2)),
    numero_proceso: cleanStr(row.referencia_del_proceso || row.id_del_proceso),
    entidad_nombre: cleanStr(row.entidad),
    entidad_nit: cleanStr(row.nit_entidad),
    descripcion: cleanStr(row.nombre_del_procedimiento),
    modalidad: cleanStr(row.modalidad_de_contratacion),
    estado: cleanStr(row.estado_resumen || row.fase || row.estado_del_procedimiento),
    fecha_publicacion: cleanStr(row.fecha_de_publicacion_del),
    fecha_limite: cleanStr(row.fecha_de_publicacion_fase_3 || row.fecha_de_ultima_publicaci),
    presupuesto: cleanNum(row.precio_base),
    municipio: cleanStr(row.ciudad_entidad),
    departamento: cleanStr(row.departamento_entidad),
    url_proceso: '',
    tipo_contrato: cleanStr(row.tipo_de_contrato),
    fuente: 'SECOP_II',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSecop1(row: any): Licitacion {
  return {
    id: cleanStr(row.id_contrato || row.referencia_del_contrato || Math.random().toString(36).slice(2)),
    numero_proceso: cleanStr(row.referencia_del_contrato || row.id_contrato),
    entidad_nombre: cleanStr(row.nombre_entidad),
    entidad_nit: cleanStr(row.nit_entidad),
    descripcion: cleanStr(row.descripcion_del_proceso || row.objeto_del_contrato),
    modalidad: cleanStr(row.modalidad_de_contratacion),
    estado: cleanStr(row.estado_contrato),
    fecha_publicacion: cleanStr(row.fecha_de_firma || row.fecha_de_inicio_del_contrato),
    fecha_limite: cleanStr(row.fecha_de_fin_del_contrato),
    presupuesto: cleanNum(row.valor_del_contrato || row.valor_pagado),
    municipio: cleanStr(row.ciudad),
    departamento: cleanStr(row.departamento),
    url_proceso: cleanStr(row.urlproceso),
    tipo_contrato: cleanStr(row.tipo_de_contrato),
    fuente: 'SECOP_I',
  };
}

export async function buscarLicitacionesSecop2(
  filtros: LicitacionFiltros,
  limit = 100
): Promise<Licitacion[]> {
  const where: string[] = [];

  // Columnas confirmadas del dataset p6dx-8zbt (2026-05-25):
  // entidad, departamento_entidad, ciudad_entidad, precio_base,
  // fecha_de_publicacion_del, estado_de_apertura_del_proceso, modalidad_de_contratacion

  // Solo procesos abiertos para presentar propuesta
  if (filtros.soloPublicados) {
    where.push(`estado_de_apertura_del_proceso = 'Abierto'`);
  }

  if (filtros.presupuestoMin) {
    where.push(`precio_base >= ${filtros.presupuestoMin}`);
  }
  if (filtros.presupuestoMax) {
    where.push(`precio_base <= ${filtros.presupuestoMax}`);
  }
  if (filtros.fechaDesde) {
    where.push(`fecha_de_publicacion_del >= '${filtros.fechaDesde}T00:00:00'`);
  }
  if (filtros.fechaHasta) {
    where.push(`fecha_de_publicacion_del <= '${filtros.fechaHasta}T23:59:59'`);
  }

  // $q para texto libre (keywords, departamento, ciudad, entidad, modalidad)
  const parts: string[] = [];
  if (filtros.keywords.trim()) parts.push(filtros.keywords.trim());
  if (filtros.departamento) parts.push(filtros.departamento);
  if (filtros.municipio?.trim()) parts.push(filtros.municipio.trim());
  if (filtros.entidad.trim()) parts.push(filtros.entidad.trim());
  if (filtros.modalidad) parts.push(filtros.modalidad);
  const q = parts.join(' ') || 'tecnologia sistemas redes servidores software';

  const params = new URLSearchParams({
    $limit: String(limit),
    $order: 'fecha_de_publicacion_del DESC',
    $q: q,
  });

  if (where.length > 0) {
    params.set('$where', where.join(' AND '));
  }

  const url = `${SECOP2_BASE}?${params.toString()}`;
  const res = await fetch(url, { headers: buildHeaders() });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`SECOP II HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any[] = await res.json();
  return data.map(mapSecop2).filter(l => l.descripcion.length > 5);
}

export async function buscarLicitacionesSecop1(
  filtros: LicitacionFiltros,
  limit = 30
): Promise<Licitacion[]> {
  const where: string[] = [];
  // $q handles all text search — avoids column-name 400 errors on datos.gov.co
  const parts1 = [filtros.keywords.trim() || 'tecnologia software sistemas'];
  if (filtros.departamento) parts1.push(filtros.departamento);
  if (filtros.municipio?.trim()) parts1.push(filtros.municipio.trim());
  if (filtros.entidad.trim()) parts1.push(filtros.entidad.trim());
  const keywords = parts1.join(' ');

  if (filtros.soloVigentes) {
    const hoy = new Date();
    const limite = new Date(hoy); limite.setDate(limite.getDate() + 5);
    const hoyStr = hoy.toISOString().split('T')[0];
    const limiteStr = limite.toISOString().split('T')[0];
    where.push(`fecha_de_fin_del_contrato >= '${hoyStr}T00:00:00' AND fecha_de_fin_del_contrato <= '${limiteStr}T23:59:59'`);
  }
  if (filtros.fechaDesde) {
    where.push(`fecha_de_firma >= '${filtros.fechaDesde}T00:00:00'`);
  }
  if (filtros.fechaHasta) {
    where.push(`fecha_de_firma <= '${filtros.fechaHasta}T23:59:59'`);
  }

  const params = new URLSearchParams({
    $limit: String(limit),
    $order: ':id DESC',
    $q: keywords,
  });

  if (where.length > 0) {
    params.set('$where', where.join(' AND '));
  }

  const url = `${SECOP1_BASE}?${params.toString()}`;
  const res = await fetch(url, { headers: buildHeaders() });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`SECOP I HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any[] = await res.json();
  return data.map(mapSecop1).filter(l => l.descripcion.length > 5);
}

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

  try {
    const res = await fetch(`${SECOP2_BASE}?${params.toString()}`, { headers: buildHeaders() });
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

  try {
    const res = await fetch(`${SECOP1_BASE}?${params.toString()}`, { headers: buildHeaders() });
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
