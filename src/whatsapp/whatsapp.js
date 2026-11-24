import { CONFIG } from '../dados/dados.js';

const ASSINATURA_SITE = '(pelo site)';

export function linkWhatsapp(mensagem) {
  const texto = mensagem.trimEnd().endsWith(ASSINATURA_SITE) ? mensagem : `${mensagem} ${ASSINATURA_SITE}`;
  return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(texto)}`;
}

// Cada ponto da lista fechada (Base, 2.3) tem a sua mensagem
export const MENSAGENS = {
  duvidaGeral: () => 'Oi, Torra Miúda! Tenho uma dúvida.',
  ajudaEscolher: () => 'Oi! Estou no site e queria ajuda para escolher meu café.',
  ajudaNoCafe: (nome) => `Oi! Estou no site, na página do ${nome}, e queria ajuda para escolher.`,
  duvidaCafe: (nome) => `Oi! Vi o café ${nome} no site e queria tirar uma dúvida sobre ele.`,
  avisarVolta: (nome) => `Oi! Quero saber quando o café ${nome} volta.`,
  duvidaKit: () => 'Oi! Vi o kit de presente no site e queria saber mais sobre os cafés que vão nele.',
  duvidaAssinatura: () => `Oi! Quero entender melhor a assinatura de R$ ${CONFIG.assinatura} antes de assinar.`,
  agendarVisita: () => 'Oi! Queria agendar uma visita à torrefação em Guaramiranga.',
  visitaGuiada: (data, pessoas) => `Oi! Quero participar da visita guiada à torrefação do dia ${data}, para ${pessoas} ${pessoas === 1 ? 'pessoa' : 'pessoas'}.`,
  avisarVisita: () => 'Oi! Quero ser avisado da próxima visita guiada à torrefação.',
  cafeteria: (nome, lugar) => {
    const qual = nome ? `a cafeteria ${nome}` : 'uma cafeteria';
    const onde = lugar ? `, em ${lugar},` : '';
    return `Oi! Tenho ${qual}${onde} e queria conhecer os cafés da Torra Miúda para servir lá.`;
  },
};
