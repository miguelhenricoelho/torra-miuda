// Uma família só: traço de 1.6, cantos arredondados, grade de 24.
const svg = (conteudo, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" ${extra}>${conteudo}</svg>`;

export const ICONES = {
  sacola: svg('<path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>'),
  menu: svg('<path d="M4 8h16M4 16h16"/>'),
  fechar: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  seta: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  voltar: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  mais: svg('<path d="M12 5v14M5 12h14"/>'),
  menos: svg('<path d="M5 12h14"/>'),
  whatsapp: svg(
    '<path d="M4.5 19.5l1.1-3.9A8 8 0 1 1 8.6 18.6z"/><path d="M9.2 8.6c.2-.5.6-.6 1-.5l.4.9c.1.3 0 .6-.2.8l-.4.4a5.6 5.6 0 0 0 2.8 2.8l.4-.4c.2-.2.5-.3.8-.2l.9.4c.1.4 0 .8-.5 1-1.6.8-5.6-2.6-5.2-5.2z"/>',
  ),
  instagram: svg('<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.6"/><circle cx="16.9" cy="7.1" r="0.6"/>'),
  tiktok: svg('<path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 4c.4 2.4 2 4 4.5 4.3"/>'),
  email: svg('<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>'),
  mapa: svg('<path d="M12 21s-6-5.6-6-10.5a6 6 0 0 1 12 0C18 15.4 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.2"/>'),
  // Métodos de preparo (para a ferramenta e a escolha de moagem)
  grao: svg('<ellipse cx="12" cy="12" rx="5.5" ry="7.5" transform="rotate(-28 12 12)"/><path d="M9.3 6.6c2.4 2.4 3 7.6 5.4 10.8"/>'),
  coado: svg('<path d="M5 6h14l-5 7v5h-4v-5z"/><path d="M9 21h6"/>'),
  eletrica: svg('<rect x="6" y="3.5" width="12" height="6" rx="1.5"/><path d="M8 9.5l1 4h6l1-4"/><rect x="7" y="13.5" width="10" height="7" rx="1.5"/>'),
  prensa: svg('<rect x="6.5" y="7" width="10" height="13" rx="1.5"/><path d="M11.5 3v8M8 11h7M16.5 10h2v6h-2"/>'),
  moka: svg('<path d="M8 3.5h8l-1 6H9z"/><path d="M9 9.5L7 20.5h10l-2-11"/><path d="M17 12h1.5a1.5 1.5 0 0 1 0 3H17"/>'),
  espresso: svg('<path d="M5 10h11v4a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 11h1.5a2 2 0 0 1 0 4H16M8 4v3M11 4v3M14 4v3"/>'),
  presente: svg('<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M3.5 9h17M12 9v11M12 9c-2.5 0-4.5-1-4.5-3a2 2 0 0 1 4.5 0zM12 9c2.5 0 4.5-1 4.5-3a2 2 0 0 0-4.5 0z"/>'),
  // Painel da equipe
  recibo: svg('<path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3z"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/>'),
  caixa: svg('<path d="M4 8l8-4 8 4v8.5l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v8.5"/>'),
  repetir: svg('<path d="M5 11V9.5a3 3 0 0 1 3-3h11M16 3.5l3 3-3 3"/><path d="M19 13v1.5a3 3 0 0 1-3 3H5M8 20.5l-3-3 3-3"/>'),
  ajustes: svg('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'),
  relogio: svg('<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>'),
  sair: svg('<path d="M14 4.5h4a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5h-4"/><path d="M10 8l-4 4 4 4M6 12h9"/>'),
  busca: svg('<circle cx="11" cy="11" r="6"/><path d="M15.5 15.5L20 20"/>'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  alerta: svg('<path d="M12 4l9 15.5H3z"/><path d="M12 10v4M12 17v.5"/>'),
  pessoa: svg('<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>'),
};
