# Issue #04: [Enhancement] Isolamento de Dados Multi-tenant por Usuário e Gestão de Perfil

## 📌 Contexto & Objetivo
Garantir escalabilidade e isolamento absoluto dos registros financeiros entre diferentes usuários no navegador, permitindo a gestão de perfil personalizada e a transição fluida para ambientes em nuvem ou APIs no futuro.

---

## 🎯 Requisitos Técnicos
1. **Escopo Dinâmico de Armazenamento**:
   - `Storage` indexa todas as tabelas com o prefixo do `userId`: `controldin_usr_xxx_transactions`, `controldin_usr_xxx_accounts`, etc.
   - Conta de Demonstração pré-configurada (`demo@controldin.com`) com dados de exemplo completos.
   - Migração transparente dos dados legados existentes para o primeiro usuário logado.
2. **Modal de Perfil & Segurança**:
   - Edição de nome do usuário e personalização da cor do avatar.
   - Troca de senha segura exigindo confirmação da senha atual.
   - Exibição de estatísticas da conta: Data de Cadastro, Último Acesso e Status de Verificação de E-mail.
3. **Menu de Usuário no Top Header**:
   - Botão com avatar e nome, dropdown com opções de Perfil, Alternar Conta e Sair.

---

## 🧪 Critérios de Aceite
- [x] O usuário logado só tem acesso às suas próprias transações e contas.
- [x] O usuário pode alterar seu nome e senha através do modal de perfil.
- [x] Ao clicar em "Sair", a sessão é encerrada com segurança e a tela de login é reexibida.

---

## 🔗 Vínculo com Pull Request
- **Branch**: `refactor/issue-04-multi-tenant-user-profile`
- **Comando no PR**: `Closes #04`
