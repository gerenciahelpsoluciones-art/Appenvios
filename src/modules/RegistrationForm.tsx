import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Check, Upload, ChevronRight, ChevronLeft, Building2, User, Landmark, ShieldCheck, Mail, Phone, MapPin, Globe, FileText } from 'lucide-react';

export default function RegistrationForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    // Secc 1: Identificación
    tipo_registro: 'CLIENTE',
    accion: 'ACTUALIZACIÓN',
    nombre_razon_social: '',
    nit_cedula: '',
    direccion: '',
    ciudad: '',
    email: '',
    telefono: '',
    pagina_web: '',
    
    // Secc 2: Rep Legal
    rep_legal_nombre: '',
    rep_legal_cedula: '',
    
    // Secc 3: Cartera
    cartera_nombre: '',
    cartera_email: '',
    cartera_telefono: '',
    
    // Secc 4: Bancarios
    banco_nombre: '',
    banco_tipo_cuenta: 'Ahorros',
    banco_numero_cuenta: '',
    
    // Secc 5: Tributarios
    regimen: 'Común',
    autoretenedor: false,
    
    // Referencias y SARLAFT
    referencia_1: '',
    referencia_2: '',
    acepta_sarlaft: false
  });

  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    camara_comercio: null,
    rut: null
  });

  const totalSteps = 7;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({ ...prev, [key]: e.target.files![0] }));
    }
  };

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.acepta_sarlaft) {
      alert("Debe aceptar la declaración de origen de fondos (SARLAFT) para continuar.");
      return;
    }

    setLoading(true);
    try {
      // 1. Subir archivos a Storage
      const uploadedUrls: { [key: string]: string } = {};
      
      for (const [key, file] of Object.entries(files)) {
        if (file) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${formData.nit_cedula}_${key}_${Date.now()}.${fileExt}`;
          const { data, error: uploadError } = await supabase.storage
            .from('documentos_registro')
            .upload(fileName, file);
            
          if (uploadError) throw uploadError;
          
          const { data: { publicUrl } } = supabase.storage
            .from('documentos_registro')
            .getPublicUrl(fileName);
            
          uploadedUrls[key] = publicUrl;
        }
      }

      // 2. Guardar en Base de Datos
      const { error } = await supabase.from('registros_pendientes').insert([{
        tipo_registro: formData.tipo_registro,
        accion: formData.accion,
        nombre_razon_social: formData.nombre_razon_social,
        nit_cedula: formData.nit_cedula,
        direccion: formData.direccion,
        ciudad: formData.ciudad,
        email: formData.email,
        telefono: formData.telefono,
        pagina_web: formData.pagina_web,
        doc_camara_comercio_url: uploadedUrls.camara_comercio,
        doc_rut_url: uploadedUrls.rut,
        datos_representante: {
          nombre: formData.rep_legal_nombre,
          cedula: formData.rep_legal_cedula
        },
        datos_cartera: {
          nombre: formData.cartera_nombre,
          email: formData.cartera_email,
          telefono: formData.cartera_telefono
        },
        datos_bancarios: {
          banco: formData.banco_nombre,
          tipo: formData.banco_tipo_cuenta,
          numero: formData.banco_numero_cuenta
        },
        datos_tributarios: {
          regimen: formData.regimen,
          autoretenedor: formData.autoretenedor
        },
        referencias_comerciales: [formData.referencia_1, formData.referencia_2],
        declaracion_sarlaft: { aceptado: formData.acepta_sarlaft, fecha: new Date().toISOString() }
      }]);

      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      console.error("Error al registrar:", err);
      if (err.message.includes('Bucket not found')) {
        alert("Error: El contenedor de archivos (Bucket) 'documentos_registro' no existe en Supabase. Por favor, créalo o contacta al administrador.");
      } else {
        alert("Hubo un error al procesar su solicitud. Por favor intente de nuevo. " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
          <Check size={40} className="text-white" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">¡Registro Recibido!</h2>
        <p className="text-slate-600 max-w-md">
          Gracias <strong>{formData.nombre_razon_social}</strong>. Su información ha sido enviada con éxito. 
          Nuestro equipo revisará los documentos y se pondrá en contacto pronto.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-8 px-6 py-2 border border-emerald-500 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
        >
          Enviar otra respuesta
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Registro de Clientes y Proveedores</h1>
        <p className="text-slate-500">Por favor complete todos los campos para la actualización de sus datos corporativos.</p>
      </div>

      {/* Stepper */}
      <div className="flex justify-between items-center mb-12 relative px-2">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0"></div>
        <div className="absolute top-1/2 left-0 h-0.5 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-500" style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}></div>
        
        {[1, 2, 3, 4, 5, 6, 7].map((s) => (
          <div key={s} className="relative z-10 flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border-4 ${
              s < step ? 'bg-emerald-500 border-emerald-500 text-white' : 
              s === step ? 'bg-white border-emerald-500 text-emerald-500 scale-110 shadow-lg' : 
              'bg-white border-slate-200 text-slate-400'
            }`}>
              {s < step ? <Check size={20} /> : s}
            </div>
            <span className={`text-[10px] mt-2 font-bold uppercase tracking-wider ${s === step ? 'text-emerald-600' : 'text-slate-400 opacity-0 md:opacity-100'}`}>
              {s === 1 && 'Inicio'}
              {s === 2 && 'Legal'}
              {s === 3 && 'Cartera'}
              {s === 4 && 'Banco'}
              {s === 5 && 'Tabla'}
              {s === 6 && 'Ref'}
              {s === 7 && 'Fin'}
            </span>
          </div>
        ))}
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl overflow-hidden animate-slide-up">
        <div className="p-8 md:p-12">
          
          {/* Step 1: Identificación */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <Building2 className="text-emerald-500" />
                <h2 className="text-xl font-bold text-slate-800">Identificación Básica</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Tipo de Persona</label>
                  <select name="tipo_registro" value={formData.tipo_registro} onChange={handleInputChange} className="input-select">
                    <option value="CLIENTE">Cliente</option>
                    <option value="PROVEEDOR">Proveedor</option>
                  </select>
                </div>
                <div>
                  <label className="label">Acción</label>
                  <select name="accion" value={formData.accion} onChange={handleInputChange} className="input-select">
                    <option value="NUEVO">Registro Nuevo</option>
                    <option value="ACTUALIZACIÓN">Actualización de Datos</option>
                    <option value="MODIFICACIÓN">Modificación Puntual</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="label">Nombre o Razón Social</label>
                  <input type="text" name="nombre_razon_social" required value={formData.nombre_razon_social} onChange={handleInputChange} className="input-field" placeholder="Ejem: Help Soluciones Informáticas S.A.S" />
                </div>
                <div>
                  <label className="label">NIT / Cédula</label>
                  <input type="text" name="nit_cedula" required value={formData.nit_cedula} onChange={handleInputChange} className="input-field" placeholder="Sin puntos ni guiones" />
                </div>
                <div>
                  <label className="label">Ciudad</label>
                  <input type="text" name="ciudad" required value={formData.ciudad} onChange={handleInputChange} className="input-field" placeholder="Ciudad principal" />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Dirección</label>
                  <input type="text" name="direccion" required value={formData.direccion} onChange={handleInputChange} className="input-field" />
                </div>
                <div>
                  <label className="label">Email Corporativo</label>
                  <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="input-field" placeholder="correo@empresa.com" />
                </div>
                <div>
                  <label className="label">Teléfono / Celular</label>
                  <input type="tel" name="telefono" required value={formData.telefono} onChange={handleInputChange} className="input-field" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Documentos y Legal */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <FileText className="text-emerald-500" />
                <h2 className="text-xl font-bold text-slate-800">Documentos y Representación</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="upload-group">
                  <label className="label">Cámara de Comercio (Vigente)</label>
                  <div className={`drop-zone ${files.camara_comercio ? 'active' : ''}`}>
                    <input type="file" onChange={(e) => handleFileChange(e, 'camara_comercio')} className="hidden" id="file-cc" accept=".pdf,image/*" />
                    <label htmlFor="file-cc" className="cursor-pointer flex flex-col items-center">
                      <Upload className={files.camara_comercio ? 'text-emerald-500' : 'text-slate-400'} />
                      <span className="text-sm mt-2">{files.camara_comercio ? files.camara_comercio.name : 'Subir PDF o Imagen'}</span>
                    </label>
                  </div>
                </div>
                <div className="upload-group">
                  <label className="label">RUT Actualizado</label>
                  <div className={`drop-zone ${files.rut ? 'active' : ''}`}>
                    <input type="file" onChange={(e) => handleFileChange(e, 'rut')} className="hidden" id="file-rut" accept=".pdf,image/*" />
                    <label htmlFor="file-rut" className="cursor-pointer flex flex-col items-center">
                      <Upload className={files.rut ? 'text-emerald-500' : 'text-slate-400'} />
                      <span className="text-sm mt-2">{files.rut ? files.rut.name : 'Subir PDF o Imagen'}</span>
                    </label>
                  </div>
                </div>
                <div className="md:col-span-2 pt-4">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Representante Legal</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" name="rep_legal_nombre" value={formData.rep_legal_nombre} onChange={handleInputChange} className="input-field" placeholder="Nombre Completo" />
                    <input type="text" name="rep_legal_cedula" value={formData.rep_legal_cedula} onChange={handleInputChange} className="input-field" placeholder="Cédula" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Cartera */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <User className="text-emerald-500" />
                <h2 className="text-xl font-bold text-slate-800">Contacto de Cartera / Pagos</h2>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <input type="text" name="cartera_nombre" value={formData.cartera_nombre} onChange={handleInputChange} className="input-field" placeholder="Nombre del contacto" />
                <input type="email" name="cartera_email" value={formData.cartera_email} onChange={handleInputChange} className="input-field" placeholder="Email para facturación electrónica" />
                <input type="tel" name="cartera_telefono" value={formData.cartera_telefono} onChange={handleInputChange} className="input-field" placeholder="Teléfono directo" />
              </div>
            </div>
          )}

          {/* Step 4: Bancarios */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <Landmark className="text-emerald-500" />
                <h2 className="text-xl font-bold text-slate-800">Información Bancaria</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="label">Nombre del Banco</label>
                  <input type="text" name="banco_nombre" value={formData.banco_nombre} onChange={handleInputChange} className="input-field" />
                </div>
                <div>
                  <label className="label">Tipo de Cuenta</label>
                  <select name="banco_tipo_cuenta" value={formData.banco_tipo_cuenta} onChange={handleInputChange} className="input-select">
                    <option value="Ahorros">Ahorros</option>
                    <option value="Corriente">Corriente</option>
                  </select>
                </div>
                <div>
                  <label className="label">Número de Cuenta</label>
                  <input type="text" name="banco_numero_cuenta" value={formData.banco_numero_cuenta} onChange={handleInputChange} className="input-field" />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Tributarios */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <ShieldCheck className="text-emerald-500" />
                <h2 className="text-xl font-bold text-slate-800">Información Tributaria</h2>
              </div>
              <div className="space-y-4">
                <label className="label">Régimen Tributario</label>
                <div className="flex gap-4">
                  {['Común', 'Simplificado', 'Gran Contribuyente'].map(r => (
                    <label key={r} className="flex items-center gap-2 cursor-pointer p-3 border rounded-xl hover:bg-slate-50 transition-colors">
                      <input type="radio" name="regimen" value={r} checked={formData.regimen === r} onChange={handleInputChange} />
                      <span className="text-sm">{r}</span>
                    </label>
                  ))}
                </div>
                <label className="flex items-center gap-4 cursor-pointer p-4 bg-slate-50 rounded-2xl border-2 border-transparent hover:border-emerald-200 transition-all">
                  <input type="checkbox" name="autoretenedor" checked={formData.autoretenedor} onChange={handleInputChange} className="w-5 h-5 accent-emerald-500" />
                  <div>
                    <span className="font-bold block">¿Es Autorretenedor?</span>
                    <span className="text-xs text-slate-500">Marque si su empresa posee resolución de autorretenedor.</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 6: Referencias */}
          {step === 6 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <Globe className="text-emerald-500" />
                <h2 className="text-xl font-bold text-slate-800">Referencias Comerciales</h2>
              </div>
              <p className="text-sm text-slate-500 mb-4">Indique dos empresas con las que tenga relaciones comerciales vigentes.</p>
              <input type="text" name="referencia_1" value={formData.referencia_1} onChange={handleInputChange} className="input-field" placeholder="Empresa 1 (Nombre y Contacto)" />
              <input type="text" name="referencia_2" value={formData.referencia_2} onChange={handleInputChange} className="input-field" placeholder="Empresa 2 (Nombre y Contacto)" />
            </div>
          )}

          {/* Step 7: Finalización / SARLAFT */}
          {step === 7 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <ShieldCheck className="text-emerald-500" />
                <h2 className="text-xl font-bold text-slate-800">Declaración de Fondos (SARLAFT)</h2>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl text-xs text-slate-600 leading-relaxed border border-slate-200 h-64 overflow-y-auto mb-6">
                <p className="font-bold mb-2"> DECLARACIÓN DE ORIGEN DE FONDOS Y SEGURIDAD</p>
                El suscrito declara que: 1. Los recursos que maneja la empresa no provienen de ninguna actividad ilícita de las enumeradas en el Estatuto Orgánico del Sistema Financiero. 2. La empresa no se encuentra vinculada en listas internacionales (OFAC, ONU, etc.) relacionadas con lavado de activos o financiación del terrorismo. 3. Toda la información suministrada en este formulario es veraz y verificable. 4. Autoriza a Help Soluciones Informáticas a tratar estos datos bajo la política de tratamiento de datos personales (Ley 1581 de 2012).
                <br /><br />
                Al marcar la casilla, usted confirma la veracidad de la información y acepta el tratamiento de sus datos personales.
              </div>
              <label className="flex items-center gap-4 cursor-pointer p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-100">
                <input type="checkbox" name="acepta_sarlaft" checked={formData.acepta_sarlaft} onChange={handleInputChange} required className="w-6 h-6 accent-emerald-500" />
                <span className="font-bold text-emerald-900">Acepto la declaración de fondos y políticas.</span>
              </label>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-12 flex justify-between gap-4">
            <button 
              type="button" 
              onClick={prevStep}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
                step === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <ChevronLeft size={20} /> Atrás
            </button>
            
            {step < totalSteps ? (
              <button 
                type="button" 
                onClick={nextStep}
                className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-200"
              >
                Siguiente <ChevronRight size={20} />
              </button>
            ) : (
              <button 
                type="submit" 
                disabled={loading}
                className="flex items-center gap-2 px-10 py-3 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
              >
                {loading ? 'Procesando...' : 'Finalizar Registro'}
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Global Styles */}
      <style>{`
        .label {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
          margin-left: 0.25rem;
        }
        .input-field {
          width: 100%;
          padding: 0.8rem 1rem;
          background: #f8fafc;
          border: 2px solid #f1f5f9;
          border-radius: 14px;
          outline: none;
          transition: all 0.2s;
          color: #0f172a;
          font-size: 0.95rem;
        }
        .input-field:focus {
          background: white;
          border-color: #10b981;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }
        .input-select {
          width: 100%;
          padding: 0.8rem 1rem;
          background: #f8fafc;
          border: 2px solid #f1f5f9;
          border-radius: 14px;
          outline: none;
          cursor: pointer;
          appearance: none;
        }
        .drop-zone {
          border: 2px dashed #e2e8f0;
          border-radius: 20px;
          padding: 1.5rem;
          text-align: center;
          transition: all 0.2s;
          background: #f8fafc;
        }
        .drop-zone:hover {
          border-color: #10b981;
          background: #ecfdf5;
        }
        .drop-zone.active {
          border-color: #10b981;
          background: #ecfdf5;
          border-style: solid;
        }
        .animate-slide-up {
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
