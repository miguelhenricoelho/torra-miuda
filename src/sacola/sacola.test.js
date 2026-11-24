import { test } from 'node:test';
import assert from 'node:assert/strict';
import { montarMensagemPedido, camposFaltando, textosDoTotal } from './sacola.js';

const torra = { texto: 'terça, 24/11', textoEntrega: 'quarta, 25/11' };
const itens = [
  { tipo: 'cafe', id: 'lote-02', peso: 250, moagem: 'coado', qtd: 1 },
  { tipo: 'kit', id: 'kit', qtd: 1 },
];
const dadosEntrega = {
  nome: 'Carla', receber: 'entrega', endereco: 'Rua Exemplo, 45', complemento: 'apto 302', bairro: 'Meireles',
  cep: '60165-000', referencia: 'em frente à padaria', pagamento: 'pix-entrega', observacao: 'é presente para minha mãe',
};

test('mensagem de entrega leva todos os campos, na ordem do DNA', () => {
  const msg = montarMensagemPedido({ itens, dados: dadosEntrega, torra, atendimento: { aberto: true }, codigo: 'TM-0142' });
  assert.equal(
    msg,
    [
      'Oi, Torra Miúda! Quero fazer o pedido TM-0142, montado no site:',
      '',
      '1x Lote 02, 250 g, moído para coado: R$ 54,00',
      '1x Kit de presente, três cafés da colheita, escolhidos pela Iara: R$ 129,00',
      '',
      'Subtotal: R$ 183,00',
      'Entrega em Fortaleza: R$ 12,00',
      'Total: R$ 195,00',
      'Torra: terça, 24/11',
      'Entrega: quarta, 25/11',
      '',
      'Nome: Carla',
      'Endereço: Rua Exemplo, 45, apto 302, Meireles, Fortaleza – CE, CEP 60165-000',
      'Ponto de referência: em frente à padaria',
      'Pagamento: Pix na entrega',
      'Observação: é presente para minha mãe',
      '(pelo site)',
    ].join('\n').replace(/R\$ /g, 'R$\u00a0'),
  );
});

test('Correios: total nunca parece final', () => {
  const msg = montarMensagemPedido({
    itens, torra, atendimento: { aberto: true },
    dados: { nome: 'Ana', receber: 'correios', endereco: 'Rua A, 1', bairro: 'Boa Viagem', cidade: 'Recife – PE', cep: '51000-000', pagamento: 'pix' },
  });
  assert.match(msg, /Total: R\$\s183,00 \+ frete/);
  assert.match(msg, /frete a combinar aqui/);
  assert.doesNotMatch(msg, /Entrega: quarta/);
});

test('item sem preço aparece como a confirmar no total', () => {
  const comSemPreco = [...itens, { tipo: 'cafe', id: 'lote-sumiu', peso: 250, moagem: 'grao', qtd: 1 }];
  assert.match(textosDoTotal(comSemPreco, 'retirada').total, /\+ 1 item a confirmar/);
});

test('retirada com dinheiro leva o troco; fora do horário muda a abertura', () => {
  const msg = montarMensagemPedido({
    itens, torra, atendimento: { aberto: false, reabre: 'de segunda' },
    dados: { nome: 'Rui', receber: 'retirada', pagamento: 'dinheiro', troco: 'R$ 200' },
  });
  assert.match(msg, /^Oi! Deixando um pedido para quando vocês abrirem/);
  assert.match(msg, /Pagamento: Dinheiro na retirada, troco para R\$ 200/);
});

test('campos obrigatórios por forma de receber', () => {
  assert.deepEqual(camposFaltando({}), ['seu nome', 'como você quer receber']);
  assert.deepEqual(camposFaltando({ nome: 'a', receber: 'entrega' }), ['o endereço com bairro', 'a forma de pagamento']);
  assert.deepEqual(camposFaltando({ nome: 'a', receber: 'retirada', pagamento: 'pix-retirada' }), []);
});
