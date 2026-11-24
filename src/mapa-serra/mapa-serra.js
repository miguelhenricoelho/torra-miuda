export function iniciarMapa() {
  document.querySelectorAll('[data-mapa]').forEach((mapa) => {
    const mostrar = (numero) => {
      mapa.querySelectorAll('[data-sitio]').forEach((el) => el.setAttribute('aria-pressed', String(el.dataset.sitio === String(numero))));
      mapa.querySelectorAll('[data-cartao]').forEach((cartao) => {
        cartao.hidden = cartao.dataset.cartao !== String(numero);
      });
    };
    mapa.addEventListener('click', (evento) => {
      const alvo = evento.target.closest('[data-sitio]');
      if (alvo) mostrar(alvo.dataset.sitio);
    });
    mapa.addEventListener('keydown', (evento) => {
      const alvo = evento.target.closest('.mapa__ponto');
      if (alvo && (evento.key === 'Enter' || evento.key === ' ')) {
        evento.preventDefault();
        mostrar(alvo.dataset.sitio);
      }
    });

    // As curvas aparecem anel por anel ao entrar na tela (só o enfeite)
    const desenho = mapa.querySelector('.mapa__desenho');
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const caixa = desenho.getBoundingClientRect();
    if (caixa.top < window.innerHeight) return;
    desenho.dataset.revelar = 'espera';
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        desenho.dataset.revelar = 'pronto';
        observador.disconnect();
      },
      { threshold: 0.3 },
    );
    observador.observe(desenho);
  });
}
