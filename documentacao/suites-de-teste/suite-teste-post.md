# Suite de Testes de Integracao - Post (/schools/:schoolId/posts e /posts)

Testes de integracao (endpoint) que validam os fluxos de listagem, detalhamento, criacao, atualizacao e exclusao de postagens.

Arquivo: src/tests/routes/postRoutes.test.js

## Visao de Fluxo e Regras de Negocio

| Regra                               | Comportamento Atual do Sistema                                                                           | Impacto na Suite de Integracao                                               |
| :---------------------------------- | :-------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------- |
| Autenticacao obrigatoria            | Rotas usam autenticacao por token Bearer.                                                                | Cobrir listagem/criacao sem token (401/498) e fluxo autenticado com token valido. |
| Validacao Zod                       | Payload invalido e rejeitado por validacao.                                                              | Cobrir erro 400 em criacao/atualizacao invalida.                             |
| Escopo de Postagem                  | Postagens podem ter scope "all" ou "class".                                                              | Validar criacao com diferentes escopos.                                      |
| Obrigatoriedade de target_id        | Se scope for diferente de "all", target_id deve ser informado.                                            | Cobrir erro 422 ao omitir target_id para scope "class".                      |
| Vinculacao a Escola                 | Postagens sao criadas vinculadas a uma escola especifica via schoolId na rota.                            | Validar school_id no objeto retornado.                                       |
| Busca por id no post                | GET por id retorna postagem ou not found.                                                                 | Cobrir detalhe por id e 404 para id inexistente.                             |
| Delecao de Postagem                 | DELETE remove a postagem (ou realiza soft delete dependendo da regra).                                    | Cobrir exclusao de post existente.                                           |
| Envelope padrao de resposta         | Em sucesso retorna error=false e data; em erro retorna error=true.                                        | Validar contrato basico de sucesso/erro nos cenarios principais.            |

## Massa de Dados Recomendada

| Entidade                      | Objetivo nos testes                                         |
| :---------------------------- | :---------------------------------------------------------- |
| Admin global valido           | Fazer login inicial e obter token de autenticacao.          |
| Escola existente              | Fornecer schoolId para criacao e listagem de posts.         |
| Turma existente               | Fornecer target_id para posts com escopo de turma.          |
| Post criado na suite          | Reusar ID para testar detalhe, atualizacao e exclusao.      |

## Preparacao da Suite

| Etapa                       | Comportamento Esperado                       | Verificacoes                                 | Criterios de Aceite                               |
| :-------------------------- | :------------------------------------------- | :------------------------------------------- | :------------------------------------------------ |
| Login inicial               | Deve autenticar com credenciais de admin.    | POST /login com admin@admin.com e Senha@123. | Retorna 200 e access_token valido.                |
| Resolucao inicial da escola | Deve obter schoolId para encadear os testes. | GET /schools autenticado.                    | Retorna 200 e docs[0]._id quando houver escolas.  |

## POST /schools/:schoolId/posts - Criacao

| Funcionalidade                         | Comportamento Esperado                                                           | Verificacoes                                                          | Criterios de Aceite                                              |
| :------------------------------------- | :------------------------------------------------------------------------------- | :-------------------------------------------------------------------- | :--------------------------------------------------------------- |
| Sem token                              | Deve bloquear criacao nao autenticada.                                            | POST sem Authorization.                                               | Retorna 401 ou 498.                                              |
| Payload valido (scope: all)            | Deve criar postagem com dados validos.                                            | POST com title, content, target.scope="all".                          | Retorna 201, error=false, data com _id e campos do payload.       |
| schoolId invalido                      | Deve retornar erro de validacao ou permissao.                                     | POST /schools/invalid-school-id/posts.                                | Retorna 400, 403 ou 422.                                         |
| Falta de target_id para scope class    | Deve rejeitar criacao sem alvo especifico para escopos restritos.                 | POST com target.scope="class" e target_id omitido.                    | Retorna 422 e error=true.                                        |
| target_id inexistente                  | Deve falhar se o alvo da postagem nao for encontrado.                             | POST com target.scope="class" e target_id aleatorio.                  | Retorna 422 ou 404.                                              |

## GET /schools/:schoolId/posts - Listagem

| Funcionalidade                         | Comportamento Esperado                                           | Verificacoes                                         | Criterios de Aceite                          |
| :------------------------------------- | :--------------------------------------------------------------- | :--------------------------------------------------- | :------------------------------------------- |
| Sem token                              | Deve bloquear listagem nao autenticada.                          | GET sem Authorization.                               | Retorna 401 ou 498.                           |
| Com token valido                       | Deve listar postagens paginadas.                                 | GET com Bearer token.                                | Retorna 200, error=false e data.docs array.   |
| Paginacao customizada                  | Deve respeitar os limites de pagina e tamanho.                   | GET com ?page=1&limit=5.                             | Retorna 200 e limit=5 nos metadados.          |
| Filtro por titulo                      | Deve filtrar postagens pelo titulo.                              | GET com ?title=algum-titulo.                         | Retorna 200 e docs filtrados.                 |
| Filtro por status ativo                | Deve filtrar postagens pelo status.                              | GET com ?active=true.                                | Retorna 200 e docs filtrados.                 |

## GET /posts/:id - Detalhe

| Funcionalidade           | Comportamento Esperado                                     | Verificacoes                                               | Criterios de Aceite                                      |
| :----------------------- | :--------------------------------------------------------- | :--------------------------------------------------------- | :------------------------------------------------------- |
| Busca por id existente   | Deve retornar postagem criada na suite.                    | GET por postId com token.                                  | Retorna 200, error=false e data._id igual ao id.          |
| Id invalido              | Deve rejeitar por validacao de ObjectId.                   | GET /posts/invalidPostId.                                  | Retorna 400 ou 422.                                       |
| Id inexistente           | Deve retornar recurso nao encontrado.                      | GET /posts/000000000000000000000000.                       | Retorna 404 e error=true.                                 |

## PATCH /posts/:id - Atualizacao

| Funcionalidade           | Comportamento Esperado                                     | Verificacoes                                               | Criterios de Aceite                                      |
| :----------------------- | :--------------------------------------------------------- | :--------------------------------------------------------- | :------------------------------------------------------- |
| Sem token                | Deve bloquear atualizacao nao autenticada.                 | PATCH sem Authorization.                                   | Retorna 401 ou 498.                                      |
| Atualizacao completa     | Deve atualizar titulo e conteudo.                          | PATCH com title e content novos.                           | Retorna 200, error=false e data atualizado.              |
| Atualizacao parcial      | Deve atualizar apenas um campo (ex: title).                | PATCH apenas com title.                                    | Retorna 200, error=false e data com novo titulo.          |
| Atualizacao de status    | Deve permitir desativar a postagem.                        | PATCH com active: false.                                   | Retorna 200 ou 403 (dependendo da permissao).             |
| Id inexistente           | Deve retornar recurso nao encontrado.                      | PATCH /posts/000000000000000000000000.                     | Retorna 404 e error=true.                                 |

## DELETE /posts/:id - Exclusao

| Funcionalidade           | Comportamento Esperado                                     | Verificacoes                                               | Criterios de Aceite                                      |
| :----------------------- | :--------------------------------------------------------- | :--------------------------------------------------------- | :------------------------------------------------------- |
| Exclusao valida          | Deve remover/desativar postagem existente.                 | DELETE por postId com token.                               | Retorna 200, error=false e data._id igual ao id.         |
| Id inexistente           | Deve retornar recurso nao encontrado.                      | DELETE /posts/000000000000000000000000.                    | Retorna 404.                                              |

## Cenarios Transversais Obrigatorios (Integracao)

| Tema                       | Verificacao de Integracao                                                             |
| :------------------------- | :------------------------------------------------------------------------------------ |
| Contrato basico de sucesso | Em cenarios felizes, validar error=false e objeto data presente.                      |
| Contrato basico de erro    | Em cenarios tristes, validar error=true com status coerente (400, 401/498, 403, 404). |
| Dependencia de ambiente    | Suite depende de API, banco e credenciais de admin disponiveis.                       |

## Variaveis de Ambiente Usadas

| Variavel             | Uso na suite                                           |
| :------------------- | :----------------------------------------------------- |
| INTEGRATION_BASE_URL | Define URL base da API para os requests de integracao. |
| PORT                 | Fallback de porta quando INTEGRATION_BASE_URL nao e informado. |

## Observacoes de Implementacao para os Casos de Integracao

| Ponto                        | Diretriz                                                                 |
| :--------------------------- | :----------------------------------------------------------------------- |
| Validacao de target_id       | Escopos como "class" exigem target_id que deve ser validado no banco.     |
| Redundancia de testes        | Evitar blocos repetidos de listagem que nao agregam novas validacoes.     |
| IDs validos para 404         | Usar 000000000000000000000000 para ObjectId valido inexistente.           |
| Rigor de contrato            | Alguns testes aceitam 200 ou 403, o que deve ser evitado em novas suites. |
