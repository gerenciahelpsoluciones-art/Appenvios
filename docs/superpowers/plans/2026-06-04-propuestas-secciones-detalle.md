# Propuestas — Secciones de Detalle del Servicio

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar 4 secciones editables (Objetivo, Personal, Visitas, Obligaciones del Cliente) al formulario y PDF de Propuestas Comerciales.

**Architecture:** Tres archivos afectados. (1) `App.tsx`: nuevas interfaces `PersonalItem`/`VisitaItem`, campos en `Propuesta`, mapeos Supabase. (2) `Propuestas.tsx`: UI de las 4 secciones debajo del grid principal. (3) `propuestaPdf.ts`: nueva página 2 con las 4 secciones; protocolo y precio se renumeran a páginas 3 y 4.

**Tech Stack:** React 18, TypeScript, Tailwind CSS (dark slate), jsPDF + autoTable, Supabase

---

### Task 1: Tipos, campos y defaults

**Files:**
- Modify: `src/App.tsx` (interfaces + `Propuesta` type)
- Modify: `src/modules/Propuestas.tsx` (`makeEmpty` function)

- [ ] **Step 1: Agregar interfaces `PersonalItem` y `VisitaItem` en `src/App.tsx`**

Justo después del cierre de `PropuestaItem` (línea ~334), insertar:

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

- [ ] **Step 2: Agregar 4 campos a la interfaz `Propuesta` en `src/App.tsx`**

Dentro de `export interface Propuesta { ... }`, después de `observaciones: string;` y antes de `estado:`, insertar:

```typescript
  objetivo: string;
  personal: PersonalItem[];
  visitas: VisitaItem[];
  obligacionesCliente: string[];
```

- [ ] **Step 3: Actualizar `makeEmpty` en `src/modules/Propuestas.tsx`**

Encontrar la función `makeEmpty` y reemplazarla con:

```typescript
const makeEmpty = (currentUser: AppUser): Omit<Propuesta, 'id' | 'consecutivo'> => ({
  fecha: new Date().toISOString().split('T')[0],
  clienteId: '', clienteNombre: '', clienteNit: '', clienteCiudad: '', clienteContacto: '',
  tipoServicioId: '', tipoServicioNombre: '',
  moneda: 'COP', valor: 0, items: [newItem()], incluyeIva: false,
  vigencia: '30 días', observaciones: '',
  objetivo: 'Proveer un servicio integral de mantenimiento preventivo para los equipos tecnológicos, garantizando su óptimo funcionamiento y continuidad operativa.',
  personal: [{ id: crypto.randomUUID(), nombre: currentUser.nombre, cargo: 'Ingeniero de Soporte' }],
  visitas: [{ id: crypto.randomUUID(), sede: '', horario: '' }],
  obligacionesCliente: [
    'Proporcionar acceso a las instalaciones y los equipos.',
    'Notificar incidencias o fallos de manera oportuna.',
    'Cumplir con los plazos acordados.',
  ],
  estado: 'Borrador',
  comercialNombre: currentUser.nombre,
  comercialTelefono: currentUser.telefono || '',
  usuarioId: currentUser.id,
});
```

- [ ] **Step 4: Verificar TypeScript en App.tsx y Propuestas.tsx**

```bash
cd "c:/Users/carlo/OneDrive - Help Soluciones Informaticas/Documentos/Testing/Appenvios"
npx tsc --noEmit 2>&1 | grep -E "App\.tsx|Propuestas\.tsx"
```

Expected: solo advertencias TS6133 (variables no usadas aún). No errores reales.

- [ ] **Step 5: Commit**

```bash
cd "c:/Users/carlo/OneDrive - Help Soluciones Informaticas/Documentos/Testing/Appenvios"
git add src/App.tsx src/modules/Propuestas.tsx
git commit -m "feat: add PersonalItem/VisitaItem types and 4 new Propuesta fields with defaults"
```

---

### Task 2: Mapeos Supabase + SQL migration

**Files:**
- Modify: `src/App.tsx` — funciones `addPropuesta`, `updatePropuesta`, y el loader (SELECT)

- [ ] **Step 1: Ejecutar SQL migration en Supabase**

En el SQL Editor de Supabase, ejecutar:

```sql
ALTER TABLE propuestas
  ADD COLUMN IF NOT EXISTS objetivo text DEFAULT '',
  ADD COLUMN IF NOT EXISTS personal jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS visitas jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS obligaciones_cliente jsonb DEFAULT '[]'::jsonb;
```

Expected: sin errores, la tabla tiene 4 columnas nuevas.

- [ ] **Step 2: Actualizar `addPropuesta` — INSERT**

En `src/App.tsx`, en la función `addPropuesta`, dentro del objeto pasado a `.insert([{ ... }])`, agregar después de `usuario_id: p.usuarioId,`:

```typescript
      objetivo: p.objetivo || '',
      personal: p.personal || [],
      visitas: p.visitas || [],
      obligaciones_cliente: p.obligacionesCliente || [],
```

- [ ] **Step 3: Actualizar `addPropuesta` — mapper de respuesta**

En el mismo `addPropuesta`, en el bloque `setPropuestas(prev => [{ ... } as Propuesta, ...prev])`, agregar después de `usuarioId: dbP.usuario_id,`:

```typescript
        objetivo: dbP.objetivo || '',
        personal: dbP.personal || [],
        visitas: dbP.visitas || [],
        obligacionesCliente: dbP.obligaciones_cliente || [],
```

- [ ] **Step 4: Actualizar `updatePropuesta`**

En `src/App.tsx`, en la función `updatePropuesta`, dentro del objeto pasado a `.update({ ... })`, agregar después de `comercial_telefono: p.comercialTelefono,`:

```typescript
      objetivo: p.objetivo || '',
      personal: p.personal || [],
      visitas: p.visitas || [],
      obligaciones_cliente: p.obligacionesCliente || [],
```

- [ ] **Step 5: Actualizar el loader (SELECT)**

En `src/App.tsx`, en el bloque donde se cargan las propuestas desde Supabase (alrededor de línea 640-655), dentro del mapper del array, agregar después de `usuarioId: p.usuario_id,`:

```typescript
          objetivo: p.objetivo || '',
          personal: p.personal || [],
          visitas: p.visitas || [],
          obligacionesCliente: p.obligaciones_cliente || [],
```

- [ ] **Step 6: Verificar TypeScript**

```bash
cd "c:/Users/carlo/OneDrive - Help Soluciones Informaticas/Documentos/Testing/Appenvios"
npx tsc --noEmit 2>&1 | grep -E "App\.tsx"
```

Expected: sin errores nuevos en App.tsx.

- [ ] **Step 7: Commit**

```bash
cd "c:/Users/carlo/OneDrive - Help Soluciones Informaticas/Documentos/Testing/Appenvios"
git add src/App.tsx
git commit -m "feat: map Propuesta detail sections to Supabase (objetivo, personal, visitas, obligaciones)"
```

---

### Task 3: UI de las 4 secciones en el formulario

**Files:**
- Modify: `src/modules/Propuestas.tsx`

Insertar el bloque de 4 secciones entre el cierre del grid `</div>` (línea ~716) y `{/* Footer buttons */}` (línea ~718).

- [ ] **Step 1: Insertar el bloque de secciones en `src/modules/Propuestas.tsx`**

Encontrar la línea:
```tsx
      {/* Footer buttons */}
```

Insertar este bloque completo JUSTO ANTES de esa línea:

```tsx
      {/* Secciones de Detalle del Servicio */}
      <div className="mt-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700 pb-2">
          Detalles del Servicio
        </h3>

        {/* Objetivo */}
        <div className="border border-slate-700/50 rounded-xl p-4">
          <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
            🎯 Objetivo de la Propuesta
          </label>
          <textarea
            value={form.objetivo}
            onChange={e => setForm(f => ({ ...f, objetivo: e.target.value }))}
            rows={3}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 resize-none"
          />
        </div>

        {/* Personal a Cargo */}
        <div className="border border-slate-700/50 rounded-xl p-4">
          <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">
            👥 Personal a Cargo
          </label>
          <div className="space-y-2">
            {form.personal.map((persona, idx) => (
              <div key={persona.id} className="grid grid-cols-2 gap-2 items-center">
                <input
                  type="text"
                  value={persona.nombre}
                  onChange={e => setForm(f => ({
                    ...f,
                    personal: f.personal.map((item, i) => i === idx ? { ...item, nombre: e.target.value } : item),
                  }))}
                  placeholder="Nombre"
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={persona.cargo}
                    onChange={e => setForm(f => ({
                      ...f,
                      personal: f.personal.map((item, i) => i === idx ? { ...item, cargo: e.target.value } : item),
                    }))}
                    placeholder="Cargo / Rol"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, personal: f.personal.filter((_, i) => i !== idx) }))}
                    className="text-slate-500 hover:text-red-400 font-bold text-base leading-none"
                  >×</button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setForm(f => ({
              ...f,
              personal: [...f.personal, { id: crypto.randomUUID(), nombre: '', cargo: '' }],
            }))}
            className="mt-2 w-full text-xs text-indigo-400 border border-dashed border-slate-600 rounded-lg py-2 hover:border-indigo-500 hover:bg-indigo-900/10 transition-colors"
          >
            + Agregar persona
          </button>
        </div>

        {/* Visitas a Sedes y Horarios */}
        <div className="border border-slate-700/50 rounded-xl p-4">
          <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
            📅 Visitas a Sedes y Horarios
          </label>
          <p className="text-xs text-slate-600 mb-3">El mantenimiento se realizará en la ventana propuesta por el cliente.</p>
          <div className="space-y-2">
            {form.visitas.map((visita, idx) => (
              <div key={visita.id} className="grid grid-cols-2 gap-2 items-center">
                <input
                  type="text"
                  value={visita.sede}
                  onChange={e => setForm(f => ({
                    ...f,
                    visitas: f.visitas.map((item, i) => i === idx ? { ...item, sede: e.target.value } : item),
                  }))}
                  placeholder="Sede / Ciudad"
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={visita.horario}
                    onChange={e => setForm(f => ({
                      ...f,
                      visitas: f.visitas.map((item, i) => i === idx ? { ...item, horario: e.target.value } : item),
                    }))}
                    placeholder="Horario (ej: Lunes 8am–12pm)"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, visitas: f.visitas.filter((_, i) => i !== idx) }))}
                    className="text-slate-500 hover:text-red-400 font-bold text-base leading-none"
                  >×</button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setForm(f => ({
              ...f,
              visitas: [...f.visitas, { id: crypto.randomUUID(), sede: '', horario: '' }],
            }))}
            className="mt-2 w-full text-xs text-indigo-400 border border-dashed border-slate-600 rounded-lg py-2 hover:border-indigo-500 hover:bg-indigo-900/10 transition-colors"
          >
            + Agregar sede
          </button>
        </div>

        {/* Obligaciones del Cliente */}
        <div className="border border-slate-700/50 rounded-xl p-4">
          <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">
            📋 Obligaciones del Cliente
          </label>
          <div className="space-y-2">
            {form.obligacionesCliente.map((oblig, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-indigo-400 text-sm flex-shrink-0">●</span>
                <input
                  type="text"
                  value={oblig}
                  onChange={e => setForm(f => ({
                    ...f,
                    obligacionesCliente: f.obligacionesCliente.map((v, i) => i === idx ? e.target.value : v),
                  }))}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                />
                <button
                  type="button"
                  onClick={() => setForm(f => ({
                    ...f,
                    obligacionesCliente: f.obligacionesCliente.filter((_, i) => i !== idx),
                  }))}
                  className="text-slate-500 hover:text-red-400 font-bold text-base leading-none"
                >×</button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setForm(f => ({
              ...f,
              obligacionesCliente: [...f.obligacionesCliente, ''],
            }))}
            className="mt-2 w-full text-xs text-indigo-400 border border-dashed border-slate-600 rounded-lg py-2 hover:border-indigo-500 hover:bg-indigo-900/10 transition-colors"
          >
            + Agregar obligación
          </button>
        </div>
      </div>
```

- [ ] **Step 2: Verificar TypeScript en Propuestas.tsx**

```bash
cd "c:/Users/carlo/OneDrive - Help Soluciones Informaticas/Documentos/Testing/Appenvios"
npx tsc --noEmit 2>&1 | grep "Propuestas"
```

Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
cd "c:/Users/carlo/OneDrive - Help Soluciones Informaticas/Documentos/Testing/Appenvios"
git add src/modules/Propuestas.tsx
git commit -m "feat: add Objetivo/Personal/Visitas/Obligaciones sections to Propuestas form"
```

---

### Task 4: PDF — nueva página 2 y renumeración

**Files:**
- Modify: `src/services/propuestaPdf.ts`

- [ ] **Step 1: Cambiar número de página del protocolo (página 2 → 3)**

En `src/services/propuestaPdf.ts`, encontrar:

```typescript
  // ─── PAGE 2: PROTOCOL ───────────────────────────────────────────────────────

  doc.addPage();
  addPageHeader(doc, propuesta, 2);
```

Reemplazar con:

```typescript
  // ─── PAGE 3: PROTOCOL ───────────────────────────────────────────────────────

  doc.addPage();
  addPageHeader(doc, propuesta, 3);
```

- [ ] **Step 2: Cambiar número de página de inversión (página 3 → 4)**

Encontrar:

```typescript
  // ─── PAGE 3: PRICE + TERMS + SIGNATURES ─────────────────────────────────────

  doc.addPage();
  addPageHeader(doc, propuesta, 3);
```

Reemplazar con:

```typescript
  // ─── PAGE 4: PRICE + TERMS + SIGNATURES ─────────────────────────────────────

  doc.addPage();
  addPageHeader(doc, propuesta, 4);
```

- [ ] **Step 3: Insertar la nueva página 2 entre portada y protocolo**

Justo después del comentario `// ─── PAGE 1: COVER` y antes del comentario `// ─── PAGE 3: PROTOCOL` (que acabas de renombrar), insertar este bloque completo:

```typescript
  // ─── PAGE 2: SERVICE DETAILS ────────────────────────────────────────────────

  doc.addPage();
  addPageHeader(doc, propuesta, 2);

  let yD = 22;

  doc.setFontSize(7.5);
  doc.setTextColor(...INDIGO);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLES DE LA PROPUESTA', 14, yD);
  yD += 6;

  doc.setFontSize(13);
  doc.setTextColor(...TEXT_DARK);
  doc.setFont('helvetica', 'bold');
  doc.text('Alcance y Condiciones del Servicio', 14, yD);
  yD += 8;

  // Objetivo
  if (propuesta.objetivo) {
    const objLines = doc.splitTextToSize(propuesta.objetivo, W - 36);
    const objBoxH = 12 + objLines.length * 5;
    doc.setFillColor(...LIGHT_GRAY);
    doc.rect(14, yD, W - 28, objBoxH, 'F');
    doc.setFillColor(...INDIGO);
    doc.rect(14, yD, 1.5, objBoxH, 'F');
    doc.setFontSize(6.5);
    doc.setTextColor(130, 150, 180);
    doc.setFont('helvetica', 'bold');
    doc.text('OBJETIVO DE LA PROPUESTA', 18, yD + 5);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_MUTED);
    doc.text(objLines, 18, yD + 11);
    yD += objBoxH + 7;
  }

  // Personal a Cargo
  const personalData = (propuesta.personal || []).filter(p => p.nombre);
  if (personalData.length > 0) {
    doc.setFontSize(8.5);
    doc.setTextColor(...TEXT_DARK);
    doc.setFont('helvetica', 'bold');
    doc.text('Personal a Cargo', 14, yD);
    yD += 3;
    autoTable(doc, {
      startY: yD,
      margin: { left: 14, right: 14 },
      head: [['Nombre', 'Cargo / Rol']],
      body: personalData.map(p => [p.nombre, p.cargo]),
      headStyles: { fillColor: DARK_BLUE, textColor: WHITE, fontSize: 8 },
      bodyStyles: { fontSize: 8.5 },
    });
    yD = (doc as any).lastAutoTable.finalY + 7;
  }

  // Visitas a Sedes y Horarios
  const visitasData = (propuesta.visitas || []).filter(v => v.sede);
  if (visitasData.length > 0) {
    doc.setFontSize(8.5);
    doc.setTextColor(...TEXT_DARK);
    doc.setFont('helvetica', 'bold');
    doc.text('Visitas a Sedes y Horarios', 14, yD);
    yD += 3;
    autoTable(doc, {
      startY: yD,
      margin: { left: 14, right: 14 },
      head: [['Sede / Ciudad', 'Ventana de Mantenimiento']],
      body: visitasData.map(v => [v.sede, v.horario]),
      headStyles: { fillColor: DARK_BLUE, textColor: WHITE, fontSize: 8 },
      bodyStyles: { fontSize: 8.5 },
    });
    yD = (doc as any).lastAutoTable.finalY + 3;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...TEXT_MUTED);
    doc.text('* El mantenimiento se realizará en la ventana de mantenimiento propuesta por el cliente.', 14, yD);
    yD += 7;
  }

  // Obligaciones del Cliente
  const obligaciones = (propuesta.obligacionesCliente || []).filter(o => o.trim());
  if (obligaciones.length > 0) {
    doc.setFontSize(8.5);
    doc.setTextColor(...TEXT_DARK);
    doc.setFont('helvetica', 'bold');
    doc.text('Obligaciones del Cliente', 14, yD);
    yD += 5;
    obligaciones.forEach(oblig => {
      doc.setFillColor(...INDIGO);
      doc.circle(17.5, yD - 1, 1.5, 'F');
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...TEXT_DARK);
      const lines = doc.splitTextToSize(oblig, W - 34);
      doc.text(lines, 22, yD);
      yD += lines.length * 5 + 2;
    });
  }
```

**Importante:** Esta nueva página usa `yD` como variable del cursor (no `y`) para no colisionar con el `y` del bloque de protocolo que viene después.

- [ ] **Step 4: Verificar TypeScript en propuestaPdf.ts**

```bash
cd "c:/Users/carlo/OneDrive - Help Soluciones Informaticas/Documentos/Testing/Appenvios"
npx tsc --noEmit 2>&1 | grep "propuestaPdf"
```

Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
cd "c:/Users/carlo/OneDrive - Help Soluciones Informaticas/Documentos/Testing/Appenvios"
git add src/services/propuestaPdf.ts
git commit -m "feat: add PDF page 2 with service details (objetivo, personal, visitas, obligaciones)"
```

---

### Task 5: Build, verificación y deploy

**Files:** ninguno (verificación)

- [ ] **Step 1: Build completo**

```bash
cd "c:/Users/carlo/OneDrive - Help Soluciones Informaticas/Documentos/Testing/Appenvios"
npm run build
```

Expected: `✓ built in X.XXs` sin errores TypeScript. Advertencias de bundle size son pre-existentes.

- [ ] **Step 2: Smoke test manual (dev server)**

```bash
npm run dev
```

Abrir la app → Propuestas → Nueva Propuesta:
1. Scroll hacia abajo — ver las 4 secciones: Objetivo, Personal, Visitas, Obligaciones
2. El campo Objetivo tiene el texto por defecto pre-relleno
3. Personal tiene una fila con el nombre del usuario actual
4. Click "+ Agregar persona" → nueva fila aparece
5. Click "+ Agregar sede" → nueva fila de visitas aparece
6. Click "+ Agregar obligación" → nuevo bullet aparece
7. Click "📥 Generar PDF" → PDF de 4 páginas:
   - Página 1: Portada
   - Página 2: Detalles (Objetivo + Personal + Visitas + Obligaciones)
   - Página 3: Protocolo del servicio
   - Página 4: Tabla de inversión + Firmas

- [ ] **Step 3: Push a producción**

```bash
cd "c:/Users/carlo/OneDrive - Help Soluciones Informaticas/Documentos/Testing/Appenvios"
git push origin main
```

Expected: Vercel auto-despliega desde el push.
