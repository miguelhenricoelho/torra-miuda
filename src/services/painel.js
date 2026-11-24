// Escolhe o modo do painel.
// Com PUBLIC_SUPABASE_URL e PUBLIC_SUPABASE_ANON_KEY: login real da equipe.
// Sem elas (ou com PUBLIC_PAINEL_DEMONSTRACAO=true): a demonstração, com dados fictícios.
// O cliente do Supabase só é baixado quando o modo real existe (a demonstração fica leve).
import { painelDemo } from './painel-demo.js';

export const loginRealLiberado = Boolean(import.meta.env.PUBLIC_SUPABASE_URL && import.meta.env.PUBLIC_SUPABASE_ANON_KEY);
export const demonstracaoLiberada = !loginRealLiberado || import.meta.env.PUBLIC_PAINEL_DEMONSTRACAO === 'true';

let real = null;
let atual = painelDemo;

export async function carregarReal() {
  if (!loginRealLiberado) return null;
  real ??= (await import('./painel-supabase.js')).painelSupabase;
  return real;
}
export function usarDemonstracao() {
  atual = painelDemo;
}
export function usarReal() {
  if (real) atual = real;
}

// Proxy: as telas chamam api.metodo() sem saber o modo
export const api = new Proxy({}, { get: (_, nome) => atual[nome] });
