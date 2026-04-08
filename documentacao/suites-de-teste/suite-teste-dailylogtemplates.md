# Suite de Testes E2E — DailyLogTemplate (`/daily-log-templates`)

Testes E2E (endpoint) que validam toda a regra de negócio das rotas de DailyLogTemplate.

Arquivo: `src/tests/routes/dailyLogTemplateRoutes.test.js`

## Visão de Fluxo e Regras de Negócio

| Regra | Comportamento Atual do Sistema | Impacto na Suite E2E |
| :--- | :--- | :--- |
| Dupla camada de segurança | Todas as rotas passam por `AuthMiddleware` e `AuthPermission`. | Validar separadamente: token ausente/inválido, falta de role e falta de permissão. |
| Controle por role + permissão | O acesso depende de `memberships.role` **e** flags de permissão por rota/método. | Um usuário com role compatível ainda pode tomar `403` se a permissão de rota estiver inativa. |
| Validação Zod | Erros de validação retornam `400` (não `422`). | Todos os cenários de schema/ID/query inválidos devem esperar `400`. |
| Schemas não-strict | Chaves extras em body/query não são rejeitadas; são ignoradas. | Incluir cenários garantindo que campos extras não quebram a requisição. |
| Referências obrigatórias | `school_id` deve existir; `student_id` (se fornecido) deve existir. | Validar rejeição para IDs inexistentes ou inválidos. |
| Campos de template (fields) | Array de objetos com `key`, `label`, `type` e `options` (para select). mínimo 1 campo. | Validar estrutura completa, tipos válidos e regras condicionais (options para select). |
| Tipo `select` com options | Quando `type='select'`, `options` é obrigatório e deve ter pelo menos 1 item. | Validar rejeição quando options ausente ou vazio. |
| Filtros de listagem | `GET /daily-log-templates` usa paginação/filtro por `school_id`, `student_id`, `ativo`. | Validar paginação, limite e filtros combinados. |
| Atualização parcial | `PATCH` usa schema parcial; todos os campos são opcionais. | Validar updates parciais e substituição completa de `fields`. |
| Exclusão definitiva | `DELETE` remove o documento do banco (findByIdAndDelete). | Validar remoção e segunda exclusão retorna `404`. |

## Massa de Dados Recomendada

| Entidade | Objetivo nos testes |
| :--- | :--- |
| Admin global com permissões ativas de `daily-log-templates` e `schools` | Executar cenários felizes de todos os endpoints. |
| Escola válida no sistema | Usar `school_id` válido na criação de templates. |
| Aluno (User com role student) válido na escola | Validar criação de template com `student_id` específico. |
| Usuário sem permissão de `daily-log-templates` ativa | Validar `403` mesmo com role permitida. |
| Teacher/Parent/Student sem permissão | Validar bloqueios por role em endpoints administrativos. |
| Template já criado durante a suite | Reutilizar `_id` para cenários de `GET /:id`, `PATCH`, e `DELETE`. |

## POST /daily-log-templates — Criação de Template

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Cenários felizes** | | | |
| Admin cria template válido com school genérico | Deve criar template com `201`, `fields` válido e `ativo=true` (default). | Fazer `POST /daily-log-templates` com `{ school_id, fields: [{key, label, type}] }`. | Retorna `201`; `data._id` presente; `data.school_id` igual; `data.fields` array com 1+ itens; `data.ativo=true`. |
| Admin cria template com `ativo=false` explícito | Deve persistir estado inativo já na criação. | Fazer `POST` com `{ ..., ativo: false }`. | Retorna `201`; `data.ativo=false`. |
| Admin cria template com `student_id` válido | Deve vincular template a aluno específico. | Fazer `POST` com `student_id` de user existente. | Retorna `201`; `data.student_id` igual ao enviado. |
| Campo tipo `select` com `options` válido | Deve aceitar e persistir array de opções. | Fazer `POST` com `type='select'` e `options=['A','B','C']`. | Retorna `201`; campo options presente com array salvo. |
| Campo extra no body | Não deve falhar por schema strict; campo extra é ignorado. | Fazer `POST` com campo adicional, ex.: `foo`. | Retorna `201`; campo extra não impacta criação. |
| **Cenários tristes** | | | |
| `school_id` inexistente | Deve rejeitar por validação de referência. | Fazer `POST` com `school_id` válido porém não existente no banco. | Retorna `400` ou `404`; erro de validação/referência. |
| `student_id` inexistente | Deve rejeitar por validação de referência. | Fazer `POST` com `student_id` válido porém não existente. | Retorna `400` ou `404`. |
| `school_id` com formato inválido | Deve rejeitar por validação de schema. | Fazer `POST` com `school_id='abc'`. | Retorna `400`; erro de validação de ObjectId. |
| `fields` vazio | Deve rejeitar por mínimo de 1 item. | Fazer `POST` com `fields: []`. | Retorna `400`; erro "O template precisa ter ao menos 1 campo.". |
| Campo sem `key` ou `label` | Deve rejeitar por campo obrigatório. | Fazer `POST` com `fields: [{ type: 'text' }]`. | Retorna `400`; erro em `key` e/ou `label`. |
| Campo com `type` inválido | Deve rejeitar por enum. | Enviar `type='invalid'`. | Retorna `400`; erro de enum em `type`. |
| Campo `select` sem `options` | Deve rejeitar por regra condicional. | Fazer `POST` com `fields: [{key:'x', label:'X', type:'select'}]`. | Retorna `400`; erro "Campo options é obrigatório para campos do tipo select...". |
| Campo `select` com `options` vazio | Deve rejeitar por mínimo de opções. | Enviar `options: []` no campo select. | Retorna `400`; erro de options. |
| Campo `text`/`boolean` com `options` | Schema não impede (options é opcional geral), mas não deveria ser necessário. | Enviar `options` em campo não-select. | Retorna `201`; campo options armazenado mesmo em tipo não-select (permitido). |
| Sem token | Deve bloquear na autenticação. | Fazer requisição sem `Authorization`. | Retorna `401` ou `498`. |
| Token em formato não Bearer | Pode passar no `AuthMiddleware`, mas falha no `AuthPermission`. | Enviar `Authorization` com token cru (sem `Bearer`). | Retorna `401` no `AuthPermission`. |
| Usuário sem role admin | Deve negar por política de role global. | Fazer `POST` com teacher/parent/student. | Retorna `403`. |
| Usuário com role admin mas sem permissão ativa da rota `daily-log-templates.post` | Deve negar por permissão de rota. | Desativar permissão de `post` em `daily-log-templates` e chamar endpoint. | Retorna `403`; mensagem de permissão negada. |

## GET /daily-log-templates — Listagem de Templates

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Cenários felizes** | | | |
| Admin lista templates | Deve retornar paginação com templates. | Fazer `GET /daily-log-templates` como admin. | Retorna `200`; `data.docs` array; metadados de paginação presentes. |
| Filtro por `school_id` | Deve filtrar templates da escola específica. | Criar templates para escolas A e B, consultar `?school_id=A`. | Retorna `200`; todos docs têm `school_id=A`. |
| Filtro por `student_id` | Deve filtrar templates vinculados a aluno específico. | Criar templates com e sem student_id, consultar `?student_id=X`. | Retorna `200`; apenas templates com `student_id=X`. |
| Filtro por `ativo=true` | Deve trazer apenas templates ativos. | Criar ativos/inativos, consultar `?ativo=true`. | Retorna `200`; todos `ativo=true`. |
| Filtro por `ativo=false` | Deve trazer apenas templates inativos. | Consultar `?ativo=false`. | Retorna `200`; todos `ativo=false`. |
| Paginação padrão | Deve assumir `page=1` e `limit=10`. | Chamar sem query de paginação. | Retorna `200`; `data.page=1`, `data.limit=10`. |
| Paginação customizada | Deve respeitar `page` e `limit`. | Chamar `?page=2&limit=5`. | Retorna `200`; `page=2`, `limit=5`. |
| `limit > 100` | Deve truncar em 100. | Chamar `?limit=200`. | Retorna `200`; `limit=100`. |
| Query com campo extra | Não deve falhar por strict; campo é ignorado. | Chamar `?foo=bar`. | Retorna `200`; sem erro por chave desconhecida. |
| **Cenários tristes** | | | |
| `school_id` inválido | Deve rejeitar por validação de query. | Chamar `?school_id=abc`. | Retorna `400`. |
| `student_id` inválido | Deve rejeitar por validação de query. | Chamar `?student_id=abc`. | Retorna `400`. |
| `ativo` valor não booleano | Deve rejeitar por validação de query. | Chamar `?ativo=1`. | Retorna `400`. |
| `page=0` ou negativo | Deve rejeitar por validação de query. | Chamar `?page=0` ou `?page=-1`. | Retorna `400`. |
| `limit=0` ou negativo | Deve rejeitar por validação de query. | Chamar `?limit=0` ou `?limit=-5`. | Retorna `400`. |
| Sem token | Deve bloquear autenticação. | Chamar sem header `Authorization`. | Retorna `401` ou `498`. |
| Usuário sem permissão `daily-log-templates.get` ativa | Mesmo com role adequada, deve negar. | Desativar permissão e chamar endpoint. | Retorna `403`. |

## GET /daily-log-templates/:id — Detalhe de Template por ID

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Cenários felizes** | | | |
| Admin consulta template existente | Deve retornar detalhes completos do template. | Fazer `GET /daily-log-templates/{id}` com template ativo. | Retorna `200`; `data._id` igual; campos `school_id`, `fields`, `ativo` presentes. |
| Consulta template com `student_id` | Deve retornar com `student_id` preenchido. | Consultar template criado com student_id específico. | Retorna `200`; `data.student_id` presente. |
| Consulta template inativo | Não deve filtrar por `ativo`; retorna mesmo inativo. | Inativar template e consultar por ID. | Retorna `200`; `data.ativo=false`. |
| **Cenários tristes** | | | |
| ID inválido (formato) | Deve rejeitar por validação de path. | `GET /daily-log-templates/abc`. | Retorna `400`. |
| ID válido inexistente | Repositório lança recurso não encontrado. | `GET /daily-log-templates/000000000000000000000000`. | Retorna `404`; mensagem "DailyLogTemplate não encontrado(a).". |
| Sem token | Deve bloquear autenticação. | Requisição sem auth. | Retorna `401` ou `498`. |
| Usuário sem permissão `daily-log-templates.get` ativa | Deve negar por camada de permissão. | Desativar permissão e chamar endpoint. | Retorna `403`. |

## PATCH /daily-log-templates/:id — Atualização de Template

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Cenários felizes** | | | |
| Admin atualiza `fields` | Deve substituir array de campos e retornar atualizado. | Fazer `PATCH` com novo array `fields`. | Retorna `200`; `data.fields` igual ao payload. |
| Admin atualiza `ativo` | Deve alternar status do template. | Fazer `PATCH` com `{ ativo: false }` e depois `{ ativo: true }`. | Retorna `200` em ambas; valor refletido na resposta. |
| Admin adiciona `student_id` | Deve vincular template a aluno. | Fazer `PATCH` com `student_id` válido. | Retorna `200`; `data.student_id` atualizado. |
| Admin remove `student_id` | Deve setar para null. | Fazer `PATCH` com `{ student_id: null }`. | Retorna `200`; `data.student_id` null. |
| Body vazio `{}` | Schema parcial permite; sem alterações. | Fazer `PATCH` com `{}`. | Retorna `200`; sem erro de validação. |
| Campo extra no body | Não deve falhar por strict; extra é ignorado. | Enviar `{ fields, foo: "bar" }`. | Retorna `200`. |
| Atualiza campo select mantendo options options válido | Deve atualizar fields com options preenchido. | Enviar `fields: [{key:'mood', label:'Disposição', type:'select', options:['Feliz','Triste']}]`. | Retorna `200`; options salvo corretamente. |
| **Cenários tristes** | | | |
| ID inválido | Deve rejeitar por validação de path. | `PATCH /daily-log-templates/abc`. | Retorna `400`. |
| ID inexistente | Deve retornar not found. | `PATCH /daily-log-templates/000000000000000000000000`. | Retorna `404`. |
| `fields` vazio na atualização | Schema parcial aceita, mas se enviado vazio deve bater mínimo. | Fazer `PATCH` com `{ fields: [] }`. | Retorna `400`; erro "O template precisa ter ao menos 1 campo.". |
| Campo select sem options | Deve rejeitar por validação condicional. | Enviar `{ fields: [{key:'x', label:'X', type:'select'}] }`. | Retorna `400`. |
| `school_id` inexistente na atualização | Deve rejeitar por referência. | Fazer `PATCH` com `{ school_id: idInexistente }`. | Retorna `400` ou `404`. |
| `student_id` inexistente na atualização | Deve rejeitar por referência. | Fazer `PATCH` com `{ student_id: idInexistente }`. | Retorna `400` ou `404`. |
| Sem token | Deve bloquear autenticação. | Requisição sem auth. | Retorna `401` ou `498`. |
| Usuário sem permissão `daily-log-templates.patch` ativa | Deve negar por camada de permissão. | Desativar permissão e chamar endpoint. | Retorna `403`. |

## DELETE /daily-log-templates/:id — Remoção de Template

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Cenários felizes** | | | |
| Admin remove template ativo | Deve remover template e responder sucesso. | Chamar `DELETE /daily-log-templates/{id}` autenticado. | Retorna `200`; `error=false`; `data` presente com dados removidos. |
| Segunda remoção do mesmo ID | Deve indicar inexistência após remoção prévia. | Repetir `DELETE` para mesmo `id`. | Retorna `404`; `error=true`. |
| Template removido não aparece na listagem | Após delete, listagem não retorna item. | Remover e chamar `GET /daily-log-templates` com filtro por ID. | Resultado vazio ou não inclui ID removido. |
| **Cenários tristes** | | | |
| ID inválido | Deve rejeitar por validação de path. | `DELETE /daily-log-templates/abc`. | Retorna `400`. |
| ID válido inexistente | Deve retornar not found. | `DELETE /daily-log-templates/000000000000000000000000`. | Retorna `404`. |
| Sem token | Deve bloquear autenticação. | Chamar sem header `Authorization`. | Retorna `401` ou `498`. |
| Usuário sem permissão `daily-log-templates.delete` ativa | Deve negar por camada de permissão. | Desativar permissão e chamar endpoint. | Retorna `403`. |

## Cenários Transversais Obrigatórios (E2E)

| Tema | Verificação E2E |
| :--- | :--- |
| Contrato padrão de resposta | Em sucesso: `error=false`, `code`, `message`, `data`, `errors=[]`. Em erro: `error=true`, `data=null`, `errors` preenchido quando aplicável. |
| Mensagens de erro de validação | Confirmar prefixo "Erro de validação." e detalhes com `path`/`message`. |
| Sensibilidade de autenticação | Cobrir ausência de token (`401`/`498`), token inválido (`401`) e header sem prefixo Bearer (`401`). |
| Permissão por rota no banco | Cobrir cenário em que rota existe, role bate, mas permissão por método está inativa (`403`). |
| Dependência de rota cadastrada | Se entrada `route+domain` não existir na coleção de rotas, requisição deve falhar com `404` ("Rota não encontrado(a)."). |
| Validação de referências | Garantir que `school_id` e `student_id` apontam para documentos existentes; senão, `400`/`404`. |

## Estratégia de Organização dos Testes E2E

| Bloco | Objetivo |
| :--- | :--- |
| `beforeAll` | Preparar token admin, schoolId válida e optional studentId válido. Criar templates iniciais se necessário. |
| `describe('DailyLogTemplate - integração de rotas')` | Cobrir ciclo completo de CRUD e validações específicas de domínio. |
| `describe('POST /daily-log-templates')` | Validar criação com payloads válidos, regras de fields, referências e erros de validação. |
| `describe('GET /daily-log-templates')` | Validar listagem, filtros (school_id, student_id, ativo) e paginação. |
| `describe('GET /daily-log-templates/:id')` | Validar consulta por ID, erros de ID e bloqueios de autorização. |
| `describe('PATCH /daily-log-templates/:id')` | Validar atualização parcial, full replace de fields e validações. |
| `describe('DELETE /daily-log-templates/:id')` | Validar remoção, inexistência pós-remoção e comportamento idempotente. |
| `afterAll` | Limpar templates criados durante a execução (se aplicável). |

## Observações de Implementação para os Casos E2E

| Ponto | Diretriz |
| :--- | :--- |
| IDs válidos para testes de 404 | Usar `000000000000000000000000` para manter ObjectId válido e inexistente. |
| Massa para permissões | Preparar usuário de teste com permissão desligada em `daily-log-templates` para validar `403` por permissão. |
| Evitar flakiness de paginação | Criar dados com sufixo único por timestamp e limpar massa ao final quando aplicável. |
| Validação de campos select | Garantir que testes de `type='select'` passem `options` com array válido e testem falha quando ausente. |
| Referências dependentes | Criar school e student (se usar student_id) antes dos testes de template que dependem deles. |
| Soft vs hard delete | Este recurso usa DELETE hard (findByIdAndDelete), não marca `ativo=false`. |
