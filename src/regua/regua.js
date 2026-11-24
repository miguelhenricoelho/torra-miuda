// O marcador desliza até o ponto quando a régua entra na tela (só o enfeite se move)
export function animarReguas(raiz = document) {
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        entrada.target.dataset.visivel = 'true';
        observador.unobserve(entrada.target);
      });
    },
    { threshold: 0.6 },
  );
  raiz.querySelectorAll('.regua').forEach((regua) => {
    const caixa = regua.getBoundingClientRect();
    if (caixa.top < window.innerHeight && caixa.bottom > 0) return; // já visível: fica parado
    regua.dataset.visivel = 'false';
    observador.observe(regua);
  });
}
