# Suite de Testes de Integracao - School (/schools)

Testes de integracao (endpoint) que validam o fluxo principal das rotas de school.

Arquivo: src/tests/routes/schoolRoutes.test.js

## Visao de Fluxo e Regras de Negocio

| Regra                            | Comportamento Atual do Sistema                                     | Impacto na Suite de Integracao                                        |
| :------------------------------- | :----------------------------------------------------------------- | :-------------------------------------------------------------------- |
| Autenticacao obrigatoria         | Rotas usam autenticacao por token Bearer.                          | Cobrir listagem sem token e fluxo autenticado com token valido.       |
| Estrutura de listagem            | Listagem retorna objeto paginado em data.docs.                     | Cobrir retorno 200 com docs array.                                    |
| Unicidade de escola              | Criacao pode retornar conflito quando houver duplicidade de dados. | Cobrir POST com aceitacao de 201 ou 409.                              |
| Validacao de payload             | Payload invalido e rejeitado por validacao.                        | Cobrir erro 400 em criacao invalida.                                  |
| Ciclo de vida parcial do recurso | Recurso e criado, consultado e atualizado durante a suite.         | Cobrir GET lista, POST, GET por id e PATCH com assercoes de contrato. |
| Remocao prevista mas desativada  | Fluxo de DELETE existe no teste, porem com skip.                   | Documentar cenario de delete como cobertura nao executada por padrao. |

## Massa de Dados Recomendada

| Entidade                      | Objetivo nos testes                                            |
| :---------------------------- | :------------------------------------------------------------- |
| Admin global valido           | Fazer login inicial e obter token de autenticacao.             |
| Escola existente              | Fornecer schoolId inicial para cenarios de GET por id e PATCH. |
| Escola nova de teste          | Validar criacao com payload dinamico.                          |
| Escola temporaria para delete | Validar fluxo de delete no teste marcado com skip.             |

## Preparacao da Suite

| Etapa                       | Comportamento Esperado                       | Verificacoes                                 | Criterios de Aceite                               |
| :-------------------------- | :------------------------------------------- | :------------------------------------------- | :------------------------------------------------ |
| Login inicial               | Deve autenticar com credenciais de admin.    | POST /login com admin@admin.com e Senha@123. | Retorna 200 e access_token valido.                |
| Resolucao inicial da escola | Deve obter schoolId para encadear os testes. | GET /schools autenticado.                    | Retorna 200 e docs[0].\_id quando houver escolas. |

## GET /schools - Listagem

| Funcionalidade   | Comportamento Esperado                | Verificacoes           | Criterios de Aceite                         |
| :--------------- | :------------------------------------ | :--------------------- | :------------------------------------------ |
| Sem token        | Deve bloquear acesso nao autenticado. | GET sem Authorization. | Retorna 401 ou 498.                         |
| Com token valido | Deve listar escolas paginadas.        | GET com Bearer token.  | Retorna 200, error=false e data.docs array. |

## POST /schools - Criacao

| Funcionalidade                  | Comportamento Esperado                                                        | Verificacoes                                                 | Criterios de Aceite                                            |
| :------------------------------ | :---------------------------------------------------------------------------- | :----------------------------------------------------------- | :------------------------------------------------------------- |
| Cenario com payload valido      | Deve criar escola com dados validos, ou retornar conflito de unicidade.       | POST com name, tax_id, address e active.                     | Retorna 201 ou 409.                                            |
| Validacao no sucesso de criacao | Quando criar com sucesso, deve retornar dados da escola criada.               | Verificar error, data.\_id, data.name e data.tax_id.         | Em 201, error=false, \_id presente e campos iguais ao payload. |
| Tratamento de conflito          | Em conflito, fluxo reaproveita schoolId existente para continuidade da suite. | Verificar error=true e recarregar schoolId via GET /schools. | Em 409, schoolId de fallback e preenchido.                     |
| Payload invalido                | Deve rejeitar criacao com dados invalidos.                                    | POST com campos vazios e tax_id/zip_code invalidos.          | Retorna 400 e error=true.                                      |

## GET /schools/:id - Detalhe

| Funcionalidade           | Comportamento Esperado                                                | Verificacoes                                     | Criterios de Aceite                                          |
| :----------------------- | :-------------------------------------------------------------------- | :----------------------------------------------- | :----------------------------------------------------------- |
| Busca por id existente   | Deve retornar escola previamente obtida/criada.                       | GET por schoolId com token.                      | Retorna 200, error=false e data.\_id igual ao id solicitado. |
| Busca por id inexistente | Deve retornar recurso nao encontrado com ObjectId valido inexistente. | GET /schools/000000000000000000000000 com token. | Retorna 404 e error=true.                                    |

## PATCH /schools/:id - Atualizacao

| Funcionalidade               | Comportamento Esperado                             | Verificacoes                             | Criterios de Aceite                                          |
| :--------------------------- | :------------------------------------------------- | :--------------------------------------- | :----------------------------------------------------------- |
| Atualizacao de name e active | Deve atualizar campos simples da escola existente. | PATCH por schoolId com { name, active }. | Retorna 200, error=false e data com name/active atualizados. |

## DELETE /schools/:id - Remocao

| Funcionalidade              | Comportamento Esperado                                               | Verificacoes                                              | Criterios de Aceite                                                              |
| :-------------------------- | :------------------------------------------------------------------- | :-------------------------------------------------------- | :------------------------------------------------------------------------------- |
| Remocao e segunda tentativa | Deve remover escola temporaria e falhar em nova remocao do mesmo id. | POST escola temporaria, DELETE 200, DELETE novamente 404. | Primeiro delete retorna 200 com error=false, segundo retorna 404 com error=true. |

Observacao: o cenario de DELETE esta presente no arquivo de teste, mas marcado com test.skip.

## Cenarios Transversais Obrigatorios (Integracao)

| Tema                       | Verificacao de Integracao                                                             |
| :------------------------- | :------------------------------------------------------------------------------------ |
| Contrato basico de sucesso | Em cenarios felizes, validar error=false e objeto data presente.                      |
| Contrato basico de erro    | Em cenarios tristes, validar error=true com status coerente (400, 401/498, 404, 409). |
| Encadeamento de estado     | Reutilizar schoolId entre listagem, detalhe e atualizacao.                            |
| Continuidade apos conflito | Em 409 no POST, fallback de schoolId permite continuidade dos testes seguintes.       |
| Dependencia de ambiente    | Suite depende de API, banco e credenciais de admin disponiveis.                       |

## Variaveis de Ambiente Usadas

| Variavel             | Uso na suite                                                   |
| :------------------- | :------------------------------------------------------------- |
| INTEGRATION_BASE_URL | Define URL base da API para os requests de integracao.         |
| PORT                 | Fallback de porta quando INTEGRATION_BASE_URL nao e informado. |

## Observacoes de Implementacao para os Casos de Integracao

| Ponto                | Diretriz                                                                         |
| :------------------- | :------------------------------------------------------------------------------- |
| Payload dinamico     | Usar Date.now() para gerar name/tax_id unicos e reduzir chance de conflito.      |
| Ordem de execucao    | Manter login e load inicial antes dos cenarios que dependem de schoolId.         |
| IDs validos para 404 | Usar 000000000000000000000000 para exercitar nao encontrado com ObjectId valido. |
| Cobertura de delete  | Fluxo de delete existe, porem nao e executado no run padrao por estar com skip.  |
