import { useEffect, useState } from 'react';
import { api } from '../services/painel.js';
import { TEXTOS_HISTORICO as T } from './conteudo.js';
import './painel-historico.css';

const quando = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });

export default function PainelHistorico() {
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState(false);
  const carregar = () => {
    setErro(false);
    api.listarHistorico().then(setLista).catch(() => setErro(true));
  };
  useEffect(carregar, []);

  if (erro) {
    return (
      <p className="painel-erro" role="alert">
        {T.erro}
        <button type="button" className="botao botao--pequeno botao--contorno" onClick={carregar}>{T.tentar}</button>
      </p>
    );
  }
  return (
    <div className="historico">
      <p className="historico__apoio">{T.apoio}</p>
      {!lista ? (
        <div className="painel-esqueleto" role="status" aria-label="Carregando histórico"><span /><span /></div>
      ) : lista.length === 0 ? (
        <div className="painel-vazio"><strong>{T.vazio}</strong></div>
      ) : (
        <ol className="historico__lista">
          {lista.map((item) => (
            <li key={item.id} className="historico__item">
              <time className="historico__quando numero" dateTime={item.quando}>{quando.format(new Date(item.quando))}</time>
              <p>
                <strong>{item.quem_nome ?? 'O site'}</strong> {T.acoes[item.acao] ?? item.acao} {T.tabelas[item.tabela] ?? item.tabela}{' '}
                {item.registro && <span className="numero">{item.registro}</span>}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
