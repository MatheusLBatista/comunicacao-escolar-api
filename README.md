# Comunicação Escolar API

Plataforma backend para centralizar e modernizar a comunicação entre instituições de ensino, professores e responsáveis. A API suporta múltiplas escolas de forma isolada (multi-tenant), cobrindo desde o registro de rotinas diárias dos alunos até chat em tempo real, mural de avisos, agenda escolar e controle de saída.

## Tecnologias

<img alt="Node.js" src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" /> <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" /> <img alt="Express" src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" /> <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" /> <img alt="Socket.IO" src="https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white" /> <img alt="Docker" src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" /> <img alt="MinIO" src="https://img.shields.io/badge/MinIO-C72E49?style=for-the-badge&logo=minio&logoColor=white" /> <img alt="JWT" src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" /> <img alt="Zod" src="https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white" /> <img alt="Jest" src="https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white" /> <img alt="Swagger" src="https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black" />

## Features

- **Autenticação e autorização** com JWT (access token + refresh token), recuperação de senha via e-mail e convite de usuários.
- **Multi-tenant** - isolamento total de dados entre escolas via `school_id`.
- **Gestão de usuários e perfis** com papéis distintos: Administrador, Professor e Responsável.
- **Comunicados diários** - templates configuráveis por escola; professores registram a rotina dos alunos e responsáveis confirmam a leitura.
- **Mural de avisos** - publicação de posts direcionados à escola inteira ou a turmas específicas, com suporte a curtidas.
- **Chat em tempo real** via Socket.IO - mensagens privadas entre professores e responsáveis.
- **Agenda escolar** - cadastro e visualização de eventos por escola ou turma.
- **Controle de saída** - cadastro de autorizados para retirada de alunos com registro de log.
- **Armazenamento de arquivos** com MinIO (imagens de perfil, anexos).
- **Notificações push** em tempo real para novos comunicados, mensagens e avisos urgentes.
- **Auditoria** - logs detalhados de todas as operações com Winston.
- **Documentação interativa** da API via Swagger UI em `/api-docs`.

## Pré-requisitos

- [Node.js](https://nodejs.org/) v18 ou superior
- [Docker](https://www.docker.com/) e Docker Compose
- [npm](https://www.npmjs.com/)

## Instalação e configuração

**1. Clone o repositório**

```bash
git clone https://gitlab.fslab.dev/fabrica-de-software-iv/comunicacao-escolar/comunicacao-escolar-api.git
cd comunicacao-escolar-api
```

**2. Configure as variáveis de ambiente**

```bash
cp .env.example .env
```

Edite o arquivo `.env` com os valores adequados ao seu ambiente. As principais variáveis são:

| Variável | Descrição | Exemplo |
| :--- | :--- | :--- |
| `PORT` | Porta do servidor | `3010` |
| `NODE_ENV` | Ambiente (`development` / `production`) | `development` |
| `DB_URL` | URL de conexão com o MongoDB | `mongodb://localhost:27017/comunicacao-escolar` |
| `JWT_SECRET_ACCESS_TOKEN` | Chave secreta do access token | *(gere uma chave segura)* |
| `JWT_SECRET_REFRESH_TOKEN` | Chave secreta do refresh token | *(gere uma chave segura)* |
| `EMAIL_USER` | E-mail Gmail para envio de notificações | `seu@gmail.com` |
| `EMAIL_APP_PASSWORD` | Senha de app do Gmail | *(gerada nas configurações do Google)* |
| `MINIO_ENDPOINT` | Endpoint do MinIO | `localhost` |
| `MINIO_ACCESS_KEY` | Chave de acesso do MinIO | `minioadmin` |
| `MINIO_SECRET_KEY` | Chave secreta do MinIO | `minioadmin` |

**3. Suba a infraestrutura (MongoDB + MinIO)**

```bash
docker compose up -d
```

**4. Instale as dependências**

```bash
npm install
```

**5. Popule o banco com dados iniciais (opcional)**

```bash
npm run seed
```

## Executando

**Modo desenvolvimento** (com hot-reload via Nodemon):

```bash
npm run dev
```

**Modo produção** (com Docker):

```bash
npm run start:production
```

O servidor ficará disponível em `http://localhost:{PORT}`.
A documentação Swagger estará disponível em `http://localhost:{PORT}/api-docs`.

## Testes

```bash
# Executar todos os testes com relatório de cobertura
npm test

# Verificar lint
npm run lint

# Corrigir lint e formatar o código
npm run fix
```

Os testes utilizam o `mongodb-memory-server`, portanto não é necessário um banco em execução para rodá-los.

## Estrutura do projeto

```
src/
├── config/          # Configurações (MinIO, Multer, Sharp)
├── controllers/     # Controladores das rotas
├── middlewares/     # Autenticação, autorização e validação
├── models/          # Schemas Mongoose
├── repositories/    # Camada de acesso a dados
├── routes/          # Definição das rotas Express
├── seeds/           # Dados iniciais para desenvolvimento
├── services/        # Regras de negócio
├── tests/           # Testes unitários e de integração
└── utils/           # Utilitários (logger, token, helpers)
```

## Equipe

| Nome | Papel | Contato |
| :--- | :--- | :--- |
| Arthur Gomes | Desenvolvedor | piclekrick@gmail.com |
| Matheus Batista | Desenvolvedor | matheusifro2020@gmail.com |
| Silvio Ribeiro | Desenvolvedor | silviohuan@gmail.com |
| Vinícius Moraes | Desenvolvedor | viniciusmoraesvha@gmail.com |

**Cliente:** Gilberto Pereira da Silva - gilberto.silva@ifro.edu.br

## Licença

Distribuído sob a licença [MIT](https://opensource.org/licenses/MIT).
