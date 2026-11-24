// Painel no modo real: Supabase com login da equipe e as regras de acesso do banco.
import { supabase } from './supabase.js';
import { primeiroDoMes } from './painel-datas.js';

const erroAmigavel = (erro) => {
  if (!erro) return null;
  if (erro.code === '42501') return new Error('Seu papel não tem acesso a esta parte.');
  if (erro.message?.includes('Invalid login')) return new Error('E-mail ou senha não conferem.');
  return new Error('Não deu para falar com o servidor. Confira a internet e tente de novo.');
};
async function rodar(consulta) {
  const { data, error } = await consulta;
  if (error) throw erroAmigavel(error);
  return data;
}

async function pessoaDaSessao() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: pessoa } = await supabase.from('equipe').select('id, nome, papel, ativo').eq('id', data.user.id).maybeSingle();
  if (!pessoa?.ativo) return null;
  return { id: pessoa.id, nome: pessoa.nome, papel: pessoa.papel };
}

export const painelSupabase = {
  modo: 'real',

  async sessaoAtual() {
    return pessoaDaSessao();
  },
  async entrar(email, senha) {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) throw erroAmigavel(error);
    const pessoa = await pessoaDaSessao();
    if (!pessoa) {
      await supabase.auth.signOut();
      throw new Error('Este acesso não está ativo no painel. Fale com a Iara.');
    }
    return pessoa;
  },
  async esqueciSenha(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/painel/` });
    if (error) throw erroAmigavel(error);
  },
  async sair() {
    await supabase.auth.signOut();
  },

  async listarPedidos() {
    return rodar(
      supabase
        .from('pedidos')
        .select('*, itens:pedido_itens(*), cliente:clientes(whatsapp)')
        .order('criado_em', { ascending: false })
        .limit(300),
    ).then((pedidos) => pedidos.map(({ cliente, ...pedido }) => ({ ...pedido, whatsapp: cliente?.whatsapp ?? null })));
  },
  async mudarStatus(id, status) {
    await rodar(supabase.rpc('avancar_status', { p_pedido: id, p_status: status }));
    return { id, status };
  },
  async marcarPago(id, pago) {
    return rodar(supabase.from('pedidos').update({ pago }).eq('id', id).select().single());
  },

  async listaTorra(data) {
    const [cafes, resumo] = await Promise.all([
      rodar(supabase.rpc('lista_torra', { p_data: data })),
      rodar(supabase.rpc('resumo_torra', { p_data: data })),
    ]);
    return {
      cafes: cafes.map((c) => ({ ...c, gramas: Number(c.gramas), pacotes_250: Number(c.pacotes_250 ?? 0), pacotes_1000: Number(c.pacotes_1000 ?? 0) })),
      pedidosConfirmados: Number(resumo[0]?.confirmados ?? 0),
      pedidosParaConfirmar: Number(resumo[0]?.para_confirmar ?? 0),
    };
  },
  async marcarTorraFeita(data) {
    return rodar(supabase.rpc('marcar_torra_feita', { p_data: data }));
  },
  async listaExpedicao(data) {
    return rodar(supabase.rpc('lista_expedicao', { p_data: data }));
  },

  async listarAssinaturas() {
    const mes = primeiroDoMes();
    const lista = await rodar(supabase.from('assinaturas').select('*, envios:assinatura_envios(*)').order('nome'));
    return lista.map(({ envios, ...assinatura }) => ({
      ...assinatura,
      envio: envios.find((envio) => envio.mes === mes) ?? { mes, pago: false, enviado: false },
    }));
  },
  async mudarAssinatura(id, campos) {
    if ('status' in campos) await rodar(supabase.from('assinaturas').update({ status: campos.status }).eq('id', id));
    const envio = {};
    if ('pago' in campos) envio.pago = campos.pago;
    if ('enviado' in campos) envio.enviado = campos.enviado;
    if (Object.keys(envio).length) {
      await rodar(
        supabase.from('assinatura_envios').upsert({ assinatura_id: id, mes: primeiroDoMes(), ...envio }, { onConflict: 'assinatura_id,mes' }),
      );
    }
  },

  async listarCafes() {
    return rodar(supabase.from('cafes').select('*').order('ordem'));
  },
  async salvarCafe(cafe) {
    return rodar(supabase.from('cafes').upsert(cafe).select().single());
  },

  async lerAjustes() {
    const [config, dias, equipe] = await Promise.all([
      rodar(supabase.from('configuracoes').select('*').eq('id', 1).single()),
      rodar(supabase.from('dias_fechados').select('*').order('data')),
      rodar(supabase.from('equipe').select('id, nome, papel, ativo').order('nome')),
    ]);
    return { config, dias, equipe };
  },
  async salvarConfig(campos) {
    await rodar(supabase.from('configuracoes').update(campos).eq('id', 1));
  },
  async adicionarDia(dia) {
    const { error } = await supabase.from('dias_fechados').insert(dia);
    if (error?.code === '23505') throw new Error('Esse dia já está na lista.');
    if (error) throw erroAmigavel(error);
  },
  async tirarDia(data) {
    await rodar(supabase.from('dias_fechados').delete().eq('data', data));
  },
  async mudarEquipe(id, campos) {
    const { data } = await supabase.auth.getUser();
    if (id === data.user?.id && campos.ativo === false) throw new Error('Você não pode desativar o seu próprio acesso.');
    await rodar(supabase.from('equipe').update(campos).eq('id', id));
  },

  async listarHistorico() {
    return rodar(supabase.from('registro_acoes').select('*').order('quando', { ascending: false }).limit(100));
  },
};
