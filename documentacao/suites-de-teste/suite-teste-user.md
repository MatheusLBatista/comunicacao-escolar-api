# Suite de Testes de Integracao - User (/users e /schools/:schoolId/users)

Testes de integracao (endpoint) que validam toda a regra de negócio das rotas de User e Memberships.

Arquivo: src/tests/routes/userRoutes.test.js

## Visao de Fluxo e Regras de Negocio

| Regra                               | Comportamento Atual do Sistema                                                                           | Impacto na Suite de Integracao                                               |
| :---------------------------------- | :-------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------- |
| Autenticacao e Permissao            | Rotas usam AuthMiddleware e AuthPermission.                                                              | Validar token e permissao por rota.                                          |
| Vinculo em Cascata (Parent)         | Ao vincular um parent via /members, o sistema pode criar um aluno vinculado.                             | Validar criacao automatica de student ao processar linkToSchool.              |
| Unicidade de Membership             | Usuario nao pode ser vinculado duas vezes a mesma escola.                                                 | Cobrir erro 409 Conflict em duplicidade de vinculo.                          |
| Protecao de Dados                   | Campo password nunca deve retornar nas respostas de criacao/detalhe.                                     | Validar ausencia de password no objeto retornado.                            |
| Soft Delete com Mensagem            | DELETE /users/:id inativa o usuario e retorna mensagem customizada.                                      | Validar mensagem: "Usuário desativado com sucesso.".                         |
| Filtros de Escola                   | GET /schools/:schoolId/users retorna apenas membros daquela escola.                                      | Validar isolamento de dados por escola.                                       |

## Massa de Dados Recomendada

| Entidade                      | Objetivo nos testes                                         |
| :---------------------------- | :---------------------------------------------------------- |
| Admin global                  | Criar outros usuarios e gerenciar vinculos.                 |
| Escola existente              | Fornecer contexto para memberships.                         |
| Usuario existente (email)     | Validar vinculo de usuario ja cadastrado em nova escola.    |

## POST /schools/:schoolId/members - Vinculo

| Funcionalidade           | Comportamento Esperado                                     | Verificacoes                                               | Criterios de Aceite                                      |
| :----------------------- | :--------------------------------------------------------- | :--------------------------------------------------------- | :------------------------------------------------------- |
| Vinculo Parent -> Student| Deve criar aluno e vincular ao pai.                        | POST role="parent" com dados de student.                   | Retorna 201 e pai possui student no membership.          |
| Usuario inexistente      | Deve falhar se tentar vincular quem nao existe.            | POST com email nao cadastrado.                             | Retorna 404 Not Found.                                   |

## DELETE /users/:id - Exclusao

| Funcionalidade           | Comportamento Esperado                                     | Verificacoes                                               | Criterios de Aceite                                      |
| :----------------------- | :--------------------------------------------------------- | :--------------------------------------------------------- | :------------------------------------------------------- |
| Exclusao valida          | Deve desativar usuario e retornar confirmacao.             | DELETE por userId.                                         | Retorna 200 e message="Usuário desativado com sucesso.". |

## Observacoes de Implementacao

| Ponto                        | Diretriz                                                                 |
| :--------------------------- | :----------------------------------------------------------------------- |
| Password Scrubbing           | O Controller garante a remocao do campo password antes do CommonResponse. |
| Student Auto-creation        | O UserService cria um novo User (role student) durante o linkToSchool.    |
