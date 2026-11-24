import { useEffect, useState } from 'react';
import { api } from '../services/painel.js';
import { datasDeTorraPerto, hojeIso } from '../services/painel-datas.js';
import { proximaTorra, agoraEmBrasilia } from '../proxima-torra/proxima-torra.js';
import { formatarDataCurta, formatarPeso } from '../services/painel-regras.js';
import { separarNumeros } from '../dados/dados.js';
import { TEXTOS_TORRA as T } from './conteudo.js';
import './painel-torra.css';

const Nome = ({ texto }) => separarNumeros(texto).map((p, i) => (p.numero ? <span className="numero" key={i}>{p.texto}</span> : p.texto));


export function SeletorDeTorra({ datas, data, aoEscolher }) {
  const hoje = hojeIso();
  return (
    <div className="painel-abas" role="group" aria-label={T.escolherData}>
      {datas.map((item) => (
        <button key={item} type="button" className="painel-aba" aria-pressed={item === data} onClick={() => aoEscolher(item)}>
          {formatarDataCurta(item)}
          {item <= hoje && <span className="painel-aba__conta">{item === hoje ? T.hoje : T.passada}</span>}
        </button>
      ))}
    </div>
  );
}

// Torra: abre na próxima torra (a mesma do topo do painel e do site).
// Expedição: abre na última torra que já aconteceu, de onde sai o que embalar.
export function datasIniciais() {
  const datas = datasDeTorraPerto();
  const hoje = hojeIso();
  const proxima = proximaTorra(agoraEmBrasilia());
  const iso = proxima ? proxima.data.toISOString().slice(0, 10) : null;
  return {
    datas,
    inicial: datas.includes(iso) ? iso : datas.find((d) => d > hoje) ?? datas[0],
    ultima: [...datas].reverse().find((d) => d <= hoje) ?? datas[0],
  };
}

export default function PainelTorra() {
  const [{ datas, inicial }] = useState(datasIniciais);
  const [data, setData] = useState(inicial);
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const carregar = () => {
    setErro(false);
    setLista(null);
    api.listaTorra(data).then(setLista).catch(() => setErro(true));
  };
  useEffect(() => {
    setAviso('');
    setConfirmando(false);
    carregar();
  }, [data]);

  const marcar = async () => {
    setOcupado(true);
    try {
      const quantos = await api.marcarTorraFeita(data);
      setAviso(T.feito(quantos));
      setConfirmando(false);
      carregar();
    } catch (falha) {
      setAviso(falha.message);
    } finally {
      setOcupado(false);
    }
  };

  const totalGramas = lista?.cafes.reduce((soma, cafe) => soma + cafe.gramas, 0) ?? 0;

  return (
    <div className="torra">
      <SeletorDeTorra datas={datas} data={data} aoEscolher={setData} />

      {aviso && <p className="painel-aviso" role="status">{aviso}</p>}
      {erro && (
        <p className="painel-erro" role="alert">
          {T.erro}
          <button type="button" className="botao botao--pequeno botao--contorno" onClick={carregar}>{T.tentar}</button>
        </p>
      )}

      {!lista && !erro && (
        <div className="painel-esqueleto" role="status" aria-label="Carregando a torra">
          <span /><span />
        </div>
      )}

      {lista && (
        <>
          {lista.pedidosParaConfirmar > 0 && (
            <p className="painel-aviso">{T.faltaConfirmar(lista.pedidosParaConfirmar)}</p>
          )}

          {lista.cafes.length === 0 ? (
            <div className="painel-vazio">
              <strong>{T.vazioTitulo}</strong>
              <p>{T.vazioTexto}</p>
            </div>
          ) : (
            <>
              <p className="torra__total">
                <span className="rotulo">{T.total}</span>
                <span className="torra__total-numero numero">{formatarPeso(totalGramas)}</span>
              </p>
              <ul className="torra__lista">
                {lista.cafes.map((cafe) => (
                  <li key={cafe.cafe_id} className="torra-cafe">
                    <div className="torra-cafe__topo">
                      <h2 className="torra-cafe__nome"><Nome texto={cafe.nome} /></h2>
                      <p className="torra-cafe__peso numero">{formatarPeso(cafe.gramas)}</p>
                    </div>
                    <div className="torra-cafe__regua" aria-hidden="true">
                      <span className="torra-cafe__ponto" style={{ '--ponto': Number(cafe.ponto ?? 0.5) }} />
                    </div>
                    <p className="torra-cafe__pacotes">
                      {[cafe.pacotes_250 && `${cafe.pacotes_250} × 250 g`, cafe.pacotes_1000 && `${cafe.pacotes_1000} × 1 kg`].filter(Boolean).join(' · ')}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}

          {lista.pedidosConfirmados > 0 &&
            (confirmando ? (
              <div className="torra__confirmar" role="alert">
                <p>{T.confirmarMarcar}</p>
                <div className="detalhe__acoes">
                  <button type="button" className="botao" onClick={marcar} disabled={ocupado}>{ocupado ? 'Salvando…' : T.sim}</button>
                  <button type="button" className="botao botao--contorno" onClick={() => setConfirmando(false)}>{T.nao}</button>
                </div>
              </div>
            ) : (
              <button type="button" className="botao botao--grande torra__marcar" onClick={() => setConfirmando(true)}>
                {T.marcar(lista.pedidosConfirmados)}
              </button>
            ))}
        </>
      )}
    </div>
  );
}
