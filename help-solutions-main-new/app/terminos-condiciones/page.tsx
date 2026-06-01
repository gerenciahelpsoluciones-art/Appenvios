import React from 'react';

export const metadata = {
  title: 'Términos y Condiciones | Help Soluciones',
  description: 'Términos y Condiciones de uso de los servicios de Help Soluciones Informáticas.',
};

export default function TerminosCondiciones() {
  return (
    <main className="min-h-screen bg-white">

      <div className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-8">
            Términos y Condiciones
          </h1>

          <div className="prose prose-slate max-w-none prose-h2:font-display prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-p:text-slate-600 prose-p:leading-relaxed">

            <p>
              Al contratar o utilizar los servicios de <strong>Help Soluciones Informáticas</strong> (en adelante "la Empresa"),
              usted acepta los presentes Términos y Condiciones. Le recomendamos leerlos detenidamente antes de adquirir
              cualquier servicio o continuar utilizando nuestro sitio web.
            </p>

            <h2>1. Descripción del Servicio</h2>
            <p>
              Help Soluciones Informáticas ofrece servicios de soporte técnico, mantenimiento de servidores, cableado estructurado,
              ciberseguridad, infraestructura TI y consultoría tecnológica para empresas en Colombia. Los servicios específicos,
              alcance y condiciones de cada contrato se definen en la propuesta o cotización aceptada por el cliente.
            </p>

            <h2>2. Uso del Sitio Web</h2>
            <p>
              El contenido publicado en <strong>www.helpsoluciones.com.co</strong> es de carácter informativo. La Empresa se reserva
              el derecho de modificar, actualizar o eliminar cualquier contenido sin previo aviso. El uso del sitio implica
              la aceptación de estos términos.
            </p>

            <h2>3. Contratación de Servicios</h2>
            <p>
              Los servicios se formalizan mediante cotización escrita y aceptación expresa del cliente. Una vez aceptada la propuesta,
              la Empresa se compromete a ejecutar el servicio bajo los términos acordados. Cualquier cambio en el alcance debe ser
              aprobado por ambas partes mediante adición al contrato.
            </p>

            <h2>4. Condiciones de Pago</h2>
            <p>
              Las condiciones de pago se establecen en cada cotización o contrato de servicio. De forma general:
            </p>
            <ul>
              <li>Servicios de mantenimiento mensual: pago anticipado al inicio de cada periodo.</li>
              <li>Proyectos de infraestructura: 50% al inicio y 50% contra entrega, salvo acuerdo diferente.</li>
              <li>El incumplimiento en los pagos puede resultar en la suspensión del servicio.</li>
            </ul>

            <h2>5. Garantías y Responsabilidades</h2>
            <p>
              Help Soluciones Informáticas garantiza que los servicios serán prestados con personal técnico calificado y
              siguiendo buenas prácticas de la industria. Sin embargo, la Empresa no se hace responsable por:
            </p>
            <ul>
              <li>Pérdida de datos originada por fallas en equipos del cliente no reportadas previamente.</li>
              <li>Daños causados por eventos fuera de su control (fuerza mayor, cortes de energía, desastres naturales).</li>
              <li>Incompatibilidades de software de terceros no suministrado por la Empresa.</li>
            </ul>

            <h2>6. Confidencialidad</h2>
            <p>
              Help Soluciones Informáticas se compromete a guardar estricta confidencialidad sobre la información de sus clientes,
              incluyendo datos de infraestructura, sistemas, procesos y cualquier información que sea declarada confidencial.
              Este compromiso se mantiene durante y después de la relación comercial.
            </p>

            <h2>7. Propiedad Intelectual</h2>
            <p>
              Todo el contenido de este sitio web (textos, imágenes, logotipos, diseños) es propiedad de Help Soluciones Informáticas
              y está protegido por las leyes colombianas de propiedad intelectual. Queda prohibida su reproducción parcial o total
              sin autorización escrita de la Empresa.
            </p>

            <h2>8. Modificación de los Términos</h2>
            <p>
              La Empresa se reserva el derecho de actualizar estos Términos y Condiciones en cualquier momento. Los cambios
              serán publicados en esta página con la fecha de actualización. El uso continuado de los servicios implica la
              aceptación de los nuevos términos.
            </p>

            <h2>9. Ley Aplicable y Jurisdicción</h2>
            <p>
              Estos Términos y Condiciones se rigen por las leyes de la República de Colombia. Cualquier controversia será
              resuelta ante los tribunales competentes de la ciudad de Bogotá D.C., Colombia.
            </p>

            <h2>10. Contacto</h2>
            <p>
              Para cualquier consulta relacionada con estos términos, puede comunicarse con nosotros a través de:
            </p>
            <ul>
              <li>Correo electrónico: <strong>gerencia@helpsoluciones.com.co</strong></li>
              <li>WhatsApp: <strong>+57 304 3358650</strong></li>
              <li>Dirección: Carrera 93 F 127 B 12, Bogotá, Colombia</li>
            </ul>

            <p className="text-sm text-slate-500 mt-12">
              Última actualización: Mayo 2026
            </p>
          </div>
        </div>
      </div>

    </main>
  );
}
