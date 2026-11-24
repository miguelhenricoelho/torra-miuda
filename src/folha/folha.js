// Rolagem estilo PicPay: o palco (hero) fica parado e a folha sobe por cima, como uma folha só.
export function iniciarFolha() {
  const palco = document.querySelector('.palco');
  const veu = palco?.querySelector('.palco__veu');
  const conteudo = palco?.querySelector('.palco__dentro');
  if (!palco || !veu || !conteudo) return;

  const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)');
  const topoFixo = document.querySelector('.topo-fixo');
  let pedido = false;

  // Palco mais alto que a tela (comum no celular): rola até o fim e só então para.
  const ajustarTopo = () => {
    const alturaTopo = topoFixo?.offsetHeight ?? 0;
    const sobra = window.innerHeight - palco.offsetHeight;
    palco.style.setProperty('--palco-topo', `${Math.min(alturaTopo, sobra)}px`);
  };

  const atualizar = () => {
    pedido = false;
    if (reduzido.matches) {
      veu.style.opacity = '0';
      conteudo.style.transform = '';
      return;
    }
    const progresso = Math.min(Math.max(window.scrollY / (palco.offsetHeight || 1), 0), 1);
    veu.style.opacity = String(progresso * 0.9);
    conteudo.style.transform = `scale(${1 - progresso * 0.05}) translateY(${progresso * -24}px)`;
  };

  const pedir = () => {
    if (pedido) return;
    pedido = true;
    requestAnimationFrame(atualizar);
  };

  ajustarTopo();
  atualizar();
  window.addEventListener('scroll', pedir, { passive: true });
  window.addEventListener('resize', () => {
    ajustarTopo();
    pedir();
  });
  reduzido.addEventListener('change', pedir);
}
