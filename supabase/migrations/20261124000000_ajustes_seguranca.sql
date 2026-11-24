-- Ajustes apontados pelo verificador de segurança do Supabase.
-- search_path fixo nas funções que não tinham; a função dos gatilhos do histórico
-- não pode ser chamada de fora (só roda dentro dos gatilhos).
alter function public.gatilho_atualizado() set search_path = public;
alter function public.pode_mudar(text, text, text) set search_path = public;
alter function public.dia_da_entrega(date) set search_path = public;
revoke all on function public.gatilho_registro() from public, anon, authenticated;
