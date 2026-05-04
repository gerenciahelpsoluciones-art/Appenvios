# PROYECTO NOVA - FASE 2: Integración CRM y Movilidad Comercial

## 📝 Resumen de Estado (Cierre de Sábado 25/04/2026)
- **Usuario**: Carlos Saenz.
- **Logro**: Pipeline completo y funcional (Telegram -> Supabase -> n8n -> Gemini 2.5 Flash -> Telegram).
- **Modelo**: Gemini 2.5 Flash (v1beta) - API Key terminada en `Suaa8`.
- **Automatización**: n8n activo con Schedule Trigger cada 30 segundos.

## 🚀 Próximos Pasos (Lunes)

### 1. "Oídos" para NOVA (Transcripción)
- Modificar la Edge Function de Supabase para detectar `voice` messages de Telegram.
- Integrar proceso de transcripción para que Gemini pueda "leer" lo que el comercial dice en audios.

### 2. Sincronización con CRM
- Crear tabla de `cotizaciones` en Supabase (si no existe).
- Añadir nodo en n8n para extraer JSON de la respuesta de Gemini.
- Insertar datos de cotización automáticamente en el CRM para gestión comercial.

### 3. Optimización de Flujo
- Mejorar el prompt de NOVA para ser más rápido en cálculos de utilidad.
- Asegurar que el `chat_id` se mantenga siempre persistente.

---
**Nota para el Agente**: Carlos Saenz busca movilidad total para su fuerza de ventas. NOVA debe ser capaz de gestionar todo el proceso de preventa desde Telegram.
