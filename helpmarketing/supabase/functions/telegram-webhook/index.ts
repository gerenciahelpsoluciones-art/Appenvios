import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    // 1. Recibir el payload de Telegram
    const payload = await req.json()
    console.log("Telegram Payload:", payload)

    // 2. Inicializar cliente de Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 3. Extraer info básica de forma segura
    const message = payload.message || payload.edited_message || payload.callback_query?.message
    const telegramId = message?.from?.id || payload.callback_query?.from?.id || 0

    // 4. Insertar en la cola de entrada
    const { error } = await supabase
      .from('mkt_telegram_inbound')
      .insert({
        telegram_id: telegramId,
        raw_message: payload,
        status: 'pending',
        processed: false
      })

    if (error) {
      console.error("Error insertando en Supabase:", error)
      throw error
    }

    return new Response(
      JSON.stringify({ status: "success", message: "Stored in queue" }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    )

  } catch (err) {
    console.error("Error handling webhook:", err.message)
    // Respondemos 200 de todas formas para que Telegram no se quede reintentando
    return new Response(
      JSON.stringify({ status: "error", message: err.message }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    )
  }
})

