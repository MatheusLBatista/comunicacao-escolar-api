# Suite de Testes E2E — Conversations (`/schools/:schoolId/conversations` e `/conversations/:id`)

Testes E2E (endpoint) que validam toda a regra de negócio das rotas de Conversation.

Arquivo: `src/tests/routes/conversationRoutes.test.js`

## Visão de Fluxo e Regras de Negócio

| Regra | Comportamento Atual do Sistema | Impacto na Suite E2E |
| :--- | :--- | :--- |
| Dupla camada de segurança | Todas as rotas passam por `AuthMiddleware` e `AuthPermission`. | Validar separadamente: token ausente/inválido (`498`), header sem prefixo Bearer (`401`) e falta de permissão (`403`). |
| Permissão por rota/método | `AuthPermission` usa o primeiro segmento da URL para resolver a rota no banco e validar método ativo. | Cobrir falta de permissão em `schools.get/post` e `conversations.get`, além de rota ausente (`404`) ou método inativo (`403`). |
| Sem política de role específica para conversations | Não há regra em `accessPolicies` para `/schools/:schoolId/conversations` e `/conversations/:id`. | O bloqueio principal vira permissão no banco + regras de participante da conversa. |
| Validação Zod | IDs inválidos e query/body inválidos retornam `400`. | Cobrir `schoolId`/`id`/`participant_id` inválidos, `type` fora do enum e paginação inválida. |
| Schemas não-strict | Chaves extras em body/query não são rejeitadas; são ignoradas. | Incluir cenários com campos extras para garantir ausência de falha. |
| `POST /schools/:schoolId/conversations` idempotente por participantes | Se já existir conversa ativa com o mesmo par de participantes na escola, retorna a conversa existente com `200`. | Validar criação inicial (`201`) e repetição (`200`) com mesmo `_id`. |
| Regra de participante no create | Não permite criar conversa consigo mesmo; participante deve pertencer à escola. | Cobrir erros de negócio `400` (mesmo usuário) e `403` (participante fora da escola). |
| Escopo de listagem | `GET /schools/:schoolId/conversations` retorna apenas conversas ativas onde o usuário autenticado é participante. | Validar que a listagem não expõe conversas de terceiros, mesmo na mesma escola. |
| Ordenação e paginação | Conversations são ordenadas por `last_message_at` desc com default `page=1`, `limit=10`, max `100`. | Validar metadados de paginação e ordenação esperada. |
| Detalhe por ID exige participação | `GET /conversations/:id` retorna `403` para não participantes. | Cobrir cenário com usuário autenticado sem participação na conversa. |

## Massa de Dados Recomendada

| Entidade | Objetivo nos testes |
| :--- | :--- |
| Escola A existente | Base para cenários de criação/listagem de conversas. |
| Usuário A (ator principal) com permissão de `schools` e `conversations` ativas | Executar cenários felizes de create/list/getById. |
| Usuário B membro da Escola A | Ser participante válido da conversa em cenários felizes. |
| Usuário C fora da Escola A | Validar regra de participante fora da escola (`403`). |
| Usuário D não participante da conversa criada | Validar bloqueio em `GET /conversations/:id` (`403`). |
| Conversa preexistente ativa entre A e B | Validar comportamento idempotente do `findOrCreate` (`200`). |

## POST /schools/:schoolId/conversations — Criar ou Reutilizar Conversa

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Cenários felizes** |  |  |  |
| Criação de nova conversa `private` | Deve criar conversa com `201`, `school_id`, `participants` e `type` coerentes. | Fazer `POST /schools/{schoolA}/conversations` com `participant_id` válido. | Retorna `201`; `data._id` presente; `data.type=private` (default). |
| Criação com `type=daily_log_reply` | Deve persistir tipo informado. | Fazer `POST` com `type: daily_log_reply`. | Retorna `201`; `data.type=daily_log_reply`. |
| Repetição com mesmo par de participantes | Não cria duplicata; retorna conversa já existente com `200`. | Repetir `POST` para mesma escola e mesmos participantes. | Retorna `200`; `_id` igual ao da primeira criação. |
| Campo extra no body | Campo desconhecido é ignorado. | Enviar body com chave extra (`foo`). | Retorna `201` (ou `200` no caso idempotente) sem erro de schema. |
| **Cenários tristes** |  |  |  |
| `schoolId` inválido | Deve rejeitar por validação de params. | `POST /schools/abc/conversations`. | Retorna `400`; erro de validação de ID. |
| `participant_id` inválido | Deve rejeitar por schema de ObjectId. | Enviar `participant_id` fora do padrão 24 hex. | Retorna `400`. |
| `type` fora do enum | Deve rejeitar por validação Zod. | Enviar `type: group`. | Retorna `400`. |
| Participante inexistente (ID válido) | Repositório de usuário retorna não encontrado. | Enviar `participant_id=000000000000000000000000`. | Retorna `404`; recurso `User` não encontrado. |
| Escola inexistente (ID válido) | Repositório de escola retorna não encontrado. | Usar `schoolId=000000000000000000000000`. | Retorna `404`; recurso `School` não encontrado. |
| Criar conversa consigo mesmo | Regra de negócio impede self-conversation. | Enviar `participant_id` igual ao `req.user_id`. | Retorna `400`; mensagem inclui "Não é possível criar uma conversa consigo mesmo." |
| Participante fora da escola alvo | Deve negar por regra de negócio de vínculo escolar. | Enviar usuário existente sem membership na escola da rota. | Retorna `403`; mensagem inclui "O participante não pertence a esta escola." |
| Sem token | Deve bloquear autenticação. | Requisição sem `Authorization`. | Retorna `498`. |
| Header sem Bearer | `AuthMiddleware` pode aceitar token cru, mas `AuthPermission` exige prefixo Bearer. | Enviar `Authorization: <token>`. | Retorna `401`. |
| Sem permissão `schools.post` ativa | Deve negar na camada de permissão. | Desativar permissão da rota/método e chamar endpoint. | Retorna `403`. |

## GET /schools/:schoolId/conversations — Listagem por Escola (Escopo do Usuário)

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Cenários felizes** |  |  |  |
| Listar conversas da escola no escopo do usuário | Deve retornar apenas conversas ativas da escola em que o usuário autenticado participa. | Fazer `GET /schools/{schoolA}/conversations`. | Retorna `200`; `data.docs` somente com conversas da escola e contendo o usuário em `participants`. |
| Filtro por `type` | Deve filtrar por `private` ou `daily_log_reply`. | Consultar `?type=private` e `?type=daily_log_reply`. | Retorna `200`; docs aderentes ao filtro. |
| Paginação padrão | Deve assumir `page=1` e `limit=10`. | Chamar sem query de paginação. | Retorna `200`; metadados condizentes com padrão. |
| Paginação customizada | Deve respeitar `page` e `limit` válidos. | Chamar `?page=2&limit=2` com massa suficiente. | Retorna `200`; `page=2`, `limit=2`. |
| Query com campo extra | Campo desconhecido deve ser ignorado. | Chamar `?foo=bar`. | Retorna `200`; sem erro de validação por chave extra. |
| **Cenários tristes** |  |  |  |
| `schoolId` inválido | Deve rejeitar por validação de params. | `GET /schools/abc/conversations`. | Retorna `400`. |
| `type` inválido | Deve rejeitar por enum da query. | Chamar `?type=group`. | Retorna `400`. |
| `page=0` | Deve rejeitar por validação de query. | Chamar `?page=0`. | Retorna `400`. |
| `limit=0` | Deve rejeitar por validação de query. | Chamar `?limit=0`. | Retorna `400`. |
| `limit>100` | Deve rejeitar por validação de query. | Chamar `?limit=101`. | Retorna `400`. |
| `page=2abc`/`limit=3xyz` | `z.coerce.number()` não aceita sufixo alfanumérico. | Chamar `?page=2abc&limit=3xyz`. | Retorna `400`. |
| Sem token | Deve bloquear autenticação. | Requisição sem header de auth. | Retorna `498`. |
| Header sem Bearer | Deve falhar em `AuthPermission`. | Enviar token sem prefixo Bearer. | Retorna `401`. |
| Sem permissão `schools.get` ativa | Deve negar por camada de permissão. | Desativar permissão e chamar endpoint. | Retorna `403`. |

## GET /conversations/:id — Detalhe de Conversa

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Cenários felizes** |  |  |  |
| Participante consulta conversa existente | Deve retornar conversa com participantes populados (`full_name`, `email`). | Fazer `GET /conversations/{id}` como participante. | Retorna `200`; `data._id` igual ao solicitado; `participants` populado. |
| Conversa com `last_message_at` nulo | Deve retornar mesmo sem mensagens enviadas. | Consultar conversa recém criada sem mensagens. | Retorna `200`; `data.last_message_at=null`. |
| **Cenários tristes** |  |  |  |
| ID inválido | Deve rejeitar por validação de path. | `GET /conversations/abc`. | Retorna `400`. |
| ID válido inexistente | Repositório retorna recurso não encontrado. | `GET /conversations/000000000000000000000000`. | Retorna `404`; mensagem de `Conversation` não encontrado(a). |
| Usuário não participante | Deve negar acesso ao detalhe da conversa. | Chamar com usuário fora dos participantes. | Retorna `403`; mensagem inclui "Você não é participante desta conversa." |
| Sem token | Deve bloquear autenticação. | Requisição sem auth. | Retorna `498`. |
| Header sem Bearer | Deve falhar em `AuthPermission`. | Enviar token cru em `Authorization`. | Retorna `401`. |
| Sem permissão `conversations.get` ativa | Deve negar por camada de permissão. | Desativar permissão da rota `conversations` para `get`. | Retorna `403`. |

## Cenários Transversais Obrigatórios (E2E)

| Tema | Verificação E2E |
| :--- | :--- |
| Contrato padrão de resposta | Em sucesso: `error=false`, `code`, `message`, `data`, `errors=[]`. Em erro: `error=true`, `data=null`, `errors` preenchido quando aplicável. |
| Mensagens de validação | Confirmar prefixo "Erro de validação." com detalhes em `errors[].path` e `errors[].message`. |
| Sensibilidade de autenticação | Cobrir ausência de token (`498`), token inválido (`498`) e header sem Bearer (`401`). |
| Permissão por rota no banco | Cobrir cenário com permissão de método inativa (`403`) e rota ausente (`404`). |
| Escopo de participante | Cobrir que operações de detalhe/lista respeitam participação do usuário autenticado. |

## Estratégia de Organização dos Testes E2E

| Bloco | Objetivo |
| :--- | :--- |
| `describe('POST /schools/:schoolId/conversations')` | Validar criação, idempotência, validação e regras de participante. |
| `describe('GET /schools/:schoolId/conversations')` | Validar filtros, paginação e escopo por participante na escola. |
| `describe('GET /conversations/:id')` | Validar detalhe da conversa, bloqueios de não participante e autorização/permissão. |

## Observações de Implementação para os Casos E2E

| Ponto | Diretriz |
| :--- | :--- |
| IDs válidos para testes de 404 | Usar `000000000000000000000000` para manter ObjectId válido e inexistente. |
| Massa para permissão | Preparar usuário com permissão desligada em `schools` e `conversations` para validar `403`. |
| Validar idempotência | No segundo `POST`, comparar `_id` com a conversa criada no primeiro request. |
| Evitar flakiness de paginação | Criar massa com sufixo único por timestamp e ordenar asserções com base no payload retornado. |
