-- Torra Miúda: banco do painel da equipe.
-- Papéis: dona (Iara), atendimento (Bia) e expedicao (Davi).
-- Regra geral: o site (anon) só lê o catálogo; o pedido do site entra pela função
-- criar-pedido (service_role); cada papel da equipe vê e muda só o que precisa.

-- =========================================================
-- 1. Equipe e papéis
-- =========================================================
create table public.equipe (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null check (length(nome) between 2 and 60),
  papel text not null check (papel in ('dona', 'atendimento', 'expedicao')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- Papel de quem está logado (null para quem não é da equipe ou está desativado)
create function public.meu_papel() returns text
language sql stable security definer set search_path = public as $$
  select papel from public.equipe where id = auth.uid() and ativo
$$;

create function public.tem_papel(variadic papeis text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.meu_papel() = any (papeis), false)
$$;

-- =========================================================
-- 2. Catálogo (o site lê; só a dona edita)
-- =========================================================
create table public.sitios (
  numero smallint primary key check (numero between 1 and 99),
  nome text not null,
  produtor text,
  altitude integer check (altitude between 0 and 2000),
  x integer not null default 0 check (x between 0 and 760),
  y integer not null default 0 check (y between 0 and 560),
  publicado boolean not null default true
);

create table public.cafes (
  id text primary key check (id ~ '^[a-z0-9-]{3,40}$'),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),
  numero text not null,
  nome text not null check (length(nome) between 2 and 60),
  sitio smallint references public.sitios (numero) on delete set null,
  perfil text not null check (perfil in ('suave', 'equilibrado', 'encorpado')),
  leite boolean not null default false,
  espresso boolean not null default false,
  ponto numeric(3, 2) not null check (ponto between 0 and 1),
  ponto_nome text not null,
  descricao text not null check (length(descricao) between 10 and 400),
  preco_250 numeric(8, 2) not null check (preco_250 > 0),
  preco_1000 numeric(8, 2) check (preco_1000 > 0),
  estado text not null default 'disponivel' check (estado in ('disponivel', 'esgotado', 'oculto')),
  ordem smallint not null default 0,
  atualizado_em timestamptz not null default now()
);

-- Valores e estados que a equipe edita (uma linha só)
create table public.configuracoes (
  id smallint primary key default 1 check (id = 1),
  taxa_entrega numeric(8, 2) not null default 12 check (taxa_entrega >= 0),
  preco_assinatura numeric(8, 2) not null default 59 check (preco_assinatura > 0),
  preco_kit numeric(8, 2) not null default 129 check (preco_kit > 0),
  visita_data date,
  visita_vagas smallint check (visita_vagas between 0 and 50),
  visita_inscritos smallint not null default 0 check (visita_inscritos >= 0),
  campanha_titulo text check (length(campanha_titulo) <= 80),
  campanha_inicio date,
  campanha_fim date,
  google_nota text,
  google_avaliacoes integer check (google_avaliacoes >= 0),
  atualizado_em timestamptz not null default now(),
  check (campanha_fim is null or campanha_inicio is null or campanha_fim >= campanha_inicio)
);
insert into public.configuracoes (id) values (1);

-- Feriados e dias sem torra (a torra passa para o dia seguinte)
create table public.dias_fechados (
  data date primary key,
  motivo text not null check (length(motivo) between 2 and 60)
);

-- =========================================================
-- 3. Clientes, pedidos e assinaturas (dados pessoais)
-- =========================================================
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(nome) between 2 and 80),
  whatsapp text check (whatsapp ~ '^[0-9]{10,13}$'),
  criado_em timestamptz not null default now()
);

create sequence public.pedido_numero_seq;

create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique default 'TM-' || lpad(nextval('public.pedido_numero_seq')::text, 4, '0'),
  cliente_id uuid references public.clientes (id) on delete set null,
  nome text not null,
  receber text not null check (receber in ('entrega', 'retirada', 'correios')),
  pagamento text not null,
  troco text,
  endereco text,
  bairro text,
  cidade text,
  cep text check (cep is null or cep ~ '^[0-9]{8}$'),
  referencia text,
  observacao text check (length(observacao) <= 300),
  data_torra date not null,
  data_entrega date,
  subtotal numeric(10, 2) not null default 0,
  taxa numeric(8, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  pago boolean not null default false,
  status text not null default 'novo'
    check (status in ('novo', 'confirmado', 'torrado', 'embalado', 'a_caminho', 'entregue', 'cancelado')),
  origem text not null default 'site' check (origem in ('site', 'whatsapp')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (receber <> 'entrega' or (endereco is not null and bairro is not null)),
  check (receber <> 'correios' or (endereco is not null and cep is not null and cidade is not null))
);
create index pedidos_torra_idx on public.pedidos (data_torra, status);

create table public.pedido_itens (
  id bigint generated always as identity primary key,
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  tipo text not null check (tipo in ('cafe', 'kit')),
  cafe_id text references public.cafes (id) on delete set null,
  nome text not null,
  peso integer check (peso in (250, 1000)),
  moagem text not null check (moagem in ('grao', 'coado', 'prensa', 'moka', 'espresso')),
  qtd smallint not null check (qtd between 1 and 20),
  preco_unit numeric(8, 2) not null check (preco_unit >= 0),
  check (tipo <> 'cafe' or (cafe_id is not null and peso is not null))
);
create index pedido_itens_pedido_idx on public.pedido_itens (pedido_id);

-- Assinatura: controle sem cobrança automática (Pagamentos está em NÃO)
create table public.assinaturas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes (id) on delete set null,
  nome text not null,
  receber text not null check (receber in ('entrega', 'retirada', 'correios')),
  endereco text,
  bairro text,
  cidade text,
  cep text,
  moagem text not null check (moagem in ('grao', 'coado', 'prensa', 'moka', 'espresso')),
  status text not null default 'ativa' check (status in ('ativa', 'pausada', 'cancelada')),
  inicio date not null default current_date,
  observacao text check (length(observacao) <= 300),
  criado_em timestamptz not null default now()
);

create table public.assinatura_envios (
  id bigint generated always as identity primary key,
  assinatura_id uuid not null references public.assinaturas (id) on delete cascade,
  mes date not null check (extract(day from mes) = 1),
  cafe_id text references public.cafes (id) on delete set null,
  pago boolean not null default false,
  enviado boolean not null default false,
  unique (assinatura_id, mes)
);

-- Limite de envios do site (anti-spam sem script de terceiros): só a função criar-pedido usa
create table public.limite_envios (
  id bigint generated always as identity primary key,
  chave text not null,
  quando timestamptz not null default now()
);
create index limite_envios_idx on public.limite_envios (chave, quando);
alter table public.limite_envios enable row level security; -- sem regras: ninguém de fora lê nem escreve

-- =========================================================
-- 4. Histórico (ninguém altera nem apaga)
-- =========================================================
create table public.registro_acoes (
  id bigint generated always as identity primary key,
  quem uuid,
  quem_nome text,
  acao text not null,
  tabela text not null,
  registro text,
  quando timestamptz not null default now()
);

create function public.registrar(acao text, tabela text, registro text) returns void
language sql security definer set search_path = public as $$
  insert into public.registro_acoes (quem, quem_nome, acao, tabela, registro)
  values (auth.uid(), (select nome from public.equipe where id = auth.uid()), acao, tabela, registro)
$$;
revoke all on function public.registrar(text, text, text) from public, anon, authenticated;

create function public.gatilho_registro() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  linha jsonb := to_jsonb(coalesce(new, old));
  chave text;
begin
  chave := linha ->> (case tg_table_name
    when 'pedidos' then 'codigo'
    when 'cafes' then 'id'
    when 'equipe' then 'nome'
    when 'dias_fechados' then 'data'
  end);
  perform public.registrar(lower(tg_op), tg_table_name, chave);
  return coalesce(new, old);
end $$;

create function public.gatilho_atualizado() returns trigger
language plpgsql as $$
begin
  new.atualizado_em := now();
  return new;
end $$;

create trigger cafes_atualizado before update on public.cafes for each row execute function public.gatilho_atualizado();
create trigger pedidos_atualizado before update on public.pedidos for each row execute function public.gatilho_atualizado();
create trigger config_atualizado before update on public.configuracoes for each row execute function public.gatilho_atualizado();

create trigger pedidos_registro after insert or update or delete on public.pedidos for each row execute function public.gatilho_registro();
create trigger cafes_registro after insert or update or delete on public.cafes for each row execute function public.gatilho_registro();
create trigger equipe_registro after insert or update or delete on public.equipe for each row execute function public.gatilho_registro();
create trigger dias_registro after insert or delete on public.dias_fechados for each row execute function public.gatilho_registro();

-- =========================================================
-- 5. Regras de acesso (RLS)
-- =========================================================
alter table public.equipe enable row level security;
alter table public.sitios enable row level security;
alter table public.cafes enable row level security;
alter table public.configuracoes enable row level security;
alter table public.dias_fechados enable row level security;
alter table public.clientes enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedido_itens enable row level security;
alter table public.assinaturas enable row level security;
alter table public.assinatura_envios enable row level security;
alter table public.registro_acoes enable row level security;

-- Equipe: cada um vê a própria linha; a dona vê e administra todos
create policy equipe_ver on public.equipe for select to authenticated
  using (id = auth.uid() or public.tem_papel('dona'));
create policy equipe_dona on public.equipe for all to authenticated
  using (public.tem_papel('dona')) with check (public.tem_papel('dona'));

-- Catálogo: público lê o que está publicado; a equipe lê tudo; a dona edita
create policy sitios_publico on public.sitios for select to anon, authenticated
  using (publicado or public.meu_papel() is not null);
create policy sitios_dona on public.sitios for all to authenticated
  using (public.tem_papel('dona')) with check (public.tem_papel('dona'));

create policy cafes_publico on public.cafes for select to anon, authenticated
  using (estado <> 'oculto' or public.meu_papel() is not null);
create policy cafes_dona on public.cafes for all to authenticated
  using (public.tem_papel('dona')) with check (public.tem_papel('dona'));

create policy config_publico on public.configuracoes for select to anon, authenticated using (true);
create policy config_dona on public.configuracoes for update to authenticated
  using (public.tem_papel('dona')) with check (public.tem_papel('dona'));

create policy dias_publico on public.dias_fechados for select to anon, authenticated using (true);
create policy dias_dona on public.dias_fechados for all to authenticated
  using (public.tem_papel('dona')) with check (public.tem_papel('dona'));

-- Clientes, pedidos e assinaturas: dona e atendimento.
-- A expedição não lê essas tabelas: usa lista_expedicao() e avancar_status().
create policy clientes_ver on public.clientes for select to authenticated using (public.tem_papel('dona', 'atendimento'));
create policy clientes_criar on public.clientes for insert to authenticated with check (public.tem_papel('dona', 'atendimento'));
create policy clientes_mudar on public.clientes for update to authenticated
  using (public.tem_papel('dona', 'atendimento')) with check (public.tem_papel('dona', 'atendimento'));

create policy pedidos_ver on public.pedidos for select to authenticated using (public.tem_papel('dona', 'atendimento'));
create policy pedidos_criar on public.pedidos for insert to authenticated
  with check (public.tem_papel('dona', 'atendimento') and origem = 'whatsapp');
create policy pedidos_mudar on public.pedidos for update to authenticated
  using (public.tem_papel('dona', 'atendimento')) with check (public.tem_papel('dona', 'atendimento'));

create policy itens_ver on public.pedido_itens for select to authenticated using (public.tem_papel('dona', 'atendimento'));
create policy itens_criar on public.pedido_itens for insert to authenticated with check (public.tem_papel('dona', 'atendimento'));

create policy assinaturas_ver on public.assinaturas for select to authenticated using (public.tem_papel('dona', 'atendimento'));
create policy assinaturas_criar on public.assinaturas for insert to authenticated with check (public.tem_papel('dona', 'atendimento'));
create policy assinaturas_mudar on public.assinaturas for update to authenticated
  using (public.tem_papel('dona', 'atendimento')) with check (public.tem_papel('dona', 'atendimento'));
create policy assinaturas_apagar on public.assinaturas for delete to authenticated using (public.tem_papel('dona'));

create policy envios_ver on public.assinatura_envios for select to authenticated using (public.tem_papel('dona', 'atendimento'));
create policy envios_criar on public.assinatura_envios for insert to authenticated with check (public.tem_papel('dona', 'atendimento'));
create policy envios_mudar on public.assinatura_envios for update to authenticated
  using (public.tem_papel('dona', 'atendimento')) with check (public.tem_papel('dona', 'atendimento'));

-- Histórico: só a dona lê; ninguém escreve direto (só os gatilhos)
create policy registro_ver on public.registro_acoes for select to authenticated using (public.tem_papel('dona'));

-- Sem regra de delete em pedidos e clientes: pedido se cancela;
-- cliente se apaga pela função apagar_cliente() (LGPD).

-- =========================================================
-- 6. Funções do painel
-- =========================================================

-- Quem pode levar o pedido de um status para outro
create function public.pode_mudar(papel text, de text, para text) returns boolean
language sql immutable as $$
  select case
    when papel = 'dona' then de <> para
    when papel = 'atendimento' then
      (de = 'novo' and para in ('confirmado', 'cancelado'))
      or (de = 'confirmado' and para in ('novo', 'cancelado'))
    when papel = 'expedicao' then
      (de, para) in (('confirmado', 'torrado'), ('torrado', 'embalado'), ('embalado', 'a_caminho'), ('a_caminho', 'entregue'))
    else false
  end
$$;

create function public.avancar_status(p_pedido uuid, p_status text) returns text
language plpgsql security definer set search_path = public as $$
declare
  papel text := public.meu_papel();
  atual text;
begin
  if papel is null then
    raise exception 'Sem acesso ao painel' using errcode = '42501';
  end if;
  select status into atual from public.pedidos where id = p_pedido for update;
  if atual is null then
    raise exception 'Pedido não encontrado' using errcode = 'P0002';
  end if;
  if not public.pode_mudar(papel, atual, p_status) then
    raise exception 'Seu papel não pode mudar de % para %', atual, p_status using errcode = '42501';
  end if;
  update public.pedidos set status = p_status where id = p_pedido;
  return p_status;
end $$;

-- Marca como torrados todos os pedidos confirmados de uma torra
create function public.marcar_torra_feita(p_data date) returns integer
language plpgsql security definer set search_path = public as $$
declare
  quantos integer;
begin
  if not public.tem_papel('dona', 'expedicao') then
    raise exception 'Sem acesso' using errcode = '42501';
  end if;
  update public.pedidos set status = 'torrado' where data_torra = p_data and status = 'confirmado';
  get diagnostics quantos = row_count;
  return quantos;
end $$;

-- O que torrar: quilos por café numa data (pedidos confirmados)
create function public.lista_torra(p_data date)
returns table (cafe_id text, nome text, ponto numeric, gramas bigint, pacotes_250 bigint, pacotes_1000 bigint)
language sql stable security definer set search_path = public as $$
  select i.cafe_id, max(i.nome), max(c.ponto), sum(i.peso * i.qtd),
         sum(i.qtd) filter (where i.peso = 250), sum(i.qtd) filter (where i.peso = 1000)
  from public.pedido_itens i
  join public.pedidos p on p.id = i.pedido_id
  left join public.cafes c on c.id = i.cafe_id
  where public.tem_papel('dona', 'expedicao')
    and p.data_torra = p_data and p.status = 'confirmado' and i.tipo = 'cafe'
  group by i.cafe_id
  order by 2
$$;

-- Quantos pedidos da torra estão confirmados e quantos ainda faltam confirmar
create function public.resumo_torra(p_data date)
returns table (confirmados bigint, para_confirmar bigint)
language sql stable security definer set search_path = public as $$
  select count(*) filter (where status = 'confirmado'), count(*) filter (where status = 'novo')
  from public.pedidos
  where public.tem_papel('dona', 'expedicao') and data_torra = p_data
$$;

-- O que embalar e entregar: só o necessário para a expedição (sem valores, sem pagamento)
create function public.lista_expedicao(p_data date)
returns table (
  id uuid, codigo text, nome text, whatsapp text, receber text, endereco text, bairro text,
  cidade text, cep text, referencia text, observacao text, status text, itens text
)
language sql stable security definer set search_path = public as $$
  select p.id, p.codigo, p.nome, c.whatsapp, p.receber, p.endereco, p.bairro, p.cidade, p.cep,
         p.referencia, p.observacao, p.status,
         string_agg(i.qtd || 'x ' || i.nome || coalesce(', ' || i.peso || ' g', '') || ', ' || i.moagem, '; ' order by i.id)
  from public.pedidos p
  left join public.clientes c on c.id = p.cliente_id
  join public.pedido_itens i on i.pedido_id = p.id
  where public.tem_papel('dona', 'expedicao')
    and p.data_torra = p_data and p.status in ('torrado', 'embalado', 'a_caminho')
  group by p.id, c.whatsapp
  order by p.receber, p.bairro, p.codigo
$$;

-- Próxima torra para um pedido feito agora (mesma regra do site):
-- terça e sexta; corte às 18h de dois dias antes; dia sem torra passa para o seguinte.
create function public.proxima_torra(p_agora timestamptz default now()) returns date
language plpgsql stable security definer set search_path = public as $$
declare
  agora timestamp := p_agora at time zone 'America/Sao_Paulo';
  base date;
  torra date;
begin
  for d in 0..27 loop
    base := agora::date + d;
    continue when extract(dow from base) not in (2, 5);
    continue when agora > (base - 2) + time '18:00';
    torra := base;
    while exists (select 1 from public.dias_fechados where data = torra) loop
      torra := torra + 1;
    end loop;
    return torra;
  end loop;
  return null;
end $$;

-- Entrega em Fortaleza: no dia seguinte à torra; domingo passa para segunda
create function public.dia_da_entrega(p_torra date) returns date
language sql immutable as $$
  select case when extract(dow from p_torra + 1) = 0 then p_torra + 2 else p_torra + 1 end
$$;

-- Pedido do site: chamado pela função criar-pedido (service_role), nunca pelo navegador.
-- Os preços são sempre recalculados aqui, a partir do catálogo.
create function public.registrar_pedido_site(dados jsonb, p_agora timestamptz default now()) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  cfg public.configuracoes;
  novo_cliente uuid;
  novo_pedido public.pedidos;
  item jsonb;
  cafe public.cafes;
  preco numeric;
  soma numeric := 0;
  v_taxa numeric := 0;
  v_torra date := public.proxima_torra(p_agora);
begin
  select * into cfg from public.configuracoes where id = 1;
  if jsonb_array_length(coalesce(dados -> 'itens', '[]')) = 0 then
    raise exception 'Pedido sem itens' using errcode = '22023';
  end if;

  insert into public.clientes (nome, whatsapp)
  values (dados ->> 'nome', nullif(dados ->> 'whatsapp', ''))
  returning id into novo_cliente;

  v_taxa := case when dados ->> 'receber' = 'entrega' then cfg.taxa_entrega else 0 end;

  insert into public.pedidos (cliente_id, nome, receber, pagamento, troco, endereco, bairro, cidade, cep,
                              referencia, observacao, data_torra, data_entrega, taxa, origem)
  values (novo_cliente, dados ->> 'nome', dados ->> 'receber', dados ->> 'pagamento', dados ->> 'troco',
          dados ->> 'endereco', dados ->> 'bairro', dados ->> 'cidade', dados ->> 'cep', dados ->> 'referencia',
          dados ->> 'observacao', v_torra,
          case when dados ->> 'receber' = 'entrega' then public.dia_da_entrega(v_torra) end, v_taxa, 'site')
  returning * into novo_pedido;

  for item in select * from jsonb_array_elements(dados -> 'itens') loop
    if item ->> 'tipo' = 'kit' then
      preco := cfg.preco_kit;
      insert into public.pedido_itens (pedido_id, tipo, nome, moagem, qtd, preco_unit)
      values (novo_pedido.id, 'kit', 'Kit de presente', item ->> 'moagem', (item ->> 'qtd')::smallint, preco);
    else
      select * into cafe from public.cafes where id = item ->> 'id' and estado = 'disponivel';
      if cafe.id is null then
        raise exception 'Café indisponível: %', item ->> 'id' using errcode = '22023';
      end if;
      preco := case (item ->> 'peso')::int when 250 then cafe.preco_250 when 1000 then cafe.preco_1000 end;
      if preco is null then
        raise exception 'Peso indisponível para %', cafe.nome using errcode = '22023';
      end if;
      insert into public.pedido_itens (pedido_id, tipo, cafe_id, nome, peso, moagem, qtd, preco_unit)
      values (novo_pedido.id, 'cafe', cafe.id, cafe.nome, (item ->> 'peso')::int, item ->> 'moagem',
              (item ->> 'qtd')::smallint, preco);
    end if;
    soma := soma + preco * (item ->> 'qtd')::int;
  end loop;

  update public.pedidos set subtotal = soma, total = soma + v_taxa where id = novo_pedido.id;
  return jsonb_build_object('codigo', novo_pedido.codigo, 'subtotal', soma, 'taxa', v_taxa, 'total', soma + v_taxa,
                            'data_torra', v_torra);
end $$;

-- LGPD: apaga o cliente e tira os dados pessoais dos pedidos dele (os valores ficam)
create function public.apagar_cliente(p_cliente uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.tem_papel('dona') then
    raise exception 'Só a dona pode apagar dados de cliente' using errcode = '42501';
  end if;
  update public.pedidos
     set nome = 'Cliente removido', endereco = null, bairro = null, cep = null, referencia = null,
         observacao = null, troco = null,
         receber = 'retirada' -- sem endereço, a linha precisa de um jeito de receber que não exija endereço
   where cliente_id = p_cliente;
  update public.assinaturas
     set nome = 'Cliente removido', endereco = null, bairro = null, cidade = null, cep = null, observacao = null
   where cliente_id = p_cliente;
  delete from public.clientes where id = p_cliente;
  perform public.registrar('apagar_cliente', 'clientes', null);
end $$;

-- =========================================================
-- 7. Permissões das funções
-- =========================================================
revoke all on function public.registrar_pedido_site(jsonb, timestamptz) from public, anon, authenticated;
grant execute on function public.registrar_pedido_site(jsonb, timestamptz) to service_role;

revoke all on function public.avancar_status(uuid, text) from public, anon;
revoke all on function public.marcar_torra_feita(date) from public, anon;
revoke all on function public.lista_torra(date) from public, anon;
revoke all on function public.lista_expedicao(date) from public, anon;
revoke all on function public.resumo_torra(date) from public, anon;
revoke all on function public.apagar_cliente(uuid) from public, anon;
grant execute on function public.avancar_status(uuid, text), public.marcar_torra_feita(date),
  public.lista_torra(date), public.lista_expedicao(date), public.resumo_torra(date),
  public.apagar_cliente(uuid) to authenticated;
