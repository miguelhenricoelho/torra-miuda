// Lógica da ferramenta "Qual é o seu café?" (sem tela: testável em Node).
// Regra: o resultado nunca contradiz a descrição do café indicado.
import { NOME_PERFIL, PERFIS, moagemDoId } from '../dados/dados.js';

export const METODOS = [
  { valor: 'coado', rotulo: 'Coador de pano ou papel', icone: 'coado', moagem: 'coado', texto: 'no coador' },
  { valor: 'eletrica', rotulo: 'Cafeteira elétrica', icone: 'eletrica', moagem: 'coado', texto: 'na cafeteira elétrica' },
  { valor: 'prensa', rotulo: 'Prensa francesa', icone: 'prensa', moagem: 'prensa', texto: 'na prensa francesa' },
  { valor: 'moka', rotulo: 'Moka (italiana)', icone: 'moka', moagem: 'moka', texto: 'na moka' },
  { valor: 'espresso', rotulo: 'Máquina de espresso', icone: 'espresso', moagem: 'espresso', texto: 'na máquina de espresso' },
  { valor: 'grao', rotulo: 'Tenho moedor: quero em grão', icone: 'grao', moagem: 'grao', texto: 'moendo na hora' },
];

export const PERGUNTAS = {
  para: {
    titulo: 'É para você ou para dar de presente?',
    opcoes: [
      { valor: 'mim', rotulo: 'Para mim, para a casa', icone: 'pessoa' },
      { valor: 'presente', rotulo: 'Para dar de presente', icone: 'presente' },
    ],
  },
  metodo: { titulo: 'Como você faz café em casa?', opcoes: METODOS },
  metodoPresente: {
    titulo: 'E como a pessoa faz café?',
    ajuda: 'Se não souber, escolha o coador: é o jeito mais comum.',
    opcoes: METODOS,
  },
  perfil: {
    titulo: 'Do jeito que você toma hoje, prefere um café…',
    opcoes: [
      { valor: 'suave', rotulo: 'Mais suave e leve' },
      { valor: 'equilibrado', rotulo: 'Equilibrado, nem fraco nem forte' },
      { valor: 'encorpado', rotulo: 'Mais encorpado, de gosto forte' },
    ],
  },
  leite: {
    titulo: 'Você toma puro ou com leite?',
    opcoes: [
      { valor: 'puro', rotulo: 'Puro' },
      { valor: 'leite', rotulo: 'Com leite' },
      { valor: 'asvezes', rotulo: 'Às vezes um, às vezes outro' },
    ],
  },
  xicaras: {
    titulo: 'Quantas xícaras por dia, somando a casa?',
    ajuda: 'Assim a gente indica o tamanho do pacote.',
    opcoes: [
      { valor: 'poucas', rotulo: '1 a 2 xícaras' },
      { valor: 'medio', rotulo: '3 a 5 xícaras' },
      { valor: 'muitas', rotulo: '6 ou mais' },
    ],
  },
};

export const CAMINHO_MIM = ['para', 'metodo', 'perfil', 'leite', 'xicaras'];
export const CAMINHO_PRESENTE = ['para', 'metodoPresente'];

export const campoDaPergunta = (chave) => (chave === 'metodoPresente' ? 'metodo' : chave);
export const caminhoDe = (respostas) => (respostas.para === 'presente' ? CAMINHO_PRESENTE : CAMINHO_MIM);
export const metodoDo = (valor) => METODOS.find((metodo) => metodo.valor === valor);

const precisaLeite = (respostas) => respostas.leite === 'leite' || respostas.leite === 'asvezes';
const distanciaPerfil = (a, b) => Math.abs(PERFIS.indexOf(a) - PERFIS.indexOf(b));

// Motivo concreto de um lote não servir (para dizer isso no resultado)
function conflitos(lote, respostas) {
  const lista = [];
  if (precisaLeite(respostas) && !lote.leite) lista.push('leite');
  if (respostas.metodo === 'espresso' && !lote.espresso) lista.push('espresso');
  return lista;
}

const frasePor = {
  leite: (respostas) => (respostas.leite === 'asvezes' ? 'Para os dias com leite' : 'Para tomar com leite'),
  espresso: () => 'Para a máquina de espresso',
};
const fraseNaoServe = {
  leite: 'brilha puro',
  espresso: 'não é o mais indicado para espresso',
};

// [REVISAR COM O CLIENTE] troca de 250 g para 1 kg pelas xícaras
export const pesoPelasXicaras = (xicaras) => (xicaras === 'poucas' ? 250 : 1000);

export function recomendar(respostas, lotes) {
  const disponiveis = lotes.filter((lote) => lote.estado === 'disponivel');
  const metodo = metodoDo(respostas.metodo);
  const moagem = moagemDoId(metodo.moagem);
  const peso = pesoPelasXicaras(respostas.xicaras);

  const semConflito = disponiveis.filter((lote) => conflitos(lote, respostas).length === 0);
  const ideais = semConflito.filter((lote) => lote.perfil === respostas.perfil);

  if (ideais.length) {
    return { tipo: 'combina', lotes: ideais.slice(0, 2), peso, metodo, moagem };
  }

  // Nenhum junta tudo: indica o que não contradiz as respostas, com o perfil mais perto,
  // e mostra o do perfil pedido como alternativa honesta.
  const indicado = [...semConflito].sort(
    (a, b) => distanciaPerfil(a.perfil, respostas.perfil) - distanciaPerfil(b.perfil, respostas.perfil),
  )[0];
  const doPerfil = disponiveis.find((lote) => lote.perfil === respostas.perfil);

  if (!indicado) {
    // Nenhum lote atende leite/espresso nesta colheita: diz isso e indica o do perfil
    return { tipo: 'nenhum', lotes: doPerfil ? [doPerfil] : disponiveis.slice(0, 1), peso, metodo, moagem, motivos: [] };
  }
  const motivos = doPerfil ? conflitos(doPerfil, respostas) : [];
  return { tipo: 'alternativa', lotes: [indicado], alternativa: doPerfil ?? null, motivos, peso, metodo, moagem };
}

// Textos do resultado: só usa a descrição do lote indicado quando ela não contradiz as respostas
export function textoDoResultado(resultado, respostas) {
  const { lotes, metodo, tipo } = resultado;
  const [lote, segundo] = lotes;
  const perfil = NOME_PERFIL[respostas.perfil].toLowerCase();
  const leite = respostas.leite === 'leite' ? ', e toma com leite' : respostas.leite === 'puro' ? ', e toma puro' : ', às vezes com leite';
  const contexto = `Você faz café ${metodo.texto}, gosta de café ${perfil}${leite}.`;

  if (tipo === 'combina') {
    const outro = segundo ? ` O ${segundo.nome} também combina: se quiser, pergunte à Iara qual dos dois.` : '';
    return { contexto, explicacao: `${lote.simples}${outro}`, aviso: null };
  }
  if (tipo === 'alternativa' && resultado.alternativa) {
    const motivo = resultado.motivos[0];
    const aviso = `Nenhum café desta colheita junta tudo o que você pediu. ${frasePor[motivo](respostas)}, o ${lote.nome} fica melhor; o ${resultado.alternativa.nome} é ${perfil}, mas ${fraseNaoServe[motivo]}.`;
    return { contexto, explicacao: lote.simples, aviso };
  }
  return {
    contexto,
    explicacao: lote.simples,
    aviso: 'Nenhum café desta colheita junta tudo o que você pediu. Vale perguntar à Iara pelo WhatsApp: ela indica o mais perto.',
  };
}
