# 💰 Control DIN - Sistema de Controle Financeiro

Um sistema completo, moderno, seguro e escalável de gestão financeira pessoal e empresarial leve, projetado com arquitetura modular, persistência multi-tenant, criptografia no navegador (Web Crypto API), autenticação com validação estrita de e-mail e total governança orientada a GitHub Issues e Pull Requests.

---

## 🌟 Funcionalidades do Sistema

- 🔐 **Autenticação & Segurança Avançada**:
  - Cadastro de usuários com validação estrita de e-mail (RFC 5322) e detecção de erros comuns em domínios.
  - **Fluxo de Ativação por E-mail**: Geração de token de 6 dígitos numéricos com interface interativa de preenchimento/colagem, expiração em 15 minutos e reenvio com temporizador de 30 segundos.
  - **Criptografia Web Crypto API**: Hashes de senha derivados com Salt pseudoaleatório exclusivo de 16 bytes por usuário (`SHA-256` / `PBKDF2`) — *senhas nunca são salvas em texto puro*.
  - **Medidor de Força de Senha**: Avaliação de entropia em tempo real com indicador visual e requisitos de complexidade.
  - **Proteção contra Força Bruta (Rate Limiting)**: Bloqueio automático de 60 segundos após 5 tentativas incorretas consecutivas.
  - **Modo Convidado / Demonstração com 1 Clique**: Acesso imediato para demonstrações com dados realistas pré-configurados.
  - **Isolamento de Dados Multi-tenant**: Cada usuário possui seu próprio banco segregado no armazenamento local (`userId`).
  - **Gestão de Perfil & Segurança**: Edição de nome, personalização da cor do avatar e troca segura de senha.
- 📊 **Dashboard Analítico**:
  - Saldo total consolidado em tempo real.
  - Receitas, despesas e balanço líquido do mês selecionado.
  - Gráficos interativos: **Fluxo Mensal (Receitas vs Despesas)** e **Distribuição de Gastos por Categoria**.
  - Alertas automáticos de orçamentos e contas pendentes/vencidas.
- 💳 **Gestão de Contas & Carteiras**:
  - Contas bancárias, cartões de crédito (com limites e vencimentos) e carteira física.
  - Transferências entre contas com conciliação automática.
- 📝 **Extrato & Transações Completas**:
  - Cadastro ágil de receitas e despesas com suporte a categorias, contas, tags, comprovantes e parcelamentos automáticos.
  - Filtros avançados por período, tipo, conta, categoria e status (Pago/Pendente).
  - Ação rápida para alternar situação (Pago/Pendente) com 1 clique.
- 🎯 **Orçamentos & Metas de Economia**:
  - Limites de gastos por categoria com barras de progresso visuais e avisos de risco de estouro.
  - Metas de poupança/investimento (ex: Reserva de Emergência, Viagens) com aportes e acompanhamento percentual.
- 📈 **Relatórios & Analytics**:
  - Evolução mensal, maiores despesas do período e médias de gastos.
- 💾 **Privacidade & Backup de Dados**:
  - Dados salvos localmente no navegador (100% de privacidade).
  - Exportação completa em **JSON** (Backup) e **CSV** (Planilhas).
  - Importação e restauração de dados a qualquer momento.

---

## 🏛️ Governança do Projeto & Padrões GitHub

Este repositório adota um padrão estrito de governança para manter rastreabilidade total de todas as alterações feitas por desenvolvedores ou **Agentes de IA**:

### 📌 Regras Obrigatórias:
1. **Toda alteração deve ser iniciada a partir de uma GitHub Issue.**
2. **Todo Pull Request (PR) deve conter o vínculo explícito à sua Issue na descrição:**
   - `Closes #X` (Para Novas Funções ou Tarefas concluídas)
   - `Fixes #X` (Para Correções de Bugs)
   - `Relates to #X` (Para PRs correlatos ou parciais)
3. **Padrão de Branches:** `feat/issue-X-...`, `fix/issue-X-...`, `refactor/issue-X-...`, `docs/issue-X-...`
4. **Padrão de Commits:** Conventional Commits (`feat(#X): ...`, `fix(#X): ...`, `refactor(#X): ...`).

> 📋 **Catálogo de Issues:** Consulte [`.github/ISSUES_CATALOG.md`](.github/ISSUES_CATALOG.md) para ver todas as especificações de issues prontas.  
> 🤖 **Atenção Agentes de IA:** É obrigatório ler e seguir o arquivo [`AGENTS.md`](./AGENTS.md).  
> 👥 **Contribuidores Humanos:** Consultem o guia [`CONTRIBUTING.md`](./CONTRIBUTING.md).

---

## 🚀 Como Executar o Projeto

Como o sistema foi desenvolvido utilizando tecnologias web nativas e modulares (HTML5 semântico, CSS3 Moderno com Design System e Vanilla JavaScript ES Modules), **não é necessário instalar ferramentas pesadas de build**:

### Opção 1: Execução Direta
Basta dar um duplo clique no arquivo [`index.html`](./index.html) para abri-lo em qualquer navegador moderno (Chrome, Edge, Firefox, Safari).

### Opção 2: Com Servidor Local (Live Server ou Python)
Se desejar executar com um servidor HTTP local:

```bash
# Com Python 3
python -m http.server 8080

# Ou utilizando a extensão 'Live Server' no VS Code / IDE
```
Acesse `http://localhost:8080` no seu navegador.

---

## 📁 Estrutura de Arquivos

```
├── .github/
│   ├── ISSUES_CATALOG.md               # Catálogo completo de Issues com especificações
│   ├── create_issues.ps1               # Script PowerShell para publicação de issues via CLI
│   ├── create_issues.sh                # Script Bash para publicação de issues via CLI
│   ├── PULL_REQUEST_TEMPLATE.md        # Template de PR com vínculo obrigatório à Issue
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md               # Template de issue para Correções
│   │   ├── feature_request.md          # Template de issue para Novas Funções
│   │   ├── improvement.md              # Template de issue para Melhorias
│   │   └── config.yml                  # Configurações de issues
│   └── issues/                         # Especificações detalhadas das issues do projeto
├── AGENTS.md                           # Diretrizes estritas para Agentes de IA
├── CONTRIBUTING.md                     # Guia de contribuição para desenvolvedores
├── README.md                           # Apresentação do projeto e instruções
├── index.html                          # Estrutura principal da aplicação web & modais
├── css/
│   └── styles.css                      # Design System, variáveis CSS, temas e responsividade
└── js/
    ├── app.js                          # Orquestrador, rotas, eventos e listeners de autenticação
    ├── auth.js                         # Módulo de autenticação, criptografia Web Crypto e tokens
    ├── storage.js                      # Persistência multi-tenant, backup JSON e exportação CSV
    ├── transactions.js                 # Lógica de receitas, despesas, parcelamentos e filtros
    ├── accounts.js                     # Gestão de contas bancárias, cartões e transferências
    ├── budgets.js                      # Orçamentos por categoria e metas de poupança
    ├── charts.js                       # Renderização de gráficos interativos (SVG/Canvas)
    └── ui.js                           # Renderização visual dos componentes, modais e banners
```

---

## 📄 Licença

Distribuído sob a licença MIT.
