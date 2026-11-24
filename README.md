# Torra Miúda Cafés Especiais — site

Site público + painel da equipe (`/painel/`) com banco no Supabase.

Sem o Supabase configurado, tudo funciona com dados de exemplo e o painel abre em **modo demonstração** (dados fictícios, guardados só no navegador). É assim que ele entra no portfólio.

## Como rodar

1. Instale o Node.js 20 ou mais novo.
2. Na pasta do projeto: `npm install`
3. `npm run dev` e abra **http://localhost:5173**
4. Para ver no celular, na mesma rede Wi-Fi: abra o endereço "Network" que aparece no terminal.

Outros comandos:

- `npm test`: testes da ferramenta, da sacola, da torra, das regras do painel e da validação do pedido
- `npm run test:banco`: sobe um Postgres temporário, aplica a migration e roda os 63 testes de acesso por papel (precisa do Postgres 15+ instalado; no Linux, rode como um usuário que não seja root)
- `npm run build`: gera o site em `dist/` e lista os trechos marcados para revisar
- `npm run preview`: abre o site gerado pelo build

Para testar estados só no `npm run dev`:

- `?intro=1` força a abertura (ela não roda em aparelho fraco, com movimento reduzido ou na segunda visita)
- `?estado=fechado` simula o WhatsApp fora do horário
- `?agora=2026-11-22T17:59` muda a data e a hora (fuso de Brasília)

Para ver as etiquetas [REVISAR COM O CLIENTE] na tela: crie um `.env` com `PUBLIC_MODO_REVISAO=true`.

## Stack

Astro 7 (páginas estáticas, bom para o Google), com React só nas partes que mudam na tela (sacola, ferramenta, compra, assinatura, painel). Supabase para banco, login da equipe e a função que registra pedidos.

## Estrutura

Cada parte do site tem a sua pasta em `src/`, com os arquivos de mesmo nome (`src/hero/hero.astro`, `src/hero/hero.css`) e os textos em `conteudo.js`. As rotas ficam em `src/pages/` e só montam as partes.

- `dados/`: configuração fixa e dados de exemplo
- `services/catalogo.js`: acesso ao catálogo. Lê `dados/catalogo.json`, que o build gera a partir do Supabase (`services/baixar-catalogo.js`)
- `painel*/`: telas do painel; `services/painel-*.js`: regras e os dois modos (demonstração e real)
- `supabase/migrations/`: tabelas, regras de acesso e funções do banco
- `supabase/functions/criar-pedido/`: recebe o pedido da sacola, barra robôs e registra no banco
- `supabase/testes/`: testes do banco num Postgres local
- `proxima-torra/`, `ferramenta/`, `sacola/`: lógica com testes (`*.test.js`)

## Papéis do painel

| Papel | Quem | Vê e faz |
|---|---|---|
| Dona | Iara | Tudo: pedidos, torra, expedição, assinaturas, cafés e preços, ajustes, equipe e histórico |
| Atendimento | Bia | Pedidos (confirma ou cancela) e assinaturas. Não mexe em preço nem vê o histórico |
| Expedição | Davi | O que torrar e o que embalar e entregar, com endereço. Não vê valores nem pagamento |

As regras valem no banco (RLS), não só na tela: mesmo quem tentar pelo console do navegador não passa.

## Ligar o Supabase (fazer só depois da autorização)

1. Criar o projeto no Supabase (região São Paulo), no nome da Torra Miúda.
2. Rodar a migration: `supabase link` e `supabase db push` (ou colar `supabase/migrations/20261118000000_inicial.sql` no SQL Editor). **Não** rode `supabase/testes/00-ambiente-local.sql` no projeto real.
3. Authentication > Providers: deixar só e-mail; desligar "Allow new users to sign up".
4. Criar as pessoas da equipe: Authentication > Users > Invite (e-mail de cada uma). Depois, no SQL Editor:
   `insert into public.equipe (id, nome, papel) select id, 'Iara', 'dona' from auth.users where email = 'EMAIL DA IARA';`
   (repita para a Bia com `atendimento` e para o Davi com `expedicao`).
5. Cadastrar os cafés e os sítios pelo painel (a Iara) ou pelo Table Editor.
6. Função de pedidos: `supabase functions deploy criar-pedido --no-verify-jwt` e os segredos `SITE_URL` (endereço do site) e `SAL_LIMITE` (uma frase aleatória longa): `supabase secrets set SITE_URL=https://torramiuda.com.br SAL_LIMITE=...`.
7. Na Netlify: variáveis `PUBLIC_SUPABASE_URL` e `PUBLIC_SUPABASE_ANON_KEY`.
8. Para o site atualizar sozinho quando a Iara muda preço ou café: criar um Build Hook na Netlify e um Database Webhook no Supabase (tabelas `cafes`, `sitios`, `dias_fechados`, `configuracoes`) chamando esse endereço. Cada publicação gasta créditos da Netlify (ver o DNA).
9. E-mails do login (convite e troca de senha): configurar o SMTP do Resend em Authentication > SMTP.

## Publicar (Netlify)

- Comando de build: `npm run build` (baixa o catálogo do Supabase antes; se o banco não responder, o build para em vez de publicar preço errado)
- Pasta publicada: `dist`
- Plano: Personal (decidido no DNA), a partir do lançamento.
- Portfólio: publique sem as variáveis do Supabase. O painel abre só a demonstração.
