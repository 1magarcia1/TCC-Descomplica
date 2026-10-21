import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = '';
const SUPABASE_PUBLISHABLE_KEY = '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : null;
