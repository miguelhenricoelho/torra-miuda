// Curvas de nível da serra: o grafismo da marca.
// Geradas de forma determinística (mesma semente, mesmo desenho) para não pesar em imagem.
// Os anéis de cada morro compartilham a mesma "forma" e crescem juntos: nunca se cruzam.

function gerador(semente) {
  let estado = semente;
  return () => {
    estado = (estado * 1664525 + 1013904223) % 4294967296;
    return estado / 4294967296;
  };
}

function caminhoFechado(cx, cy, raio, fases, amplitude, achatamento, pontos = 12) {
  const coordenadas = Array.from({ length: pontos }, (_, indice) => {
    const angulo = (indice / pontos) * Math.PI * 2;
    const variacao =
      1 +
      amplitude *
        (0.55 * Math.sin(angulo * 2 + fases[0]) + 0.3 * Math.sin(angulo * 3 + fases[1]) + 0.15 * Math.sin(angulo * 4 + fases[2]));
    return [cx + Math.cos(angulo) * raio * variacao * achatamento, cy + Math.sin(angulo) * raio * variacao];
  });
  let d = `M${coordenadas[0][0].toFixed(0)},${coordenadas[0][1].toFixed(0)}`;
  for (let i = 0; i < pontos; i += 1) {
    const p0 = coordenadas[(i - 1 + pontos) % pontos];
    const p1 = coordenadas[i];
    const p2 = coordenadas[(i + 1) % pontos];
    const p3 = coordenadas[(i + 2) % pontos];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(0)},${c1[1].toFixed(0)} ${c2[0].toFixed(0)},${c2[1].toFixed(0)} ${p2[0].toFixed(0)},${p2[1].toFixed(0)}`;
  }
  return `${d}Z`;
}

export function curvasDaSerra({ largura = 800, altura = 600, semente = 7, morros = 2, aneis = 7, picos = null } = {}) {
  const aleatorio = gerador(semente);
  // Picos espalhados em faixas horizontais, para os morros não se sobreporem
  const centros = picos ?? Array.from({ length: morros }, (_, m) => ({
    x: largura * ((m + 0.5) / morros + (aleatorio() - 0.5) * (0.4 / morros)),
    y: altura * (0.35 + aleatorio() * 0.35),
  }));
  const caminhos = [];
  centros.forEach((centro, m) => {
    const vizinhos = centros.filter((_, outro) => outro !== m);
    const distancia = vizinhos.length
      ? Math.min(...vizinhos.map((v) => Math.hypot(v.x - centro.x, (v.y - centro.y) * 1.4)))
      : Math.max(largura, altura);
    const raioMax = Math.min(distancia * 0.4, Math.max(largura, altura) * 0.62);
    const fases = Array.from({ length: 3 }, () => aleatorio() * Math.PI * 2);
    const achatamento = 1.15 + aleatorio() * 0.35;
    for (let a = 1; a <= aneis; a += 1) {
      const proporcao = a / aneis;
      caminhos.push(caminhoFechado(centro.x, centro.y, raioMax * proporcao, fases, 0.1 + proporcao * 0.14, achatamento));
    }
  });
  return caminhos;
}

export function svgCurvas({ largura = 800, altura = 600, semente = 7, morros = 2, aneis = 7, classe = 'moldura__curvas' } = {}) {
  const caminhos = curvasDaSerra({ largura, altura, semente, morros, aneis })
    .map((d) => `<path d="${d}" vector-effect="non-scaling-stroke"/>`)
    .join('');
  return `<svg class="${classe}" viewBox="0 0 ${largura} ${altura}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.2">${caminhos}</g></svg>`;
}

// Desenha as curvas em toda .moldura[data-curvas] da página
export function desenharMolduras(raiz = document) {
  raiz.querySelectorAll('[data-curvas]').forEach((elemento, indice) => {
    const semente = Number(elemento.dataset.curvas) || indice + 3;
    elemento.insertAdjacentHTML('afterbegin', svgCurvas({ semente, morros: 1, aneis: 9 }));
  });
}
