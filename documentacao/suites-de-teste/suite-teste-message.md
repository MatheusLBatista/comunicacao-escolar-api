# Suite de Testes E2E — Messages (`/conversations/:conversationId/messages` e `/conversations/:conversationId/messages/read`)

Testes E2E (endpoint) que validam toda a regra de negócio das rotas de Message.

Arquivo: `src/tests/routes/messageRoutes.test.js`

## Visão de Fluxo e Regras de Negócio

| Regra | Comportamento Atual do Sistema | Impacto na Suite E2E |
| :--- | :--- | :--- |
| Dupla camada de segurança | Todas as rotas passam por `AuthMiddleware` e `AuthPermission`. | Validar ausência/invalidade de token (`498`), header sem Bearer (`401`) e falta de permissão (`403`). |
| Permissão por rota `conversations` | `AuthPermission` usa o primeiro segmento da URL (`conversations`) para permissão por método. | Cobrir bloqueios em `conversations.get/post/patch` e dependência de rota cadastrada no banco. |
| Requisito de participação | Todas as operações de message exigem que o usuário seja participante da conversa. | Cobrir `403` para usuário não participante em `list/send/markAsRead`. |
| Validação Zod de params/body/query | `conversationId` inválido e query/body inválidos retornam `400`. | Cobrir invalidações de ID, texto vazio e pagina/limite inválidos. |
| Schemas não-strict | Chaves extras em body/query não são rejeitadas; são ignoradas. | Incluir cenários com campos extras em envio e listagem. |
| Envio de mensagem | `send` cria mensagem com `read_by` inicial do próprio remetente e atualiza `last_message_at` da conversa. | Validar `201`, estrutura de `read_by` e reflexo no timestamp da conversa. |
| Listagem de mensagens | `list` retorna somente mensagens ativas da conversa, ordenadas por `sent_at` desc, com paginação. | Validar ordenação, metadados e defaults `page=1`, `limit=10`, max `100`. |
| Marcar como lida | `markAsRead` marca apenas mensagens ativas de outros usuários ainda não lidas pelo usuário atual. | Validar contador `marked`, idempotência (segunda chamada tende a `0`) e exclusão de mensagens próprias. |

## Massa de Dados Recomendada

| Entidade | Objetivo nos testes |
| :--- | :--- |
| Escola A com conversa ativa entre Usuário A e Usuário B | Base de cenários felizes para send/list/read. |
| Usuário A (ator principal) com permissões `conversations.get/post/patch` ativas | Executar operações de mensagens na própria conversa. |
| Usuário B (outro participante) | Gerar mensagens não lidas para validar `markAsRead`. |
| Usuário C não participante da conversa | Validar bloqueios por regra de participante (`403`). |
| Conversa válida sem mensagens iniciais | Validar envio inicial e evolução de `last_message_at`. |
| Mensagens pré-criadas de A e B | Validar ordenação, paginação e contabilização correta de leitura. |

## POST /conversations/:conversationId/messages — Envio de Mensagem

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Cenários felizes** |  |  |  |
| Participante envia mensagem válida | Deve criar mensagem com `201` e dados do remetente. | Fazer `POST /conversations/{id}/messages` com `{ text }`. | Retorna `201`; `data._id` presente; `data.text` igual ao enviado; `data.sender_id` igual ao usuário autenticado. |
| `read_by` inicial contém remetente | Mensagem nasce como lida pelo próprio autor no instante do envio. | Enviar mensagem e inspecionar `data.read_by`. | Retorna `201`; `read_by` contém item com `user_id` do remetente e `at` preenchido. |
| Atualiza `last_message_at` da conversa | Envio deve atualizar timestamp da conversa. | Enviar mensagem e consultar `GET /conversations/{id}`. | `last_message_at` da conversa fica não nulo e coerente com envio recente. |
| Campo extra no body | Campo desconhecido não invalida schema. | Enviar `{ text, foo: 'bar' }`. | Retorna `201`; campo extra ignorado. |
| **Cenários tristes** |  |  |  |
| `conversationId` inválido | Deve rejeitar por validação de path. | `POST /conversations/abc/messages`. | Retorna `400`. |
| Conversa inexistente (ID válido) | Repositório retorna não encontrado. | `POST` com `conversationId=000000000000000000000000`. | Retorna `404`; `Conversation` não encontrado(a). |
| `text` vazio | Deve rejeitar por validação Zod (`min(1)`). | Enviar `{ text: '' }`. | Retorna `400`; erro de validação de texto. |
| `text` ausente | Campo obrigatório deve falhar. | Enviar body `{}`. | Retorna `400`. |
| Usuário não participante | Deve negar por regra de participação na conversa. | Enviar como usuário fora dos participantes. | Retorna `403`; mensagem inclui "Você não é participante desta conversa." |
| Sem token | Deve bloquear autenticação. | Requisição sem auth. | Retorna `498`. |
| Header sem Bearer | Deve falhar em `AuthPermission`. | Enviar token cru em `Authorization`. | Retorna `401`. |
| Sem permissão `conversations.post` ativa | Deve negar por camada de permissão. | Desativar permissão e chamar endpoint. | Retorna `403`. |

## GET /conversations/:conversationId/messages — Listagem de Mensagens

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Cenários felizes** |  |  |  |
| Participante lista mensagens da conversa | Deve retornar página de mensagens ativas da conversa. | Fazer `GET /conversations/{id}/messages` como participante. | Retorna `200`; `data.docs` array; todas com `conversation_id` da rota. |
| Ordenação por `sent_at` decrescente | Mais recentes devem vir primeiro. | Criar mensagens com timestamps distintos e consultar. | Retorna `200`; ordem de `docs` respeita `sent_at desc`. |
| Paginação padrão | Assume `page=1` e `limit=10`. | Chamar sem query. | Retorna `200`; metadados padrão. |
| Paginação customizada | Respeita `page` e `limit` válidos. | Chamar `?page=2&limit=2` com massa >2. | Retorna `200`; `page=2`, `limit=2`. |
| Query com campo extra | Campo desconhecido é ignorado. | Chamar `?foo=bar`. | Retorna `200`; sem erro de validação. |
| **Cenários tristes** |  |  |  |
| `conversationId` inválido | Deve rejeitar por validação de path. | `GET /conversations/abc/messages`. | Retorna `400`. |
| Conversa inexistente (ID válido) | Deve retornar not found. | `GET` com `000000000000000000000000`. | Retorna `404`. |
| `page=0` | Deve rejeitar por validação de query. | Chamar `?page=0`. | Retorna `400`. |
| `limit=0` | Deve rejeitar por validação de query. | Chamar `?limit=0`. | Retorna `400`. |
| `limit>100` | Deve rejeitar por validação de query. | Chamar `?limit=101`. | Retorna `400`. |
| `page=2abc`/`limit=3xyz` | `z.coerce.number()` não aceita sufixo alfanumérico. | Chamar `?page=2abc&limit=3xyz`. | Retorna `400`. |
| Usuário não participante | Deve negar por regra de participação. | Chamar com usuário fora da conversa. | Retorna `403`. |
| Sem token | Deve bloquear autenticação. | Requisição sem header. | Retorna `498`. |
| Header sem Bearer | Deve falhar em `AuthPermission`. | Enviar token sem prefixo Bearer. | Retorna `401`. |
| Sem permissão `conversations.get` ativa | Deve negar por permissão de rota/método. | Desativar permissão e chamar endpoint. | Retorna `403`. |

## PATCH /conversations/:conversationId/messages/read — Marcar Mensagens como Lidas

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Cenários felizes** |  |  |  |
| Participante marca mensagens não lidas de terceiros | Deve marcar leituras e retornar quantidade em `data.marked`. | Criar mensagens de outro participante ainda não lidas e chamar `PATCH`. | Retorna `200`; `message` = "Mensagens marcadas como lidas."; `data.marked > 0`. |
| Operação idempotente | Segunda chamada sem novas mensagens não lidas deve manter sucesso com `0` alterações. | Executar `PATCH` duas vezes seguidas. | Ambas retornam `200`; segunda retorna `data.marked=0`. |
| Mensagens do próprio usuário não entram no contador | Apenas mensagens com `sender_id != userId` devem ser marcadas. | Misturar mensagens próprias e de terceiros antes do `PATCH`. | `data.marked` considera somente mensagens de terceiros não lidas. |
| **Cenários tristes** |  |  |  |
| `conversationId` inválido | Deve rejeitar por validação de path. | `PATCH /conversations/abc/messages/read`. | Retorna `400`. |
| Conversa inexistente (ID válido) | Deve retornar not found. | `PATCH` com `000000000000000000000000`. | Retorna `404`. |
| Usuário não participante | Deve negar por regra de participação. | Chamar como usuário fora da conversa. | Retorna `403`. |
| Sem token | Deve bloquear autenticação. | Requisição sem auth. | Retorna `498`. |
| Header sem Bearer | Deve falhar em `AuthPermission`. | Enviar token cru em `Authorization`. | Retorna `401`. |
| Sem permissão `conversations.patch` ativa | Deve negar por camada de permissão. | Desativar permissão e chamar endpoint. | Retorna `403`. |

## Cenários Transversais Obrigatórios (E2E)

| Tema | Verificação E2E |
| :--- | :--- |
| Contrato padrão de resposta | Em sucesso: `error=false`, `code`, `message`, `data`, `errors=[]`. Em erro: `error=true`, `data=null`, `errors` preenchido quando aplicável. |
| Mensagens de validação | Confirmar prefixo "Erro de validação." e detalhes com `path`/`message`. |
| Sensibilidade de autenticação | Cobrir ausência de token (`498`), token inválido (`498`) e header sem Bearer (`401`). |
| Permissão por rota no banco | Cobrir permissão de método inativa (`403`) e rota `conversations` ausente (`404`). |
| Regra de participante | Garantir que usuário não participante receba `403` em `list/send/read`. |

## Estratégia de Organização dos Testes E2E

| Bloco | Objetivo |
| :--- | :--- |
| `describe('POST /conversations/:conversationId/messages')` | Validar envio, estrutura de leitura inicial e atualização de `last_message_at`. |
| `describe('GET /conversations/:conversationId/messages')` | Validar listagem paginada, ordenação e bloqueios por participação/permissão. |
| `describe('PATCH /conversations/:conversationId/messages/read')` | Validar marcação de leitura, idempotência e regras de contabilização. |

## Observações de Implementação para os Casos E2E

| Ponto | Diretriz |
| :--- | :--- |
| IDs válidos para 404 | Usar `000000000000000000000000` para manter ObjectId válido e inexistente. |
| Preparação de leitura | Criar mensagens de outro participante sem `read_by` para o usuário de teste antes do `PATCH /read`. |
| Assert de idempotência | Repetir `PATCH /read` sem novas mensagens e esperar `data.marked=0`. |
| Evitar flakiness de ordenação | Inserir mensagens com controle de timestamp e validar ordem pelo payload retornado. |
