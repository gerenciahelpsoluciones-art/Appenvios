import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Check, Copy, Printer, CheckCircle2, ShieldCheck, Download, AlertCircle, ExternalLink, ArrowRight, Server, HardDrive, Shield, Lock, Cloud, RefreshCw, FileText, Clock, AlertTriangle, Users, ChevronDown } from 'lucide-react';

interface PublicPropuestaViewProps {
  folio: string;
}

export default function PublicPropuestaView({ folio }: PublicPropuestaViewProps) {
  const [propuesta, setPropuesta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aceptada, setAceptada] = useState(false);
  const [aceptando, setAceptando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [activeTab, setActiveTab] = useState('resumen');

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
      alert('¡Propuesta aceptada con éxito! Se ha notificado a la Gerencia de Help Soluciones Informáticas.');
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
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#eef1f5', color: '#566173', fontSize: '0.95rem', fontFamily: 'Switzer, system-ui, sans-serif' }}>
        <RefreshCw size={28} className="animate-spin" style={{ marginBottom: '12px', color: '#2563ea' }} />
        <span>Cargando propuesta ejecutiva de Help Soluciones...</span>
      </div>
    );
  }

  if (!propuesta) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#eef1f5', color: '#121a26', gap: '1rem', padding: '2rem', fontFamily: 'Switzer, system-ui, sans-serif' }}>
        <AlertCircle size={48} color="#c81e1e" />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Propuesta no encontrada</h2>
        <p style={{ color: '#566173', fontSize: '0.95rem', textAlign: 'center', maxWidth: '450px' }}>
          El folio o enlace proporcionado no existe en HelpiCRM o ha expirado. Verifique el consecutivo o contacte a su asesor comercial.
        </p>
        <a href="https://appenvios.vercel.app/" style={{ padding: '0.7rem 1.4rem', background: '#101822', color: '#ffffff', borderRadius: '8px', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}>
          Volver a HelpiCRM
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

  const isCloudBackup = propuesta.tipo_servicio === 'cloud-backup' || 
                        (propuesta.tipo_servicio_nombre && propuesta.tipo_servicio_nombre.toLowerCase().includes('backup')) ||
                        (propuesta.tipo_servicio_nombre && propuesta.tipo_servicio_nombre.toLowerCase().includes('cloud')) ||
                        propuesta.consecutivo === 'P-005';

  const items: any[] = Array.isArray(propuesta.items) && propuesta.items.length > 0 
    ? propuesta.items 
    : [
        { descripcion: 'Licenciamiento Agente Acronis Cyber Protect (Servidores Windows/Linux)', cantidad: 2, valorUnitario: 54.00 },
        { descripcion: 'Licenciamiento Agente Acronis Cyber Protect (Estaciones de Trabajo)', cantidad: 8, valorUnitario: 14.40 },
        { descripcion: 'Almacenamiento Cloud Seguro en Nube Inmutable Acronis (1.000 GB / 1 TB)', cantidad: 1000, valorUnitario: 0.09 },
        { descripcion: 'Monitoreo Proactivo 24/7, Gestión de Alertas y Pruebas Semestrales de Recuperación', cantidad: 1, valorUnitario: 32.40 }
      ];

  const subtotal = items.reduce((acc, it) => acc + (Number(it.cantidad) || 1) * (Number(it.valorUnitario) || 0), 0) || Number(propuesta.valor) || 345.60;
  const isIvaExento = !propuesta.incluye_iva || isCloudBackup;
  const iva = isIvaExento ? 0 : subtotal * 0.19;
  const total = subtotal + iva;

  return (
    <div className="sarvi-shell-container">
      
      {/* ESTILOS SWISS EXACTOS DE SARVI LOGÍSTICA */}
      <style>{`
        :root {
          --paper: #ffffff;
          --ground: #eef1f5;
          --soft-bg: #f4f6f9;
          --ink: #121a26;
          --soft: #566173;
          --faint: #e3e8ef;
          --navy: #101822;
          --blue: #2563ea;
          --sky: #38bdf8;
          --pale: #e3ecfd;
          --ok: #166534;
          --ok-bg: #dcf3e4;
          --warn: #9a5b06;
          --warn-bg: #fcf0cf;
          --bad: #c81e1e;
          --bad-bg: #fbe0e0;
          --f: "Switzer", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          --r: 10px;
        }

        .sarvi-shell-container {
          background: var(--ground);
          color: var(--ink);
          font-family: var(--f);
          font-size: 1.05rem;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
          min-height: 100vh;
        }

        .shell {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px 20px 60px 20px;
          display: grid;
          grid-template-columns: 220px minmax(0, 1fr);
          gap: 36px;
          align-items: start;
        }

        @media (max-width: 960px) {
          .shell {
            grid-template-columns: 1fr;
            gap: 20px;
            padding: 16px;
          }
          .toc {
            display: none !important;
          }
        }

        /* BARRA FLOTANTE DE ACCIÓN */
        .top-action-bar {
          background: var(--navy);
          color: #ffffff;
          border-radius: var(--r);
          padding: 12px 20px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          box-shadow: 0 4px 14px rgba(0,0,0,0.08);
        }

        .top-action-bar .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 0.82rem;
          font-weight: 600;
          background: rgba(37, 99, 234, 0.25);
          color: #93c5fd;
          border: 1px solid rgba(147, 197, 253, 0.3);
        }

        .top-action-bar .status-pill.accepted {
          background: rgba(22, 101, 52, 0.3);
          color: #86efac;
          border: 1px solid rgba(134, 239, 172, 0.3);
        }

        .btn-action {
          padding: 8px 16px;
          font-size: 0.85rem;
          font-weight: 600;
          border-radius: 7px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          border: none;
        }

        .btn-copy {
          background: #1e293b;
          color: #ffffff;
          border: 1px solid #334155;
        }
        .btn-copy:hover {
          background: #334155;
        }

        .btn-print {
          background: var(--blue);
          color: #ffffff;
        }
        .btn-print:hover {
          background: #1d4ed8;
        }

        .btn-accept {
          background: #16a34a;
          color: #ffffff;
        }
        .btn-accept:hover {
          background: #15803d;
        }

        /* TOC LATERAL FIJO */
        .toc {
          position: sticky;
          top: 24px;
          display: grid;
          gap: 4px;
          font-size: 0.93rem;
        }

        .toc .brand-card {
          background: var(--paper);
          padding: 16px;
          border-radius: var(--r);
          margin-bottom: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }

        .toc .brand-card h4 {
          margin: 0 0 2px 0;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--navy);
          letter-spacing: -0.01em;
        }

        .toc .brand-card p {
          margin: 0;
          font-size: 0.78rem;
          color: var(--soft);
        }

        .toc a {
          color: var(--soft);
          text-decoration: none;
          padding: 8px 12px;
          border-radius: 6px;
          transition: background 0.15s, color 0.15s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .toc a:hover {
          color: var(--ink);
          background: var(--paper);
        }

        .toc a.active {
          color: var(--blue);
          background: var(--paper);
          font-weight: 600;
        }

        /* DOCUMENTO PRINCIPAL */
        .doc {
          background: var(--paper);
          border-radius: 16px;
          padding: clamp(24px, 4vw, 56px);
          min-width: 0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
        }

        h1, h2, h3 {
          margin: 0;
          letter-spacing: -0.025em;
          color: var(--ink);
        }

        h1 {
          font-size: clamp(1.8rem, 1.4rem + 2vw, 2.75rem);
          font-weight: 700;
          line-height: 1.08;
        }

        h2 {
          font-size: clamp(1.4rem, 1.1rem + 1vw, 1.85rem);
          font-weight: 600;
          line-height: 1.2;
          border-bottom: 2px solid var(--faint);
          padding-bottom: 12px;
          margin-bottom: 20px;
        }

        h3 {
          font-size: 1.15rem;
          font-weight: 600;
          line-height: 1.3;
        }

        section {
          padding-top: 48px;
          display: grid;
          gap: 20px;
          scroll-margin-top: 24px;
        }

        section:first-of-type {
          padding-top: 0;
        }

        .kicker {
          color: var(--blue);
          font-size: 0.9rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* META GRID */
        .meta {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        @media (max-width: 768px) {
          .meta {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        .meta div {
          background: var(--soft-bg);
          border-radius: var(--r);
          padding: 14px 16px;
          font-size: 0.88rem;
          color: var(--soft);
        }

        .meta b {
          display: block;
          color: var(--ink);
          font-weight: 600;
          font-size: 0.98rem;
          margin-top: 2px;
        }

        /* SUMMARY KPI CARDS */
        .summary {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        @media (max-width: 768px) {
          .summary {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        .summary div {
          border-radius: var(--r);
          padding: 18px;
          background: var(--pale);
        }

        .summary div:first-child {
          background: var(--navy);
          color: #ffffff;
        }

        .summary div:first-child span {
          color: #94a3b8;
        }

        .summary strong {
          display: block;
          font-size: 1.85rem;
          font-weight: 700;
          letter-spacing: -0.04em;
          line-height: 1.1;
          font-variant-numeric: tabular-nums;
          margin-bottom: 4px;
        }

        .summary span {
          font-size: 0.88rem;
          color: var(--soft);
        }

        /* FRENTES DE LA SOLUCIÓN */
        .fronts {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        @media (max-width: 640px) {
          .fronts {
            grid-template-columns: 1fr;
          }
        }

        .fronts div {
          padding: 18px 20px;
          border-radius: var(--r);
          background: var(--soft-bg);
          display: grid;
          gap: 6px;
          transition: background 0.2s, transform 0.2s;
        }

        .fronts div:hover {
          background: var(--pale);
          transform: translateY(-2px);
        }

        .fronts b {
          font-weight: 600;
          color: var(--ink);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .fronts span {
          color: var(--soft);
          font-size: 0.92rem;
          line-height: 1.5;
        }

        /* DIAGRAMA Y FLUJO VISUAL */
        .flow-container {
          background: var(--soft-bg);
          border-radius: var(--r);
          padding: 24px;
          overflow-x: auto;
        }

        .flow-pipeline {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          min-width: 680px;
        }

        .flow-node {
          background: var(--paper);
          border-radius: var(--r);
          padding: 16px;
          flex: 1;
          border: 1px solid var(--faint);
          box-shadow: 0 2px 6px rgba(0,0,0,0.02);
          text-align: center;
        }

        .flow-node.highlight {
          background: var(--navy);
          color: #ffffff;
          border-color: var(--navy);
        }

        .flow-node.highlight p {
          color: #94a3b8;
        }

        .flow-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--blue);
          font-weight: 700;
        }

        /* ACORDEONES DE CONTINGENCIA */
        .contingency-acc details {
          background: var(--soft-bg);
          border-radius: var(--r);
          padding: 14px 18px;
          margin-bottom: 10px;
          transition: all 0.2s ease;
        }

        .contingency-acc details[open] {
          background: var(--pale);
        }

        .contingency-acc summary {
          font-weight: 600;
          cursor: pointer;
          color: var(--ink);
          display: flex;
          justify-content: space-between;
          align-items: center;
          user-select: none;
        }

        .contingency-acc summary::-webkit-details-marker {
          display: none;
        }

        .contingency-acc p {
          margin-top: 10px;
          font-size: 0.92rem;
          color: var(--soft);
          line-height: 1.6;
        }

        /* TABLA DE INVERSIÓN */
        .tbl {
          overflow-x: auto;
          border-radius: var(--r);
          background: var(--paper);
          box-shadow: inset 0 0 0 1px var(--faint);
        }

        table {
          border-collapse: collapse;
          width: 100%;
          font-size: 0.92rem;
        }

        th, td {
          padding: 14px 18px;
          text-align: left;
          vertical-align: top;
          border-bottom: 1px solid var(--faint);
        }

        thead th {
          font-weight: 600;
          color: var(--soft);
          background: var(--soft-bg);
          text-transform: uppercase;
          font-size: 0.8rem;
          letter-spacing: 0.04em;
        }

        tbody tr:last-child td {
          border-bottom: 0;
        }

        td small {
          display: block;
          color: var(--soft);
          margin-top: 4px;
          font-size: 0.82rem;
        }

        .tot td {
          background: var(--soft-bg);
          font-weight: 700;
          font-size: 1rem;
        }

        .p-badge {
          display: inline-block;
          font-weight: 600;
          font-size: 0.8rem;
          padding: 3px 8px;
          border-radius: 6px;
          white-space: nowrap;
        }
        .p-bad { background: var(--bad-bg); color: var(--bad); }
        .p-warn { background: var(--warn-bg); color: var(--warn); }
        .p-ok { background: var(--ok-bg); color: var(--ok); }

        /* CIERRE Y FIRMAS */
        .sign {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-top: 40px;
          padding-top: 24px;
          border-top: 2px solid var(--faint);
        }

        @media (max-width: 640px) {
          .sign {
            grid-template-columns: 1fr;
          }
        }

        .signature-box {
          border-top: 1px solid var(--ink);
          padding-top: 10px;
          margin-top: 48px;
        }

        @media print {
          .no-print, .toc, .top-action-bar { display: none !important; }
          .sarvi-shell-container { background: #ffffff !important; }
          .shell { display: block !important; padding: 0 !important; max-width: 100% !important; }
          .doc { padding: 0 !important; border-radius: 0 !important; box-shadow: none !important; }
        }
      `}</style>

      {/* CONTENEDOR PRINCIPAL DOS COLUMNAS */}
      <div className="shell">

        {/* SIDEBAR DE NAVEGACIÓN Y ACCIÓN RÁPIDA (TOC) */}
        <nav className="toc no-print" aria-label="Índice de la propuesta">
          <div className="brand-card">
            <h4>Help Soluciones</h4>
            <p>Propuesta Comercial Oficial</p>
            <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--blue)', fontWeight: 600 }}>
              #{propuesta.consecutivo}
            </div>
          </div>

          <a href="#resumen" className={activeTab === 'resumen' ? 'active' : ''} onClick={() => setActiveTab('resumen')}>
            <FileText size={16} /> Resumen Ejecutivo
          </a>
          <a href="#alcance" className={activeTab === 'alcance' ? 'active' : ''} onClick={() => setActiveTab('alcance')}>
            <ShieldCheck size={16} /> Alcance Técnico
          </a>
          <a href="#flujo" className={activeTab === 'flujo' ? 'active' : ''} onClick={() => setActiveTab('flujo')}>
            <Cloud size={16} /> Flujo de Respaldo
          </a>
          <a href="#escenarios" className={activeTab === 'escenarios' ? 'active' : ''} onClick={() => setActiveTab('escenarios')}>
            <AlertTriangle size={16} /> Contingencias
          </a>
          <a href="#inversion" className={activeTab === 'inversion' ? 'active' : ''} onClick={() => setActiveTab('inversion')}>
            <Lock size={16} /> Inversión & Pagos
          </a>
          {propuesta.slas && (
            <a href="#sla" className={activeTab === 'sla' ? 'active' : ''} onClick={() => setActiveTab('sla')}>
              <Clock size={16} /> Tiempos & SLAs
            </a>
          )}
          <a href="#aprobacion" className={activeTab === 'aprobacion' ? 'active' : ''} onClick={() => setActiveTab('aprobacion')}>
            <CheckCircle2 size={16} /> Aprobación & Firmas
          </a>

          <div style={{ marginTop: '20px', padding: '14px', background: 'var(--soft-bg)', borderRadius: 'var(--r)', fontSize: '0.8rem', color: 'var(--soft)' }}>
            <p style={{ margin: 0, fontWeight: 600, color: 'var(--ink)' }}>Asesor Comercial</p>
            <p style={{ margin: '2px 0 0 0' }}>Carlos Arturo Sáenz</p>
            <p style={{ margin: '2px 0 0 0' }}>PBX: (601) 304 335 8650</p>
          </div>
        </nav>

        {/* CONTENIDO DEL DOCUMENTO */}
        <main className="doc">

          {/* BARRA SUPERIOR DE ACCIONES */}
          <div className="top-action-bar no-print">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className={`status-pill ${aceptada ? 'accepted' : ''}`}>
                {aceptada ? '✓ Propuesta Aprobada' : 'Propuesta Oficial Activa'}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                Folio: <strong style={{ color: '#ffffff' }}>#{propuesta.consecutivo}</strong>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={handleCopyLink} className="btn-action btn-copy" title="Copiar enlace para el cliente">
                {copiado ? <Check size={14} color="#86efac" /> : <Copy size={14} />}
                {copiado ? 'Enlace Copiado' : 'Copiar Enlace'}
              </button>

              <button onClick={() => window.print()} className="btn-action btn-print" title="Descargar como PDF o imprimir">
                <Printer size={14} /> Imprimir / PDF
              </button>

              {!aceptada && (
                <button onClick={handleAceptar} disabled={aceptando} className="btn-action btn-accept" title="Aceptar propuesta digitalmente">
                  <CheckCircle2 size={14} /> {aceptando ? 'Registrando...' : 'Aceptar Propuesta'}
                </button>
              )}
            </div>
          </div>

          {/* SECCIÓN 1: RESUMEN Y PORTADA */}
          <section id="resumen">
            <div className="kicker">
              {isCloudBackup ? 'Solución de Ciberprotección & Respaldo Inmutable' : 'Propuesta Técnico-Comercial'}
            </div>
            <h1>
              {isCloudBackup ? (
                <>Acronis Cyber Protect Cloud: <span style={{ color: 'var(--blue)' }}>{propuesta.cliente_nombre}</span></>
              ) : (
                propuesta.tipo_servicio_nombre || 'Propuesta de Servicio Técnico'
              )}
            </h1>
            <p style={{ color: 'var(--soft)', fontSize: '1.05rem', margin: 0 }}>
              {propuesta.objetivo || 'Implementación y administración de servicios de tecnología con garantía de disponibilidad, soporte proactivo y continuidad operativa.'}
            </p>

            {/* METADATOS EN CUADRÍCULA */}
            <div className="meta">
              <div>
                Cliente Corporativo
                <b>{propuesta.cliente_nombre}</b>
                <span style={{ fontSize: '0.78rem' }}>NIT: {propuesta.cliente_nit || '860038563-1'}</span>
              </div>
              <div>
                Cotización / Folio
                <b>#{propuesta.consecutivo}</b>
                <span style={{ fontSize: '0.78rem' }}>Fecha: {propuesta.fecha}</span>
              </div>
              <div>
                Vigencia de la Oferta
                <b>{propuesta.vigencia || '15 Días Hábiles'}</b>
                <span style={{ fontSize: '0.78rem' }}>Ciudad: {propuesta.cliente_ciudad || 'Bogotá D.C.'}</span>
              </div>
              <div>
                Atención Comercial
                <b>{propuesta.cliente_contacto || 'Gerencia General / TI'}</b>
                <span style={{ fontSize: '0.78rem' }}>Help Soluciones Informáticas</span>
              </div>
            </div>

            {/* TARJETAS KPI DE IMPACTO */}
            <div className="summary">
              <div>
                <strong>{formatMoney(propuesta.valor || total)}</strong>
                <span>Inversión mensual ({isIvaExento ? 'Exento de IVA' : '+ IVA'})</span>
              </div>
              <div>
                <strong>{isCloudBackup ? '1.0 TB' : (items.length + ' Ítems')}</strong>
                <span>{isCloudBackup ? 'Almacenamiento Cloud Inmutable' : 'Componentes del Servicio'}</span>
              </div>
              <div>
                <strong>{isCloudBackup ? '10 Equipos' : 'Soporte TI'}</strong>
                <span>{isCloudBackup ? '2 Servidores + 8 Estaciones' : 'Mesa de Ayuda Experta'}</span>
              </div>
              <div>
                <strong>24/7</strong>
                <span>Monitoreo & Pruebas Semestrales</span>
              </div>
            </div>
          </section>

          {/* SECCIÓN 2: ALCANCE TÉCNICO */}
          <section id="alcance">
            <h2>Alcance Técnico de la Solución</h2>
            <p style={{ color: 'var(--soft)' }}>
              Nuestra solución integra tecnología corporativa de nivel mundial con el acompañamiento directo y consultivo de los ingenieros certificados de Help Soluciones.
            </p>

            <div className="fronts">
              <div>
                <b><Shield size={20} color="var(--blue)" /> Defensa Activa Anti-Ransomware</b>
                <span>Motor inteligente Acronis Active Protection con Inteligencia Artificial que detecta y bloquea amenazas de día cero y revierte archivos cifrados en tiempo real.</span>
              </div>
              <div>
                <b><Cloud size={20} color="var(--blue)" /> Respaldo Inmutable en la Nube</b>
                <span>Copias diarias automatizadas hacia centros de datos Tier IV con inmutabilidad contra ataques maliciosos o borrado accidental de información.</span>
              </div>
              <div>
                <b><RefreshCw size={20} color="var(--blue)" /> Recuperación Instantánea (RTO &lt; 2h)</b>
                <span>Restauración granular de archivos específicos, buzones y recuperación completa Bare-Metal sobre hardware físico o entorno virtual.</span>
              </div>
              <div>
                <b><Users size={20} color="var(--blue)" /> Acompañamiento & Pruebas Semestrales</b>
                <span>Supervisión proactiva diaria del ciclo de copias por nuestro equipo de ingeniería, simulacros de restauración semestrales e informes de capacidad.</span>
              </div>
            </div>
          </section>

          {/* SECCIÓN 3: FLUJO VISUAL DE RESPALDO */}
          {isCloudBackup && (
            <section id="flujo">
              <h2>Arquitectura & Flujo de Respaldo</h2>
              <p style={{ color: 'var(--soft)' }}>
                Esquema de ciberprotección híbrida: copias locales rápidas para restauración inmediata y réplica cifrada en la nube para contingencias mayores.
              </p>

              <div className="flow-container">
                <div className="flow-pipeline">
                  <div className="flow-node">
                    <Server size={24} style={{ margin: '0 auto 8px auto', color: 'var(--blue)' }} />
                    <strong style={{ display: 'block', fontSize: '0.95rem' }}>Servidores & Estaciones</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--soft)' }}>Infraestructura FAHILOS</p>
                  </div>
                  <div className="flow-arrow"><ArrowRight size={20} /></div>
                  <div className="flow-node">
                    <ShieldCheck size={24} style={{ margin: '0 auto 8px auto', color: 'var(--ok)' }} />
                    <strong style={{ display: 'block', fontSize: '0.95rem' }}>Agente Acronis</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--soft)' }}>Cifrado AES-256 Militar</p>
                  </div>
                  <div className="flow-arrow"><ArrowRight size={20} /></div>
                  <div className="flow-node">
                    <HardDrive size={24} style={{ margin: '0 auto 8px auto', color: 'var(--warn)' }} />
                    <strong style={{ display: 'block', fontSize: '0.95rem' }}>Copia Local LAN</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--soft)' }}>Restauración en Minutos</p>
                  </div>
                  <div className="flow-arrow"><ArrowRight size={20} /></div>
                  <div className="flow-node highlight">
                    <Cloud size={24} style={{ margin: '0 auto 8px auto', color: 'var(--sky)' }} />
                    <strong style={{ display: 'block', fontSize: '0.95rem' }}>Acronis Cyber Cloud</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem' }}>Storage Inmutable Tier IV</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* SECCIÓN 4: ESCENARIOS DE CONTINGENCIA */}
          {isCloudBackup && (
            <section id="escenarios">
              <h2>Escenarios de Contingencia & Recuperación</h2>
              <p style={{ color: 'var(--soft)' }}>
                Haga clic en cada escenario para ver cómo responde la solución y garantiza la continuidad operativa de su empresa:
              </p>

              <div className="contingency-acc">
                <details open>
                  <summary>
                    1. Eliminación accidental de archivos, carpetas o bases de datos
                    <ChevronDown size={18} />
                  </summary>
                  <p>
                    El usuario o administrador solicita la restauración mediante el portal Help Soluciones. Nuestro agente recupera la versión exacta previa al incidente en cuestión de minutos directamente en la ruta original o alternativa, sin interrumpir el funcionamiento del servidor.
                  </p>
                </details>

                <details>
                  <summary>
                    2. Caída crítica o daño físico de disco en un servidor
                    <ChevronDown size={18} />
                  </summary>
                  <p>
                    Ante la falla del sistema operativo o hardware, aplicamos restauración tipo Bare-Metal Restore. Se reconstruye la máquina completa (sistema operativo, configuraciones, bases de datos y archivos) sobre nuevo hardware físico o en un hipervisor virtualizado con RTO menor a 2 horas.
                  </p>
                </details>

                <details>
                  <summary>
                    3. Ataque de Ransomware o infección cibernética masiva
                    <ChevronDown size={18} />
                  </summary>
                  <p>
                    La defensa activa de Acronis detiene el proceso y revierte las modificaciones automáticamente. Si la amenaza penetró antes de la activación, se restaura la copia inmutable alojada en la nube, la cual no puede ser cifrada ni alterada por el malware.
                  </p>
                </details>

                <details>
                  <summary>
                    4. Siniestro en sede física (incendio, inundación, robo de equipos)
                    <ChevronDown size={18} />
                  </summary>
                  <p>
                    Dado que la copia reside en el centro de datos seguro de Acronis Cyber Cloud, toda la información de la empresa permanece 100% a salvo y lista para ser desplegada en nuevas instalaciones o infraestructura provisional en la nube sin pérdida de datos históricos.
                  </p>
                </details>

                <details>
                  <summary>
                    5. Operación diaria, auditoría y pruebas semestrales programadas
                    <ChevronDown size={18} />
                  </summary>
                  <p>
                    Help Soluciones no espera a que ocurra un desastre: cada 6 meses ejecutamos un simulacro controlado de restauración en conjunto con el equipo de FAHILOS para validar la integridad de los datos y emitir el certificado formal para auditorías de calidad y control interno.
                  </p>
                </details>
              </div>
            </section>
          )}

          {/* SECCIÓN 5: INVERSIÓN Y FORMA DE PAGO */}
          <section id="inversion">
            <h2>Propuesta Económica & Inversión</h2>
            <p style={{ color: 'var(--soft)' }}>
              Detalle discriminado de los servicios requeridos para la operación continua:
            </p>

            <div className="tbl">
              <table>
                <thead>
                  <tr>
                    <th>Concepto / Componente Técnico</th>
                    <th style={{ textAlign: 'center', width: '80px' }}>Cant.</th>
                    <th style={{ textAlign: 'right', width: '140px' }}>Vr. Unitario</th>
                    <th style={{ textAlign: 'right', width: '150px' }}>Total ({propuesta.moneda})</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td>
                        <b>{it.descripcion}</b>
                        {it.numPart && <small>P/N: {it.numPart}</small>}
                      </td>
                      <td style={{ textAlign: 'center' }}>{it.cantidad}</td>
                      <td style={{ textAlign: 'right' }}>{formatMoney(it.valorUnitario)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatMoney((it.cantidad || 1) * (it.valorUnitario || 0))}</td>
                    </tr>
                  ))}
                  <tr className="tot">
                    <td colSpan={3}><b>Subtotal Mensual</b></td>
                    <td style={{ textAlign: 'right' }}>{formatMoney(subtotal)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} style={{ color: 'var(--soft)', fontSize: '0.85rem' }}>
                      {isIvaExento 
                        ? 'Impuesto sobre las Ventas (Exento de IVA según Art. 476 Num. 21 E.T. - Servicios Cloud)' 
                        : 'Impuesto al Valor Agregado (IVA 19%):'}
                    </td>
                    <td style={{ textAlign: 'right', fontSize: '0.88rem', fontWeight: 600, color: isIvaExento ? 'var(--ok)' : 'var(--ink)' }}>
                      {isIvaExento ? 'Exento (0%)' : formatMoney(iva)}
                    </td>
                  </tr>
                  <tr style={{ background: 'var(--pale)' }}>
                    <td colSpan={3} style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '1.05rem' }}>
                      TOTAL MENSUAL ({propuesta.moneda}):
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--blue)', fontSize: '1.2rem' }}>
                      {formatMoney(total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ background: 'var(--soft-bg)', padding: '16px 20px', borderRadius: 'var(--r)', fontSize: '0.85rem', color: 'var(--soft)', lineHeight: 1.5, marginTop: '8px' }}>
              <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: 'var(--ink)' }}>Condiciones Comerciales & Forma de Pago:</p>
              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                <li>Facturación mensual recurrente en pesos colombianos (COP) liquidados a la TRM oficial de la fecha de expedición.</li>
                <li>Plazo de pago: 30 días calendario contra entrega de factura electrónica.</li>
                <li>{propuesta.observaciones || 'Servicio de almacenamiento y respaldo en la nube exento de IVA en cumplimiento del Artículo 476 Numeral 21 del Estatuto Tributario colombiano.'}</li>
              </ul>
            </div>
          </section>

          {/* SECCIÓN 6: ACUERDOS DE NIVEL DE SERVICIO (SLA) */}
          {propuesta.slas && (
            <section id="sla">
              <h2>Acuerdos de Nivel de Servicio (SLA)</h2>
              <div className="tbl">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '130px' }}>Severidad</th>
                      <th>Tipología del Evento</th>
                      <th style={{ textAlign: 'center', width: '140px' }}>Respuesta</th>
                      <th style={{ textAlign: 'center', width: '140px' }}>Solución</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><span className="p-badge p-bad">Crítica (P1)</span></td>
                      <td>Caída total de servidor, contingencia operativa o ataque de ransomware</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>≤ 15 Minutos</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>≤ 2 Horas</td>
                    </tr>
                    <tr>
                      <td><span className="p-badge p-warn">Alta (P2)</span></td>
                      <td>Advertencia o interrupción en el ciclo de copia nocturna de servidor</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>≤ 30 Minutos</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>≤ 4 Horas</td>
                    </tr>
                    <tr>
                      <td><span className="p-badge p-ok">Media (P3)</span></td>
                      <td>Restauración granular de archivos específicos o ajuste de retención</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>≤ 1 Hora</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>≤ 8 Horas</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* SECCIÓN 7: ACEPTACIÓN Y FIRMAS */}
          <section id="aprobacion">
            <h2>Aprobación de la Propuesta</h2>
            <p style={{ color: 'var(--soft)' }}>
              Para proceder con el aprovisionamiento de las licencias y la configuración de las tareas de respaldo, confirme su aceptación formal:
            </p>

            <div className="sign">
              <div>
                <b>Help Soluciones Informáticas S.A.S.</b>
                <p style={{ margin: '2px 0', fontSize: '0.85rem', color: 'var(--soft)' }}>NIT: 900.567.892-1 · Bogotá D.C., Colombia</p>
                <div className="signature-box">
                  <b>{propuesta.comercial_nombre || 'Carlos Arturo Sáenz'}</b>
                  <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--soft)' }}>Gerente General / Consultor TI</span>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--blue)' }}>Móvil: {propuesta.comercial_telefono || '304 335 8650'}</span>
                </div>
              </div>

              <div>
                <b>{propuesta.cliente_nombre}</b>
                <p style={{ margin: '2px 0', fontSize: '0.85rem', color: 'var(--soft)' }}>NIT: {propuesta.cliente_nit || '860038563-1'}</p>
                <div className="signature-box">
                  <b>{propuesta.cliente_contacto || 'Atención Gerencia General'}</b>
                  <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--soft)' }}>Firma de Aceptación Autorizada</span>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: aceptada ? 'var(--ok)' : 'var(--soft)', fontWeight: 600 }}>
                    {aceptada ? '✓ Aprobado digitalmente' : 'Pendiente de firma / aceptación digital'}
                  </span>
                </div>
              </div>
            </div>
          </section>

        </main>
      </div>

    </div>
  );
}
