import { useCallback, useEffect, useRef, useState } from 'react';
import { api, usarDemonstracao, usarReal, carregarReal, loginRealLiberado } from '../services/painel.js';
import { painelDemo } from '../services/painel-demo.js';
import { PAPEIS } from '../services/painel-regras.js';
import { proximaTorra, agoraEmBrasilia } from '../proxima-torra/proxima-torra.js';
import Icone from '../icone/icone.jsx';
import PainelEntrar from '../painel-entrar/painel-entrar.jsx';
import PainelPedidos from '../painel-pedidos/painel-pedidos.jsx';
import PainelTorra from '../painel-torra/painel-torra.jsx';
import PainelExpedicao from '../painel-expedicao/painel-expedicao.jsx';
import PainelAssinaturas from '../painel-assinaturas/painel-assinaturas.jsx';
import PainelCafes from '../painel-cafes/painel-cafes.jsx';
import PainelAjustes from '../painel-ajustes/painel-ajustes.jsx';
import PainelHistorico from '../painel-historico/painel-historico.jsx';
import { TELAS, TEXTOS } from './conteudo.js';
import './painel.css';

const COMPONENTES = {
  pedidos: PainelPedidos,
  torra: PainelTorra,
  expedicao: PainelExpedicao,
  assinaturas: PainelAssinaturas,
  cafes: PainelCafes,
  ajustes: PainelAjustes,
  historico: PainelHistorico,
};

const telaDoEndereco = () => location.hash.replace('#', '');

export default function Painel() {
  const [pessoa, setPessoa] = useState(undefined); // undefined = verificando
  const [modo, setModo] = useState(loginRealLiberado ? 'real' : 'demonstracao');
  const [tela, setTela] = useState(telaDoEndereco());
  const [menuAberto, setMenuAberto] = useState(false);
  const [versao, setVersao] = useState(0); // força recarregar a tela (ex.: recomeçar demonstração)
  const titulo = useRef(null);
  const botaoMenu = useRef(null);
  const torra = proximaTorra(agoraEmBrasilia());

  useEffect(() => {
    (async () => {
      const sessaoDemo = await painelDemo.sessaoAtual();
      if (sessaoDemo) {
        usarDemonstracao();
        setModo('demonstracao');
        setPessoa(sessaoDemo);
        return;
      }
      if (loginRealLiberado) {
        await carregarReal();
        usarReal();
      }
      setPessoa((await api.sessaoAtual().catch(() => null)) ?? null);
    })();
    const aoMudar = () => setTela(telaDoEndereco());
    window.addEventListener('hashchange', aoMudar);
    return () => window.removeEventListener('hashchange', aoMudar);
  }, []);

  const telasDoPapel = pessoa ? PAPEIS[pessoa.papel].telas : [];
  const telaAtual = telasDoPapel.includes(tela) ? tela : telasDoPapel[0];

  useEffect(() => {
    if (!pessoa) return;
    document.title = `${TELAS[telaAtual].nome} · Painel · Torra Miúda`;
  }, [pessoa, telaAtual]);

  const irPara = (destino) => {
    setMenuAberto(false);
    if (destino === telaAtual) return;
    history.pushState(null, '', `#${destino}`);
    setTela(destino);
    requestAnimationFrame(() => titulo.current?.focus());
  };

  useEffect(() => {
    if (!menuAberto) return undefined;
    const aoTeclar = (evento) => {
      if (evento.key === 'Escape') {
        setMenuAberto(false);
        botaoMenu.current?.focus();
      }
    };
    document.addEventListener('keydown', aoTeclar);
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.documentElement.style.overflow = '';
    };
  }, [menuAberto]);

  const entrou = useCallback((novaPessoa, novoModo) => {
    if (novoModo === 'demonstracao') usarDemonstracao();
    else usarReal();
    setModo(novoModo);
    setPessoa(novaPessoa);
    const inicial = PAPEIS[novaPessoa.papel].telas[0];
    history.replaceState(null, '', `#${inicial}`);
    setTela(inicial);
  }, []);

  const sair = async () => {
    await api.sair();
    if (loginRealLiberado) usarReal();
    setModo(loginRealLiberado ? 'real' : 'demonstracao');
    setPessoa(null);
    history.replaceState(null, '', location.pathname);
  };

  const trocarPapel = async (evento) => {
    const nova = await painelDemo.entrarDemo(evento.target.value);
    entrou(nova, 'demonstracao');
  };

  const recomecar = async () => {
    await painelDemo.recomecar();
    setVersao((v) => v + 1);
  };

  if (pessoa === undefined) return <p className="painel-carregando" role="status">Abrindo o painel…</p>;
  if (!pessoa) return <PainelEntrar aoEntrar={entrou} />;

  const Tela = COMPONENTES[telaAtual];
  const navegacao = (
    <ul className="painel-nav__lista">
      {telasDoPapel.map((id) => (
        <li key={id}>
          <a
            href={`#${id}`}
            className="painel-nav__link"
            aria-current={id === telaAtual ? 'page' : undefined}
            onClick={(evento) => {
              evento.preventDefault();
              irPara(id);
            }}
          >
            <Icone nome={TELAS[id].icone} />
            {TELAS[id].nome}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="painel" data-modo={modo}>
      {modo === 'demonstracao' && (
        <div className="painel-demo" role="note">
          <p className="painel-demo__texto">{TEXTOS.demonstracao}</p>
          <div className="painel-demo__acoes">
            <label className="painel-demo__papel">
              <span className="painel-demo__rotulo">{TEXTOS.trocarPapel}</span>
              <select value={pessoa.papel} onChange={trocarPapel} className="painel-demo__select">
                <option value="dona">Iara, dona</option>
                <option value="atendimento">Bia, atendimento</option>
                <option value="expedicao">Davi, expedição</option>
              </select>
            </label>
            <button type="button" className="painel-demo__recomecar" onClick={recomecar}>
              {TEXTOS.recomecar}
            </button>
          </div>
        </div>
      )}

      <header className="painel-topo fundo-escuro">
        <a className="painel-marca" href="/" aria-label="Torra Miúda, ir para o site">
          Torra Miúda <span className="painel-marca__sub">painel</span>
        </a>
        <button
          ref={botaoMenu}
          type="button"
          className="painel-topo__menu"
          aria-expanded={menuAberto}
          aria-controls="painel-menu"
          onClick={() => setMenuAberto(true)}
        >
          <Icone nome="menu" />
          {TEXTOS.menu}
        </button>
      </header>

      <aside className="painel-lateral fundo-escuro" aria-label="Navegação do painel">
        <a className="painel-marca" href="/" aria-label="Torra Miúda, ir para o site">
          Torra Miúda <span className="painel-marca__sub">painel</span>
        </a>
        <nav className="painel-nav">{navegacao}</nav>
        <div className="painel-pessoa">
          <p className="painel-pessoa__nome">{pessoa.nome}</p>
          <p className="painel-pessoa__papel">{PAPEIS[pessoa.papel].nome}</p>
          <button type="button" className="painel-pessoa__sair" onClick={sair}>
            <Icone nome="sair" />
            {TEXTOS.sair}
          </button>
        </div>
      </aside>

      {menuAberto && (
        <div id="painel-menu" className="painel-menu fundo-escuro" role="dialog" aria-modal="true" aria-label="Menu do painel">
          <div className="painel-menu__topo">
            <p className="painel-pessoa__nome">
              {pessoa.nome} <span className="painel-pessoa__papel">· {PAPEIS[pessoa.papel].nome}</span>
            </p>
            <button type="button" className="painel-topo__menu" onClick={() => setMenuAberto(false)} autoFocus>
              <Icone nome="fechar" />
              {TEXTOS.fecharMenu}
            </button>
          </div>
          <nav className="painel-nav painel-nav--menu">{navegacao}</nav>
          <button type="button" className="painel-pessoa__sair" onClick={sair}>
            <Icone nome="sair" />
            {TEXTOS.sair}
          </button>
        </div>
      )}

      <main className="painel-conteudo" id="conteudo">
        <div className="painel-cabeca">
          <h1 className="painel-cabeca__titulo" ref={titulo} tabIndex={-1}>
            {TELAS[telaAtual].titulo}
          </h1>
          {torra && (
            <p className="painel-cabeca__torra">
              <span className="rotulo">{TEXTOS.proximaTorra}</span>
              <span className="manuscrito">{torra.texto}</span>
            </p>
          )}
        </div>
        <Tela key={`${telaAtual}-${versao}-${pessoa.papel}`} pessoa={pessoa} />
      </main>
    </div>
  );
}
