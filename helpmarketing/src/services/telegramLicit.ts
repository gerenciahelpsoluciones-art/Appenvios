import type { Licitacion, TelegramLicitConfig } from '../types/licitaciones.types';

const STORAGE_KEY = 'licit_telegram_config';

export function getConfig(): TelegramLicitConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {/* ignore */}
  return {
    bot_token: '',
    chat_id: '',
    activo: false,
    score_minimo: 60,
    notificar_nuevas: true,
    notificar_cambios_estado: true,
  };
}

export function saveConfig(cfg: TelegramLicitConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

export async function enviarMensajeTelegram(
  token: string,
  chatId: string,
  texto: string
): Promise<boolean> {
  if (!token || !chatId) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: texto,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    const json = await res.json();
    return json.ok === true;
  } catch (err) {
    console.error('Telegram send error:', err);
    return false;
  }
}

export function buildMensajeNuevaLicitacion(licitacion: Licitacion): string {
  const score = licitacion.match_score;
  const nivel = score !== undefined
    ? score >= 70 ? '🟢 ALTO' : score >= 40 ? '🟡 MEDIO' : '🔴 BAJO'
    : '⚪ Sin analizar';

  const presupuesto = licitacion.presupuesto
    ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(licitacion.presupuesto)
    : 'No especificado';

  return `🔔 <b>NUEVA LICITACIÓN DETECTADA</b>

📋 <b>${licitacion.numero_proceso}</b>
🏛️ ${licitacion.entidad_nombre}
📍 ${licitacion.departamento || ''}${licitacion.municipio ? ' - ' + licitacion.municipio : ''}

📝 ${licitacion.descripcion.substring(0, 200)}${licitacion.descripcion.length > 200 ? '...' : ''}

💰 Presupuesto: ${presupuesto}
📊 Match Score: ${score !== undefined ? score + '/100' : 'N/A'} — ${nivel}
📌 Estado: ${licitacion.estado}
🔖 Modalidad: ${licitacion.modalidad}

${licitacion.url_proceso ? `🔗 <a href="${licitacion.url_proceso}">Ver proceso en SECOP</a>` : ''}

⏰ ${new Date().toLocaleString('es-CO')}`;
}

export function buildMensajeCambioEstado(
  licitacion: Licitacion,
  estadoAnterior: string,
  estadoNuevo: string
): string {
  return `⚡ <b>CAMBIO DE ESTADO</b>

📋 ${licitacion.numero_proceso}
🏛️ ${licitacion.entidad_nombre}

Estado: <s>${estadoAnterior}</s> → <b>${estadoNuevo}</b>

💰 Presupuesto: ${licitacion.presupuesto
    ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(licitacion.presupuesto)
    : 'N/A'}
📊 Match: ${licitacion.match_score !== undefined ? licitacion.match_score + '/100' : 'N/A'}

${licitacion.url_proceso ? `🔗 <a href="${licitacion.url_proceso}">Ver en SECOP</a>` : ''}`;
}

export async function notificarNuevaLicitacion(
  licitacion: Licitacion,
  config: TelegramLicitConfig
): Promise<boolean> {
  if (!config.activo || !config.notificar_nuevas) return false;
  if (config.score_minimo > 0 && licitacion.match_score !== undefined && licitacion.match_score < config.score_minimo) return false;

  const msg = buildMensajeNuevaLicitacion(licitacion);
  return enviarMensajeTelegram(config.bot_token, config.chat_id, msg);
}

export async function probarConexionTelegram(config: TelegramLicitConfig): Promise<{ ok: boolean; error?: string }> {
  if (!config.bot_token || !config.chat_id) {
    return { ok: false, error: 'Token o Chat ID no configurados' };
  }

  const msg = `✅ <b>Conexión exitosa</b>

El sistema de notificaciones de Licitaciones está configurado correctamente.
⏰ ${new Date().toLocaleString('es-CO')}`;

  const ok = await enviarMensajeTelegram(config.bot_token, config.chat_id, msg);
  return ok ? { ok: true } : { ok: false, error: 'No se pudo enviar el mensaje. Verifica el token y chat ID.' };
}
