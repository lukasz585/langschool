import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Supabase URL i anon key powinny być w pliku .env lub w Expo Constants
// W web Expo zastąpi te wartości podczas budowania aplikacji
const SUPABASE_URL = Constants.expoConfig?.extra?.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Brakuje konfiguracji Supabase! Dodaj SUPABASE_URL i SUPABASE_ANON_KEY.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true, // pozwala zachować sesję na urządzeniu/web
    detectSessionInUrl: typeof window !== 'undefined', // potrzebne w web dla redirect
  },
});