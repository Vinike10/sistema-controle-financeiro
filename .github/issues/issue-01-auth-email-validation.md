# Issue #01: [Feature] Sistema de Autenticação Segura, Validação de E-mail e Multi-tenancy Local

## 📌 Contexto & Objetivo
Implementar um sistema completo e moderno de autenticação para o **Control DIN** que permita aos usuários se registrarem, efetuarem login com credenciais protegidas, validarem o e-mail, alternarem para o modo de demonstração com 1 clique e acessarem seus dados financeiros com total isolamento e privacidade local (multi-tenant).

---

## 🎯 Requisitos & Funcionalidades
1. **Cadastro de Usuário**:
   - Campos: Nome Completo, E-mail, Senha, Confirmação de Senha e Aceite de Termos.
   - Validação estrita de formato de e-mail (RFC 5322) e detecção de domínios incorretos.
   - Medidor de entropia e força de senha em tempo real.
2. **Login com Segurança**:
   - Validação de credenciais com comparação de hash criptográfico e salt.
   - Opção "Lembrar de mim" (Sessão persistente vs Sessão ativa).
   - Bloqueio temporário (Rate Limiting de 60s) após 5 falhas consecutivas para prevenir brute force.
3. **Modo Convidado / Demonstração**:
   - Botão rápido "Acessar Modo Demo" para testes imediatos com dados financeiros realistas.
4. **Isolamento de Armazenamento (Multi-tenancy)**:
   - Os dados de cada usuário (transações, contas, orçamentos, metas) são segregados por `userId`.
5. **Interface de Perfil & Logout**:
   - Exibição de avatar, nome, e-mail e selo de e-mail verificado no cabeçalho e sidebar.
   - Modal de Perfil e Segurança com alteração de dados e troca de senha.

---

## 🧪 Critérios de Aceite
- [x] O usuário consegue criar uma conta nova e receber feedback imediato.
- [x] O usuário consegue fazer login e logout com transições suaves.
- [x] Senhas armazenadas utilizam hash irreversível com salt gerado pela Web Crypto API.
- [x] Erros de e-mail inválido ou senha incorreta são exibidos com clareza.
- [x] Dados financeiros de contas diferentes não se misturam no armazenamento local.

---

## 🔗 Vínculo com Pull Request
- **Branch**: `feat/issue-01-auth-email-validation`
- **Comando no PR**: `Closes #01`
