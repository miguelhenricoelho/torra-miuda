import { useEffect, useState } from 'react';
import { api } from '../services/painel.js';
import { ETAPAS, acaoDoStatus, podeMudar, linkParaCliente, primeiroNome, NOME_MOAGEM, formatarCep } from '../services/painel-regras.js';
import { SeletorDeTorra, datasIniciais } from '../painel-torra/painel-torra.jsx';
import PainelStatus from '../painel-status/painel-status.jsx';
import Icone from '../icone/icone.jsx';
import { TEXTOS_EXPEDICAO as T, mensagemDeSaida } from './conteudo.js';
import './painel-expedicao.css';

const ORDEM = ['entrega', 'retirada', 'correios'];

// "2x Lote 02, 250 g, coado; 1x Kit de presente, grao" → linhas legíveis
const linhasDosItens = (texto) =>
  String(texto ?? '')
    .split('; ')
    .filter(Boolean)
    .map((linha) => {
      const partes = linha.split(', ');
      const moagem = partes.pop();
      return [...partes.map((parte) => (parte === '1000 g' ? '1 kg' : parte)), NOME_MOAGEM[moagem] ?? moagem].join(', ');
    });

function Cartao({ pedido, pessoa, aoMudar }) {
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const seguinte = ETAPAS[ETAPAS.indexOf(pedido.status) + 1];
  const pode = seguinte && podeMudar(pessoa.papel, pedido.status, seguinte);
  const endereco = [pedido.endereco, pedido.bairro, pedido.cidade, pedido.cep && `CEP ${formatarCep(pedido.cep)}`].filter(Boolean).join(', ');
  const linkMapa = pedido.receber === 'entrega' && endereco
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${endereco}, CE`)}`
    : null;
  const linkAvisar = pedido.status === 'a_caminho' ? linkParaCliente(pedido.whatsapp, mensagemDeSaida(pedido)) : null;

  const avancar = async () => {
    setErro('');
    setOcupado(true);
    try {
      await api.mudarStatus(pedido.id, seguinte);
      aoMudar({ ...pedido, status: seguinte });
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <li className="envio">
      <div className="envio__topo">
        <div>
          <p className="rotulo numero">{pedido.codigo}</p>
          <h3 className="envio__nome">{pedido.nome}</h3>
        </div>
        <PainelStatus status={pedido.status} receber={pedido.receber} />
      </div>
      <ul className="envio__itens">
        {linhasDosItens(pedido.itens).map((linha) => <li key={linha}>{linha}</li>)}
      </ul>
      {endereco && <p className="envio__endereco">{endereco}</p>}
      {pedido.referencia && <p className="envio__fraco">{T.referencia}: {pedido.referencia}</p>}
      {pedido.observacao && <p className="envio__fraco">{T.observacao}: {pedido.observacao}</p>}
      {erro && <p className="painel-erro" role="alert">{erro}</p>}
      <div className="envio__acoes">
        {pode && (
          <button type="button" className="botao botao--pequeno" onClick={avancar} disabled={ocupado}>
            {ocupado ? 'Salvando…' : acaoDoStatus(seguinte, pedido.receber)}
          </button>
        )}
        {linkAvisar && (
          <a className="botao botao--pequeno botao--contorno" href={linkAvisar} target="_blank" rel="noopener">
            <Icone nome="whatsapp" />
            {T.avisar} {primeiroNome(pedido.nome)}
          </a>
        )}
        {linkMapa && (
          <a className="link-seta" href={linkMapa} target="_blank" rel="noopener">
            <Icone nome="mapa" />
            {T.mapa}
          </a>
        )}
      </div>
    </li>
  );
}

export default function PainelExpedicao({ pessoa }) {
  const [{ datas, ultima }] = useState(datasIniciais);
  const [data, setData] = useState(ultima);
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState(false);

  const carregar = () => {
    setErro(false);
    setLista(null);
    api.listaExpedicao(data).then(setLista).catch(() => setErro(true));
  };
  useEffect(carregar, [data]);

  const atualizar = (novo) => setLista((atual) => atual.map((p) => (p.id === novo.id ? { ...p, ...novo } : p)));

  return (
    <div className="expedicao">
      <SeletorDeTorra datas={datas} data={data} aoEscolher={setData} />
      {erro && (
        <p className="painel-erro" role="alert">
          {T.erro}
          <button type="button" className="botao botao--pequeno botao--contorno" onClick={carregar}>{T.tentar}</button>
        </p>
      )}
      {!lista && !erro && (
        <div className="painel-esqueleto" role="status" aria-label="Carregando a lista">
          <span /><span /><span />
        </div>
      )}
      {lista && lista.length === 0 && (
        <div className="painel-vazio">
          <strong>{T.vazioTitulo}</strong>
          <p>{T.vazioTexto}</p>
        </div>
      )}
      {lista &&
        ORDEM.map((receber) => {
          const doGrupo = lista.filter((p) => p.receber === receber);
          if (!doGrupo.length) return null;
          return (
            <section key={receber} className="expedicao__grupo" aria-labelledby={`grupo-${receber}`}>
              <h2 id={`grupo-${receber}`} className="expedicao__titulo">
                {T.grupos[receber]} <span className="expedicao__conta numero">{doGrupo.length}</span>
              </h2>
              <ul className="expedicao__lista">
                {doGrupo.map((pedido) => <Cartao key={pedido.id} pedido={pedido} pessoa={pessoa} aoMudar={atualizar} />)}
              </ul>
            </section>
          );
        })}
    </div>
  );
}
