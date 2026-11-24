// Depois do build: conta as etiquetas [REVISAR COM O CLIENTE] que ainda existem nas páginas.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function arquivosHtml(pasta) {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) return arquivosHtml(caminho);
    return nome.endsWith('.html') ? [caminho] : [];
  });
}

const porPagina = arquivosHtml('dist')
  .map((arquivo) => [arquivo.replace(/^dist/, ''), (readFileSync(arquivo, 'utf8').match(/<[^>]+\sdata-revisar[\s>=]/g) ?? []).length])
  .filter(([, total]) => total > 0);
const total = porPagina.reduce((soma, [, n]) => soma + n, 0);
console.log(`\n[REVISAR COM O CLIENTE] ${total} trecho(s) ainda marcados:`);
porPagina.forEach(([pagina, n]) => console.log(`  ${pagina}: ${n}`));
