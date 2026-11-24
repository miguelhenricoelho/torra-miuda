// Datas de torra perto de hoje (a última que já passou e as duas próximas), com feriados.
import { CONFIG } from '../dados/dados.js';
import { agoraEmBrasilia } from '../proxima-torra/proxima-torra.js';

const UM_DIA = 86_400_000;
export const iso = (data) => data.toISOString().slice(0, 10);

export function hojeIso(agora = agoraEmBrasilia()) {
  return iso(agora);
}

export function datasDeTorraPerto(hoje = hojeIso(), feriados = CONFIG.feriados) {
  const base = new Date(`${hoje}T00:00:00Z`).getTime();
  const datas = [];
  for (let d = -10; d <= 21; d += 1) {
    let data = new Date(base + d * UM_DIA);
    if (!CONFIG.diasDeTorra.some((regra) => regra.dia === data.getUTCDay())) continue;
    while (feriados.includes(iso(data))) data = new Date(data.getTime() + UM_DIA);
    datas.push(iso(data));
  }
  const unicas = [...new Set(datas)].sort();
  const passadas = unicas.filter((data) => data <= hoje);
  const futuras = unicas.filter((data) => data > hoje);
  return [...passadas.slice(-1), ...futuras.slice(0, 2)];
}

export function entregaDaTorra(dataTorra) {
  let entrega = new Date(new Date(`${dataTorra}T00:00:00Z`).getTime() + UM_DIA);
  if (entrega.getUTCDay() === 0) entrega = new Date(entrega.getTime() + UM_DIA);
  return iso(entrega);
}

export const primeiroDoMes = (hoje = hojeIso()) => `${hoje.slice(0, 7)}-01`;
