import { useState } from 'react';
import { MOAGENS } from '../dados/dados.js';
import { linkWhatsapp } from '../whatsapp/whatsapp.js';
import { faltandoAssinatura, montarMensagemAssinatura, PAGAMENTOS_ASSINATURA } from './assinatura.js';
import { ICONES } from '../icone/icones.js';
import './assinatura.css';

export default function Assinatura() {
  const [dados, setDados] = useState({ moagem: 'coado', receber: 'fortaleza', nome: '', endereco: '', cep: '', pagamento: PAGAMENTOS_ASSINATURA[0] });
  const mudar = (campo) => (evento) => setDados({ ...dados, [campo]: evento.target.value });
  const faltando = faltandoAssinatura(dados);
  const pronto = faltando.length === 0;

  return (
    <form className="assinatura__form" noValidate onSubmit={(e) => e.preventDefault()}>
      <h3>Quero assinar</h3>
      <fieldset className="opcoes">
        <legend>Moagem</legend>
        {MOAGENS.map((moagem) => (
          <label className="opcao" key={moagem.id}>
            <input type="radio" name="assinatura-moagem" value={moagem.id} checked={dados.moagem === moagem.id} onChange={mudar('moagem')} />
            <span>{moagem.curto}</span>
          </label>
        ))}
      </fieldset>
      <fieldset className="opcoes">
        <legend>Como receber</legend>
        <label className="opcao"><input type="radio" name="assinatura-receber" value="fortaleza" checked={dados.receber === 'fortaleza'} onChange={mudar('receber')} /><span>Entrega em Fortaleza</span></label>
        <label className="opcao"><input type="radio" name="assinatura-receber" value="correios" checked={dados.receber === 'correios'} onChange={mudar('receber')} /><span>Correios</span></label>
      </fieldset>
      <div className="campo">
        <label className="campo__rotulo" htmlFor="assinatura-nome">Seu nome</label>
        <input className="campo__entrada" id="assinatura-nome" autoComplete="name" value={dados.nome} onChange={mudar('nome')} />
      </div>
      <div className="campo">
        <label className="campo__rotulo" htmlFor="assinatura-endereco">{dados.receber === 'correios' ? 'Endereço com bairro e cidade' : 'Endereço com bairro'}</label>
        <input className="campo__entrada" id="assinatura-endereco" autoComplete="street-address" value={dados.endereco} onChange={mudar('endereco')} />
      </div>
      {dados.receber === 'correios' && (
        <div className="campo">
          <label className="campo__rotulo" htmlFor="assinatura-cep">CEP</label>
          <input className="campo__entrada" id="assinatura-cep" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" value={dados.cep} onChange={mudar('cep')} />
        </div>
      )}
      <fieldset className="opcoes">
        <legend>Pagamento</legend>
        {PAGAMENTOS_ASSINATURA.map((pagamento) => (
          <label className="opcao" key={pagamento}>
            <input type="radio" name="assinatura-pagamento" value={pagamento} checked={dados.pagamento === pagamento} onChange={mudar('pagamento')} />
            <span>{pagamento}</span>
          </label>
        ))}
      </fieldset>
      <p className="assinatura__faltando" aria-live="polite">
        {pronto ? 'O WhatsApp abre com a assinatura escrita: é só apertar enviar.' : `Para enviar, falta: ${faltando.join(', ')}.`}
      </p>
      <a
        className="botao botao--grande assinatura__enviar"
        href={pronto ? linkWhatsapp(montarMensagemAssinatura(dados)) : '#assinatura-nome'}
        target={pronto ? '_blank' : undefined}
        rel="noopener"
        aria-disabled={!pronto}
        data-wa-assinatura
      >
        <span className="icone" dangerouslySetInnerHTML={{ __html: ICONES.whatsapp }} />
        Assinar pelo WhatsApp
      </a>
    </form>
  );
}
