// Botão flutuante do WhatsApp (só no celular): aparece depois de rolar 60% da tela,
// some no rodapé, com a sacola ou o menu abertos e quando outro WhatsApp está perto (Módulo D, D.2).
export function iniciarFlutuante() {
  const botao = document.querySelector('.wa-flutuante');
  if (!botao) return;
  let pedido = false;

  const outros = () =>
    [...document.querySelectorAll('[data-wa], a[href^="https://wa.me"], .rodape')].filter(
      (elemento) => elemento !== botao && !elemento.closest('.sacola, .menu-celular'),
    );

  const atualizar = () => {
    pedido = false;
    const passouPrimeiraTela = window.scrollY > window.innerHeight * 0.6;
    const caixa = botao.getBoundingClientRect();
    const metadeDeBaixo = window.innerHeight / 2;
    const pertoDeOutro = outros().some((elemento) => {
      const r = elemento.getBoundingClientRect();
      if (elemento.classList.contains('rodape')) return r.top < window.innerHeight;
      if (r.width === 0) return false;
      const naMetadeDeBaixo = r.top > metadeDeBaixo && r.bottom < window.innerHeight;
      return naMetadeDeBaixo && Math.abs(r.top + r.height / 2 - (caixa.top + caixa.height / 2)) < 120;
    });
    const tecladoAberto = window.visualViewport && window.visualViewport.height < window.innerHeight * 0.75;
    const coberto = document.body.dataset.gaveta === 'aberta' || !document.getElementById('menu-celular')?.hidden;
    botao.dataset.visivel = String(passouPrimeiraTela && !pertoDeOutro && !coberto && !tecladoAberto);
  };

  const pedir = () => {
    if (pedido) return;
    pedido = true;
    requestAnimationFrame(atualizar);
  };
  window.addEventListener('scroll', pedir, { passive: true });
  window.addEventListener('resize', pedir);
  window.visualViewport?.addEventListener('resize', pedir);
  document.addEventListener('gaveta', pedir);
  atualizar();
}
