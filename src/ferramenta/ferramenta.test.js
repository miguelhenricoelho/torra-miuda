import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recomendar, textoDoResultado, METODOS, PERGUNTAS } from './ferramenta.js';
import { LOTES_EXEMPLO } from '../dados/exemplo.js';

const combinacoes = [];
for (const metodo of METODOS.map((m) => m.valor))
  for (const perfil of PERGUNTAS.perfil.opcoes.map((o) => o.valor))
    for (const leite of PERGUNTAS.leite.opcoes.map((o) => o.valor))
      for (const xicaras of PERGUNTAS.xicaras.opcoes.map((o) => o.valor))
        combinacoes.push({ para: 'mim', metodo, perfil, leite, xicaras });

test(`todas as ${combinacoes.length} combinações: o indicado nunca contradiz as respostas`, () => {
  assert.equal(combinacoes.length, 6 * 3 * 3 * 3);
  for (const respostas of combinacoes) {
    const resultado = recomendar(respostas, LOTES_EXEMPLO);
    const textos = textoDoResultado(resultado, respostas);
    const [indicado] = resultado.lotes;
    const id = JSON.stringify(respostas);
    assert.ok(indicado, id);
    assert.equal(indicado.estado, 'disponivel', `esgotado indicado: ${id}`);
    if (resultado.tipo !== 'nenhum') {
      if (respostas.leite !== 'puro') assert.ok(indicado.leite, `indicou café "melhor puro" para quem toma com leite: ${id}`);
      if (respostas.metodo === 'espresso') assert.ok(indicado.espresso, `indicou café fora do espresso: ${id}`);
    }
    if (resultado.tipo === 'combina') assert.equal(indicado.perfil, respostas.perfil, id);
    else assert.ok(textos.aviso, `sem aviso quando nada combina: ${id}`);
    if (respostas.leite !== 'puro') assert.doesNotMatch(textos.explicacao, /puro\.$|Brilha quando tomado puro/, `explicação contradiz: ${id}`);
  }
});

test('suave + com leite: diz que nada junta tudo e mostra a alternativa', () => {
  const respostas = { para: 'mim', metodo: 'coado', perfil: 'suave', leite: 'leite', xicaras: 'poucas' };
  const resultado = recomendar(respostas, LOTES_EXEMPLO);
  assert.equal(resultado.tipo, 'alternativa');
  assert.equal(resultado.lotes[0].nome, 'Lote 02');
  assert.equal(
    textoDoResultado(resultado, respostas).aviso,
    'Nenhum café desta colheita junta tudo o que você pediu. Para tomar com leite, o Lote 02 fica melhor; o Lote 01 é suave, mas brilha puro.',
  );
});

test('suave + puro + coador: Lote 01 combina', () => {
  const r = recomendar({ para: 'mim', metodo: 'coado', perfil: 'suave', leite: 'puro', xicaras: 'medio' }, LOTES_EXEMPLO);
  assert.equal(r.tipo, 'combina');
  assert.equal(r.lotes[0].nome, 'Lote 01');
  assert.equal(r.peso, 1000);
});

test('suave + espresso: indica um café de espresso e avisa', () => {
  const respostas = { para: 'mim', metodo: 'espresso', perfil: 'suave', leite: 'puro', xicaras: 'poucas' };
  const r = recomendar(respostas, LOTES_EXEMPLO);
  assert.equal(r.tipo, 'alternativa');
  assert.ok(r.lotes[0].espresso);
  assert.match(textoDoResultado(r, respostas).aviso, /Para a máquina de espresso, o Lote 02 fica melhor; o Lote 01 é suave, mas não é o mais indicado para espresso\./);
});

test('nunca indica lote esgotado, mesmo quando é o único do perfil', () => {
  const soEsgotado = LOTES_EXEMPLO.map((l) => (l.perfil === 'suave' ? { ...l, estado: 'esgotado' } : l));
  const respostas = { para: 'mim', metodo: 'coado', perfil: 'suave', leite: 'puro', xicaras: 'poucas' };
  const r = recomendar(respostas, soEsgotado);
  assert.notEqual(r.lotes[0].perfil, 'suave');
  assert.ok(textoDoResultado(r, respostas).aviso);
});
