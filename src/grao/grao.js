// O grão do pingo do "i": usado no logo e na intro da torra.
export function svgGrao({ classe = '', camadas = false } = {}) {
  const forma = 'M12 2.5c4.6 0 7.6 4.3 7.6 9.5s-3 9.5-7.6 9.5S4.4 17.2 4.4 12 7.4 2.5 12 2.5z';
  const fenda = 'M12.2 4.6c-2.2 2.4-1.6 5.2.1 7.4s2.3 5-.1 7.4';
  if (!camadas) {
    return `<svg class="${classe}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g transform="rotate(-24 12 12)"><path d="${forma}" fill="currentColor"/><path d="${fenda}" fill="none" stroke="var(--cor-nevoa)" stroke-width="1.3" stroke-linecap="round"/></g></svg>`;
  }
  // Intro: três camadas de cor que se revezam por opacidade, e a fenda do primeiro crack
  return `<svg class="${classe}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g transform="rotate(-24 12 12)">
    <path class="grao__cru" d="${forma}" fill="var(--cor-mata-clara)"/>
    <path class="grao__clara" d="${forma}" fill="var(--cor-cobre)"/>
    <path class="grao__media" d="${forma}" fill="var(--cor-cobre-fundo)"/>
    <path class="grao__sulco" d="${fenda}" fill="none" stroke="var(--cor-mata-14)" stroke-width="0.8" stroke-linecap="round"/>
    <path class="grao__fenda" d="${fenda}" fill="none" stroke="var(--cor-nevoa)" stroke-width="1.3" stroke-linecap="round" pathLength="1"/>
  </g></svg>`;
}
