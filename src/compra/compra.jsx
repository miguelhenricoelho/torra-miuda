// Escolha de peso, moagem e quantidade (página do café e do kit)
import { useEffect, useRef, useState } from 'react';
import { MOAGENS } from '../dados/dados.js';
import { adicionar, real } from '../sacola/sacola.js';
import { ICONES } from '../icone/icones.js';
import './compra.css';

const Icone = ({ nome }) => <span className="icone" dangerouslySetInnerHTML={{ __html: ICONES[nome] }} />;

export default function Compra({ tipo = 'cafe', id, precos = null, preco = null, esgotado = false, duvida, avisarVolta }) {
  const [peso, setPeso] = useState(250);
  const [moagem, setMoagem] = useState('coado');
  const [quantidade, setQuantidade] = useState(1);
  const formulario = useRef(null);

  // Se a pessoa escolheu algo antes do JS carregar, a escolha dela vale
  useEffect(() => {
    const marcado = (nome) => formulario.current?.querySelector(`input[name="${nome}"]:checked`)?.value;
    if (marcado('peso')) setPeso(Number(marcado('peso')));
    if (marcado('moagem')) setMoagem(marcado('moagem'));
  }, []);
  const unitario = tipo === 'kit' ? preco : precos[peso];

  const por = (evento) => {
    evento.preventDefault();
    if (esgotado) return;
    adicionar(tipo === 'kit' ? { tipo, id, moagem, qtd: quantidade } : { tipo, id, peso, moagem, qtd: quantidade });
  };

  return (
    <form className="compra" onSubmit={por} ref={formulario}>
      {tipo === 'cafe' && (
        <fieldset className="opcoes">
          <legend>Peso</legend>
          {[250, 1000].map((valor) => (
            <label className="opcao" key={valor}>
              <input type="radio" name="peso" value={valor} checked={peso === valor} onChange={() => setPeso(valor)} disabled={esgotado} />
              <span>{valor === 1000 ? '1 kg' : '250 g'} · <strong className="numero">{real.format(precos[valor])}</strong></span>
            </label>
          ))}
        </fieldset>
      )}
      <fieldset className="opcoes">
        <legend>Moagem</legend>
        {MOAGENS.map((item) => (
          <label className="opcao" key={item.id}>
            <input type="radio" name="moagem" value={item.id} checked={moagem === item.id} onChange={() => setMoagem(item.id)} disabled={esgotado} />
            <span>{item.nome}</span>
          </label>
        ))}
        <a className="compra__nao-sei" href="/qual-e-o-seu-cafe">Não sei qual moagem: descobrir em até cinco perguntas</a>
      </fieldset>
      {!esgotado && (
        <div className="compra__qtd">
          <span className="compra__qtd-rotulo" id={`qtd-${id}`}>Quantidade</span>
          <div className="compra__stepper" role="group" aria-labelledby={`qtd-${id}`}>
            <button type="button" aria-label="Diminuir quantidade" onClick={() => setQuantidade(Math.max(1, quantidade - 1))}><Icone nome="menos" /></button>
            <output className="numero" aria-live="polite">{quantidade}</output>
            <button type="button" aria-label="Aumentar quantidade" onClick={() => setQuantidade(Math.min(20, quantidade + 1))}><Icone nome="mais" /></button>
          </div>
        </div>
      )}
      {esgotado ? (
        <>
          <p className="compra__esgotado">Esgotado nesta colheita.</p>
          <a className="botao botao--grande compra__botao" href={avisarVolta} target="_blank" rel="noopener" data-wa>
            <Icone nome="whatsapp" />Avisar quando voltar
          </a>
        </>
      ) : (
        <>
          <button type="submit" className="botao botao--grande compra__botao">
            Pôr na sacola · <span className="numero">{real.format(unitario * quantidade)}</span>
          </button>
          <a className="link-seta" href={duvida.href} target="_blank" rel="noopener" data-wa>
            <Icone nome="whatsapp" />{duvida.rotulo}
          </a>
        </>
      )}
    </form>
  );
}
