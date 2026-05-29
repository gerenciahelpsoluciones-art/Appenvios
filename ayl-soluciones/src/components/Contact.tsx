import { Mail, Phone, MapPin, Send, MessageCircle } from 'lucide-react';

const Contact = () => {
  return (
    <section id="contacto" className="py-32 bg-white relative overflow-hidden">
      {/* Visual Elements */}
      <div className="absolute -bottom-24 -left-24 w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full animate-pulse" />
      
      <div className="layout-container">
        <div className="grid lg:grid-cols-2 gap-24 items-start">
          {/* Info Side */}
          <div className="max-w-xl">
             <h2 className="text-xs font-bold tracking-[0.4em] text-primary uppercase mb-6">
              Hablemos
            </h2>
            <h3 className="text-5xl md:text-7xl font-display font-bold text-emerald-deep mb-8 leading-[0.95] tracking-tighter">
              Cuéntenos su <span className="text-accent italic">proyecto</span>
            </h3>
            <p className="text-lg text-emerald-deep/60 mb-12 leading-relaxed font-medium">
              Respondemos en menos de 24 horas con una propuesta ajustada a su presupuesto y necesidades. Sin compromisos.
            </p>

            <div className="space-y-8">
              <div className="flex items-center gap-6 p-6 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-lg text-primary">
                  <Phone size={24} />
                </div>
                <div>
                  <div className="text-xs font-bold text-primary/40 uppercase tracking-widest mb-1">Teléfono</div>
                  <div className="text-lg font-bold text-emerald-deep">+57 310 556 6421</div>
                </div>
              </div>

              <div className="flex items-center gap-6 p-6 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-lg text-primary">
                  <Mail size={24} />
                </div>
                <div>
                  <div className="text-xs font-bold text-primary/40 uppercase tracking-widest mb-1">Correo Electrónico</div>
                  <div className="text-lg font-bold text-emerald-deep">gerencia@ayl.com</div>
                </div>
              </div>

              <div className="flex items-center gap-6 p-6 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-lg text-primary">
                  <MapPin size={24} />
                </div>
                <div>
                  <div className="text-xs font-bold text-primary/40 uppercase tracking-widest mb-1">Sede Principal</div>
                  <div className="text-lg font-bold text-emerald-deep">Bogotá, Colombia</div>
                </div>
              </div>
            </div>

            {/* Social / WhatsApp CTA */}
            <div className="mt-12 flex items-center gap-6">
              <a
                href="https://wa.me/573105566421"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-8 py-4 bg-[#25D366] text-white font-bold rounded-2xl hover:scale-105 transition-transform shadow-xl shadow-green-500/20"
              >
                <MessageCircle size={22} />
                Contactar por WhatsApp
              </a>
            </div>
          </div>

          {/* Form Side */}
          <div className="p-10 rounded-3xl bg-emerald-deep shadow-2xl relative overflow-hidden">
            {/* Form Background Pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full" />
            
            <form className="relative z-10 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Nombre Completo</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Juan Pérez"
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:border-accent outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Empresa</label>
                  <input 
                    type="text" 
                    placeholder="Nombre de su organización"
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:border-accent outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Correo Corporativo</label>
                <input 
                  type="email" 
                  placeholder="juan@suempresa.com"
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:border-accent outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Línea de Interés</label>
                <select className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white/60 focus:border-accent outline-none transition-colors appearance-none">
                  <option className="bg-emerald-deep">Organización de Eventos</option>
                  <option className="bg-emerald-deep">Marketing Experiencial</option>
                  <option className="bg-emerald-deep">Gastronomía & Catering</option>
                  <option className="bg-emerald-deep">Suministro Empresarial</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Detalles del Proyecto</label>
                <textarea 
                  rows={4}
                  placeholder="Cuéntanos brevemente qué necesitas..."
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:border-accent outline-none transition-colors"
                ></textarea>
              </div>

              <button className="w-full py-5 bg-accent text-emerald-deep font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-accent/20">
                <Send size={20} />
                Enviar Solicitud
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
