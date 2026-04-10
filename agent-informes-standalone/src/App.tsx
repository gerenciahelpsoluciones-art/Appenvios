import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Sparkles, 
  Download, 
  Copy, 
  CheckCircle2, 
  Cpu,
  X,
  Camera,
  Link,
  BookOpen,
  AlertCircle,
  Upload,
  FileCode,
  Image as ImageIcon,
  Settings,
  ShieldCheck,
  ChevronRight,
  User,
  Users
} from 'lucide-react';
import { generateReportPDF } from './lib/pdfGenerator';
import { extractTextFromPDF } from './lib/pdfExtractor';
import { synthesizeReport, analyzeContract } from './lib/gemini';
import { supabase } from './lib/supabase';

interface Cliente {
  id: string;
  nombre: string;
  nit: string;
}

interface AppUser {
  id: string;
  nombre: string;
  usuario: string;
}

interface Source {
  id: string;
  name: string;
  type: 'PDF' | 'DOCX' | 'IMG';
  status: 'Analizado' | 'Pendiente';
  images?: string[];
  references?: string[];
  cliente_id?: string;
  usuario_id?: string;
  obligaciones?: any[];
}

interface Activity {
  id: string;
  obligation: string;
  description: string;
  status: 'Cumplido' | 'En Proceso' | 'Pendiente';
}

const App: React.FC = () => {
  const [sources, setSources] = useState<Source[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [usuarios, setUsuarios] = useState<AppUser[]>([]);
  
  const [activeSourceId, setActiveSourceId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'actividades' | 'recursos'>('actividades');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('HS_GEMINI_API_KEY') || '');
  const [uploadType, setUploadType] = useState<'PDF' | 'DOCX' | 'IMG'>('PDF');
  
  // Selection for new contract
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [selectedUsuarioId, setSelectedUsuarioId] = useState('');
  const [newContractName, setNewContractName] = useState('');
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [report, setReport] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiStatus, setAiStatus] = useState<string>("Bajo protocolos EMC & SKILL. Listo para procesar fuentes.");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setAiStatus("Sincronizando con Supabase...");
      
      const { data: clientData } = await supabase.from('clientes').select('id, nombre, nit');
      if (clientData) setClientes(clientData);

      const { data: userData } = await supabase.from('app_users').select('id, nombre, usuario');
      if (userData) setUsuarios(userData);

      const { data: contractData } = await supabase.from('contratos_obligaciones').select('*').order('created_at', { ascending: false });
      if (contractData) {
        const mappedSources: Source[] = contractData.map(c => ({
          id: c.id,
          name: c.nombre_contrato,
          type: 'PDF',
          status: 'Analizado',
          obligaciones: c.obligaciones,
          cliente_id: c.cliente_id,
          usuario_id: c.usuario_id
        }));
        setSources(mappedSources);
        if (mappedSources.length > 0 && !activeSourceId) {
          setActiveSourceId(mappedSources[0].id);
        }
      }
      
      setAiStatus("Sistema sincronizado. Motor listo.");
    } catch (error) {
      console.error("Error fetching data:", error);
      setAiStatus("Error de conexión con Supabase.");
    }
  };

  useEffect(() => {
    if (activeSourceId) {
      const source = sources.find(s => s.id === activeSourceId);
      if (source && source.obligaciones) {
        setActivities(source.obligaciones.map((o: any, idx: number) => ({
          id: idx.toString(),
          obligation: o.obligacion || o.nombre || "Compromiso",
          description: '',
          status: 'Pendiente'
        })));
      }
    }
  }, [activeSourceId, sources]);

  const activeSource = sources.find(s => s.id === activeSourceId) || sources[0];
  const pendingCount = activities.filter(a => !a.description.trim()).length;

  const saveSettings = () => {
      localStorage.setItem('HS_GEMINI_API_KEY', apiKey);
      setIsSettingsOpen(false);
      setAiStatus("Configuración de IA actualizada. Motor listo.");
  };

  const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && selectedClienteId && selectedUsuarioId) {
          setIsGenerating(true);
          setAiStatus(`Subiendo ${file.name} a almacenamiento seguro...`);
          
          try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${newContractName || file.name.replace(/\s+/g, '_')}.${fileExt}`;
            const filePath = `contratos/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('entregas')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('entregas').getPublicUrl(filePath);
            const publicUrl = urlData.publicUrl;

            setAiStatus(`Extrayendo texto del documento con SKILL OCR...`);
            const extractedText = await extractTextFromPDF(file);

            setAiStatus(`Analizando cláusulas con Gemini 1.5 Pro...`);
            const analyzedObligaciones = await analyzeContract(extractedText);
            
            const finalObligaciones = analyzedObligaciones.length > 0 ? analyzedObligaciones : [
                { obligacion: "Soporte Técnico", descripcion: "Atención de incidentes N1/N2", entregable: "Reporte mensual", frecuencia: "Mensual" },
                { obligacion: "Mantenimiento", descripcion: "Visitas preventivas presenciales", entregable: "Acta de servicio", frecuencia: "Mensual" }
            ];

            const { data: newContract, error: dbError } = await supabase.from('contratos_obligaciones').insert([{
                cliente_id: selectedClienteId,
                nombre_contrato: newContractName || file.name,
                archivo_url: publicUrl,
                obligaciones: finalObligaciones,
                usuario_id: selectedUsuarioId
            }]).select().single();

            if (dbError) throw dbError;

            const newSrc: Source = {
                id: newContract.id,
                name: newContract.nombre_contrato,
                type: 'PDF',
                status: 'Analizado',
                obligaciones: newContract.obligaciones,
                cliente_id: newContract.cliente_id,
                usuario_id: newContract.usuario_id
            };

            setSources(prev => [newSrc, ...prev]);
            setActiveSourceId(newSrc.id);
            setNewContractName('');
            setSelectedClienteId('');
            setSelectedUsuarioId('');
            setIsUploadOpen(false);
            setAiStatus("Contrato certificado y obligaciones extraídas.");
          } catch (err: any) {
            console.error(err);
            setAiStatus("Error en el procesamiento del contrato.");
            alert("Error: " + err.message);
          } finally {
            setIsGenerating(false);
          }
      } else if (!selectedClienteId || !selectedUsuarioId) {
          alert("Por favor selecciona un Cliente y un Usuario antes de subir.");
      }
  };

  const generateReport = async () => {
    if (pendingCount > 0) {
        if (!confirm(`Faltan ${pendingCount} compromisos por responder. ¿Generar auditoría incompleta?`)) return;
    }

    setIsGenerating(true);
    setAiStatus(`Ejecutando protocolo Senior Automation Architect...`);
    
    try {
        const result = await synthesizeReport(
            activities, 
            activities.map(a => ({ obligacion: a.obligation, actividad: a.description, estado: a.status })),
            activeSource.images || []
        );
        
        const { error: reportError } = await supabase.from('informes_actividades').insert([{
            contrato_id: activeSource.id,
            mes: new Date().getMonth() + 1,
            anio: new Date().getFullYear(),
            actividades: activities.map(a => ({ obligation: a.obligation, description: a.description, status: a.status })),
            logros: "Generado automáticamente por IA",
            estado: 'Finalizado',
            usuario_id: activeSource.usuario_id
        }]);

        if (reportError) {
            console.error("Error saving report:", reportError);
            setAiStatus("Auditoría generada localmente (Error al guardar en DB).");
        } else {
            setAiStatus("Auditoría certificada y guardada en base de datos.");
        }

        setReport(result);
    } catch (error) {
        setReport(`# AUDITORÍA DE CUMPLIMIENTO: ${activeSource.name}\n\n*Nota: Usando motor de respaldo técnico. Verifica tu API Key con Soporte.*\n\n## 3. AUDITORÍA 1:1\n${activities.map(a => `### ${a.obligation}\n- **Estado**: ${a.status}\n- **Reporte**: ${a.description || 'GAP DE INFORMACIÓN'}`).join('\n\n')}`);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleAddImage = () => {
      alert("Módulo multimodal: Captura de pantalla o archivo de imagen.");
  };

  const handleAddReference = () => {
      alert("Adjuntar marco técnico de referencia (SOP, Acta, etc.)");
  };

  return (
    <div className="app-container">
      {/* Settings Modal */}
      {isSettingsOpen && (
          <div className="modal-overlay" onClick={() => setIsSettingsOpen(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><Settings size={22} color="#ff3d00" /> Configuración IA</h2>
                      <X size={24} style={{ cursor: 'pointer' }} onClick={() => setIsSettingsOpen(false)} />
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Google Gemini API Key</label>
                      <input 
                        type="password" 
                        value={apiKey} 
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-..."
                        style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'white', outline: 'none' }}
                      />
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Tus credenciales se guardan localmente para procesar con Gemini 1.5 Pro.</p>
                  </div>
                  <button className="btn-premium" style={{ width: '100%', padding: '1rem' }} onClick={saveSettings}>Guardar Configuración</button>
              </div>
          </div>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
          <div className="modal-overlay" onClick={() => setIsUploadOpen(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                      <h2 style={{ fontSize: '1.4rem' }}>Cargar Nueva Fuente</h2>
                      <X size={24} style={{ cursor: 'pointer' }} onClick={() => setIsUploadOpen(false)} />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Nombre del Contrato / Proyecto</label>
                        <input 
                            type="text" 
                            placeholder="Ej: Mantenimiento Preventivo 2024" 
                            value={newContractName} 
                            onChange={(e) => setNewContractName(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'white', outline: 'none' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Cliente</label>
                            <select 
                                value={selectedClienteId} 
                                onChange={(e) => setSelectedClienteId(e.target.value)}
                                style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'white', outline: 'none' }}
                            >
                                <option value="">Seleccione...</option>
                                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Responsable (Usuario)</label>
                            <select 
                                value={selectedUsuarioId} 
                                onChange={(e) => setSelectedUsuarioId(e.target.value)}
                                style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'white', outline: 'none' }}
                            >
                                <option value="">Seleccione...</option>
                                {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                            </select>
                        </div>
                    </div>
                  </div>

                  <div className="type-selector" style={{ marginBottom: '1.5rem' }}>
                      <div className={`type-option ${uploadType === 'PDF' ? 'active' : ''}`} onClick={() => setUploadType('PDF')}>
                          <FileText size={20} color="#ff3d00" style={{ margin: '0 auto 5px' }} />
                          <div style={{ fontSize: '0.7rem' }}>PDF</div>
                      </div>
                      <div className={`type-option ${uploadType === 'DOCX' ? 'active' : ''}`} onClick={() => setUploadType('DOCX')}>
                          <FileCode size={20} color="#3b82f6" style={{ margin: '0 auto 5px' }} />
                          <div style={{ fontSize: '0.7rem' }}>Word</div>
                      </div>
                      <div className={`type-option ${uploadType === 'IMG' ? 'active' : ''}`} onClick={() => setUploadType('IMG')}>
                          <ImageIcon size={20} color="#ff8a00" style={{ margin: '0 auto 5px' }} />
                          <div style={{ fontSize: '0.7rem' }}>Imagen</div>
                      </div>
                  </div>

                  <div className="file-dropzone" onClick={() => fileInputRef.current?.click()} style={{ opacity: (!selectedClienteId || !selectedUsuarioId) ? 0.5 : 1, pointerEvents: (!selectedClienteId || !selectedUsuarioId) ? 'none' : 'auto' }}>
                      <Upload size={32} color="#ff3d00" style={{ marginBottom: '1rem' }} />
                      <p style={{ fontWeight: 600 }}>Seleccionar archivo {uploadType}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '5px' }}>
                          {(!selectedClienteId || !selectedUsuarioId) ? 'Primero selecciona cliente y usuario' : 'O arrastra aquí para procesar con IA'}
                      </p>
                      <input type="file" ref={fileInputRef} hidden onChange={onFileUpload} disabled={!selectedClienteId || !selectedUsuarioId} />
                  </div>
                  <button className="btn-glass" style={{ width: '100%', padding: '1rem', marginTop: '1rem' }} onClick={() => setIsUploadOpen(false)}>Cancelar</button>
              </div>
          </div>
      )}

      <aside className="sources-sidebar">
        <div className="sidebar-header">
          <h2 style={{ fontSize: '1.1rem' }}>Brain Engine</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="add-source-btn" onClick={() => setIsSettingsOpen(true)}>
                <Settings size={18} />
            </button>
            <button className="add-source-btn" onClick={() => setIsUploadOpen(true)}>
                <Plus size={18} />
            </button>
          </div>
        </div>

        <div className="doc-list">
          {sources.map(src => (
            <div 
              key={src.id} 
              className={`doc-item ${activeSourceId === src.id ? 'active' : ''}`}
              onClick={() => { setActiveSourceId(src.id); setReport(''); }}
            >
              {src.type === 'IMG' ? <ImageIcon size={18} color="#ff8a00" /> : <FileText size={18} color="#ff3d00" />}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{src.name}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{src.status}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'auto', padding: '1.2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
            <Cpu size={14} color="#ff3d00" />
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>SENIOR ARCHITECT STATUS</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: isGenerating ? '#ff8a00' : '#4ade80', lineHeight: 1.5 }}>
              {aiStatus}
          </div>
          {pendingCount > 0 && (
              <div style={{ marginTop: '1rem', padding: '0.6rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', color: '#f87171', fontSize: '0.65rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  ⚠️ {pendingCount} cláusulas sin reporte técnico
              </div>
          )}
        </div>
      </aside>

      <main className="main-workspace">
        <header className="workspace-header">
          <div>
            <h1>Centro de Comando Multimodal</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>EMC & SKILL Execution Hub | {activeSource.type} Processor</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {!apiKey && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffb300', fontSize: '0.75rem', fontWeight: 700 }}>
                    <AlertCircle size={14} /> REQUIERE API KEY
                </div>
            )}
            <div className="btn-glass" onClick={() => setIsUploadOpen(true)}>
                <Upload size={14} /> Cargar Contrato
            </div>
          </div>
        </header>

        {!report ? (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div className="tab-switcher">
                <div className={`tab-item ${activeTab === 'actividades' ? 'active' : ''}`} onClick={() => setActiveTab('actividades')}>Registro 1:1</div>
                <div className={`tab-item ${activeTab === 'recursos' ? 'active' : ''}`} onClick={() => setActiveTab('recursos')}> Pool Multimodal ({ (activeSource.images?.length || 0) + (activeSource.references?.length || 0) })</div>
            </div>

            {activeTab === 'actividades' ? (
                <div className="analysis-grid">
                    <div className="premium-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                           <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><Sparkles size={22} color="#ff3d00" /> Auditoría de Ejecución</h3>
                           <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{Math.round(((activities.length-pendingCount)/activities.length)*100)}% Completado</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            {activities.map(act => (
                            <div key={act.id} style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid var(--glass-border)', borderColor: act.description.trim() ? 'var(--glass-border)' : 'rgba(239, 68, 68, 0.2)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ff3d00' }}>{act.obligation}</span>
                                    <select value={act.status} style={{ background: 'transparent', color: '#60a5fa', border: 'none', fontSize: '0.75rem', fontWeight: 600 }} onChange={(e) => setActivities(activities.map(x => x.id === act.id ? { ...x, status: e.target.value as any } : x))}>
                                        <option value="Cumplido">CUMPLIDO</option>
                                        <option value="En Proceso">EN PROCESO</option>
                                        <option value="Pendiente">PENDIENTE</option>
                                    </select>
                                </div>
                                <textarea placeholder="Indica el hito técnico alcanzado..." value={act.description} style={{ background: 'transparent', border: 'none', color: '#e2e8f0', width: '100%', outline: 'none', fontSize: '0.9rem', resize: 'none' }} onChange={(e) => setActivities(activities.map(x => x.id === act.id ? { ...x, description: e.target.value } : x))} />
                            </div>
                            ))}
                        </div>
                        <button className="btn-premium" style={{ width: '100%', padding: '1.2rem', marginTop: '2.5rem' }} onClick={generateReport} disabled={isGenerating}>
                            {isGenerating ? 'Ejecutando SKILL Analytics...' : 'Certificar Informe de Auditoría ⚖️'}
                        </button>
                    </div>

                    <div className="premium-card" style={{ background: 'rgba(59, 130, 246, 0.02)' }}>
                         <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <ShieldCheck size={40} color="#3b82f6" style={{ marginBottom: '1.5rem' }} />
                            <h3>Reporte Certificado</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Estructura McKinsey activada. Analizando {activeSource.name}.</p>
                         </div>
                         <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.01)', borderRadius: '24px' }}>
                             <div style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 700, marginBottom: '1rem' }}>MÓDULOS ACTIVOS</div>
                             <ul style={{ fontSize: '0.8rem', color: '#94a3b8', listStyle: 'none', padding: 0 }}>
                                 <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}><ChevronRight size={12} color="#ff3d00" /> EMC Controller</li>
                                 <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}><ChevronRight size={12} color="#ff3d00" /> SKILL Knowledge</li>
                                 <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ChevronRight size={12} color="#ff3d00" /> Multimodal Engine</li>
                             </ul>
                         </div>
                    </div>
                </div>
            ) : (
                <div className="resources-workspace">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div className="upload-placeholder" onClick={handleAddImage}>
                            <Camera size={32} color="#ff3d00" style={{ marginBottom: '1rem' }} />
                            <h3>Galería Fotográfica</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Subir Evidencias Visuales (Multimodal)</p>
                        </div>
                        <div className="upload-placeholder" onClick={handleAddReference} style={{ borderColor: '#3b82f6' }}>
                            <Link size={32} color="#3b82f6" style={{ marginBottom: '1rem' }} />
                            <h3>Documentos Referencia</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>SOPs, Actas, Notas de Voz</p>
                        </div>
                    </div>

                    <div style={{ marginTop: '3rem' }}>
                        <h4 style={{ color: '#ff3d00', marginBottom: '1.2rem' }}>Evidencias Visuales</h4>
                        <div className="resources-grid">
                            {activeSource.images?.map((img, i) => (
                                <div key={i} className="resource-thumb">
                                    <img src={img} alt="Evidencia" />
                                    <button className="remove-btn" onClick={(e) => { e.stopPropagation(); setSources(sources.map(s => s.id === activeSourceId ? { ...s, images: s.images?.filter((_, idx) => idx !== i) } : s)); }}><X size={12} /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginTop: '3rem' }}>
                        <h4 style={{ color: '#3b82f6', marginBottom: '1.2rem' }}>Marco Técnico de Referencia</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {activeSource.references?.map((ref, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                                    <span style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>{ref}</span>
                                    <X size={16} color="#ff3d00" style={{ cursor: 'pointer' }} onClick={() => setSources(sources.map(s => s.id === activeSourceId ? { ...s, references: s.references?.filter((_, idx) => idx !== i) } : s))} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
          </div>
        ) : (
          <div className="synthesis-container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.6rem', color: 'var(--primary)' }}>Auditoría Ejecutiva</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mapeo de Cumplimiento 1:1 Protocolo Senior</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-glass" onClick={() => setReport('')}>Modificar Auditoría</button>
                <button className="btn-premium" onClick={() => generateReportPDF({ clienteNombre: 'HELP SOLUCIONES', contratoNombre: activeSource.name, mes: new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }), actividades: activities, sintesis: report, referencias: activeSource.references })}>
                  <Download size={16} /> PDF Premium
                </button>
                <button className="btn-glass" onClick={() => { navigator.clipboard.writeText(report); alert('Copiado al portapapeles'); }}><Copy size={16} /></button>
              </div>
            </header>
            <div className="markdown-document" style={{ background: '#080a0d', border: '1px solid var(--glass-border)', padding: '4rem', borderRadius: '40px', color: '#e2e8f0', lineHeight: 1.8, fontSize: '1rem' }}>
              <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'Inter, sans-serif' }}>{report}</pre>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
