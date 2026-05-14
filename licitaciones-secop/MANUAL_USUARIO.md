# Manual de Usuario — Licitaciones SECOP
### Sistema de Inteligencia para Contratación Pública Colombiana
**Help Soluciones Informáticas · v1.0**

---

## ¿Qué es este programa?

Licitaciones SECOP es una aplicación de escritorio web que centraliza todo el proceso de identificación, análisis y preparación de propuestas para contratos públicos en Colombia. Combina búsqueda en tiempo real de los portales SECOP I y SECOP II con inteligencia artificial (Claude AI) para evaluar qué tan compatible es cada proceso con el perfil y experiencia de la empresa.

**Lo que resuelve:**
- Encontrar oportunidades relevantes sin revisar manualmente el portal SECOP
- Saber con un score de 0–100 qué tan viable es participar en un proceso
- Generar los documentos base de una propuesta en segundos
- Registrar y rastrear los hitos clave de cada proceso
- Investigar el historial de contratación de una entidad
- Cargar el certificado RUP y que la IA extraiga automáticamente los códigos UNSPSC y certificaciones de experiencia

---

## Requisitos para usar la aplicación

| Requisito | Detalle |
|---|---|
| Navegador web moderno | Chrome, Edge o Firefox (última versión) |
| API Key de Anthropic | Variable de entorno `VITE_ANTHROPIC_API_KEY` en el archivo `.env` |
| Conexión a internet | Para consultar SECOP y ejecutar análisis con IA |

**Configurar la API Key** — crear el archivo `.env` en la raíz del proyecto:
```
VITE_ANTHROPIC_API_KEY=sk-ant-api03-...
```

---

## Estructura de la aplicación

La aplicación se divide en **6 módulos** accesibles desde la barra de pestañas superior:

```
🔍 Monitor Agente     → Buscar y explorar procesos en SECOP
🧠 Match IA           → Analizar compatibilidad con la empresa
📄 Documentos Base    → Generar documentos de propuesta con IA
📅 Hitos del Proceso  → Gestionar fechas clave y cronograma
🏛️ Historial Entidad  → Investigar historial de contratación
📂 RUP / Experiencia  → Cargar y gestionar el certificado RUP
```

---

## Módulo 1 — Monitor Agente 🔍

**Propósito:** Buscar procesos activos en SECOP I y SECOP II simultáneamente y guardar los más relevantes.

### Cómo buscar

1. Completar uno o más filtros:
   - **Palabras clave** — términos del objeto del contrato (ej: `soporte técnico`, `infraestructura`, `software`)
   - **Entidad** — nombre parcial de la entidad (ej: `Ministerio`, `Alcaldía`)
   - **Departamento** — filtrar por departamento colombiano
   - **Modalidad** — Licitación Pública, Mínima Cuantía, Contratación Directa, etc.
   - **Presupuesto mínimo / máximo** — rango en pesos COP
   - **Solo procesos activos** — filtra los ya cerrados o adjudicados

2. Hacer clic en **🔍 Buscar en SECOP I + II** — la búsqueda consulta ambas fuentes en paralelo y muestra los resultados ordenados por fecha más reciente.

> Si no se ingresan filtros, la búsqueda usa por defecto los términos `tecnología software sistemas`.

### Auto-búsqueda

Activar la casilla **Auto-búsqueda** para que la aplicación repita la búsqueda automáticamente cada:
- 15 minutos
- 30 minutos
- 60 minutos
- 120 minutos

Útil para monitorear en tiempo real sin recargar manualmente.

### Tarjeta de proceso

Cada resultado muestra:
- Número de proceso y entidad contratante
- Descripción (expandible con "Ver más")
- Fuente (SECOP I en rojo · SECOP II en azul)
- Modalidad, estado, presupuesto, ubicación y fecha de publicación
- Badge de **Match Score** si ya fue analizado

### Acciones disponibles en cada proceso

| Botón | Acción |
|---|---|
| **🧠 Match IA** | Calcula el score de compatibilidad con la empresa usando Claude AI |
| **💾 Guardar** | Guarda el proceso localmente para trabajarlo después |
| **📬 Telegram** | Envía una notificación al canal de Telegram configurado |
| **🔗 Ver SECOP** | Abre el proceso en el portal oficial de SECOP |

> Un proceso guardado queda disponible en todos los demás módulos.

---

## Módulo 2 — Match IA 🧠

**Propósito:** Evaluar con inteligencia artificial qué tan compatible es cada proceso guardado con el perfil de la empresa.

### Score de compatibilidad

El modelo Claude Opus 4.7 analiza:
1. Alineación entre los servicios/códigos UNSPSC del RUP y el objeto del contrato
2. Experiencia acreditada en el RUP vs. requisitos del proceso
3. Capacidad financiera (K de contratación) vs. presupuesto oficial
4. Certificaciones habilitantes (ISO, Cámara de Comercio, RUT)
5. Historial de contratos similares

**Escala de puntuación:**

| Score | Nivel | Color |
|---|---|---|
| 70 – 100 | Alto | Verde |
| 40 – 69 | Medio | Amarillo |
| 20 – 39 | Bajo | Rojo |
| 0 – 19 | Sin match | Gris |

### Cómo analizar

- **Analizar proceso individual:** Clic en el proceso → botón **Re-analizar**
- **Analizar todos:** Botón **⚡ Analizar todos** procesa secuencialmente los procesos sin score

Al expandir una tarjeta se muestra el detalle completo:
- **Justificación:** Párrafo explicativo del análisis
- **Fortalezas ✅** — ventajas competitivas detectadas
- **Debilidades ⚠️** — brechas o riesgos identificados
- **Recomendaciones 💡** — acciones sugeridas para mejorar la propuesta

### Editar perfil de la empresa

Botón **✏️ Editar Perfil** — abre un editor JSON con:
- Nombre y NIT
- Sector y descripción
- Lista de servicios ofrecidos
- Experiencia previa (proyectos, entidades, valores, años)
- Certificaciones vigentes
- Capacidad financiera (activos, ingresos, patrimonio)

> Los cambios al perfil afectan todos los análisis futuros. Se recomienda mantenerlo actualizado antes de analizar nuevos procesos.

### Configuración de Telegram

Botón **📬 Telegram** — abre el panel de notificaciones:
- **Bot Token** — token del bot de Telegram (obtenido con @BotFather)
- **Chat ID** — ID del canal o grupo receptor
- **Score mínimo** — solo notifica procesos por encima de este umbral
- **Notificar procesos nuevos** — alerta cuando se guarda un proceso
- **Notificar cambios de estado** — alerta cuando un proceso cambia de estado
- Botón **🧪 Probar conexión** — verifica que el bot esté activo

---

## Módulo 3 — Documentos Base 📄

**Propósito:** Generar con IA los documentos base de una propuesta para cualquier proceso guardado.

### Tipos de documentos disponibles

| Tipo | Contenido |
|---|---|
| **Carta de Presentación** | Carta formal dirigida a la entidad, presentación de la empresa y manifestación de interés |
| **Experiencia Relevante** | Tabla de proyectos similares, valores, entidades, fechas y documentos de soporte sugeridos |
| **Propuesta Técnica** | Metodología, plan de trabajo, equipo propuesto, gestión de calidad y riesgos |
| **Propuesta Económica** | Tabla de costos desglosada (personal, equipos, software, AIU), forma de pago |
| **Cronograma** | Fases, actividades, duración, hitos y cronograma de pagos |

### Cómo generar un documento

1. Seleccionar el proceso en el menú desplegable **"Seleccionar proceso"**
2. Elegir el tipo de documento con los botones de opción
3. Revisar la vista previa del proceso (entidad, descripción, presupuesto)
4. Hacer clic en **✨ Generar Documento**
5. El documento aparece en el panel de visualización y queda guardado en el historial

### Gestionar documentos generados

- **📋 Copiar** — copia el texto completo al portapapeles
- **👁️ Ver** — muestra el documento en el panel
- **🗑️ Eliminar** — borra del historial

> Se almacenan hasta los últimos 100 documentos generados. El contenido generado es un punto de partida — siempre revisar y ajustar antes de presentar la propuesta oficial.

---

## Módulo 4 — Hitos del Proceso 📅

**Propósito:** Registrar y hacer seguimiento a las fechas clave de cada proceso (apertura de pliegos, plazo de propuestas, adjudicación, etc.).

### Crear un hito

1. Seleccionar el proceso en el desplegable
2. Hacer clic en **+ Nuevo Hito**
3. Completar el formulario:
   - **Nombre** del hito (requerido)
   - **Descripción** (opcional)
   - **Fecha estimada** (requerida)
   - **Fecha real** (si ya ocurrió)
   - **Estado:** Pendiente · En Progreso · Completado · Vencido
   - **Responsable:** nombre o cargo
   - **Notas:** observaciones adicionales

### Hitos sugeridos

El botón **📋 Hitos Sugeridos** ofrece atajos para los 11 hitos más comunes de un proceso licitatorio colombiano:

1. Descarga de pliegos
2. Visita al sitio de obra
3. Observaciones a pliegos
4. Presentación de oferta
5. Apertura de sobres
6. Evaluación de ofertas
7. Informe de evaluación
8. Traslado del informe
9. Adjudicación
10. Firma del contrato
11. Acta de inicio

### Vista de línea de tiempo

Los hitos se muestran en orden cronológico con indicador visual de estado:
- ⏳ **Pendiente** — gris
- 🔄 **En Progreso** — azul
- ✅ **Completado** — verde
- ❌ **Vencido** — rojo

> Un hito pendiente con fecha estimada ya pasada se marca automáticamente con alerta visual roja.

Desde cada hito se puede cambiar el estado directamente en el selector o hacer clic en ✏️ para editar todos los campos.

---

## Módulo 5 — Historial Entidad 🏛️

**Propósito:** Consultar el historial de contratos de una entidad para conocer sus proveedores habituales, modalidades frecuentes y valores típicos.

### Cómo consultar

1. Escribir el nombre parcial de la entidad o su NIT en el campo de búsqueda
   - Ejemplos: `Ministerio de Educación`, `SENA`, `900123456`
2. Presionar **Enter** o hacer clic en **🔍 Consultar Historial**
3. La búsqueda consulta SECOP I y SECOP II en paralelo

### Resultados

**Resumen estadístico (4 indicadores):**
- Contratos encontrados
- Valor total histórico acumulado
- Número de contratistas únicos
- Modalidad más frecuente

**Contratistas ganadores:**
Lista de las primeras 20 empresas que han contratado con la entidad (con "+N más" si hay más).

**Tarjetas de contratos:**
Cada contrato muestra:
- Descripción del objeto
- Fuente, modalidad y estado
- Fecha, departamento y municipio
- Número de proceso
- **Valor del contrato** (destacado en verde)
- **Empresa contratista y NIT** (recuadro morado)

> Esta información es clave para conocer la competencia, los valores que maneja la entidad y si la empresa ya tiene antecedentes de contratar con ellos.

---

## Módulo 6 — RUP / Experiencia 📂

**Propósito:** Cargar el certificado RUP (Registro Único de Proponentes) emitido por la Cámara de Comercio para que la IA extraiga automáticamente los códigos UNSPSC y las certificaciones de experiencia. Esta información enriquece el análisis de compatibilidad del Match IA.

### Formatos aceptados

| Formato | Extensión |
|---|---|
| PDF | `.pdf` |
| Imagen JPEG | `.jpg` / `.jpeg` |
| Imagen PNG | `.png` |
| Imagen WebP | `.webp` |

### Cómo cargar el RUP

1. Arrastrar el archivo al área de carga o hacer clic en ella
2. Claude analiza el documento con visión artificial
3. Los datos extraídos se muestran en las tres secciones:
   - 🏷️ **Códigos UNSPSC**
   - 📜 **Certificaciones de experiencia**
   - 💰 **Capacidad financiera**
4. Hacer clic en **💾 Guardar** para persistir los datos

Se pueden cargar múltiples archivos. Los datos se acumulan sin duplicar códigos ni certificaciones existentes.

### Información que extrae la IA

**Del proponente:**
- NIT y razón social
- Fecha de inscripción y vigencia del RUP

**Códigos UNSPSC:**
- Código numérico
- Descripción completa
- Segmento, familia y clase

**Certificaciones de experiencia:**
- Entidad contratante
- Objeto del contrato
- Número de contrato
- Valor en pesos
- Fechas de inicio y fin
- Códigos UNSPSC asociados

**Capacidad financiera:**
- K de contratación
- Índice de liquidez
- Nivel de endeudamiento
- Rentabilidad

### Sección Códigos UNSPSC

- Buscador para filtrar por código o descripción
- Cada código es un chip expandible que muestra la jerarquía completa
- Botón ✕ para eliminar un código individual

### Sección Certificaciones

- Lista de contratos de experiencia acreditados
- Muestra entidad, objeto, valor y fechas
- Botón 🗑️ para eliminar una certificación

### Sección Capacidad Financiera

- Cuatro indicadores financieros del RUP
- Usado por el Match IA para comparar con el presupuesto del proceso

### Acciones generales

- **💾 Guardar** — guarda todos los cambios en el almacenamiento local
- **🗑️ Limpiar** — borra todos los datos RUP (pide confirmación)

---

## Flujo de trabajo recomendado

```
1. RUP / Experiencia
   └─ Cargar el certificado RUP vigente
   └─ Verificar que los códigos UNSPSC y certificaciones están correctos
   └─ Guardar

2. Monitor Agente
   └─ Configurar filtros relevantes (keywords, departamento, presupuesto)
   └─ Ejecutar búsqueda
   └─ Revisar resultados y guardar los procesos de interés

3. Match IA
   └─ Analizar los procesos guardados
   └─ Revisar scores, fortalezas y debilidades
   └─ Priorizar los de score Alto (70+)

4. Documentos Base
   └─ Para cada proceso priorizado, generar los 5 documentos base
   └─ Copiar y personalizar cada documento

5. Hitos del Proceso
   └─ Registrar las fechas clave del proceso (pliegos, plazo, apertura)
   └─ Hacer seguimiento del estado de cada hito

6. Historial Entidad (cuando sea necesario)
   └─ Investigar la entidad antes de preparar la propuesta
   └─ Identificar competidores habituales y valores típicos
```

---

## Persistencia de datos

Todos los datos se guardan en el almacenamiento local del navegador (`localStorage`). No requiere base de datos ni servidor externo.

| Datos | Clave de almacenamiento |
|---|---|
| Procesos guardados | `licit_procesos` |
| Hitos | `licit_hitos` |
| Documentos generados | `licit_documentos` |
| Perfil de empresa | `licit_empresa_perfil` |
| Datos RUP | `licit_rup_data` |

> Los datos persisten entre sesiones en el mismo navegador. Para respaldarlos, exportar desde las herramientas de desarrollador del navegador (F12 → Application → Local Storage).

---

## Integraciones externas

| Sistema | Propósito | Configuración |
|---|---|---|
| **SECOP I** (datos.gov.co) | Búsqueda de procesos históricos | Sin configuración — acceso público |
| **SECOP II** (datos.gov.co) | Búsqueda de procesos activos y recientes | Sin configuración — acceso público |
| **Claude AI** (Anthropic) | Match score, generación de documentos, extracción RUP | `VITE_ANTHROPIC_API_KEY` en `.env` |
| **Telegram Bot** | Notificaciones de nuevos procesos | Configurar en pestaña Match IA |

---

## Preguntas frecuentes

**¿Por qué no aparecen resultados en la búsqueda?**
Verificar que la conexión a internet esté activa y que los filtros no sean demasiado restrictivos. Intentar con solo palabras clave y sin otros filtros.

**¿El análisis Match IA tarda mucho?**
El análisis usa Claude Opus con modo de pensamiento adaptativo — puede tardar entre 10 y 30 segundos por proceso dependiendo del tamaño del texto.

**¿Se pueden analizar procesos sin RUP cargado?**
Sí. El análisis funciona con el perfil de empresa básico. Con el RUP cargado el score es más preciso porque incluye los códigos UNSPSC y certificaciones acreditadas.

**¿Los documentos generados son definitivos?**
No — son borradores estructurados. Siempre deben revisarse, personalizarse y validarse contra los pliegos de condiciones antes de presentar la propuesta oficial.

**¿Qué pasa si cargo varios archivos RUP?**
Los datos se acumulan: nuevos códigos UNSPSC y certificaciones se agregan sin duplicar los existentes. Útil para combinar el RUP principal con documentos de experiencia adicionales.

**¿Los datos se pierden al cerrar el navegador?**
No. Se guardan en `localStorage` y persisten entre sesiones en el mismo navegador y perfil.
