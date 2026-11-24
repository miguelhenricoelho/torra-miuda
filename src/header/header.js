export function iniciarMenu() {
  const botao = document.querySelector('.topo__menu');
  const menu = document.getElementById('menu-celular');
  if (!botao || !menu) return;
  const fechar = menu.querySelector('.menu-celular__fechar');

  const definir = (aberto, { devolverFoco = true } = {}) => {
    menu.hidden = !aberto;
    botao.setAttribute('aria-expanded', String(aberto));
    document.documentElement.style.overflow = aberto ? 'hidden' : '';
    if (aberto) fechar.focus();
    else if (devolverFoco) botao.focus({ preventScroll: true });
  };

  botao.addEventListener('click', () => definir(true));
  fechar.addEventListener('click', () => definir(false));
  menu.addEventListener('click', (evento) => {
    if (evento.target.closest('a')) definir(false, { devolverFoco: false });
  });
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && !menu.hidden) definir(false);
  });
}
