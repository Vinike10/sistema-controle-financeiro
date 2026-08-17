# 📋 Catálogo de GitHub Issues - Control DIN

Este catálogo centraliza todas as issues planejadas e especificadas para o projeto **Control DIN**. Cada issue possui escopo delimitado, critérios de aceite e rastreabilidade para vincular aos Pull Requests (`Closes #X`, `Fixes #X`, `Relates to #X`).

---

## 📌 Lista de Issues
| # | Tipo | Título | Label | Branch Padrão |
|---|------|--------|-------|---------------|
| **#01** | `✨ Funcionalidade` | Sistema de Autenticação Segura, Validação de E-mail e Multi-tenancy Local | `funcionalidade`, `auth`, `seguranca` | `feat/issue-01-auth-email-validation` |
| **#02** | `🔒 Segurança` | Criptografia de Credenciais com Salt (Web Crypto API) e Rate Limiting | `seguranca`, `melhoria` | `feat/issue-02-crypto-security-rate-limiting` |
| **#03** | `✨ Funcionalidade` | Fluxo de Verificação de E-mail (Token 6 Dígitos) e Recuperação de Senha | `funcionalidade`, `auth`, `ux` | `feat/issue-03-email-verification-password-reset` |
| **#04** | `🚀 Melhoria` | Isolamento de Dados Multi-tenant por Usuário e Gestão de Perfil | `melhoria`, `storage`, `ui` | `refactor/issue-04-multi-tenant-user-profile` |
| **#05** | `📚 Documentação` | Atualização das Diretrizes de Governança e Regras para Agentes de IA | `documentacao`, `governanca` | `docs/issue-05-agents-governance-update` |

---

## 📝 Especificações Detalhadas das Issues

### Issue #01: [Feature] Sistema de Autenticação Segura, Validação de E-mail e Multi-tenancy Local
- **Status**: Em Implementação
- **Descrição**: Desenvolver o módulo central de autenticação do Control DIN permitindo que usuários criem contas, façam login com persistência de sessão, alternem para modo convidado/demonstração e acessem suas finanças de forma isolada e segura.
- **Critérios de Aceite**:
  - [x] Criação de conta com Nome, E-mail, Senha e Confirmação de Senha.
  - [x] Validação rigorosa de formato e domínio de e-mail (RFC 5322).
  - [x] Tela moderna de Login com alternador de visibilidade de senha.
  - [x] Acesso rápido com 1 clique ao Modo Demo com dados pré-carregados.
  - [x] Persistência segura de sessão (`Remember Me` ou sessão temporária).
  - [x] Exibição de perfil e status de verificação no cabeçalho e sidebar.

### Issue #02: [Security] Criptografia de Credenciais com Salt (Web Crypto API) e Rate Limiting
- **Status**: Em Implementação
- **Descrição**: Implementar camada de segurança criptográfica no navegador para proteger as credenciais dos usuários, evitando o armazenamento de senhas em texto puro e mitigando ataques de força bruta.
- **Critérios de Aceite**:
  - [x] Geração de salt aleatório criptográfico (16 bytes) por usuário.
  - [x] Hash seguro de senhas com Web Crypto API (`SHA-256` / `PBKDF2`).
  - [x] Medidor em tempo real de entropia e força de senha no cadastro.
  - [x] Rate limiting: Bloqueio automático de 60s após 5 tentativas consecutivas de login incorreto.

### Issue #03: [Feature] Fluxo de Verificação de E-mail (Token 6 Dígitos) e Recuperação de Senha
- **Status**: Em Implementação
- **Descrição**: Disponibilizar fluxo de ativação e verificação de e-mail através de token de 6 dígitos com expiração de 15 minutos e temporizador de reenvio de 30 segundos, além de fluxo de recuperação de senha esquecida.
- **Critérios de Aceite**:
  - [x] Geração de código numérico de 6 dígitos no cadastro e recuperação.
  - [x] Input interativo de 6 caixas com navegação automática e suporte a colar código.
  - [x] Banner persistente para contas com e-mail não verificado.
  - [x] Reenvio de código com cooldown de 30 segundos.
  - [x] Recuperação de senha com validação de e-mail, código e nova senha.

### Issue #04: [Enhancement] Isolamento de Dados Multi-tenant por Usuário e Gestão de Perfil
- **Status**: Em Implementação
- **Descrição**: Reestruturar a camada de persistência (`js/storage.js`) para particionar todos os dados financeiros (transações, contas, orçamentos, metas) por `userId`, garantindo total privacidade e permitindo que múltiplos usuários utilizem o mesmo dispositivo sem mistura de dados.
- **Critérios de Aceite**:
  - [x] Escopo automático de chaves no `localStorage` por `userId`.
  - [x] Modal de Perfil & Segurança permitindo alterar nome, cor do avatar e trocar senha.
  - [x] Migração automática de dados legados para manter compatibilidade.

### Issue #05: [Docs] Atualização das Diretrizes de Governança e Regras para Agentes de IA
- **Status**: Concluído
- **Descrição**: Atualizar `AGENTS.md`, `README.md` e `CONTRIBUTING.md` para estabelecer as regras inegociáveis de governança de código, rastreabilidade de PRs e diretrizes de autenticação para qualquer modelo de IA ou desenvolvedor.
