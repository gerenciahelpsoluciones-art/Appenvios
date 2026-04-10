import React from 'react';

export const metadata = {
  title: 'Política de Privacidad | Help Soluciones Informáticas',
  description: 'Política de Privacidad y Tratamiento de Datos Personales de Help Soluciones Informáticas.',
};

export default function PoliticaPrivacidad() {
  return (
    <main className="min-h-screen bg-white">
      
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-8">
            Política de Privacidad
          </h1>
          
          <div className="prose prose-slate max-w-none prose-h2:font-display prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-p:text-slate-600 prose-p:leading-relaxed">
            <p>
              En <strong>Help Soluciones Informáticas</strong>, estamos comprometidos con la protección de tu privacidad y el manejo seguro de tus datos personales. 
              Esta política describe cómo recopilamos, usamos y protegemos la información que nos proporcionas a través de nuestro sitio web y servicios.
            </p>

            <h2>1. Información que Recopilamos</h2>
            <p>
              Podemos recopilar información personal como tu nombre, dirección de correo electrónico, número de teléfono y detalles de tu empresa 
              cuando interactúas con nuestro sitio web, solicitas una cotización o te comunicas con nuestro equipo de soporte o ventas.
            </p>

            <h2>2. Uso de la Información</h2>
            <p>
              Utilizamos la información recopilada para:
            </p>
            <ul>
              <li>Proveer, operar y mantener nuestros servicios.</li>
              <li>Mejorar, personalizar y expandir nuestro sitio web.</li>
              <li>Comprender y analizar cómo utilizas nuestro sitio.</li>
              <li>Desarrollar nuevos productos, servicios y funcionalidades.</li>
              <li>Comunicarnos contigo para fines de servicio al cliente, actualizaciones y marketing.</li>
              <li>Procesar tus solicitudes de cotización o soporte técnico.</li>
            </ul>

            <h2>3. Compartir Información</h2>
            <p>
              No vendemos, intercambiamos ni transferimos a terceros tu información personal identificable. Esto no incluye a terceros de confianza 
              que nos asisten en la operación de nuestro sitio web o en la prestación de servicios, siempre y cuando estas partes acuerden mantener 
              esta información confidencial.
            </p>

            <h2>4. Seguridad de los Datos</h2>
            <p>
              Implementamos una variedad de medidas de seguridad para mantener la seguridad de tu información personal cuando realizas un pedido 
              o ingresas, envías o accedes a tu información personal.
            </p>

            <h2>5. Tus Derechos</h2>
            <p>
              Tienes derecho a acceder, rectificar, actualizar o solicitar la eliminación de tu información personal. 
              Puedes ejercer estos derechos comunicándote con nosotros a través de los canales oficiales proporcionados en el sitio web (WhatsApp, Correo Electrónico).
            </p>

            <h2>6. Cambios a esta Política</h2>
            <p>
              Nos reservamos el derecho de actualizar o cambiar nuestra Política de Privacidad en cualquier momento. 
              Te notificaremos cualquier cambio publicando la nueva Política de Privacidad en esta página.
            </p>

            <h2>7. Contacto</h2>
            <p>
              Si tienes alguna pregunta sobre esta Política de Privacidad, por favor contáctanos a: <strong>gerencia@helpsoluciones.com.co</strong>
            </p>

            <p className="text-sm text-slate-500 mt-12">
              Última actualización: Marzo 2026
            </p>
          </div>
        </div>
      </div>

    </main>
  );
}
