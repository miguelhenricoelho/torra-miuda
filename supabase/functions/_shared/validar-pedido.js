// Validação do pedido que chega do site. Roda na função criar-pedido e nos testes (Node).
// Preço e data da torra NÃO vêm daqui: o banco recalcula os dois.
import { z } from 'zod';

const MOAGENS = ['grao', 'coado', 'prensa', 'moka', 'espresso'];
const PAGAMENTOS = {
  entrega: ['pix-entrega', 'cartao-link'],
  retirada: ['pix-retirada', 'cartao-retirada', 'dinheiro'],
  correios: ['pix', 'cartao-link'],
};
const texto = (max) => z.string().trim().max(max);
const opcional = (max) => texto(max).optional().transform((v) => v || null);

const item = z.discriminatedUnion('tipo', [
  z.object({
    tipo: z.literal('cafe'),
    id: z.string().regex(/^[a-z0-9-]{3,40}$/),
    peso: z.union([z.literal(250), z.literal(1000)]),
    moagem: z.enum(MOAGENS),
    qtd: z.number().int().min(1).max(20),
  }),
  z.object({
    tipo: z.literal('kit'),
    moagem: z.enum(MOAGENS),
    qtd: z.number().int().min(1).max(20),
  }),
]);

const pedido = z
  .object({
    nome: texto(80).min(2),
    receber: z.enum(['entrega', 'retirada', 'correios']),
    pagamento: z.string(),
    troco: opcional(20),
    endereco: opcional(160),
    complemento: opcional(80),
    bairro: opcional(60),
    cidade: opcional(60),
    cep: z.string().optional().transform((v) => (v ? v.replace(/\D/g, '') : null)),
    referencia: opcional(160),
    observacao: opcional(300),
    itens: z.array(item).min(1).max(30),
  })
  .superRefine((dados, contexto) => {
    if (!PAGAMENTOS[dados.receber].includes(dados.pagamento)) {
      contexto.addIssue({ code: 'custom', path: ['pagamento'], message: 'Forma de pagamento não combina com o jeito de receber.' });
    }
    if (dados.receber === 'entrega' && (!dados.endereco || !dados.bairro)) {
      contexto.addIssue({ code: 'custom', path: ['endereco'], message: 'Entrega precisa de endereço e bairro.' });
    }
    if (dados.receber === 'correios' && (!dados.endereco || !dados.cidade || !/^\d{8}$/.test(dados.cep ?? ''))) {
      contexto.addIssue({ code: 'custom', path: ['endereco'], message: 'Correios precisa de endereço, cidade e CEP.' });
    }
  });

export function validarPedido(entrada) {
  const resultado = pedido.safeParse(entrada);
  if (!resultado.success) return { ok: false, erro: resultado.error.issues[0]?.message ?? 'Pedido inválido.' };
  const dados = resultado.data;
  const endereco = [dados.endereco, dados.complemento].filter(Boolean).join(', ') || null;
  return {
    ok: true,
    dados: {
      ...dados,
      endereco: dados.receber === 'retirada' ? null : endereco,
      bairro: dados.receber === 'retirada' ? null : dados.bairro,
      cidade: dados.receber === 'entrega' ? 'Fortaleza' : dados.receber === 'retirada' ? null : dados.cidade,
      cep: dados.receber === 'retirada' ? null : dados.cep,
      complemento: undefined,
    },
  };
}

// Anti-robô sem script de terceiros: campo escondido vazio e pelo menos 3 s preenchendo
export function pareceRobo({ site, abertoEm }, agora = Date.now()) {
  if (site) return true;
  const inicio = Number(abertoEm);
  return !Number.isFinite(inicio) || agora - inicio < 3000;
}
