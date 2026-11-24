// Registra o pedido da sacola no banco (função criar-pedido) antes de abrir o WhatsApp.
// Se o registro falhar, o pedido segue pelo WhatsApp mesmo assim: nenhuma venda se perde.
const url = import.meta.env.PUBLIC_SUPABASE_URL;
const chave = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const registroLigado = Boolean(url && chave);

export async function registrarPedido({ itens, dados, abertoEm, site }) {
  if (!registroLigado) return null;
  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), 6000);
  try {
    const resposta = await fetch(`${url}/functions/v1/criar-pedido`, {
      method: 'POST',
      signal: controle.signal,
      headers: { 'Content-Type': 'application/json', apikey: chave, Authorization: `Bearer ${chave}` },
      body: JSON.stringify({
        ...dados,
        site,
        abertoEm,
        itens: itens.map(({ tipo, id, peso, moagem, qtd }) => (tipo === 'kit' ? { tipo, moagem, qtd } : { tipo, id, peso, moagem, qtd })),
      }),
    });
    if (!resposta.ok) return null;
    const corpo = await resposta.json();
    return corpo.codigo ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(limite);
  }
}
