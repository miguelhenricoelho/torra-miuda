// Acesso ao catálogo. Lê src/dados/catalogo.json, que o build gera a partir do Supabase
// (services/baixar-catalogo.js). Sem Supabase configurado, usa os dados de exemplo.
import { LOTES_EXEMPLO, SITIOS_EXEMPLO, PICOS_EXEMPLO } from '../dados/exemplo.js';
import gerado from '../dados/catalogo.json' with { type: 'json' };

const LOTES = gerado.lotes ?? LOTES_EXEMPLO;
const SITIOS = gerado.sitios ?? SITIOS_EXEMPLO;

export const CATALOGO_DE_EXEMPLO = gerado.origem !== 'supabase';

export function listarLotes() {
  return LOTES;
}

export function loteDoSlug(slug) {
  return LOTES.find((lote) => lote.slug === slug) ?? null;
}

export function loteDoId(id) {
  return LOTES.find((lote) => lote.id === id) ?? null;
}

export function listarSitios() {
  return SITIOS;
}

export function picosDoMapa() {
  return PICOS_EXEMPLO;
}

export function sitioDoLote(lote) {
  return SITIOS.find((sitio) => sitio.numero === lote.sitio) ?? null;
}

export function lotesDoSitio(numero) {
  return LOTES.filter((lote) => lote.sitio === numero && lote.estado === 'disponivel');
}
