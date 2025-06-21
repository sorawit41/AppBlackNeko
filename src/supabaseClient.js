// src/supabaseClient.js
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ocxifoxvjpgohyajqzny.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jeGlmb3h2anBnb2h5YWpxem55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMzE2OTEsImV4cCI6MjA2MjcwNzY5MX0.2e2n511a9IxlvYBHGb6_gD9KaV-LEDkFJAAZfVAV5K8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});