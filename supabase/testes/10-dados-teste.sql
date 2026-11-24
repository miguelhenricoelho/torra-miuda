-- Dados de teste: 3 pessoas da equipe, 1 desativada e 1 de fora
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'iara@teste'),
  ('00000000-0000-0000-0000-00000000000b', 'bia@teste'),
  ('00000000-0000-0000-0000-00000000000c', 'davi@teste'),
  ('00000000-0000-0000-0000-00000000000d', 'antigo@teste'),
  ('00000000-0000-0000-0000-00000000000e', 'estranho@teste');
insert into public.equipe (id, nome, papel, ativo) values
  ('00000000-0000-0000-0000-00000000000a', 'Iara', 'dona', true),
  ('00000000-0000-0000-0000-00000000000b', 'Bia', 'atendimento', true),
  ('00000000-0000-0000-0000-00000000000c', 'Davi', 'expedicao', true),
  ('00000000-0000-0000-0000-00000000000d', 'Antigo', 'atendimento', false);
insert into public.sitios (numero, nome) values (1, 'Sítio 1'), (2, 'Sítio 2');
insert into public.cafes (id, slug, numero, nome, sitio, perfil, leite, espresso, ponto, ponto_nome, descricao, preco_250, preco_1000, estado) values
  ('lote-01', 'lote-01', '01', 'Lote 01', 1, 'suave', false, false, 0.4, 'clara para média', 'Leve e adocicado, com final limpo.', 48, 170, 'disponivel'),
  ('lote-02', 'lote-02', '02', 'Lote 02', 2, 'equilibrado', true, true, 0.55, 'média', 'Corpo médio e final de chocolate.', 54, 190, 'disponivel'),
  ('lote-09', 'lote-09', '09', 'Lote 09', 2, 'encorpado', true, true, 0.7, 'escura', 'Lote ainda em prova, escondido.', 60, null, 'oculto');
insert into public.dias_fechados (data, motivo) values ('2026-11-20', 'Consciência Negra');
