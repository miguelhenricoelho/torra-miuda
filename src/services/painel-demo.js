// Modo demonstração do painel: dados fictícios guardados só neste navegador.
// Segue as mesmas regras de acesso do banco, para a demonstração mostrar o que cada papel vê.
import { CONFIG } from '../dados/dados.js';
import { LOTES_EXEMPLO } from '../dados/exemplo.js';
import { podeMudar, somarTorra, PAPEIS } from './painel-regras.js';
import { datasDeTorraPerto, entregaDaTorra, hojeIso, primeiroDoMes } from './painel-datas.js';

const CHAVE_DADOS = 'tm-painel-demo-v1';
const CHAVE_SESSAO = 'tm-painel-demo-sessao';

const EQUIPE = [
  { id: 'iara', nome: 'Iara', papel: 'dona', ativo: true },
  { id: 'bia', nome: 'Bia', papel: 'atendimento', ativo: true },
  { id: 'davi', nome: 'Davi', papel: 'expedicao', ativo: true },
];

const CLIENTES = [
  ['Marta Lima', 'entrega', 'Meireles', 'Portão verde, ao lado da padaria'],
  ['Rafael Sousa', 'retirada'],
  ['Cláudia Freitas', 'entrega', 'Fátima', 'Prédio azul, apartamento 302'],
  ['Joana Prado', 'correios', null, null, 'Recife', '50000000'],
  ['Pedro Alencar', 'entrega', 'Varjota', 'Casa de esquina com grade preta'],
  ['Lúcia Moreira', 'retirada'],
  ['Tiago Bezerra', 'entrega', 'Benfica', 'Em frente à praça'],
  ['Ana Holanda', 'entrega', 'Aldeota', 'Portaria 24 horas'],
  ['Sérgio Paiva', 'correios', null, null, 'Natal', '59000000'],
  ['Helena Rocha', 'entrega', 'Cocó', 'Bloco B'],
];

const PAGAMENTO = { entrega: 'pix-entrega', retirada: 'pix-retirada', correios: 'pix' };

function cafesIniciais() {
  return LOTES_EXEMPLO.map((lote, ordem) => ({
    id: lote.id, slug: lote.slug, numero: lote.numero, nome: lote.nome, sitio: lote.sitio, perfil: lote.perfil,
    leite: lote.leite, espresso: lote.espresso, ponto: lote.ponto, ponto_nome: lote.pontoNome,
    descricao: lote.simples, preco_250: lote.precos[250], preco_1000: lote.precos[1000] ?? null,
    estado: lote.estado, ordem,
  }));
}

function semear() {
  const hoje = hojeIso();
  const [anterior, proxima, seguinte] = datasDeTorraPerto(hoje);
  const cafes = cafesIniciais();
  const disponiveis = cafes.filter((cafe) => cafe.estado === 'disponivel');
  // Combinações fixas: a demonstração é igual para todo mundo
  const planos = [
    [anterior, 'entregue', [[0, 250, 'coado', 2]]],
    [anterior, 'a_caminho', [[1, 1000, 'grao', 1]]],
    [anterior, 'embalado', [[2, 250, 'espresso', 1], ['kit', 'coado']]],
    [anterior, 'a_caminho', [[1, 250, 'moka', 2]]],
    [proxima, 'confirmado', [[1, 250, 'coado', 3], [2, 250, 'coado', 1]]],
    [proxima, 'confirmado', [[0, 1000, 'grao', 1]]],
    [proxima, 'novo', [[2, 250, 'prensa', 2]]],
    [proxima, 'novo', [['kit', 'grao']]],
    [proxima, 'cancelado', [[0, 250, 'coado', 1]]],
    [seguinte, 'novo', [[1, 1000, 'espresso', 1]]],
  ];
  let numero = 41;
  const pedidos = planos.map(([dataTorra, status, linhas], indice) => {
    const [nome, receber, bairro, referencia, cidade, cep] = CLIENTES[indice];
    const itens = linhas.map((linha, i) => {
      if (linha[0] === 'kit') return { id: i, tipo: 'kit', nome: 'Kit de presente', peso: null, moagem: linha[1], qtd: 1, preco_unit: CONFIG.kit };
      const [qual, peso, moagem, qtd] = linha;
      const cafe = disponiveis[qual];
      return { id: i, tipo: 'cafe', cafe_id: cafe.id, nome: cafe.nome, peso, moagem, qtd, preco_unit: peso === 250 ? cafe.preco_250 : cafe.preco_1000 };
    });
    const subtotal = itens.reduce((soma, item) => soma + item.preco_unit * item.qtd, 0);
    const taxa = receber === 'entrega' ? CONFIG.taxaEntrega : 0;
    numero += 1;
    return {
      id: `p${numero}`, codigo: `TM-${String(numero).padStart(4, '0')}`, nome,
      whatsapp: `8590000${String(1000 + indice * 37).slice(-4)}`, receber, pagamento: PAGAMENTO[receber],
      endereco: receber === 'retirada' ? null : `Rua Exemplo, ${120 + indice * 15}`, bairro, cidade: cidade ?? (receber === 'entrega' ? 'Fortaleza' : null),
      cep, referencia, observacao: indice === 4 ? 'Pode deixar com o porteiro.' : null,
      data_torra: dataTorra, data_entrega: receber === 'entrega' ? entregaDaTorra(dataTorra) : null,
      subtotal, taxa, total: subtotal + taxa, pago: status === 'entregue', status, origem: indice === 7 ? 'whatsapp' : 'site',
      criado_em: new Date(Date.now() - (planos.length - indice) * 5_400_000).toISOString(), itens,
    };
  });

  const mes = primeiroDoMes(hoje);
  const assinaturas = [
    ['Beatriz Nogueira', 'entrega', 'coado', 'ativa', true, true],
    ['Carlos Teixeira', 'retirada', 'grao', 'ativa', true, false],
    ['Fernanda Lopes', 'correios', 'prensa', 'ativa', false, false],
    ['Gustavo Rangel', 'entrega', 'espresso', 'pausada', false, false],
    ['Isabela Cunha', 'entrega', 'coado', 'ativa', true, false],
    ['Mário Pontes', 'retirada', 'moka', 'cancelada', false, false],
  ].map(([nome, receber, moagem, status, pago, enviado], indice) => ({
    id: `a${indice + 1}`, nome, receber, moagem, status, inicio: `2026-0${(indice % 6) + 3}-01`,
    bairro: receber === 'entrega' ? ['Meireles', 'Aldeota', 'Fátima'][indice % 3] : null,
    envio: { mes, pago, enviado },
  }));

  const historico = [
    { id: 1, quem_nome: 'Iara', acao: 'update', tabela: 'cafes', registro: 'lote-04', quando: new Date(Date.now() - 86_400_000 * 2).toISOString() },
    { id: 2, quem_nome: 'Bia', acao: 'update', tabela: 'pedidos', registro: 'TM-0045', quando: new Date(Date.now() - 86_400_000).toISOString() },
    { id: 3, quem_nome: 'Davi', acao: 'update', tabela: 'pedidos', registro: 'TM-0042', quando: new Date(Date.now() - 3_600_000 * 5).toISOString() },
  ];

  return {
    versao: 1,
    equipe: EQUIPE,
    cafes,
    pedidos,
    assinaturas,
    historico,
    config: {
      taxa_entrega: CONFIG.taxaEntrega, preco_assinatura: CONFIG.assinatura, preco_kit: CONFIG.kit,
      visita_data: null, visita_vagas: null, visita_inscritos: 0,
    },
    dias: CONFIG.feriados.filter((data) => data >= hoje).slice(0, 3).map((data) => ({ data, motivo: 'Feriado' })),
  };
}

// ===== Armazenamento (falha sem quebrar: a demonstração vale só nesta visita) =====
let memoria = null;
function ler() {
  if (memoria) return memoria;
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_DADOS) ?? 'null');
    memoria = salvo?.versao === 1 ? salvo : semear();
  } catch {
    memoria = semear();
  }
  return memoria;
}
function gravar(dados) {
  memoria = dados;
  try {
    localStorage.setItem(CHAVE_DADOS, JSON.stringify(dados));
  } catch {
    /* sem armazenamento */
  }
}
const esperar = () => new Promise((resolver) => setTimeout(resolver, 160));
const copia = (valor) => structuredClone(valor);

let sessao = null;
function lerSessao() {
  if (sessao) return sessao;
  try {
    sessao = JSON.parse(sessionStorage.getItem(CHAVE_SESSAO) ?? 'null');
  } catch {
    sessao = null;
  }
  return sessao;
}

function exigir(...papeis) {
  const atual = lerSessao();
  if (!atual || !papeis.includes(atual.papel)) {
    const erro = new Error('Seu papel não tem acesso a esta parte.');
    erro.codigo = 'sem-acesso';
    throw erro;
  }
  return atual;
}

function anotar(dados, acao, tabela, registro) {
  const atual = lerSessao();
  dados.historico.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, quem_nome: atual?.nome ?? '—', acao, tabela, registro, quando: new Date().toISOString() });
  dados.historico = dados.historico.slice(0, 60);
}

export const painelDemo = {
  modo: 'demonstracao',

  async sessaoAtual() {
    return lerSessao();
  },
  async entrarDemo(papel) {
    const pessoa = EQUIPE.find((item) => item.papel === papel);
    sessao = { id: pessoa.id, nome: pessoa.nome, papel };
    try {
      sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
    } catch {
      /* sem armazenamento */
    }
    return sessao;
  },
  async sair() {
    sessao = null;
    try {
      sessionStorage.removeItem(CHAVE_SESSAO);
    } catch {
      /* sem armazenamento */
    }
  },
  async recomecar() {
    gravar(semear());
  },

  // ===== Pedidos =====
  async listarPedidos() {
    exigir('dona', 'atendimento');
    await esperar();
    return copia(ler().pedidos).sort((a, b) => b.criado_em.localeCompare(a.criado_em));
  },
  async mudarStatus(id, status) {
    const atual = exigir(...Object.keys(PAPEIS));
    const dados = ler();
    const pedido = dados.pedidos.find((item) => item.id === id);
    if (!pedido) throw new Error('Pedido não encontrado.');
    if (!podeMudar(atual.papel, pedido.status, status)) throw new Error('Seu papel não pode fazer essa mudança.');
    pedido.status = status;
    anotar(dados, 'update', 'pedidos', pedido.codigo);
    gravar(dados);
    await esperar();
    return copia(pedido);
  },
  async marcarPago(id, pago) {
    exigir('dona', 'atendimento');
    const dados = ler();
    const pedido = dados.pedidos.find((item) => item.id === id);
    pedido.pago = pago;
    anotar(dados, 'update', 'pedidos', pedido.codigo);
    gravar(dados);
    return copia(pedido);
  },

  // ===== Torra e expedição =====
  async listaTorra(data) {
    exigir('dona', 'expedicao');
    await esperar();
    const { pedidos, cafes } = ler();
    return {
      cafes: somarTorra(pedidos, data).map((linha) => ({ ...linha, ponto: cafes.find((c) => c.id === linha.cafe_id)?.ponto ?? 0.5 })),
      pedidosConfirmados: pedidos.filter((p) => p.data_torra === data && p.status === 'confirmado').length,
      pedidosParaConfirmar: pedidos.filter((p) => p.data_torra === data && p.status === 'novo').length,
    };
  },
  async marcarTorraFeita(data) {
    exigir('dona', 'expedicao');
    const dados = ler();
    let quantos = 0;
    for (const pedido of dados.pedidos) {
      if (pedido.data_torra === data && pedido.status === 'confirmado') {
        pedido.status = 'torrado';
        quantos += 1;
        anotar(dados, 'update', 'pedidos', pedido.codigo);
      }
    }
    gravar(dados);
    await esperar();
    return quantos;
  },
  async listaExpedicao(data) {
    exigir('dona', 'expedicao');
    await esperar();
    return ler()
      .pedidos.filter((p) => p.data_torra === data && ['torrado', 'embalado', 'a_caminho'].includes(p.status))
      .map(({ total, subtotal, taxa, pagamento, pago, itens, ...resto }) => ({
        ...copia(resto),
        // Mesmo formato da função lista_expedicao do banco
        itens: itens.map((i) => `${i.qtd}x ${i.nome}${i.peso ? `, ${i.peso} g` : ''}, ${i.moagem}`).join('; '),
      }));
  },

  // ===== Assinaturas =====
  async listarAssinaturas() {
    exigir('dona', 'atendimento');
    await esperar();
    return copia(ler().assinaturas);
  },
  async mudarAssinatura(id, campos) {
    exigir('dona', 'atendimento');
    const dados = ler();
    const assinatura = dados.assinaturas.find((item) => item.id === id);
    if ('status' in campos) assinatura.status = campos.status;
    if ('pago' in campos) assinatura.envio.pago = campos.pago;
    if ('enviado' in campos) assinatura.envio.enviado = campos.enviado;
    anotar(dados, 'update', 'assinaturas', assinatura.nome);
    gravar(dados);
    return copia(assinatura);
  },

  // ===== Cafés =====
  async listarCafes() {
    exigir('dona');
    await esperar();
    return copia(ler().cafes).sort((a, b) => a.ordem - b.ordem);
  },
  async salvarCafe(cafe) {
    exigir('dona');
    const dados = ler();
    const indice = dados.cafes.findIndex((item) => item.id === cafe.id);
    if (indice >= 0) dados.cafes[indice] = { ...dados.cafes[indice], ...cafe };
    else dados.cafes.push({ ...cafe, ordem: dados.cafes.length });
    anotar(dados, indice >= 0 ? 'update' : 'insert', 'cafes', cafe.id);
    gravar(dados);
    await esperar();
    return copia(cafe);
  },

  // ===== Ajustes =====
  async lerAjustes() {
    exigir('dona');
    await esperar();
    const { config, dias, equipe } = ler();
    return copia({ config, dias: [...dias].sort((a, b) => a.data.localeCompare(b.data)), equipe });
  },
  async salvarConfig(campos) {
    exigir('dona');
    const dados = ler();
    dados.config = { ...dados.config, ...campos };
    anotar(dados, 'update', 'configuracoes', null);
    gravar(dados);
  },
  async adicionarDia(dia) {
    exigir('dona');
    const dados = ler();
    if (dados.dias.some((item) => item.data === dia.data)) throw new Error('Esse dia já está na lista.');
    dados.dias.push(dia);
    anotar(dados, 'insert', 'dias_fechados', dia.data);
    gravar(dados);
  },
  async tirarDia(data) {
    exigir('dona');
    const dados = ler();
    dados.dias = dados.dias.filter((item) => item.data !== data);
    anotar(dados, 'delete', 'dias_fechados', data);
    gravar(dados);
  },
  async mudarEquipe(id, campos) {
    const atual = exigir('dona');
    if (id === atual.id && campos.ativo === false) throw new Error('Você não pode desativar o seu próprio acesso.');
    const dados = ler();
    const pessoa = dados.equipe.find((item) => item.id === id);
    Object.assign(pessoa, campos);
    anotar(dados, 'update', 'equipe', pessoa.nome);
    gravar(dados);
  },

  async listarHistorico() {
    exigir('dona');
    await esperar();
    return copia(ler().historico);
  },
};
