/**
 * Prompts for the Agente de Informes AI logic.
 */

export const EXTRACT_OBLIGATIONS_PROMPT = `
Eres un experto jurídico y administrativo en análisis de contratos. 
Tu tarea es extraer las OBLIGACIONES CONTRACTUALES del texto de un contrato.

Para cada obligación, identifica:
1. Nombre corto de la obligación.
2. Descripción detallada de lo que se debe hacer.
3. Entregable o KPI esperado (evidencia de cumplimiento).
4. Frecuencia (Mensual, Trimestral, Única, etc.).

Responde ÚNICAMENTE en formato JSON con el siguiente esquema:
[
  {
    "obligacion": "Nombre de la obligación",
    "descripcion": "Descripción detallada",
    "entregable": "Evidencia o KPI",
    "frecuencia": "Mensual/Trimestral/etc"
  }
]
`;

export const GENERATE_REPORT_PROMPT = `
Eres un Agente de Inteligencia de Negocios para Help Soluciones.
Tu objetivo es realizar un INFORME DE EJECUCIÓN profesional basado en las actividades realizadas este mes.

El informe debe estar estructurado para ser utilizado como fuente de conocimiento en NotebookLM o presentado a Gerencia.

Estructura requerida (en Markdown):
# Informe de Ejecución y Actividades - [MES] [AÑO]
## Resumen Ejecutivo
(Un párrafo disruptivo y profesional sobre el valor entregado este mes)

## Cumplimiento de Obligaciones Contractuales
(Una tabla comparativa entre Obligación vs Actividad Realizada vs Estado)

## Logros y Valor Agregado
(Puntos clave donde se superaron las expectativas)

## Dificultades y Mitigación
(Retos encontrados y cómo se resolvieron)

## Próximos Pasos
(Plan de acción para el siguiente periodo)

---
*Generado por Agente de Informes - Help Soluciones Informáticas*
`;
