import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { logoBase64 } from '../assets/logoBase64';
import type { Alquiler, Cliente, AppUser } from '../App';

interface IProps {
    alquileres: Alquiler[];
    clientes: Cliente[];
    onAddAlquiler: (a: Alquiler) => Promise<boolean>;
    onUpdateAlquiler: (a: Alquiler) => Promise<boolean>;
    onDeleteAlquiler: (id: string) => Promise<void>;
    currentUser: AppUser | null;
}

const AlquileresModule: React.FC<IProps> = ({ alquileres, clientes, onAddAlquiler, onUpdateAlquiler, onDeleteAlquiler, currentUser }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Form state
    const [descripcion, setDescripcion] = useState('');
    const [serial, setSerial] = useState('');
    const [fotoUrl, setFotoUrl] = useState('');
    const [estado, setEstado] = useState<'Bodega' | 'Alquilado'>('Bodega');
    const [clienteId, setClienteId] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [valorMensual, setValorMensual] = useState(0);
    const [discoDuro, setDiscoDuro] = useState('');
    const [memoriaRam, setMemoriaRam] = useState('');
    const [procesador, setProcesador] = useState('');
    const [generacion, setGeneracion] = useState('');

    // Assign Client Modal State
    const [assignTarget, setAssignTarget] = useState<Alquiler | null>(null);
    const [assignClienteId, setAssignClienteId] = useState('');
    const [assignFechaInicio, setAssignFechaInicio] = useState('');
    const [assignValorMensual, setAssignValorMensual] = useState(0);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('La imagen no debe superar los 2MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFotoUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const resetForm = () => {
        setIsAdding(false);
        setEditingId(null);
        setDescripcion('');
        setSerial('');
        setFotoUrl('');
        setEstado('Bodega');
        setClienteId('');
        setFechaInicio('');
        setValorMensual(0);
        setDiscoDuro('');
        setMemoriaRam('');
        setProcesador('');
        setGeneracion('');
    };

    const handleSubmit = async () => {
        if (!descripcion || !serial) {
            alert('Descripción y Serial son requeridos');
            return;
        }

        const data: Alquiler = {
            id: editingId || crypto.randomUUID(),
            descripcion,
            serial,
            fotoUrl,
            estado,
            clienteId: estado === 'Alquilado' ? clienteId : undefined,
            clienteNombre: estado === 'Alquilado' ? clientes.find(c => c.id === clienteId)?.nombre : undefined,
            fechaInicio: estado === 'Alquilado' ? fechaInicio : undefined,
            valorMensual,
            usuarioId: currentUser?.id || '',
            discoDuro: discoDuro || undefined,
            memoriaRam: memoriaRam || undefined,
            procesador: procesador || undefined,
            generacion: generacion || undefined
        };

        const success = editingId ? await onUpdateAlquiler(data) : await onAddAlquiler(data);
        if (success) {
            if (data.estado === 'Alquilado') generateActaEntrega(data);
            resetForm();
        }
    };

    const handleEdit = (a: Alquiler) => {
        setEditingId(a.id);
        setDescripcion(a.descripcion);
        setSerial(a.serial);
        setFotoUrl(a.fotoUrl || '');
        setEstado(a.estado);
        setClienteId(a.clienteId || '');
        setFechaInicio(a.fechaInicio || '');
        setValorMensual(a.valorMensual);
        setDiscoDuro(a.discoDuro || '');
        setMemoriaRam(a.memoriaRam || '');
        setProcesador(a.procesador || '');
        setGeneracion(a.generacion || '');
        setIsAdding(true);
    };

    const generateActaEntrega = (a: Alquiler) => {
        const doc = new jsPDF();
        const marginX = 15;
        const pageWidth = doc.internal.pageSize.width;
        const contentWidth = pageWidth - marginX * 2;
        let y = 15;

        // ─── HEADER BANNER ───
        doc.setFillColor(0, 74, 153);
        doc.rect(0, 0, pageWidth, 45, 'F');

        if (logoBase64) {
            try {
                // Ensure it's JPEG since that's what logoBase64.ts contains
                doc.addImage(logoBase64, 'JPEG', marginX, 5, 35, 35, undefined, 'FAST');
            } catch (e) {
                console.error("Error adding logo to PDF:", e);
            }
        }

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('ACTA DE ENTREGA', pageWidth / 2 + 10, 18, { align: 'center' });
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('Equipo en Modalidad de Alquiler', pageWidth / 2 + 10, 26, { align: 'center' });

        doc.setFontSize(9);
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, pageWidth - marginX, 38, { align: 'right' });
        doc.text(`N° Acta: AE-${a.serial.slice(-6).toUpperCase()}`, pageWidth - marginX, 33, { align: 'right' });

        y = 55;
        doc.setTextColor(0, 0, 0);

        // ─── CLIENT INFO BOX ───
        const cliente = clientes.find(c => c.id === a.clienteId);

        doc.setFillColor(240, 249, 255);
        doc.roundedRect(marginX, y, contentWidth, 40, 3, 3, 'F');
        doc.setDrawColor(0, 74, 153);
        doc.roundedRect(marginX, y, contentWidth, 40, 3, 3, 'S');

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 74, 153);
        doc.text('DATOS DEL CLIENTE', marginX + 5, y + 8);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);

        const col1X = marginX + 5;
        const col2X = marginX + contentWidth / 2 + 5;

        doc.setFont('helvetica', 'bold');
        doc.text('Razón Social:', col1X, y + 16);
        doc.setFont('helvetica', 'normal');
        doc.text(cliente?.nombre || a.clienteNombre || 'N/A', col1X + 28, y + 16);

        doc.setFont('helvetica', 'bold');
        doc.text('NIT:', col2X, y + 16);
        doc.setFont('helvetica', 'normal');
        doc.text(cliente?.nit || 'N/A', col2X + 12, y + 16);

        doc.setFont('helvetica', 'bold');
        doc.text('Dirección:', col1X, y + 24);
        doc.setFont('helvetica', 'normal');
        doc.text(cliente?.direccion || 'N/A', col1X + 22, y + 24);

        doc.setFont('helvetica', 'bold');
        doc.text('Ciudad:', col2X, y + 24);
        doc.setFont('helvetica', 'normal');
        doc.text(cliente?.ciudad || 'N/A', col2X + 16, y + 24);

        doc.setFont('helvetica', 'bold');
        doc.text('Contacto:', col1X, y + 32);
        doc.setFont('helvetica', 'normal');
        doc.text(cliente?.contacto || 'N/A', col1X + 22, y + 32);

        doc.setFont('helvetica', 'bold');
        doc.text('Teléfono:', col2X, y + 32);
        doc.setFont('helvetica', 'normal');
        doc.text(cliente?.telefono || 'N/A', col2X + 20, y + 32);

        y += 50;

        // ─── EQUIPMENT TABLE ───
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 74, 153);
        doc.text('DATOS DEL EQUIPO', marginX, y);
        y += 5;

        const equipmentData = [
            ['Descripción', a.descripcion],
            ['N° de Serial', a.serial],
            ...(a.procesador ? [['Procesador', a.procesador]] : []),
            ...(a.generacion ? [['Generación', a.generacion]] : []),
            ...(a.memoriaRam ? [['Memoria RAM', a.memoriaRam]] : []),
            ...(a.discoDuro ? [['Disco Duro', a.discoDuro]] : []),
        ];

        autoTable(doc, {
            startY: y,
            body: equipmentData,
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: { top: 3, bottom: 3, left: 5, right: 5 } },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 45, textColor: [50, 50, 50] as any },
                1: { cellWidth: 'auto' }
            },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            tableLineColor: [220, 220, 220],
            tableLineWidth: 0.3,
        });

        y = (doc as any).lastAutoTable.finalY + 8;

        // ─── COMMERCIAL TERMS BOX ───
        doc.setFillColor(255, 251, 235);
        doc.roundedRect(marginX, y, contentWidth, 22, 3, 3, 'F');
        doc.setDrawColor(180, 140, 20);
        doc.roundedRect(marginX, y, contentWidth, 22, 3, 3, 'S');

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(120, 80, 0);
        doc.text('CONDICIONES COMERCIALES', marginX + 5, y + 7);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(`Fecha de inicio del alquiler:  ${a.fechaInicio || new Date().toISOString().split('T')[0]}`, marginX + 5, y + 14);
        doc.text(`Valor mensual del alquiler:  $${a.valorMensual.toLocaleString()} COP`, marginX + contentWidth / 2, y + 14);

        y += 30;

        // ─── LEGAL TEXT ───
        doc.setFontSize(8.5);
        doc.setTextColor(60, 60, 60);
        const legalText = `Por medio de la presente acta se hace constar la entrega en calidad de ARRENDAMIENTO del equipo antes descrito al cliente arriba mencionado. El cliente declara recibir el equipo en perfectas condiciones de funcionamiento y estética, comprometiéndose a darle el uso adecuado y a responder por cualquier daño, deterioro o pérdida que el equipo sufra durante el periodo de alquiler. Al finalizar el contrato, el cliente se compromete a devolver el equipo en las mismas condiciones en que fue recibido, salvo el desgaste normal por uso.`;
        const splitLegal = doc.splitTextToSize(legalText, contentWidth);
        doc.text(splitLegal, marginX, y);

        y += splitLegal.length * 4 + 15;

        // ─── SIGNATURE BOXES ───
        const boxWidth = (contentWidth - 20) / 2;
        const boxHeight = 55;

        // Entrega (left)
        doc.setDrawColor(0, 74, 153);
        doc.setLineWidth(0.5);
        doc.roundedRect(marginX, y, boxWidth, boxHeight, 3, 3, 'S');

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 74, 153);
        doc.text('ENTREGADO POR', marginX + boxWidth / 2, y + 8, { align: 'center' });
        doc.text('Help Soluciones Informáticas', marginX + boxWidth / 2, y + 14, { align: 'center' });

        // Signature line
        doc.setDrawColor(150, 150, 150);
        doc.setLineWidth(0.3);
        doc.line(marginX + 10, y + 36, marginX + boxWidth - 10, y + 36);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text(`Nombre: ${currentUser?.nombre || '________________________'}`, marginX + 10, y + 42);
        doc.text('C.C.: ________________________', marginX + 10, y + 48);

        // Recibe (right)
        const rightX = marginX + boxWidth + 20;
        doc.setDrawColor(0, 74, 153);
        doc.setLineWidth(0.5);
        doc.roundedRect(rightX, y, boxWidth, boxHeight, 3, 3, 'S');

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 74, 153);
        doc.text('RECIBIDO POR', rightX + boxWidth / 2, y + 8, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text(cliente?.nombre || a.clienteNombre || 'Cliente', rightX + boxWidth / 2, y + 14, { align: 'center' });

        // Signature line
        doc.setDrawColor(150, 150, 150);
        doc.setLineWidth(0.3);
        doc.line(rightX + 10, y + 36, rightX + boxWidth - 10, y + 36);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text('Nombre: ________________________', rightX + 10, y + 42);
        doc.text('C.C.: ________________________', rightX + 10, y + 48);

        // ─── FOOTER ───
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text('Documento generado por HelpiCRM — Help Soluciones Informáticas S.A.S.', pageWidth / 2, 285, { align: 'center' });

        doc.save(`Acta_Entrega_${a.serial}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const generateInformeGlobal = () => {
        const activos = alquileres.filter(a => a.estado === 'Alquilado');
        if (activos.length === 0) {
            alert('No hay equipos alquilados actualmente para generar el informe.');
            return;
        }

        const doc = new jsPDF();
        const marginX = 15;
        let startY = 20;

        // Logo
        if (logoBase64) {
            doc.addImage(logoBase64, 'PNG', marginX, startY, 30, 30, '', 'FAST');
        }

        // Header Text
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORME GLOBAL DE ALQUILERES ACTIVOS', 60, startY + 15);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Fecha de Generación: ${new Date().toLocaleDateString('es-ES')}`, 60, startY + 22);
        doc.text(`Generado por: ${currentUser?.nombre || 'Administrador'}`, 60, startY + 28);

        startY += 45;

        // Sumatoria Total
        const totalMensual = activos.reduce((sum, a) => sum + (a.valorMensual || 0), 0);

        // Header Tabla
        const tableBody = activos.map(a => [
            a.clienteNombre || 'Sin Asignar',
            `${a.descripcion}\nSN: ${a.serial}`,
            a.fechaInicio || 'N/A',
            `$${a.valorMensual.toLocaleString()}`
        ]);

        autoTable(doc, {
            startY: startY,
            head: [['Cliente', 'Equipo', 'Fecha Inicio', 'V. Mensual']],
            body: tableBody,
            theme: 'striped',
            headStyles: { fillColor: [0, 74, 153], textColor: [255, 255, 255] },
            styles: { fontSize: 9, cellPadding: 4 },
            didDrawPage: function (data: any) {
                // Footer
                const str = 'Página ' + (doc as any).internal.getNumberOfPages();
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 15;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(`Total Mensual Proyectado: $${totalMensual.toLocaleString()} COP`, doc.internal.pageSize.width - marginX, finalY, { align: 'right' });

        doc.save(`Informe_Alquileres_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const filtered = alquileres.filter(a =>
        a.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.serial.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAssignClient = async () => {
        if (!assignTarget || !assignClienteId) {
            alert('Seleccione un cliente');
            return;
        }
        const cliente = clientes.find(c => c.id === assignClienteId);
        const updated: Alquiler = {
            ...assignTarget,
            estado: 'Alquilado',
            clienteId: assignClienteId,
            clienteNombre: cliente?.nombre || '',
            fechaInicio: assignFechaInicio || new Date().toISOString().split('T')[0],
            valorMensual: assignValorMensual
        };
        const success = await onUpdateAlquiler(updated);
        if (success) {
            generateActaEntrega(updated);
            setAssignTarget(null);
            setAssignClienteId('');
            setAssignFechaInicio('');
            setAssignValorMensual(0);
        }
    };

    const handleUnassignClient = async (a: Alquiler) => {
        if (!confirm('¿Desea devolver este equipo a Bodega?')) return;
        const updated: Alquiler = {
            ...a,
            estado: 'Bodega',
            clienteId: undefined,
            clienteNombre: undefined,
            fechaInicio: undefined
        };
        await onUpdateAlquiler(updated);
    };

    return (
        <div className="module-container">
            <div className="module-header">
                <h2>Gestión de Alquileres</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        type="text"
                        placeholder="Buscar por descripción o serial..."
                        className="search-input"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ width: '300px' }}
                    />
                    <button onClick={generateInformeGlobal} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        📊 Generar Informe
                    </button>
                    <button onClick={() => setIsAdding(true)} className="btn-primary">+ Nuevo Equipo</button>
                </div>
            </div>

            {isAdding && (
                <div className="card animate-fade-in" style={{ marginBottom: '2rem' }}>
                    <h3>{editingId ? 'Editar Equipo' : 'Registrar Nuevo Equipo'}</h3>
                    <div className="form-grid">
                        <div className="form-row">
                            <div className="form-group flex-2">
                                <label>Descripción del Equipo</label>
                                <input className="input-field" value={descripcion} onChange={e => setDescripcion(e.target.value)} />
                            </div>
                            <div className="form-group flex-1">
                                <label>Número de Serial</label>
                                <input className="input-field" value={serial} onChange={e => setSerial(e.target.value)} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group flex-1">
                                <label>Disco Duro</label>
                                <select className="input-field" value={discoDuro} onChange={e => setDiscoDuro(e.target.value)}>
                                    <option value="">Seleccionar (Opcional)</option>
                                    <option value="128GB">128GB</option>
                                    <option value="256GB">256GB</option>
                                    <option value="512GB">512GB</option>
                                    <option value="1TB">1TB</option>
                                </select>
                            </div>
                            <div className="form-group flex-1">
                                <label>Memoria RAM</label>
                                <select className="input-field" value={memoriaRam} onChange={e => setMemoriaRam(e.target.value)}>
                                    <option value="">Seleccionar (Opcional)</option>
                                    <option value="4GB">4GB</option>
                                    <option value="8GB">8GB</option>
                                    <option value="16GB">16GB</option>
                                    <option value="32GB">32GB</option>
                                    <option value="64GB">64GB</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group flex-1">
                                <label>Procesador</label>
                                <select className="input-field" value={procesador} onChange={e => setProcesador(e.target.value)}>
                                    <option value="">Seleccionar (Opcional)</option>
                                    <option value="Intel Core i3">Intel Core i3</option>
                                    <option value="Intel Core i5">Intel Core i5</option>
                                    <option value="Intel Core i7">Intel Core i7</option>
                                    <option value="Intel Core i9">Intel Core i9</option>
                                    <option value="AMD Ryzen 3">AMD Ryzen 3</option>
                                    <option value="AMD Ryzen 5">AMD Ryzen 5</option>
                                    <option value="AMD Ryzen 7">AMD Ryzen 7</option>
                                </select>
                            </div>
                            <div className="form-group flex-1">
                                <label>Generación</label>
                                <select className="input-field" value={generacion} onChange={e => setGeneracion(e.target.value)}>
                                    <option value="">Seleccionar (Opcional)</option>
                                    {[...Array(14)].map((_, i) => (
                                        <option key={i + 1} value={`${i + 1} Gen`}>{i + 1} Generación</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group flex-1">
                                <label>Estado (Semáforo)</label>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                    <button
                                        className={`btn-action ${estado === 'Bodega' ? 'active-red' : ''}`}
                                        onClick={() => setEstado('Bodega')}
                                        style={{
                                            background: estado === 'Bodega' ? '#fee2e2' : '#f3f4f6',
                                            color: estado === 'Bodega' ? '#ef4444' : '#6b7280',
                                            border: '2px solid',
                                            borderColor: estado === 'Bodega' ? '#ef4444' : 'transparent',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '8px',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        🔴 Bodega
                                    </button>
                                    <button
                                        className={`btn-action ${estado === 'Alquilado' ? 'active-green' : ''}`}
                                        onClick={() => setEstado('Alquilado')}
                                        style={{
                                            background: estado === 'Alquilado' ? '#dcfce7' : '#f3f4f6',
                                            color: estado === 'Alquilado' ? '#166534' : '#6b7280',
                                            border: '2px solid',
                                            borderColor: estado === 'Alquilado' ? '#166534' : 'transparent',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '8px',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        🟢 Alquilado
                                    </button>
                                </div>
                            </div>
                            <div className="form-group flex-1">
                                <label>Valor Mensual</label>
                                <input type="number" className="input-field" value={valorMensual} onChange={e => setValorMensual(Number(e.target.value))} />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group flex-1">
                                <label>Foto del Equipo (Opcional, max 2MB)</label>
                                <input type="file" accept="image/*" className="input-field" onChange={handleImageUpload} />
                                {fotoUrl && (
                                    <div style={{ marginTop: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.5rem', display: 'inline-block' }}>
                                        <img src={fotoUrl} alt="Vista previa" style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'contain' }} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {estado === 'Alquilado' && (
                            <div className="form-row animate-fade-in" style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
                                <div className="form-group flex-1">
                                    <label>Cliente</label>
                                    <select className="input-field" value={clienteId} onChange={e => setClienteId(e.target.value)}>
                                        <option value="">Seleccione un cliente</option>
                                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="form-group flex-1">
                                    <label>Fecha de Inicio del Alquiler</label>
                                    <input type="date" className="input-field" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="form-actions" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button className="btn-secondary" onClick={resetForm}>Cancelar</button>
                        <button className="btn-success" onClick={handleSubmit}>Guardar Equipo</button>
                    </div>
                </div>
            )}

            <div className="card table-card" style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ minWidth: '1100px' }}>
                    <thead>
                        <tr>
                            <th style={{ width: '70px' }}>Foto</th>
                            <th style={{ minWidth: '200px' }}>Descripción</th>
                            <th style={{ minWidth: '120px' }}>Serial</th>
                            <th style={{ minWidth: '120px' }}>Procesador</th>
                            <th style={{ minWidth: '70px' }}>RAM</th>
                            <th style={{ minWidth: '70px' }}>Disco</th>
                            <th style={{ minWidth: '50px' }}>Gen</th>
                            <th className="text-center" style={{ minWidth: '90px' }}>Estado</th>
                            <th style={{ minWidth: '160px' }}>Cliente / Fecha</th>
                            <th className="text-right" style={{ minWidth: '110px' }}>V. Mensual</th>
                            <th className="text-center" style={{ minWidth: '180px' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(a => (
                            <tr key={a.id}>
                                <td>
                                    <div style={{ width: '50px', height: '50px', background: '#f3f4f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {a.fotoUrl ? <img src={a.fotoUrl} alt="Foto" style={{ maxWidth: '100%', maxHeight: '100%' }} /> : '🖼️'}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ fontWeight: '600' }}>{a.descripcion}</div>
                                </td>
                                <td>
                                    <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.85rem' }}>{a.serial}</code>
                                </td>
                                <td style={{ fontSize: '0.85rem' }}>{a.procesador || '-'}</td>
                                <td style={{ fontSize: '0.85rem' }}>{a.memoriaRam || '-'}</td>
                                <td style={{ fontSize: '0.85rem' }}>{a.discoDuro || '-'}</td>
                                <td style={{ fontSize: '0.85rem', textAlign: 'center' }}>{a.generacion || '-'}</td>
                                <td className="text-center">
                                    <span style={{
                                        padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold',
                                        background: a.estado === 'Alquilado' ? '#dcfce7' : '#fee2e2',
                                        color: a.estado === 'Alquilado' ? '#166534' : '#ef4444'
                                    }}>
                                        {a.estado}
                                    </span>
                                </td>
                                <td>
                                    {a.estado === 'Alquilado' ? (
                                        <>
                                            <div style={{ fontWeight: '500' }}>{a.clienteNombre}</div>
                                            <div className="text-muted" style={{ fontSize: '0.8rem' }}>Desde: {a.fechaInicio}</div>
                                        </>
                                    ) : <span className="text-muted">-</span>}
                                </td>
                                <td className="text-right" style={{ color: 'var(--primary-blue)', fontWeight: 'bold' }}>
                                    ${a.valorMensual.toLocaleString()}
                                </td>
                                <td className="text-center">
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                        {a.estado === 'Bodega' && (
                                            <button className="btn-action" style={{ color: '#166534', background: '#dcfce7', borderRadius: '6px', padding: '4px 8px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #166534' }}
                                                onClick={() => { setAssignTarget(a); setAssignClienteId(''); setAssignFechaInicio(''); setAssignValorMensual(a.valorMensual); }}
                                                title="Asignar Cliente"
                                            >👤 Asignar</button>
                                        )}
                                        {a.estado === 'Alquilado' && (
                                            <>
                                                <button className="btn-action" style={{ color: 'var(--primary-blue)' }} onClick={() => generateActaEntrega(a)} title="Generar Acta PDF">🖨️</button>
                                                <button className="btn-action" style={{ color: '#92400e', background: '#fef3c7', borderRadius: '6px', padding: '4px 8px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #92400e' }}
                                                    onClick={() => handleUnassignClient(a)}
                                                    title="Devolver a Bodega"
                                                >📦 Bodega</button>
                                            </>
                                        )}
                                        <button className="btn-action" onClick={() => handleEdit(a)} title="Editar">✏️</button>
                                        <button className="btn-action" style={{ color: 'var(--error)' }} onClick={() => {
                                            if (confirm('¿Eliminar equipo?')) onDeleteAlquiler(a.id);
                                        }} title="Eliminar">🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ASSIGN CLIENT MODAL */}
            {assignTarget && (
                <div className="modal-overlay">
                    <div className="modal-content card" style={{ maxWidth: '500px', width: '95%' }}>
                        <h3 style={{ marginBottom: '1rem' }}>👤 Asignar Cliente al Equipo</h3>
                        <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                            <strong>{assignTarget.descripcion}</strong><br />
                            <span className="text-muted">SN: {assignTarget.serial}</span>
                        </div>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label>Cliente</label>
                            <select className="input-field" value={assignClienteId} onChange={e => setAssignClienteId(e.target.value)}>
                                <option value="">-- Seleccione un cliente --</option>
                                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Fecha de Inicio</label>
                                <input type="date" className="input-field" value={assignFechaInicio} onChange={e => setAssignFechaInicio(e.target.value)} />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Valor Mensual</label>
                                <input type="number" className="input-field" value={assignValorMensual} onChange={e => setAssignValorMensual(Number(e.target.value))} />
                            </div>
                        </div>
                        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button className="btn-secondary" onClick={() => setAssignTarget(null)}>Cancelar</button>
                            <button className="btn-success" onClick={handleAssignClient}>✅ Asignar y Alquilar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlquileresModule;
