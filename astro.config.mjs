import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://torramiuda.com.br',
  integrations: [react(), sitemap({ filter: (pagina) => !pagina.includes('/404') && !pagina.includes('/painel') })],
  server: { port: 5173, host: true },
  devToolbar: { enabled: false },
  build: { inlineStylesheets: 'always' }, // o CSS (cerca de 20 KB) vai no HTML: nada bloqueia a primeira pintura
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
