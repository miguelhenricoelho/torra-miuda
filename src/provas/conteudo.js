import { CONFIG } from '../dados/dados.js';

export const TITULO = 'Sete anos de torra miúda';
export const NUMEROS = [
  { valor: '18 mil', rotulo: 'pacotes vendidos' },
  { valor: '2.800', rotulo: 'torras desde 2019' },
  { valor: '87', rotulo: 'pontos SCA, um lote de 2025' },
  { valor: CONFIG.google.nota, rotulo: `no Google, com ${CONFIG.google.avaliacoes} avaliações` },
];
// Prints de clientes com autorização: sem nome, número nem foto de quem escreveu
export const FALAS = [
  { texto: 'Nunca pensei que café do Ceará fosse assim.', origem: 'Cliente, por WhatsApp' },
  { texto: 'Ela me mandou o café torrado no dia anterior.', origem: 'Cliente, por WhatsApp' },
];
