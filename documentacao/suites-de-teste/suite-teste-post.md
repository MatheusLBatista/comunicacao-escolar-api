# Suite de Testes de Integracao - Post

Documento alinhado com a cobertura atual da suite:

- Arquivo de teste: src/tests/routes/postRoutes.test.js

## Rotas cobertas

- POST /schools/:schoolId/posts
- GET /schools/:schoolId/posts
- GET /posts/:id
- PATCH /posts/:id
- DELETE /posts/:id

## Pre-condicoes usadas na suite

- Login via POST /login com usuario admin.
- Obtencao de schoolId via GET /schools.
- Reaproveitamento de createdPostId entre cenarios.

## Cobertura atual por rota

### POST /schools/:schoolId/posts

Cenarios cobertos:

- Sem token retorna 401 ou 498.
- Payload valido cria post com 201.
- schoolId invalido retorna erro (400, 404 ou 422).
- Criação de post com scope diferente de "all" ("class", por exemplo) sem enviar o `target_id` retorna validação estrita 422.
- Tentativa com target.scope=class e target_id válido aceita comportamento variavel:
  - 201 quando target_id for aceito e encontrado no banco.
  - 422 quando target_id nao for encontrado na busca.

Validacoes verificadas no sucesso:

- error=false
- data._id presente
- school_id igual ao schoolId da rota
- title, content e author_id presentes

### GET /schools/:schoolId/posts

Cenarios cobertos:

- Sem token retorna 401 ou 498.
- Listagem com token retorna 200 e paginacao.
- Paginacao com page=1 e limit=5 retorna limit=5.
- Filtro por title retorna 200.
- Filtro por active retorna 200.
- Existe um bloco redundante no fim da suite repetindo listagem da escola.

Validacoes verificadas:

- error=false
- data.docs como array
- metadados de paginacao (totalDocs, page, limit)

### GET /posts/:id

Cenarios cobertos:

- Sem token retorna 401 ou 498.
- Busca por ID criado retorna 200.
- ID inexistente retorna 404.
- ID em formato invalido retorna 400 ou 422.

### PATCH /posts/:id

Cenarios cobertos:

- Sem token retorna 401 ou 498.
- Atualizacao completa (title/content) retorna 200.
- Atualizacao parcial (apenas title) retorna 200.
- ID inexistente retorna 404.
- ID invalido retorna 400 ou 422.
- Atualizacao de active para false aceita 200 ou 403.

### DELETE /posts/:id

Cenarios cobertos:

- Sem token retorna 401 ou 498.
- Delecao de post criado durante o teste retorna 200.
- ID inexistente retorna 404.
- ID invalido retorna 400 ou 422.
- Tentativa em post criado antes aceita 200 ou 403.

## Divergencias corrigidas neste documento

- Adição da documentação sobre o comportamento 422 ao omitir `target_id` para escopos diferentes de "all".
- Removida referencia a rota GET /posts (nao existe na suite atual).
- Removida secao duplicada de DELETE /post/:id (singular), que nao e rota testada.
- Refinadas premissas sobre buscas de scope em classes para refletir a implementação do UserRepository.

## Observacoes de qualidade da suite atual

- Alguns testes aceitam multiplos status (ex.: 200 ou 403), reduzindo o rigor de contrato.
- O bloco final de listagem de escola esta redundante com um bloco anterior.
- Para aumentar confiabilidade, vale separar melhor cenarios de autorizacao por perfil e ownership com dados controlados por fixture.
