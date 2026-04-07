# Suite de Testes E2E — User (`/users` e `/schools/:schoolId/users`)

Testes E2E (endpoint) que validam toda a regra de negócio das rotas de User.

Arquivo: `src/tests/routes/userRoutes.test.js`

## Visão de Fluxo e Regras de Negócio

| Regra | Comportamento Atual do Sistema | Impacto na Suite E2E |
| :--- | :--- | :--- |
| Dupla camada de segurança | Todas as rotas passam por `AuthMiddleware` e `AuthPermission`. | Validar separadamente: token ausente/inválido, falta de role e falta de permissão. |
| Controle por role + permissão | O acesso depende de `memberships.role` **e** flags de permissão por rota/método. | Um usuário com role compatível ainda pode tomar `403` se a permissão de rota estiver inativa. |
| Validação Zod | Erros de validação retornam `400` (não `422`). | Todos os cenários de schema/ID/query inválidos devem esperar `400`. |
| Schemas não-strict | Chaves extras em body/query não são rejeitadas; são ignoradas. | Incluir cenários garantindo que campos extras não quebram a requisição. |
| `POST /schools/:schoolId/users` com email existente | Não cria novo usuário; apenas adiciona novo membership na escola alvo. | Validar que `_id` permanece o mesmo e memberships aumenta. |
| `PATCH /users/:id` | Campos `email` e `password` são ignorados no update. | Validar que tentar alterá-los não muda o valor persistido. |
| `DELETE /users/:id` | Soft delete: define `active=false`; operação é idempotente na prática. | Validar que segunda exclusão ainda responde `200` com usuário inativo. |
| Filtros de listagem | `GET /schools/:schoolId/users` usa paginação/filtro por nome, email, role e active. | Validar paginação, limite e filtros combinados. |

## Massa de Dados Recomendada

| Entidade | Objetivo nos testes |
| :--- | :--- |
| Admin global com permissões ativas de `users` e `schools` | Executar cenários felizes de todos os endpoints. |
| Teacher da escola A com permissão de `schools` ativa | Executar cenários de leitura em escopo escolar. |
| Teacher sem permissão de `users` ativa | Validar `403` mesmo com role permitida em `/users/:id`. |
| Parent/Student da escola A | Validar bloqueios por role em endpoints administrativos. |
| Escola única do sistema | Validar escopo por `schoolId` da escola existente e filtros de membership. |
| Usuário já existente por email | Validar fluxo de vinculação de membership sem novo cadastro. |

## POST /users — Criação de Usuário Admin Global

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Cenários felizes** |  |  |  |
| Admin cria usuário admin com payload válido | Deve criar usuário com `201`, `memberships: []`, `active=true` (default) e sem `password` na resposta. | Fazer `POST /users` autenticado como admin com `{ full_name, email, password }`. | Retorna `201`; `data._id` presente; `data.email` igual ao enviado; `data.memberships` vazio; `data.password` ausente. |
| Admin cria usuário com `active=false` explícito | Deve persistir estado inativo já na criação. | Fazer `POST /users` com `active: false`. | Retorna `201`; `data.active=false`. |
| Campo extra no body | Não deve falhar por schema strict; campo extra é ignorado. | Fazer `POST /users` com campo adicional, ex.: `foo`. | Retorna `201`; campo extra não impacta criação. |
| **Cenários tristes** |  |  |  |
| Email já existente | Deve rejeitar por duplicidade. | Repetir `POST /users` com mesmo `email`. | Retorna `409`; mensagem inclui "Email já está em uso.". |
| `full_name` vazio | Deve rejeitar por validação Zod. | `POST /users` com `full_name: ""`. | Retorna `400`; erro de validação em `full_name`. |
| `full_name` > 100 caracteres | Deve rejeitar por validação Zod. | Enviar nome com 101+ caracteres. | Retorna `400`. |
| Email inválido | Deve rejeitar por validação Zod. | Enviar `email` fora de formato. | Retorna `400`; erro de validação de email. |
| Senha fraca (sem número/letra/especial) | Deve rejeitar por regex de senha. | Enviar senha fora da política. | Retorna `400`; erro de validação de senha. |
| Sem token | Deve bloquear na autenticação. | Fazer requisição sem `Authorization`. | Retorna `498` (token não informado/inválido). |
| Token em formato não Bearer | Pode passar no `AuthMiddleware`, mas falha no `AuthPermission`. | Enviar `Authorization` com token cru (sem `Bearer`). | Retorna `401` no `AuthPermission`. |
| Usuário sem role admin | Deve negar por política de role global. | Fazer `POST /users` com teacher/parent/student. | Retorna `403`. |
| Usuário com role admin mas sem permissão ativa da rota `users.post` | Deve negar por permissão de rota. | Desativar permissão de `post` em `users` para o usuário e chamar endpoint. | Retorna `403`; mensagem de permissão negada. |

## POST /schools/:schoolId/users — Criação/Vinculação de Usuário na Escola

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Cenários felizes** |  |  |  |
| Admin cria novo usuário com membership na escola | Deve criar usuário com membership `{ school_id, role, class_id, associated_students }`. | Fazer `POST /schools/{schoolA}/users` com payload válido de `UserSchema`. | Retorna `201`; `data.memberships` contém 1 item com `school_id=schoolA` e `role` enviado. |
| Criação sem `password` | Deve gerar senha temporária internamente e persistir hash. | Fazer `POST` sem `password`. | Retorna `201`; usuário criado; login com senha desconhecida não deve ser parte do teste (senha não retorna). |
| Email já existente sem vínculo com a escola | Deve apenas anexar novo membership ao usuário existente. | Criar usuário global (sem membership escolar) e chamar `POST` na escola com mesmo email. | Retorna `201`; `_id` do usuário permanece igual; quantidade de memberships aumenta. |
| Membership de parent com `associated_students` | Deve aceitar array de IDs no membership. | Fazer `POST` com `role: parent` e estudantes associados válidos (ObjectId). | Retorna `201`; membership contém `associated_students` enviados. |
| Membership de student com `class_id` | Deve aceitar `class_id` e persistir no membership. | Fazer `POST` com `role: student` e `class_id` válido. | Retorna `201`; membership contém `class_id`. |
| Campo extra no body | Campo desconhecido não deve invalidar requisição. | Enviar payload com chave extra. | Retorna `201`; campo extra ignorado. |
| **Cenários tristes** |  |  |  |
| `schoolId` com formato inválido | Deve rejeitar antes da regra de negócio. | Fazer `POST /schools/abc/users`. | Retorna `400`; erro de validação de ID. |
| Usuário já vinculado à mesma escola | Deve impedir duplicidade de vínculo. | Repetir `POST` para email já membro da mesma escola. | Retorna `409`; mensagem "Usuário já vinculado a esta escola." |
| `role` inválido | Deve rejeitar por enum do schema. | Enviar `role: "coordinator"`. | Retorna `400`. |
| `associated_students` com ID inválido | Deve rejeitar por schema. | Enviar array com ID fora do padrão ObjectId. | Retorna `400`. |
| `class_id` inválido | Deve rejeitar por schema. | Enviar `class_id` inválido. | Retorna `400`. |
| Sem token | Deve bloquear na autenticação. | Fazer requisição sem header de auth. | Retorna `498`. |
| Teacher tentando criar usuário na escola | Role teacher não pode `POST` em `/schools/:schoolId/users`. | Fazer request autenticado como teacher da escola. | Retorna `403`. |
| Parent/Student tentando criar usuário | Deve negar por role escolar. | Fazer request como parent/student. | Retorna `403`. |

## GET /schools/:schoolId/users — Listagem de Usuários por Escola

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Cenários felizes** |  |  |  |
| Admin lista usuários da escola | Deve retornar paginação da escola informada. | Fazer `GET /schools/{schoolA}/users` como admin. | Retorna `200`; `data.docs` array; todos com membership em `schoolA`. |
| Teacher da escola lista usuários da própria escola | Deve permitir listagem no escopo da escola em que é teacher. | Fazer `GET` com teacher pertencente a `schoolA`. | Retorna `200`. |
| Filtro por `full_name` (parcial/case-insensitive) | Deve filtrar por regex no nome. | Criar nomes distintos e consultar `?full_name=ana`. | Retorna `200`; apenas usuários aderentes ao filtro. |
| Filtro por `email` | Deve filtrar por regex no email. | Consultar `?email=@escola.com`. | Retorna `200`; itens aderentes ao email filtrado. |
| Filtro por `role` | Deve filtrar membership por role dentro da escola. | Consultar `?role=teacher`. | Retorna `200`; docs possuem membership `teacher` em `schoolId`. |
| Filtro por `active=true` e `active=false` | Deve aplicar filtro de status. | Criar ativo/inativo e consultar ambas opções. | Retorna `200`; resultado respeita status solicitado. |
| Paginação padrão | Deve assumir `page=1` e `limit=10`. | Chamar sem query de paginação. | Retorna `200`; metadados condizentes com padrão. |
| Paginação customizada | Deve respeitar `page` e `limit`. | Chamar `?page=2&limit=2` com massa >2. | Retorna `200`; `page=2`, `limit=2`. |
| Parser numérico permissivo | `parseInt` aceita sufixo alfanumérico. | Chamar `?page=2abc&limit=3xyz`. | Retorna `200`; paginação efetiva com `2` e `3`. |
| Query com campo extra desconhecido | Não deve falhar por strict; campo é ignorado. | Chamar `?foo=bar`. | Retorna `200`; sem erro por chave desconhecida. |
| **Cenários tristes** |  |  |  |
| `schoolId` inválido | Deve rejeitar por validação de params. | Chamar `GET /schools/abc/users`. | Retorna `400`. |
| `role` fora do enum | Deve rejeitar por validação de query. | Chamar `?role=coordinator`. | Retorna `400`. |
| `active` fora de `true/false` | Deve rejeitar por validação de query. | Chamar `?active=1`. | Retorna `400`. |
| `page=0` | Deve rejeitar por validação de query. | Chamar `?page=0`. | Retorna `400`. |
| `limit=0` | Deve rejeitar por validação de query. | Chamar `?limit=0`. | Retorna `400`. |
| `limit>100` | Deve rejeitar por validação de query. | Chamar `?limit=101`. | Retorna `400`. |
| Sem token | Deve bloquear autenticação. | Chamar sem header `Authorization`. | Retorna `498`. |
| Teacher sem vínculo com a escola da rota | Deve negar por política school-scoped. | Teacher sem membership na escola única chama a listagem. | Retorna `403`. |
| Parent/Student tentando listar | Deve negar por role. | Chamar com parent/student. | Retorna `403`. |
| Usuário sem permissão `schools.get` ativa | Mesmo com role adequada, deve negar. | Desativar permissão e chamar endpoint. | Retorna `403`. |

## GET /users/:id — Detalhe de Usuário

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Cenários felizes** |  |  |  |
| Admin consulta usuário existente | Deve retornar detalhes completos (sem campos sensíveis `select:false`). | Fazer `GET /users/{id}` como admin. | Retorna `200`; `data._id` igual ao solicitado; `password` ausente. |
| Consulta de usuário inativo | Endpoint não filtra por `active`; deve retornar mesmo inativo. | Inativar usuário e consultar por ID. | Retorna `200`; `data.active=false`. |
| **Cenários tristes** |  |  |  |
| ID inválido | Deve rejeitar na validação de path. | `GET /users/abc`. | Retorna `400`. |
| ID válido inexistente | Repositório lança recurso não encontrado. | `GET /users/000000000000000000000000`. | Retorna `404`; mensagem de recurso `User` não encontrado. |
| Sem token | Deve bloquear autenticação. | Requisição sem auth. | Retorna `498`. |
| Teacher com role permitida mas sem permissão `users.get` | Deve negar por camada de permissão. | Teacher padrão (sem permissão de users) chama endpoint. | Retorna `403`. |
| Parent/Student | Role global não permitida para `GET /users/:id`. | Chamar com parent/student. | Retorna `403`. |

## PATCH /users/:id — Atualização de Usuário

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Cenários felizes** |  |  |  |
| Admin atualiza `full_name` | Deve persistir novo nome e retornar usuário atualizado. | Fazer `PATCH /users/{id}` com `{ full_name }`. | Retorna `200`; `data.full_name` atualizado. |
| Admin atualiza `active` | Deve alternar status do usuário. | Fazer `PATCH` com `{ active: false }` e depois `{ active: true }`. | Retorna `200` em ambas; valor refletido na resposta. |
| Admin substitui `memberships` | Update sobrescreve array de memberships com payload enviado. | Fazer `PATCH` com novo array completo de memberships. | Retorna `200`; `data.memberships` igual ao payload normalizado. |
| Body vazio `{}` | Schema permite parcial sem obrigatoriedade mínima. | Fazer `PATCH` com body vazio. | Retorna `200`; sem erro de validação. |
| Envio de `email` e `password` no payload | Campos são ignorados pelo service; não devem ser alterados. | Fazer `PATCH` enviando `{ email, password, full_name }`. | Retorna `200`; `full_name` muda; `email` e `password` permanecem inalterados. |
| Campo extra no body | Não deve falhar por strict; extra é ignorado. | Enviar `{ full_name, foo: "bar" }`. | Retorna `200`. |
| **Cenários tristes** |  |  |  |
| ID inválido | Deve rejeitar por validação de path. | `PATCH /users/abc`. | Retorna `400`. |
| ID inexistente | Deve retornar recurso não encontrado. | `PATCH /users/000000000000000000000000`. | Retorna `404`. |
| `full_name` vazio | Deve rejeitar por validação Zod. | Enviar `{ full_name: "" }`. | Retorna `400`. |
| `full_name` > 100 | Deve rejeitar por validação. | Enviar nome 101+ chars. | Retorna `400`. |
| `memberships` com `role` inválido | Deve rejeitar por enum. | Enviar membership com role inválida. | Retorna `400`. |
| `memberships` com `school_id` inválido | Deve rejeitar por regex ObjectId. | Enviar `school_id` inválido. | Retorna `400`. |
| Sem token | Deve bloquear autenticação. | Requisição sem auth. | Retorna `498`. |
| Teacher/Parent/Student tentando atualizar | Endpoint exige admin global. | Chamar como não-admin. | Retorna `403`. |
| Admin sem permissão `users.patch` ativa | Deve negar por camada de permissão. | Desativar permissão e chamar endpoint. | Retorna `403`. |

## DELETE /users/:id — Inativação (Soft Delete)

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Cenários felizes** |  |  |  |
| Admin desativa usuário ativo | Deve definir `active=false` e retornar sucesso. | Fazer `DELETE /users/{id}` para usuário ativo. | Retorna `200`; `data.active=false`; mensagem "Usuário desativado com sucesso." |
| Exclusão idempotente em usuário já inativo | Nova chamada mantém usuário inativo e continua sucesso. | Executar `DELETE` duas vezes no mesmo `id`. | Ambas retornam `200`; `active` permanece `false`. |
| Usuário continua consultável após delete | Como é soft delete, `GET /users/:id` ainda retorna usuário. | Deletar e depois consultar por ID. | `GET` retorna `200` com `active=false`. |
| **Cenários tristes** |  |  |  |
| ID inválido | Deve rejeitar por validação de path. | `DELETE /users/abc`. | Retorna `400`. |
| ID inexistente | Deve retornar not found. | `DELETE /users/000000000000000000000000`. | Retorna `404`. |
| Sem token | Deve bloquear autenticação. | Requisição sem auth. | Retorna `498`. |
| Teacher/Parent/Student tentando excluir | Endpoint exige admin global. | Chamar como não-admin. | Retorna `403`. |
| Admin sem permissão `users.delete` ativa | Deve negar por camada de permissão. | Desativar permissão e chamar endpoint. | Retorna `403`. |

## Cenários Transversais Obrigatórios (E2E)

| Tema | Verificação E2E |
| :--- | :--- |
| Contrato padrão de resposta | Em sucesso: `error=false`, `code`, `message`, `data`, `errors=[]`. Em erro: `error=true`, `data=null`, `errors` preenchido quando aplicável. |
| Mensagens de erro de validação | Confirmar prefixo "Erro de validação." e detalhes com `path`/`message`. |
| Sensibilidade de autenticação | Cobrir ausência de token (`498`), token inválido (`498`) e header sem prefixo Bearer (`401` em `AuthPermission`). |
| Permissão por rota no banco | Cobrir cenário em que rota existe, role bate, mas permissão por método está inativa (`403`). |
| Dependência de rota cadastrada | Se entrada `route+domain` não existir na coleção de rotas, requisição deve falhar com `404` ("Rota não encontrado(a)."). |

## Estratégia de Organização dos Testes E2E

| Bloco | Objetivo |
| :--- | :--- |
| `describe('POST /users')` | Validar criação de admin global, duplicidade e validação de schema. |
| `describe('POST /schools/:schoolId/users')` | Validar criação escolar, vinculação por email existente e regras de role escolar. |
| `describe('GET /schools/:schoolId/users')` | Validar filtros, paginação e escopo por escola. |
| `describe('GET /users/:id')` | Validar consulta por id, inativo e bloqueios de autorização. |
| `describe('PATCH /users/:id')` | Validar update parcial, ignorar email/senha e validações de memberships. |
| `describe('DELETE /users/:id')` | Validar soft delete e idempotência do endpoint. |

## Observações de Implementação para os Casos E2E

| Ponto | Diretriz |
| :--- | :--- |
| IDs válidos para testes de 404 | Usar `000000000000000000000000` para manter ObjectId válido e inexistente. |
| Massa para permissões | Preparar usuário de teste com permissão desligada em `users` para validar `403` por permissão. |
| Evitar flakiness de paginação | Criar dados com sufixo único por timestamp e limpar massa ao final quando aplicável. |
| Verificação de senha | Nunca esperar `password` em retorno do endpoint; validar ausência do campo na resposta. |
