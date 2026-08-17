# Issue #03: [Feature] Fluxo de Verificação de E-mail (Token 6 Dígitos) e Recuperação de Senha

## 📌 Contexto & Objetivo
Implementar o fluxo de verificação de autenticidade de e-mail por meio de token de segurança de 6 dígitos numéricos, além do fluxo completo de redefinição e recuperação de senha.

---

## 🎯 Requisitos Técnicos
1. **Validação e Verificação de E-mail**:
   - Validação com Expressão Regular RFC 5322 e correção de typos comuns (`@gmai.com`, `@hotmai.com`).
   - Geração de código de ativação numérico de 6 dígitos (ex: `749102`) com validade de 15 minutos.
   - Tela com 6 caixas de entrada de dígitos com foco automático progressivo, suporte à tecla Backspace e suporte a colar (`Ctrl+V`) o código completo.
   - Botão de reenvio de código com temporizador de cooldown de 30 segundos.
   - Atualização do status da conta para `emailVerified: true` após confirmação correta.
   - Banner de alerta visual caso o usuário decida confirmar o e-mail mais tarde.
2. **Recuperação de Senha ("Esqueci minha senha")**:
   - Solicitação por e-mail com geração de token de recuperação de 6 dígitos.
   - Confirmação do código e redefinição para uma nova senha forte criptografada.

---

## 🧪 Critérios de Aceite
- [x] Ao cadastrar, o código de 6 dígitos é gerado e o usuário é redirecionado para a tela de verificação.
- [x] O usuário pode digitar ou colar o código de 6 dígitos e validá-lo.
- [x] Contas verificadas exibem o selo verde de "E-mail Verificado".
- [x] Usuários conseguem redefinir sua senha com sucesso caso esqueçam.

---

## 🔗 Vínculo com Pull Request
- **Branch**: `feat/issue-03-email-verification-password-reset`
- **Comando no PR**: `Closes #03`
