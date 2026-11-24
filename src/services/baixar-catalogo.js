// Roda antes do build: baixa do Supabase o catálogo publicado, os dias sem torra e os valores,
// e grava em src/dados/catalogo.json. Usa só a chave pública: lê o mesmo que qualquer visitante.
// Sem as variáveis do Supabase, grava o arquivo padrão (dados de exemplo).
import { writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const destino = new URL('../dados/catalogo.json', import.meta.url);
const url = process.env.PUBLIC_SUPABASE_URL;
const chave = process.env.PUBLIC_SUPABASE_ANON_KEY;

const gravar = (dados) => writeFileSync(destino, `${JSON.stringify(dados, null, 2)}\n`);

if (!url || !chave) {
  gravar({ origem: 'exemplo', lotes: null, sitios: null, feriados: null, config: null });
  console.log('Catálogo: sem Supabase configurado, usando os dados de exemplo.');
  process.exit(0);
}

const supabase = createClient(url, chave);
const ler = async (consulta) => {
  const { data, error } = await consulta;
  if (error) throw new Error(error.message);
  return data;
};

try {
  const [cafes, sitios, dias, config] = await Promise.all([
    ler(supabase.from('cafes').select('*').neq('estado', 'oculto').order('ordem')),
    ler(supabase.from('sitios').select('*').eq('publicado', true).order('numero')),
    ler(supabase.from('dias_fechados').select('data')),
    ler(supabase.from('configuracoes').select('*').eq('id', 1).single()),
  ]);
  gravar({
    origem: 'supabase',
    lotes: cafes.map((cafe) => ({
      id: cafe.id, slug: cafe.slug, numero: cafe.numero, nome: cafe.nome, sitio: cafe.sitio, perfil: cafe.perfil,
      leite: cafe.leite, espresso: cafe.espresso, ponto: Number(cafe.ponto), pontoNome: cafe.ponto_nome,
      simples: cafe.descricao,
      precos: { 250: Number(cafe.preco_250), ...(cafe.preco_1000 ? { 1000: Number(cafe.preco_1000) } : {}) },
      estado: cafe.estado,
    })),
    sitios: sitios.map(({ numero, nome, produtor, altitude, x, y }) => ({ numero, nome, produtor, altitude, x, y })),
    feriados: dias.map((dia) => dia.data),
    config: {
      taxaEntrega: Number(config.taxa_entrega), assinatura: Number(config.preco_assinatura), kit: Number(config.preco_kit),
      visita: { data: config.visita_data, vagas: config.visita_vagas, inscritos: config.visita_inscritos },
    },
  });
  console.log(`Catálogo: ${cafes.length} cafés e ${sitios.length} sítios baixados do Supabase.`);
} catch (falha) {
  // Sem o banco, o build para: melhor não publicar do que publicar preço errado
  console.error(`Catálogo: não deu para ler o Supabase (${falha.message}).`);
  process.exit(1);
}
