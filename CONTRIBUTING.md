# 🤝 Guia de Contribuição (CONTRIBUTING.md)

Obrigado pelo interesse em contribuir com o **Control DIN** (Sistema de Controle Financeiro)! Para manter a integridade do código, a rastreabilidade das tarefas e uma organização clara, todos os contribuidores (humanos e agentes de IA) devem seguir o fluxo descrito abaixo.

---

## 📌 Regra Fundamental: Vínculo Obrigatório de Issues & PRs

1. **Nenhum Pull Request deve ser criado sem uma Issue aberta correspondente.**
2. O Pull Request **DEVE** conter em sua descrição o comando de vínculo:
   - `Closes #<numero>` (Para novas funcionalidades e tarefas concluídas)
   - `Fixes #<numero>` (Para correções de bugs)
   - `Relates to #<numero>` (Para PRs parciais ou melhorias correlatas)

---

## 🛠️ Passo a Passo do Desenvolvimento

### 1. Criar ou Escolher uma Issue
- Verifique a aba de **Issues** no GitHub ou o **GitHub Projects**.
- Escolha uma issue disponível ou abra uma nova utilizando um dos templates padronizados:
  - `[Feature]` para Novas Funções
  - `[Bug]` para Correções de Bugs
  - `[Enhancement]` para Melhorias e Refatorações

### 2. Criar a Branch a partir da `main`
Crie uma branch seguindo o padrão que referencia o número da Issue:

```bash
# Para uma nova funcionalidade (Issue #15)
git checkout -b feat/issue-15-grafico-orcamentos

# Para correção de um bug (Issue #08)
git checkout -b fix/issue-08-calculo-saldo-parcelado

# Para melhorias ou refatorações (Issue #22)
git checkout -b refactor/issue-22-otimizacao-extrato

# Para documentação (Issue #03)
git checkout -b docs/issue-03-atualizacao-readme
```

### 3. Escrever o Código e Commits Convencionais
Ao fazer commits, use o padrão Conventional Commits mencionando o número da issue:

```bash
git commit -m "feat(#15): adiciona barra de progresso para metas de economia"
git commit -m "fix(#08): ajusta data de vencimento da fatura do cartao de credito"
git commit -m "refactor(#22): modulariza renderizacao da tabela de transacoes"
```

### 4. Abrir o Pull Request
- Submeta seu PR apontando para a branch `main`.
- Preencha todos os campos do [PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md).
- **Certifique-se de marcar o checkbox e preencher o `Closes #...` no topo do PR.**

---

## 📐 Padrões de Código e Arquitetura

- **Sem Dependências Pesadas Desnecessárias**: O sistema foi projetado para ser leve, rápido e funcionar diretamente no navegador com HTML5, CSS modular moderno e Vanilla JavaScript (ES Modules).
- **Tratamento de Dados Financeiros**:
  - Valores monetários sempre representados internamente como números (`Number` float/centavos) e formatados para o usuário como `R$ 0.000,00` usando `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
  - Tratamento rigoroso de datas (formato `YYYY-MM-DD`).
- **Persistência**:
  - Armazenamento local no `localStorage` com controle de versão e dados iniciais pré-carregados para facilitar demonstrações.
  - Funções de exportação (`JSON` completo e `CSV`) e importação (`JSON`).

---
