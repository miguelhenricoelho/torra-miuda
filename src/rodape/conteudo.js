import { CONFIG } from '../dados/dados.js';

export const LUGARES = [
  {
    id: 'torrefacao',
    nome: 'Torrefação, em Guaramiranga',
    endereco: CONFIG.enderecos.torrefacao.completo,
    horario: 'Aberta para visita com agendamento. Uma vez por mês tem visita guiada com degustação.',
    wa: 'agendarVisita',
    rotuloWa: 'Agendar visita',
  },
  {
    id: 'retirada',
    nome: 'Ponto de retirada, na Aldeota',
    endereco: CONFIG.enderecos.retirada.completo,
    horario: 'Retirada de terça a sábado, das 10h às 18h.',
  },
];

export const LINKS_RODAPE = [
  { rotulo: 'Cafés', href: '/cafes' },
  { rotulo: 'Qual é o seu café?', href: '/qual-e-o-seu-cafe' },
  { rotulo: 'Kit de presente', href: '/kit-de-presente' },
  { rotulo: 'Assinatura', href: '/assinatura' },
  { rotulo: 'A serra', href: '/a-serra' },
  { rotulo: 'Nossa história', href: '/nossa-historia' },
  { rotulo: 'Visitar e retirar', href: '/visitar-e-retirar' },
  { rotulo: 'Para cafeterias', href: '/para-cafeterias' },
];

export const mapsBusca = (endereco) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
export const mapsRota = (endereco) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(endereco)}`;
export const mapsEmbed = (endereco) => `https://www.google.com/maps?q=${encodeURIComponent(endereco)}&output=embed`;
