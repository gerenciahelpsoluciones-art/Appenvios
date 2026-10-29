import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Check, Copy, Printer, CheckCircle2, ShieldCheck, Download, AlertCircle } from 'lucide-react';

interface PublicPropuestaViewProps {
  folio: string;
}

export default function PublicPropuestaView({ folio }: PublicPropuestaViewProps) {
  const [propuesta, setPropuesta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aceptada, setAceptada] = useState(false);
  const [aceptando, setAceptando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    async function loadPropuesta() {
      setLoading(true);
      try {
        const cleanFolio = decodeURIComponent(folio).trim();
        const { data, error } = await supabase
          .from('propuestas')
          .select('*')
          .or(`consecutivo.eq.${cleanFolio},id.eq.${cleanFolio}`)
          .maybeSingle();

        if (error) {
          console.error('Error cargando propuesta:', error);
        } else if (data) {
          setPropuesta(data);
          if (data.estado === 'Aceptada') {
            setAceptada(true);
          }
        }
      } catch (err) {
        console.error('Error general cargando propuesta:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPropuesta();
  }, [folio]);

  const handleAceptar = async () => {
    if (!propuesta) return;
    const confirm = window.confirm(`¿Confirma la aceptación formal de la propuesta ${propuesta.consecutivo} para ${propuesta.cliente_nombre}?`);
    if (!confirm) return;

    setAceptando(true);
    try {
      const { error } = await supabase
        .from('propuestas')
        .update({ estado: 'Aceptada' })
        .eq('id', propuesta.id);

      if (error) throw error;
      setAceptada(true);
      setPropuesta({ ...propuesta, estado: 'Aceptada' });
      alert('¡Propuesta aceptada con éxito! Se ha notificado al equipo comercial de Help Soluciones.');
    } catch (err) {
      console.error('Error aceptando propuesta:', err);
      alert('Hubo un error al registrar la aceptación. Por favor intente de nuevo.');
    } finally {
      setAceptando(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiado(true);
      setTimeout(() => setCopiado(null as any), 2500);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#64748b', fontSize: '0.9rem', fontFamily: 'Inter, sans-serif' }}>
        Cargando documento oficial de Help Soluciones...
      </div>
    );
  }

  if (!propuesta) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#334155', gap: '1rem', padding: '2rem', fontFamily: 'Inter, sans-serif' }}>
        <AlertCircle size={48} color="#dc2626" />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Propuesta no encontrada</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>El folio o enlace proporcionado no existe en HelpiCRM o ha expirado.</p>
        <a href="https://appenvios.vercel.app/" style={{ padding: '0.6rem 1.2rem', background: '#004A99', color: '#ffffff', borderRadius: '8px', fontWeight: 600, textDecoration: 'none' }}>
          Ir a HelpiCRM
        </a>
      </div>
    );
  }

  const isUsd = propuesta.moneda === 'USD' || ((Number(propuesta.valor) || 0) < 5000 && (Number(propuesta.valor) || 0) > 0);
  const formatMoney = (val: number | string) => {
    const n = Number(val) || 0;
    if (isUsd) {
      return `USD $${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${Math.round(n).toLocaleString('es-CO')}`;
  };

  const items: any[] = Array.isArray(propuesta.items) ? propuesta.items : [];
  const slas = propuesta.slas || {};
  const filasSla: any[] = Array.isArray(slas.filas) ? slas.filas : [];
  const notasSla: any[] = Array.isArray(slas.notas) ? slas.notas : [];

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', padding: '1.5rem', fontFamily: 'Inter, system-ui, sans-serif', color: '#1e293b' }}>
      
      {/* BARRA SUPERIOR DE ACCIONES (NO IMPRIMIBLE) */}
      <div className="no-print" style={{ maxWidth: '850px', margin: '0 auto 1.5rem auto', background: '#0f172a', color: '#ffffff', borderRadius: '12px', padding: '0.75rem 1.25rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, background: aceptada ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)', color: aceptada ? '#6ee7b7' : '#7dd3fc', border: `1px solid ${aceptada ? 'rgba(16, 185, 129, 0.3)' : 'rgba(56, 189, 248, 0.3)'}` }}>
            {aceptada ? '✓ Propuesta Aprobada' : 'Propuesta Oficial Activa'}
          </span>
          <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 500 }}>
            Folio: <strong style={{ color: '#ffffff' }}>#{propuesta.consecutivo}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleCopyLink}
            style={{ padding: '0.45rem 0.85rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            {copiado ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            {copiado ? 'Enlace Copiado' : 'Copiar Enlace'}
          </button>

          <button
            onClick={() => window.print()}
            style={{ padding: '0.45rem 0.85rem', background: '#004A99', borderRadius: '8px', color: '#ffffff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Printer size={14} />
            Imprimir / PDF
          </button>

          {!aceptada && (
            <button
              onClick={handleAceptar}
              disabled={aceptando}
              style={{ padding: '0.45rem 0.95rem', background: '#059669', borderRadius: '8px', color: '#ffffff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <CheckCircle2 size={14} />
              {aceptando ? 'Aceptando...' : 'Aceptar Propuesta'}
            </button>
          )}
        </div>
      </div>

      {/* DOCUMENTO EJECUTIVO CORPORATIVO */}
      <div className="sheet" style={{ maxWidth: '850px', margin: '0 auto', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
        
        {/* LÍNEA DE COLOR CORPORATIVO SUPERIOR */}
        <div style={{ height: '6px', background: 'linear-gradient(90deg, #001f3f 0%, #004A99 50%, #38bdf8 100%)' }}></div>

        <div style={{ padding: '2.5rem' }}>
          
          {/* HEADER CON LOGO Y DATOS LEGALES */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                <img src="/logo.png" alt="Help Soluciones" style={{ maxHeight: '48px', width: 'auto' }} onError={e => { (e.target as HTMLElement).style.display = 'none'; }} />
                <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#001f3f', letterSpacing: '-0.02em', margin: 0 }}>HELP SOLUCIONES</h1>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#475569', margin: '2px 0' }}><strong>HELP SOLUCIONES INFORMÁTICAS S.A.S.</strong></p>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0' }}>NIT: 900.567.892-1 · Régimen Común</p>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0' }}>Bogotá D.C., Colombia · PBX: (601) 304 335 8650</p>
              <p style={{ fontSize: '0.75rem', color: '#004A99', margin: '2px 0' }}>contacto@helpsoluciones.com.co · helpsoluciones.com.co</p>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', minWidth: '220px', fontSize: '0.75rem' }}>
              <div style={{ color: '#004A99', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                Documento Comercial
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: '#64748b' }}>Cotización:</span>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>#{propuesta.consecutivo}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: '#64748b' }}>Fecha:</span>
                <span style={{ fontWeight: 600 }}>{propuesta.fecha}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: '#64748b' }}>Vigencia:</span>
                <span style={{ fontWeight: 600 }}>{propuesta.vigencia || '15 Días'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Ciudad:</span>
                <span style={{ fontWeight: 600 }}>{propuesta.cliente_ciudad || 'Bogotá D.C.'}</span>
              </div>
            </div>
          </div>

          {/* DESTINATARIO */}
          <div style={{ background: '#f8fafc', borderLeft: '4px solid #004A99', padding: '1rem 1.25rem', borderRadius: '8px', marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
              Destinatario / Cliente Corporativo
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
              {propuesta.cliente_nombre}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.25rem' }}>
              NIT: {propuesta.cliente_nit || 'N/A'} · Atención: <strong>{propuesta.cliente_contacto || 'Gerencia General / TI'}</strong>
            </div>
          </div>

          {/* TÍTULO DE LA SOLUCIÓN */}
          <div style={{ marginBottom: '2rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#004A99', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#E6F0FF', padding: '0.25rem 0.6rem', borderRadius: '4px' }}>
              Propuesta Técnico-Comercial Oficial
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', marginTop: '0.6rem', lineHeight: 1.3 }}>
              {propuesta.tipo_servicio_nombre}
            </h2>
          </div>

          {/* OBJETIVO GENERAL */}
          {propuesta.objetivo && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#001f3f', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem' }}>
                1. Objetivo General
              </h3>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#334155', textAlign: 'justify', margin: 0 }}>
                {propuesta.objetivo}
              </p>
            </div>
          )}

          {/* CUADRO ECONÓMICO */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#001f3f', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem' }}>
              2. Propuesta Económica & Alcance de Inversión
            </h3>

            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>Descripción / Componente Técnico</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem 1rem', color: '#475569', fontWeight: 700, width: '70px' }}>Cant.</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem 1rem', color: '#475569', fontWeight: 700, width: '130px' }}>Vr. Unitario</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem 1rem', color: '#475569', fontWeight: 700, width: '130px' }}>Total ({propuesta.moneda})</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={it.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1rem', color: '#1e293b' }}>
                        <div style={{ fontWeight: 600 }}>{it.descripcion}</div>
                        {it.numPart && <div style={{ fontSize: '0.7rem', color: '#64748b' }}>P/N: {it.numPart}</div>}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem 1rem', color: '#475569' }}>{it.cantidad}</td>
                      <td style={{ textAlign: 'right', padding: '0.75rem 1rem', color: '#475569' }}>{formatMoney(it.valorUnitario)}</td>
                      <td style={{ textAlign: 'right', padding: '0.75rem 1rem', fontWeight: 700, color: '#004A99' }}>{formatMoney(it.cantidad * it.valorUnitario)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid #e2e8f0', background: '#f8fafc' }}>
                    <td colSpan={3} style={{ textAlign: 'right', padding: '0.6rem 1rem', fontWeight: 700, color: '#475569' }}>Subtotal Mensual:</td>
                    <td style={{ textAlign: 'right', padding: '0.6rem 1rem', fontWeight: 800, color: '#0f172a' }}>{formatMoney(propuesta.valor)}</td>
                  </tr>
                  <tr style={{ background: '#f8fafc' }}>
                    <td colSpan={3} style={{ textAlign: 'right', padding: '0.4rem 1rem', fontSize: '0.75rem', color: '#64748b' }}>
                      {propuesta.incluye_iva ? 'Impuesto al Valor Agregado (IVA 19%):' : 'Impuesto sobre las Ventas (Exento de IVA Art. 476 Num. 21 E.T.):'}
                    </td>
                    <td style={{ textAlign: 'right', padding: '0.4rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: propuesta.incluye_iva ? '#0f172a' : '#059669' }}>
                      {propuesta.incluye_iva ? formatMoney(propuesta.valor * 0.19) : 'Exento (0%)'}
                    </td>
                  </tr>
                  <tr style={{ background: '#E6F0FF' }}>
                    <td colSpan={3} style={{ textAlign: 'right', padding: '0.75rem 1rem', fontWeight: 900, color: '#001f3f', fontSize: '0.9rem' }}>TOTAL MENSUAL ({propuesta.moneda}):</td>
                    <td style={{ textAlign: 'right', padding: '0.75rem 1rem', fontWeight: 900, color: '#004A99', fontSize: '1rem' }}>
                      {formatMoney(propuesta.incluye_iva ? propuesta.valor * 1.19 : propuesta.valor)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {propuesta.observaciones && (
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.75rem', fontStyle: 'italic', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
                <strong>Condiciones comerciales:</strong> {propuesta.observaciones}
              </div>
            )}
          </div>

          {/* ACUERDOS DE NIVEL DE SERVICIO (SLA) */}
          {filasSla.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#001f3f', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem' }}>
                3. Acuerdos de Nivel de Servicio (SLA) & Tiempos de Respuesta
              </h3>
              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#475569' }}>Nivel de Criticidad</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#475569' }}>Descripción del Incidente</th>
                      <th style={{ textAlign: 'center', padding: '0.5rem 0.75rem', color: '#475569' }}>Tiempo de Respuesta</th>
                      <th style={{ textAlign: 'center', padding: '0.5rem 0.75rem', color: '#475569' }}>Tiempo de Solución</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filasSla.map((s, idx) => (
                      <tr key={s.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: s.criticidad === 'Crítica' ? '#dc2626' : s.criticidad === 'Alta' ? '#d97706' : '#2563eb' }}>
                          {s.criticidad}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', color: '#334155' }}>{s.descripcion}</td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 600 }}>{s.tiempoRespuesta}</td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 600 }}>{s.tiempoSolucion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {notasSla.length > 0 && (
                <ul style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
                  {notasSla.map((n, i) => n && <li key={i}>{n}</li>)}
                </ul>
              )}
            </div>
          )}

          {/* OBLIGACIONES DEL CLIENTE */}
          {propuesta.obligaciones_cliente && propuesta.obligaciones_cliente.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#001f3f', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem' }}>
                4. Requisitos y Obligaciones del Cliente
              </h3>
              <ul style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.6, paddingLeft: '1.25rem' }}>
                {propuesta.obligaciones_cliente.map((ob: string, i: number) => (
                  <li key={i}>{ob}</li>
                ))}
              </ul>
            </div>
          )}

          {/* FIRMAS Y ACEPTACIÓN */}
          <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '2px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
            <div>
              <div style={{ height: '50px' }}></div>
              <div style={{ borderTop: '1px solid #334155', paddingTop: '0.5rem' }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>{propuesta.comercial_nombre || 'Carlos Arturo Sáenz'}</p>
                <p style={{ margin: '2px 0', fontSize: '0.75rem', color: '#475569' }}>Gerente General / Consultor TI</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#004A99', fontWeight: 600 }}>Help Soluciones Informáticas S.A.S.</p>
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Móvil: {propuesta.comercial_telefono || '304 335 8650'}</p>
              </div>
            </div>

            <div>
              <div style={{ height: '50px' }}></div>
              <div style={{ borderTop: '1px solid #334155', paddingTop: '0.5rem' }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>{propuesta.cliente_contacto || 'Atención Gerencia'}</p>
                <p style={{ margin: '2px 0', fontSize: '0.75rem', color: '#475569' }}>Aceptado por el Cliente</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#0f172a', fontWeight: 600 }}>{propuesta.cliente_nombre}</p>
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>NIT: {propuesta.cliente_nit || 'Pendiente'}</p>
              </div>
            </div>
          </div>

        </div>

      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; padding: 0 !important; }
          .sheet { border: none !important; box-shadow: none !important; margin: 0 !important; max-width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
