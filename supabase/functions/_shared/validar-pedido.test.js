import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarPedido, pareceRobo } from './validar-pedido.js';

const base = {
  nome: 'Marta Lima', receber: 'entrega', pagamento: 'pix-entrega', endereco: 'Rua A, 10', bairro: 'Meireles',
  itens: [{ tipo: 'cafe', id: 'lote-02', peso: 250, moagem: 'coado', qtd: 2 }],
};

test('pedido de entrega válido passa, com cidade Fortaleza', () => {
  const r = validarPedido(base);
  assert.equal(r.ok, true);
  assert.equal(r.dados.cidade, 'Fortaleza');
});

test('preço enviado pelo navegador é descartado', () => {
  const r = validarPedido({ ...base, itens: [{ ...base.itens[0], preco: 1 }], total: 1 });
  assert.equal(r.ok, true);
  assert.equal('preco' in r.dados.itens[0], false);
  assert.equal('total' in r.dados, false);
});

test('recusa pagamento que não combina com o jeito de receber', () => {
  assert.equal(validarPedido({ ...base, pagamento: 'dinheiro' }).ok, false);
});

test('recusa entrega sem bairro e Correios sem CEP', () => {
  assert.equal(validarPedido({ ...base, bairro: '' }).ok, false);
  assert.equal(validarPedido({ ...base, receber: 'correios', pagamento: 'pix', cidade: 'Recife' }).ok, false);
});

test('recusa quantidade absurda, peso inventado e pedido vazio', () => {
  assert.equal(validarPedido({ ...base, itens: [{ ...base.itens[0], qtd: 500 }] }).ok, false);
  assert.equal(validarPedido({ ...base, itens: [{ ...base.itens[0], peso: 5 }] }).ok, false);
  assert.equal(validarPedido({ ...base, itens: [] }).ok, false);
});

test('retirada apaga endereço que tenha sobrado no formulário', () => {
  const r = validarPedido({ ...base, receber: 'retirada', pagamento: 'pix-retirada' });
  assert.equal(r.dados.endereco, null);
});

test('anti-robô: campo escondido preenchido ou envio rápido demais', () => {
  assert.equal(pareceRobo({ site: 'x', abertoEm: 0 }, 10_000), true);
  assert.equal(pareceRobo({ site: '', abertoEm: 9_000 }, 10_000), true);
  assert.equal(pareceRobo({ site: '', abertoEm: 1_000 }, 10_000), false);
});
