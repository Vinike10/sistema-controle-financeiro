# Issue #02: [Security] Criptografia de Credenciais com Salt (Web Crypto API) e Rate Limiting

## 📌 Contexto & Objetivo
Garantir o mais alto padrão de segurança para autenticação no cliente (Client-Side Security) no **Control DIN**, assegurando que senhas nunca sejam armazenadas em texto simples e que ataques automatizados de força bruta sejam contidos.

---

## 🎯 Requisitos Técnicos
1. **Derivação de Chaves Criptográficas com Salt**:
   - Utilizar a API nativa `window.crypto.subtle` do navegador.
   - Gerar um vetor de bytes pseudoaleatório criptograficamente seguro (`crypto.getRandomValues`) de 16 bytes como Salt exclusivo para cada usuário.
   - Derivar o hash com algoritmo `SHA-256` / `PBKDF2`.
2. **Medidor de Força de Senha**:
   - Avaliação dinâmica de tamanho, letras maiúsculas, minúsculas, dígitos e símbolos.
   - Indicador visual colorido (Fraca, Média, Forte, Excelente) com dicas de segurança.
3. **Mecanismo de Proteção contra Força Bruta (Rate Limiting)**:
   - Contador de falhas consecutivas de login por e-mail.
   - Ao atingir 5 tentativas incorretas, aplicar bloqueio de 60 segundos com contador regressivo em tempo real.

---

## 🧪 Critérios de Aceite
- [x] Senhas salvas no `localStorage` sob a chave de usuários estão 100% criptografadas com hash + salt.
- [x] O usuário é impedido de cadastrar senhas excessivamente fracas (< 6 caracteres).
- [x] Após 5 tentativas de login com erro, o formulário é desabilitado e exibe a mensagem de bloqueio temporário.

---

## 🔗 Vínculo com Pull Request
- **Branch**: `feat/issue-02-crypto-security-rate-limiting`
- **Comando no PR**: `Closes #02`
