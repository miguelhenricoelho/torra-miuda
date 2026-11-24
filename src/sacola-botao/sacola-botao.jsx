import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { $itens, $aberta, carregarSacola, quantidadeTotal } from '../sacola/sacola.js';
import './sacola-botao.css';

const icone =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>';

export default function SacolaBotao() {
  const itens = useStore($itens);
  // Até montar, mostra 0 como o HTML do servidor; depois lê a sacola salva
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    carregarSacola();
    setMontado(true);
  }, []);
  const total = montado ? quantidadeTotal(itens) : 0;
  return (
    <button
      type="button"
      className="sacola-botao"
      aria-label={`${total} ${total === 1 ? 'item' : 'itens'} na sacola`}
      onClick={() => $aberta.set(true)}
    >
      <span dangerouslySetInnerHTML={{ __html: icone }} />
      <span className="sacola-botao__contador numero" data-vazio={total === 0}>
        {total}
      </span>
    </button>
  );
}
