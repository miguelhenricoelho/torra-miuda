// DADOS DE EXEMPLO, identificados como tal no site (selo "Exemplo").
// Na parte 2 são substituídos pelos lotes e sítios que a Iara cadastra no painel.

export const LOTES_EXEMPLO = [
  {
    id: 'lote-01',
    slug: 'lote-01',
    numero: '01',
    nome: 'Lote 01',
    sitio: 1,
    perfil: 'suave',
    leite: false,
    espresso: false,
    ponto: 0.4,
    pontoNome: 'clara para média',
    simples: 'Leve e adocicado, com um final limpo. Brilha quando tomado puro.',
    precos: { 250: 48, 1000: 170 },
    estado: 'disponivel',
  },
  {
    id: 'lote-02',
    slug: 'lote-02',
    numero: '02',
    nome: 'Lote 02',
    sitio: 2,
    perfil: 'equilibrado',
    leite: true,
    espresso: true,
    ponto: 0.55,
    pontoNome: 'média',
    simples: 'Corpo médio e final que lembra chocolate. Vai bem puro e também com leite.',
    precos: { 250: 54, 1000: 190 },
    estado: 'disponivel',
  },
  {
    id: 'lote-03',
    slug: 'lote-03',
    numero: '03',
    nome: 'Lote 03',
    sitio: 3,
    perfil: 'encorpado',
    leite: true,
    espresso: true,
    ponto: 0.68,
    pontoNome: 'média para escura',
    simples: 'Encorpado e redondo. Segura o leite e vai bem no espresso.',
    precos: { 250: 58, 1000: 205 },
    estado: 'disponivel',
  },
  {
    id: 'lote-04',
    slug: 'lote-04',
    numero: '04',
    nome: 'Lote 04',
    sitio: 4,
    perfil: 'suave',
    leite: false,
    espresso: false,
    ponto: 0.32,
    pontoNome: 'clara',
    simples: 'Delicado e perfumado. Para quem gosta de café claro, sem pressa.',
    precos: { 250: 68, 1000: 230 },
    estado: 'esgotado',
  },
];

// Posições ilustrativas no mapa (viewBox 760 × 560). A Iara confirma onde fica cada sítio.
export const SITIOS_EXEMPLO = [1, 2, 3, 4, 5, 6].map((numero, indice) => ({
  numero,
  nome: `Sítio ${numero}`,
  produtor: null,
  altitude: null,
  x: [140, 300, 400, 600, 470, 660][indice],
  y: [170, 330, 110, 230, 470, 470][indice],
}));

export const PICOS_EXEMPLO = [
  { x: 200, y: 250 },
  { x: 470, y: 170 },
  { x: 560, y: 410 },
];
