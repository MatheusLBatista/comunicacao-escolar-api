# Suite de Testes de Integracao - Class (/schools/:schoolId/class)

Testes de integracao (endpoint) que validam os fluxos de listagem, detalhamento e criacao de turmas.

Arquivo: src/tests/routes/classRoutes.test.js

## Visao de Fluxo e Regras de Negocio

| Regra                               | Comportamento Atual do Sistema                                                                           | Impacto na Suite de Integracao                                               |
| :---------------------------------- | :-------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------- |
| Autenticacao obrigatoria            | Rotas usam autenticacao por token Bearer.                                                                | Cobrir listagem/criacao sem token (401/498) e fluxo autenticado com token valido. |
| Validacao Zod                       | Payload invalido e rejeitado por validacao.                                                              | Cobrir erro 400 em criacao invalida.                                         |
| Validacao de ObjectId em schoolId   | Controller valida ObjectId no param.                                                                     | Cenarios de schoolId invalido podem ser barrados por permissao com 403.      |
| Escola deve existir                 | Service valida escola e retorna 404 quando nao encontrada.                                                | Cobrir POST com schoolId inexistente (403/404 dependendo da permissao).      |
| Busca por id na turma               | GET por id retorna turma ou not found.                                                                    | Cobrir detalhe por id e 404 para id inexistente.                             |
| Unicidade de turma por escola       | Service impede duplicidade por (school_id, name, grade).                                                  | Cobrir conflito com 409 ao repetir criacao na mesma escola.                  |
| Professores validos                 | teacher_ids devem existir e ter role teacher; caso contrario retorna 422.                                 | Cobrir erro 422 com teacher_ids invalidos.                                   |
| Envelope padrao de resposta         | Em sucesso retorna error=false e data; em erro retorna error=true.                                        | Validar contrato basico de sucesso/erro nos cenarios principais.            |

## Massa de Dados Recomendada

| Entidade                      | Objetivo nos testes                                         |
| :---------------------------- | :---------------------------------------------------------- |
| Admin global valido           | Fazer login inicial e obter token de autenticacao.          |
| Escola existente              | Fornecer schoolId para criacao de turma.                    |
| Usuario teacher valido        | Popular teacher_ids com id de professor valido.             |
| Turma criada na suite         | Reusar name/grade para testar conflito de duplicidade.      |

## Preparacao da Suite

| Etapa                       | Comportamento Esperado                       | Verificacoes                                 | Criterios de Aceite                               |
| :-------------------------- | :------------------------------------------- | :------------------------------------------- | :------------------------------------------------ |
| Login inicial               | Deve autenticar com credenciais de admin.    | POST /login com admin@admin.com e Senha@123. | Retorna 200 e access_token valido.                |
| Resolucao inicial da escola | Deve obter schoolId para encadear os testes. | GET /schools autenticado.                    | Retorna 200 e docs[0]._id quando houver escolas.  |
| Criacao de teacher          | Deve criar teacher na escola para teacher_ids| POST /schools/:schoolId/users com role teacher. | Retorna 201 e _id valido.                      |

## POST /schools/:schoolId/class - Criacao

| Funcionalidade                         | Comportamento Esperado                                                           | Verificacoes                                                          | Criterios de Aceite                                              |
| :------------------------------------- | :------------------------------------------------------------------------------- | :-------------------------------------------------------------------- | :--------------------------------------------------------------- |
| Sem token                              | Deve bloquear criacao nao autenticada.                                            | POST sem Authorization.                                               | Retorna 401 ou 498.                                              |
| Payload invalido                       | Deve rejeitar por validacao.                                                      | POST com name/grade vazios, year invalido, teacher_ids vazio.         | Retorna 400 e error=true.                                        |
| schoolId invalido                      | Deve ser bloqueado antes do controller ou por permissao.                          | POST /schools/invalid-school-id/class.                                | Retorna 403 (AuthPermission) ou 400 (validacao).                 |
| schoolId inexistente                   | Deve falhar por escola nao encontrada ou permissao.                               | POST com schoolId 000000000000000000000000.                           | Retorna 403 ou 404.                                              |
| teacher_ids invalidos                  | Deve rejeitar por professores inexistentes ou sem role teacher.                   | POST com teacher_ids validos + inexistente.                           | Retorna 422 e error=true.                                        |
| Payload valido                          | Deve criar turma com dados validos.                                               | POST com name, grade, year, teacher_ids e active.                     | Retorna 201, error=false, data com _id e campos do payload.       |
| Duplicidade de turma                   | Deve rejeitar nome/grade duplicado na mesma escola.                               | Repetir POST com mesmo name/grade.                                     | Retorna 409 e error=true.                                        |

## GET /schools/:schoolId/class - Listagem

| Funcionalidade                         | Comportamento Esperado                                           | Verificacoes                                         | Criterios de Aceite                          |
| :------------------------------------- | :--------------------------------------------------------------- | :--------------------------------------------------- | :------------------------------------------- |
| Sem token                              | Deve bloquear listagem nao autenticada.                          | GET sem Authorization.                               | Retorna 401 ou 498.                           |
| Com token valido                       | Deve listar turmas paginadas.                                    | GET com Bearer token.                                | Retorna 200, error=false e data.docs array.   |
| schoolId invalido                      | Deve ser bloqueado antes do controller ou por permissao.         | GET /schools/invalid-school-id/class.                | Retorna 403 (AuthPermission) ou 400 (validacao). |
| schoolId inexistente                   | Deve falhar por escola nao encontrada ou permissao.              | GET com schoolId 000000000000000000000000.           | Retorna 403 ou 404.                           |

## GET /schools/:schoolId/class/:id - Detalhe

| Funcionalidade           | Comportamento Esperado                                     | Verificacoes                                               | Criterios de Aceite                                      |
| :----------------------- | :--------------------------------------------------------- | :--------------------------------------------------------- | :------------------------------------------------------- |
| Busca por id existente   | Deve retornar turma criada na suite.                       | GET por classId com token.                                 | Retorna 200, error=false e data._id igual ao id.          |
| Id invalido              | Deve rejeitar por validacao de ObjectId.                   | GET /schools/:schoolId/class/invalidClassId.               | Retorna 400.                                              |
| Id inexistente           | Deve retornar recurso nao encontrado.                      | GET /schools/:schoolId/class/000000000000000000000000.     | Retorna 404 e error=true.                                 |

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
| Payload dinamico             | Usar Date.now() para gerar name unico e reduzir chance de conflito.       |
| Teacher_ids validos          | Criar teacher na escola via rota de users para obter id valido.           |
| IDs validos para 404         | Usar 000000000000000000000000 para ObjectId valido inexistente.           |
| Permissao por rota           | AuthPermission pode retornar 403 antes do controller em schoolId invalido.|
