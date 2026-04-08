# Suite de Testes E2E - Pickup Authorizations (/pickup-authorizations)

Testes E2E (endpoint) que validam o fluxo principal das rotas de autorizacao de retirada.

Arquivo: src/tests/routes/pickupAuthorizationRoutes.test.js

## Visao de Fluxo e Regras de Negocio

| Regra                        | Comportamento Atual do Sistema                                  | Impacto na Suite E2E                                              |
| :--------------------------- | :-------------------------------------------------------------- | :---------------------------------------------------------------- |
| Autenticacao obrigatoria     | Rotas exigem token valido no header Authorization.              | Cobrir acesso sem token e acesso com token valido.                |
| Relacao aluno x responsavel  | authorized_by precisa ser usuario com role parent.              | Cobrir erro 422 quando authorized_by usa usuario sem role parent. |
| Janela de validade           | valid_until deve ser maior que valid_from.                      | Cobrir erro 422 para periodo invalido.                            |
| Ciclo de vida da autorizacao | Recurso e criado, atualizado, removido e depois nao encontrado. | Cobrir CRUD completo e validacao de 404 apos delete.              |
| Estrutura de listagem        | Listagem retorna objeto paginado em data.docs.                  | Cobrir retorno 200 com docs array.                                |

## Massa de Dados Recomendada

| Entidade                 | Objetivo nos testes                                |
| :----------------------- | :------------------------------------------------- |
| Admin global valido      | Obter token e criar dados auxiliares da suite.     |
| Escola existente         | Definir school_id para criar pickup authorization. |
| Usuario com role student | Preencher student_id valido.                       |
| Usuario com role parent  | Preencher authorized_by valido no cenario feliz.   |

## Preparacao da Suite

| Etapa                  | Comportamento Esperado                                    | Verificacoes                                    | Criterios de Aceite                |
| :--------------------- | :-------------------------------------------------------- | :---------------------------------------------- | :--------------------------------- |
| Login inicial          | Deve autenticar com credenciais de admin.                 | POST /login com ADMIN_EMAIL e ADMIN_PASSWORD.   | Retorna 200 e access_token valido. |
| Resolucao da escola    | Deve obter school_id para encadear os testes.             | GET /schools autenticado.                       | Retorna 200 e existe docs[0].\_id. |
| Criacao de aluno       | Deve criar usuario student para o payload de autorizacao. | POST /schools/:schoolId/users com role student. | Retorna 201 e \_id valido.         |
| Criacao de responsavel | Deve criar usuario parent para o payload de autorizacao.  | POST /schools/:schoolId/users com role parent.  | Retorna 201 e \_id valido.         |

## GET /pickup-authorizations - Listagem

| Funcionalidade   | Comportamento Esperado                | Verificacoes           | Criterios de Aceite                         |
| :--------------- | :------------------------------------ | :--------------------- | :------------------------------------------ |
| Sem token        | Deve bloquear acesso nao autenticado. | GET sem Authorization. | Retorna 401 ou 498.                         |
| Com token valido | Deve listar autorizacoes paginadas.   | GET com Bearer token.  | Retorna 200, error=false e data.docs array. |

## POST /pickup-authorizations - Criacao

| Funcionalidade                   | Comportamento Esperado                                              | Verificacoes                                                                                                              | Criterios de Aceite                                                                             |
| :------------------------------- | :------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------- |
| Cenario feliz com payload valido | Deve criar uma autorizacao vinculada a escola, aluno e responsavel. | POST com school_id, student_id, authorized_by parent, authorized_person, qr_code, valid_from, valid_until, used e active. | Retorna 201, error=false e data com \_id, school_id, student_id e authorized_by esperados.      |
| Periodo invalido                 | Deve rejeitar quando valid_until e menor que valid_from.            | POST com intervalo invertido.                                                                                             | Retorna 422 com mensagem O periodo informado e invalido.                                        |
| authorized_by sem role parent    | Deve rejeitar quando authorized_by nao atende regra de role.        | POST usando student_id como authorized_by.                                                                                | Retorna 422 com mensagem Apenas usuarios com role parent podem ser informados em authorized_by. |

## GET /pickup-authorizations/:id - Detalhe

| Funcionalidade         | Comportamento Esperado                          | Verificacoes                | Criterios de Aceite                                          |
| :--------------------- | :---------------------------------------------- | :-------------------------- | :----------------------------------------------------------- |
| Busca por id existente | Deve retornar autorizacao criada anteriormente. | GET por id salvo apos POST. | Retorna 200, error=false e data.\_id igual ao id solicitado. |
| Busca apos remocao     | Deve retornar recurso inexistente apos delete.  | GET por id removido.        | Retorna 404 e error=true.                                    |

## PATCH /pickup-authorizations/:id - Atualizacao

| Funcionalidade                          | Comportamento Esperado                                    | Verificacoes                                    | Criterios de Aceite                                                  |
| :-------------------------------------- | :-------------------------------------------------------- | :---------------------------------------------- | :------------------------------------------------------------------- |
| Atualizacao de status de uso e ativacao | Deve atualizar campos used e active no recurso existente. | PATCH por id com { used: true, active: false }. | Retorna 200, error=false e data refletindo used=true e active=false. |

## DELETE /pickup-authorizations/:id - Remocao

| Funcionalidade                   | Comportamento Esperado                         | Verificacoes             | Criterios de Aceite        |
| :------------------------------- | :--------------------------------------------- | :----------------------- | :------------------------- |
| Remocao de autorizacao existente | Deve remover o recurso criado durante o teste. | DELETE por id existente. | Retorna 200 e error=false. |

## Cenarios Transversais Obrigatorios (E2E)

| Tema                       | Verificacao E2E                                                                       |
| :------------------------- | :------------------------------------------------------------------------------------ |
| Contrato basico de sucesso | Em cenarios felizes, validar error=false e objeto data presente.                      |
| Contrato basico de erro    | Em cenarios tristes, validar error=true e status esperado por regra de negocio.       |
| Encadeamento de estado     | O id criado no POST deve ser reutilizado em GET, PATCH, DELETE e GET final 404.       |
| Dependencia de ambiente    | Suite depende de API e banco ativos; sem ambiente, tende a falhar com AggregateError. |

## Variaveis de Ambiente Usadas

| Variavel             | Uso na suite                                                   |
| :------------------- | :------------------------------------------------------------- |
| INTEGRATION_BASE_URL | Define URL base da API para os requests de integracao.         |
| PORT                 | Fallback de porta quando INTEGRATION_BASE_URL nao e informado. |
| ADMIN_EMAIL          | Credencial para login inicial da suite.                        |
| ADMIN_PASSWORD       | Credencial para login inicial da suite.                        |

## Observacoes de Implementacao para os Casos E2E

| Ponto                        | Diretriz                                                                                 |
| :--------------------------- | :--------------------------------------------------------------------------------------- |
| Dados unicos de usuario      | Usar timestamp em email para evitar conflito de unicidade.                               |
| Ordem de execucao            | Manter criacao antes de update/delete, pois os testes compartilham id criado.            |
| Diagnostico rapido de falhas | Se varios testes quebrarem com AggregateError, validar containers, DB e URL da API.      |
| Manutencao de mensagens      | Se regra mudar no backend, atualizar assercoes de message na suite e nesta documentacao. |
