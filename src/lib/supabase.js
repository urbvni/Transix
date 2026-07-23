import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Se le variabili non sono configurate, esportiamo null: la home funziona comunque
// con dati mock, così puoi lavorare sull'UI prima di creare l'account Supabase.
export const supabase = url && key ? createClient(url, key) : null;
