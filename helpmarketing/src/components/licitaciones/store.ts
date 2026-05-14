import type { Licitacion, HitoProceso, DocumentoBase, EmpresaPerfil } from '../../types/licitaciones.types';
import { EMPRESA_PERFIL_DEFAULT } from '../../types/licitaciones.types';

const KEYS = {
  licitaciones: 'licit_procesos',
  hitos: 'licit_hitos',
  documentos: 'licit_documentos',
  perfil: 'licit_empresa_perfil',
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function save(key: string, data: unknown): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ─── Licitaciones guardadas ──────────────────────────────────────────────────

export function getLicitacionesGuardadas(): Licitacion[] {
  return load<Licitacion[]>(KEYS.licitaciones, []);
}

export function saveLicitacion(licit: Licitacion): void {
  const all = getLicitacionesGuardadas();
  const exists = all.findIndex(l => l.id === licit.id);
  if (exists >= 0) {
    all[exists] = { ...licit, guardada: true, guardada_at: new Date().toISOString() };
  } else {
    all.unshift({ ...licit, guardada: true, guardada_at: new Date().toISOString() });
  }
  save(KEYS.licitaciones, all);
}

export function updateLicitacion(id: string, updates: Partial<Licitacion>): void {
  const all = getLicitacionesGuardadas();
  const idx = all.findIndex(l => l.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...updates };
    save(KEYS.licitaciones, all);
  }
}

export function deleteLicitacion(id: string): void {
  const all = getLicitacionesGuardadas().filter(l => l.id !== id);
  save(KEYS.licitaciones, all);
}

// ─── Hitos del proceso ───────────────────────────────────────────────────────

export function getHitos(licitacionId?: string): HitoProceso[] {
  const all = load<HitoProceso[]>(KEYS.hitos, []);
  return licitacionId ? all.filter(h => h.licitacion_id === licitacionId) : all;
}

export function saveHito(hito: Omit<HitoProceso, 'id' | 'created_at'>): HitoProceso {
  const all = load<HitoProceso[]>(KEYS.hitos, []);
  const nuevo: HitoProceso = {
    ...hito,
    id: Math.random().toString(36).slice(2),
    created_at: new Date().toISOString(),
  };
  all.push(nuevo);
  save(KEYS.hitos, all);
  return nuevo;
}

export function updateHito(id: string, updates: Partial<HitoProceso>): void {
  const all = load<HitoProceso[]>(KEYS.hitos, []);
  const idx = all.findIndex(h => h.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...updates };
    save(KEYS.hitos, all);
  }
}

export function deleteHito(id: string): void {
  const all = load<HitoProceso[]>(KEYS.hitos, []).filter(h => h.id !== id);
  save(KEYS.hitos, all);
}

// ─── Documentos generados ────────────────────────────────────────────────────

export function getDocumentos(licitacionId?: string): DocumentoBase[] {
  const all = load<DocumentoBase[]>(KEYS.documentos, []);
  return licitacionId ? all.filter(d => d.licitacion_id === licitacionId) : all;
}

export function saveDocumento(doc: Omit<DocumentoBase, 'id' | 'generado_at'>): DocumentoBase {
  const all = load<DocumentoBase[]>(KEYS.documentos, []);
  const nuevo: DocumentoBase = {
    ...doc,
    id: Math.random().toString(36).slice(2),
    generado_at: new Date().toISOString(),
  };
  all.unshift(nuevo);
  save(KEYS.documentos, all.slice(0, 100));
  return nuevo;
}

export function deleteDocumento(id: string): void {
  const all = load<DocumentoBase[]>(KEYS.documentos, []).filter(d => d.id !== id);
  save(KEYS.documentos, all);
}

// ─── Perfil de empresa ───────────────────────────────────────────────────────

export function getEmpresaPerfil(): EmpresaPerfil {
  return load<EmpresaPerfil>(KEYS.perfil, EMPRESA_PERFIL_DEFAULT);
}

export function saveEmpresaPerfil(perfil: EmpresaPerfil): void {
  save(KEYS.perfil, perfil);
}
