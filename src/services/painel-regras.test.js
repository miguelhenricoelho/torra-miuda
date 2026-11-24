import { test } from 'node:test';
import assert from 'node:assert/strict';
import { podeMudar, acoesPermitidas, somarTorra, nomeDoStatus, formatarPeso } from './painel-regras.js';

test('regras de status batem com as do banco (pode_mudar)', () => {
  assert.equal(podeMudar('atendimento', 'novo', 'confirmado'), true);
  assert.equal(podeMudar('atendimento', 'novo', 'entregue'), false);
  assert.equal(podeMudar('expedicao', 'torrado', 'embalado'), true);
  assert.equal(podeMudar('expedicao', 'a_caminho', 'cancelado'), false);
  assert.equal(podeMudar('dona', 'entregue', 'novo'), true);
  assert.equal(podeMudar(null, 'novo', 'confirmado'), false);
});

test('botões do detalhe só oferecem o que o papel pode', () => {
  assert.deepEqual(acoesPermitidas('atendimento', { status: 'novo' }), ['confirmado', 'cancelado']);
  assert.deepEqual(acoesPermitidas('expedicao', { status: 'embalado' }), ['a_caminho']);
  assert.deepEqual(acoesPermitidas('expedicao', { status: 'entregue' }), []);
  assert.deepEqual(acoesPermitidas('dona', { status: 'torrado' }), ['embalado', 'confirmado', 'cancelado']);
});

test('soma da torra conta só pedidos confirmados da data', () => {
  const itens = [{ tipo: 'cafe', cafe_id: 'lote-02', nome: 'Lote 02', peso: 250, qtd: 2 }, { tipo: 'kit', nome: 'Kit', qtd: 1 }];
  const pedidos = [
    { data_torra: '2026-11-24', status: 'confirmado', itens },
    { data_torra: '2026-11-24', status: 'novo', itens },
    { data_torra: '2026-11-27', status: 'confirmado', itens },
  ];
  assert.deepEqual(somarTorra(pedidos, '2026-11-24'), [{ cafe_id: 'lote-02', nome: 'Lote 02', gramas: 500, pacotes_250: 2, pacotes_1000: 0 }]);
});

test('nomes mudam com o jeito de receber', () => {
  assert.equal(nomeDoStatus('a_caminho', 'retirada'), 'Pronto para retirar');
  assert.equal(nomeDoStatus('entregue', 'retirada'), 'Retirado');
  assert.equal(formatarPeso(1500), '1,5 kg');
  assert.equal(formatarPeso(500), '500 g');
});
