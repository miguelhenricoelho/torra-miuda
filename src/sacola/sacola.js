// Estado da sacola (compartilhado entre as ilhas) e montagem da mensagem do pedido.
import { atom } from 'nanostores';
import { CONFIG, KIT, moagemDoId } from '../dados/dados.js';
import { loteDoId } from '../services/catalogo.js';

const CHAVE = 'tm-sacola';
export const real = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function lerSalvo() {
  try {
    const salvo = JSON.parse(globalThis.localStorage?.getItem(CHAVE) ?? '[]');
    return Array.isArray(salvo) ? salvo : [];
  } catch {
    return [];
  }
}

export const $itens = atom([]);
export const $aberta = atom(false);

// Carrega depois da hidratação, para o HTML do servidor e o do navegador baterem
export function carregarSacola() {
  if ($itens.get().length === 0) $itens.set(lerSalvo());
}

$itens.listen((itens) => {
  try {
    globalThis.localStorage?.setItem(CHAVE, JSON.stringify(itens));
  } catch {
    /* sem armazenamento: a sacola vale só nesta visita */
  }
});

export function descreverItem(item) {
  if (item.tipo === 'kit') {
    const moagem = item.moagem ? `, ${moagemDoId(item.moagem).mensagem}` : '';
    return { nome: KIT.nome, detalhe: `${KIT.detalhe}${moagem}`, preco: KIT.preco, disponivel: true };
  }
  const lote = loteDoId(item.id);
  if (!lote) return { nome: 'Café', detalhe: 'não está mais no catálogo', preco: null, disponivel: false };
  const peso = item.peso === 1000 ? '1 kg' : '250 g';
  return {
    nome: lote.nome,
    detalhe: `${peso}, ${moagemDoId(item.moagem).mensagem}`,
    preco: lote.precos[item.peso] ?? null,
    disponivel: lote.estado === 'disponivel',
  };
}

export function adicionar(novo, { abrir = true } = {}) {
  const itens = $itens.get();
  const indice = itens.findIndex(
    (item) => item.tipo === novo.tipo && item.id === novo.id && item.peso === novo.peso && item.moagem === novo.moagem,
  );
  const quantidade = novo.qtd ?? 1;
  if (indice >= 0) {
    $itens.set(itens.map((item, i) => (i === indice ? { ...item, qtd: Math.min(20, item.qtd + quantidade) } : item)));
  } else {
    $itens.set([...itens, { ...novo, qtd: quantidade }]);
  }
  if (abrir) $aberta.set(true);
}

export function mudarQuantidade(indice, diferenca) {
  $itens.set($itens.get().map((item, i) => (i === indice ? { ...item, qtd: Math.max(1, Math.min(20, item.qtd + diferenca)) } : item)));
}

export function tirar(indice) {
  $itens.set($itens.get().filter((_, i) => i !== indice));
}

export const quantidadeTotal = (itens) => itens.reduce((soma, item) => soma + item.qtd, 0);

// Item sem preço nunca entra num total que parece final (E.3)
export function resumoDosValores(itens) {
  let subtotal = 0;
  let semPreco = 0;
  for (const item of itens) {
    const { preco } = descreverItem(item);
    if (preco == null) semPreco += 1;
    else subtotal += preco * item.qtd;
  }
  return { subtotal, semPreco };
}

export const FORMAS = {
  entrega: {
    rotulo: `Entrega em Fortaleza (R$ ${CONFIG.taxaEntrega})`,
    pagamentos: [
      ['pix-entrega', 'Pix na entrega'],
      ['cartao-link', 'Cartão por link no WhatsApp'],
    ],
  },
  retirada: {
    rotulo: 'Retirada na Aldeota (sem taxa)',
    pagamentos: [
      ['pix-retirada', 'Pix na retirada'],
      ['cartao-retirada', 'Cartão na retirada'],
      ['dinheiro', 'Dinheiro na retirada'],
    ],
  },
  correios: {
    rotulo: 'Correios, para todo o Brasil (frete no WhatsApp)',
    pagamentos: [
      ['pix', 'Pix'],
      ['cartao-link', 'Cartão por link no WhatsApp'],
    ],
  },
};

export function camposFaltando(dados) {
  const faltando = [];
  if (!dados.nome) faltando.push('seu nome');
  if (!dados.receber) faltando.push('como você quer receber');
  if (dados.receber === 'entrega' && (!dados.endereco || !dados.bairro)) faltando.push('o endereço com bairro');
  if (dados.receber === 'correios' && (!dados.endereco || !dados.cep || !dados.cidade)) faltando.push('o endereço com CEP e cidade');
  if (dados.receber && !dados.pagamento) faltando.push('a forma de pagamento');
  return faltando;
}

export function textosDoTotal(itens, receber) {
  const { subtotal, semPreco } = resumoDosValores(itens);
  const taxa = receber === 'entrega' ? CONFIG.taxaEntrega : 0;
  const aConfirmar = semPreco ? ` + ${semPreco} ${semPreco === 1 ? 'item' : 'itens'} a confirmar` : '';
  const total =
    receber === 'correios'
      ? `${real.format(subtotal)} + frete${aConfirmar}`
      : `${real.format(subtotal + taxa)}${aConfirmar}`;
  return {
    subtotal: `${real.format(subtotal)}${aConfirmar}`,
    taxaRotulo: receber === 'correios' ? 'Frete dos Correios' : receber === 'retirada' ? 'Retirada na Aldeota' : 'Entrega em Fortaleza',
    taxa: receber === 'correios' ? 'a combinar no WhatsApp' : receber === 'retirada' ? 'sem taxa' : receber ? real.format(taxa) : '—',
    total,
  };
}

// codigo: vem do banco na parte 2 (TM-0001...). Sem código, a mensagem segue sem ele.
export function montarMensagemPedido({ itens, dados, torra, atendimento, codigo = null }) {
  const pedido = codigo ? `o pedido ${codigo}` : 'um pedido';
  const abertura = atendimento.aberto
    ? `Oi, Torra Miúda! Quero fazer ${pedido}, montado no site:`
    : `Oi! Deixando ${pedido} para quando vocês abrirem (montado no site):`;
  const linhasItens = itens.map((item) => {
    const { nome, detalhe, preco } = descreverItem(item);
    return `${item.qtd}x ${nome}, ${detalhe}: ${preco == null ? 'preço a confirmar' : real.format(preco * item.qtd)}`;
  });
  const valores = textosDoTotal(itens, dados.receber);
  const linhas = [abertura, '', ...linhasItens, '', `Subtotal: ${valores.subtotal}`];

  if (dados.receber === 'entrega') linhas.push(`Entrega em Fortaleza: ${valores.taxa}`);
  if (dados.receber === 'retirada') linhas.push('Retirada na Aldeota: sem taxa');
  if (dados.receber === 'correios') linhas.push('Envio pelos Correios: frete a combinar aqui');
  linhas.push(`Total: ${valores.total}`);

  if (torra) {
    linhas.push(`Torra: ${torra.texto}`);
    if (dados.receber === 'entrega') linhas.push(`Entrega: ${torra.textoEntrega}`);
  }
  linhas.push('', `Nome: ${dados.nome}`);

  if (dados.receber === 'entrega') {
    const partes = [dados.endereco, dados.complemento, dados.bairro].filter(Boolean).join(', ');
    linhas.push(`Endereço: ${partes}, Fortaleza – CE${dados.cep ? `, CEP ${dados.cep}` : ''}`);
    if (dados.referencia) linhas.push(`Ponto de referência: ${dados.referencia}`);
  } else if (dados.receber === 'retirada') {
    linhas.push(`Retirada: ${CONFIG.enderecos.retirada.completo}`);
  } else {
    const partes = [dados.endereco, dados.complemento, dados.bairro, dados.cidade].filter(Boolean).join(', ');
    linhas.push(`Envio para: ${partes}, CEP ${dados.cep}`);
  }

  const pagamento = FORMAS[dados.receber]?.pagamentos.find(([valor]) => valor === dados.pagamento)?.[1] ?? '';
  const troco = dados.pagamento === 'dinheiro' && dados.troco ? `, troco para ${dados.troco}` : '';
  linhas.push(`Pagamento: ${pagamento}${troco}`);
  if (dados.observacao) linhas.push(`Observação: ${dados.observacao}`);
  linhas.push('(pelo site)');
  return linhas.join('\n');
}
