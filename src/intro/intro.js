import { svgGrao } from '../grao/grao.js';
import { svgCurvas } from '../curvas/curvas.js';

const CHAVE = 'tm-intro-vista';
const DURACAO = 1800;

function jaViu() {
  try {
    return sessionStorage.getItem(CHAVE) === '1';
  } catch {
    return false;
  }
}
function marcarVista() {
  try {
    sessionStorage.setItem(CHAVE, '1');
  } catch {
    /* sem armazenamento: a intro pode repetir, sem prejuízo */
  }
}

function deveRodar() {
  const parametro = new URLSearchParams(location.search).get('intro');
  if (import.meta.env.DEV && parametro === '1') return true;
  if (parametro === '0') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (navigator.connection?.saveData) return false;
  if ((navigator.hardwareConcurrency ?? 4) <= 2) return false;
  if (typeof Element.prototype.animate !== 'function') return false;
  return !jaViu();
}

// Intro da torra: o grão do pingo do "i" torra, dá o primeiro crack e pousa no logo.
export function iniciarIntro() {
  if (!deveRodar()) {
    delete document.documentElement.dataset.intro;
    return;
  }
  marcarVista();

  document.body.insertAdjacentHTML(
    'afterbegin',
    `<div class="intro">
      <div class="intro__fundo">${svgCurvas({ semente: 11, aneis: 8, classe: 'intro__curvas' })}</div>
      <div class="intro__grao">${svgGrao({ camadas: true })}</div>
      <button class="intro__pular" type="button">Pular abertura</button>
    </div>`,
  );
  const intro = document.querySelector('.intro');
  const grao = intro.querySelector('.intro__grao');
  const logoGrao = document.querySelector('.topo .logo__grao');
  document.documentElement.dataset.intro = 'rodando';

  const animacoes = [];
  const animar = (elemento, quadros, opcoes) => {
    const animacao = elemento.animate(quadros, { fill: 'forwards', easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)', ...opcoes });
    animacoes.push(animacao);
    return animacao;
  };

  // 0,3 s → 1,0 s: cru → torra clara → torra média, respirando
  animar(grao.querySelector('.grao__clara'), [{ opacity: 0 }, { opacity: 1 }], { delay: 300, duration: 350 });
  animar(grao.querySelector('.grao__media'), [{ opacity: 0 }, { opacity: 1 }], { delay: 650, duration: 350 });
  animar(grao.querySelector('svg'), [{ transform: 'scale(1)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }], {
    delay: 300,
    duration: 900,
  });

  // 1,0 s → 1,2 s: o primeiro crack
  animar(grao.querySelector('.grao__fenda'), [{ opacity: 0 }, { opacity: 1 }], { delay: 1000, duration: 120 });
  animar(
    grao,
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-2px)' },
      { transform: 'translateX(2px)' },
      { transform: 'translateX(0)' },
    ],
    { delay: 1000, duration: 80, fill: 'none', easing: 'linear' },
  );

  // 1,2 s → 1,8 s: o grão pousa no pingo do "i" e o site aparece
  if (logoGrao) {
    const origem = grao.getBoundingClientRect();
    const destino = logoGrao.getBoundingClientRect();
    const dx = destino.left + destino.width / 2 - (origem.left + origem.width / 2);
    const dy = destino.top + destino.height / 2 - (origem.top + origem.height / 2);
    const escala = destino.width / origem.width;
    animar(grao, [{ transform: 'none' }, { transform: `translate(${dx}px, ${dy}px) scale(${escala})` }], {
      delay: 1200,
      duration: 600,
      easing: 'cubic-bezier(0.6, 0, 0.2, 1)',
    });
  }
  const fundo = animar(
    intro.querySelector('.intro__fundo'),
    [{ opacity: 1 }, { opacity: 1, offset: 0.72, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }, { opacity: 0 }],
    { duration: DURACAO, easing: 'linear' },
  );

  const terminar = () => {
    if (!intro.isConnected) return;
    intro.remove();
    delete document.documentElement.dataset.intro;
    window.removeEventListener('wheel', pular);
    window.removeEventListener('touchmove', pular);
    window.removeEventListener('keydown', pular);
  };
  const pular = () => {
    animacoes.forEach((animacao) => animacao.finish());
    terminar();
  };

  fundo.finished.then(terminar).catch(terminar);
  intro.querySelector('.intro__pular').addEventListener('click', pular);
  intro.addEventListener('click', pular);
  window.addEventListener('wheel', pular, { passive: true });
  window.addEventListener('touchmove', pular, { passive: true });
  window.addEventListener('keydown', pular);
}
