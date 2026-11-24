// Cliente do Supabase para o navegador. Só a chave pública (anon) vai para o site:
// quem decide o que cada um vê são as regras de acesso do banco.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const chave = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigurado = Boolean(url && chave);
export const supabase = supabaseConfigurado ? createClient(url, chave) : null;
