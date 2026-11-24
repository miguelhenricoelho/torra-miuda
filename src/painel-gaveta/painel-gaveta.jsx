// Gaveta do painel: abre à direita (tela cheia no celular), prende o foco, fecha com Esc.
import { useEffect, useRef } from 'react';
import Icone from '../icone/icone.jsx';

export default function PainelGaveta({ rotulo, titulo, aoFechar, children }) {
  const fechar = useRef(null);
  const caixa = useRef(null);

  useEffect(() => {
    const anterior = document.activeElement;
    fechar.current?.focus();
    const aoTeclar = (evento) => {
      if (evento.key === 'Escape') aoFechar();
      if (evento.key !== 'Tab') return;
      const focaveis = caixa.current.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select, textarea');
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    };
    document.addEventListener('keydown', aoTeclar);
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.documentElement.style.overflow = '';
      // Se o item que abriu a gaveta saiu da lista (ex.: mudou de filtro), o foco volta para o título da tela
      if (anterior?.isConnected) anterior.focus();
      else document.querySelector('.painel-cabeca__titulo')?.focus();
    };
  }, []);

  return (
    <div className="detalhe-fundo" onClick={(e) => e.target === e.currentTarget && aoFechar()}>
      <section ref={caixa} className="detalhe" role="dialog" aria-modal="true" aria-labelledby="gaveta-titulo">
        <header className="detalhe__topo">
          <div>
            {rotulo && <p className="rotulo numero">{rotulo}</p>}
            <h2 id="gaveta-titulo" className="detalhe__titulo">{titulo}</h2>
          </div>
          <button ref={fechar} type="button" className="detalhe__fechar" onClick={aoFechar} aria-label="Fechar">
            <Icone nome="fechar" />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
