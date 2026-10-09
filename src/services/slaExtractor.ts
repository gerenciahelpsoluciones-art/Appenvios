// Envía el RFP / solicitud del cliente a la función extraer-slas (Supabase + Gemini)
// y devuelve los SLA listos para la propuesta de Mesa de Ayuda.
import { supabase } from '../lib/supabaseClient';
import type { PropuestaSlas } from '../App';

export const RFP_ACCEPT = '.pdf,.docx,.txt';
const MAX_BYTES = 10 * 1024 * 1024;

const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });

export async function extraerSlasDeRfp(file: File): Promise<PropuestaSlas> {
  if (file.size > MAX_BYTES) throw new Error('El archivo supera 10 MB.');
  const ext = file.name.split('.').pop()?.toLowerCase();

  let payload: Record<string, string>;
  if (ext === 'pdf') {
    payload = { mimeType: 'application/pdf', base64: await toBase64(file), fileName: file.name };
  } else if (ext === 'docx') {
    const mammoth = await import('mammoth');
    const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    payload = { text: value, fileName: file.name };
  } else if (ext === 'txt') {
    payload = { text: await file.text(), fileName: file.name };
  } else {
    throw new Error('Formato no soportado. Use PDF, Word (.docx) o TXT.');
  }

  const { data, error } = await supabase.functions.invoke('extraer-slas', { body: payload });
  if (error) {
    // El cuerpo del error trae el mensaje de la función (p. ej. falta la API key)
    let detalle = '';
    try { detalle = (await (error as { context?: Response }).context?.json())?.error || ''; } catch { /* sin cuerpo */ }
    throw new Error(detalle || 'No se pudo analizar el documento.');
  }

  const filas = (data?.filas || []) as Omit<PropuestaSlas['filas'][number], 'id'>[];
  return {
    filas: filas.map(f => ({ ...f, id: crypto.randomUUID() })),
    notas: (data?.notas || []) as string[],
    fuente: [file.name, data?.fuente].filter(Boolean).join(' · '),
  };
}
