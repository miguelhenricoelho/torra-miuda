import { CONFIG, moagemDoId } from '../dados/dados.js';

export const PAGAMENTOS_ASSINATURA = ['Pix na entrega', 'Cartão por link no WhatsApp'];

export function faltandoAssinatura(dados) {
  const lista = [];
  if (!dados.nome) lista.push('seu nome');
  if (!dados.endereco) lista.push('o endereço');
  if (dados.receber === 'correios' && !dados.cep) lista.push('o CEP');
  return lista;
}

export function montarMensagemAssinatura(dados) {
  const moagem = moagemDoId(dados.moagem).mensagem;
  const recebimento =
    dados.receber === 'correios'
      ? `envio pelos Correios para ${dados.endereco}, CEP ${dados.cep} (frete a combinar aqui)`
      : `entrega em Fortaleza, ${dados.endereco}`;
  return [
    'Oi! Quero assinar a Torra Miúda:',
    '',
    `Um café diferente por mês, 250 g, ${moagem}: R$ ${CONFIG.assinatura} por mês`,
    `Recebimento: ${recebimento}`,
    `Pagamento: ${dados.pagamento}`,
    `Nome: ${dados.nome}`,
    '(pelo site)',
  ].join('\n');
}
