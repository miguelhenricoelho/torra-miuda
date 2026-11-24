// Função criar-pedido (Supabase Edge Function).
// Recebe o pedido da sacola, barra robôs e excessos, valida e registra no banco.
// O banco recalcula preços e a data da torra: o navegador não decide nada disso.
import { createClient } from '@supabase/supabase-js';
import { validarPedido, pareceRobo } from '../_shared/validar-pedido.js';

const SITE = Deno.env.get('SITE_URL') ?? 'https://torramiuda.com.br';
const SAL = Deno.env.get('SAL_LIMITE') ?? '';
const LIMITE_POR_HORA = 5;

const cabecalhos = {
  'Access-Control-Allow-Origin': SITE,
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
  Vary: 'Origin',
};
const responder = (status: number, corpo: unknown) => new Response(JSON.stringify(corpo), { status, headers: cabecalhos });

async function resumo(texto: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (pedido) => {
  if (pedido.method === 'OPTIONS') return new Response(null, { headers: cabecalhos });
  if (pedido.method !== 'POST') return responder(405, { erro: 'Use POST.' });

  let corpo: Record<string, unknown>;
  try {
    corpo = await pedido.json();
  } catch {
    return responder(400, { erro: 'Pedido ilegível.' });
  }

  // Robô: responde como se tivesse dado certo, sem gravar nada
  if (pareceRobo(corpo as { site?: string; abertoEm?: number })) return responder(200, { codigo: null });

  const validado = validarPedido(corpo);
  if (!validado.ok) return responder(400, { erro: validado.erro });

  const banco = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

  // Limite por endereço de internet, guardado só como resumo (sem o IP em si)
  const ip = pedido.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'sem-ip';
  const chave = await resumo(`${SAL}:${ip}`);
  const umaHoraAtras = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await banco.from('limite_envios').select('id', { count: 'exact', head: true }).eq('chave', chave).gte('quando', umaHoraAtras);
  if ((count ?? 0) >= LIMITE_POR_HORA) return responder(429, { erro: 'Muitos pedidos seguidos. Mande pelo WhatsApp que a gente registra.' });
  await banco.from('limite_envios').insert({ chave });
  await banco.from('limite_envios').delete().lt('quando', new Date(Date.now() - 86_400_000).toISOString());

  const { data, error } = await banco.rpc('registrar_pedido_site', { dados: validado.dados });
  if (error) {
    const indisponivel = error.message?.includes('indisponível');
    return responder(indisponivel ? 409 : 500, {
      erro: indisponivel ? 'Um dos cafés acabou de esgotar.' : 'Não deu para registrar agora.',
    });
  }
  return responder(200, { codigo: data.codigo, total: data.total, data_torra: data.data_torra });
});
