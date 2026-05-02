# Suite de Testes de Integracao - Post (/schools/:schoolId/posts e /posts)

Testes de integracao (endpoint) que validam os fluxos de listagem, detalhamento, criacao, atualizacao e exclusao de postagens.

Arquivo: src/tests/routes/postRoutes.test.js

## Visao de Fluxo e Regras de Negocio

| Regra                               | Comportamento Atual do Sistema                                                                           | Impacto na Suite de Integracao                                               |
| :---------------------------------- | :-------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------- |
| Autenticacao obrigatoria            | Rotas usam autenticacao por token Bearer.                                                                | Cobrir listagem/criacao sem token (401/498) e fluxo autenticado com token valido. |
| Validacao Zod                       | Payload invalido e rejeitado por validacao.                                                              | Cobrir erro 400 em criacao/atualizacao invalida.                             |
| Escopo de Postagem                  | Postagens podem ter scope "all" ou "class".                                                              | Validar criacao com diferentes escopos.                                      |
| Obrigatoriedade de target_id        | Se scope for diferente de "all", target_id deve ser informado.                                            | Cobrir erro 422 (POST) ou 400 (PATCH) ao omitir target_id.                   |
| Vinculacao a Escola                 | Postagens sao criadas vinculadas a uma escola especifica via schoolId na rota.                            | Validar school_id no objeto retornado.                                       |
| Conflito de Escolas                 | Nao e possivel vincular um anuncio a uma turma de outra escola.                                          | Cobrir erro 409 ao tentar PATCH com target_id de outra escola.               |
| Notificacoes Push                   | Criacao de post dispara envios via Firebase Cloud Messaging.                                             | Ponto de atencao: Requer ambiente com Firebase configurado ou mock.          |
| Delecao de Postagem                 | DELETE remove a postagem; exige ser o autor ou ter permissao administrativa.                             | Cobrir exclusao de post e erro 403 ao tentar deletar post de outro autor.    |
| Envelope padrao de resposta         | Em sucesso retorna error=false e data; em erro retorna error=true.                                        | Validar contrato basico de sucesso/erro nos cenarios principais.            |

## Massa de Dados Recomendada

| Entidade                      | Objetivo nos testes                                         |
| :---------------------------- | :---------------------------------------------------------- |
| Admin global valido           | Fazer login inicial e obter token de autenticacao.          |
| Escola A e Escola B           | Fornecer contexto para validar conflitos de escola (409).   |
| Turma da Escola A             | Fornecer target_id valido para posts da Escola A.           |
| Post criado na suite          | Reusar ID para testar detalhe, atualizacao e exclusao.      |

## Preparacao da Suite

| Etapa                       | Comportamento Esperado                       | Verificacoes                                 | Criterios de Aceite                               |
| :-------------------------- | :------------------------------------------- | :------------------------------------------- | :------------------------------------------------ |
| Login inicial               | Deve autenticar com credenciais de admin.    | POST /login com admin@admin.com.             | Retorna 200 e access_token valido.                |
| Resolucao inicial da escola | Deve obter schoolId para encadear os testes. | GET /schools autenticado.                    | Retorna 200 e docs[0]._id.                        |

## POST /schools/:schoolId/posts - Criacao

| Funcionalidade                         | Comportamento Esperado                                                           | Verificacoes                                                          | Criterios de Aceite                                              |
| :------------------------------------- | :------------------------------------------------------------------------------- | :-------------------------------------------------------------------- | :--------------------------------------------------------------- |
| Sem token                              | Deve bloquear criacao nao autenticada.                                            | POST sem Authorization.                                               | Retorna 401 ou 498.                                              |
| Payload valido (scope: all)            | Deve criar postagem com dados validos.                                            | POST com title, content, target.scope="all".                          | Retorna 201, error=false, data com _id.                          |
| Falta de target_id (class)             | Deve rejeitar criacao sem alvo especifico.                                        | POST com target.scope="class" e target_id omitido.                    | Retorna 422 e error=true.                                        |

## PATCH /posts/:id - Atualizacao

| Funcionalidade           | Comportamento Esperado                                     | Verificacoes                                               | Criterios de Aceite                                      |
| :----------------------- | :--------------------------------------------------------- | :--------------------------------------------------------- | :------------------------------------------------------- |
| Conflito de Escola       | Deve impedir vinculo com turma de outra escola.            | PATCH com target_id de turma de escola diferente.          | Retorna 409 e mensagem de conflito.                      |
| Falta de target_id       | Deve validar presenca de alvo em escopos restritos.        | PATCH com scope="class" mas sem target_id.                 | Retorna 400 e error=true.                                 |

## DELETE /posts/:id - Exclusao

| Funcionalidade           | Comportamento Esperado                                     | Verificacoes                                               | Criterios de Aceite                                      |
| :----------------------- | :--------------------------------------------------------- | :--------------------------------------------------------- | :------------------------------------------------------- |
| Exclusao valida          | Deve remover postagem existente.                           | DELETE por postId com token do autor.                      | Retorna 200, message='Anúncio deletado com sucesso'.     |

## Observacoes de Implementacao para os Casos de Integracao

| Ponto                        | Diretriz                                                                 |
| :--------------------------- | :----------------------------------------------------------------------- |
| Validacao de 409             | O PATCH agora valida se a turma do target pertence a mesma escola do post.|
| Firebase Messaging           | O sistema loga sucessos/falhas de envio no console durante a criacao.     |
| Mensagens de Sucesso         | O DELETE e o deleteFoto validam strings especificas de sucesso.           |
