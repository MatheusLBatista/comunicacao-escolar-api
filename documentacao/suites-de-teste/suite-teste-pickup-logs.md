# Suite de Testes de Integracao - Pickup Logs (/pickup-logs)

Testes de integracao (endpoint) que validam o fluxo principal das rotas de pickup logs.

Arquivo: src/tests/routes/pickupLogRoutes.test.js

## Visao de Fluxo e Regras de Negocio

| Regra | Comportamento Atual do Sistema | Impacto na Suite de Integracao |
| :--- | :--- | :--- |
| Autenticacao obrigatoria | Rotas usam AuthMiddleware e AuthPermission. | Cobrir acesso sem token e acesso autenticado. |
| Metodo de retirada | Campo method aceita somente manual ou qr_code. | Cobrir criacao com method manual e qr_code. |
| Dependencia do qr_code | Quando method=qr_code, authorization_id e obrigatorio. | Cobrir erro 422 para qr_code sem authorization_id. |
| Regra de validador | verified_by precisa referenciar usuario com role admin ou teacher. | Cobrir erro 422 com verified_by em role invalida. |
| Ciclo de vida completo | Recurso e criado, consultado, atualizado, removido e depois nao encontrado. | Cobrir CRUD completo e 404 apos remocao. |
| Estrutura de listagem | Listagem retorna objeto paginado em data.docs. | Cobrir retorno 200 com docs array e filtro por query. |

## Massa de Dados Recomendada

| Entidade | Objetivo nos testes |
| :--- | :--- |
| Admin global valido | Fazer login inicial e obter token de autenticacao. |
| Escola existente | Definir school_id para criar usuarios e pickup logs. |
| Usuario student | Preencher student_id valido nos payloads de pickup log. |
| Usuario teacher | Preencher verified_by valido nos cenarios felizes. |
| Usuario parent | Preencher picked_up_by.user_id e gerar pickup authorization. |
| Pickup authorization valida | Associar authorization_id nos cenarios com method=qr_code. |

## Preparacao da Suite

| Etapa | Comportamento Esperado | Verificacoes | Criterios de Aceite |
| :--- | :--- | :--- | :--- |
| Login inicial | Deve autenticar com credenciais de admin. | POST /login com ADMIN_EMAIL e ADMIN_PASSWORD. | Retorna 200 e access_token valido. |
| Resolucao da escola | Deve obter school_id para encadear os testes. | GET /schools autenticado. | Retorna 200 e existe docs[0]._id. |
| Criacao de aluno | Deve criar usuario student para payload de pickup log. | POST /schools/:schoolId/users com role student. | Retorna 201 e _id valido. |
| Criacao de professor | Deve criar usuario teacher para verified_by valido. | POST /schools/:schoolId/users com role teacher. | Retorna 201 e _id valido. |
| Criacao de responsavel | Deve criar usuario parent para picked_up_by.user_id. | POST /schools/:schoolId/users com role parent. | Retorna 201 e _id valido. |
| Criacao de autorizacao | Deve criar pickup authorization para fluxo qr_code. | POST /pickup-authorizations com school_id, student_id e authorized_by. | Retorna 201 e _id valido para authorization_id. |

## GET /pickup-logs - Listagem

| Funcionalidade | Comportamento Esperado | Verificacoes | Criterios de Aceite |
| :--- | :--- | :--- | :--- |
| Sem token | Deve bloquear acesso nao autenticado. | GET sem Authorization. | Retorna 401 ou 498. |
| Com token valido | Deve listar pickup logs paginados. | GET com Bearer token. | Retorna 200, error=false e data.docs array com itens. |
| Filtro por school_id e method | Deve filtrar resultados por querystring. | GET com query school_id, method, page e limit. | Retorna 200 e docs contendo o log criado no cenario manual. |

## POST /pickup-logs - Criacao

| Funcionalidade | Comportamento Esperado | Verificacoes | Criterios de Aceite |
| :--- | :--- | :--- | :--- |
| Cenario feliz com method manual | Deve criar pickup log com payload valido. | POST com school_id, student_id, picked_up_by, method=manual, departure_time, verified_by e notes. | Retorna 201, error=false e data com _id, school_id, student_id, verified_by e method=manual. |
| Cenario feliz com method qr_code | Deve criar pickup log com authorization_id valido. | POST com method=qr_code e authorization_id existente. | Retorna 201, error=false e data com method=qr_code e authorization_id esperado. |
| verified_by com role invalida | Deve rejeitar quando verified_by nao for admin/teacher. | POST usando usuario parent em verified_by. | Retorna 422 e mensagem Apenas usuarios com role admin ou teacher podem validar retirada. |
| qr_code sem authorization_id | Deve rejeitar quando method for qr_code sem autorizacao. | POST com method=qr_code e authorization_id null. | Retorna 422 e mensagem authorization_id e obrigatorio para retirada com metodo qr_code. |

## GET /pickup-logs/:id - Detalhe

| Funcionalidade | Comportamento Esperado | Verificacoes | Criterios de Aceite |
| :--- | :--- | :--- | :--- |
| Busca por id existente | Deve retornar pickup log criado anteriormente. | GET por id salvo apos POST. | Retorna 200, error=false e data._id igual ao id solicitado. |
| ID invalido | Deve falhar na validacao de ObjectId. | GET /pickup-logs/id-invalido com token. | Retorna 400 e error=true. |
| Busca apos remocao | Deve retornar recurso inexistente apos delete. | GET por id removido no final da suite. | Retorna 404 e error=true. |

## PATCH /pickup-logs/:id - Atualizacao

| Funcionalidade | Comportamento Esperado | Verificacoes | Criterios de Aceite |
| :--- | :--- | :--- | :--- |
| Atualizacao de notes e active | Deve atualizar campos simples no recurso existente. | PATCH por id com { notes, active }. | Retorna 200, error=false e data refletindo notes e active atualizados. |
| Patch parcial de picked_up_by | Deve mesclar picked_up_by sem perder campos anteriores. | PATCH por id com picked_up_by.name apenas. | Retorna 200 e data.picked_up_by contem name atualizado e document preservado. |
| Atualizacao invalida para qr_code sem authorization_id | Deve rejeitar regra de qr_code sem autorizacao. | PATCH por id com method=qr_code e authorization_id=null. | Retorna 422 e mensagem authorization_id e obrigatorio para retirada com metodo qr_code. |
| Atualizacao de recurso inexistente | Deve retornar not found para id valido inexistente. | PATCH por id 507f1f77bcf86cd799439011. | Retorna 404 e error=true. |

## DELETE /pickup-logs/:id - Remocao

| Funcionalidade | Comportamento Esperado | Verificacoes | Criterios de Aceite |
| :--- | :--- | :--- | :--- |
| Remocao de pickup log manual | Deve remover log criado no cenario manual. | DELETE por createdPickupLogId com token. | Retorna 200 e error=false. |
| Remocao sem token | Deve bloquear delete nao autenticado. | DELETE por qrPickupLogId sem Authorization. | Retorna 401 ou 498. |
| Remocao de pickup log qr_code | Deve remover log criado no cenario qr_code. | DELETE por qrPickupLogId com token. | Retorna 200 e error=false. |
| Remocao de id inexistente | Deve retornar not found para id valido inexistente. | DELETE por id 507f1f77bcf86cd799439011. | Retorna 404 e error=true. |

## Cenarios Transversais Obrigatorios (Integracao)

| Tema | Verificacao de Integracao |
| :--- | :--- |
| Contrato basico de sucesso | Em cenarios felizes, validar error=false e objeto data presente. |
| Contrato basico de erro | Em cenarios tristes, validar error=true com status coerente (400, 401/498, 404, 422). |
| Encadeamento de estado | Reutilizar id criado no POST em GET, PATCH, DELETE e GET final 404. |
| Queries de listagem | Validar filtros school_id e method sem quebrar contrato de paginacao (data.docs). |
| Dependencia de ambiente | Suite depende de API, banco e credenciais de admin disponiveis. |

## Variaveis de Ambiente Usadas

| Variavel | Uso na suite |
| :--- | :--- |
| INTEGRATION_BASE_URL | Define URL base da API para os requests de integracao. |
| PORT | Fallback de porta quando INTEGRATION_BASE_URL nao e informado. |
| ADMIN_EMAIL | Credencial para login inicial da suite. |
| ADMIN_PASSWORD | Credencial para login inicial da suite. |

## Observacoes de Implementacao para os Casos de Integracao

| Ponto | Diretriz |
| :--- | :--- |
| Dados unicos de usuario | Usar timestamp em full_name/email para evitar conflito de unicidade. |
| Ordem de execucao | Manter criacao antes de update/delete para reaproveitar ids entre cenarios. |
| IDs validos para 404 | Usar 507f1f77bcf86cd799439011 para exercitar nao encontrado com ObjectId valido. |
| Validacao de regra qr_code | Sempre cobrir create e patch com method=qr_code sem authorization_id para garantir regra de negocio. |
