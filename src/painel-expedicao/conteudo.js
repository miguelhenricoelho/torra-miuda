import { CONFIG } from '../dados/dados.js';

export const TEXTOS_EXPEDICAO = {
  grupos: {
    entrega: 'Entregar em Fortaleza',
    retirada: 'Retirada na Aldeota',
    correios: 'Enviar pelos Correios',
  },
  vazioTitulo: 'Nada para embalar nesta torra.',
  vazioTexto: 'Os pedidos aparecem aqui depois que a torra é marcada como feita.',
  erro: 'Não deu para carregar a lista.',
  tentar: 'Tentar de novo',
  mapa: 'Abrir no mapa',
  avisar: 'Avisar',
  referencia: 'Referência',
  observacao: 'Observação',
  pronto: 'Tudo certo com este pedido.',
};

// Mensagens que a equipe manda para o cliente quando o pedido sai
export function mensagemDeSaida(pedido) {
  const nome = pedido.nome.split(' ')[0];
  if (pedido.receber === 'retirada') {
    return `Oi, ${nome}! Seu café da Torra Miúda (pedido ${pedido.codigo}) está pronto para retirar na ${CONFIG.enderecos.retirada.completo}, de terça a sábado, das 10h às 18h.`;
  }
  if (pedido.receber === 'correios') {
    return `Oi, ${nome}! Seu café da Torra Miúda (pedido ${pedido.codigo}) foi postado nos Correios. Assim que eu tiver o código de rastreio, mando aqui.`;
  }
  return `Oi, ${nome}! Seu café da Torra Miúda (pedido ${pedido.codigo}) saiu para entrega agora.`;
}
