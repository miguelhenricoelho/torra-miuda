import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/painel.js';
import {
  GRUPOS_PEDIDOS, NOME_RECEBER, NOME_PAGAMENTO, NOME_MOAGEM, acoesPermitidas, acaoDoStatus,
  formatarDataCurta, linkParaCliente, primeiroNome, real, formatarCep,
} from '../services/painel-regras.js';
import { separarNumeros } from '../dados/dados.js';
import Icone from '../icone/icone.jsx';
import PainelStatus from '../painel-status/painel-status.jsx';
import PainelGaveta from '../painel-gaveta/painel-gaveta.jsx';
import { TEXTOS_PEDIDOS as T } from './conteudo.js';
import './painel-pedidos.css';

const Nome = ({ texto }) => separarNumeros(texto).map((p, i) => (p.numero ? <span className="numero" key={i}>{p.texto}</span> : p.texto));

function Detalhe({ pedido, pessoa, aoMudar, aoFechar }) {
  const [ocupado, setOcupado] = useState('');
  const [erro, setErro] = useState('');
  const [confirmando, setConfirmando] = useState(false);

  const mudar = async (status) => {
    if (status === 'cancelado' && !confirmando) {
      setConfirmando(true);
      return;
    }
    setConfirmando(false);
    setErro('');
    setOcupado(status);
    try {
      await api.mudarStatus(pedido.id, status);
      aoMudar({ ...pedido, status });
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setOcupado('');
    }
  };

  const mudarPago = async (evento) => {
    const pago = evento.target.checked;
    try {
      await api.marcarPago(pedido.id, pago);
      aoMudar({ ...pedido, pago });
    } catch (falha) {
      setErro(falha.message);
    }
  };

  const acoes = acoesPermitidas(pessoa.papel, pedido);
  const mensagem = `Oi, ${primeiroNome(pedido.nome)}! Aqui é a ${pessoa.nome}, da Torra Miúda, sobre o seu pedido ${pedido.codigo}. `;
  const linkCliente = linkParaCliente(pedido.whatsapp, mensagem);
  const endereco = [pedido.endereco, pedido.bairro, pedido.cidade, pedido.cep && `CEP ${formatarCep(pedido.cep)}`].filter(Boolean).join(', ');

  return (
    <PainelGaveta rotulo={pedido.codigo} titulo={pedido.nome} aoFechar={aoFechar}>
        <PainelStatus status={pedido.status} receber={pedido.receber} completo />

        {erro && <p className="painel-erro" role="alert">{erro}</p>}
        {confirmando && (
          <div className="detalhe__confirmar" role="alert">
            <p>{T.confirmarCancelar}</p>
            <div className="detalhe__acoes">
              <button type="button" className="botao botao--pequeno botao--perigo" onClick={() => mudar('cancelado')}>{T.simCancelar}</button>
              <button type="button" className="botao botao--pequeno botao--contorno" onClick={() => setConfirmando(false)}>{T.manter}</button>
            </div>
          </div>
        )}
        {acoes.length > 0 && !confirmando && (
          <div className="detalhe__acoes">
            {acoes.map((status, i) => (
              <button
                key={status}
                type="button"
                className={`botao botao--pequeno${status === 'cancelado' ? ' botao--perigo' : i > 0 ? ' botao--contorno' : ''}`}
                onClick={() => mudar(status)}
                disabled={Boolean(ocupado)}
              >
                {ocupado === status ? 'Salvando…' : acaoDoStatus(status, pedido.receber)}
              </button>
            ))}
          </div>
        )}

        <dl className="detalhe__dados">
          <div className="detalhe__bloco">
            <dt className="rotulo">{T.itens}</dt>
            <dd>
              <ul className="detalhe__itens">
                {pedido.itens.map((item) => (
                  <li key={item.id}>
                    <span>
                      {item.qtd}x <Nome texto={item.nome} />
                      {item.peso ? `, ${item.peso === 1000 ? '1 kg' : '250 g'}` : ''}, {NOME_MOAGEM[item.moagem]}
                    </span>
                    {item.preco_unit != null && <span className="numero">{real.format(item.preco_unit * item.qtd)}</span>}
                  </li>
                ))}
                {pedido.total != null && (
                  <>
                    <li className="detalhe__soma">
                      <span>{pedido.receber === 'entrega' ? 'Entrega' : pedido.receber === 'correios' ? 'Frete' : 'Retirada'}</span>
                      <span className="numero">{pedido.receber === 'correios' ? 'a combinar' : pedido.receber === 'retirada' ? 'sem taxa' : real.format(pedido.taxa)}</span>
                    </li>
                    <li className="detalhe__total">
                      <span>Total</span>
                      <span className="numero">{real.format(pedido.total)}</span>
                    </li>
                  </>
                )}
              </ul>
            </dd>
          </div>
          <div className="detalhe__bloco">
            <dt className="rotulo">{T.receber}</dt>
            <dd>
              <p>{NOME_RECEBER[pedido.receber]}</p>
              {endereco && <p>{endereco}</p>}
              {pedido.referencia && <p className="detalhe__fraco">Referência: {pedido.referencia}</p>}
            </dd>
          </div>
          <div className="detalhe__bloco">
            <dt className="rotulo">{T.datas}</dt>
            <dd>
              <p>Torra de {formatarDataCurta(pedido.data_torra)}</p>
              {pedido.data_entrega && <p>Entrega na {formatarDataCurta(pedido.data_entrega)}</p>}
            </dd>
          </div>
          <div className="detalhe__bloco">
            <dt className="rotulo">{T.pagamento}</dt>
            <dd className="detalhe__pagamento">
              <p>{NOME_PAGAMENTO[pedido.pagamento] ?? pedido.pagamento}{pedido.troco ? `, troco para ${pedido.troco}` : ''}</p>
              <label className="painel-alternar">
                <input type="checkbox" checked={pedido.pago} onChange={mudarPago} />
                {T.pago}
              </label>
            </dd>
          </div>
          {pedido.observacao && (
            <div className="detalhe__bloco">
              <dt className="rotulo">{T.observacao}</dt>
              <dd>{pedido.observacao}</dd>
            </div>
          )}
        </dl>

        {linkCliente && (
          <a className="botao botao--contorno detalhe__whatsapp" href={linkCliente} target="_blank" rel="noopener">
            <Icone nome="whatsapp" />
            {T.falar} {primeiroNome(pedido.nome)}
          </a>
        )}
    </PainelGaveta>
  );
}

export default function PainelPedidos({ pessoa }) {
  const [pedidos, setPedidos] = useState(null);
  const [erro, setErro] = useState(false);
  const [grupo, setGrupo] = useState('confirmar');
  const [busca, setBusca] = useState('');
  const [aberto, setAberto] = useState(null);

  const carregar = () => {
    setErro(false);
    setPedidos(null);
    api.listarPedidos().then(setPedidos).catch(() => setErro(true));
  };
  useEffect(carregar, []);

  const contas = useMemo(
    () => Object.fromEntries(GRUPOS_PEDIDOS.map((g) => [g.id, (pedidos ?? []).filter((p) => g.status.includes(p.status)).length])),
    [pedidos],
  );

  const termo = busca.trim().toLowerCase();
  const visiveis = (pedidos ?? []).filter((pedido) =>
    termo
      ? pedido.nome.toLowerCase().includes(termo) || pedido.codigo.toLowerCase().includes(termo)
      : GRUPOS_PEDIDOS.find((g) => g.id === grupo).status.includes(pedido.status),
  );

  const atualizar = (novo) => {
    setPedidos((lista) => lista.map((p) => (p.id === novo.id ? { ...p, ...novo } : p)));
    setAberto((atual) => (atual ? { ...atual, ...novo } : atual));
  };

  if (erro) {
    return (
      <p className="painel-erro" role="alert">
        {T.erro}
        <button type="button" className="botao botao--pequeno botao--contorno" onClick={carregar}>{T.tentar}</button>
      </p>
    );
  }

  const [vazioTitulo, vazioTexto] = T.vazio[termo ? 'busca' : grupo];

  return (
    <div className="pedidos">
      <div className="pedidos__filtros">
        <div className="painel-abas" role="group" aria-label="Filtrar pedidos">
          {GRUPOS_PEDIDOS.map((g) => (
            <button key={g.id} type="button" className="painel-aba" aria-pressed={!termo && grupo === g.id} onClick={() => { setGrupo(g.id); setBusca(''); }}>
              {g.nome}
              {pedidos && <span className="painel-aba__conta">{contas[g.id]}</span>}
            </button>
          ))}
        </div>
        <label className="pedidos__busca">
          <span className="so-leitor">{T.buscarRotulo}</span>
          <Icone nome="busca" />
          <input type="search" className="campo__entrada" placeholder={T.buscar} value={busca} onChange={(e) => setBusca(e.target.value)} />
        </label>
      </div>

      {!pedidos ? (
        <div className="painel-esqueleto" role="status" aria-label="Carregando pedidos">
          <span /><span /><span />
        </div>
      ) : visiveis.length === 0 ? (
        <div className="painel-vazio">
          <strong>{vazioTitulo}</strong>
          <p>{vazioTexto}</p>
        </div>
      ) : (
        <ul className="pedidos__lista" aria-label="Pedidos">
          <li className="pedidos__cabeca" aria-hidden="true">
            {T.colunas.map((c) => <span key={c}>{c}</span>)}
          </li>
          {visiveis.map((pedido) => (
            <li key={pedido.id}>
              <button type="button" className="pedido-linha" onClick={() => setAberto(pedido)}>
                <span className="pedido-linha__codigo numero">{pedido.codigo}</span>
                <span className="pedido-linha__cliente">
                  <span className="pedido-linha__nome">{pedido.nome}</span>
                  <span className="pedido-linha__receber">
                    {NOME_RECEBER[pedido.receber]}{pedido.bairro ? `, ${pedido.bairro}` : ''}
                    {pedido.origem === 'whatsapp' ? ' · pelo WhatsApp' : ''}
                  </span>
                </span>
                <span className="pedido-linha__torra">{formatarDataCurta(pedido.data_torra)}</span>
                <span className="pedido-linha__total numero">
                  {real.format(pedido.total)}
                  {!pedido.pago && pedido.status !== 'cancelado' && <span className="pedido-linha__pendente">a receber</span>}
                </span>
                <PainelStatus status={pedido.status} receber={pedido.receber} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {aberto && <Detalhe pedido={aberto} pessoa={pessoa} aoMudar={atualizar} aoFechar={() => setAberto(null)} />}
    </div>
  );
}
