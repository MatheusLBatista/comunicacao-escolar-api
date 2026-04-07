# Suite de Testes E2E — Event (`/events`)

Testes E2E (endpoint) que validam os fluxos principais e regras de negócio das rotas de Event.

Arquivo: `src/tests/routes/eventRoutes.test.js`

## Visão de Fluxo e Regras de Negócio

| Regra                                | Comportamento Atual do Sistema                                                  | Impacto na Suite E2E                                                                   |
| :----------------------------------- | :------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------- |
| Autenticação obrigatória             | Rotas de `events` exigem token válido em `Authorization: Bearer <token>`.       | Cobrir ausência de token em criação e exclusão, aceitando variação `401`/`498`.        |
| Envelope padrão de sucesso           | Em cenários felizes, resposta retorna `error=false` e `data` preenchido.        | Validar envelope mínimo em `POST`, `GET`, `PATCH` e `DELETE`.                          |
| Ciclo de vida completo do recurso    | Evento pode ser criado, listado, consultado por ID, atualizado e removido.      | Encadear cenários para reutilizar `createdEventId` entre operações.                    |
| Filtro por status ativo              | Listagem permite consulta por `active=false`.                                   | Após `PATCH` com `active=false`, validar que item aparece no `GET /events` filtrado.   |
| Regra de meeting (horário explícito) | `meeting` sem horário explícito é inválido.                                     | Validar retorno `422` ao criar meeting com data sem horário.                           |
| Regra de meeting (`all_day`)         | `meeting` não aceita `all_day=true`.                                            | Validar retorno `422` quando payload viola a regra.                                    |
| Regra de target por escopo `class`   | Para `scope=class`, `target_id` é obrigatório e deve apontar para turma válida. | Cobrir `422` sem `target_id` e `422` para `target_id` inexistente.                     |
| Cenário condicional de turma         | Criação com `scope=class` depende de existir turma referenciável.               | Manter teste condicional: se não houver turma, cenário é ignorado sem quebrar a suite. |
| Remoção definitiva no fluxo testado  | Após `DELETE`, nova remoção e nova consulta por ID retornam `404`.              | Validar não existência após remoção (`GET`/`DELETE` subsequentes).                     |

## Massa de Dados Recomendada

| Entidade                                                | Objetivo nos testes                                                                   |
| :------------------------------------------------------ | :------------------------------------------------------------------------------------ |
| Admin válido para login                                 | Obter token para executar todos os fluxos autenticados de `events`.                   |
| Escola existente no sistema                             | Usar `school_id` válido na criação de eventos.                                        |
| Evento base criado durante a suite                      | Reutilizar `_id` para cenários de `GET /:id`, `PATCH`, filtro e `DELETE`.             |
| Event com `target.scope=class` pré-existente (opcional) | Extrair `classTargetId` inicial para validar criação class-scoped.                    |
| ID válido inexistente (`000000000000000000000000`)      | Forçar erro de referência inválida em `target.target_id` com formato ObjectId válido. |

## Pré-condições Técnicas da Suite

| Etapa                        | Objetivo                                   | Critério                                                                                                     |
| :--------------------------- | :----------------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| `loginAndGetToken()`         | Autenticar com credenciais admin           | `POST /login` retorna `200` e token em `data.user.access_token`.                                             |
| `getFirstSchoolId(token)`    | Obter escola para payloads de criação      | `GET /schools` retorna `200` e ao menos um `_id`.                                                            |
| `tryGetClassTargetId(token)` | Descobrir turma para cenário `scope=class` | `GET /events?scope=class&limit=1` pode retornar `target.target_id`; se não houver, cenário fica condicional. |

## POST /events — Criação de Evento

| Funcionalidade                                   | Comportamento Esperado                                | Verificações                                                                         | Critérios de Aceite                                                                                              |
| :----------------------------------------------- | :---------------------------------------------------- | :----------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------- |
| **Cenários felizes**                             |                                                       |                                                                                      |                                                                                                                  |
| Cria event com payload válido                    | Deve persistir evento e retornar `201`.               | Enviar `school_id`, `title`, `type=event`, datas, `target.scope=all`, `active=true`. | Retorna `201`; `error=false`; `data._id` presente; `data.title` e `data.type` corretos; `data.target.scope=all`. |
| Cria event com `scope=class` quando houver turma | Deve persistir alvo de turma corretamente.            | Enviar `target.scope=class` com `target_id` válido encontrado na pré-condição.       | Retorna `201`; `data.target.scope=class`; `data.target.target_id` igual ao enviado.                              |
| **Cenários tristes**                             |                                                       |                                                                                      |                                                                                                                  |
| Sem token                                        | Deve bloquear requisição não autenticada.             | Chamar `POST /events` sem `Authorization`.                                           | Retorna `401` ou `498`.                                                                                          |
| Meeting sem horário explícito                    | Deve rejeitar por regra de domínio.                   | Enviar `type=meeting`, `start_date` sem componente de horário, `all_day=false`.      | Retorna `422`; `error=true`.                                                                                     |
| Meeting com `all_day=true`                       | Deve rejeitar por regra de domínio.                   | Enviar `type=meeting` com `all_day=true`.                                            | Retorna `422`; `error=true`.                                                                                     |
| Event `scope=class` sem `target_id`              | Deve rejeitar por ausência de referência obrigatória. | Enviar `target.scope=class` sem `target_id`.                                         | Retorna `422`; `message="Para scope=class, informe o id da turma."`.                                             |
| Event `scope=class` com `target_id` inexistente  | Deve rejeitar por referência inválida.                | Enviar `target.target_id=000000000000000000000000`.                                  | Retorna `422`; `message="target.target_id inválido."`.                                                           |

## GET /events — Listagem de Eventos

| Funcionalidade            | Comportamento Esperado                         | Verificações                                                                           | Critérios de Aceite                                                                |
| :------------------------ | :--------------------------------------------- | :------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------- |
| **Cenários felizes**      |                                                |                                                                                        |                                                                                    |
| Lista events com token    | Deve retornar paginação e coleção de eventos.  | Chamar `GET /events` autenticado.                                                      | Retorna `200`; `error=false`; `data.docs` array; presença de `totalDocs` e `page`. |
| Filtra por `active=false` | Deve trazer eventos inativos após atualização. | Atualizar evento para `active=false` e consultar `GET /events?active=false&limit=100`. | Retorna `200`; evento atualizado é encontrado com `active=false`.                  |

## GET /events/:id — Detalhe de Evento

| Funcionalidade           | Comportamento Esperado                         | Verificações                                        | Critérios de Aceite                                                                               |
| :----------------------- | :--------------------------------------------- | :-------------------------------------------------- | :------------------------------------------------------------------------------------------------ |
| **Cenários felizes**     |                                                |                                                     |                                                                                                   |
| Consulta event existente | Deve retornar detalhes do evento recém-criado. | Chamar `GET /events/{createdEventId}` com token.    | Retorna `200`; `error=false`; `data._id` igual ao ID consultado; `title` e `school_id` presentes. |
| **Cenários tristes**     |                                                |                                                     |                                                                                                   |
| Consulta após remoção    | Evento removido não deve mais ser encontrado.  | Após `DELETE`, chamar `GET /events/{id}` novamente. | Retorna `404`; `error=true`.                                                                      |

## PATCH /events/:id — Atualização de Evento

| Funcionalidade                                             | Comportamento Esperado                                   | Verificações                                            | Critérios de Aceite                                                                                  |
| :--------------------------------------------------------- | :------------------------------------------------------- | :------------------------------------------------------ | :--------------------------------------------------------------------------------------------------- |
| **Cenários felizes**                                       |                                                          |                                                         |                                                                                                      |
| Atualiza campos básicos (`title`, `description`, `active`) | Deve persistir alterações e retornar recurso atualizado. | Chamar `PATCH /events/{id}` com payload parcial válido. | Retorna `200`; `error=false`; `data._id` igual ao solicitado; `title` e `active` refletindo payload. |

## DELETE /events/:id — Remoção de Evento

| Funcionalidade              | Comportamento Esperado                         | Verificações                                          | Critérios de Aceite                            |
| :-------------------------- | :--------------------------------------------- | :---------------------------------------------------- | :--------------------------------------------- |
| **Cenários felizes**        |                                                |                                                       |                                                |
| Remove event com token      | Deve remover evento e responder sucesso.       | Chamar `DELETE /events/{createdEventId}` autenticado. | Retorna `200`; `error=false`; `data` presente. |
| **Cenários tristes**        |                                                |                                                       |                                                |
| Sem token                   | Deve bloquear requisição sem autenticação.     | Chamar `DELETE /events/{id}` sem header de auth.      | Retorna `401` ou `498`.                        |
| Segunda remoção do mesmo ID | Deve indicar inexistência após remoção prévia. | Repetir `DELETE /events/{id}` já removido.            | Retorna `404`; `error=true`.                   |

## Cenários Transversais Obrigatórios (E2E)

| Tema                            | Verificação E2E                                                                            |
| :------------------------------ | :----------------------------------------------------------------------------------------- |
| Contrato de sucesso             | Verificar `error=false` e `data` preenchido em todos os cenários felizes.                  |
| Contrato de erro                | Verificar `error=true` nos cenários de falha (`422`, `404`, `401`/`498`).                  |
| Regras de negócio de meeting    | Garantir rejeição de payloads inválidos de meeting com `422`.                              |
| Regras de target class          | Garantir erro sem `target_id` e com `target_id` inexistente (`422` + mensagem esperada).   |
| Persistência de estado no fluxo | Confirmar efeito encadeado entre criar, atualizar, filtrar, deletar e consultar novamente. |

## Estratégia de Organização dos Testes E2E

| Bloco                                     | Objetivo                                                                |
| :---------------------------------------- | :---------------------------------------------------------------------- |
| `beforeAll`                               | Preparar token admin, `schoolId` e possível `classTargetId`.            |
| `describe('Event - integração de rotas')` | Cobrir ciclo completo de CRUD e validações específicas de domínio.      |
| Cenários de criação (`POST`)              | Validar payload válido e regras de negócio (`meeting` e `scope=class`). |
| Cenários de leitura (`GET`)               | Validar listagem, filtro por ativo e detalhe por ID.                    |
| Cenários de atualização (`PATCH`)         | Validar persistência de campos alteráveis.                              |
| Cenários de remoção (`DELETE`)            | Validar remoção, ausência posterior e comportamento sem token.          |
| `afterAll`                                | Limpar evento class-scoped criado de forma condicional.                 |

## Observações de Implementação para os Casos E2E

| Ponto                             | Diretriz                                                                              |
| :-------------------------------- | :------------------------------------------------------------------------------------ |
| Dados dinâmicos                   | Usar `Date.now()` no título para evitar colisão de dados entre execuções.             |
| Cenário condicional de turma      | Se não houver `classTargetId`, manter `return` no teste para evitar falsos negativos. |
| ID inexistente com formato válido | Reutilizar `000000000000000000000000` para cenários de referência não encontrada.     |
| Limpeza de massa                  | Remover no `afterAll` apenas o recurso class-scoped criado na execução.               |
| Tolerância de autenticação        | Manter asserção `expect([401, 498]).toContain(status)` em cenários sem token.         |
