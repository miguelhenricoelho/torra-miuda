import { test } from 'node:test';
import assert from 'node:assert/strict';
import { proximaTorra, atendimento, diaDaEntrega } from './proxima-torra.js';

const em = (iso) => new Date(`${iso}:00Z`);

test('pedido até domingo 18h entra na terça', () => {
  const t = proximaTorra(em('2026-11-22T17:59'));
  assert.equal(t.texto, 'terça, 24/11');
  assert.equal(t.textoEntrega, 'quarta, 25/11');
});

test('depois de domingo 18h vai para sexta', () => {
  assert.equal(proximaTorra(em('2026-11-22T18:01')).texto, 'sexta, 27/11');
});

test('até quarta 18h entra na sexta; entrega no sábado', () => {
  const t = proximaTorra(em('2026-11-25T18:00'));
  assert.equal(t.texto, 'sexta, 27/11');
  assert.equal(t.textoEntrega, 'sábado, 28/11');
});

test('sexta feriado (20/11): torra no sábado e entrega na segunda (domingo pula)', () => {
  const t = proximaTorra(em('2026-11-17T14:30'));
  assert.equal(t.texto, 'sábado, 21/11');
  assert.equal(t.deslocada, true);
  assert.equal(t.textoEntrega, 'segunda, 23/11');
  assert.match(t.aviso, /sexta passou para sábado/);
});

test('Natal numa sexta (25/12/2026): torra no sábado 26/12, entrega segunda 28/12', () => {
  const t = proximaTorra(em('2026-12-23T10:00'));
  assert.equal(t.texto, 'sábado, 26/12');
  assert.equal(t.textoEntrega, 'segunda, 28/12');
});

test('entrega nunca cai no domingo', () => {
  for (let d = 0; d < 7; d += 1) {
    const torra = new Date(Date.UTC(2026, 10, 15 + d));
    assert.notEqual(diaDaEntrega(torra).getUTCDay(), 0);
  }
});

test('atendimento: seg a sáb, 8h às 18h', () => {
  assert.equal(atendimento(em('2026-11-17T14:30')).aberto, true);
  assert.deepEqual(atendimento(em('2026-11-17T19:00')), { aberto: false, reabre: 'de quarta' });
  assert.deepEqual(atendimento(em('2026-11-21T19:00')), { aberto: false, reabre: 'de segunda' });
  assert.deepEqual(atendimento(em('2026-11-18T07:00')), { aberto: false, reabre: 'de hoje' });
});
