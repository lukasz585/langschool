import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Używamy prostego, uniwersalnego magazynu dostępnego wszędzie
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // To zadziała w Expo Go bez dodatkowych modułów natywnych
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});