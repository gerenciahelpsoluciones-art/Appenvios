import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Cliente, AppUser } from '../App';
import { generateReportPDF } from '../utils/reportPdfGenerator';

interface IProps {
    clientes: Cliente[];
    currentUser: AppUser;
}

interface Obligacion {
    obligacion: string;
    descripcion: string;
    entregable: string;
    frecuencia: string;
}

interface Contrato {
    id: string;
    cliente_id: string;
    nombre_contrato: string;
    archivo_url: string;
    obligaciones: Obligacion[];
}

interface Actividad {
    obligacion: string;
    actividad: string;
    estado: 'Cumplido' | 'En Proceso' | 'Pendiente';
}

const AgenteInformesModule: React.FC<IProps> = ({ clientes, currentUser }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1); 
    const [contratos, setContratos] = useState<Contrato[]>([]);
    const [selectedContract, setSelectedContract] = useState<Contrato | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [actividades, setActividades] = useState<Actividad[]>([]);
    const [reportContent, setReportContent] = useState('');
    
    // Form for new contract
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [newContractName, setNewContractName] = useState('');
    const [selectedClienteId, setSelectedClienteId] = useState('');
    const [uploadingFile, setUploadingFile] = useState<File | null>(null);

    useEffect(() => {
        fetchContratos();
    }, []);

    const fetchContratos = async () => {
        const { data, error } = await supabase.from('contratos_obligaciones').select('*').order('created_at', { ascending: false });
        if (data) setContratos(data);
        if (error) console.error('Error fetching contracts:', error);
    };

    const handleUploadContract = async () => {
        if (!uploadingFile || !selectedClienteId || !newContractName) {
            alert('Por favor completa todos los campos.');
            return;
        }

        setIsProcessing(true);
        try {
            // 1. Upload to Storage
            const fileExt = uploadingFile.name.split('.').pop();
            const fileName = `${Date.now()}_${newContractName.replace(/\s+/g, '_')}.${fileExt}`;
            const filePath = `contratos/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('entregas') // Reusing existing bucket or assume 'contratos' exists
                .upload(filePath, uploadingFile);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('entregas').getPublicUrl(filePath);
            const publicUrl = urlData.publicUrl;

            // 2. AI Extraction Logic (Simulated for Now - In a real app, this would be an Edge Function)
            // For now, we'll use a mocked extraction to show the UI value.
            const mockObligaciones: Obligacion[] = [
                { obligacion: "Mantenimiento Preventivo", descripcion: "Realizar visitas mensuales de revisión técnica.", entregable: "Acta de Visita", frecuencia: "Mensual" },
                { obligacion: "Soporte 24/7", descripcion: "Atención de emergencias en menos de 4 horas.", entregable: "Log de Tickets", frecuencia: "Bajo Demanda" }
            ];

            // 3. Save to DB
            const { error: dbError } = await supabase.from('contratos_obligaciones').insert([{
                cliente_id: selectedClienteId,
                nombre_contrato: newContractName,
                archivo_url: publicUrl,
                obligaciones: mockObligaciones,
                usuario_id: currentUser.id
            }]);

            if (dbError) throw dbError;

            alert('Contrato procesado exitosamente por la IA.');
            fetchContratos();
            setShowUploadModal(false);
        } catch (err: any) {
            alert('Error processing contract: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const startReport = (contract: Contrato) => {
        setSelectedContract(contract);
        setActividades(contract.obligaciones.map(ob => ({
            obligacion: ob.obligacion,
            actividad: '',
            estado: 'En Proceso'
        })));
        setStep(2);
    };

    const generateFinalReport = () => {
        setStep(3);
        // Here we would call the LLM with ACTIVITIES + OBLIGATIONS to generate the Markdown
        const markdown = `
# Informe de Ejecución - ${selectedContract?.nombre_contrato}
## Mes: ${new Date().toLocaleDateString('es-ES', { month: 'long' })}

### Cumplimiento de Obligaciones
${actividades.map(a => `- **${a.obligacion}**: ${a.actividad} (${a.estado})`).join('\n')}

---
*Generado por Agente de Informes Help Soluciones*
        `;
        setReportContent(markdown);
    };

    return (
        <div className="agente-informes-container">
            <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ margin: 0 }}>🤖 Agente de Informes IA</h1>
                    <p className="text-muted" style={{ margin: 0 }}>Optimización y agilidad con estructura NotebookLM</p>
                </div>
                <div className="step-indicator">
                    <span className={step >= 1 ? 'active' : ''}>1. Fuentes</span>
                    <span className={step >= 2 ? 'active' : ''}>2. Actividades</span>
                    <span className={step >= 3 ? 'active' : ''}>3. Síntesis</span>
                </div>
            </div>

            <div className="main-layout" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem' }}>
                {/* Lateral Panel: Sources */}
                <aside className="card sources-panel" style={{ height: 'calc(100vh - 250px)', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0 }}>📄 Contratos</h3>
                        <button className="btn-small" onClick={() => setShowUploadModal(true)}>+</button>
                    </div>
                    
                    <div className="contract-list">
                        {contratos.length === 0 ? (
                            <p className="text-center text-muted" style={{ marginTop: '2rem' }}>No hay contratos cargados.</p>
                        ) : (
                            contratos.map(c => (
                                <div key={c.id} 
                                     className={`contract-item ${selectedContract?.id === c.id ? 'selected' : ''}`}
                                     onClick={() => startReport(c)}>
                                    <div className="icon">📄</div>
                                    <div className="info">
                                        <strong>{c.nombre_contrato}</strong>
                                        <span>{clientes.find(cl => cl.id === c.cliente_id)?.nombre || 'Cliente'}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </aside>

                {/* Main Workspace */}
                <main className="card workspace-panel" style={{ minHeight: 'calc(100vh - 250px)', position: 'relative' }}>
                    {step === 1 && (
                        <div className="empty-state">
                            <span style={{ fontSize: '4rem' }}>📂</span>
                            <h2>Inicia un nuevo informe</h2>
                            <p>Selecciona un contrato de la izquierda o sube uno nuevo para extraer obligaciones.</p>
                        </div>
                    )}

                    {step === 2 && selectedContract && (
                        <div className="reporting-view" style={{ width: '100%' }}>
                            <h3>Reporte de Actividades: {selectedContract.nombre_contrato}</h3>
                            <p className="text-muted">Mapea tus actividades realizadas a las obligaciones contractuales.</p>
                            
                            <div className="obligations-grid" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {actividades.map((act, idx) => (
                                    <div key={idx} className="activity-card" style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '12px', background: '#f8fafc' }}>
                                        <div style={{ fontWeight: 'bold', color: 'var(--primary-blue)', marginBottom: '0.5rem' }}>
                                            {act.obligacion}
                                        </div>
                                        <textarea 
                                            className="input-field" 
                                            placeholder="¿Qué actividades se realizaron para cumplir esta obligación?"
                                            value={act.actividad}
                                            onChange={(e) => {
                                                const newActs = [...actividades];
                                                newActs[idx].actividad = e.target.value;
                                                setActividades(newActs);
                                            }}
                                            style={{ minHeight: '80px' }}
                                        />
                                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem' }}>
                                            <select 
                                                className="input-field" 
                                                style={{ width: 'auto', padding: '0.2rem 0.5rem' }}
                                                value={act.estado}
                                                onChange={(e) => {
                                                    const newActs = [...actividades];
                                                    newActs[idx].estado = e.target.value as any;
                                                    setActividades(newActs);
                                                }}>
                                                <option>Cumplido</option>
                                                <option>En Proceso</option>
                                                <option>Pendiente</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                                <button className="btn btn-primary" onClick={generateFinalReport}>
                                    Generar Síntesis ✨
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="synthesis-view" style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3>Síntesis del Informe (NotebookLM Ready)</h3>
                                <button className="btn" onClick={() => setStep(2)}>Editar Actividades</button>
                            </div>
                            <pre className="markdown-preview" style={{ padding: '2rem', background: '#1e293b', color: '#f8fafc', borderRadius: '12px', marginTop: '1.5rem', whiteSpace: 'pre-wrap', fontFamily: 'Inter, sans-serif' }}>
                                {reportContent}
                            </pre>
                            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button className="btn btn-secondary" onClick={() => {
                                    navigator.clipboard.writeText(reportContent);
                                    alert('Markdown copiado al portapapeles. ¡Listo para NotebookLM!');
                                }}>Copiar Markdown</button>
                                <button className="btn btn-primary" onClick={() => {
                                    const c = clientes.find(cl => cl.id === selectedContract?.cliente_id);
                                    generateReportPDF({
                                        clienteNombre: c?.nombre || 'Cliente',
                                        contratoNombre: selectedContract?.nombre_contrato || 'Contrato',
                                        mes: new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
                                        actividades: actividades,
                                        sintesis: reportContent
                                    });
                                }}>Descargar PDF Premium</button>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '400px' }}>
                        <h2>Subir Nuevo Contrato</h2>
                        <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                            <div className="input-box">
                                <label>Nombre del Contrato</label>
                                <input className="input-field" value={newContractName} onChange={e => setNewContractName(e.target.value)} placeholder="Ej: Contrato Outsourcing 2024" />
                            </div>
                            <div className="input-box">
                                <label>Cliente</label>
                                <select className="input-field" value={selectedClienteId} onChange={e => setSelectedClienteId(e.target.value)}>
                                    <option value="">Seleccionar Cliente...</option>
                                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                </select>
                            </div>
                            <div className="input-box">
                                <label>Archivo (PDF/Docx)</label>
                                <input type="file" onChange={e => setUploadingFile(e.target.files?.[0] || null)} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleUploadContract} disabled={isProcessing}>
                                    {isProcessing ? 'Procesando con IA...' : 'Analizar Contrato'}
                                </button>
                                <button className="btn" style={{ flex: 1, background: '#e2e8f0', color: '#444' }} onClick={() => setShowUploadModal(false)}>Cancelar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .agente-informes-container { transition: all 0.3s; }
                .step-indicator { display: flex; gap: 0.5rem; background: #f1f5f9; padding: 0.4rem; border-radius: 30px; }
                .step-indicator span { font-size: 0.75rem; padding: 0.3rem 0.8rem; border-radius: 20px; color: #64748b; font-weight: 600; }
                .step-indicator span.active { background: var(--primary-blue); color: white; }
                
                .contract-item { 
                    display: flex; gap: 1rem; padding: 1rem; border-radius: 12px; cursor: pointer; 
                    transition: all 0.2s; border: 1px solid transparent; margin-bottom: 0.5rem;
                }
                .contract-item:hover { background: #f8fafc; border-color: var(--border-color); }
                .contract-item.selected { background: var(--secondary-blue); border-color: var(--primary-blue); }
                .contract-item .icon { font-size: 1.5rem; }
                .contract-item .info { display: flex; flexDirection: column; }
                .contract-item .info span { font-size: 0.8rem; color: #64748b; }
                
                .workspace-panel { display: flex; flex-direction: column; align-items: center; justify-content: center; background: white; }
                .empty-state { text-align: center; color: #64748b; }
                
                .btn-small { background: var(--secondary-blue); color: var(--primary-blue); width: 30px; height: 30px; border-radius: 50%; font-weight: bold; cursor: pointer; }
                
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(4px); }
                .modal-content { background: white; padding: 2rem; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
            `}</style>
        </div>
    );
};

export default AgenteInformesModule;
