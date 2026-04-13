# Projeto de Software - Comunicação Escolar

## Stakeholders

| Nome | Cargo/Papel | Contato |
| :---- | :---- | :---- |
| Gilberto Pereira da Silva | Professor/Cliente | gilberto.silva@ifro.edu.br |

## Equipe de Desenvolvimento

| Nome | Cargo/Papel | Contato |
| :---- | :---- | :---- |
| Arthur Gomes | Desenvolvedor | piclekrick@gmail.com |
| Matheus Batista | Desenvolvedor | matheusifro2020@gmail.com |
| Silvio Ribeiro | Desenvolvedor | silviohuan@gmail.com |
| Vinícius Moraes | Desenvolvedor | viniciusmoraesvha@gmail.com |

---

## Sumário

- [Resumo do Projeto](#resumo-do-projeto)
- [Introdução](#introdução)
  - [Propósito deste Documento](#propósito-deste-documento)
  - [Concepção do Sistema](#concepção-do-sistema)
- [Descrição Geral](#descrição-geral)
  - [Usuários do Sistema (Atores)](#usuários-do-sistema-atores)
  - [Abrangência e Sistemas Similares](#abrangência-e-sistemas-similares)
  - [Suposições e Dependências](#suposições-e-dependências)
- [Estudo de Viabilidade](#estudo-de-viabilidade)
- [Metodologia de Desenvolvimento](#metodologia-de-desenvolvimento)
- [Requisitos do Software](#requisitos-do-software)
  - [Requisitos Funcionais](#requisitos-funcionais)
  - [Requisitos Não Funcionais](#requisitos-não-funcionais)
- [Diagrama de Casos de Uso](#diagrama-de-casos-de-uso)
  - [Descrição Textual dos Casos de Uso](#descrição-textual-dos-casos-de-uso)

---

## Resumo do Projeto

| Campo | Descrição |
| :---- | :---- |
| **Nome** | Comunicação Escolar |
| **Principal objetivo** | Desenvolver uma plataforma que centralize e facilite a comunicação entre escolas, professores e responsáveis, em torno da vida escolar dos alunos. |
| **Benefícios esperados** | Melhorar o fluxo de informações escolares, reduzir o uso de meios informais de comunicação e aumentar o engajamento dos responsáveis na vida escolar dos alunos. |
| **Início previsto** | 10/02/2026 |
| **Término previsto** | 23/06/2026 |

---

## Introdução

O sistema de Comunicação Escolar é uma plataforma digital desenvolvida para modernizar e centralizar a comunicação entre instituições de ensino, professores e responsáveis. A solução abrange desde o registro de rotinas diárias dos alunos até a publicação de avisos no mural, chat privado entre professores e responsáveis, agenda escolar e controle de saída, tudo integrado em um único ambiente seguro e multi-tenant.

### Propósito deste Documento

O objetivo deste documento é detalhar a concepção, arquitetura, requisitos e funcionalidades do sistema. Ele serve como guia para o desenvolvimento contínuo e a manutenção do projeto, garantindo que as informações relevantes estejam organizadas e acessíveis a toda a equipe.

### Concepção do Sistema

A ideia para o desenvolvimento do sistema partiu da necessidade identificada de unificar, em uma única plataforma, os diversos canais de comunicação utilizados pelas escolas com as famílias dos alunos,  como grupos de WhatsApp, e-mails e bilhetes físicos. O sistema propõe centralizar funcionalidades como registro de rotina diária dos alunos com templates configuráveis, mural de avisos, chat privado entre professor e responsável, agenda escolar, controle de saída com autorização e notificações em tempo real, garantindo isolamento total de dados entre diferentes instituições.

---

## Descrição Geral

Plataforma mobile com o objetivo de ser o canal oficial de comunicação entre escolas e famílias. Professores podem registrar a rotina diária dos alunos, publicar avisos no mural, trocar mensagens privadas com responsáveis e gerenciar eventos escolares. Responsáveis podem acompanhar a vida escolar de seus filhos, confirmar leitura de comunicados, interagir via chat e autorizar a saída dos alunos, tudo de forma organizada e segura.

### Usuários do Sistema (Atores)

| Ator | Descrição |
| :---- | :---- |
| Administrador | Gerencia a escola cadastrada na plataforma, podendo criar e gerenciar usuários, configurar turmas, templates de comunicados e demais configurações institucionais. Tem visibilidade total sobre as operações da escola. |
| Professor | Pode registrar a rotina diária dos alunos seguindo templates configurados, publicar avisos no mural (direcionados à escola inteira ou a turmas específicas), conversar com responsáveis via chat e gerenciar eventos na agenda escolar. |
| Responsável | Acompanha os comunicados diários de seus filhos, confirma leitura, interage com professores via chat, visualiza o mural de avisos, consulta a agenda escolar e gerencia autorizações de retirada dos alunos. |

### Abrangência e Sistemas Similares

O objetivo é que qualquer instituição de ensino possa adotar a plataforma de forma simples, com suporte a múltiplas escolas de forma isolada (multi-tenant). Existem aplicativos com propostas semelhantes, mas que geralmente não contemplam todas as funcionalidades em um único produto adaptado à realidade brasileira e à LGPD. Exemplos: **ClassDojo**, **Agenda Edu** e **Google Classroom**.

### Suposições e Dependências

**Suposições:**

- Os usuários terão acesso a um dispositivo mobile com o aplicativo instalado.
- As escolas terão acesso à internet para uso contínuo da plataforma.
- Cada escola operará de forma independente, sem acesso aos dados das demais.

**Dependências:**

- **Node.js (v18+):** Ambiente de execução do backend.
- **MongoDB:** Banco de dados principal para armazenamento dos dados.
- **Socket.IO:** Biblioteca para comunicação em tempo real via WebSockets.
- **Docker:** Containerização da aplicação para facilitar o deploy.
- **MinIO:** Armazenamento de arquivos e imagens.

---

## Estudo de Viabilidade

**Viabilidade Técnica**

As tecnologias utilizadas (Node.js, Express, MongoDB, Socket.IO, Docker) são maduras e amplamente adotadas no mercado, com amplo suporte da comunidade. A comunicação em tempo real via WebSockets é uma solução consolidada para aplicações de chat e notificações. A arquitetura multi-tenant com isolamento por `school_id` é uma prática comum e tecnicamente bem suportada com MongoDB. Conclusão: o projeto é tecnicamente viável.

**Viabilidade Econômica**

Os custos de desenvolvimento envolvem tempo e mão de obra da equipe. Os custos de infraestrutura variam conforme a hospedagem, podem ser baixos com self-hosted (Docker, MongoDB Atlas gratuito, MinIO self-hosted) ou escaláveis com serviços em nuvem (Azure, AWS). Conclusão: é economicamente viável, com opções de infraestrutura de baixo custo para o início.

**Viabilidade Operacional**

O sistema é acessível via aplicativo mobile, sem necessidade de configuração complexa pelo usuário final. A manutenção envolve atualizações de segurança, monitoramento e backups regulares do banco de dados. Conclusão: é operacionalmente viável com a administração técnica adequada.

**Viabilidade Legal**

O projeto utiliza bibliotecas com licenças permissivas (MIT, ISC, Apache 2.0). O tratamento de dados de menores de idade exige atenção especial à LGPD, incluindo consentimento dos responsáveis. O isolamento de dados entre escolas reduz riscos de vazamento e facilita a conformidade. Conclusão: é legalmente viável, respeitando a LGPD e as políticas de terceiros.

---

## Metodologia de Desenvolvimento

A equipe adotou a metodologia ágil com **Kanban**, com definição clara de tarefas e atribuições diretas a cada membro.

- **Visualização:** Quadro com colunas: Backlog, A Fazer, Em Andamento, Teste e Concluído.
- **Limite de WIP:** Limite de tarefas em andamento para manter o foco da equipe.
- **Gestão do fluxo:** Priorização contínua das tarefas do backlog.
- **Melhoria contínua:** Revisão periódica do processo.

---

## Requisitos do Software

### Requisitos Funcionais

| ID | Nome | Descrição | Prioridade |
| :---- | :---- | :---- | :---- |
| RF01 | Gestão de autenticação e sessão | O sistema deve permitir que os usuários realizem login utilizando e-mail e senha, gerenciando a sessão através de tokens JWT. | Alta |
| RF02 | Cadastro e gestão escolar | O sistema deve permitir o cadastro de escolas, garantindo independência e autonomia de cada locatário. | Alta |
| RF03 | Gestão de usuários e perfis | O sistema deve permitir a gestão de usuários com papéis distintos: administrador, professor e responsável. | Alta |
| RF04 | Configuração dinâmica de comunicados | O sistema deve permitir a criação de templates personalizados de comunicados diários com campos de tipos variados. | Alta |
| RF05 | Registro de rotina diária | Professores devem ser capazes de registrar a rotina diária dos alunos seguindo o template configurado. | Alta |
| RF06 | Confirmação de leitura de comunicados | O sistema deve registrar automaticamente a data e hora em que um responsável visualizou o comunicado diário do aluno. | Alta |
| RF07 | Publicação no mural | Professores devem poder publicar avisos no mural, direcionando-os para toda a escola ou para turmas específicas. | Alta |
| RF08 | Interação no mural | O sistema deve permitir que os usuários curtam avisos publicados no mural. | Média |
| RF09 | Comunicação via chat | O sistema deve conter um chat entre professores e responsáveis, permitindo mensagens privadas ou respostas diretas a comunicados diários. | Alta |
| RF10 | Agenda escolar | O sistema deve permitir o cadastro e a visualização de eventos escolares. | Média |
| RF11 | Controle de saída | O sistema deve permitir o gerenciamento de indivíduos autorizados para a retirada de alunos e deve registrar o log de saída (quem retirou e horário). | Alta |
| RF12 | Notificações push | O sistema deve enviar notificações em tempo real para dispositivos móveis sobre novas mensagens, comunicados ou avisos urgentes. | Alta |
| RF13 | Auditoria de acesso | O sistema deve registrar logs de auditoria de todas as operações e acessos realizados pelos usuários. | Média |

### Requisitos Não Funcionais

| ID | Nome | Descrição | Prioridade |
| :---- | :---- | :---- | :---- |
| RNF01 | Isolamento de dados | O sistema deve garantir o isolamento total dos dados entre diferentes escolas, usuários de uma escola não devem acessar dados de outra. | Alta |
| RNF02 | Conformidade com a LGPD | O tratamento de dados, especialmente de menores de idade, deve seguir a Lei Geral de Proteção de Dados. | Alta |
| RNF03 | Comunicação em tempo real | O sistema deve utilizar WebSockets para garantir que mensagens e notificações cheguem instantaneamente aos clientes. | Alta |
| RNF04 | Interface e design system | A interface deve seguir um design moderno e intuitivo, utilizando componentes padronizados que garantam uma experiência fluida de navegação. | Média |

---

## Diagrama de Casos de Uso

<!-- ![Casos de Uso]() -->

### Descrição Textual dos Casos de Uso

**Administrador:**
- **Cadastrar escola:** Realiza o cadastro de uma nova instituição de ensino no sistema, tornando-a um locatário independente.
- **Gerenciar usuários:** Cria, edita, ativa e desativa usuários, atribuindo papéis (professor, responsável) dentro da escola.
- **Configurar templates de comunicado:** Define os campos e tipos de cada template de comunicado diário utilizado pelos professores.

**Professor:**
- **Registrar rotina diária:** Preenche o comunicado diário de um aluno com base no template configurado pela escola.
- **Publicar aviso no mural:** Cria e publica avisos para toda a escola ou para uma turma específica.
- **Enviar mensagem no chat:** Inicia ou responde conversas privadas com responsáveis de alunos.
- **Gerenciar agenda escolar:** Cadastra e edita eventos na agenda da escola ou de uma turma.

**Responsável:**
- **Visualizar comunicado diário:** Acessa e confirma a leitura do comunicado diário do(s) seu(s) filho(s).
- **Interagir no mural:** Visualiza e curte avisos publicados no mural.
- **Conversar no chat:** Envia e recebe mensagens privadas com professores.
- **Gerenciar autorização de saída:** Cadastra pessoas autorizadas a retirar o aluno.
