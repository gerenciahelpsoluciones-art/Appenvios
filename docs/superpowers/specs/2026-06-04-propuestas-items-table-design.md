# Propuestas — Tabla de Ítems Editable

**Fecha:** 2026-06-04  
**Estado:** Aprobado

## Problema

El formulario de Propuestas tiene código roto: la sección "Producto del Catálogo" y "Valor de la Propuesta" referencian variables de estado inexistentes (`productoSearch`, `handleProductoSelect`, `form.productoId`, `form.productoNombre`, `form.cantidad`). El PDF (`propuestaPdf.ts`) también usa campos que no existen en el tipo `Propuesta`. La infraestructura de ítems (`PropuestaItem`, `updateItem`, `calcTotal`, `itemSearches`) ya está implementada pero sin UI.

## Objetivo

Reemplazar la sección rota por una tabla de ítems (descripción libre + catálogo opcional + cantidad + valor unitario editable), para que el comercial pueda especificar precios diferentes por ciudad/servicio y el PDF refleje el detalle completo.

## Alcance

Tres archivos afectados:

1. `src/modules/Propuestas.tsx` — UI del formulario  
2. `src/services/propuestaPdf.ts` — Página 3 "Tabla de Inversión"  
3. `PreviewModal` dentro de `Propuestas.tsx`

Ningún cambio de tipos (`PropuestaItem`, `Propuesta` en `App.tsx`) ni de lógica de Supabase — `items` ya se guarda como JSONB.

---

## Diseño

### 1. Formulario — Propuestas.tsx

**Eliminar:**
- Líneas 446–499: bloque "Producto del Catálogo" (variables `productoSearch`, `setProductoSearch`, `handleProductoSelect`, `form.productoId`, `form.productoNombre`, `form.numPart` — todas sin declarar)
- Líneas 500–548: bloque "Valor de la Propuesta" (inputs de `form.valor` y `form.cantidad` como campos manuales)
- Líneas 184–188: variables `cantidad`, `subtotalForm`, `iva`, `total` derivadas del valor único

**Agregar — tabla de ítems** (reemplaza los dos bloques eliminados):

```
┌──────────────────────────────────────────────────────────────┐
│ ÍTEMS DE LA PROPUESTA *                                      │
├──────────────────────────┬──────┬──────────────┬────────┬───┤
│ Descripción / Producto   │ Cant │ Valor Unit.  │ Total  │ × │
├──────────────────────────┼──────┼──────────────┼────────┼───┤
│ [buscar catálogo...]     │      │              │        │   │
│ [descripción libre]      │  1   │  $ 350,000   │$350,000│ × │
│ [ref: MP-001]            │      │              │        │   │
├──────────────────────────┼──────┼──────────────┼────────┼───┤
│ + Agregar ítem           │      │              │        │   │
└──────────────────────────┴──────┴──────────────┴────────┴───┘
  ☐ Incluir IVA (19%)          Subtotal: $350,000 | Total: $350,000
```

**Por cada `item` en `form.items`:**
- Input de búsqueda de catálogo (`itemSearches[item.id]`): al tipear ≥2 chars muestra dropdown. Al seleccionar un producto llama `selectProductoForItem(item.id, productoId)` — auto-rellena `descripcion`, `numPart`, `valorUnitario`.
- Input `descripcion` (texto libre, editable aunque venga del catálogo).
- Si tiene `numPart`: mostrar como tag de referencia (solo lectura).
- Input `cantidad` (número, mínimo 1).
- Input `valorUnitario` (número, editable — permite ajuste por ciudad).
- Columna `Total` = `item.cantidad × item.valorUnitario` (solo lectura, formateado).
- Botón `×` llama `removeItem(item.id)`.

**Debajo de la tabla:**
- Checkbox IVA (ya existe en `form.incluyeIva`).
- Línea de totales: Subtotal + Total (usando `calcTotal` existente).
- Botón `+ Agregar ítem` llama `addItemRow()`.

**Selector de moneda** (COP/USD): mantener, mover junto al encabezado de la sección o al lado del total.

**Estado a eliminar del componente:** `cantidad`, `subtotalForm`, `iva`, `total` (líneas 184–188 — derivados del valor único que ya no existe como campo manual).

---

### 2. PDF — propuestaPdf.ts (página 3)

**Eliminar:** Variables `cantidad`, `subtotal`, `iva`, `total` derivadas de `propuesta.cantidad` y `propuesta.valor` individual (líneas 268–295). Estas referencias no existen en el tipo.

**Reemplazar con loop sobre `propuesta.items`:**

```
tableBody = propuesta.items
  .filter(it => it.valorUnitario > 0)
  .map(it => [
    descripcion_con_numPart,   // "Nombre\nRef: XX" si tiene numPart
    String(it.cantidad),
    formatCurrency(it.valorUnitario, propuesta.moneda),
    formatCurrency(it.cantidad * it.valorUnitario, propuesta.moneda),
  ])
```

Luego agregar filas de resumen al final:
- Subtotal (suma de todos los totales de línea)
- IVA 19% — solo si `propuesta.incluyeIva`
- **TOTAL A PAGAR** — en negrita, color índigo

El cálculo del total para las firmas y el footer usa `propuesta.valor` (ya es el total calculado, se mantiene).

---

### 3. PreviewModal — Propuestas.tsx

**Antes:** Solo muestra `previewPropuesta.valor` como "Valor" en el resumen.

**Después:** Agrega una lista de ítems antes del bloque de totales:

```
Por cada item con valorUnitario > 0:
  <div> descripcion  ·  ×cantidad  ·  $ total </div>
```

Si hay más de 3 ítems, mostrar los primeros 3 y una nota "+ N más". El bloque de totales (subtotal, IVA, Total) se calcula dinámicamente desde los ítems, no desde `previewPropuesta.valor` directamente.

---

## Lo que NO cambia

- Tipos `PropuestaItem` y `Propuesta` en `App.tsx` — ya son correctos.
- Funciones `updateItem`, `addItemRow`, `removeItem`, `selectProductoForItem`, `calcTotal` — ya funcionan.
- Estado `itemSearches` — ya declarado.
- Guardado en Supabase — `items` ya es JSONB, no necesita migración.
- Página 1 (portada) y página 2 (protocolo) del PDF — no cambian.
- Vista lista de propuestas — no cambia.

---

## Archivos a modificar

| Archivo | Sección | Tipo de cambio |
|---|---|---|
| `src/modules/Propuestas.tsx` | Form view, líneas 446–548 | Reemplazar |
| `src/modules/Propuestas.tsx` | Líneas 184–188 | Eliminar |
| `src/modules/Propuestas.tsx` | PreviewModal | Actualizar |
| `src/services/propuestaPdf.ts` | Líneas 268–308 | Reemplazar |
