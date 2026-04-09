# Suite de Testes E2E — Like (`/posts/:id/like`)

Testes E2E (endpoint) que validam os fluxos principais e regras de negócio das rotas de Like (apreciação/gosto em comunicados).

Arquivo: `src/tests/routes/likeRoutes.test.js`

## Visão de Fluxo e Regras de Negócio

| Regra | Comportamento Atual do Sistema | Impacto na Suite E2E |
| :--- | :--- | :--- |
| Autenticação obrigatória | Rotas de `like` exigem token válido em `Authorization: Bearer <token>`. | Cobrir ausência de token em toggle like, aceitando variação `401`/`498`. |
| Envelope padrão de sucesso | Em cenários felizes, resposta retorna `error=false` e `data` preenchido. | Validar envelope mínimo em `POST`. |
| Toggle automático | Primeira chamada cria like; segunda chamada remove like (toggle). | Encadear chamadas para validar criação e remoção. |
| User ID automático | `user_id` é preenchido automaticamente pelo `userId` do token. | Não enviar `user_id` no body; validar que resposta contém `user_id` do usuário autenticado. |
| Post deve existir | O post (post_id) deve existir para permitir o like. | Cobrir erro `404` quando post não existe. |
| Validação de ID | Post ID deve ser um ObjectId válido (24 caracteres hexadecimais). | Cobrir erro `400`/`422` com formato inválido. |
| Permissão por escola | Usuário deve pertencer à mesma escola do post ou ser admin. | Validação de escopo de like por membershop escolar. |
| Permissão por visibilidade | Para posts com `target.scope='class'`, apenas usuários da turma podem dar like. | Validação de permissão por turma quando aplicável. |
| Admin bypass | Usuários com role admin podem dar like em qualquer post da escola. | Admin consegue dar like sem restrições. |
| Resposta de criação | Ao criar like, retorna objeto com `_id`, `post_id`, `user_id` e `created_at`. | Validar estrutura completa de criação. |
| Resposta de remoção | Ao remover like, retorna objeto com mensagem de sucesso. | Validar que remoção retorna `{ message: "Like removido com sucesso." }`. |
| Metadados automáticos | `created_at` é preenchido automaticamente na criação. | Verificar presença e formato de timestamp. |

## Massa de Dados Recomendada

| Entidade | Objetivo nos testes |
| :--- | :--- |
| Admin válido para login | Obter token para executar todos os fluxos de like com permissões completas. |
| Teacher/Staff autenticado | Testar operações de like como usuário comum da escola. |
| Escola existente no sistema | Validar que posts da escola permitem likes de usuários membros. |
| Post com target.scope=all | Base para testes de like acessível a todos. |
| Post com target.scope=class | Validar restrição de like por turma específica. |
| ID válido inexistente (`000000000000000000000000`) | Forçar erro 404 ao tentar like em post inexistente. |

## Pré-condições Técnicas da Suite

| Etapa | Objetivo | Critério |
| :--- | :--- | :--- |
| `loginAndGetToken()` | Autenticar com credenciais admin | `POST /login` retorna `200` e token em `data.user.access_token`. |
| `getFirstSchoolId(token)` | Obter escola para contexto de posts | `GET /schools` retorna `200` e ao menos um `_id`. |
| `createPost(token, schoolId)` | Criar post base para testar likes | `POST /schools/{schoolId}/post` retorna `201` com post `_id`. |

## POST /posts/:id/like — Toggle Like em Post

| Funcionalidade | Comportamento Esperado | Verificações | Critérios de Aceite |
| :--- | :--- | :--- | :--- |
| **Cenários felizes** | | | |
| Usuário autenticado cria like em post válido | Deve persistir like e retornar `200` com dados. | Enviar `POST /posts/{validPostId}/like` com token válido. | Retorna `200`; `error=false`; `data._id` presente; `data.post_id` igual ao post; `data.user_id` igual ao usuário logado; `created_at` presente. |
| Múltiplos usuários dão like no mesmo post | Deve permitir likes simultâneos de usuários diferentes para o mesmo post. | Usuário A faz like em post; usuário B faz like no mesmo post. | Ambos retornam `200`; `data.user_id` diferente em cada resposta. |
| Toggle remove like ao chamar novamente | Segunda chamada do mesmo usuário remove seu like. | 1. `POST /posts/{id}/like` (criar); 2. `POST /posts/{id}/like` (remover). | Primeira retorna `201` ou `200` com `_id`; segunda retorna `200` com `message="Like removido com sucesso."`. |
| Idempotência em remoção | Chamar toggle novamente em like já removido mantém sucesso. | 1. Criar like; 2. Remover like (toggle); 3. Remover novamente. | Primeira e segunda chamada indicam sucesso; terceira pode retornar `200` com mensagem de sucesso (sem like para remover). |
| Admin consegue dar like em qualquer post da escola | Usuário admin não tem restrições de visibilidade. | Admin fazer like em post class-scoped. | Retorna `200`; like criado sem restrições. |
| **Cenários tristes** | | | |
| Sem token | Deve bloquear requisição não autenticada. | Chamar `POST /posts/{id}/like` sem header `Authorization`. | Retorna `401` ou `498`. |
| Post ID com formato inválido | Deve rejeitar por validação de params. | Chamar `POST /posts/abc/like`. | Retorna `400` ou `422`. |
| Post ID válido mas inexistente | Deve retornar `404`. | Chamar `POST /posts/000000000000000000000000/like` com payload válido. | Retorna `404`; `error=true`; mensagem indica "post não foi encontrado.". |
| Usuário de escola diferente tenta dar like | Deve rejeitar por validação de pertencimento. | Usuário de Escola B tenta like em post de Escola A. | Retorna `403`; `error=true`; mensagem indica "Usuário não pode dar like em posts de escolas diferentes.". |
| Usuário não pertence à turma de post class-scoped | Deve rejeitar por validação de turma. | Usuário de turma B tenta like em post com `target.scope='class'` da turma A. | Retorna `403`; `error=true`. |
| Usuário não-admin sem permissão adequada | Deve bloquear por falta de permissão. | Usuário sem role admin ou permissão específica. | Retorna `403` conforme política de `AuthPermission`. |

## Cenários Transversais Obrigatórios (E2E)

| Tema | Verificação E2E |
| :--- | :--- |
| Contrato padrão de resposta (sucesso) | `error=false`, `code`, `message`, `data` preenchido (like criado ou removido). |
| Contrato padrão de resposta (erro) | `error=true`, `data=null`, `errors` preenchido quando aplicável. |
| Autenticação | Cobrir ausência de token (`498`), token inválido (`498`) e header sem Bearer (`401`). |
| Autorização | Cobrir permissão de rota (`403`) se `AuthPermission` bloquear. |
| Validação de ID | Cobrir formato inválido (`400`/`422`). |
| Regra de negócio - School | Usuário de escola diferente recebe `403`. |
| Regra de negócio - Class | Usuário não pertencente à turma do post recebe `403`. |
| Metadados | Like criado contém `_id`, `post_id`, `user_id`, `created_at`. |
| Toggle | Primeira chamada cria; segunda remove; terceira mantém idempotência. |

## Cenários de Fluxo Integrado

| Cenário | Descrição | Etapas | Critério de Sucesso |
| :--- | :--- | :--- | :--- |
| Criar, Like, Remover Like | Demonstração completa de toggle | 1. POST criar post; 2. POST like (criar); 3. POST like novamente (remover). | Post criado com sucesso; primeiro like retorna `200` com `_id`; segundo like retorna `200` com mensagem de remoção. |
| Multi-usuário gostando do mesmo post | like simultâneo de vários usuários | 1. Admin cria post; 2. User A faz like; 3. User B faz like; 4. User A remove like. | Cada operação retorna `200`; post mantém like de User B; User A pode remover sem afetar User B. |
| Admin bypass em post class-scoped | Admin consegue dar like mesmo com `scope='class'` | 1. Criar post com `scope='class'`; 2. Admin (fora da turma) faz like. | Like criado com sucesso para admin. |
| Rejeição de like por falta de pertencimento à escola | Usuário de outra escola não consegue dar like | 1. Usuário de Escola A tenta like em post de Escola B. | Retorna `403` com mensagem de rejeição. |

## Estratégia de Organização dos Testes E2E

| Bloco | Objetivo | Cobertura |
| :--- | :--- | :--- |
| **Autenticação** | Validar controle de acesso | Sem token, token inválido, com token válido. |
| **Validação de Entrada** | Validar rejeição de IDs inválidos | Post ID formato inválido, Post ID inexistente. |
| **Operações de Criação** | Validar criação de likes | Like válido, resposta com metadados, múltiplos usuários. |
| **Operações de Toggle** | Validar remoção via toggle | Criar like, remover like, idempotência. |
| **Regras de Negócio** | Validar permissões e escopos | Restrição por escola, restrição por turma, bypass admin. |
| **Resposta Estruturada** | Validar envelope e contrato | Sucesso com `_id`, remoção com mensagem. |

## Notas de Implementação

- **Toggle**: Diferente de endpoints separados (create/delete), a rota de like usa toggle em uma única operação POST para simplificar a experiência.
- **Idempotência**: Chamadas sucessivas sem mudança de estado devem retornar sucesso; segunda remoção pode retornar `200` com contador zero ou mensagem padrão.
- **Restrições de Acesso**: Like funciona com duas camadas:
  1. **Middleware de Autenticação**: Valida token e user.
  2. **Regras de Negócio**: Valida pertencimento a escola e, se aplicável, a turma.
- **Admin Bypass**: Usuários com role `admin` podem contornar restrições de turma mas devem pertencer à escola.
- **Resposta de Remoção**: Quando like é removido, retorna estrutura `{ message: "..." }` em vez de `{ _id, post_id, ... }`.
