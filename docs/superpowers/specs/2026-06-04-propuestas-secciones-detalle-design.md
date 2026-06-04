# Propuestas — Secciones de Detalle del Servicio

**Fecha:** 2026-06-04  
**Estado:** Aprobado

## Objetivo

Agregar 4 secciones editables a la propuesta comercial (formulario + PDF) que permitan al comercial documentar el alcance completo del servicio: objetivo, equipo asignado, cronograma de visitas y obligaciones del cliente.

## Orden PDF

| Página | Contenido |
|---|---|
| 1 | Portada (sin cambios) |
| **2** | **Detalles de la Propuesta** ← nueva |
| 3 | Protocolo del servicio (sin cambios, renumerado) |
| 4 | Tabla de inversión + Términos + Firmas (sin cambios, renumerado) |

---

## Sección 1 — Modelo de Datos (`src/App.tsx`)

### Nuevas interfaces

```typescript
export interface PersonalItem {
  id: string;
  nombre: string;
  cargo: string;
}

export interface VisitaItem {
  id: string;
  sede: string;
  horario: string;
}
```

### Campos nuevos en `Propuesta`

```typescript
objetivo: string;
personal: PersonalItem[];
visitas: VisitaItem[];
obligacionesCliente: string[];
```

Se agregan después del campo `observaciones`.

### Valores por defecto en `makeEmpty`

```typescript
objetivo: 'Proveer un servicio integral de mantenimiento preventivo para los equipos tecnológicos, garantizando su óptimo funcionamiento y continuidad operativa.',
personal: [{ id: crypto.randomUUID(), nombre: currentUser.nombre, cargo: 'Ingeniero de Soporte' }],
visitas:  [{ id: crypto.randomUUID(), sede: '', horario: '' }],
obligacionesCliente: [
  'Proporcionar acceso a las instalaciones y los equipos.',
  'Notificar incidencias o fallos de manera oportuna.',
  'Cumplir con los plazos acordados.',
],
```

### Supabase (`src/App.tsx` — funciones `addPropuesta` / `updatePropuesta`)

Agregar 4 columnas a la tabla `propuestas`:
- `objetivo` — `text`
- `personal` — `jsonb`
- `visitas` — `jsonb`
- `obligaciones_cliente` — `jsonb`

En `addPropuesta` y `updatePropuesta` mapear los campos al objeto enviado a Supabase. En el loader (SELECT) mapear de vuelta al tipo `Propuesta`.

---

## Sección 2 — Formulario (`src/modules/Propuestas.tsx`)

### Ubicación

Las 4 secciones se insertan **debajo del grid de 2 columnas** (después del cierre del `</div>` que contiene LEFT+RIGHT), antes de los botones footer. Siempre visibles (sin acordeón).

### Estado nuevo en el componente

No se necesita estado adicional — los datos viven en `form.objetivo`, `form.personal`, `form.visitas`, `form.obligacionesCliente` y se actualizan con `setForm`.

### Layout de cada sección

**Objetivo:**
```
Label: 🎯 OBJETIVO DE LA PROPUESTA
<textarea> — 3 filas, editable, inicializado con el texto por defecto
```

**Personal a cargo:**
```
Label: 👥 PERSONAL A CARGO
Tabla: Nombre (input) | Cargo/Rol (input) | [×]
Una fila por PersonalItem. Botón "+ Agregar persona".
```
- Agregar: `setForm(f => ({ ...f, personal: [...f.personal, { id: crypto.randomUUID(), nombre: '', cargo: '' }] }))`
- Eliminar: filtrar por id
- Editar: map por id + spread de cambios

**Visitas a Sedes y Horarios:**
```
Label: 📅 VISITAS A SEDES Y HORARIOS
Hint: "El mantenimiento se realizará en la ventana propuesta por el cliente."
Tabla: Sede/Ciudad (input) | Horario (input) | [×]
Una fila por VisitaItem. Botón "+ Agregar sede".
```
- Misma lógica que Personal.

**Obligaciones del Cliente:**
```
Label: 📋 OBLIGACIONES DEL CLIENTE
Lista: ● [input editable] | [×]
Una fila por string en obligacionesCliente. Botón "+ Agregar obligación".
```
- Agregar: `[...f.obligacionesCliente, '']`
- Eliminar: `filter((_, i) => i !== idx)`
- Editar: `map((v, i) => i === idx ? nuevoValor : v)`

### Estilos (dark slate, consistentes con el resto del form)

Cada sección dentro de un `<div className="border border-slate-700/50 rounded-xl p-4 space-y-3">` con label `text-xs uppercase tracking-wider text-slate-500`. Inputs: `bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200`. Botones "+ Agregar": `text-xs text-indigo-400 border border-dashed border-slate-600 rounded-lg py-2 w-full`.

---

## Sección 3 — PDF (`src/services/propuestaPdf.ts`)

### Nueva función `addPageDetails`

```typescript
const addPageDetails = (doc: jsPDF, propuesta: Propuesta, pageNum: number) => {
  addPageHeader(doc, propuesta, pageNum);
  // Renderiza las 4 secciones
}
```

Se llama antes de `addPage()` que inicia el protocolo. Los números de página se incrementan en 1 para protocolo y tabla de inversión.

### Contenido de la página 2

**Cabecera de sección:**
```
Label pequeño: DETALLES DE LA PROPUESTA  (color INDIGO)
Título: Alcance y Condiciones del Servicio  (TEXT_DARK, bold)
```

**Bloque Objetivo:**
- Caja con fondo LIGHT_GRAY, borde izquierdo INDIGO (1.5mm), texto del `propuesta.objetivo`.

**Bloque Personal a Cargo:**
- Título de bloque + `autoTable` con head `['Nombre', 'Cargo / Rol']`, body desde `propuesta.personal.map(p => [p.nombre, p.cargo])`. headStyles: fillColor DARK_BLUE.

**Bloque Visitas a Sedes y Horarios:**
- Título de bloque + `autoTable` con head `['Sede / Ciudad', 'Ventana de Mantenimiento']`, body desde `propuesta.visitas.map(v => [v.sede, v.horario])`.
- Nota al pie del bloque en cursiva: *"El mantenimiento se realizará en la ventana de mantenimiento propuesta por el cliente."*

**Bloque Obligaciones del Cliente:**
- Título de bloque.
- Lista de bullets: círculo índigo + texto, una línea por obligación.

### Compatibilidad retroactiva

Si `propuesta.personal` es `undefined` (propuestas antiguas en Supabase), usar `[]`. Misma guarda para `visitas`, `obligacionesCliente` y `objetivo` (`|| ''`).

---

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/App.tsx` | Añadir interfaces `PersonalItem`, `VisitaItem`; campos a `Propuesta`; defaults en `makeEmpty`; mapeo Supabase en add/update/load |
| `src/modules/Propuestas.tsx` | 4 secciones de UI debajo del grid principal |
| `src/services/propuestaPdf.ts` | Nueva página 2, renumerar páginas 3 y 4 |

## Lo que NO cambia

- Tipo `PropuestaItem`, lógica de ítems, cálculo de totales.
- Página 1 (portada), página 3 (protocolo), página 4 (inversión+firmas) — solo se renumeran.
- Validación del formulario.
