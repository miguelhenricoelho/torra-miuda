// Regras do painel compartilhadas pelo modo demonstração e pelo modo real.
// As mesmas regras valem no banco (função pode_mudar): aqui só mostramos os botões certos.

export const PAPEIS = {
  dona: { nome: 'Dona', telas: ['pedidos', 'torra', 'expedicao', 'assinaturas', 'cafes', 'ajustes', 'historico'] },
  atendimento: { nome: 'Atendimento', telas: ['pedidos', 'assinaturas'] },
  expedicao: { nome: 'Expedição', telas: ['torra', 'expedicao'] },
};

export const ETAPAS = ['novo', 'confirmado', 'torrado', 'embalado', 'a_caminho', 'entregue'];

// O nome de cada etapa muda com o jeito de receber
export function nomeDoStatus(status, receber = 'entrega') {
  const nomes = {
    novo: 'Para confirmar',
    confirmado: 'Confirmado',
    torrado: 'Torrado',
    embalado: 'Embalado',
    a_caminho: { entrega: 'Saiu para entrega', retirada: 'Pronto para retirar', correios: 'Postado' }[receber],
    entregue: { entrega: 'Entregue', retirada: 'Retirado', correios: 'Entregue' }[receber],
    cancelado: 'Cancelado',
  };
  return nomes[status] ?? status;
}

// Texto do botão que leva o pedido até aquele status
export function acaoDoStatus(status, receber = 'entrega') {
  const acoes = {
    novo: 'Voltar para confirmar',
    confirmado: 'Confirmar pedido',
    torrado: 'Marcar torrado',
    embalado: 'Marcar embalado',
    a_caminho: { entrega: 'Saiu para entrega', retirada: 'Pronto para retirar', correios: 'Marcar postado' }[receber],
    entregue: { entrega: 'Marcar entregue', retirada: 'Marcar retirado', correios: 'Marcar entregue' }[receber],
    cancelado: 'Cancelar pedido',
  };
  return acoes[status];
}

export function podeMudar(papel, de, para) {
  if (papel === 'dona') return de !== para;
  if (papel === 'atendimento') {
    return (de === 'novo' && ['confirmado', 'cancelado'].includes(para)) || (de === 'confirmado' && ['novo', 'cancelado'].includes(para));
  }
  if (papel === 'expedicao') {
    const seguinte = { confirmado: 'torrado', torrado: 'embalado', embalado: 'a_caminho', a_caminho: 'entregue' };
    return seguinte[de] === para;
  }
  return false;
}

// Botões que aparecem no detalhe do pedido: o próximo passo primeiro, cancelar por último
export function acoesPermitidas(papel, pedido) {
  const indice = ETAPAS.indexOf(pedido.status);
  const candidatos = [];
  if (indice >= 0 && indice < ETAPAS.length - 1) candidatos.push(ETAPAS[indice + 1]);
  if (indice > 0 && papel === 'dona') candidatos.push(ETAPAS[indice - 1]);
  if (pedido.status === 'confirmado' && papel === 'atendimento') candidatos.push('novo');
  if (!['entregue', 'cancelado'].includes(pedido.status)) candidatos.push('cancelado');
  if (pedido.status === 'cancelado' && papel === 'dona') candidatos.push('novo');
  return [...new Set(candidatos)].filter((para) => podeMudar(papel, pedido.status, para));
}

export const GRUPOS_PEDIDOS = [
  { id: 'confirmar', nome: 'Para confirmar', status: ['novo'] },
  { id: 'andamento', nome: 'Em andamento', status: ['confirmado', 'torrado', 'embalado', 'a_caminho'] },
  { id: 'concluidos', nome: 'Concluídos', status: ['entregue'] },
  { id: 'cancelados', nome: 'Cancelados', status: ['cancelado'] },
];

export const NOME_RECEBER = { entrega: 'Entrega em Fortaleza', retirada: 'Retirada na Aldeota', correios: 'Correios' };

export const NOME_PAGAMENTO = {
  'pix-entrega': 'Pix na entrega',
  'cartao-link': 'Cartão por link',
  'pix-retirada': 'Pix na retirada',
  'cartao-retirada': 'Cartão na retirada',
  dinheiro: 'Dinheiro na retirada',
  pix: 'Pix',
};

// Soma da torra: gramas por café a partir dos itens dos pedidos confirmados
export function somarTorra(pedidos, data) {
  const porCafe = new Map();
  for (const pedido of pedidos) {
    if (pedido.data_torra !== data || pedido.status !== 'confirmado') continue;
    for (const item of pedido.itens) {
      if (item.tipo !== 'cafe') continue;
      const atual = porCafe.get(item.cafe_id) ?? { cafe_id: item.cafe_id, nome: item.nome, gramas: 0, pacotes_250: 0, pacotes_1000: 0 };
      atual.gramas += item.peso * item.qtd;
      if (item.peso === 250) atual.pacotes_250 += item.qtd;
      else atual.pacotes_1000 += item.qtd;
      porCafe.set(item.cafe_id, atual);
    }
  }
  return [...porCafe.values()].sort((a, b) => a.nome.localeCompare(b.nome));
}

export const formatarPeso = (gramas) =>
  gramas >= 1000 ? `${(gramas / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg` : `${gramas} g`;

export const formatarDataCurta = (iso) => {
  const data = new Date(`${iso}T12:00:00Z`);
  const dia = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][data.getUTCDay()];
  return `${dia}, ${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
};

// Link do WhatsApp para falar com o cliente (número com DDI 55)
export function linkParaCliente(numero, mensagem) {
  if (!numero) return null;
  const digitos = String(numero).replace(/\D/g, '');
  const completo = digitos.length <= 11 ? `55${digitos}` : digitos;
  return `https://wa.me/${completo}?text=${encodeURIComponent(mensagem)}`;
}

export const primeiroNome = (nome) => String(nome ?? '').split(' ')[0];

export const real = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const NOME_MOAGEM = { grao: 'em grão', coado: 'para coado', prensa: 'para prensa', moka: 'para moka', espresso: 'para espresso' };

export const formatarCep = (cep) => String(cep).replace(/^(\d{5})(\d{3})$/, '$1-$2');
