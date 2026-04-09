# Suite de Testes E2E — Post (`/schools/:schoolId/posts` e `/posts`)

Testes E2E (endpoint) que validam os fluxos principais e regras de negócio das rotas de Post (Comunicados/Announcements).

Arquivo: `src/tests/routes/postRoutes.test.js`

**Índice de Rotas Testadas:**
- `POST /schools/:schoolId/posts` — Criar comunicado
- `GET /schools/:schoolId/posts` — Listar comunicados da escola
- `GET /posts/:id` — Detalhe de post
- `PATCH /posts/:id` — Atualização de post
- `DELETE /posts/:id` — Exclusão de post

## Visão de Fluxo e Regras de Negócio

| Regra | Comportamento Atual do Sistema | Impacto na Suite E2E |
| :--- | :--- | :--- |
| Autenticação obrigatória | Rotas de `/schools/:schoolId/posts` e `/posts/:id` exigem token válido em `Authorization: Bearer <token>`. | Cobrir ausência de token em criação, listagem e atualização, aceitando variação `401`/`498`. |
| Envelope padrão de sucesso | Em cenários felizes, resposta retorna `error=false` e `data` preenchido. | Validar envelope mínimo em `POST`, `GET`, `PATCH`. |
| Criação aninhada em school | `POST /schools/:schoolId/posts` obriga passagem de `schoolId` na rota. | Validar que `schoolId` inválido retorna erro; `schoolId` válido cria post com `school_id` correto. |
| Autor automático | `author_id` é preenchido automaticamente pelo `userId` do token. | Não incluir `author_id` no payload; validar que resposta contém `author_id` do usuário autenticado. |
| Ciclo de vida completo | Post pode ser criado, listado, consultado por ID, atualizado. | Encadear cenários para reutilizar `createdPostId` entre operações. |
| Target com scope obrigatório | `target.scope` padrão é `'all'`; pode ser `'class'` se `target_id` válido. | Validar POST/PATCH com `scope='class'` sem `target_id` retorna `422`. |
| Validação de turma (class) | Para `scope='class'`, `target_id` deve apontar para turma (class) válida e existente. | Cobrir `422` quando `target_id` não existe no banco. |
| Soft delete via active | Usar `active=false` em PATCH para desativar; não remover fisicamente. | Validar que após PATCH com `active=false`, GET sem filtro desativa listagem ou filtra por status. |
| Atualização por autor ou admin | Autor não-admin pode atualizar apenas seu post; admin pode atualizar qualquer. | Testar PATCH com autor vs admin; validar `403` para autor não-dono ou não-admin. |
| Admin limpa target_id ao atualizar | Quando admin faz PATCH com `scope='all'`, qualquer `target_id` é removido. | Validar que após PATCH do admin sem target_id, post não contém target_id mesmo se havia antes. |
| Filtros de listagem | Listagem aceitaancho filtros (author_id, school_id, title, content, active, target.scope). | Validar paginação, limite de 100 docs e filtros em combinação. |
| Metadados automáticos | `created_at` e `updated_at` são preenchidos automaticamente. | Verificar presença e formato de timestamps. |

## Massa de Dados Recomendada

| Entidade | Objetivo nos testes |
| :--- | :--- |
| Admin válido para login | Obter token para executar todos os fluxos autenticados de posts. |
| Teacher/Staff não-admin | Validar controle de atualização de próprio post vs post alheio. |
| Escola existente no sistema | Usar `school_id` válido na criação de posts via `POST /schools/:schoolId/post`. |
| Turma (class) associada à escola | Usar como `target_id` válido no cenário `scope='class'`. |
| Post base criado durante a suite | Reutilizar `_id` para cenários de `GET /:id`, `PATCH`, filtro e teste de proprietário. |
| ID válido inexistente (`000000000000000000000000`) | Forçar erro de turma inválida em `target.target_id` com formato ObjectId válido. |

## Pré-condições Técnicas da Suite

| Etapa | Objetivo | Critério |
| :--- | :--- | :--- |
| `loginAndGetToken()` | Autenticar com credenciais admin | `POST /login` retorna `200` e token em `data.user.access_token`. |
| `getFirstSchoolId(token)` | Obter escola para payloads de criação | `GET /schools` retorna `200` e ao menos um `_id`. |
| `tryGetClassTargetId(token, schoolId)` | Descobrir turma para cenário `scope='class'` | `GET /classes?school_id={schoolId}&limit=1` pode retornar `_id`; se não houver, cenário fica condicional. |

## POST /schools/:schoolId/posts — Criação de Post/Comunicado

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Cenários felizes** | | | |
| Criar post com payload válido (scope=all) | Deve persistir post e retornar `201` com todos os metadados. | Enviar `title`, `content`, `target.scope='all'`, `active=true`, `attachments=[]`. | Retorna `201`; `error=false`; `data._id` presente; `data.title` e `data.content` corretos; `data.school_id` igual ao da rota; `data.author_id` igual ao do token; `likes_count`, `totalLikes`, `user_liked` presentes; `created_at` e `updated_at` presentes. |
| Cria post com `scope='class'` e turma válida | Deve persistir post com alvo de turma. | Enviar `target.scope='class'` com `target_id` válido de class encontrado na pré-condição. | Retorna `201`; `data.target.scope='class'`; `data.target.target_id` igual ao enviado. |
| Post sem `active` explícito | Deve assumir `active=true` como padrão. | Enviar payload sem `active`. | Retorna `201`; `data.active=true`. |
| Post com `active=false` explícito | Deve respeitar estado inativo na criação. | Enviar `active=false` no payload. | Retorna `201`; `data.active=false`. |
| Post sem `target` explícito | Deve assumir `target.scope='all'` como padrão. | Enviar payload sem campo `target`. | Retorna `201`; `data.target.scope='all'`. |
| Post com `attachments` array vazio | Deve aceitar array vazio sem erro. | Enviar `attachments=[]`. | Retorna `201`; `data.attachments=[]`. |
| Post com `attachments` URLs válidas | Deve persistir array de URLs. | Enviar `attachments=['https://...', 'https://...']`. | Retorna `201`; `data.attachments` igual ao enviado. |
| Campo extra no body | Não deve falhar por schema strict; campo extra é ignorado. | Enviar payload com chave desconhecida, ex.: `foo=bar`. | Retorna `201`; campo extra não impacta criação. |
| **Cenários tristes** | | | |
| Sem token | Deve bloquear requisição não autenticada. | Chamar `POST /schools/:schoolId/post` sem `Authorization`. | Retorna `401` ou `498`. |
| `schoolId` com formato inválido | Deve rejeitar por validação de params. | Chamar `POST /schools/abc/post`. | Retorna `400` ou `422`. |
| `schoolId` válido mas inexistente | Deve rejeitar por regra de domínio. | Enviar `POST /schools/000000000000000000000000/posts` com payload válido. | Retorna `404` ou `422`; mensagem indica "school_id não foi encontrado.". |
| `title` vazio ou ausente | Deve rejeitar por validação Zod. | `POST` sem `title` ou com `title=""`. | Retorna `400` ou `422`. |
| `content` vazio ou ausente | Deve rejeitar por validação Zod. | `POST` sem `content` ou com `content=""`. | Retorna `400` ou `422`. |
| `scope='class'` sem `target_id` | Deve rejeitar por regra de domínio obrigatória. | Enviar `target.scope='class'` sem `target_id`. | Retorna `422`; mensagem inclui "target_id não é válido ou está ausente.". |
| `target_id` inválido (não-ObjectId) | Deve rejeitar por validação Zod. | Enviar `target_id='abc'`. | Retorna `400` ou `422`. |
| `target_id` válido mas inexistente (class não existe) | Deve rejeitar por regra de domínio. | Enviar `target_id='000000000000000000000000'` com `scope='class'`. | Retorna `422`; mensagem inclui "class_id não foi encontrado.". |

## GET /schools/:schoolId/posts — Listagem de Posts da Escola

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Cenários felizes** | | | |
| Admin lista posts da escola | Deve retornar paginação filtrada por `school_id` da rota. | Fazer `GET /schools/{schoolA}/posts` como admin. | Retorna `200`; `error=false`; `data.docs` array; todos os docs contêm `school_id={schoolA}`. |
| Paginação em escopo escolar | Deve respeitar `page` e `limit`. | Chamar `?page=1&limit=5`. | Retorna `200`; `page=1`, `limit=5`. |
| Filtro adicional por `author_id` dentro da escola | Deve combinar filtro de school com author. | Chamar `?author_id={userA}`. | Retorna `200`; todos os docs: `school_id={schoolA}` E `author_id={userA}`. |
| Filtro por `title` (parcial/case-insensitive) | Deve filtrar por regex no título dentro da escola. | Consultar `?title=reunião`. | Retorna `200`; apenas docs da escola com "reunião" no título. |
| Filtro por `content` (parcial/case-insensitive) | Deve filtrar por regex no conteúdo dentro da escola. | Consultar `?content=importante`. | Retorna `200`; apenas docs da escola contendo "importante" no content. |
| Filtro por `active=true` e `active=false` | Deve aplicar filtro de status dentro da escola. | Criar posts ativos e inativos, depois consultar ambas opções. | Retorna `200`; resultado respeita status solicitado e escola. |
| Filtro por `scope` dentro da escola | Deve filtrar scope dentro do escopo escolar. | Chamar `?scope=class`. | Retorna `200`; todos com `school_id={schoolA}` E `scope='class'`. |
| Filtros combinados | Deve respeitar múltiplos filtros simultâneos na escola. | Consultar `?author_id={userA}&scope=class&active=true`. | Retorna `200`; resultado atende a todos os critérios. |
| Query com campo extra desconhecido | Não deve falhar por strict; campo é ignorado. | Chamar `?foo=bar`. | Retorna `200`; sem erro por chave desconhecida. |
| **Cenários tristes** | | | |
| Sem token | Deve bloquear autenticação. | Chamar `GET /schools/{schoolId}/posts` sem header `Authorization`. | Retorna `498` ou `401`. |
| `schoolId` com formato inválido | Deve rejeitar por validação de params. | Chamar `GET /schools/abc/posts`. | Retorna `400` ou `422`. |
| `schoolId` válido mas inexistente | Sistema pode retornar `404` ou lista vazia (`totalDocs=0`); comportamento a validar com API. | Chamar `GET /schools/000000000000000000000000/posts`. | Retorna `404` ou `200` com `totalDocs=0`. |
| `author_id` inválido | Deve rejeitar por validação de query. | Chamar `?author_id=xyz`. | Retorna `400` ou `422`. |
| `scope` fora de enum (`all`, `class`) | Deve rejeitar por validação de query. | Chamar `?scope=student`. | Retorna `400` ou `422`. |
| `page=0` | Deve rejeitar por validação de query (page >= 1). | Chamar `?page=0`. | Retorna `400` ou `422`. |
| `limit=0` | Deve rejeitar por validação de query (limit >= 1). | Chamar `?limit=0`. | Retorna `400` ou `422`. |

## GET /posts/:id — Detalhe de Post

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Cenários felizes** | | | |
| Recupera post criado pelo ID | Deve retornar documento completo com metadados. | Fazer `GET /posts/{createdPostId}` após criação. | Retorna `200`; `data._id` igual ao criado; `data.title`, `data.content`, `data.author_id`, `data.school_id`, `data.target`, `data.created_at`, `data.updated_at`, `likes_count`, `totalLikes`, `user_liked` presentes. |
| **Cenários tristes** | | | |
| Sem token | Deve bloquear autenticação. | Chamar `GET /posts/{id}` sem `Authorization`. | Retorna `498` ou `401`. |
| ID com formato inválido | Deve rejeitar por validação de params. | Chamar `GET /posts/abc`. | Retorna `400` ou `422`. |
| ID válido mas inexistente | Deve retornar `404`. | Chamar `GET /posts/000000000000000000000000`. | Retorna `404`; `error=true`. |

## PATCH /posts/:id — Atualização de Post

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Cenários felizes** | | | |
| Admin atualiza post de qualquer autor | Deve permitir e persistir mudanças. | Fazer `PATCH /posts/{createdPostId}` com `title="Novo título"` como admin. | Retorna `200`; `data.title="Novo título"`; `updated_at` atualizado. |
| Autor não-admin atualiza seu próprio post | Deve permitir. | Fazer `PATCH /posts/{createdPostId}` (onde `author_id` é o usuário logado) com `content="Novo conteúdo"`. | Retorna `200`; `data.content="Novo conteúdo"`. |
| Atualização parcial de campos | Deve respeitar envio parcial (apenas campos presente no body). | Fazer `PATCH` com apenas `title` (sem `content`). | Retorna `200`; `title` atualizado; `content` permanece inalterado. |
| Admin atualiza `target.scope=all` e limpa `target_id` | Deve remover qualquer `target_id` anterior. | Fazer `PATCH /posts/{createdPostId}` que tinha `scope='class'` com novo `target.scope='all'` (sem `target_id`). | Retorna `200`; `target.scope='all'`; `target.target_id` ausente ou nulo. |
| Atualização de `active` | Deve persistir novo status. | Fazer `PATCH /posts/{id}` com `active=false`. | Retorna `200`; `data.active=false`. |
| **Cenários tristes** | | | |
| Sem token | Deve bloquear autenticação. | Chamar `PATCH /posts/{id}` sem `Authorization`. | Retorna `498` ou `401`. |
| ID com formato inválido | Deve rejeitar por validação de params. | Chamar `PATCH /posts/abc`. | Retorna `400` ou `422`. |
| ID válido mas inexistente | Deve retornar `404`. | Chamar `PATCH /posts/000000000000000000000000`. | Retorna `404`; `error=true`. |
| Autor não-admin tenta atualizar post alheio | Deve negar com `403`. | Criar post com admin; tentar `PATCH` como teacher (não-dono). | Retorna `403`; `error=true`. |
| Atualizar para `scope='class'` sem `target_id` (admin) | Deve rejeitar por regra de domínio. | Fazer `PATCH` com `target.scope='class'` sem `target_id`. | Retorna `422`; mensagem inclui "target_id não é válido ou está ausente.". |
| Atualizar com `target_id` inválido (class não existe) | Deve rejeitar por regra de domínio. | Fazer `PATCH` com `target.scope='class'` e `target_id='000000000000000000000000'`. | Retorna `422` ou `404`; mensagem inclui "class_id não foi encontrado.". |

## DELETE /posts/:id — Exclusão de Post

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Cenários felizes** | | | |
| Admin deleta post de qualquer autor | Deve permitir exclusão e retornar `200`. | Fazer `DELETE /posts/{createdPostId}` como admin. | Retorna `200`; `error=false`; `data.message` contém "sucesso"; post não pode ser recuperado via GET /:id (retorna `404`). |
| Autor não-admin deleta seu próprio post | Deve permitir exclusão do post próprio. | Criar post, depois `DELETE /posts/{createdPostId}` como o autor. | Retorna `200`; `data.message` contém "sucesso". |
| Exclusão retorna mensagem de sucesso | Deve indicar que post foi deletado com sucesso. | Fazer `DELETE` e validar resposta. | Retorna `200`; `data.message === "Anúncio deletado com sucesso"`. |
| **Cenários tristes** | | | |
| Sem token | Deve bloquear autenticação. | Chamar `DELETE /posts/{id}` sem `Authorization`. | Retorna `498` ou `401`. |
| ID com formato inválido | Deve rejeitar por validação de params. | Chamar `DELETE /posts/abc`. | Retorna `400` ou `422`. |
| ID válido mas inexistente | Deve retornar `404`. | Chamar `DELETE /posts/000000000000000000000000`. | Retorna `404`; `error=true`. |
| Autor não-admin tenta deletar post alheio | Deve negar com `403`. | Criar post com admin; tentar `DELETE` como teacher (não-dono). | Retorna `403`; `error=true`. |

## DELETE /post/:id — Exclusão de Post

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Cenários felizes** | | | |
| Admin deleta post de qualquer autor | Deve permitir exclusão e retornar `200`. | Fazer `DELETE /post/{createdPostId}` como admin. | Retorna `200`; `error=false`; `data.message` contém "sucesso"; post não pode ser recuperado via GET /:id (retorna `404`). |
| Autor não-admin deleta seu próprio post | Deve permitir exclusão do post próprio. | Criar post, depois `DELETE /post/{createdPostId}` como o autor. | Retorna `200`; `data.message` contém "sucesso". |
| Exclusão retorna mensagem de sucesso | Deve indicar que post foi deletado com sucesso. | Fazer `DELETE` e validar resposta. | Retorna `200`; `data.message === "Anúncio deletado com sucesso"`. |
| **Cenários tristes** | | | |
| Sem token | Deve bloquear autenticação. | Chamar `DELETE /post/{id}` sem `Authorization`. | Retorna `498` ou `401`. |
| ID com formato inválido | Deve rejeitar por validação de params. | Chamar `DELETE /post/abc`. | Retorna `400` ou `422`. |
| ID válido mas inexistente | Deve retornar `404`. | Chamar `DELETE /posts/000000000000000000000000`. | Retorna `404`; `error=true`. |
| Autor não-admin tenta deletar post alheio | Deve negar com `403`. | Criar post com admin; tentar `DELETE` como teacher (não-dono). | Retorna `403`; `error=true`. |

## Cenários de Fluxo Integrado

| Cenário | Descrição | Etapas | Critério de Sucesso |
| :--- | :--- | :--- | :--- |
| Criar, Listar, Detalhar, Atualizar, Deletar | Ciclo completo de CRUD com delete final | 1. POST `/schools/:schoolId/posts` create; 2. GET `/schools/:schoolId/posts` list; 3. GET `/posts/:id`; 4. PATCH `/posts/:id` update title; 5. DELETE `/posts/:id`; 6. GET `/posts/:id` (deve retornar 404). | Todos os passos até DELETE retornam `200/201`; DELETE retorna `200`; GET final retorna `404`. |
| Criar, Listar, Detalhar, Atualizar, Desativar | Ciclo completo de CRUD com soft-delete | 1. POST `/schools/:schoolId/posts` create; 2. GET `/schools/:schoolId/posts` list; 3. GET `/posts/:id`; 4. PATCH `/posts/:id` update title; 5. PATCH `/posts/:id` active=false. | Todos os passos retornam `200/201`; dados persistem corretamente entre chamadas; post final fica inativo. |
| Criar post class-scoped e validar persistência | Post com turma específica | 1. POST `/schools/:schoolId/posts` com `scope='class'` e `target_id` válido; 2. GET `/posts/:id` e validar target; 3. PATCH `/posts/:id` com novo `scope` e verificar alteração. | POST retorna `201` com `target.scope='class'`; GET reflete dados; PATCH atualiza conforme esperado. |
| Admin limpa `target_id` ao atualizar | Teste de remoção automática de target_id por admin | 1. POST `/schools/:schoolId/posts` class-scoped; 2. PATCH `/posts/:id` como admin com `scope='all'` (sem enviar target_id); 3. GET `/posts/:id` | PATCH retorna `200`; GET `/posts/:id` não contém `target_id`. |
