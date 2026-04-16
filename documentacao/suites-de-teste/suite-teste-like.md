# Suite de Testes de Integracao - Like

Documento alinhado com a cobertura atual da suite:

- Arquivo de teste: src/tests/routes/likeRoutes.test.js

## Rota coberta

- POST /posts/:id/like

## Pre-condicoes usadas na suite

- Login de dois perfis:
  - Admin
  - Teacher
- Obtencao de schoolId via GET /schools.
- Criacao de post base via POST /schools/:schoolId/posts.

## Cobertura atual da rota

### POST /posts/:id/like

Cenarios cobertos:

- Sem token retorna 401 ou 498.
- Like com token valido retorna 200.
- Toggle de like (chamada repetida) retorna 200.
- Post inexistente retorna 404.
- postId em formato invalido retorna 400 ou 422.
- Dois usuarios diferentes conseguem interagir no mesmo post.
- Estrutura de resposta em criacao contem post_id, user_id e created_at.
- Remocao por toggle retorna data.message.

Validacoes verificadas no sucesso:

- error=false
- data presente
- Na criacao: post_id, user_id e created_at
- Na remocao: message presente em data

## Divergencias corrigidas neste documento

- Removidos cenarios que a suite atual nao executa de forma deterministica, como:
  - validacao real de usuario de escola diferente com fixture dedicada;
  - validacao real de turma em post class-scoped com fixture controlada;
  - terceira chamada para idempotencia estrita de remocao.
- Corrigida referencia de pre-condicao para criacao de post:
  - rota correta: POST /schools/{schoolId}/posts

## Observacoes de qualidade da suite atual

- O teste de pertencimento a escola aceita 200 ou 403 dependendo do ambiente, entao nao valida regra de autorizacao de forma estrita.
- A suite esta adequada para regressao basica do endpoint de toggle, mas ainda nao fecha completamente regras de negocio de escopo por escola/turma.
- Se houver necessidade de maior confiabilidade, o proximo passo e incluir fixtures para usuarios de escolas diferentes e post class-scoped com turma conhecida.
