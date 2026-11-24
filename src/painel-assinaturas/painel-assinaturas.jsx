import { useEffect, useState } from 'react';
import { api } from '../services/painel.js';
import { NOME_RECEBER, NOME_MOAGEM } from '../services/painel-regras.js';
import { TEXTOS_ASSINATURAS as T } from './conteudo.js';
import './painel-assinaturas.css';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const mesCurto = (iso) => `${MESES[Number(iso.slice(5, 7)) - 1]}/${iso.slice(2, 4)}`;

function Linha({ item, aoMudar }) {
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState('');

  const mudar = async (campos) => {
    setErro('');
    try {
      await api.mudarAssinatura(item.id, campos);
      aoMudar(item.id, campos);
      setConfirmando(false);
    } catch (falha) {
      setErro(falha.message);
    }
  };

  return (
    <li className="assinatura">
      <div className="assinatura__quem">
        <h3 className="assinatura__nome">{item.nome}</h3>
        <p className="assinatura__info">
          250 g {NOME_MOAGEM[item.moagem]} · {NOME_RECEBER[item.receber]}{item.bairro ? `, ${item.bairro}` : ''} · {T.desde} {mesCurto(item.inicio)}
        </p>
      </div>
      {item.status === 'ativa' && (
        <fieldset className="assinatura__mes">
          <legend className="rotulo">{T.mes}</legend>
          <label className="painel-alternar">
            <input type="checkbox" checked={item.envio.pago} onChange={(e) => mudar({ pago: e.target.checked })} />
            {T.pago}
          </label>
          <label className="painel-alternar">
            <input type="checkbox" checked={item.envio.enviado} onChange={(e) => mudar({ enviado: e.target.checked })} />
            {T.enviado}
          </label>
        </fieldset>
      )}
      <div className="assinatura__acoes">
        {confirmando ? (
          <div className="assinatura__confirmar" role="alert">
            <p>{T.confirmarCancelar(item.nome)}</p>
            <div className="detalhe__acoes">
              <button type="button" className="botao botao--pequeno botao--perigo" onClick={() => mudar({ status: 'cancelada' })}>{T.sim}</button>
              <button type="button" className="botao botao--pequeno botao--contorno" onClick={() => setConfirmando(false)}>{T.nao}</button>
            </div>
          </div>
        ) : (
          <>
            {item.status === 'ativa' && (
              <button type="button" className="botao botao--pequeno botao--contorno" onClick={() => mudar({ status: 'pausada' })}>{T.pausar}</button>
            )}
            {item.status !== 'ativa' && (
              <button type="button" className="botao botao--pequeno botao--contorno" onClick={() => mudar({ status: 'ativa' })}>{T.retomar}</button>
            )}
            {item.status !== 'cancelada' && (
              <button type="button" className="botao botao--pequeno botao--perigo" onClick={() => setConfirmando(true)}>{T.cancelar}</button>
            )}
          </>
        )}
      </div>
      {erro && <p className="painel-erro" role="alert">{erro}</p>}
    </li>
  );
}

export default function PainelAssinaturas() {
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState(false);
  const [filtro, setFiltro] = useState('ativa');

  const carregar = () => {
    setErro(false);
    setLista(null);
    api.listarAssinaturas().then(setLista).catch(() => setErro(true));
  };
  useEffect(carregar, []);

  const aoMudar = (id, campos) =>
    setLista((atual) =>
      atual.map((item) => {
        if (item.id !== id) return item;
        const { status, ...envio } = campos;
        return { ...item, ...(status ? { status } : {}), envio: { ...item.envio, ...envio } };
      }),
    );

  if (erro) {
    return (
      <p className="painel-erro" role="alert">
        {T.erro}
        <button type="button" className="botao botao--pequeno botao--contorno" onClick={carregar}>{T.tentar}</button>
      </p>
    );
  }
  if (!lista) {
    return (
      <div className="painel-esqueleto" role="status" aria-label="Carregando assinaturas">
        <span /><span /><span />
      </div>
    );
  }

  const ativas = lista.filter((a) => a.status === 'ativa');
  const visiveis = lista.filter((a) => a.status === filtro);
  const [vazioTitulo, vazioTexto] = T.vazio[filtro];

  return (
    <div className="assinaturas">
      <p className="assinaturas__resumo">{T.resumo(ativas.length, ativas.filter((a) => a.envio.pago).length)}</p>
      <div className="painel-abas" role="group" aria-label="Filtrar assinaturas">
        {Object.entries(T.filtros).map(([id, nome]) => (
          <button key={id} type="button" className="painel-aba" aria-pressed={filtro === id} onClick={() => setFiltro(id)}>
            {nome}
            <span className="painel-aba__conta">{lista.filter((a) => a.status === id).length}</span>
          </button>
        ))}
      </div>
      {visiveis.length === 0 ? (
        <div className="painel-vazio">
          <strong>{vazioTitulo}</strong>
          <p>{vazioTexto}</p>
        </div>
      ) : (
        <ul className="assinaturas__lista">
          {visiveis.map((item) => <Linha key={item.id} item={item} aoMudar={aoMudar} />)}
        </ul>
      )}
    </div>
  );
}
