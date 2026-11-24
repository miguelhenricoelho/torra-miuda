// A régua da torra virou a régua do pedido: cada etapa esquenta a cor, do grão verde ao pacote entregue.
import { ETAPAS, nomeDoStatus } from '../services/painel-regras.js';
import './painel-status.css';

export default function PainelStatus({ status, receber, completo = false }) {
  const indice = ETAPAS.indexOf(status);
  const cancelado = status === 'cancelado';
  const progresso = cancelado ? 0 : (indice + 1) / ETAPAS.length;

  return (
    <div className={`status${completo ? ' status--completo' : ''}${cancelado ? ' status--cancelado' : ''}`}>
      <p className="status__nome">{nomeDoStatus(status, receber)}</p>
      <div className="status__trilho" aria-hidden="true">
        <span className="status__cheio" style={{ '--progresso': progresso }} />
      </div>
      {completo && (
        <ol className="status__etapas" aria-label="Etapas do pedido">
          {ETAPAS.map((etapa, i) => (
            <li
              key={etapa}
              className="status__etapa"
              data-feita={!cancelado && i <= indice ? 'sim' : 'nao'}
              aria-current={etapa === status ? 'step' : undefined}
            >
              {nomeDoStatus(etapa, receber)}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
