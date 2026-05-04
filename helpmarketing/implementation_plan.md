# Plan de Implementación: PL Consulting & Tax SAS

Este documento detalla el plan para construir la nueva página web profesional para **PL Consulting & Tax SAS**, basándome en el brochure proporcionado.

## Resumen del Proyecto
El objetivo es construir una *landing page* corporativa muy profesional que transmita **Confianza y Autoridad**, utilizando React, Vite y Tailwind CSS. La página actuará como un "Enterprise Gateway", destacando la experiencia, los servicios contables y facilitando el contacto por WhatsApp.

> [!IMPORTANT]
> **Revisión del usuario:** 
> 1. He asumido que crearé este proyecto en una nueva carpeta llamada `plconsulting-web` dentro de tu espacio de trabajo actual (`helpmarketing`). ¿Estás de acuerdo con esta ubicación o prefieres que lo cree en otra parte?
> 2. El brochure indica "Contadores Públicos", pero en tu mensaje mencionaste "firma de abogados". Confirmame si nos enfocamos 100% en el texto de contadores del brochure (Contabilidad, Impuestos, Revisoría Fiscal, etc.).

## 🎨 Sistema de Diseño Propuesto (Trust & Authority)

Basado en la inteligencia de diseño UX/UI para sitios corporativos y financieros:

- **Colores:**
  - **Azul Corporativo (Primario):** `#0B1B3D` (Navy profundo para autoridad y profesionalismo).
  - **Oro/Mostaza (Acento/CTA):** `#C5A059` (Para destacar botones y elementos clave).
  - **Fondo:** `#F8FAFC` (Gris muy claro para un aspecto limpio y moderno).
  - **Texto Principal:** `#0F172A` (Gris oscuro para máxima legibilidad).
- **Tipografía:** 
  - Títulos: *Playfair Display* o *Merriweather* (Serif elegante que hace juego con el logo).
  - Cuerpo del texto: *Open Sans* o *Inter* (Limpio y moderno).
- **Estilo Visual:** Botones con sutiles efectos de hover, uso de tarjetas de "vidrio" (glassmorphism muy suave) o tarjetas blancas con sombras de elevación, iconos vectoriales profesionales (Lucide/Heroicons) consistentes.

## 🏗️ Estructura de la Landing Page

La web será una *One-Page* (todo en una página con scroll suave) con las siguientes secciones:

1. **Header (Navegación):**
   - Logo "PL Consulting & Tax SAS" a la izquierda.
   - Enlaces: Inicio, Nosotros, Servicios, Contacto.
   - Botón CTA: "Contactar por WhatsApp".
2. **Hero Section (Inicio):**
   - **Título:** "Soluciones contables y tributarias que generan valor y tranquilidad"
   - **Subtítulo:** "Su tranquilidad financiera, nuestro compromiso."
   - **Fondo:** Imagen premium de una oficina/laptop con un overlay del azul corporativo.
   - **Botones:** "Ver Servicios" y "Escríbenos".
3. **Sobre Nosotros:**
   - Texto introductorio del brochure: *"Firma de contadores públicos comprometida con brindar soluciones integrales..."*
   - Tarjetas de valores: Experiencia, Confianza, Valor (con iconos).
4. **Nuestros Servicios:**
   - Grilla (Grid) de tarjetas profesionales para: Contabilidad, Impuestos, Revisoría Fiscal, Asesoría Empresarial, Nómina y Seguridad Social.
   - Breve descripción debajo de cada uno.
5. **Cita Destacada (Frase):**
   - Bloque elegante con la frase: *"Transformamos números en información, información en decisiones y decisiones en resultados."*
6. **Footer / Contacto:**
   - Información de ubicación: Carrera 93 F 127 B 12.
   - Email: Plconsulting.tax@gmail.com.
   - CTA final con un botón grande de WhatsApp: 3133961662.
   - Enlace a www.plconsultingtax.com (si aplica como dominio).

## 💻 Plan de Ejecución Técnico

### 1. Configuración del Entorno
- Crear el proyecto Vite + React + TypeScript.
- Instalar Tailwind CSS y configurarlo con los colores corporativos.
- Instalar `lucide-react` para los iconos profesionales.

### 2. Desarrollo de Componentes
- `Navbar`: Menú fijo (sticky) con efecto de desenfoque.
- `Hero`: Sección principal de impacto visual.
- `AboutUs`: Sección de valores y descripción.
- `Services`: Grilla de servicios interactiva.
- `ContactFooter`: Pie de página con enlaces y botón de WhatsApp.

### 3. Refinamiento UX/UI
- Añadir transiciones suaves (`duration-300 transition-all`).
- Asegurar que todos los elementos clicables tengan `cursor-pointer`.
- Verificación de contraste de colores para accesibilidad (WCAG).
- Optimización responsiva completa (Móvil, Tablet, Desktop).

## Plan de Verificación
1. **Verificación visual:** Comprobar que los colores y la estructura coincidan con la imagen de referencia.
2. **Prueba de botones:** Asegurar que el botón de WhatsApp abra el chat con el número correcto.
3. **Prueba responsiva:** Redimensionar la pantalla para asegurar que las grillas colapsen correctamente en móviles.

---
**¿Apruebas este plan para comenzar la construcción?**
