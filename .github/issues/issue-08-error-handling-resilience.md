# Issue #10: [Melhoria] Sistema Global de Tratamento de Erros, Validação Defensiva e Resiliência

## 📌 Contexto & Motivação
Em aplicações financeiras, a confiabilidade e resiliência no processamento de dados monetários, datas e persistência são essenciais. Erros silenciosos, quebras de execução por entradas inválidas ou corrupção de dados no armazenamento local (`localStorage`) comprometem a experiência do usuário e a integridade financeira.

Esta issue estabelece uma camada unificada de tratamento de erros, validação defensiva, handlers globais de exceções no navegador e fallbacks de segurança.

---

## 🎯 Critérios de Aceite & Tarefas

### 1. Handlers Globais de Exceções
- [x] Captura de erros assíncronos não tratados com `window.addEventListener('unhandledrejection')`.
- [x] Captura de erros globais de execução com `window.addEventListener('error')`.
- [x] Notificação não intrusiva ao usuário via Toast, mantendo a interface acessível sem tela branca.

### 2. Validação Defensiva de Dados Monetários e Datas
- [x] Utilitário central de sanitização monetária (`parseAmount`) compatível com formato brasileiro (`1.250,50`, `R$ 150,00`, `150.00`) e proteção contra `NaN`, `Infinity` e valores negativos onde inapropriado.
- [x] Validação estrita de datas no formato ISO (`YYYY-MM-DD`) com suporte seguro a anos bissextos e viradas de mês.
- [x] Algoritmo de parcelamento com compensação de centavos para garantir que a soma das parcelas seja exatamente igual ao valor total.

### 3. Normalização de Métodos e Interfaces
- [x] Implementação de `Transactions.createInstallments(...)` com suporte a parcelas e notas explicativas.
- [x] Implementação de `Accounts.transfer(...)` e `Accounts.transferFunds(...)` com retorno padronizado `{ success, message }`.
- [x] Validação rigorosa em operações de metas (`Goals.deposit`), orçamentos e contas.

### 4. Resiliência do LocalStorage
- [x] Proteção contra estouro de cota (`QuotaExceededError`) e modo anônimo via `Storage.safeSetItem`.
- [x] Recuperação automática e proteção contra JSON corrompido em todas as leituras de entidades (`getTransactions`, `getAccounts`, `getCategories`, `getBudgets`, `getGoals`).

### 5. Fallback Criptográfico
- [x] Algoritmo de fallback puro em JavaScript para SHA-256 caso `window.crypto.subtle` esteja indisponível no ambiente de execução.

### 6. UI Segura e Estados de Falha Amigáveis
- [x] Prevenção de quebras de renderização na interface (tabelas, cards e gráficos) através de blocos `try/catch` defensivos e visualizações de estado vazio.
