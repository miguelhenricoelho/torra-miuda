import { useEffect, useState } from 'react';
import { api } from '../services/painel.js';
import { PAPEIS, formatarDataCurta } from '../services/painel-regras.js';
import { hojeIso } from '../services/painel-datas.js';
import { TEXTOS_AJUSTES as T } from './conteudo.js';
import './painel-ajustes.css';

const numero = (valor) => Number(String(valor).replace(',', '.'));

function Valores({ config, aoSalvar }) {
  const [valores, setValores] = useState({
    taxa_entrega: String(config.taxa_entrega), preco_assinatura: String(config.preco_assinatura), preco_kit: String(config.preco_kit),
  });
  const [aviso, setAviso] = useState('');
  const invalidos = Object.entries(valores).filter(([campo, v]) => (campo === 'taxa_entrega' ? !(numero(v) >= 0) : !(numero(v) > 0))).map(([c]) => c);

  const salvar = async (evento) => {
    evento.preventDefault();
    if (invalidos.length) return setAviso(T.precoInvalido);
    try {
      const campos = Object.fromEntries(Object.entries(valores).map(([c, v]) => [c, numero(v)]));
      await api.salvarConfig(campos);
      aoSalvar(campos);
      setAviso(T.valoresSalvos);
    } catch (falha) {
      setAviso(falha.message);
    }
  };

  const campo = (id, rotulo) => (
    <label className="campo" key={id}>
      <span className="campo__rotulo">{rotulo}</span>
      <span className="cafe-form__preco">
        <span aria-hidden="true">R$</span>
        <input className="campo__entrada" inputMode="decimal" value={valores[id]} aria-invalid={invalidos.includes(id)} onChange={(e) => setValores({ ...valores, [id]: e.target.value })} />
      </span>
    </label>
  );

  return (
    <form className="ajuste" onSubmit={salvar} noValidate aria-labelledby="ajuste-valores">
      <div className="ajuste__cabeca">
        <h2 id="ajuste-valores" className="ajuste__titulo">{T.valores}</h2>
        <p className="ajuste__ajuda">{T.valoresAjuda}</p>
      </div>
      <div className="ajuste__campos">
        {campo('taxa_entrega', T.taxa)}
        {campo('preco_assinatura', T.assinatura)}
        {campo('preco_kit', T.kit)}
      </div>
      {aviso && <p className={invalidos.length ? 'painel-erro' : 'painel-aviso'} role="status">{aviso}</p>}
      <button type="submit" className="botao ajuste__botao">{T.salvarValores}</button>
    </form>
  );
}

function Dias({ dias, aoMudar }) {
  const [novo, setNovo] = useState({ data: '', motivo: '' });
  const [aviso, setAviso] = useState('');

  const adicionar = async (evento) => {
    evento.preventDefault();
    if (!novo.data || novo.motivo.trim().length < 2) return setAviso(T.diaInvalido);
    try {
      const dia = { data: novo.data, motivo: novo.motivo.trim() };
      await api.adicionarDia(dia);
      aoMudar([...dias, dia].sort((a, b) => a.data.localeCompare(b.data)));
      setNovo({ data: '', motivo: '' });
      setAviso('');
    } catch (falha) {
      setAviso(falha.message);
    }
  };
  const tirar = async (data) => {
    try {
      await api.tirarDia(data);
      aoMudar(dias.filter((d) => d.data !== data));
    } catch (falha) {
      setAviso(falha.message);
    }
  };

  return (
    <section className="ajuste" aria-labelledby="ajuste-dias">
      <div className="ajuste__cabeca">
        <h2 id="ajuste-dias" className="ajuste__titulo">{T.dias}</h2>
        <p className="ajuste__ajuda">{T.diasAjuda}</p>
      </div>
      {dias.length === 0 ? (
        <p className="ajuste__fraco">{T.semDias}</p>
      ) : (
        <ul className="ajuste__lista">
          {dias.map((dia) => (
            <li key={dia.data}>
              <span><strong>{formatarDataCurta(dia.data)}</strong> · {dia.motivo}</span>
              <button type="button" className="botao botao--pequeno botao--contorno" onClick={() => tirar(dia.data)}>
                {T.tirar} <span className="so-leitor">{formatarDataCurta(dia.data)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <form className="ajuste__linha" onSubmit={adicionar} noValidate>
        <label className="campo">
          <span className="campo__rotulo">{T.data}</span>
          <input type="date" className="campo__entrada" min={hojeIso()} value={novo.data} onChange={(e) => setNovo({ ...novo, data: e.target.value })} />
        </label>
        <label className="campo">
          <span className="campo__rotulo">{T.motivo}</span>
          <input className="campo__entrada" placeholder={T.motivoExemplo} maxLength={60} value={novo.motivo} onChange={(e) => setNovo({ ...novo, motivo: e.target.value })} />
        </label>
        <button type="submit" className="botao">{T.adicionar}</button>
      </form>
      {aviso && <p className="painel-erro" role="alert">{aviso}</p>}
    </section>
  );
}

function Visita({ config, aoSalvar }) {
  const [visita, setVisita] = useState({
    visita_data: config.visita_data ?? '', visita_vagas: config.visita_vagas ?? '', visita_inscritos: config.visita_inscritos ?? 0,
  });
  const [aviso, setAviso] = useState('');
  const salvar = async (evento) => {
    evento.preventDefault();
    const campos = {
      visita_data: visita.visita_data || null,
      visita_vagas: visita.visita_vagas === '' ? null : Number(visita.visita_vagas),
      visita_inscritos: Number(visita.visita_inscritos) || 0,
    };
    try {
      await api.salvarConfig(campos);
      aoSalvar(campos);
      setAviso(T.visitaSalva);
    } catch (falha) {
      setAviso(falha.message);
    }
  };
  return (
    <form className="ajuste" onSubmit={salvar} aria-labelledby="ajuste-visita">
      <div className="ajuste__cabeca">
        <h2 id="ajuste-visita" className="ajuste__titulo">{T.visita}</h2>
        <p className="ajuste__ajuda">{T.visitaAjuda}</p>
      </div>
      <div className="ajuste__campos">
        <label className="campo">
          <span className="campo__rotulo">{T.visitaData}</span>
          <input type="date" className="campo__entrada" min={hojeIso()} value={visita.visita_data} onChange={(e) => setVisita({ ...visita, visita_data: e.target.value })} />
        </label>
        <label className="campo">
          <span className="campo__rotulo">{T.vagas}</span>
          <input type="number" min="0" max="50" className="campo__entrada" value={visita.visita_vagas} onChange={(e) => setVisita({ ...visita, visita_vagas: e.target.value })} />
        </label>
        <label className="campo">
          <span className="campo__rotulo">{T.inscritos}</span>
          <input type="number" min="0" max="50" className="campo__entrada" value={visita.visita_inscritos} onChange={(e) => setVisita({ ...visita, visita_inscritos: e.target.value })} />
        </label>
      </div>
      {aviso && <p className="painel-aviso" role="status">{aviso}</p>}
      <button type="submit" className="botao ajuste__botao">{T.salvarVisita}</button>
    </form>
  );
}

function Equipe({ equipe, pessoa, aoMudar }) {
  const [aviso, setAviso] = useState('');
  const mudar = async (id, campos) => {
    setAviso('');
    try {
      await api.mudarEquipe(id, campos);
      aoMudar(equipe.map((p) => (p.id === id ? { ...p, ...campos } : p)));
    } catch (falha) {
      setAviso(falha.message);
    }
  };
  return (
    <section className="ajuste" aria-labelledby="ajuste-equipe">
      <div className="ajuste__cabeca">
        <h2 id="ajuste-equipe" className="ajuste__titulo">{T.equipe}</h2>
        <p className="ajuste__ajuda">{T.equipeAjuda}</p>
      </div>
      <ul className="ajuste__lista ajuste__lista--equipe">
        {equipe.map((p) => {
          const souEu = p.id === pessoa.id;
          return (
            <li key={p.id}>
              <span className="ajuste__pessoa">
                <strong>{p.nome}</strong> {souEu && <span className="ajuste__fraco">{T.voce}</span>}
              </span>
              <label className="ajuste__papel">
                <span className="so-leitor">{T.papel} de {p.nome}</span>
                <select className="painel-demo__select" value={p.papel} disabled={souEu} onChange={(e) => mudar(p.id, { papel: e.target.value })}>
                  {Object.entries(PAPEIS).map(([id, info]) => <option key={id} value={id}>{info.nome}</option>)}
                </select>
              </label>
              <label className="painel-alternar">
                <input type="checkbox" checked={p.ativo} disabled={souEu} onChange={(e) => mudar(p.id, { ativo: e.target.checked })} />
                {T.ativo}
              </label>
            </li>
          );
        })}
      </ul>
      {aviso && <p className="painel-erro" role="alert">{aviso}</p>}
    </section>
  );
}

export default function PainelAjustes({ pessoa }) {
  const [ajustes, setAjustes] = useState(null);
  const [erro, setErro] = useState(false);
  const carregar = () => {
    setErro(false);
    api.lerAjustes().then(setAjustes).catch(() => setErro(true));
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
  if (!ajustes) return <div className="painel-esqueleto" role="status" aria-label="Carregando ajustes"><span /><span /><span /></div>;

  const mudarConfig = (campos) => setAjustes((a) => ({ ...a, config: { ...a.config, ...campos } }));
  return (
    <div className="ajustes">
      <Dias dias={ajustes.dias} aoMudar={(dias) => setAjustes((a) => ({ ...a, dias }))} />
      <Valores config={ajustes.config} aoSalvar={mudarConfig} />
      <Visita config={ajustes.config} aoSalvar={mudarConfig} />
      <Equipe equipe={ajustes.equipe} pessoa={pessoa} aoMudar={(equipe) => setAjustes((a) => ({ ...a, equipe }))} />
    </div>
  );
}
