import { supabase } from './supabase';

export interface TelegramAuth {
  id: string;
  telegram_id: number;
  username: string | null;
  full_name: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface TelegramInbound {
  id: string;
  telegram_id: number;
  raw_message: any;
  status: 'pending' | 'processing' | 'done' | 'failed';
  created_at: string;
}

// ─── Gestión de Usuarios Autorizados ────────────────────────────────────────

export const getAuthorizedUsers = async (): Promise<TelegramAuth[]> => {
  const { data, error } = await supabase
    .from('mkt_telegram_auth')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error obteniendo usuarios de Telegram:', error.message);
    return [];
  }
  return data || [];
};

export const authorizeUser = async (user: Partial<TelegramAuth>): Promise<boolean> => {
  const { error } = await supabase
    .from('mkt_telegram_auth')
    .insert(user);

  if (error) {
    console.error('Error autorizando usuario:', error.message);
    return false;
  }
  return true;
};

export const deauthorizeUser = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('mkt_telegram_auth')
    .delete()
    .eq('id', id);

  return !error;
};

// ─── Monitoreo de Mensajes Entrantes ────────────────────────────────────────

export const getInboundMessages = async (limit = 20): Promise<TelegramInbound[]> => {
  const { data, error } = await supabase
    .from('mkt_telegram_inbound')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error obteniendo mensajes inbound:', error.message);
    return [];
  }
  return data || [];
};

export const subscribeToInboundMessages = (callback: (msg: TelegramInbound) => void) => {
  return supabase
    .channel('mkt_telegram_inbound_realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'mkt_telegram_inbound' },
      (payload) => callback(payload.new as TelegramInbound)
    )
    .subscribe();
};
