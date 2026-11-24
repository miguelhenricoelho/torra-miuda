-- Testes das regras de acesso, papel por papel. Cada linha imprime OK ou FALHOU.
\set QUIET on
\o /dev/null
\set dona '00000000-0000-0000-0000-00000000000a'
\set bia '00000000-0000-0000-0000-00000000000b'
\set davi '00000000-0000-0000-0000-00000000000c'
\set antigo '00000000-0000-0000-0000-00000000000d'
\set estranho '00000000-0000-0000-0000-00000000000e'

create schema teste;
create table teste.resultado (n serial, nome text, ok boolean);
grant usage on schema teste to anon, authenticated, service_role;
grant all on teste.resultado to anon, authenticated, service_role;
grant usage on sequence teste.resultado_n_seq to anon, authenticated, service_role;

create function teste.ok(nome text, cond boolean) returns void language plpgsql as $$
begin
  insert into teste.resultado (nome, ok) values (nome, coalesce(cond, false));
end $$;

-- Espera que o comando dê erro (acesso negado ou regra violada)
create function teste.erro(nome text, comando text) returns void language plpgsql as $$
begin
  begin
    execute comando;
    insert into teste.resultado (nome, ok) values (nome, false);
  exception when others then
    insert into teste.resultado (nome, ok) values (nome, true);
  end;
end $$;

-- Quantas linhas um comando afetou (RLS faz update/delete proibido afetar 0)
create function teste.linhas(comando text) returns integer language plpgsql as $$
declare
  quantas integer;
begin
  execute comando;
  get diagnostics quantas = row_count;
  return quantas;
end $$;
-- Guarda o id do primeiro pedido (os códigos TM podem pular números: tentativas recusadas gastam a sequência)
create table teste.ref (id uuid);
create function teste.p1() returns uuid language sql stable security definer as $$ select id from teste.ref limit 1 $$;
grant execute on all functions in schema teste to anon, authenticated, service_role;

-- ========== Visitante do site (anon) ==========
set role anon;
select teste.ok('anon: vê só os cafés publicados (2 de 3)', (select count(*) from public.cafes) = 2);
select teste.ok('anon: não vê pedidos', (select count(*) from public.pedidos) = 0);
select teste.ok('anon: não vê clientes', (select count(*) from public.clientes) = 0);
select teste.erro('anon: não cria pedido direto', $$insert into public.pedidos (nome, receber, pagamento, data_torra) values ('X', 'retirada', 'pix', '2026-11-24')$$);
select teste.erro('anon: não chama registrar_pedido_site', $$select public.registrar_pedido_site('{}')$$);
select teste.ok('anon: não muda preço de café', teste.linhas($$update public.cafes set preco_250 = 1$$) = 0);
select teste.erro('anon: não usa a lista da expedição', $$select * from public.lista_expedicao('2026-11-24')$$);
select teste.ok('anon: não lê o limite de envios', (select count(*) from public.limite_envios) = 0);
select teste.erro('anon: não usa o resumo da torra', $$select * from public.resumo_torra('2026-11-24')$$);
select teste.ok('anon: lê configurações (taxa)', (select taxa_entrega from public.configuracoes) = 12);
reset role;

-- ========== Função criar-pedido (service_role) ==========
set role service_role;
select teste.ok('site: pedido de entrega com preço recalculado no banco (2x54 + 170 + 12 = 290)',
  (public.registrar_pedido_site($${
    "nome": "Marta Lima", "whatsapp": "85988887777", "receber": "entrega", "pagamento": "pix-entrega",
    "endereco": "Rua A, 10", "bairro": "Meireles", "referencia": "Portão verde",
    "data_torra": "2030-01-01", "data_entrega": "2030-01-02",
    "itens": [
      {"tipo": "cafe", "id": "lote-02", "peso": 250, "moagem": "coado", "qtd": 2, "preco": 1},
      {"tipo": "cafe", "id": "lote-01", "peso": 1000, "moagem": "grao", "qtd": 1, "preco": 1}
    ]}$$::jsonb, '2026-11-22 10:00-03') ->> 'total')::numeric = 290);
reset role;
insert into teste.ref select id from public.pedidos where nome = 'Marta Lima';
set role service_role;
select teste.ok('site: a torra vem do banco, não do navegador (domingo 10h entra na terça 24/11)', (select data_torra = '2026-11-24' from public.pedidos where id = teste.p1()));
select teste.ok('site: entrega no dia seguinte à torra (quarta 25/11)', (select data_entrega = '2026-11-25' from public.pedidos where id = teste.p1()));
select teste.ok('torra: terça 17/11 de manhã cai no sábado 21/11 (feriado na sexta)', public.proxima_torra('2026-11-17 10:00-03') = '2026-11-21');
select teste.ok('torra: domingo depois das 18h passa para a sexta', public.proxima_torra('2026-11-22 18:30-03') = '2026-11-27');
select teste.ok('entrega: torra no sábado entrega na segunda', public.dia_da_entrega('2026-11-21') = '2026-11-23');
select teste.ok('site: pedido recebe código no formato TM-0000', (select codigo ~ '^TM-[0-9]{4}$' from public.pedidos where id = teste.p1()));
select teste.erro('site: café escondido não entra', $$select public.registrar_pedido_site('{"nome":"X","receber":"retirada","pagamento":"pix-retirada","data_torra":"2026-11-24","itens":[{"tipo":"cafe","id":"lote-09","peso":250,"moagem":"grao","qtd":1}]}')$$);
select teste.erro('site: entrega sem endereço é recusada', $$select public.registrar_pedido_site('{"nome":"X","receber":"entrega","pagamento":"pix-entrega","data_torra":"2026-11-24","itens":[{"tipo":"kit","moagem":"coado","qtd":1}]}')$$);
select teste.erro('site: pedido vazio é recusado', $$select public.registrar_pedido_site('{"nome":"X","receber":"retirada","pagamento":"pix","data_torra":"2026-11-24","itens":[]}')$$);
select teste.ok('site: kit na retirada sai por 129, sem taxa',
  (public.registrar_pedido_site('{"nome":"João","receber":"retirada","pagamento":"pix-retirada","itens":[{"tipo":"kit","moagem":"coado","qtd":1}]}', '2026-11-22 10:00-03') ->> 'total')::numeric = 129);
reset role;

-- ========== Atendimento (Bia) ==========
select set_config('request.jwt.claim.sub', :'bia', false);
set role authenticated;
select teste.ok('atendimento: vê os pedidos', (select count(*) from public.pedidos) = 2);
select teste.ok('atendimento: vê os clientes', (select count(*) from public.clientes) = 2);
select teste.ok('atendimento: confirma o pedido', public.avancar_status(teste.p1(), 'confirmado') = 'confirmado');
select teste.erro('atendimento: não marca como entregue', $$select public.avancar_status(teste.p1(), 'entregue')$$);
select teste.ok('atendimento: não muda preço de café', teste.linhas($$update public.cafes set preco_250 = 1$$) = 0);
select teste.ok('atendimento: não vê o histórico', (select count(*) from public.registro_acoes) = 0);
select teste.ok('atendimento: vê só a própria linha da equipe', (select count(*) from public.equipe) = 1);
select teste.ok('atendimento: não apaga pedido', teste.linhas($$delete from public.pedidos$$) = 0);
select teste.ok('atendimento: lista da torra vem vazia', (select count(*) from public.lista_torra('2026-11-24')) = 0);
select teste.ok('atendimento: registra pedido que chegou pelo WhatsApp',
  teste.linhas($$insert into public.pedidos (nome, receber, pagamento, data_torra, origem) values ('Rita', 'retirada', 'pix-retirada', '2026-11-27', 'whatsapp')$$) = 1);
select teste.erro('atendimento: não finge pedido do site', $$insert into public.pedidos (nome, receber, pagamento, data_torra, origem) values ('Rita', 'retirada', 'pix-retirada', '2026-11-27', 'site')$$);
select teste.erro('atendimento: não apaga cliente', $$select public.apagar_cliente((select id from public.clientes limit 1))$$);
reset role;

-- ========== Expedição (Davi) ==========
select set_config('request.jwt.claim.sub', :'davi', false);
set role authenticated;
select teste.ok('expedição: não lê a tabela de pedidos', (select count(*) from public.pedidos) = 0);
select teste.ok('expedição: não lê clientes', (select count(*) from public.clientes) = 0);
select teste.ok('expedição: lista da torra soma 500 g do Lote 02',
  (select gramas from public.lista_torra('2026-11-24') where cafe_id = 'lote-02') = 500);
select teste.ok('expedição: lista da torra soma 1 kg do Lote 01',
  (select gramas from public.lista_torra('2026-11-24') where cafe_id = 'lote-01') = 1000);
select teste.ok('expedição: resumo conta 1 confirmado', (select confirmados from public.resumo_torra('2026-11-24')) = 1);
select teste.ok('expedição: marca a torra feita (1 pedido confirmado)', public.marcar_torra_feita('2026-11-24') = 1);
select teste.ok('expedição: lista de entrega traz endereço e referência',
  (select referencia from public.lista_expedicao('2026-11-24') where id = teste.p1()) = 'Portão verde');
select teste.ok('expedição: lista de entrega não traz valores nem pagamento',
  not exists (select 1 from information_schema.routines r
              join information_schema.parameters p on p.specific_name = r.specific_name
              where r.routine_name = 'lista_expedicao' and p.parameter_name in ('total', 'pagamento', 'subtotal')));
select teste.ok('expedição: embala', public.avancar_status(teste.p1(), 'embalado') = 'embalado');
select teste.ok('expedição: sai para entrega', public.avancar_status(teste.p1(), 'a_caminho') = 'a_caminho');
select teste.erro('expedição: não cancela pedido', $$select public.avancar_status(teste.p1(), 'cancelado')$$);
select teste.erro('expedição: não pula etapa (a caminho para novo)', $$select public.avancar_status(teste.p1(), 'novo')$$);
select teste.ok('expedição: não muda pedido direto na tabela', teste.linhas($$update public.pedidos set total = 0$$) = 0);
reset role;

-- ========== Pessoa desativada e pessoa de fora ==========
select set_config('request.jwt.claim.sub', :'antigo', false);
set role authenticated;
select teste.ok('desativado: não vê pedidos', (select count(*) from public.pedidos) = 0);
select teste.erro('desativado: não muda status', $$select public.avancar_status((select id from public.pedidos limit 1), 'cancelado')$$);
reset role;
select set_config('request.jwt.claim.sub', :'estranho', false);
set role authenticated;
select teste.ok('de fora: não vê pedidos nem clientes', (select count(*) from public.pedidos) + (select count(*) from public.clientes) = 0);
select teste.ok('de fora: vê só o catálogo publicado', (select count(*) from public.cafes) = 2);
reset role;

-- ========== Dona (Iara) ==========
select set_config('request.jwt.claim.sub', :'dona', false);
set role authenticated;
select teste.ok('dona: vê o café escondido', (select count(*) from public.cafes) = 3);
select teste.ok('dona: muda o preço de um café', teste.linhas($$update public.cafes set preco_250 = 50 where id = 'lote-01'$$) = 1);
select teste.ok('dona: marca um feriado', teste.linhas($$insert into public.dias_fechados values ('2026-12-25', 'Natal')$$) = 1);
select teste.ok('dona: vê toda a equipe', (select count(*) from public.equipe) = 4);
select teste.ok('dona: histórico registrou mudanças de status e de preço',
  (select count(*) from public.registro_acoes where tabela in ('pedidos', 'cafes')) >= 4);
select teste.ok('dona: histórico guarda quem mudou', exists (select 1 from public.registro_acoes where quem_nome = 'Davi'));
select teste.ok('dona: não apaga o histórico', teste.linhas($$delete from public.registro_acoes$$) = 0);
select teste.erro('dona: não escreve no histórico direto', $$insert into public.registro_acoes (acao, tabela) values ('x', 'y')$$);
select teste.ok('dona: marca como entregue', public.avancar_status(teste.p1(), 'entregue') = 'entregue');
select public.apagar_cliente((select cliente_id from public.pedidos where id = teste.p1()));
select teste.ok('LGPD: cliente apagado some', (select count(*) from public.clientes where nome = 'Marta Lima') = 0);
select teste.ok('LGPD: pedido fica sem nome e sem endereço, com o valor',
  (select nome = 'Cliente removido' and endereco is null and referencia is null and total = 290 from public.pedidos where id = teste.p1()));
select teste.ok('dona: desativa uma pessoa', teste.linhas($$update public.equipe set ativo = false where nome = 'Bia'$$) = 1);
reset role;
select set_config('request.jwt.claim.sub', :'bia', false);
set role authenticated;
select teste.ok('atendimento desativado perde o acesso na hora', (select count(*) from public.pedidos) = 0);
reset role;

-- ========== Resultado ==========
\o
\set QUIET off
\pset footer off
select case when ok then 'OK     ' else 'FALHOU ' end || nome as resultado from teste.resultado order by n;
select count(*) filter (where ok) || ' de ' || count(*) || ' testes passaram' as resumo from teste.resultado;
