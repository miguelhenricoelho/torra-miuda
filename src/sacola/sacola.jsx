import { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  $itens, $aberta, carregarSacola, descreverItem, mudarQuantidade, tirar, real,
  FORMAS, camposFaltando, textosDoTotal, montarMensagemPedido,
} from './sacola.js';
import { proximaTorra, agoraDaPagina, atendimentoDaPagina } from '../proxima-torra/proxima-torra.js';
import { linkWhatsapp } from '../whatsapp/whatsapp.js';
import { registrarPedido, registroLigado } from '../services/pedidos.js';
import { CONFIG, separarNumeros } from '../dados/dados.js';
import { ICONES } from '../icone/icones.js';
import './sacola.css';

const Icone = ({ nome }) => <span className="icone" dangerouslySetInnerHTML={{ __html: ICONES[nome] }} />;
const Nome = ({ texto }) => separarNumeros(texto).map((p, i) => (p.numero ? <span className="numero" key={i}>{p.texto}</span> : p.texto));

const VAZIO = { nome: '', receber: '', cep: '', endereco: '', complemento: '', bairro: '', cidade: '', referencia: '', pagamento: '', troco: '', observacao: '' };

export default function Sacola() {
  const itens = useStore($itens);
  const aberta = useStore($aberta);
  const [dados, setDados] = useState(VAZIO);
  const [visivel, setVisivel] = useState(false);
  const [contexto, setContexto] = useState({ torra: null, atendimento: { aberto: true } });
  const painel = useRef(null);
  const fechar = useRef(null);
  const aviso = useRef(null);
  const focoAnterior = useRef(null);
  const abertoEm = useRef(0);
  const [isca, setIsca] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(carregarSacola, []);

  useEffect(() => {
    const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (aberta) {
      focoAnterior.current = document.activeElement;
      abertoEm.current = Date.now();
      setContexto({ torra: proximaTorra(agoraDaPagina()), atendimento: atendimentoDaPagina() });
      setVisivel(true);
      document.documentElement.style.overflow = 'hidden';
      document.body.dataset.gaveta = 'aberta';
      requestAnimationFrame(() => fechar.current?.focus());
    } else if (visivel) {
      document.documentElement.style.overflow = '';
      document.body.dataset.gaveta = '';
      const tempo = setTimeout(() => setVisivel(false), reduzido ? 0 : 320);
      focoAnterior.current?.focus?.({ preventScroll: true });
      return () => clearTimeout(tempo);
    }
    document.dispatchEvent(new CustomEvent('gaveta'));
  }, [aberta]);

  const mudar = (campo) => (evento) => {
    const valor = evento.target.value;
    setDados((atual) => {
      const novo = { ...atual, [campo]: valor };
      if (campo === 'receber') {
        const validos = FORMAS[valor].pagamentos.map(([v]) => v);
        if (!validos.includes(novo.pagamento)) novo.pagamento = '';
      }
      return novo;
    });
  };

  // Mantém o foco dentro da gaveta
  const prender = (evento) => {
    if (evento.key === 'Escape') return $aberta.set(false);
    if (evento.key !== 'Tab') return;
    const focaveis = painel.current.querySelectorAll('a[href], button:not([disabled]), input:not([tabindex="-1"]), textarea, [tabindex="0"]');
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (evento.shiftKey && document.activeElement === primeiro) { evento.preventDefault(); ultimo.focus(); }
    else if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primeiro.focus(); }
  };

  if (!visivel && !aberta) return null;

  const { torra, atendimento } = contexto;
  const faltando = camposFaltando(dados);
  const valores = textosDoTotal(itens, dados.receber);
  const pronto = itens.length > 0 && faltando.length === 0;
  const href = pronto ? linkWhatsapp(montarMensagemPedido({ itens, dados, torra, atendimento })) : undefined;
  const rotuloEnviar = atendimento.aberto ? 'Enviar pedido pelo WhatsApp' : `Enviar pedido (respondemos às 8h ${atendimento.reabre})`;

  const enviar = async (evento) => {
    if (!pronto) {
      evento.preventDefault();
      aviso.current?.focus();
      return;
    }
    if (!registroLigado) return; // sem banco: o link abre o WhatsApp direto
    evento.preventDefault();
    if (enviando) return;
    // A aba abre já no clique (senão o navegador bloqueia) e recebe o endereço depois do registro
    const janela = window.open('', '_blank');
    if (janela) janela.opener = null;
    setEnviando(true);
    const codigo = await registrarPedido({ itens, dados, abertoEm: abertoEm.current, site: isca });
    const link = linkWhatsapp(montarMensagemPedido({ itens, dados, torra, atendimento, codigo }));
    if (janela) janela.location.href = link;
    else window.location.href = link;
    setEnviando(false);
  };

  return (
    <div className="sacola" data-aberta={aberta && visivel ? 'true' : 'false'} onKeyDown={prender}>
      <div className="sacola__fundo" aria-hidden="true" onClick={() => $aberta.set(false)} />
      <section className="sacola__painel" role="dialog" aria-modal="true" aria-labelledby="sacola-titulo" ref={painel}>
        <header className="sacola__cabeca">
          <h2 id="sacola-titulo">Sua sacola</h2>
          <button className="sacola__fechar" type="button" aria-label="Fechar sacola" ref={fechar} onClick={() => $aberta.set(false)}>
            <Icone nome="fechar" />
          </button>
        </header>
        <div className="sacola__corpo">
          {torra && (
            <div className="sacola__torra">
              <p className="rotulo">Próxima torra</p>
              <p className="manuscrito">{torra.texto}</p>
              <p className="sacola__nota">{torra.aviso}</p>
            </div>
          )}

          {itens.length === 0 ? (
            <div className="sacola__vazia">
              <p>Sua sacola está vazia. Comece pelos cafés desta colheita, ou responda a até cinco perguntas e a gente indica o seu.</p>
              <a className="botao" href="/cafes">Ver os cafés</a>
              <a className="link-seta" href="/qual-e-o-seu-cafe">Descobrir qual é o meu</a>
            </div>
          ) : (
            <>
              <ul className="sacola__itens" aria-label="Itens da sacola">
                {itens.map((item, indice) => {
                  const { nome, detalhe, preco } = descreverItem(item);
                  return (
                    <li className="sacola__item" key={`${item.id}-${item.peso}-${item.moagem}`}>
                      <div>
                        <p className="sacola__nome"><Nome texto={nome} /></p>
                        <p className="sacola__detalhe">{detalhe}</p>
                      </div>
                      <p className="sacola__preco numero">{preco == null ? 'a confirmar' : real.format(preco * item.qtd)}</p>
                      <div className="sacola__qtd">
                        <button type="button" aria-label={`Tirar uma unidade de ${nome}`} onClick={() => mudarQuantidade(indice, -1)}><Icone nome="menos" /></button>
                        <span className="numero" aria-live="polite">{item.qtd}</span>
                        <button type="button" aria-label={`Pôr mais uma unidade de ${nome}`} onClick={() => mudarQuantidade(indice, 1)}><Icone nome="mais" /></button>
                      </div>
                      <button className="sacola__tirar" type="button" onClick={() => tirar(indice)}>Tirar</button>
                    </li>
                  );
                })}
              </ul>

              <form className="sacola__form" noValidate onSubmit={(e) => e.preventDefault()}>
                <div className="campo">
                  <label className="campo__rotulo" htmlFor="sacola-nome">Seu nome</label>
                  <input className="campo__entrada" id="sacola-nome" autoComplete="name" value={dados.nome} onChange={mudar('nome')} />
                </div>

                <fieldset className="opcoes opcoes--coluna">
                  <legend>Como você quer receber?</legend>
                  {Object.entries(FORMAS).map(([valor, forma]) => (
                    <label className="opcao" key={valor}>
                      <input type="radio" name="receber" value={valor} checked={dados.receber === valor} onChange={mudar('receber')} />
                      <span>{forma.rotulo}</span>
                    </label>
                  ))}
                </fieldset>

                {(dados.receber === 'entrega' || dados.receber === 'correios') && (
                  <div className="sacola__grupo">
                    <div className="campo">
                      <label className="campo__rotulo" htmlFor="sacola-cep">CEP</label>
                      <input className="campo__entrada" id="sacola-cep" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" value={dados.cep} onChange={mudar('cep')} />
                    </div>
                    <div className="campo">
                      <label className="campo__rotulo" htmlFor="sacola-endereco">Rua e número</label>
                      <input className="campo__entrada" id="sacola-endereco" autoComplete="address-line1" value={dados.endereco} onChange={mudar('endereco')} />
                    </div>
                    <div className="campo">
                      <label className="campo__rotulo" htmlFor="sacola-complemento">Complemento</label>
                      <input className="campo__entrada" id="sacola-complemento" autoComplete="address-line2" value={dados.complemento} onChange={mudar('complemento')} />
                    </div>
                    <div className="campo">
                      <label className="campo__rotulo" htmlFor="sacola-bairro">Bairro</label>
                      <input className="campo__entrada" id="sacola-bairro" value={dados.bairro} onChange={mudar('bairro')} />
                    </div>
                    {dados.receber === 'correios' && (
                      <div className="campo">
                        <label className="campo__rotulo" htmlFor="sacola-cidade">Cidade e estado</label>
                        <input className="campo__entrada" id="sacola-cidade" autoComplete="address-level2" value={dados.cidade} onChange={mudar('cidade')} />
                      </div>
                    )}
                    {dados.receber === 'entrega' && (
                      <div className="campo">
                        <label className="campo__rotulo" htmlFor="sacola-referencia">Ponto de referência</label>
                        <input className="campo__entrada" id="sacola-referencia" value={dados.referencia} onChange={mudar('referencia')} />
                      </div>
                    )}
                  </div>
                )}
                {dados.receber === 'retirada' && (
                  <p className="sacola__nota">{CONFIG.enderecos.retirada.completo}. De terça a sábado, das 10h às 18h.</p>
                )}
                {dados.receber === 'entrega' && torra && <p className="sacola__nota">Entrega em Fortaleza: {torra.textoEntrega}.</p>}

                {dados.receber && (
                  <fieldset className="opcoes">
                    <legend>Como você quer pagar?</legend>
                    {FORMAS[dados.receber].pagamentos.map(([valor, rotulo]) => (
                      <label className="opcao" key={valor}>
                        <input type="radio" name="pagamento" value={valor} checked={dados.pagamento === valor} onChange={mudar('pagamento')} />
                        <span>{rotulo}</span>
                      </label>
                    ))}
                  </fieldset>
                )}
                {dados.pagamento === 'dinheiro' && (
                  <div className="campo">
                    <label className="campo__rotulo" htmlFor="sacola-troco">Troco para quanto?</label>
                    <input className="campo__entrada" id="sacola-troco" inputMode="decimal" placeholder="R$ 100" value={dados.troco} onChange={mudar('troco')} />
                  </div>
                )}
                <div className="campo">
                  <label className="campo__rotulo" htmlFor="sacola-obs">Observação</label>
                  <textarea className="campo__entrada" id="sacola-obs" placeholder="Ex.: é presente para minha mãe" value={dados.observacao} onChange={mudar('observacao')} />
                </div>

                {/* Isca para robôs: invisível e fora do Tab; gente de verdade nunca preenche */}
                <div className="sacola__isca" aria-hidden="true">
                  <label htmlFor="sacola-site">Site</label>
                  <input id="sacola-site" tabIndex={-1} autoComplete="off" value={isca} onChange={(e) => setIsca(e.target.value)} />
                </div>
                <dl className="sacola__totais">
                  <div><dt>Subtotal</dt><dd className="numero">{valores.subtotal}</dd></div>
                  <div><dt>{valores.taxaRotulo}</dt><dd className="numero">{valores.taxa}</dd></div>
                  <div className="sacola__total"><dt>Total</dt><dd className="numero">{valores.total}</dd></div>
                </dl>
                <p className="sacola__faltando" tabIndex={-1} ref={aviso} aria-live="polite">
                  {faltando.length ? `Para enviar, falta: ${faltando.join(', ')}.` : 'Tudo certo. O WhatsApp abre com o pedido escrito: é só apertar enviar.'}
                </p>
                <a className="botao botao--grande sacola__enviar" href={href ?? '#sacola-titulo'} target={pronto ? '_blank' : undefined} rel="noopener" aria-disabled={!pronto} onClick={enviar} data-wa-pedido>
                  <Icone nome="whatsapp" /><span>{enviando ? 'Registrando o pedido…' : rotuloEnviar}</span>
                </a>
                <p className="sacola__nota">
                  {registroLigado
                    ? 'Seus dados vão na mensagem do WhatsApp e ficam guardados no nosso controle de pedidos, só para preparar e entregar.'
                    : 'Seus dados vão só na mensagem do WhatsApp.'}{' '}
                  Veja a <a href="/privacidade-e-trocas">privacidade e trocas</a>.
                </p>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
