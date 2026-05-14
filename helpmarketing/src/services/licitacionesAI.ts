import Anthropic from '@anthropic-ai/sdk';
import type { Licitacion, MatchResult, EmpresaPerfil, DocumentoBase } from '../types/licitaciones.types';

const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';

function getClient(): Anthropic {
  if (!ANTHROPIC_KEY) throw new Error('VITE_ANTHROPIC_API_KEY no configurada en .env');
  return new Anthropic({ apiKey: ANTHROPIC_KEY, dangerouslyAllowBrowser: true });
}

function formatCurrency(v: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
}

// ─── Match Score IA ──────────────────────────────────────────────────────────

export async function calcularMatchScore(
  licitacion: Licitacion,
  perfil: EmpresaPerfil
): Promise<MatchResult> {
  const client = getClient();

  const prompt = `Eres un experto en contratación pública colombiana (SECOP). Analiza la compatibilidad entre esta licitación y el perfil empresarial.

## LICITACIÓN
Entidad: ${licitacion.entidad_nombre}
Descripción: ${licitacion.descripcion}
Modalidad: ${licitacion.modalidad}
Departamento: ${licitacion.departamento || 'N/A'} - ${licitacion.municipio || ''}
Presupuesto oficial: ${licitacion.presupuesto ? formatCurrency(licitacion.presupuesto) : 'No especificado'}
Estado: ${licitacion.estado}

## PERFIL EMPRESARIAL
Empresa: ${perfil.nombre} - NIT: ${perfil.nit}
Sector: ${perfil.sector}
Descripción: ${perfil.descripcion}
Servicios ofrecidos: ${perfil.servicios.join(', ')}
Certificaciones: ${perfil.certificaciones.join(', ')}
Capacidad financiera:
  - Activos totales: ${formatCurrency(perfil.capacidad_financiera.activos_totales)}
  - Ingresos anuales: ${formatCurrency(perfil.capacidad_financiera.ingresos_anuales)}
  - Patrimonio: ${formatCurrency(perfil.capacidad_financiera.patrimonio)}
Experiencia relevante:
${perfil.experiencia.map(e => `  - ${e.anno}: ${e.proyecto} (${e.entidad}) - ${formatCurrency(e.valor)}: ${e.descripcion}`).join('\n')}

## INSTRUCCIÓN
Evalúa la compatibilidad en una escala del 0 al 100 considerando:
1. Alineación de servicios con el objeto del contrato
2. Experiencia relevante demostrada
3. Capacidad financiera vs presupuesto
4. Certificaciones y requisitos habilitantes
5. Historial de contratos similares

Responde ÚNICAMENTE con JSON válido en este formato exacto (sin markdown, sin texto adicional):
{
  "score": <número 0-100>,
  "nivel": <"alto" si score>=70, "medio" si 40-69, "bajo" si 20-39, "sin_match" si <20>,
  "justificacion": "<párrafo explicando el match>",
  "fortalezas": ["<fortaleza 1>", "<fortaleza 2>", "<fortaleza 3>"],
  "debilidades": ["<debilidad 1>", "<debilidad 2>"],
  "recomendaciones": ["<recomendacion 1>", "<recomendacion 2>", "<recomendacion 3>"]
}`;

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    thinking: { type: 'adaptive' },
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content
    .filter(b => b.type === 'text')
    .map(b => (b as { type: 'text'; text: string }).text)
    .join('');

  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1) throw new Error('Respuesta IA sin formato JSON');

  const result: MatchResult = JSON.parse(text.substring(first, last + 1));
  return result;
}

// ─── Generación de Documentos Base ──────────────────────────────────────────

type TipoDocumento = DocumentoBase['tipo'];

const PROMPTS_DOCUMENTO: Record<TipoDocumento, string> = {
  carta_presentacion: `Redacta una carta de presentación formal para esta licitación. Debe incluir:
- Encabezado formal dirigido a la entidad
- Presentación de la empresa
- Manifestación de interés en el proceso
- Mención de capacidades relevantes
- Firma y datos de contacto
Usa formato de carta formal colombiana. Incluye placeholders como [NOMBRE_REPRESENTANTE], [CARGO], [FECHA] donde sea necesario.`,

  experiencia: `Elabora un documento de experiencia relevante para esta licitación. Incluye:
- Tabla/listado de proyectos similares ejecutados
- Descripción de cada contrato relevante
- Valores, entidades y fechas
- Documentos de soporte sugeridos
- Resumen ejecutivo de capacidades demostradas
El documento debe ser formal y estar organizado para presentación ante entidad pública.`,

  propuesta_tecnica: `Elabora una propuesta técnica base para esta licitación. Debe incluir:
- Entendimiento del objeto contractual
- Metodología de trabajo propuesta
- Plan de trabajo con fases y actividades
- Equipo de trabajo sugerido (perfiles requeridos)
- Medidas de calidad y control
- Gestión de riesgos
- Cronograma de actividades (en semanas)
Usa los requisitos del proceso para hacer la propuesta específica y relevante.`,

  propuesta_economica: `Elabora una estructura de propuesta económica para esta licitación. Incluye:
- Tabla de costos desglosada (personal, equipos, software, gastos administrativos)
- AIU (Administración, Imprevistos y Utilidad) si aplica
- Valor total propuesto (alineado al presupuesto oficial cuando esté disponible)
- Forma de pago sugerida
- Nota: indicar que los valores son estimados y deben ajustarse al análisis de costos final.`,

  cronograma: `Elabora un cronograma de actividades detallado para la ejecución de este contrato. Incluye:
- Tabla con fases, actividades, duración (en semanas/meses) y responsables
- Hitos principales del proyecto
- Entregables por fase
- Actividades de seguimiento y supervisión
- Cronograma de pagos sugerido
Adapta la duración al tipo de contrato y al objeto contractual.`,
};

export async function generarDocumentoBase(
  licitacion: Licitacion,
  perfil: EmpresaPerfil,
  tipo: TipoDocumento
): Promise<string> {
  const client = getClient();

  const instruccionDocumento = PROMPTS_DOCUMENTO[tipo];

  const prompt = `Eres un experto redactor de documentos para licitaciones públicas en Colombia.
Genera el documento solicitado basándote en la información del proceso y el perfil de la empresa.

## PROCESO DE CONTRATACIÓN
Entidad: ${licitacion.entidad_nombre}
No. Proceso: ${licitacion.numero_proceso}
Objeto: ${licitacion.descripcion}
Modalidad: ${licitacion.modalidad}
Presupuesto: ${licitacion.presupuesto ? formatCurrency(licitacion.presupuesto) : 'Por consultar'}
Departamento: ${licitacion.departamento || ''} - ${licitacion.municipio || ''}

## EMPRESA PROPONENTE
Nombre: ${perfil.nombre}
NIT: ${perfil.nit}
Sector: ${perfil.sector}
Servicios: ${perfil.servicios.slice(0, 5).join(', ')}
Experiencia: ${perfil.experiencia.map(e => `${e.proyecto} (${e.anno})`).join(', ')}
Certificaciones: ${perfil.certificaciones.join(', ')}

## DOCUMENTO A GENERAR
${instruccionDocumento}

IMPORTANTE: Genera el documento completo, bien estructurado y listo para usar.
No incluyas explicaciones fuera del documento.`;

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 3000,
    thinking: { type: 'adaptive' },
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content
    .filter(b => b.type === 'text')
    .map(b => (b as { type: 'text'; text: string }).text)
    .join('');
}

// ─── Analizar cambios de estado de una licitación ───────────────────────────

export async function analizarAlerta(
  licitacion: Licitacion,
  evento: string
): Promise<string> {
  const client = getClient();

  const prompt = `Redacta un mensaje de alerta CORTO y claro para Telegram sobre este evento en una licitación pública.

Proceso: ${licitacion.numero_proceso} - ${licitacion.entidad_nombre}
Objeto: ${licitacion.descripcion.substring(0, 200)}
Evento: ${evento}
Match Score: ${licitacion.match_score ? licitacion.match_score + '/100' : 'Sin analizar'}

El mensaje debe ser informativo, incluir emojis relevantes y no superar 300 caracteres.
Responde SOLO con el texto del mensaje Telegram.`;

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content
    .filter(b => b.type === 'text')
    .map(b => (b as { type: 'text'; text: string }).text)
    .join('');
}
