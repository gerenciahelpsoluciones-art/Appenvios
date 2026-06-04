# Propuestas Items Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken single-product form section in Propuestas with a multi-item table (description + optional catalog search + quantity + editable unit price), and update the PDF to render all items.

**Architecture:** Three targeted edits to two files. No type changes, no Supabase migrations needed — `PropuestaItem[]` and `items: JSONB` already exist. The item management logic (`updateItem`, `addItemRow`, `removeItem`, `selectProductoForItem`, `calcTotal`, `itemSearches`) is already implemented and stays untouched.

**Tech Stack:** React 18, TypeScript, Tailwind CSS (dark slate theme), jsPDF + autoTable, Vite

---

### Task 1: Remove broken code from Propuestas.tsx

**Files:**
- Modify: `src/modules/Propuestas.tsx`

The form currently has two broken sections that reference undeclared variables (`productoSearch`, `handleProductoSelect`, `form.productoId`, `form.productoNombre`, `form.cantidad`). These cause TypeScript errors. Remove them along with the derived variables that depend on the single-value model.

- [ ] **Step 1: Remove derived-value variables (lines 184–187)**

Open `src/modules/Propuestas.tsx`. Find and delete these 4 lines (they appear right after `const selectedTemplate = ...`):

```typescript
// DELETE these 4 lines:
const cantidad = form.cantidad || 1;
const subtotalForm = form.valor * cantidad;
const iva = form.incluyeIva ? Math.round(subtotalForm * 0.19) : 0;
const total = subtotalForm + iva;
```

- [ ] **Step 2: Remove the broken "Producto del Catálogo" section**

Find and delete the block that starts with `{/* Producto del catálogo */}` — from the outer `<div>` wrapping the label `"Producto del Catálogo"` to its closing `</div>`. This is the section with `productoSearch`, `setProductoSearch`, `handleProductoSelect`, and the selected-product badge using `form.productoId`.

The block to delete looks like this (≈54 lines):

```tsx
{/* DELETE this entire block — Producto del catálogo */}
<div>
  <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">Producto del Catálogo</label>
  <div className="relative">
    <input
      type="text"
      value={productoSearch}
      ...
    />
    ...
  </div>
  {form.productoId && (
    <div ...>
      ...
    </div>
  )}
</div>
```

- [ ] **Step 3: Remove the "Valor de la Propuesta" section**

Find and delete the block with label `"Valor de la Propuesta *"` — from its outer `<div>` to its closing `</div>`. This is the section with the `form.moneda` selector, the `form.valor` number input, the `form.cantidad` input, the IVA checkbox, and the subtotal/total display lines.

The block to delete looks like this (≈49 lines):

```tsx
{/* DELETE this entire block — Valor de la Propuesta */}
<div>
  <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">Valor de la Propuesta *</label>
  <div className="flex gap-2">
    <select value={form.moneda} ...>...</select>
    <input type="number" value={form.valor || ''} ... />
    <input type="number" min="1" value={form.cantidad || 1} ... />
  </div>
  <div className="flex gap-4 mt-1">...</div>
  <label className="flex items-center gap-2 mt-2 ...">
    <input type="checkbox" checked={form.incluyeIva} ... />
    Incluir IVA (19%)
  </label>
  {form.valor > 0 && (
    <p ...>{/* subtotal/total display */}</p>
  )}
</div>
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd "c:/Users/carlo/OneDrive - Help Soluciones Informaticas/Documentos/Testing/Appenvios"
npx tsc --noEmit
```

Expected: no errors related to `productoSearch`, `form.cantidad`, `form.productoId`, `subtotalForm`, `iva`, `total`. There may still be errors in `propuestaPdf.ts` — those are fixed in Task 3.

- [ ] **Step 5: Commit**

```bash
cd "c:/Users/carlo/OneDrive - Help Soluciones Informaticas/Documentos/Testing/Appenvios"
git add src/modules/Propuestas.tsx
git commit -m "refactor: remove broken single-product section from Propuestas form"
```

---

### Task 2: Add items table to Propuestas.tsx form

**Files:**
- Modify: `src/modules/Propuestas.tsx`

Insert the items table where the two deleted blocks were (after the "Tipo de Servicio" selector section, before the "Vigencia" section).

- [ ] **Step 1: Insert the items table block**

In `src/modules/Propuestas.tsx`, in the `{/* LEFT: Form fields */}` column, after the closing `</div>` of the "Tipo de Servicio" block and before the "Vigencia" `<div>`, insert this entire block:

```tsx
{/* Items Table */}
<div>
  <div className="flex items-center justify-between mb-2">
    <label className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
      Ítems de la Propuesta *
    </label>
    <select
      value={form.moneda}
      onChange={e => setForm(f => ({ ...f, moneda: e.target.value as 'COP' | 'USD' }))}
      className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300"
    >
      <option value="COP">COP</option>
      <option value="USD">USD</option>
    </select>
  </div>

  <div className="bg-slate-800/60 rounded-xl border border-slate-700 overflow-hidden">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-700 bg-slate-900/40">
          <th className="text-slate-500 font-medium px-3 py-2 text-left text-xs uppercase tracking-wider">
            Descripción / Producto
          </th>
          <th className="text-slate-500 font-medium px-3 py-2 text-center text-xs uppercase tracking-wider w-16">
            Cant.
          </th>
          <th className="text-slate-500 font-medium px-3 py-2 text-right text-xs uppercase tracking-wider w-36">
            Valor Unit.
          </th>
          <th className="text-slate-500 font-medium px-3 py-2 text-right text-xs uppercase tracking-wider w-28">
            Total
          </th>
          <th className="w-8" />
        </tr>
      </thead>
      <tbody>
        {form.items.map(item => (
          <tr key={item.id} className="border-b border-slate-700/50 hover:bg-slate-700/10">
            <td className="px-3 py-2">
              <div className="relative mb-1.5">
                <input
                  type="text"
                  value={itemSearches[item.id] || ''}
                  onChange={e => setItemSearches(s => ({ ...s, [item.id]: e.target.value }))}
                  placeholder="Buscar en catálogo..."
                  className="w-full bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-xs text-slate-300 placeholder-slate-500"
                />
                {(itemSearches[item.id] || '').length > 1 && (
                  <div className="absolute z-10 w-full mt-0.5 bg-slate-800 border border-slate-700 rounded shadow-xl max-h-40 overflow-y-auto">
                    {productos
                      .filter(p =>
                        p.nombre.toLowerCase().includes((itemSearches[item.id] || '').toLowerCase()) ||
                        (p.numPart || '').toLowerCase().includes((itemSearches[item.id] || '').toLowerCase())
                      )
                      .slice(0, 6)
                      .map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => selectProductoForItem(item.id, p.id)}
                          className="w-full text-left px-2 py-1.5 hover:bg-slate-700 text-xs border-b border-slate-700/50 last:border-0"
                        >
                          <span className="text-slate-200 font-medium">{p.nombre}</span>
                          {p.numPart && (
                            <span className="ml-1.5 font-mono text-indigo-400">{p.numPart}</span>
                          )}
                          <span className="ml-1.5 text-slate-500">
                            {p.moneda === 'USD'
                              ? `USD ${p.precioCompra}`
                              : `$${(p.precioCompra || 0).toLocaleString('es-CO')}`}
                          </span>
                        </button>
                      ))}
                    {productos.filter(p =>
                      p.nombre.toLowerCase().includes((itemSearches[item.id] || '').toLowerCase()) ||
                      (p.numPart || '').toLowerCase().includes((itemSearches[item.id] || '').toLowerCase())
                    ).length === 0 && (
                      <p className="px-2 py-1.5 text-xs text-slate-500">Sin resultados</p>
                    )}
                  </div>
                )}
              </div>
              <input
                type="text"
                value={item.descripcion}
                onChange={e => updateItem(item.id, { descripcion: e.target.value })}
                placeholder="Descripción del ítem..."
                className="w-full bg-slate-900/50 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
              />
              {item.numPart && (
                <span className="text-xs font-mono text-indigo-400 mt-0.5 inline-block">
                  Ref: {item.numPart}
                </span>
              )}
            </td>
            <td className="px-3 py-2">
              <input
                type="number"
                min="1"
                value={item.cantidad}
                onChange={e => updateItem(item.id, { cantidad: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 text-center"
              />
            </td>
            <td className="px-3 py-2">
              <input
                type="number"
                value={item.valorUnitario || ''}
                onChange={e => updateItem(item.id, { valorUnitario: Number(e.target.value) })}
                placeholder="0"
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 text-right"
              />
            </td>
            <td className="px-3 py-2 text-right text-emerald-400 font-semibold text-xs">
              {fmtCOP(item.cantidad * item.valorUnitario)}
            </td>
            <td className="px-2 py-2 text-center">
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="text-slate-500 hover:text-red-400 text-base font-bold leading-none"
              >
                ×
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  <button
    type="button"
    onClick={addItemRow}
    className="mt-2 w-full text-xs text-indigo-400 border border-dashed border-slate-600 rounded-lg py-2 hover:border-indigo-500 hover:bg-indigo-900/10 transition-colors"
  >
    + Agregar ítem
  </button>

  <label className="flex items-center gap-2 mt-3 text-sm text-slate-400 cursor-pointer">
    <input
      type="checkbox"
      checked={form.incluyeIva}
      onChange={e => setForm(f => ({
        ...f,
        incluyeIva: e.target.checked,
        valor: calcTotal(f.items, e.target.checked),
      }))}
    />
    Incluir IVA (19%)
  </label>

  {(() => {
    const sub = form.items.reduce((s, it) => s + it.cantidad * it.valorUnitario, 0);
    const ivaAmt = form.incluyeIva ? Math.round(sub * 0.19) : 0;
    return sub > 0 ? (
      <p className="text-xs text-slate-500 mt-1 text-right">
        Subtotal: {fmtCOP(sub)}
        {form.incluyeIva && <span> · IVA: {fmtCOP(ivaAmt)}</span>}
        {' · '}Total:{' '}
        <span className="text-emerald-400 font-semibold">{fmtCOP(sub + ivaAmt)}</span>
      </p>
    ) : null;
  })()}
</div>
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "c:/Users/carlo/OneDrive - Help Soluciones Informaticas/Documentos/Testing/Appenvios"
npx tsc --noEmit
```

Expected: no errors in `Propuestas.tsx`. Errors in `propuestaPdf.ts` are fine — fixed in Task 3.

- [ ] **Step 3: Commit**

```bash
cd "c:/Users/carlo/OneDrive - Help Soluciones Informaticas/Documentos/Testing/Appenvios"
git add src/modules/Propuestas.tsx
git commit -m "feat: add multi-item table to Propuestas form with catalog search and editable prices"
```

---

### Task 3: Update PreviewModal in Propuestas.tsx

**Files:**
- Modify: `src/modules/Propuestas.tsx` — `PreviewModal` inner component

The modal currently shows a single "Valor" line and has a bug: it adds 19% IVA on top of `propuesta.valor`, but `valor` is already the full total (IVA included) from `calcTotal`. Fix the calculation and add item list.

- [ ] **Step 1: Replace the PreviewModal body**

Find `const PreviewModal = () => {` in `Propuestas.tsx` and replace the entire function body with:

```tsx
const PreviewModal = () => {
  if (!previewPropuesta) return null;

  const pvSub = previewPropuesta.items.reduce((s, it) => s + it.cantidad * it.valorUnitario, 0);
  const pvIva = previewPropuesta.incluyeIva ? Math.round(pvSub * 0.19) : 0;
  const pvTotal = pvSub + pvIva;
  const visibleItems = previewPropuesta.items.filter(it => it.valorUnitario > 0);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-700 max-w-lg w-full p-6">
        <h3 className="text-lg font-bold mb-1">
          Vista Previa — {previewPropuesta.consecutivo}
        </h3>
        <p className="text-slate-400 text-sm mb-4">
          {previewPropuesta.clienteNombre} · {previewPropuesta.tipoServicioNombre}
        </p>
        <div className="bg-slate-800 rounded-lg p-4 text-sm text-slate-300 space-y-2 mb-4">
          {visibleItems.length > 0 && (
            <div className="space-y-1 pb-2 border-b border-slate-700">
              {visibleItems.slice(0, 3).map(it => (
                <div key={it.id} className="flex justify-between text-xs">
                  <span className="text-slate-400 truncate flex-1 mr-2">{it.descripcion || '—'}</span>
                  <span className="text-slate-300 whitespace-nowrap">
                    {it.cantidad > 1 ? `${it.cantidad} × ` : ''}{fmtCOP(it.cantidad * it.valorUnitario)}
                  </span>
                </div>
              ))}
              {visibleItems.length > 3 && (
                <p className="text-xs text-slate-500">+ {visibleItems.length - 3} ítem(s) más</p>
              )}
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Subtotal:</span>
            <span>{fmtCOP(pvSub)}</span>
          </div>
          {previewPropuesta.incluyeIva && (
            <div className="flex justify-between">
              <span className="text-slate-500">IVA (19%):</span>
              <span>{fmtCOP(pvIva)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-700 pt-2">
            <span className="font-bold">Total:</span>
            <span className="font-bold text-indigo-300">{fmtCOP(pvTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Vigencia:</span>
            <span>{previewPropuesta.vigencia}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Estado:</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${ESTADO_COLORS[previewPropuesta.estado]}`}>
              {previewPropuesta.estado}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Comercial:</span>
            <span>{previewPropuesta.comercialNombre}</span>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setPreviewPropuesta(null)}
            className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg"
          >
            Cerrar
          </button>
          <button
            onClick={() => {
              generatePropuestaPDF(previewPropuesta, 'save');
              setPreviewPropuesta(null);
            }}
            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
          >
            📥 Descargar PDF
          </button>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "c:/Users/carlo/OneDrive - Help Soluciones Informaticas/Documentos/Testing/Appenvios"
npx tsc --noEmit
```

Expected: no errors in `Propuestas.tsx`.

- [ ] **Step 3: Commit**

```bash
cd "c:/Users/carlo/OneDrive - Help Soluciones Informaticas/Documentos/Testing/Appenvios"
git add src/modules/Propuestas.tsx
git commit -m "fix: PreviewModal items list and correct IVA total calculation"
```

---

### Task 4: Fix PDF — replace single-item table with multi-item loop

**Files:**
- Modify: `src/services/propuestaPdf.ts`

Lines 268–308 use `propuesta.cantidad`, `propuesta.productoNombre`, `propuesta.numPart` — none of these exist on `Propuesta`. Replace with a loop over `propuesta.items`.

- [ ] **Step 1: Replace the table-body block in propuestaPdf.ts**

Find this block (starts at `const cantidad = propuesta.cantidad || 1;`, ends after the `autoTable(doc, { ... });` call on the closing `});`) and replace it entirely:

**FIND (delete this entire block):**
```typescript
  const cantidad = propuesta.cantidad || 1;
  const subtotal = propuesta.valor * cantidad;
  const iva = propuesta.incluyeIva ? Math.round(subtotal * 0.19) : 0;
  const total = subtotal + iva;

  const descripcionLinea = propuesta.productoNombre
    ? `${propuesta.productoNombre}${propuesta.numPart ? `\nRef: ${propuesta.numPart}` : ''}\n${template.nombre}`
    : `${template.nombre}\nIncluye visita técnica, informe y protocolo completo`;

  const tableBody: (string | { content: string; colSpan?: number; styles?: object })[][] = [
    [
      { content: descripcionLinea, styles: { fontSize: 8.5 } },
      String(cantidad),
      formatCurrency(propuesta.valor, propuesta.moneda),
      formatCurrency(subtotal, propuesta.moneda),
    ],
  ];
  if (cantidad > 1) {
    tableBody.push([{ content: `Subtotal (${cantidad} unidades)`, colSpan: 3, styles: { textColor: [100, 116, 139] as [number,number,number] } }, formatCurrency(subtotal, propuesta.moneda)]);
  }
  if (propuesta.incluyeIva) {
    tableBody.push(['IVA (19%)', '', '', formatCurrency(iva, propuesta.moneda)]);
  }
  tableBody.push([
    { content: 'TOTAL A PAGAR', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] as [number, number, number] } },
    { content: formatCurrency(total, propuesta.moneda), styles: { fontStyle: 'bold', textColor: [67, 56, 202] as [number, number, number], fillColor: [241, 245, 249] as [number, number, number] } },
  ]);
```

**REPLACE WITH:**
```typescript
  const itemsConValor = propuesta.items.filter(it => it.valorUnitario > 0);
  const subtotal = itemsConValor.reduce((s, it) => s + it.cantidad * it.valorUnitario, 0);
  const iva = propuesta.incluyeIva ? Math.round(subtotal * 0.19) : 0;
  const total = subtotal + iva;

  const tableBody: (string | { content: string; colSpan?: number; styles?: object })[][] =
    itemsConValor.map(it => [
      { content: it.descripcion + (it.numPart ? `\nRef: ${it.numPart}` : ''), styles: { fontSize: 8.5 } },
      String(it.cantidad),
      formatCurrency(it.valorUnitario, propuesta.moneda),
      formatCurrency(it.cantidad * it.valorUnitario, propuesta.moneda),
    ]);

  if (itemsConValor.length === 0) {
    tableBody.push([
      { content: `${template.nombre}\nIncluye visita técnica, informe y protocolo completo`, styles: { fontSize: 8.5 } },
      '1',
      formatCurrency(propuesta.valor, propuesta.moneda),
      formatCurrency(propuesta.valor, propuesta.moneda),
    ]);
  }

  if (itemsConValor.length > 1) {
    tableBody.push([
      { content: 'Subtotal', colSpan: 3, styles: { textColor: [100, 116, 139] as [number, number, number] } },
      formatCurrency(subtotal, propuesta.moneda),
    ]);
  }
  if (propuesta.incluyeIva) {
    tableBody.push(['IVA (19%)', '', '', formatCurrency(iva, propuesta.moneda)]);
  }
  tableBody.push([
    { content: 'TOTAL A PAGAR', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] as [number, number, number] } },
    { content: formatCurrency(total, propuesta.moneda), styles: { fontStyle: 'bold', textColor: [67, 56, 202] as [number, number, number], fillColor: [241, 245, 249] as [number, number, number] } },
  ]);
```

- [ ] **Step 2: Verify TypeScript compiles with zero errors**

```bash
cd "c:/Users/carlo/OneDrive - Help Soluciones Informaticas/Documentos/Testing/Appenvios"
npx tsc --noEmit
```

Expected: **0 errors**.

- [ ] **Step 3: Commit**

```bash
cd "c:/Users/carlo/OneDrive - Help Soluciones Informaticas/Documentos/Testing/Appenvios"
git add src/services/propuestaPdf.ts
git commit -m "fix: PDF Propuesta renders multi-item table from items array"
```

---

### Task 5: Build verification and deploy

**Files:** none (verification only)

- [ ] **Step 1: Run full build**

```bash
cd "c:/Users/carlo/OneDrive - Help Soluciones Informaticas/Documentos/Testing/Appenvios"
npm run build
```

Expected: build completes with no TypeScript errors. Vite may show warnings about bundle size — those are fine.

- [ ] **Step 2: Manual smoke test (dev server)**

```bash
npm run dev
```

Open the app, go to Propuestas → Nueva Propuesta:
1. Verify the items table is visible (not the old valor/cantidad fields)
2. Type a product name in the catalog search — dropdown appears
3. Select a product — description, ref, and price auto-fill
4. Edit `valorUnitario` manually — total column updates
5. Click `+ Agregar ítem` — new row appears
6. Toggle IVA — total updates with 19%
7. Click `👁️ Vista Previa` — modal shows item list + correct total
8. Click `📥 Generar PDF` — PDF page 3 shows items table with all rows

- [ ] **Step 3: Push to production (triggers Vercel auto-deploy)**

```bash
cd "c:/Users/carlo/OneDrive - Help Soluciones Informaticas/Documentos/Testing/Appenvios"
git push origin main
```

Expected: Vercel picks up the push and deploys automatically.
