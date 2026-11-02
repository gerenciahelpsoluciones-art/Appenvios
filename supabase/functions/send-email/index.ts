import { corsHeaders, esUsuarioCrm, json } from '../_shared/crm-auth.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
// Llamadas de servidor (Victoria en n8n) mandan este secreto en el encabezado x-hs-secret
const EMAIL_FUNCTION_SECRET = Deno.env.get('EMAIL_FUNCTION_SECRET')

const EMAIL_RE = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/
const MAX_DESTINATARIOS = 10

const lista = (v: unknown): string[] | null => {
  if (v === undefined || v === null || v === '') return []
  const arr = Array.isArray(v) ? v : [v]
  if (!arr.every(x => typeof x === 'string' && EMAIL_RE.test(x.trim()))) return null
  return arr.map(x => (x as string).trim())
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405)

  const secreto = req.headers.get('x-hs-secret')
  const autorizado = (EMAIL_FUNCTION_SECRET && secreto === EMAIL_FUNCTION_SECRET) || await esUsuarioCrm(req)
  if (!autorizado) return json({ error: 'No autorizado' }, 401)

  try {
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set')

    const { to, subject, html, cc } = await req.json()
    const para = lista(to)
    const copia = lista(cc)
    if (!para || para.length === 0 || !copia) return json({ error: 'Destinatarios inválidos' }, 400)
    if (para.length + copia.length > MAX_DESTINATARIOS) return json({ error: 'Demasiados destinatarios' }, 400)
    if (typeof subject !== 'string' || !subject.trim() || subject.length > 300) return json({ error: 'Asunto inválido' }, 400)
    if (typeof html !== 'string' || !html || html.length > 300_000) return json({ error: 'Contenido inválido' }, 400)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'AppEnvios <notificaciones@helpsoluciones.com.co>',
        to: para,
        subject,
        html,
        cc: copia.length ? copia : undefined,
      }),
    })

    const data = await res.json()
    console.log(`Correo enviado. Resend ID: ${data.id || 'N/A'}`)
    return json(res.ok ? { id: data.id } : { error: 'El servicio de correo rechazó el envío' }, res.status)
  } catch (error: any) {
    console.error('Error crítico en función send-email:', error.message)
    return json({ error: 'Error interno enviando el correo' }, 500)
  }
})
