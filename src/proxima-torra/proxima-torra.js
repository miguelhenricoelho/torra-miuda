import { CONFIG } from '../dados/dados.js';

const DIAS_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const UM_DIA = 86_400_000;

const isoDoDia = (data) => data.toISOString().slice(0, 10);
const inicioDoDia = (data) => new Date(`${isoDoDia(data)}T00:00:00Z`);
const somarDias = (data, dias) => new Date(data.getTime() + dias * UM_DIA);

// "Agora" no fuso de Brasília, representado como data UTC sem fuso.
export function agoraEmBrasilia(dataReal = new Date()) {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(dataReal)
      .map((parte) => [parte.type, parte.value]),
  );
  return new Date(`${partes.year}-${partes.month}-${partes.day}T${partes.hour}:${partes.minute}:00Z`);
}

export function formatarDia(data) {
  const dia = String(data.getUTCDate()).padStart(2, '0');
  const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
  return `${DIAS_SEMANA[data.getUTCDay()]}, ${dia}/${mes}`;
}

export function nomeDoDia(data) {
  return DIAS_SEMANA[data.getUTCDay()];
}

// Entrega em Fortaleza: no dia seguinte à torra; se cair no domingo, fica para segunda.
export function diaDaEntrega(dataTorra) {
  let entrega = somarDias(dataTorra, 1);
  if (entrega.getUTCDay() === 0) entrega = somarDias(entrega, 1);
  return entrega;
}

// Próxima torra em que um pedido feito agora ainda entra.
export function proximaTorra(agora, { feriados = CONFIG.feriados } = {}) {
  const hoje = inicioDoDia(agora);
  for (let deslocamento = 0; deslocamento < 28; deslocamento += 1) {
    const dataBase = somarDias(hoje, deslocamento);
    const regra = CONFIG.diasDeTorra.find((item) => item.dia === dataBase.getUTCDay());
    if (!regra) continue;

    const corte = new Date(somarDias(dataBase, -regra.corteDiasAntes).getTime() + regra.corteHora * 3_600_000);
    if (agora > corte) continue;

    let dataTorra = dataBase;
    while (feriados.includes(isoDoDia(dataTorra))) dataTorra = somarDias(dataTorra, 1);
    const deslocada = dataTorra.getTime() !== dataBase.getTime();
    const entrega = diaDaEntrega(dataTorra);

    return {
      data: dataTorra,
      deslocada,
      texto: formatarDia(dataTorra),
      textoBase: formatarDia(dataBase),
      textoCorte: `${nomeDoDia(corte)}, ${regra.corteHora}h`,
      textoEntrega: formatarDia(entrega),
      aviso: deslocada
        ? `A torra de ${nomeDoDia(dataBase)} passou para ${nomeDoDia(dataTorra)} por causa do feriado.`
        : `Pedidos até ${nomeDoDia(corte)}, ${regra.corteHora}h, entram nesta torra.`,
    };
  }
  return null;
}

// Atendimento do WhatsApp: segunda a sábado, 8h às 18h.
export function atendimento(agora) {
  const { dias, abre, fecha } = CONFIG.atendimento;
  const hora = agora.getUTCHours();
  const dia = agora.getUTCDay();
  if (dias.includes(dia) && hora >= abre && hora < fecha) return { aberto: true };

  let proximo = somarDias(inicioDoDia(agora), hora < abre ? 0 : 1);
  while (!dias.includes(proximo.getUTCDay())) proximo = somarDias(proximo, 1);
  const ehHoje = isoDoDia(proximo) === isoDoDia(agora);
  return { aberto: false, reabre: ehHoje ? 'de hoje' : `de ${nomeDoDia(proximo)}` };
}

// ===== No navegador =====
// No dev, ?agora=2026-11-19T10:00 e ?estado=fechado forçam estados para teste.
export function agoraDaPagina() {
  if (import.meta.env?.DEV && typeof location !== 'undefined') {
    const forcado = new URLSearchParams(location.search).get('agora');
    if (forcado) return new Date(`${forcado}:00Z`);
  }
  return agoraEmBrasilia();
}

export function atendimentoDaPagina() {
  if (import.meta.env?.DEV && typeof location !== 'undefined') {
    const estado = new URLSearchParams(location.search).get('estado');
    if (estado === 'fechado') return { aberto: false, reabre: 'de segunda' };
    if (estado === 'aberto') return { aberto: true };
  }
  return atendimento(agoraDaPagina());
}

// Preenche [data-torra="texto|entrega|aviso"] e o status do atendimento
export function preencherTorra(raiz = document) {
  const torra = proximaTorra(agoraDaPagina());
  if (torra) {
    raiz.querySelectorAll('[data-torra]').forEach((elemento) => {
      const valor = torra[{ texto: 'texto', entrega: 'textoEntrega', aviso: 'aviso' }[elemento.dataset.torra]];
      if (valor) elemento.textContent = valor;
    });
    raiz.querySelectorAll('[data-torra-rotulo]').forEach((elemento) => {
      elemento.setAttribute('aria-label', `Próxima torra: ${torra.texto}`);
    });
  }
  const estado = atendimentoDaPagina();
  raiz.querySelectorAll('[data-atendimento]').forEach((elemento) => {
    elemento.textContent = estado.aberto ? 'WhatsApp respondendo agora' : `WhatsApp: respondemos a partir das 8h ${estado.reabre}`;
    elemento.dataset.aberto = String(estado.aberto);
  });
}
