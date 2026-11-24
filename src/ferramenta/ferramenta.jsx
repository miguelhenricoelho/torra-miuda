import { useEffect, useRef, useState } from 'react';
import {
  PERGUNTAS, caminhoDe, campoDaPergunta, metodoDo, recomendar, textoDoResultado,
} from './ferramenta.js';
import { KIT, moagemDoId, separarNumeros } from '../dados/dados.js';
import { listarLotes } from '../services/catalogo.js';
import { adicionar, real } from '../sacola/sacola.js';
import { linkWhatsapp } from '../whatsapp/whatsapp.js';
import { proximaTorra, agoraDaPagina } from '../proxima-torra/proxima-torra.js';
import { ICONES } from '../icone/icones.js';
import './ferramenta.css';

const Icone = ({ nome }) => <span className="icone" dangerouslySetInnerHTML={{ __html: ICONES[nome] }} />;
const Nome = ({ texto }) => separarNumeros(texto).map((p, i) => (p.numero ? <span className="numero" key={i}>{p.texto}</span> : p.texto));
const rotuloDe = (chave, valor) => PERGUNTAS[chave].opcoes.find((opcao) => opcao.valor === valor)?.rotulo ?? '';

export default function Ferramenta() {
  const [respostas, setRespostas] = useState({});
  const [passo, setPasso] = useState(0);
  const [torra, setTorra] = useState(null);
  const foco = useRef(null);
  const primeiraRenderizacao = useRef(true);

  useEffect(() => setTorra(proximaTorra(agoraDaPagina())), []);
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    foco.current?.focus({ preventScroll: true });
  }, [passo]);

  const caminho = caminhoDe(respostas);
  const terminou = passo >= caminho.length;

  const responder = (chave, valor) => {
    const campo = campoDaPergunta(chave);
    setRespostas((atual) => (chave === 'para' && atual.para !== valor ? { para: valor } : { ...atual, [campo]: valor }));
    setPasso((atual) => atual + 1);
  };

  if (!terminou) {
    const chave = caminho[passo];
    const pergunta = PERGUNTAS[chave];
    const marcada = respostas[campoDaPergunta(chave)];
    // O total de perguntas muda com o caminho: a barra mostra o andamento sem contador
    const progresso = (passo + 1) / (caminho.length + 1);
    return (
      <div className="ferramenta__caixa">
        <div className="ferramenta__barra" role="progressbar" aria-label="Andamento" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progresso * 100)}>
          <span style={{ '--progresso': progresso }} />
        </div>
        <fieldset className="ferramenta__pergunta">
          <legend className="ferramenta__titulo" tabIndex={-1} ref={foco}>{pergunta.titulo}</legend>
          {pergunta.ajuda && <p className="ferramenta__ajuda">{pergunta.ajuda}</p>}
          <div className={`ferramenta__opcoes${pergunta.opcoes.length > 3 ? ' ferramenta__opcoes--grade' : ''}`}>
            {pergunta.opcoes.map((opcao) => (
              <button type="button" className="ferramenta__opcao" key={opcao.valor} aria-pressed={marcada === opcao.valor} onClick={() => responder(chave, opcao.valor)}>
                {opcao.icone && <Icone nome={opcao.icone} />}
                <span>{opcao.rotulo}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <div className="ferramenta__rodape">
          {passo > 0 ? (
            <button type="button" className="ferramenta__voltar" onClick={() => setPasso(passo - 1)}>
              <Icone nome="voltar" />Voltar
            </button>
          ) : (
            <span />
          )}
          <a className="ferramenta__planob" href="/qual-e-o-seu-cafe#tabela-moagem">Prefiro ver a tabela</a>
        </div>
      </div>
    );
  }

  const refazer = () => {
    setRespostas({});
    setPasso(0);
  };
  const metodo = metodoDo(respostas.metodo);
  const torraTexto = torra ? ` · entra na torra de ${torra.texto}` : '';

  if (respostas.para === 'presente') {
    const moagem = moagemDoId(metodo.moagem);
    const mensagem = `Oi! Fiz o "Qual é o seu café?" no site. É para presente, e a pessoa faz café ${metodo.texto}. O site indicou o kit de presente, ${moagem.mensagem}. É esse mesmo?`;
    return (
      <Resultado
        refFoco={foco}
        titulo="O kit de presente, com três cafés da colheita"
        contexto={`A Iara escolhe os três cafés a cada colheita, para quem vai ganhar conhecer a serra. Como a pessoa faz café ${metodo.texto}, peça ${moagem.mensagem}.`}
        detalhe={`${real.format(KIT.preco)} · ${moagem.nome.toLowerCase()}${torraTexto}`}
        mensagem={mensagem}
        aoPor={() => adicionar({ tipo: 'kit', id: KIT.id, moagem: moagem.id })}
        aoRefazer={refazer}
      />
    );
  }

  const resultado = recomendar(respostas, listarLotes());
  const textos = textoDoResultado(resultado, respostas);
  const [lote] = resultado.lotes;
  const pesoTexto = resultado.peso === 1000 ? '1 kg' : '250 g';
  const tomar = respostas.leite === 'leite' ? 'tomo com leite' : respostas.leite === 'puro' ? 'tomo puro' : 'tomo às vezes puro, às vezes com leite';
  const mensagem = `Oi! Fiz o "Qual é o seu café?" no site. Faço café ${metodo.texto}, gosto de café ${respostas.perfil}, ${tomar}, ${rotuloDe('xicaras', respostas.xicaras)} por dia. O site indicou o ${lote.nome}, ${pesoTexto}, ${resultado.moagem.mensagem}. É esse mesmo pra mim?`;

  return (
    <Resultado
      refFoco={foco}
      titulo={<Nome texto={`O ${lote.nome}, ${pesoTexto}, ${resultado.moagem.mensagem}`} />}
      aviso={textos.aviso}
      contexto={`${textos.contexto} ${textos.explicacao}`}
      detalhe={`${real.format(lote.precos[resultado.peso])}${torraTexto}`}
      mensagem={mensagem}
      linkCafe={`/cafes/${lote.slug}`}
      aoPor={() => adicionar({ tipo: 'cafe', id: lote.id, peso: resultado.peso, moagem: resultado.moagem.id })}
      aoRefazer={refazer}
    />
  );
}

function Resultado({ refFoco, titulo, aviso, contexto, detalhe, mensagem, linkCafe, aoPor, aoRefazer }) {
  return (
    <div className="ferramenta__caixa">
      <div className="ferramenta__barra" aria-hidden="true"><span style={{ '--progresso': 1 }} /></div>
      <div className="ferramenta__resultado" aria-live="polite">
        <p className="rotulo">O seu café</p>
        <h3 className="ferramenta__resultado-titulo" tabIndex={-1} ref={refFoco}>{titulo}</h3>
        {aviso && <p className="ferramenta__aviso">{aviso}</p>}
        <p>{contexto}</p>
        <p className="ferramenta__detalhe numero">{detalhe}</p>
        <div className="ferramenta__acoes">
          <button type="button" className="botao botao--grande" onClick={aoPor}>Pôr na sacola</button>
          <a className="botao botao--contorno botao--grande" href={linkWhatsapp(mensagem)} target="_blank" rel="noopener" data-wa-ferramenta>
            <Icone nome="whatsapp" />Perguntar à Iara
          </a>
        </div>
        {linkCafe && <a className="link-seta" href={linkCafe}>Ver a ficha deste café</a>}
        <p className="ferramenta__lembrete">O melhor é o que você gosta: se não agradar, trocamos por outro na próxima entrega.</p>
        <button type="button" className="ferramenta__refazer" onClick={aoRefazer}>Responder de novo</button>
      </div>
    </div>
  );
}
