# Suite de Testes E2E — AuditLog (`/schools/:id/audit-logs`)

Testes E2E (endpoint) que validam os fluxos principais e regras de negócio das rotas de AuditLog.

Arquivo: `src/tests/routes/auditLogRoutes.test.js`

## Visão de Fluxo e Regras de Negócio

| Regra                                   | Comportamento Atual do Sistema                                                                          | Impacto na Suite E2E                                                                        |
| :-------------------------------------- | :------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------ |
| Autenticação obrigatória                | Rotas de `audit-logs` exigem token válido em `Authorization: Bearer <token>`.                           | Cobrir ausência de token na listagem, aceitando variação `401`/`498`.                       |
| Somente admin                           | Apenas usuários com role `admin` podem acessar audit logs.                                              | Validar que teacher recebe `403` ao tentar acessar.                                         |
| Coleção append-only                     | Não existem endpoints de criação, edição ou exclusão via API. Registros são criados por middleware.      | Inserir dados diretamente via seed e validar leitura.                                       |
| Envelope padrão de sucesso              | Em cenários felizes, resposta retorna `error=false` e `data` preenchido.                                | Validar envelope mínimo em todos os `GET`.                                                  |
| Paginação padrão                        | Listagem retorna `docs`, `totalDocs`, `page`, `totalPages`, `hasPrevPage`, `hasNextPage`.               | Validar estrutura de paginação na listagem principal.                                       |
| Filtros por query params                | Listagem aceita `resource_type`, `action`, `user_id`, `student_id`, `start_date`, `end_date`.           | Validar filtragem por `resource_type`.                                                      |
| Endpoint de resumo agregado             | `/summary` retorna `total_accesses`, `unique_users`, `groups` agrupados por critério.                   | Validar estrutura do resumo com `group_by=resource_type`.                                   |
| Consulta por recurso específico         | `/resource/:resourceType/:resourceId` filtra logs de um recurso.                                        | Validar filtragem por tipo e ID de recurso.                                                 |
| Consulta por usuário                    | `/user/:userId` filtra logs de um usuário específico.                                                   | Validar filtragem por ID de usuário.                                                        |
| Consulta por aluno                      | `/student/:studentId` filtra logs relacionados a um aluno.                                              | Validar filtragem por ID de aluno.                                                          |
| Detalhe de log por ID                   | `/:logId` retorna um registro específico.                                                               | Validar retorno de registro individual e `404` para ID inexistente.                         |

## Massa de Dados Recomendada

| Entidade                              | Objetivo nos testes                                                                   |
| :------------------------------------ | :------------------------------------------------------------------------------------ |
| Admin válido para login               | Obter token para executar todos os fluxos autenticados de `audit-logs`.               |
| Teacher válido para login             | Validar que role `teacher` recebe `403`.                                              |
| Escola existente no sistema           | Usar `school_id` para montar as URLs dos endpoints.                                  |
| AuditLog pré-existente (via seed)     | Garantir que há dados para listar, filtrar e consultar por ID.                        |
| ID válido inexistente                 | Forçar erro `404` no detalhe de log. Usar `000000000000000000000000`.                |

## Pré-condições Técnicas da Suite

| Etapa                     | Objetivo                               | Critério                                                                 |
| :------------------------ | :------------------------------------- | :----------------------------------------------------------------------- |
| `loginAndGetToken()`      | Autenticar com credenciais admin       | `POST /login` retorna `200` e token em `data.user.access_token`.         |
| `getFirstSchoolId(token)` | Obter escola para montar URLs          | `GET /schools` retorna `200` e ao menos um `_id`.                        |
| `getFirstAuditLog()`      | Obter log existente para testes por ID | `GET /schools/:id/audit-logs` retorna ao menos um doc.                   |
| `loginAsTeacher()`        | Obter token teacher para teste de 403  | Criar teacher via admin e logar; ou usar credencial existente de teacher. |

## GET /schools/:id/audit-logs — Listagem de Logs

| Funcionalidade              | Comportamento Esperado                                 | Verificações                                                        | Critérios de Aceite                                                            |
| :-------------------------- | :----------------------------------------------------- | :------------------------------------------------------------------ | :----------------------------------------------------------------------------- |
| **Cenários felizes**        |                                                        |                                                                     |                                                                                |
| Lista audit logs com token  | Deve retornar paginação e coleção de logs.             | Chamar `GET /schools/:id/audit-logs` autenticado como admin.        | Retorna `200`; `error=false`; `data.docs` array; `totalDocs` e `page` presentes. |
| Filtra por `resource_type`  | Deve retornar apenas logs do tipo informado.           | Chamar com `?resource_type=event`.                                  | Retorna `200`; todos os docs possuem `resource_type=event`.                    |
| Filtra por `action`         | Deve retornar apenas logs da ação informada.           | Chamar com `?action=view`.                                          | Retorna `200`; todos os docs possuem `action=view`.                            |
| **Cenários tristes**        |                                                        |                                                                     |                                                                                |
| Sem token                   | Deve bloquear requisição não autenticada.              | Chamar sem `Authorization`.                                         | Retorna `401` ou `498`.                                                        |
| Token de teacher            | Deve bloquear acesso de role não autorizada.           | Chamar com token de teacher.                                        | Retorna `403`.                                                                 |

## GET /schools/:id/audit-logs/:logId — Detalhe de Log

| Funcionalidade           | Comportamento Esperado                             | Verificações                                                          | Critérios de Aceite                                                      |
| :----------------------- | :------------------------------------------------- | :-------------------------------------------------------------------- | :----------------------------------------------------------------------- |
| **Cenários felizes**     |                                                    |                                                                       |                                                                          |
| Consulta log existente   | Deve retornar detalhes do log.                     | Chamar `GET /schools/:id/audit-logs/:logId` com token admin.          | Retorna `200`; `error=false`; `data._id` igual ao consultado.            |
| **Cenários tristes**     |                                                    |                                                                       |                                                                          |
| Log inexistente          | Deve retornar 404 para ID que não existe.          | Chamar com `logId=000000000000000000000000`.                          | Retorna `404`; `error=true`.                                             |

## GET /schools/:id/audit-logs/summary — Resumo Agregado

| Funcionalidade                | Comportamento Esperado                             | Verificações                                                            | Critérios de Aceite                                                                            |
| :---------------------------- | :------------------------------------------------- | :---------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------- |
| **Cenários felizes**          |                                                    |                                                                         |                                                                                                |
| Resumo por `resource_type`    | Deve retornar totais agrupados.                    | Chamar com `?group_by=resource_type`.                                   | Retorna `200`; `data.total_accesses` >= 0; `data.groups` array; cada grupo tem `key` e `count`. |
| Resumo por `day`              | Deve retornar totais agrupados por dia.            | Chamar com `?group_by=day`.                                             | Retorna `200`; `data.groups` array.                                                            |

## GET /schools/:id/audit-logs/resource/:resourceType/:resourceId — Por Recurso

| Funcionalidade                   | Comportamento Esperado                                    | Verificações                                                       | Critérios de Aceite                                                  |
| :------------------------------- | :-------------------------------------------------------- | :----------------------------------------------------------------- | :------------------------------------------------------------------- |
| **Cenários felizes**             |                                                           |                                                                    |                                                                      |
| Filtra por recurso específico    | Deve retornar logs daquele recurso.                       | Chamar com `resourceType` e `resourceId` de log existente.         | Retorna `200`; `error=false`; docs filtrados por recurso.            |

## GET /schools/:id/audit-logs/user/:userId — Por Usuário

| Funcionalidade                | Comportamento Esperado                             | Verificações                                                         | Critérios de Aceite                                               |
| :---------------------------- | :------------------------------------------------- | :------------------------------------------------------------------- | :---------------------------------------------------------------- |
| **Cenários felizes**          |                                                    |                                                                      |                                                                   |
| Filtra por usuário específico | Deve retornar logs daquele usuário.                | Chamar com `userId` extraído de log existente.                       | Retorna `200`; `error=false`; docs presentes.                     |

## GET /schools/:id/audit-logs/student/:studentId — Por Aluno

| Funcionalidade              | Comportamento Esperado                             | Verificações                                                          | Critérios de Aceite                                               |
| :-------------------------- | :------------------------------------------------- | :-------------------------------------------------------------------- | :---------------------------------------------------------------- |
| **Cenários felizes**        |                                                    |                                                                       |                                                                   |
| Filtra por aluno específico | Deve retornar logs relacionados ao aluno.          | Chamar com `studentId` extraído de log existente.                     | Retorna `200`; `error=false`; docs presentes.                     |

## Cenários Transversais Obrigatórios (E2E)

| Tema                           | Verificação E2E                                                                       |
| :----------------------------- | :------------------------------------------------------------------------------------ |
| Contrato de sucesso            | Verificar `error=false` e `data` preenchido em todos os cenários felizes.             |
| Contrato de erro               | Verificar `error=true` nos cenários de falha (`404`, `401`/`498`, `403`).             |
| Somente leitura                | Não existem endpoints POST/PATCH/DELETE — apenas GET.                                 |
| Permissão admin-only           | Garantir bloqueio `403` para roles diferentes de admin.                               |
| Paginação padrão               | Validar presença de `docs`, `totalDocs`, `page` na listagem.                          |

## Estratégia de Organização dos Testes E2E

| Bloco                                        | Objetivo                                                              |
| :------------------------------------------- | :-------------------------------------------------------------------- |
| `beforeAll`                                  | Preparar tokens admin e teacher, `schoolId`, e log existente.         |
| `describe('AuditLog - integração de rotas')` | Cobrir todos os endpoints de leitura e validações de permissão.       |
| Cenários de listagem (`GET`)                 | Validar paginação, filtros por query params.                          |
| Cenários de detalhe (`GET /:logId`)          | Validar retorno individual e 404 para inexistente.                    |
| Cenários de resumo (`GET /summary`)          | Validar estrutura de agregação.                                       |
| Cenários de filtro por recurso/user/student  | Validar sub-rotas de filtragem.                                       |
| Cenários de permissão                        | Validar bloqueio para token ausente e role não autorizada.            |

## Observações de Implementação para os Casos E2E

| Ponto                             | Diretriz                                                                              |
| :-------------------------------- | :------------------------------------------------------------------------------------ |
| Dados pré-existentes (seed)       | Os testes dependem de audit logs criados pelo seed. Não há POST na API.               |
| ID inexistente com formato válido | Reutilizar `000000000000000000000000` para cenários de referência não encontrada.     |
| Tolerância de autenticação        | Manter asserção `expect([401, 498]).toContain(status)` em cenários sem token.         |
| Teacher para teste de permissão   | Criar teacher via admin no `beforeAll` e logar para obter token.                      |
| Campos de referência              | Extrair `user_id`, `resource_type`, `resource_id`, `student_id` do primeiro log.      |
