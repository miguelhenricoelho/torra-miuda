import { useEffect, useState } from 'react';
import { api } from '../services/painel.js';
import { real } from '../services/painel-regras.js';
import { separarNumeros } from '../dados/dados.js';
import Icone from '../icone/icone.jsx';
import PainelGaveta from '../painel-gaveta/painel-gaveta.jsx';
import { TEXTOS_CAFES as T } from './conteudo.js';
import './painel-cafes.css';

const Nome = ({ texto }) => separarNumeros(texto).map((p, i) => (p.numero ? <span className="numero" key={i}>{p.texto}</span> : p.texto));

const VAZIO = {
  numero: '', nome: '', descricao: '', perfil: 'equilibrado', ponto: 0.5, ponto_nome: 'média',
  leite: false, espresso: false, preco_250: '', preco_1000: '', estado: 'oculto',
};

const numeroValido = (valor) => /^\d{1,3}$/.test(String(valor).trim());
const precoValido = (valor) => Number(String(valor).replace(',', '.')) > 0;
const lerPreco = (valor) => (String(valor).trim() === '' ? null : Number(String(valor).replace(',', '.')));

export function validarCafe(cafe, outros = []) {
  const erros = {};
  if (!numeroValido(cafe.numero)) erros.numero = T.erros.numero;
  else if (outros.some((o) => o.numero === String(cafe.numero).padStart(2, '0') && o.id !== cafe.id)) erros.numero = T.erros.numeroRepetido;
  if (String(cafe.nome).trim().length < 2) erros.nome = T.erros.nome;
  const tamanho = String(cafe.descricao).trim().length;
  if (tamanho < 10 || tamanho > 400) erros.descricao = T.erros.descricao;
  if (!precoValido(cafe.preco_250)) erros.preco_250 = T.erros.preco250;
  if (String(cafe.preco_1000 ?? '').trim() !== '' && !precoValido(cafe.preco_1000)) erros.preco_1000 = T.erros.preco1000;
  if (String(cafe.ponto_nome).trim().length < 2) erros.ponto_nome = T.erros.pontoNome;
  return erros;
}

function Campo({ id, rotulo, ajuda, erro, children }) {
  return (
    <div className="campo">
      <label className="campo__rotulo" htmlFor={id}>{rotulo}</label>
      {ajuda && <p className="campo__ajuda" id={`${id}-ajuda`}>{ajuda}</p>}
      {children}
      {erro && <p className="campo__erro" id={`${id}-erro`} role="alert">{erro}</p>}
    </div>
  );
}

function Formulario({ inicial, outros, aoSalvar, aoFechar }) {
  const novo = !inicial.id;
  const [cafe, setCafe] = useState({ ...inicial, preco_1000: inicial.preco_1000 ?? '' });
  const [tocados, setTocados] = useState({});
  const [enviado, setEnviado] = useState(false);
  const [estado, setEstado] = useState('');
  const erros = validarCafe(cafe, outros);
  const mostrar = (campo) => (tocados[campo] || enviado) && erros[campo];

  const mudar = (campo, valor) => setCafe((atual) => ({ ...atual, [campo]: valor }));
  const sair = (campo) => () => setTocados((atual) => ({ ...atual, [campo]: true }));
  const descreve = (campo, ajuda) => [ajuda && `${campo}-ajuda`, mostrar(campo) && `${campo}-erro`].filter(Boolean).join(' ') || undefined;

  const salvar = async (evento) => {
    evento.preventDefault();
    setEnviado(true);
    if (Object.keys(erros).length) {
      setEstado(T.faltam);
      return;
    }
    setEstado(T.salvando);
    const numero = String(cafe.numero).trim().padStart(2, '0');
    const id = inicial.id ?? `lote-${numero}`;
    const pronto = {
      ...cafe, id, slug: inicial.slug ?? id, numero, nome: cafe.nome.trim(), descricao: cafe.descricao.trim(),
      ponto: Number(cafe.ponto), preco_250: lerPreco(cafe.preco_250), preco_1000: lerPreco(cafe.preco_1000),
    };
    try {
      await api.salvarCafe(pronto);
      aoSalvar(pronto);
    } catch (falha) {
      setEstado(falha.message);
    }
  };

  return (
    <PainelGaveta rotulo={novo ? T.novo : T.editar} titulo={novo ? 'Novo lote' : <Nome texto={inicial.nome} />} aoFechar={aoFechar}>
      <form className="cafe-form" onSubmit={salvar} noValidate>
        <div className="cafe-form__dupla">
          <Campo id="numero" rotulo={T.campos.numero} erro={mostrar('numero')}>
            <input id="numero" className="campo__entrada" inputMode="numeric" value={cafe.numero} onChange={(e) => mudar('numero', e.target.value)} onBlur={sair('numero')} aria-invalid={Boolean(mostrar('numero'))} aria-describedby={descreve('numero')} disabled={!novo} />
          </Campo>
          <Campo id="nome" rotulo={T.campos.nome} erro={mostrar('nome')}>
            <input id="nome" className="campo__entrada" value={cafe.nome} onChange={(e) => mudar('nome', e.target.value)} onBlur={sair('nome')} aria-invalid={Boolean(mostrar('nome'))} aria-describedby={descreve('nome')} />
          </Campo>
        </div>
        <Campo id="descricao" rotulo={T.campos.descricao} ajuda={T.campos.descricaoAjuda} erro={mostrar('descricao')}>
          <textarea id="descricao" className="campo__entrada" rows={3} value={cafe.descricao} onChange={(e) => mudar('descricao', e.target.value)} onBlur={sair('descricao')} aria-invalid={Boolean(mostrar('descricao'))} aria-describedby={descreve('descricao', true)} />
        </Campo>

        <fieldset className="opcoes">
          <legend>{T.campos.perfil}</legend>
          {Object.entries(T.perfis).map(([id, nome]) => (
            <label className="opcao" key={id}>
              <input type="radio" name="perfil" value={id} checked={cafe.perfil === id} onChange={() => mudar('perfil', id)} />
              <span>{nome}</span>
            </label>
          ))}
        </fieldset>

        <div className="campo">
          <label className="campo__rotulo" htmlFor="ponto">{T.campos.ponto}</label>
          <input id="ponto" type="range" className="cafe-form__regua" min="0" max="1" step="0.05" value={cafe.ponto} onChange={(e) => mudar('ponto', e.target.value)} aria-valuetext={cafe.ponto_nome} />
          <div className="cafe-form__regua-legenda" aria-hidden="true"><span>clara</span><span>escura</span></div>
        </div>
        <Campo id="ponto_nome" rotulo={T.campos.pontoNome} erro={mostrar('ponto_nome')}>
          <input id="ponto_nome" className="campo__entrada" value={cafe.ponto_nome} onChange={(e) => mudar('ponto_nome', e.target.value)} onBlur={sair('ponto_nome')} aria-invalid={Boolean(mostrar('ponto_nome'))} aria-describedby={descreve('ponto_nome')} />
        </Campo>

        <div className="cafe-form__alternar">
          <label className="painel-alternar">
            <input type="checkbox" checked={cafe.leite} onChange={(e) => mudar('leite', e.target.checked)} />
            {T.campos.leite}
          </label>
          <label className="painel-alternar">
            <input type="checkbox" checked={cafe.espresso} onChange={(e) => mudar('espresso', e.target.checked)} />
            {T.campos.espresso}
          </label>
        </div>

        <div className="cafe-form__dupla">
          <Campo id="preco_250" rotulo={T.campos.preco250} erro={mostrar('preco_250')}>
            <span className="cafe-form__preco">
              <span aria-hidden="true">R$</span>
              <input id="preco_250" className="campo__entrada" inputMode="decimal" value={cafe.preco_250} onChange={(e) => mudar('preco_250', e.target.value)} onBlur={sair('preco_250')} aria-invalid={Boolean(mostrar('preco_250'))} aria-describedby={descreve('preco_250')} />
            </span>
          </Campo>
          <Campo id="preco_1000" rotulo={T.campos.preco1000} ajuda={T.campos.preco1000Ajuda} erro={mostrar('preco_1000')}>
            <span className="cafe-form__preco">
              <span aria-hidden="true">R$</span>
              <input id="preco_1000" className="campo__entrada" inputMode="decimal" value={cafe.preco_1000} onChange={(e) => mudar('preco_1000', e.target.value)} onBlur={sair('preco_1000')} aria-invalid={Boolean(mostrar('preco_1000'))} aria-describedby={descreve('preco_1000', true)} />
            </span>
          </Campo>
        </div>

        <fieldset className="cafe-form__estados">
          <legend className="campo__rotulo">{T.campos.estado}</legend>
          {Object.entries(T.estados).map(([id, nome]) => (
            <label key={id} className="cafe-estado">
              <input type="radio" name="estado" value={id} checked={cafe.estado === id} onChange={() => mudar('estado', id)} />
              <span className="cafe-estado__texto">
                <strong>{nome}</strong>
                <span>{T.estadosAjuda[id]}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {estado && <p className={estado === T.faltam ? 'painel-erro' : 'painel-aviso'} role="status">{estado}</p>}
        <div className="detalhe__acoes">
          <button type="submit" className="botao" disabled={estado === T.salvando}>{estado === T.salvando ? T.salvando : T.salvar}</button>
          <button type="button" className="botao botao--contorno" onClick={aoFechar}>{T.cancelar}</button>
        </div>
      </form>
    </PainelGaveta>
  );
}

export default function PainelCafes() {
  const [cafes, setCafes] = useState(null);
  const [erro, setErro] = useState(false);
  const [editando, setEditando] = useState(null);
  const [aviso, setAviso] = useState('');

  const carregar = () => {
    setErro(false);
    setCafes(null);
    api.listarCafes().then(setCafes).catch(() => setErro(true));
  };
  useEffect(carregar, []);

  const salvo = (cafe) => {
    setCafes((lista) => (lista.some((c) => c.id === cafe.id) ? lista.map((c) => (c.id === cafe.id ? cafe : c)) : [...lista, cafe]));
    setEditando(null);
    setAviso(T.salvo);
  };

  if (erro) {
    return (
      <p className="painel-erro" role="alert">
        {T.erro}
        <button type="button" className="botao botao--pequeno botao--contorno" onClick={carregar}>{T.tentar}</button>
      </p>
    );
  }

  return (
    <div className="cafes-painel">
      <div className="cafes-painel__topo">
        <button type="button" className="botao" onClick={() => { setAviso(''); setEditando(VAZIO); }}>
          <Icone nome="mais" />
          {T.novo}
        </button>
      </div>
      {aviso && <p className="painel-aviso" role="status">{aviso}</p>}
      {!cafes ? (
        <div className="painel-esqueleto" role="status" aria-label="Carregando cafés"><span /><span /></div>
      ) : cafes.length === 0 ? (
        <div className="painel-vazio"><strong>{T.vazioTitulo}</strong><p>{T.vazioTexto}</p></div>
      ) : (
        <ul className="cafes-painel__lista">
          {cafes.map((cafe) => (
            <li key={cafe.id} className="cafe-cartao" data-estado={cafe.estado}>
              <div className="cafe-cartao__topo">
                <h2 className="cafe-cartao__nome"><Nome texto={cafe.nome} /></h2>
                <span className="cafe-cartao__estado">{T.estados[cafe.estado]}</span>
              </div>
              <p className="cafe-cartao__desc">{cafe.descricao}</p>
              <div className="cafe-cartao__regua" aria-hidden="true">
                <span style={{ '--ponto': Number(cafe.ponto) }} />
              </div>
              <p className="cafe-cartao__info">
                {T.perfis[cafe.perfil]} · torra {cafe.ponto_nome}
                {cafe.leite ? ' · com leite' : ''}{cafe.espresso ? ' · espresso' : ''}
              </p>
              <p className="cafe-cartao__precos numero">
                250 g {real.format(cafe.preco_250)}{cafe.preco_1000 ? ` · 1 kg ${real.format(cafe.preco_1000)}` : ''}
              </p>
              <button type="button" className="botao botao--pequeno botao--contorno" onClick={() => { setAviso(''); setEditando(cafe); }}>
                {T.editar} <span className="so-leitor">{cafe.nome}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {editando && <Formulario inicial={editando} outros={cafes ?? []} aoSalvar={salvo} aoFechar={() => setEditando(null)} />}
    </div>
  );
}
