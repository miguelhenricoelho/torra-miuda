import { useState } from 'react';
import { painelDemo } from '../services/painel-demo.js';
import { demonstracaoLiberada, loginRealLiberado, carregarReal } from '../services/painel.js';
import Icone from '../icone/icone.jsx';
import { TEXTOS_ENTRAR as T, PAPEIS_DEMO } from './conteudo.js';
import './painel-entrar.css';

function FormLogin({ aoEntrar }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [estado, setEstado] = useState('pronto'); // pronto | enviando | esqueci | link-enviado
  const [erro, setErro] = useState('');

  const enviar = async (evento) => {
    evento.preventDefault();
    setErro('');
    setEstado('enviando');
    try {
      const painelSupabase = await carregarReal();
      if (estado === 'esqueci') {
        await painelSupabase.esqueciSenha(email);
        setEstado('link-enviado');
        return;
      }
      aoEntrar(await painelSupabase.entrar(email, senha), 'real');
    } catch (falha) {
      setErro(falha.message);
      setEstado(estado === 'esqueci' ? 'esqueci' : 'pronto');
    }
  };

  if (estado === 'link-enviado') {
    return (
      <div className="entrar-form">
        <p role="status">{T.linkEnviado}</p>
        <button type="button" className="botao botao--contorno" onClick={() => setEstado('pronto')}>
          {T.voltar}
        </button>
      </div>
    );
  }

  const esqueci = estado === 'esqueci';
  return (
    <form className="entrar-form" onSubmit={enviar} noValidate>
      {erro && (
        <p className="painel-erro" role="alert">
          {erro}
        </p>
      )}
      <label className="campo">
        <span className="campo__rotulo">{T.email}</span>
        <input className="campo__entrada" type="email" autoComplete="username" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      {!esqueci && (
        <label className="campo">
          <span className="campo__rotulo">{T.senha}</span>
          <input className="campo__entrada" type="password" autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} />
        </label>
      )}
      <button type="submit" className="botao botao--grande" disabled={estado === 'enviando' || !email || (!esqueci && !senha)}>
        {estado === 'enviando' ? T.entrando : esqueci ? T.enviarLink : T.entrar}
      </button>
      <button type="button" className="entrar-link" onClick={() => setEstado(esqueci ? 'pronto' : 'esqueci')}>
        {esqueci ? T.voltar : T.esqueci}
      </button>
    </form>
  );
}

export default function PainelEntrar({ aoEntrar }) {
  const entrarDemo = async (papel) => aoEntrar(await painelDemo.entrarDemo(papel), 'demonstracao');

  return (
    <div className="entrar">
      <section className="entrar-marca fundo-escuro" aria-hidden="true">
        <p className="entrar-marca__nome">
          Torra Miúda <span className="painel-marca__sub">painel</span>
        </p>
        <div className="entrar-marca__regua">
          <span />
        </div>
        <p className="entrar-marca__legenda">do grão verde ao pacote na porta</p>
      </section>

      <main className="entrar-corpo" id="conteudo">
        <div className="entrar-caixa">
          <h1 className="entrar-titulo">{T.titulo}</h1>
          <p className="entrar-apoio">{T.apoio}</p>

          {loginRealLiberado && <FormLogin aoEntrar={aoEntrar} />}

          {demonstracaoLiberada && (
            <section className="entrar-demo" aria-labelledby="titulo-demo">
              <h2 id="titulo-demo" className="entrar-demo__titulo">
                {loginRealLiberado ? T.ouDemo : T.demoTitulo}
              </h2>
              <p className="entrar-demo__apoio">{T.demoApoio}</p>
              <ul className="entrar-papeis">
                {PAPEIS_DEMO.map((item) => (
                  <li key={item.papel}>
                    <button type="button" className="entrar-papel" onClick={() => entrarDemo(item.papel)}>
                      <span className="entrar-papel__topo">
                        <span className="entrar-papel__nome">{item.nome}</span>
                        <span className="entrar-papel__funcao">{item.funcao}</span>
                      </span>
                      <span className="entrar-papel__ve">{item.ve}</span>
                      <span className="entrar-papel__seta">
                        <Icone nome="seta" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <a className="link-seta entrar-voltar" href="/">
            <Icone nome="voltar" />
            {T.voltarSite}
          </a>
        </div>
      </main>
    </div>
  );
}
