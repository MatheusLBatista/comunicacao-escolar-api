# Suite de Testes de Integracao - Like (/posts/:id/like)

Testes de integracao (endpoint) que validam a funcionalidade de "curtir" (toggle like) em postagens.

Arquivo: src/tests/routes/likeRoutes.test.js

## Visao de Fluxo e Regras de Negocio

| Regra                               | Comportamento Atual do Sistema                                                                           | Impacto na Suite de Integracao                                               |
| :---------------------------------- | :-------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------- |
| Autenticacao obrigatoria            | Rota usa autenticacao por token Bearer.                                                                  | Cobrir tentativa sem token (401/498) e com token valido.                     |
| Comportamento de Toggle             | Se o usuario ja curtiu, a curtida e removida; caso contrario, e adicionada.                               | Validar adicao no primeiro POST e remocao no segundo POST.                  |
| Unicidade por Usuario/Post          | Um usuario so pode ter um like ativo por postagem.                                                       | Garantido pelo comportamento de toggle.                                      |
| Multiplos Usuarios                  | Diferentes usuarios podem curtir a mesma postagem.                                                        | Validar que likes de diferentes tokens sao registrados separadamente.        |
| Postagem inexistente                | Nao e possivel curtir um post que nao existe.                                                             | Cobrir erro 404 ao tentar curtir post inexistente.                           |
| Envelope padrao de resposta         | Em sucesso retorna error=false e data; em erro retorna error=true.                                        | Validar contrato basico de sucesso/erro.                                    |

## Massa de Dados Recomendada

| Entidade                      | Objetivo nos testes                                         |
| :---------------------------- | :---------------------------------------------------------- |
| Admin global valido           | Fazer login e obter token de primeiro usuario.              |
| Usuario Teacher valido        | Fazer login e obter token de segundo usuario.               |
| Escola existente              | Fornecer contexto para criacao do post base.                |
| Post criado na suite          | Servir como alvo para as operacoes de like.                 |

## Preparacao da Suite

| Etapa                       | Comportamento Esperado                       | Verificacoes                                 | Criterios de Aceite                               |
| :-------------------------- | :------------------------------------------- | :------------------------------------------- | :------------------------------------------------ |
| Login Admin                 | Deve autenticar admin global.                | POST /login com admin@admin.com.             | Retorna 200 e access_token.                       |
| Login Teacher               | Deve autenticar usuario com role teacher.    | POST /login com teacher@escola.com.          | Retorna 200 e access_token.                       |
| Resolucao de escola         | Obter schoolId para criar post.              | GET /schools.                                | Retorna 200 e schoolId valido.                    |
| Criacao de post base        | Criar post que recebera os likes.            | POST /schools/:schoolId/posts.               | Retorna 201 e postId valido.                      |

## POST /posts/:id/like - Toggle Like

| Funcionalidade                         | Comportamento Esperado                                                           | Verificacoes                                                          | Criterios de Aceite                                              |
| :------------------------------------- | :------------------------------------------------------------------------------- | :-------------------------------------------------------------------- | :--------------------------------------------------------------- |
| Sem token                              | Deve bloquear operacao nao autenticada.                                           | POST /posts/:id/like sem Authorization.                               | Retorna 401 ou 498.                                              |
| Adicionar Like (primeira chamada)      | Deve registrar a curtida do usuario.                                              | POST com token valido.                                                | Retorna 200, error=false, data com post_id e user_id.            |
| Remover Like (segunda chamada)         | Deve remover a curtida anterior (toggle).                                         | Repetir POST com mesmo token.                                         | Retorna 200, error=false, data.message indicando remocao.        |
| Multiplos likes                        | Usuarios diferentes podem curtir o mesmo post.                                    | POST com token de Admin e depois com token de Teacher.                | Ambos retornam 200 e sucesso.                                    |
| Id do post invalido                    | Deve rejeitar por formato de ID invalido.                                         | POST /posts/invalid-id/like.                                          | Retorna 400 ou 422.                                              |
| Id do post inexistente                 | Deve falhar pois o alvo nao existe.                                               | POST /posts/000000000000000000000000/like.                            | Retorna 404.                                                      |

## Cenarios Transversais Obrigatorios (Integracao)

| Tema                       | Verificacao de Integracao                                                             |
| :------------------------- | :------------------------------------------------------------------------------------ |
| Contrato basico de sucesso | Em cenarios felizes, validar error=false e objeto data presente.                      |
| Contrato basico de erro    | Em cenarios tristes, validar error=true com status coerente (400, 401/498, 403, 404). |
| Dependencia de ambiente    | Suite depende de API, banco e tokens validos disponiveis.                             |

## Variaveis de Ambiente Usadas

| Variavel             | Uso na suite                                           |
| :------------------- | :----------------------------------------------------- |
| INTEGRATION_BASE_URL | Define URL base da API para os requests de integracao. |
| PORT                 | Fallback de porta quando INTEGRATION_BASE_URL nao e informado. |

## Observacoes de Implementacao para os Casos de Integracao

| Ponto                        | Diretriz                                                                 |
| :--------------------------- | :----------------------------------------------------------------------- |
| Idempotencia vs Toggle       | A rota e toggle, entao chamadas sucessivas alternam o estado.             |
| Validacao de Autorizacao     | Validar se usuarios de diferentes perfis podem curtir.                    |
| Resposta de remocao          | Na remocao (unlike), o campo data costuma conter uma mensagem de texto.   |
| IDs validos para 404         | Usar 000000000000000000000000 para ObjectId valido inexistente.           |
