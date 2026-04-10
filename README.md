# Instrucciones de Configuración de AppEnvios

Esta guía explica cómo configurar el sistema de entregas **AppEnvios** utilizando las plantillas CSV proporcionadas y AppSheet.

## 1. Preparar Google Sheets
1. Abra [Google Sheets](https://sheets.google.com).
2. Cree una nueva hoja de cálculo llamada `AppEnvios_DB`.
3. Importe cada archivo CSV en una pestaña separada:
    - `Drivers.csv` -> Nombre de pestaña: **Conductores**
    - `Clients.csv` -> Nombre de pestaña: **Clientes**
    - `Orders.csv` -> Nombre de pestaña: **Pedidos**
4. Asegúrese de que la primera fila contenga los encabezados.

## 2. Conectar a AppSheet
1. Vaya a [AppSheet](https://www.appsheet.com).
2. Haga clic en **Create** -> **App** -> **Start with existing data**.
3. Nombre la app `AppEnvios` y seleccione la hoja `AppEnvios_DB`.

## 3. Configuración de Georeferencia (Crucial)
Para habilitar los mapas y funciones de ubicación, configure estas columnas en el Editor de AppSheet (**Data > Columns**):

### Tabla Clientes
- **Main Address**: Tipo = `Address`.
- **Coordinates**: Tipo = `LatLong`.

### Tabla Conductores
- **Current Location**: Tipo = `LatLong`.

### Tabla Pedidos
- **Salesperson Email**: Tipo = `Email`.
- **Pickup Address** y **Delivery Address**: Tipo = `Address`.
- **Pickup LatLong** y **Delivery LatLong**: Tipo = `LatLong`.
- **Delivery Photo**: Tipo = `Image`.
- **Status**: Tipo = `Enum` (Valores: En preparacion, En camino, Entregado, Cancelado).

## 4. Configuración del Módulo Comercial (NUEVO)

### A. Automatización: Notificación a Logística
1. Vaya a **Automation > Bots**.
2. Cree un bot: "Nueva Solicitud Comercial".
3. **Event**: Data Change -> Adds Only en la tabla `Pedidos`.
4. **Process**: Send an Email.
    - **To**: `logistica@empresa.com` (O el correo de su área de despacho).
    - **Subject**: "NUEVA SOLICITUD DE DESPACHO - [Order ID]"
    - **Body**: "El comercial [Salesperson Email] ha solicitado un despacho para el cliente [ID Cliente]."

### B. Automatización: Notificación a Comerciales
1. Cree otro bot: "Notificar Cambio de Estado a Comercial".
2. **Event**: Data Change -> Updates Only en la tabla `Pedidos`.
    - Condition: `[Status] <> LOOKUP([_THISROW].[Order ID], "Pedidos", "Order ID", "Status")`
3. **Process**: Send an Email.
    - **To**: `[Salesperson Email]`
    - **Subject**: "Actualización de Pedido: [Order ID]"
    - **Body**: "Hola, su solicitud de despacho ahora se encuentra: [Status]."

### C. Vista de Ventas (Slice)
1. Vaya a **Data > Slices**.
2. Cree un Slice "Mis Solicitudes".
    - Filter condition: `[Salesperson Email] = USEREMAIL()`.
3. Vaya a **UX > Views** y cree una vista basada en este Slice para que cada comercial vea solo sus pedidos.

### B. Dashboard de Envíos
1. Vaya a **Data > Slices**.
2. Cree un Slice llamado "Filtro de Entregas".
    - Base table: `Pedidos`.
    - Row filter condition: Use una expresión como `AND([Order Date] >= [_THISUSER].[FechaInicio], [Order Date] <= [_THISUSER].[FechaFin])` para filtros dinámicos.
3. Vaya a **UX > Views**.
4. Cree una vista tipo **Dashboard**.
5. Incluya vistas de tipo **Chart** (Gráfico) que usen el Slice "Filtro de Entregas" agrupadas por `Driver ID`.

## 5. Módulo de Cotizaciones (NUEVO)

### A. Configuración de Tablas
1. Importe `Quotes.csv`, `Quote_Items.csv` y `Suppliers.csv`.
2. **Quotes**: 
   - `Profit Margin %`: Tipo `Percent`. Validación (`Valid_If`): `AND([_THIS] >= 0.07, [_THIS] <= 0.50)`.
3. **Quote_Items**:
   - `VAT %`: Tipo `Percent` (Ejem: 0.19).
   - `Subtotal Cost`: Fórmula: `[Cost Before VAT] * (1 + [VAT %])`.
   - `Sales Price`: Fórmula: `[Cost Before VAT] * (1 + [Quote ID].[Profit Margin %])`.
   - `Product Image`: Tipo `Image`.

### B. Exportación a PDF (Bot)
1. Vaya a **Automation > Tasks**.
2. Cree una tarea **Create a new file**.
3. **Template**: Haga clic en "Create" para generar una plantilla predeterminada.
4. **Personalización**: Edite el documento para incluir los campos dinámicos:
   - Encabezado: `<<[ID Cliente].[Nombre]>>`
   - Tabla de productos: Use `<<Start: [Related Quote_Items]>> ... <<End>>`.
   - Mostrar el precio de venta aplicado con la utilidad: `<<[Sales Price]>>`.

## 6. Gestión Avanzada de Cotizaciones (NUEVO)

### A. Botones de Acción (App > Actions)
1. **Aprobar Cotización**:
   - For a record of table: `Quotes`.
   - Do this: `Data: set the values of some columns in this row`.
   - Set these columns: `Status` = "Aprobada".
2. **Solicitar Despacho**:
   - For a record of table: `Quotes`.
   - Do this: `Data: add a new row to another table using values from this row`.
   - Table to add to: `Pedidos`.
   - Map fields: `ID Cliente` = `[ID Cliente]`, `ID Cotización` = `[ID Cotización]`, `Status` = "En preparación".
   - Only if this condition is true: `[Status] = "Aprobada"`.

### B. Filtro de Fecha (Slice)
1. Vaya a **Data > Slices**.
2. Cree un Slice "Histórico Cotizaciones".
    - Base table: `Quotes`.
    - Filter condition: `AND([Fecha] >= [_THISUSER].[FechaInicio], [Fecha] <= [_THISUSER].[FechaFin])`.
3. Vaya a **UX > Views** y cree una vista para mostrar este Slice.

## 7. Módulo de Informes Comerciales (NUEVO)

### A. Vista de Gráficos (UX > Views)
1. **Cotizaciones por Cliente**:
   - View Type: `Chart`.
   - Data source: `Quotes`.
   - Chart Type: `Col Series` o `Pie Chart`.
   - Group by: `ID Cliente`.
2. **Estado de Cotizaciones**:
   - View Type: `Chart`.
   - Data source: `Quotes`.
   - Group by: `Status`.

### B. Dashboard de Informes
1. Cree una nueva vista tipo `Dashboard` llamada "Informes de Ventas".
2. Añada las dos vistas de gráficos creadas anteriormente.
3. **Filtro**: Puede usar el Slice "Histórico Cotizaciones" como fuente de datos para que los informes también respondan al rango de fechas.

### C. Botón "Marcar como Perdida"
1. Vaya a **App > Actions**.
2. Cree una acción para `Quotes`: `Data: set the values of some columns in this row`.
3. Set `Status` = "Lost" (Perdida).

## 8. Cálculo de Distancia (Opcional)
... [Mismo que antes]
