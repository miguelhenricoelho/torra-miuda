export function iniciarFiltros() {
  const caixa = document.querySelector('[data-filtros]');
  if (!caixa) return;
  const fichas = [...document.querySelectorAll('[data-catalogo] .ficha')];
  const vazio = document.querySelector('[data-catalogo-vazio]');
  const status = caixa.querySelector('[data-filtros-status]');
  const filtros = { perfil: '', leite: false, espresso: false };

  const aplicar = () => {
    let visiveis = 0;
    fichas.forEach((ficha) => {
      const mostra =
        (!filtros.perfil || ficha.dataset.perfil === filtros.perfil) &&
        (!filtros.leite || ficha.dataset.leite === 'true') &&
        (!filtros.espresso || ficha.dataset.espresso === 'true');
      ficha.hidden = !mostra;
      if (mostra) visiveis += 1;
    });
    vazio.hidden = visiveis > 0;
    status.textContent = `${visiveis} ${visiveis === 1 ? 'café' : 'cafés'} na lista.`;
  };

  caixa.addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-filtro]');
    if (!botao) return;
    const { filtro, valor } = botao.dataset;
    if (filtro === 'perfil') {
      filtros.perfil = valor;
      caixa.querySelectorAll('[data-filtro="perfil"]').forEach((b) => b.setAttribute('aria-pressed', String(b === botao)));
    } else {
      filtros[filtro] = !filtros[filtro];
      botao.setAttribute('aria-pressed', String(filtros[filtro]));
    }
    aplicar();
  });
}
