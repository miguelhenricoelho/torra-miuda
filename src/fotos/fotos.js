// Fotos reais (Pexels, licença livre para uso comercial), em WebP de 720 e 1280 px.
// Ficam no próprio site (public/fotos), sem depender da Pexels no ar.
// "posicao" é o ponto da foto que não pode ser cortado quando a moldura muda de formato.
// Quando a Torra mandar as fotos dela, troque só o arquivo e o alt: as páginas não mudam.

const foto = (nome, alt, posicao = '50% 50%') => ({
  src: `/fotos/${nome}-1280.webp`,
  srcset: `/fotos/${nome}-720.webp 720w, /fotos/${nome}-1280.webp 1280w`,
  alt,
  posicao,
});

export const FOTOS = {
  hero: foto('hero', 'Grãos recém-torrados saindo de uma torradeira antiga de ferro, ainda soltando fumaça', '58% 62%'),
  torra: foto('torra', 'Grãos torrados girando no tambor de resfriamento da torradeira', '62% 55%'),
  peDeCafe: foto('pe-de-cafe', 'Galho de café com frutos verdes, laranja e vermelhos, cada um num ponto de maturação', '50% 45%'),
  colheita: foto('colheita', 'Mão colhendo frutos maduros de café direto do pé', '62% 35%'),
  graoVerde: foto('grao-verde', 'Pá de metal despejando café verde, ainda cru, num saco de juta', '55% 50%'),
  coador: foto('coador', 'Café passado no coador de pano, com uma xícara cheia ao lado', '62% 45%'),
  serra: foto('serra', 'Morros verdes cobertos de neblina, numa manhã na serra', '50% 60%'),
};

// Grão de cada lote. Lote novo cadastrado no painel reaproveita a lista em ordem, então nunca fica sem foto.
const FOTOS_LOTES = [
  foto('lote-01', 'Grãos de torra média-clara numa tigela de louça branca', '50% 60%'),
  foto('lote-02', 'Pá de metal cheia de grãos torrados, sobre mais café torrado', '50% 55%'),
  foto('lote-03', 'Grãos de torra mais escura espalhados sobre um fundo preto', '50% 78%'),
  foto('torra', 'Grãos torrados girando no tambor de resfriamento da torradeira', '62% 55%'),
];
export function fotoDoLote(lote) {
  const indice = Math.max(0, (Number.parseInt(lote.numero, 10) || 1) - 1);
  return FOTOS_LOTES[indice % FOTOS_LOTES.length];
}

// Um retrato de lavoura para cada sítio (1 a 6), na mesma lógica de repetição
const FOTOS_SITIOS = [
  foto('sitio-1', 'Café secando em leitos suspensos, com a encosta verde ao fundo', '45% 50%'),
  foto('sitio-2', 'Rodo de madeira e metal sobre o café secando no terreiro', '55% 55%'),
  foto('sitio-3', 'Pé de café carregado de frutos maduros, entre folhas verdes', '55% 55%'),
  foto('sitio-4', 'Mão segurando um galho de café com frutos ainda verdes', '45% 55%'),
  foto('sitio-5', 'Frutos de café verdes e maduros num galho, com céu azul ao fundo', '50% 45%'),
  foto('sitio-6', 'Mãos colhendo frutos vermelhos de café, um a um', '60% 55%'),
];
export function fotoDoSitio(numero) {
  return FOTOS_SITIOS[(Math.max(1, Number(numero) || 1) - 1) % FOTOS_SITIOS.length];
}

// Quem faz: o trabalho de cada um, sem rosto (foto de banco nunca finge ser a pessoa)
export const FOTOS_EQUIPE = {
  Iara: foto('equipe-iara', 'Mão segurando grãos recém-torrados em frente à torradeira', '50% 62%'),
  Davi: foto('equipe-davi', 'Mão de luva despejando café moído no pacote de papel', '45% 40%'),
  Bia: foto('equipe-bia', 'Mãos digitando no celular, com um copo de café ao lado', '62% 55%'),
};

export const CREDITO_FOTOS = { texto: 'Fotos: Pexels', href: 'https://www.pexels.com' };
