/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Faltan las variables de entorno de Supabase. Revisa tu archivo .env')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

// Columnas de app_users que el navegador puede leer (la contraseña no tiene permiso de lectura)
export const USER_COLS = 'id, nombre, usuario, cargo, email, telefono, rol, permisos, created_at'
