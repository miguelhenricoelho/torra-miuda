// Configuração fixa do negócio. Na parte 2, o que a equipe edita (feriados, campanha,
// visita, avaliações) passa a vir do painel; o que não muda continua aqui.

import gerado from './catalogo.json' with { type: 'json' };

// Valores que a equipe edita no painel chegam pelo catalogo.json (gerado no build)
const doPainel = gerado.config ?? {};

export const CONFIG = {
  site: 'https://torramiuda.com.br',
  nome: 'Torra Miúda Cafés Especiais',
  razaoSocial: 'Torra Miúda Cafés Ltda.',
  cnpj: '00.000.000/0001-00',
  whatsapp: '5585900005555',
  whatsappExibicao: '(85) 90000-5555',
  telefone: '+55-85-90000-5555',
  email: 'contato@torramiuda.fake',
  instagram: 'https://www.instagram.com/torramiuda.fake',
  instagramUsuario: '@torramiuda.fake',
  tiktok: 'https://www.tiktok.com/@torramiuda.fake',
  tiktokUsuario: '@torramiuda.fake',
  taxaEntrega: doPainel.taxaEntrega ?? 12,
  assinatura: doPainel.assinatura ?? 59,
  kit: doPainel.kit ?? 129,
  // Torra: terça (2) e sexta (5). Corte: domingo 18h para terça; quarta 18h para sexta.
  diasDeTorra: [
    { dia: 2, corteDiasAntes: 2, corteHora: 18 },
    { dia: 5, corteDiasAntes: 2, corteHora: 18 },
  ],
  // Em feriado não tem torra: passa para o dia seguinte. Editável no painel (parte 2).
  feriados: gerado.feriados ?? ['2026-11-20', '2026-12-25', '2027-01-01', '2027-03-26', '2027-04-21', '2027-05-01'],
  atendimento: { dias: [1, 2, 3, 4, 5, 6], abre: 8, fecha: 18 },
  retirada: { dias: [2, 3, 4, 5, 6], abre: 10, fecha: 18 },
  enderecos: {
    torrefacao: { rua: 'Rua Exemplo, 310', bairro: '', cidade: 'Guaramiranga', uf: 'CE', completo: 'Rua Exemplo, 310, Guaramiranga – CE' },
    retirada: { rua: 'Rua Exemplo, 1200', bairro: 'Aldeota', cidade: 'Fortaleza', uf: 'CE', completo: 'Rua Exemplo, 1200, Aldeota, Fortaleza – CE' },
  },
  google: { nota: '4,9', avaliacoes: 214, perfil: null },
  // Visita guiada mensal: a data vem do painel (parte 2). null = sem data marcada.
  visita: doPainel.visita ?? { data: null, vagas: null },
  // Campanha (Dia das Mães, Natal): vem do painel (parte 2). null = sem campanha.
  campanha: null,
};

export const MOAGENS = [
  { id: 'grao', nome: 'Em grão', curto: 'Em grão', mensagem: 'em grão' },
  { id: 'coado', nome: 'Para coado', curto: 'Para coado', mensagem: 'moído para coado' },
  { id: 'prensa', nome: 'Para prensa francesa', curto: 'Para prensa', mensagem: 'moído para prensa francesa' },
  { id: 'moka', nome: 'Para moka', curto: 'Para moka', mensagem: 'moído para moka' },
  { id: 'espresso', nome: 'Para espresso', curto: 'Para espresso', mensagem: 'moído para espresso' },
];

export const PERFIS = ['suave', 'equilibrado', 'encorpado'];
export const NOME_PERFIL = { suave: 'Suave', equilibrado: 'Equilibrado', encorpado: 'Encorpado' };

export const KIT = {
  id: 'kit',
  nome: 'Kit de presente',
  detalhe: 'três cafés da colheita, escolhidos pela Iara',
  preco: CONFIG.kit,
};

export function moagemDoId(id) {
  return MOAGENS.find((moagem) => moagem.id === id) ?? MOAGENS[1];
}

// Algarismos sempre na fonte de texto (os da Alegreya são de estilo antigo)
export function separarNumeros(texto) {
  return String(texto)
    .split(/(\d+)/)
    .filter(Boolean)
    .map((parte) => ({ numero: /^\d+$/.test(parte), texto: parte }));
}

export function nomeHtml(texto) {
  return separarNumeros(texto)
    .map((parte) => (parte.numero ? `<span class="numero">${parte.texto}</span>` : parte.texto))
    .join('');
}
