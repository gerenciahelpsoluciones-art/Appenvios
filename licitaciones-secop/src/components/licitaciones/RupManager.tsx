import { useState, useRef } from 'react';
import type { RupData, CodigoUNSPSC, CertificacionRUP } from '../../types/licitaciones.types';
import { extractRupData } from '../../services/licitacionesAI';
import { getRupData, saveRupData } from './store';

type SupportedMediaType = 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

const ACCEPTED = '.pdf,.jpg,.jpeg,.png,.webp';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getMediaType(file: File): SupportedMediaType {
  const map: Record<string, SupportedMediaType> = {
    'application/pdf': 'application/pdf',
    'image/jpeg': 'image/jpeg',
    'image/jpg': 'image/jpeg',
    'image/png': 'image/png',
    'image/webp': 'image/webp',
    'image/gif': 'image/gif',
  };
  return map[file.type] ?? 'image/jpeg';
}

function formatCOP(v: number): string {
  if (!v) return 'N/A';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function CodigoChip({ codigo }: { codigo: CodigoUNSPSC }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen(!open)}
      style={{
        padding: '0.3rem 0.6rem',
        background: 'rgba(59,130,246,0.12)',
        border: '1px solid rgba(59,130,246,0.3)',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.75rem',
        transition: 'all 0.15s',
      }}
    >
      <span style={{ fontWeight: 700, color: '#60a5fa', fontFamily: 'Fira Code, monospace' }}>
        {codigo.codigo}
      </span>
      {open && (
        <div style={{ marginTop: '0.25rem', color: 'hsl(var(--text-muted))', fontSize: '0.7rem', lineHeight: 1.4 }}>
          {codigo.descripcion}
          {codigo.segmento && <div>Segmento: {codigo.segmento}</div>}
          {codigo.familia && <div>Familia: {codigo.familia}</div>}
          {codigo.clase && <div>Clase: {codigo.clase}</div>}
        </div>
      )}
    </div>
  );
}

function CertCard({ cert }: { cert: CertificacionRUP }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid var(--glass-border)',
      borderRadius: '8px',
      padding: '0.85rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: '0 0 0.2rem', fontSize: '0.85rem', fontWeight: 700, color: 'hsl(var(--text-main))' }}>
            {cert.entidad}
          </p>
          <p style={{ margin: '0 0 0.4rem', fontSize: '0.78rem', color: 'hsl(var(--text-muted))', lineHeight: 1.4 }}>
            {cert.objeto}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.72rem', color: 'hsl(var(--text-muted))', flexWrap: 'wrap' }}>
            {cert.numero_contrato && <span>📋 {cert.numero_contrato}</span>}
            {cert.fecha_inicio && <span>📅 {cert.fecha_inicio}{cert.fecha_fin ? ` → ${cert.fecha_fin}` : ''}</span>}
            {cert.codigos_unspsc?.length ? (
              <span style={{ color: '#60a5fa' }}>
                🏷️ {cert.codigos_unspsc.join(' · ')}
              </span>
            ) : null}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#10b981' }}>
            {formatCOP(cert.valor)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Upload zone ─────────────────────────────────────────────────────────────

function UploadZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f =>
      ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(f.type)
    );
    if (files.length) onFiles(files);
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragging ? '#3b82f6' : 'var(--glass-border)'}`,
        borderRadius: '12px',
        padding: '2.5rem',
        textAlign: 'center',
        cursor: 'pointer',
        background: dragging ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.02)',
        transition: 'all 0.2s',
      }}
    >
      <input ref={inputRef} type="file" accept={ACCEPTED} multiple hidden
        onChange={e => { if (e.target.files) onFiles(Array.from(e.target.files)); }} />
      <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📎</div>
      <p style={{ margin: '0 0 0.35rem', fontSize: '0.95rem', fontWeight: 700, color: 'hsl(var(--text-main))' }}>
        Arrastra tu RUP aquí o haz clic para seleccionar
      </p>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
        PDF, JPG, PNG — Certificado RUP, Acreditación de experiencia, Resolución de inscripción
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RupManager() {
  const [rup, setRup] = useState<RupData>(getRupData());
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState<'codigos' | 'certificaciones' | 'financiero'>('codigos');
  const [searchCodigo, setSearchCodigo] = useState('');
  const [saved, setSaved] = useState(false);

  const handleFiles = async (files: File[]) => {
    setError('');
    for (const file of files) {
      setProcessing(`Procesando "${file.name}"...`);
      try {
        const base64 = await fileToBase64(file);
        const mediaType = getMediaType(file);
        const extracted = await extractRupData(base64, mediaType, file.name);

        setRup(prev => {
          const codigosExistentes = new Set(prev.codigos_unspsc.map(c => c.codigo));
          const nuevosCodigos = (extracted.codigos_unspsc || []).filter(c => !codigosExistentes.has(c.codigo));

          const certExistentes = new Set(
            prev.certificaciones.map(c => `${c.entidad}|${c.objeto.substring(0, 30)}`)
          );
          const nuevasCerts = (extracted.certificaciones || []).filter(c =>
            !certExistentes.has(`${c.entidad}|${c.objeto.substring(0, 30)}`)
          );

          const updated: RupData = {
            nit: extracted.nit || prev.nit,
            razon_social: extracted.razon_social || prev.razon_social,
            fecha_inscripcion: extracted.fecha_inscripcion || prev.fecha_inscripcion,
            fecha_renovacion: extracted.fecha_renovacion || prev.fecha_renovacion,
            codigos_unspsc: [...prev.codigos_unspsc, ...nuevosCodigos],
            certificaciones: [...prev.certificaciones, ...nuevasCerts],
            capacidad_financiera: extracted.capacidad_financiera ?? prev.capacidad_financiera,
            archivos_procesados: [
              ...prev.archivos_procesados,
              ...(extracted.archivos_procesados || []),
            ],
            ultima_actualizacion: new Date().toISOString(),
          };
          saveRupData(updated);
          return updated;
        });
      } catch (e) {
        setError(`Error procesando "${file.name}": ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    setProcessing(null);
  };

  const handleSave = () => {
    saveRupData(rup);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearRup = () => {
    if (!confirm('¿Borrar todos los datos RUP cargados?')) return;
    const empty: RupData = {
      nit: '', razon_social: '', codigos_unspsc: [], certificaciones: [],
      archivos_procesados: [], ultima_actualizacion: '',
    };
    saveRupData(empty);
    setRup(empty);
  };

  const handleDeleteCodigo = (codigo: string) => {
    setRup(prev => {
      const updated = { ...prev, codigos_unspsc: prev.codigos_unspsc.filter(c => c.codigo !== codigo) };
      saveRupData(updated);
      return updated;
    });
  };

  const handleDeleteCert = (idx: number) => {
    setRup(prev => {
      const updated = { ...prev, certificaciones: prev.certificaciones.filter((_, i) => i !== idx) };
      saveRupData(updated);
      return updated;
    });
  };

  const codigosFiltrados = rup.codigos_unspsc.filter(c =>
    !searchCodigo || c.codigo.includes(searchCodigo) || c.descripcion.toLowerCase().includes(searchCodigo.toLowerCase())
  );

  const hasData = rup.codigos_unspsc.length > 0 || rup.certificaciones.length > 0 || rup.nit;

  const cardStyle: React.CSSProperties = {
    background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.25rem',
  };

  const tabBtn = (id: typeof activeSection, label: string, count: number, color: string) => (
    <button
      onClick={() => setActiveSection(id)}
      style={{
        padding: '0.45rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: activeSection === id ? 700 : 500,
        border: `1px solid ${activeSection === id ? color : 'var(--glass-border)'}`,
        background: activeSection === id ? `${color}22` : 'transparent',
        color: activeSection === id ? color : 'hsl(var(--text-muted))',
        boxShadow: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem',
      }}
    >
      {label}
      {count > 0 && (
        <span style={{ background: `${color}44`, borderRadius: '10px', padding: '0.05rem 0.45rem', fontSize: '0.7rem', fontWeight: 800 }}>
          {count}
        </span>
      )}
    </button>
  );

  const inputStyle: React.CSSProperties = {
    padding: '0.45rem 0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
    borderRadius: '8px', color: 'hsl(var(--text-main))', fontSize: '0.85rem', outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Header info */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 700, color: 'hsl(var(--text-main))' }}>
              📂 Gestión RUP — Registro Único de Proponentes
            </h3>
            <p style={{ margin: 0, fontSize: '0.825rem', color: 'hsl(var(--text-muted))' }}>
              Sube tu certificado RUP o documentos de experiencia. Claude extrae automáticamente los códigos UNSPSC
              y certificaciones para usarlos en el análisis de compatibilidad con procesos SECOP.
            </p>
          </div>
          {hasData && (
            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              <button onClick={handleSave}
                style={{ padding: '0.45rem 1rem', background: saved ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)', border: `1px solid ${saved ? 'rgba(16,185,129,0.5)' : 'rgba(16,185,129,0.3)'}`, borderRadius: '8px', color: '#10b981', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', boxShadow: 'none' }}>
                {saved ? '✅ Guardado' : '💾 Guardar'}
              </button>
              <button onClick={handleClearRup}
                style={{ padding: '0.45rem 1rem', background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', boxShadow: 'none' }}>
                🗑️ Limpiar
              </button>
            </div>
          )}
        </div>

        {/* Empresa info */}
        {rup.nit && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>PROPONENTE</p>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'hsl(var(--text-main))' }}>{rup.razon_social}</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>NIT: {rup.nit}</p>
            </div>
            {rup.fecha_renovacion && (
              <div>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>VIGENCIA RUP</p>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#10b981' }}>{rup.fecha_renovacion}</p>
              </div>
            )}
            {rup.capacidad_financiera?.k_contratacion ? (
              <div>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>K DE CONTRATACIÓN</p>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#f59e0b' }}>{formatCOP(rup.capacidad_financiera.k_contratacion)}</p>
              </div>
            ) : null}
            <div>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>ARCHIVOS PROCESADOS</p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
                {rup.archivos_procesados.length} archivo{rup.archivos_procesados.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Upload zone */}
      <UploadZone onFiles={handleFiles} />

      {/* Processing indicator */}
      {processing && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: '#a78bfa' }}>
          <span style={{ fontSize: '1.2rem', animation: 'spin 1s linear infinite' }}>⚙️</span>
          <div>
            <strong>Claude está analizando el documento...</strong>
            <div style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))', marginTop: '0.15rem' }}>{processing}</div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', fontSize: '0.875rem', color: '#fca5a5' }}>
          ❌ {error}
        </div>
      )}

      {/* Stats */}
      {hasData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {[
            { label: 'Códigos UNSPSC', value: rup.codigos_unspsc.length, color: '#3b82f6', icon: '🏷️' },
            { label: 'Certificaciones', value: rup.certificaciones.length, color: '#10b981', icon: '📜' },
            { label: 'Valor total acreditado', value: formatCOP(rup.certificaciones.reduce((s, c) => s + (c.valor || 0), 0)), color: '#f59e0b', icon: '💰' },
            { label: 'Documentos subidos', value: rup.archivos_procesados.length, color: '#8b5cf6', icon: '📂' },
          ].map(s => (
            <div key={s.label} style={{ background: `${s.color}12`, border: `1px solid ${s.color}30`, borderRadius: '10px', padding: '0.85rem' }}>
              <div style={{ fontSize: '1.1rem', marginBottom: '0.15rem' }}>{s.icon}</div>
              <div style={{ fontSize: typeof s.value === 'number' ? '1.4rem' : '0.95rem', fontWeight: 800, color: s.color, lineHeight: 1.2 }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', marginTop: '0.15rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Data tabs */}
      {hasData && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {tabBtn('codigos', '🏷️ Códigos UNSPSC', rup.codigos_unspsc.length, '#3b82f6')}
            {tabBtn('certificaciones', '📜 Certificaciones', rup.certificaciones.length, '#10b981')}
            {tabBtn('financiero', '💰 Capacidad Financiera', 0, '#f59e0b')}
          </div>

          {/* Códigos UNSPSC */}
          {activeSection === 'codigos' && (
            <div>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  style={{ ...inputStyle, flex: 1, minWidth: 200 }}
                  placeholder="Buscar código o descripción..."
                  value={searchCodigo}
                  onChange={e => setSearchCodigo(e.target.value)}
                />
                <span style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))' }}>
                  {codigosFiltrados.length} de {rup.codigos_unspsc.length} — clic para ver descripción
                </span>
              </div>

              {codigosFiltrados.length === 0 ? (
                <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>No se encontraron códigos.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: 380, overflowY: 'auto', padding: '0.25rem' }}>
                  {codigosFiltrados.map((c) => (
                    <div key={c.codigo} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.2rem' }}>
                      <CodigoChip codigo={c} />
                      <button
                        onClick={() => handleDeleteCodigo(c.codigo)}
                        style={{ padding: '0.3rem 0.35rem', background: 'transparent', border: 'none', color: 'rgba(239,68,68,0.5)', cursor: 'pointer', fontSize: '0.65rem', boxShadow: 'none', lineHeight: 1 }}
                        title="Eliminar código"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Certificaciones */}
          {activeSection === 'certificaciones' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: 460, overflowY: 'auto' }}>
              {rup.certificaciones.length === 0 ? (
                <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>No hay certificaciones cargadas.</p>
              ) : rup.certificaciones.map((cert, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  <CertCard cert={cert} />
                  <button
                    onClick={() => handleDeleteCert(idx)}
                    style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', padding: '0.2rem 0.4rem', background: 'transparent', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '4px', color: '#f87171', cursor: 'pointer', fontSize: '0.7rem', boxShadow: 'none' }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Capacidad financiera */}
          {activeSection === 'financiero' && (
            <div>
              {rup.capacidad_financiera ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  {[
                    { label: 'K de Contratación', value: formatCOP(rup.capacidad_financiera.k_contratacion ?? 0), color: '#f59e0b', icon: '🔑' },
                    { label: 'Índice de Liquidez', value: rup.capacidad_financiera.liquidez ? rup.capacidad_financiera.liquidez.toFixed(2) : 'N/A', color: '#3b82f6', icon: '💧' },
                    { label: 'Nivel de Endeudamiento', value: rup.capacidad_financiera.endeudamiento ? (rup.capacidad_financiera.endeudamiento * 100).toFixed(1) + '%' : 'N/A', color: '#ef4444', icon: '📊' },
                    { label: 'Rentabilidad', value: rup.capacidad_financiera.rentabilidad ? (rup.capacidad_financiera.rentabilidad * 100).toFixed(1) + '%' : 'N/A', color: '#10b981', icon: '📈' },
                  ].map(s => (
                    <div key={s.label} style={{ background: `${s.color}12`, border: `1px solid ${s.color}25`, borderRadius: '10px', padding: '1rem' }}>
                      <div style={{ fontSize: '1.3rem', marginBottom: '0.35rem' }}>{s.icon}</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', marginTop: '0.2rem' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
                  No se encontraron datos de capacidad financiera en los documentos procesados.
                  Asegúrate de subir el certificado RUP completo.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Archivos procesados */}
      {rup.archivos_procesados.length > 0 && (
        <div style={{ ...cardStyle, padding: '0.85rem 1.25rem' }}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>
            DOCUMENTOS PROCESADOS
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {rup.archivos_procesados.map((a, i) => (
              <span key={i} style={{ padding: '0.25rem 0.65rem', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '20px', fontSize: '0.75rem', color: '#c4b5fd' }}>
                📄 {a.nombre}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasData && !processing && (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem', color: 'hsl(var(--text-muted))' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📋</div>
          <p style={{ fontWeight: 600, color: 'hsl(var(--text-main))', margin: '0 0 0.5rem' }}>
            Aún no has cargado tu RUP
          </p>
          <p style={{ fontSize: '0.85rem', margin: '0 0 1.25rem' }}>
            Sube el certificado RUP de la Cámara de Comercio o cualquier documento de acreditación
            de experiencia. Claude extraerá automáticamente los códigos UNSPSC y certificaciones.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
            {['📄 Certificado RUP vigente', '📊 Acreditación de experiencia', '🏷️ Inscripción SECOP', '📋 Resolución de clasificación'].map(t => (
              <span key={t} style={{ padding: '0.3rem 0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', borderRadius: '20px' }}>{t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
