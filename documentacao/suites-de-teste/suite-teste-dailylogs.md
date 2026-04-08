# Suite de Testes E2E — Daily Logs (`/daily-logs`)

Testes E2E (endpoint) que validam toda a regra de negócio das rotas de Daily Log.

Arquivo alvo sugerido: `src/tests/routes/dailyLogRoutes.test.js` (ainda não existe no repositório)

## Visão de Fluxo e Regras de Negócio

| Regra | Comportamento Atual do Sistema | Impacto na Suite E2E |
| :--- | :--- | :--- |
| Dupla camada de segurança | Todas as rotas passam por `AuthMiddleware` e `AuthPermission`. | Validar separadamente: token ausente/inválido, falta de permissão. |
| Permissão por rota no banco | `AuthPermission` consulta coleção `rotas` para verificar se rota/método estão ativos. | Rota sem registro no banco retorna `404`; método inativo retorna `403`. |
| Validação Zod | Erros de validação retornam `400` (não `422`). | Todos os cenários de schema/ID/query inválidos devem esperar `400`. |
| `PATCH` e `PUT` apontam para o mesmo handler | Ambos chamam `dailyLogController.update`. | Comportamento idêntico para ambos os verbos. |
| `GET /daily-logs/:id` reusa o mesmo handler da listagem | O `list` verifica se tem `id` nos params e retorna detalhe. | Detalhe tem o mesmo contrato de listagem, mas sem paginação. |
| `DELETE` é hard delete | Usa `findByIdAndDelete`, não soft delete. | Validar que após delete, consulta retorna `404`. |
| `markAsRead` define `read_at` como `new Date()` | Marca leitura com timestamp atual. | Validar que `read_at` muda de `null` para data válida. |
| `ativo` é campo do modelo | `true` por padrão; não é soft delete, é campo filtrável. | `DELETE` remove permanentemente; `ativo` serve como filtro/filtro de estado. |

## Modelo de Daily Log

| Campo | Tipo | Requerido | Observação |
| :--- | :--- | :--- | :--- |
| `school_id` | ObjectId | Sim | Ref: `escolas` |
| `student_id` | ObjectId | Sim | Ref: `usuarios` |
| `teacher_id` | ObjectId | Sim | Ref: `usuarios` |
| `dailylogtemplate_id` | ObjectId | Sim | Ref: `daily_log_templates` |
| `is_present` | Boolean | Sim | Presença do aluno |
| `entries` | Array de `{field_key, value}` | Não (default `[]`) | Respostas dinâmicas baseadas no template |
| `attachments` | Array de strings | Não (default `[]`) | Anexos (URLs de imagens via MinIO) |
| `observation` | String | Não (default `""`) | Observação textual |
| `read_at` | Date | Não (default `null`) | timestamp de leitura |
| `date` | Date | Sim | Data do registro (indexado) |
| `ativo` | Boolean | Não (default `true`) | Estado ativo/inativo |

## Massa de Dados Recomendada

| Entidade | Objetivo nos testes |
| :--- | :--- |
| Admin global com permissões de `daily-logs` ativas | Executar cenários felizes de todos os endpoints. |
| Teacher da escola A com permissão de `daily-logs` | Executar cenários de criação/leitura. |
| Parent/Student sem permissão de `daily-logs` | Validar `403` em todas as rotas. |
| Escola A | Validar escopo por `school_id`. |
| Template de daily log válido | `dailylogtemplate_id` obrigatório; necessário criar template antes. |
| Dois estudantes válidos | Referências cruzadas em daily logs. |
| Professor válido | `teacher_id` obrigatório na criação. |
| Rota `daily-logs` sem registro no banco | Validar `404` por rota inexistente em `AuthPermission`. |

## POST /daily-logs — Criação de Daily Log

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Cenários felizes** |  |  |  |
| Admin cria daily log com payload válido | Deve criar com `201`, sem omitir campos obrigatórios. | `POST /daily-logs` com `{ school_id, student_id, teacher_id, dailylogtemplate_id, is_present, date }`. | Retorna `201`; `data._id` presente; campos iguais aos enviados; `entries=[]`; `observation=""`; `ativo=true`; `read_at=null`. |
| Cria com `entries` preenchidos | Deve persistir array de respostas dinâmicas. | Enviar `entries` com `field_key` + `value`. | Retorna `201`; `data.entries` igual ao enviado. |
| Cria com `attachments` | Deve persistir array de strings. | Enviar `attachments: ["url1", "url2"]`. | Retorna `201`; `data.attachments` igual ao enviado. |
| Cria com `observation` e `is_present: false` | Deve respeitar valores enviados. | Payload com `observation` e `is_present: false`. | Retorna `201`; campos refletidos. |
| Cria com `ativo: false` explícito | Deve persistir estado já na criação. | Payload com `ativo: false`. | Retorna `201`; `data.ativo=false`. |
| Campo extra no body | Não deve falhar (schema não-strict do Zod). | Enviar campo adicional além do esperado. | Retorna `201`; campo extra ignorado. |
| **Cenários tristes** |  |  |  |
| `school_id` inexistente | Deve rejeitar por referência não encontrada. | Enviar `school_id` válido que não existe. | Retorna `404` (recurso Escola não encontrado). |
| `student_id` inexistente | Deve rejeitar por referência não encontrada. | Enviar `student_id` inválido no contexto de existência. | Retorna `404` (recurso User não encontrado). |
| `teacher_id` inexistente | Deve rejeitar por referência não encontrada. | Enviar `teacher_id` inexistente. | Retorna `404`. |
| `dailylogtemplate_id` inexistente | Deve rejeitar por referência não encontrada. | Enviar `dailylogtemplate_id` inexistente. | Retorna `404`. |
| `school_id` com formato inválido | Deve rejeitar por validação Zod. | Enviar `"abc"`. | Retorna `400`; erro de validação de ObjectId. |
| `student_id` ausente | Deve rejeitar por campo obrigatório. | Payload sem `student_id`. | Retorna `400`. |
| `teacher_id` ausente | Deve rejeitar por campo obrigatório. | Payload sem `teacher_id`. | Retorna `400`. |
| `dailylogtemplate_id` ausente | Deve rejeitar por campo obrigatório. | Payload sem `dailylogtemplate_id`. | Retorna `400`. |
| `is_present` ausente | Deve rejeitar por campo obrigatório. | Payload sem `is_present`. | Retorna `400`. |
| `date` ausente | Deve rejeitar por campo obrigatório. | Payload sem `date`. | Retorna `400`. |
| `date` com formato inválido | Deve rejeitar na coerção de data do Zod. | Enviar `"data-invalida"`. | Retorna `400`. |
| `entries` com `field_key` vazio | Deve rejeitar por validação do EntrySchema. | Enviar `[{ field_key: "", value: "x" }]`. | Retorna `400`. |
| Sem token | `AuthMiddleware` lança `AuthenticationError`. | Requisição sem `Authorization`. | Retorna `401` ou `498` (fluxo padrão atual: `498`); `error=true`. |
| Token inválido | `AuthMiddleware` falha na validação JWT antes do `AuthPermission`. | Enviar `Authorization: Bearer token-falso`. | Retorna `498`; `error=true`. |
| Sem permissão de `daily-logs.post` | `AuthPermission` nega acesso. | Usuário sem permissão na rota chama endpoint. | Retorna `403`. |
| Rota não cadastrada no banco | `AuthPermission` não encontra a rota. | Se entrada `daily-logs` não existir na coleção de rotas, retorna `404`. | `404` com "Rota não encontrado(a).". |

## GET /daily-logs — Listagem de Daily Logs

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Cenários felizes** |  |  |  |
| Admin lista todos os daily logs | Deve retornar array paginado (default `page=1, limit=10`). | `GET /daily-logs` como admin. | Retorna `200`; `data.docs` array (paginado do mongoose-paginate-v2); ordenado por `date` e `created_at` decrescentes. |
| Filtro por `school_id` | Deve retornar apenas logs da escola indicada. | `GET /daily-logs?school_id={id}`. | Retorna `200`; todos os `docs` têm `school_id` igual ao filtro. |
| Filtro por `student_id` | Deve retornar logs do estudante. | `GET /daily-logs?student_id={id}`. | Retorna `200`; todos os docs do estudante. |
| Filtro por `teacher_id` | Deve retornar logs do professor. | `GET /daily-logs?teacher_id={id}`. | Retorna `200`; todos os docs do professor. |
| Filtro por `is_present=true\|false` | Deve aplicar filtro booleano. | `GET /daily-logs?is_present=false`. | Retorna `200`; todos com `is_present=false`. |
| Filtro por `read=true\|false` | `read=true` filtra `read_at !== null`; `read=false` filtra `read_at === null`. | `GET /daily-logs?read=false`. | Retorna `200`; todos com `read_at === null`. |
| Filtro por `ativo=true\|false` | Aplica filtro de estado ativo/inativo. | `GET /daily-logs?ativo=false`. | Retorna `200`; todos com `ativo=false`. |
| Filtro por `date_from` e `date_to` | Deve retornar logs dentro do intervalo de datas. | `GET /daily-logs?date_from={}&date_to={}`. | Retorna `200`; `date` dos docs dentro do intervalo. |
| Filtro combinado | Múltiplos filtros devem ser aplicados simultaneamente. | `GET /daily-logs?school_id={}&is_present=true&date_from={}`. | Retorna `200`; resultados aderentes a todos os filtros. |
| Paginação customizada | Deve respeitar `page` e `limit` (max 100). | `GET /daily-logs?page=2&limit=2` com massa >2. | Retorna `200`; `page=2`, `limit=2`. |
| Paginação padrão | Sem query deve usar `page=1, limit=10`. | `GET /daily-logs`. | Retorna `200`; metadados condizentes com padrão. |
| Query com campo extra desconhecido | Deve ignorar campos não definidos no schema. | `GET /daily-logs?foo=bar`. | Retorna `200`; sem erro. |
| **Cenários tristes** |  |  |  |
| `school_id` com formato inválido | Deve rejeitar no `DailyLogQuerySchema`. | `GET /daily-logs?school_id=abc`. | Retorna `400`. |
| `student_id` com formato inválido | Deve rejeitar no `DailyLogQuerySchema`. | `GET /daily-logs?student_id=invalido`. | Retorna `400`. |
| `page=0` ou `limit=0` | Deve rejeitar por validação de número positivo. | `GET /daily-logs?page=0`. | Retorna `400`. |
| `limit>100` | Deve rejeitar por validação do `.max(100)`. | `GET /daily-logs?limit=101`. | Retorna `400`. |
| Sem token | Deve bloquear no `AuthMiddleware`. | Sem `Authorization`. | Retorna `401` ou `498` (fluxo padrão atual: `498`). |
| Sem permissão de `daily-logs.get` | Deve negar no `AuthPermission`. | Usuário sem permissão chama endpoint. | Retorna `403`. |

## GET /daily-logs/:id — Detalhe de Daily Log

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Cenários felizes** |  |  |  |
| Admin consulta daily log existente | Deve retornar documento completo. | `GET /daily-logs/{id}`. | Retorna `200`; `data._id` igual ao solicitado; todos os campos presentes. |
| Consulta log inativo (`ativo=false`) | Endpoint não filtra por `ativo`; retorna normalmente. | Criar log inativo e consultar. | Retorna `200`; `data.ativo=false`. |
| **Cenários tristes** |  |  |  |
| ID com formato inválido | Deve rejeitar no `DailyLogIdSchema`. | `GET /daily-logs/abc`. | Retorna `400`; "ID inválido". |
| ID válido inexistente | Repositório lança recurso não encontrado. | `GET /daily-logs/000000000000000000000000`. | Retorna `404`; mensagem de recurso `DailyLog` não encontrado. |
| Sem token | Deve bloquear autenticação. | Sem header `Authorization`. | Retorna `401` ou `498` (fluxo padrão atual: `498`). |
| Sem permissão de `daily-logs.get` | Deve negar por camada de permissão. | Usuário sem permissão. | Retorna `403`. |

## PATCH /daily-logs/:id — Atualização Parcial de Daily Log

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Cenários felizes** |  |  |  |
| Admin atualiza `is_present` | Deve persistir e retornar log atualizado. | `PATCH /daily-logs/{id}` com `{ is_present: false }`. | Retorna `200`; `data.is_present` atualizado; mensagem "Daily log updated successfully.". |
| Admin atualiza `observation` | Deve persistir nova observação. | `PATCH` com `{ observation }`. | Retorna `200`; `data.observation` atualizado. |
| Admin substitui `entries` | Deve sobrescrever array de entries. | `PATCH` com array completo de `entries`. | Retorna `200`; `data.entries` igual ao payload. |
| Body vazio `{}` | Schema parcial permite update sem campos. | `PATCH /daily-logs/{id}` com `{}`. | Retorna `200`; documento sem alteração (ou apenas `updated_at`). |
| Campo extra no body | Deve ignorar (Zod não-strict). | `PATCH` com `{ is_present: true, foo: "bar" }`. | Retorna `200`. |
| **Cenários tristes** |  |  |  |
| ID inválido | Deve rejeitar por validação de path. | `PATCH /daily-logs/abc`. | Retorna `400`. |
| ID inexistente | Deve retornar not found. | `PATCH /daily-logs/000000000000000000000000`. | Retorna `404`. |
| Referência inexistente no payload | `school_id`, `student_id`, `teacher_id` ou `dailylogtemplate_id` inválido deve rejeitar. | Enviar `school_id` inexistente no update. | Retorna `404`. |
| `observation` como número | Deve rejeitar por validação Zod (espera string). | `PATCH` com `{ observation: 123 }`. | Retorna `400`. |
| `entries` com `field_key` vazio | Deve rejeitar no EntrySchema. | `PATCH` com `entries: [{ field_key: "" }]`. | Retorna `400`. |
| Sem token | Deve bloquear autenticação. | Sem header. | Retorna `401` ou `498` (fluxo padrão atual: `498`). |
| Sem permissão de `daily-logs.patch` | Deve negar por camada de permissão. | Usuário sem permissão chama endpoint. | Retorna `403`. |

## PUT /daily-logs/:id — Substituição de Daily Log

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Cenários felizes** |  |  |  |
| Admin substitui daily log completo | Mesmo handler do PATCH; pode enviar todos os campos. | `PUT /daily-logs/{id}` com payload completo. | Retorna `200`; `data` com campos atualizados. |
| PUT com payload parcial | Funciona igual a PATCH (schema parcial). | `PUT /daily-logs/{id}` com `{ is_present: false }`. | Retorna `200`; atualizado. |
| **Cenários tristes** |  |  |  |
| ID inválido | Deve rejeitar por validação. | `PUT /daily-logs/abc`. | Retorna `400`. |
| ID inexistente | Deve retornar not found. | `PUT /daily-logs/000000000000000000000000`. | Retorna `404`. |
| Sem token | Deve bloquear autenticação. | Sem header `Authorization`. | Retorna `401` ou `498` (fluxo padrão atual: `498`). |
| Sem permissão de `daily-logs.put` | Deve negar por permissão. | Usuário sem permissão. | Retorna `403`. |

## PATCH /daily-logs/:id/read — Marcar como Lido

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Cenários felizes** |  |  |  |
| Admin marca daily log como lido | Deve setar `read_at` com timestamp atual. | `PATCH /daily-logs/{id}/read`. | Retorna `200`; `data.read_at` não null e com timestamp recente; mensagem "Daily log marked as read.". |
| Marcar log já lido | Operação idempotente; pode ser chamado múltiplas vezes. | Chamar `markAsRead` duas vezes. | Ambos retornam `200`; `read_at` mantém valor atualizado. |
| **Cenários tristes** |  |  |  |
| ID inválido | Deve rejeitar por validação. | `PATCH /daily-logs/abc/read`. | Retorna `400`. |
| ID inexistente | Deve retornar not found. | `PATCH /daily-logs/000000000000000000000000/read`. | Retorna `404`. |
| Sem token | Deve bloquear autenticação. | Sem header. | Retorna `401` ou `498` (fluxo padrão atual: `498`). |
| Sem permissão de `daily-logs.patch` | Deve negar por permissão. | Usuário sem permissão. | Retorna `403`. |

## DELETE /daily-logs/:id — Exclusão de Daily Log

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Cenários felizes** |  |  |  |
| Admin exclui daily log existente | Deve remover permanentemente do banco. | `DELETE /daily-logs/{id}`. | Retorna `200`; mensagem "Daily log deleted successfully."; `data` contém documento excluído. |
| Log excluído deixa de existir | Consulta posterior deve retornar `404`. | Após delete, chamar `GET /daily-logs/{id}`. | Retorna `404`. |
| **Cenários tristes** |  |  |  |
| ID inválido | Deve rejeitar por validação. | `DELETE /daily-logs/abc`. | Retorna `400`. |
| ID inexistente | Deve retornar not found. | `DELETE /daily-logs/000000000000000000000000`. | Retorna `404`. |
| Segunda exclusão do mesmo log | Não é idempotente (hard delete); segunda chamada retorna `404`. | Chamar `DELETE` duas vezes no mesmo ID. | Primeira retorna `200`; segunda retorna `404`. |
| Sem token | Deve bloquear autenticação. | Sem header. | Retorna `401` ou `498` (fluxo padrão atual: `498`). |
| Sem permissão de `daily-logs.delete` | Deve negar por permissão. | Usuário sem permissão. | Retorna `403`. |

## Cenários Transversais Obrigatórios (E2E)

| Tema | Verificação E2E |
| :--- | :--- |
| Contrato padrão de resposta | Em sucesso: `error=false`, `code`, `message`, `data`, `errors=[]`. Em erro: `error=true`, `data=null`, `errors` preenchido quando aplicável. |
| Mensagens de erro de validação | Confirmar prefixo "Erro de validação." e detalhes com `path`/`message`. |
| Sensibilidade de autenticação | Cobrir ausência de token (`401`/`498`, padrão `498`), token inválido (`498`) e token sem prefixo Bearer (`401` em `AuthPermission`). |
| Permissão por rota no banco | Cobrir cenário em que rota existe mas permissão de método está inativa (`403`). |
| Dependência de rota cadastrada | Se entrada `daily-logs` não existir na coleção de rotas, requisição retorna `404`. |
| Hard delete vs soft delete | `DELETE` remove permanentemente (diferente de User que faz soft delete). Validar que dados somem após exclusão. |
| Ordenação padrão | Listagem deve retornar sempre ordenada por `date DESC` e `created_at DESC`. |
| Referências obrigatórias na criação | `school_id`, `student_id`, `teacher_id`, `dailylogtemplate_id` devem existir no banco. |

## Estratégia de Organização dos Testes E2E

| Bloco | Objetivo |
| :--- | :--- |
| `describe('POST /daily-logs')` | Validar criação, validação de campos obrigatórios e referências externas. |
| `describe('GET /daily-logs')` | Validar filtros (`school_id`, `student_id`, `teacher_id`, `is_present`, `read`, `ativo`, `date_from`, `date_to`), paginação. |
| `describe('GET /daily-logs/:id')` | Validar consulta por id, log inativo e bloqueios de autorização. |
| `describe('PATCH /daily-logs/:id')` | Validar update parcial com schema parcial. |
| `describe('PUT /daily-logs/:id')` | Validar substituição (mesmo handler de PATCH). |
| `describe('PATCH /daily-logs/:id/read')` | Validar marcação de leitura `read_at`. |
| `describe('DELETE /daily-logs/:id')` | Validar hard delete e não-idempotência. |

## Observações de Implementação para os Casos E2E

| Ponto | Diretriz |
| :--- | :--- |
| IDs válidos para testes de 404 | Usar `000000000000000000000000` para manter ObjectId válido e inexistente. |
| Massa para permissões | Preparar usuário de teste com permissão desligada em `daily-logs` para validar `403`. |
| Dados de referência pré-existentes | Daily log requer `school_id`, `student_id`, `teacher_id` e `dailylogtemplate_id` existentes. Criar essa massa antes dos testes de criação. |
| Hard delete requer ordem cuidadosa | Se outros testes dependem de documentos criados, isolar dados de teste por sufixo único (timestamp/UUID) para evitar conflito com deletados. |
| Validar `read_at` dinamicamente | Não comparar timestamp exato — verificar que `read_at` é uma `Date` válida e está dentro de um range aceitável (ex.: últimos 5 segundos). |
| Evitar flakiness de paginação | Criar dados com sufixo único por timestamp e limpar massa ao final quando aplicável. |
| `PATCH` vs `PUT` compartilham handler | Testar ambos mas reconhecer que o comportamento é idêntico; não duplicar cenários negativos. |
| `GET` com e sem `:id` no mesmo handler | O controller verifica `req.params.id` para decidir entre detalhe e listagem — testar ambos os casos claramente separados. |
