/**
 * Control DIN - UI Service with Motion Principles & Skeletons (js/ui.js)
 * Responsável pela renderização de todas as telas, skeletons de carregamento com shimmer,
 * contadores numéricos animados e animações escalonadas (staggered).
 */

// Cache para interpolação de contadores
const numericValuesCache = new Map();

const UI = {
  // Manipuladores seguros do DOM para prevenir exceções caso elementos não existam
  safeSetText(elementId, text) {
    const el = document.getElementById(elementId);
    if (el) el.textContent = text !== undefined && text !== null ? text : '';
    return el;
  },

  safeSetHTML(elementId, html) {
    const el = document.getElementById(elementId);
    if (el) el.innerHTML = html !== undefined && html !== null ? html : '';
    return el;
  },

  // Inicialização e atualização de ícones Lucide
  refreshIcons() {
    try {
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    } catch (err) {
      console.warn('[UI] Falha ao renderizar ícones Lucide:', err);
    }
  },

  // Formatação de Moeda Brasileira (R$) com proteção defensiva
  formatCurrency(value) {
    const num = (typeof value === 'number' && !isNaN(value)) ? value : (parseFloat(value) || 0);
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  },

  // Formatação de Data Brasileira (DD/MM/YYYY)
  formatDate(dateString) {
    if (!dateString || typeof dateString !== 'string') return '--';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  },

  // Interpolação suave de números (Count-up / Count-down animation)
  animateNumber(elementId, targetValue, isCurrency = true, duration = 450) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const startValue = numericValuesCache.has(elementId) ? numericValuesCache.get(elementId) : 0;
    numericValuesCache.set(elementId, targetValue);

    if (startValue === targetValue) {
      el.textContent = isCurrency ? this.formatCurrency(targetValue) : targetValue;
      return;
    }

    const startTime = performance.now();

    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Easing suave (easeOutCubic)
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentVal = startValue + (targetValue - startValue) * ease;

      el.textContent = isCurrency ? this.formatCurrency(currentVal) : Math.round(currentVal);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        el.textContent = isCurrency ? this.formatCurrency(targetValue) : targetValue;
      }
    };

    requestAnimationFrame(updateCounter);
  },

  // ==================== SKELETON LOADERS ====================

  showDashboardSkeletons() {
    document.getElementById('kpiTotalBalance').innerHTML = '<span class="skeleton skeleton-text-lg"></span>';
    document.getElementById('kpiMonthlyIncome').innerHTML = '<span class="skeleton skeleton-text-lg"></span>';
    document.getElementById('kpiMonthlyExpense').innerHTML = '<span class="skeleton skeleton-text-lg"></span>';
    document.getElementById('kpiMonthlyNet').innerHTML = '<span class="skeleton skeleton-text-lg"></span>';

    document.getElementById('dashboardRecentTransactionsBody').innerHTML = `
      <tr><td colspan="6"><div class="skeleton skeleton-text" style="width: 95%;"></div></td></tr>
      <tr><td colspan="6"><div class="skeleton skeleton-text" style="width: 90%;"></div></td></tr>
      <tr><td colspan="6"><div class="skeleton skeleton-text" style="width: 85%;"></div></td></tr>
    `;

    document.getElementById('dashboardBudgetAlertsContainer').innerHTML = `
      <div style="margin-bottom: 1rem;"><div class="skeleton skeleton-text" style="width: 50%;"></div><div class="skeleton" style="width: 100%; height: 8px; border-radius: 99px;"></div></div>
      <div><div class="skeleton skeleton-text" style="width: 60%;"></div><div class="skeleton" style="width: 100%; height: 8px; border-radius: 99px;"></div></div>
    `;
  },

  showTransactionsSkeletons() {
    document.getElementById('transactionsTableBody').innerHTML = Array.from({ length: 6 }).map(() => `
      <tr class="stagger-item">
        <td><div class="skeleton" style="width: 60px; height: 22px; border-radius: 99px;"></div></td>
        <td><div class="skeleton skeleton-text" style="width: 160px;"></div></td>
        <td><div class="skeleton skeleton-text" style="width: 100px;"></div></td>
        <td><div class="skeleton skeleton-text" style="width: 90px;"></div></td>
        <td><div class="skeleton skeleton-text" style="width: 70px;"></div></td>
        <td class="text-right"><div class="skeleton skeleton-text" style="width: 80px; margin-left: auto;"></div></td>
        <td class="text-center"><div class="skeleton skeleton-circle" style="width: 26px; height: 26px; display: inline-block;"></div></td>
      </tr>
    `).join('');
  },

  showAccountsSkeletons() {
    document.getElementById('accountsGrid').innerHTML = Array.from({ length: 4 }).map(() => `
      <div class="skeleton-card">
        <div class="skeleton skeleton-text" style="width: 60%;"></div>
        <div class="skeleton skeleton-text-lg" style="width: 45%;"></div>
        <div class="skeleton skeleton-text" style="width: 80%;"></div>
      </div>
    `).join('');
  },

  showBudgetsSkeletons() {
    document.getElementById('budgetsListContainer').innerHTML = Array.from({ length: 3 }).map(() => `
      <div class="budget-item">
        <div class="skeleton skeleton-text" style="width: 40%;"></div>
        <div class="skeleton" style="width: 100%; height: 8px; border-radius: 99px;"></div>
      </div>
    `).join('');

    document.getElementById('goalsListContainer').innerHTML = Array.from({ length: 2 }).map(() => `
      <div class="skeleton-card">
        <div class="skeleton skeleton-text" style="width: 50%;"></div>
        <div class="skeleton" style="width: 100%; height: 8px; border-radius: 99px;"></div>
        <div class="skeleton skeleton-text" style="width: 70%;"></div>
      </div>
    `).join('');
  },

  showReportsSkeletons() {
    ['reportAvgIncome', 'reportAvgExpense', 'reportMaxExpense', 'reportYearSavings'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '<span class="skeleton skeleton-text" style="width: 60%;"></span>';
    });
    document.getElementById('reportCategoryRankingBody').innerHTML = Array.from({ length: 4 }).map(() => `
      <tr>
        <td colspan="4"><div class="skeleton skeleton-text" style="width: 90%;"></div></td>
      </tr>
    `).join('');
  },

  // ==================== RENDERIZADORES DE TELAS ====================

  // Renderização Geral do Dashboard com Animações
  renderDashboard(year, month) {
    const metrics = Transactions.calculateMetrics(year, month);
    const periodTransactions = Transactions.getByPeriod(year, month);
    const categories = Storage.getCategories();
    const catMap = new Map(categories.map(c => [c.id, c]));
    const accounts = Storage.getAccounts();
    const accMap = new Map(accounts.map(a => [a.id, a]));

    // 1. Atualizar KPIs com Contadores Animados
    this.animateNumber('kpiTotalBalance', metrics.consolidatedBalance);
    this.animateNumber('kpiMonthlyIncome', metrics.totalIncome);
    document.getElementById('kpiIncomePill').textContent = `Recebidas: ${this.formatCurrency(metrics.paidIncome)}`;
    
    this.animateNumber('kpiMonthlyExpense', metrics.totalExpense);
    document.getElementById('kpiExpensePill').textContent = `Pagas: ${this.formatCurrency(metrics.paidExpense)}`;

    this.animateNumber('kpiMonthlyNet', metrics.netBalance);
    const kpiNet = document.getElementById('kpiMonthlyNet');
    kpiNet.className = `kpi-value ${metrics.netBalance >= 0 ? 'positive' : 'negative'}`;
    document.getElementById('kpiSavingsRate').textContent = `Taxa de economia: ${metrics.savingsRate.toFixed(1)}%`;

    // 2. Gráficos com Animação Nativa via Canvas
    const monthsFlow = Transactions.getSixMonthsFlow(year, month);
    Charts.renderCashFlow('cashFlowChartCanvas', monthsFlow);

    const expenseCategories = Transactions.getExpenseByCategory(year, month);
    Charts.renderCategoryDonut('categoryDonutCanvas', 'categoryDonutLegend', expenseCategories);

    // 3. Tabela de Transações Recentes com Efeito Staggered
    const recentTxBody = document.getElementById('dashboardRecentTransactionsBody');
    const recent = [...periodTransactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    if (recent.length === 0) {
      recentTxBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-muted" style="padding: 2rem;">
            Nenhuma transação encontrada no mês selecionado.
          </td>
        </tr>
      `;
    } else {
      recentTxBody.innerHTML = recent.map((tx, idx) => {
        const cat = catMap.get(tx.categoryId) || { name: 'Geral', color: '#94a3b8', icon: 'tag' };
        const acc = accMap.get(tx.accountId) || { name: 'Conta', color: '#3b82f6' };
        const isExpense = tx.type === 'expense';
        const isTransfer = tx.type === 'transfer' || tx.description.includes('[Transferência');

        return `
          <tr class="stagger-item" style="--item-index: ${idx}">
            <td>
              <div class="tx-desc-cell">
                <div class="tx-icon-pill" style="background-color: ${cat.color}20; color: ${cat.color}">
                  <i data-lucide="${cat.icon || 'tag'}"></i>
                </div>
                <div class="tx-title-group">
                  <span class="tx-title">${tx.description}</span>
                  ${tx.notes ? `<span class="tx-meta">${tx.notes}</span>` : ''}
                </div>
              </div>
            </td>
            <td>
              <span class="badge-category">${cat.name}</span>
            </td>
            <td>
              <span class="account-tag">
                <span class="account-dot" style="background-color: ${acc.color || '#3b82f6'}"></span>
                ${acc.name}
              </span>
            </td>
            <td>${this.formatDate(tx.date)}</td>
            <td>
              <span class="badge-status ${tx.status}" data-action="toggle-status" data-id="${tx.id}">
                <i data-lucide="${tx.status === 'paid' ? 'check' : 'clock'}"></i>
                ${tx.status === 'paid' ? 'Pago' : 'Pendente'}
              </span>
            </td>
            <td class="text-right">
              <span class="tx-amount ${isExpense ? 'expense' : (isTransfer ? 'transfer' : 'income')}">
                ${isExpense ? '- ' : '+ '}${this.formatCurrency(tx.amount)}
              </span>
            </td>
          </tr>
        `;
      }).join('');
    }

    // 4. Alertas de Orçamentos e Metas
    const alertsContainer = document.getElementById('dashboardBudgetAlertsContainer');
    const budgetsUsage = Budgets.getBudgetsWithUsage(year, month);
    const goalsProgress = Goals.getGoalsWithProgress();

    let alertsHtml = '';

    if (budgetsUsage.length > 0) {
      alertsHtml += '<h4 style="font-size: 0.85rem; font-weight: 700; margin-bottom: 0.75rem; color: var(--text-primary)">Orçamentos em Acompanhamento</h4>';
      alertsHtml += budgetsUsage.slice(0, 3).map((b, idx) => `
        <div class="budget-item stagger-item" style="--item-index: ${idx}; padding: 0.5rem 0;">
          <div class="budget-item-header">
            <span class="budget-category-label">
              <span class="legend-color-dot" style="background-color: ${b.categoryColor}"></span>
              ${b.categoryName}
            </span>
            <span class="budget-amounts ${b.status === 'danger' ? 'text-danger' : ''}">
              ${this.formatCurrency(b.spent)} / ${this.formatCurrency(b.monthlyLimit)}
            </span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill progress-${b.status}" data-progress-width="${Math.min(100, b.percentage)}%"></div>
          </div>
        </div>
      `).join('');
    }

    if (goalsProgress.length > 0) {
      alertsHtml += '<h4 style="font-size: 0.85rem; font-weight: 700; margin-top: 1rem; margin-bottom: 0.75rem; color: var(--text-primary)">Metas de Economia</h4>';
      alertsHtml += goalsProgress.slice(0, 2).map((g, idx) => `
        <div class="budget-item stagger-item" style="--item-index: ${idx + 2}; padding: 0.5rem 0;">
          <div class="budget-item-header">
            <span style="font-size: 0.85rem; font-weight: 600;">${g.title}</span>
            <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-success)">${g.percentage.toFixed(0)}%</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill progress-normal" data-progress-width="${g.percentage}%" style="background-color: ${g.color || '#10b981'}"></div>
          </div>
        </div>
      `).join('');
    }

    if (!alertsHtml) {
      alertsHtml = '<p class="text-muted text-center" style="padding: 1.5rem;">Nenhum orçamento ou meta cadastrado ainda.</p>';
    }

    alertsContainer.innerHTML = alertsHtml;

    // Dispara animação de expansão das barras de progresso
    requestAnimationFrame(() => {
      document.querySelectorAll('[data-progress-width]').forEach(el => {
        el.style.width = el.getAttribute('data-progress-width');
      });
    });

    this.refreshIcons();
  },

  // Renderização da Aba de Transações com Filtros e Stagger
  renderTransactions(year, month, filters = {}) {
    const allPeriod = Transactions.getByPeriod(year, month);
    const categories = Storage.getCategories();
    const catMap = new Map(categories.map(c => [c.id, c]));
    const accounts = Storage.getAccounts();
    const accMap = new Map(accounts.map(a => [a.id, a]));

    let filtered = allPeriod;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.notes && t.notes.toLowerCase().includes(q)) ||
        (t.amount && t.amount.toString().includes(q))
      );
    }

    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    if (filters.categoryId && filters.categoryId !== 'all') {
      filtered = filtered.filter(t => t.categoryId === filters.categoryId);
    }

    if (filters.accountId && filters.accountId !== 'all') {
      filtered = filtered.filter(t => t.accountId === filters.accountId);
    }

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    document.getElementById('navTransactionsCount').textContent = allPeriod.length;

    const tbody = document.getElementById('transactionsTableBody');
    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-muted" style="padding: 3rem;">
            Nenhuma transação encontrada com os filtros selecionados.
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = filtered.map((tx, idx) => {
        const cat = catMap.get(tx.categoryId) || { name: 'Geral', color: '#94a3b8', icon: 'tag' };
        const acc = accMap.get(tx.accountId) || { name: 'Conta', color: '#3b82f6' };
        const isExpense = tx.type === 'expense';

        return `
          <tr class="stagger-item" style="--item-index: ${idx}">
            <td>
              <span class="badge-status ${tx.status}" data-action="toggle-status" data-id="${tx.id}" title="Clique para alternar status">
                <i data-lucide="${tx.status === 'paid' ? 'check-circle' : 'clock'}"></i>
                ${tx.status === 'paid' ? 'Pago' : 'Pendente'}
              </span>
            </td>
            <td>
              <div class="tx-desc-cell">
                <div class="tx-icon-pill" style="background-color: ${cat.color}20; color: ${cat.color}">
                  <i data-lucide="${cat.icon || 'tag'}"></i>
                </div>
                <div class="tx-title-group">
                  <span class="tx-title">${tx.description}</span>
                  ${tx.notes ? `<span class="tx-meta">${tx.notes}</span>` : ''}
                </div>
              </div>
            </td>
            <td>
              <span class="badge-category">${cat.name}</span>
            </td>
            <td>
              <span class="account-tag">
                <span class="account-dot" style="background-color: ${acc.color || '#3b82f6'}"></span>
                ${acc.name}
              </span>
            </td>
            <td>${this.formatDate(tx.date)}</td>
            <td class="text-right">
              <span class="tx-amount ${isExpense ? 'expense' : 'income'}">
                ${isExpense ? '- ' : '+ '}${this.formatCurrency(tx.amount)}
              </span>
            </td>
            <td class="text-center">
              <button class="btn-icon btn-sm" data-action="edit-tx" data-id="${tx.id}" title="Editar">
                <i data-lucide="edit-3"></i>
              </button>
              <button class="btn-icon btn-sm text-danger" data-action="delete-tx" data-id="${tx.id}" title="Excluir">
                <i data-lucide="trash-2"></i>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }

    let sumIncome = 0;
    let sumExpense = 0;
    filtered.forEach(t => {
      if (t.type === 'income') sumIncome += t.amount;
      if (t.type === 'expense') sumExpense += t.amount;
    });

    document.getElementById('txTableCounter').textContent = `Exibindo ${filtered.length} de ${allPeriod.length} transações`;
    document.getElementById('txTableTotals').innerHTML = `
      <span>Receitas: <strong class="text-success">${this.formatCurrency(sumIncome)}</strong></span>
      <span>Despesas: <strong class="text-danger">${this.formatCurrency(sumExpense)}</strong></span>
      <span>Líquido: <strong>${this.formatCurrency(sumIncome - sumExpense)}</strong></span>
    `;

    this.refreshIcons();
  },

  // Renderização da Aba de Contas com Transição Escalonada
  renderAccounts() {
    const accounts = Accounts.getAccountsWithBalances();
    const container = document.getElementById('accountsGrid');

    const typeNames = {
      checking: 'Conta Corrente',
      savings: 'Poupança / Reserva',
      credit: 'Cartão de Crédito',
      cash: 'Dinheiro Físico',
      investment: 'Investimentos'
    };

    if (accounts.length === 0) {
      container.innerHTML = '<p class="text-muted text-center full-width" style="padding: 2rem;">Nenhuma conta cadastrada.</p>';
      return;
    }

    container.innerHTML = accounts.map((acc, idx) => {
      const isCredit = acc.type === 'credit';
      return `
        <div class="account-card stagger-item" style="--item-index: ${idx}">
          <div class="account-card-accent" style="background-color: ${acc.color || '#3b82f6'}"></div>
          <div class="account-card-header">
            <span class="account-card-name">
              <i data-lucide="${isCredit ? 'credit-card' : 'landmark'}" style="color: ${acc.color || '#3b82f6'}"></i>
              ${acc.name}
            </span>
            <span class="account-type-badge">${typeNames[acc.type] || acc.type}</span>
          </div>

          <div class="account-card-balance-block">
            <span class="account-balance-label">${isCredit ? 'Fatura Aberta' : 'Saldo Atual'}</span>
            <div class="account-balance-val ${isCredit ? 'text-danger' : ''}">
              ${this.formatCurrency(isCredit ? acc.cardUsedLimit : acc.currentBalance)}
            </div>
            ${isCredit ? `
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
                Limite disponível: <strong style="color: var(--color-success)">${this.formatCurrency(acc.availableLimit)}</strong> de ${this.formatCurrency(acc.limit)}
              </div>
            ` : ''}
          </div>

          <div class="account-card-footer">
            <span>${isCredit ? `Fecha dia ${acc.closingDay} | Vence dia ${acc.dueDay}` : 'Conta Ativa'}</span>
            <div style="display: flex; gap: 4px;">
              <button class="btn-icon btn-sm" data-action="edit-account" data-id="${acc.id}" title="Editar conta">
                <i data-lucide="edit-2"></i>
              </button>
              <button class="btn-icon btn-sm text-danger" data-action="delete-account" data-id="${acc.id}" title="Excluir conta">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    this.refreshIcons();
  },

  // Renderização da Aba de Orçamentos e Metas com Animações
  renderBudgetsAndGoals(year, month) {
    const budgetsUsage = Budgets.getBudgetsWithUsage(year, month);
    const budgetsContainer = document.getElementById('budgetsListContainer');

    if (budgetsUsage.length === 0) {
      budgetsContainer.innerHTML = '<p class="text-muted text-center" style="padding: 2rem;">Nenhum teto de gastos configurado para as categorias.</p>';
    } else {
      budgetsContainer.innerHTML = budgetsUsage.map((b, idx) => `
        <div class="budget-item stagger-item" style="--item-index: ${idx}">
          <div class="budget-item-header">
            <span class="budget-category-label">
              <span class="legend-color-dot" style="background-color: ${b.categoryColor}"></span>
              ${b.categoryName}
            </span>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span class="budget-amounts ${b.status === 'danger' ? 'text-danger' : ''}">
                Gasto: <strong>${this.formatCurrency(b.spent)}</strong> / Teto: <strong>${this.formatCurrency(b.monthlyLimit)}</strong>
              </span>
              <button class="btn-icon btn-sm" data-action="edit-budget" data-id="${b.id}" title="Editar orçamento">
                <i data-lucide="edit-2"></i>
              </button>
              <button class="btn-icon btn-sm text-danger" data-action="delete-budget" data-id="${b.id}" title="Excluir orçamento">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill progress-${b.status}" data-progress-width="${Math.min(100, b.percentage)}%"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted);">
            <span>${b.percentage.toFixed(1)}% utilizado</span>
            <span>${b.remaining >= 0 ? `Restam ${this.formatCurrency(b.remaining)}` : `Estourou em ${this.formatCurrency(Math.abs(b.remaining))}`}</span>
          </div>
        </div>
      `).join('');
    }

    const goalsProgress = Goals.getGoalsWithProgress();
    const goalsContainer = document.getElementById('goalsListContainer');

    if (goalsProgress.length === 0) {
      goalsContainer.innerHTML = '<p class="text-muted text-center" style="padding: 2rem;">Nenhuma meta financeira cadastrada.</p>';
    } else {
      goalsContainer.innerHTML = `
        <div class="goals-grid">
          ${goalsProgress.map((g, idx) => `
            <div class="goal-card stagger-item" style="--item-index: ${idx}">
              <div class="goal-header">
                <span class="goal-title">${g.title}</span>
                <span class="goal-percent-badge">${g.percentage.toFixed(0)}%</span>
              </div>
              
              <div class="progress-bar-container">
                <div class="progress-bar-fill" data-progress-width="${g.percentage}%" style="background-color: ${g.color || '#10b981'}"></div>
              </div>

              <div class="goal-details-row">
                <span>Poupado: <strong>${this.formatCurrency(g.currentAmount)}</strong></span>
                <span>Alvo: <strong>${this.formatCurrency(g.targetAmount)}</strong></span>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                <span style="font-size: 0.75rem; color: var(--text-muted);">
                  ${g.deadline ? `Prazo: ${this.formatDate(g.deadline)}` : 'Sem prazo'}
                </span>
                <div style="display: flex; gap: 0.35rem;">
                  <button class="btn btn-secondary btn-sm" data-action="deposit-goal" data-id="${g.id}">
                    <i data-lucide="plus"></i> Aporte
                  </button>
                  <button class="btn-icon btn-sm" data-action="edit-goal" data-id="${g.id}" title="Editar meta">
                    <i data-lucide="edit-2"></i>
                  </button>
                  <button class="btn-icon btn-sm text-danger" data-action="delete-goal" data-id="${g.id}" title="Excluir meta">
                    <i data-lucide="trash-2"></i>
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    // Expande barras de progresso suavemente
    requestAnimationFrame(() => {
      document.querySelectorAll('[data-progress-width]').forEach(el => {
        el.style.width = el.getAttribute('data-progress-width');
      });
    });

    this.refreshIcons();
  },

  // Renderização da Aba de Relatórios
  renderReports(year, month) {
    const all = Transactions.getAll();
    const periodExpenses = Transactions.getExpenseByCategory(year, month);
    const monthsFlow = Transactions.getSixMonthsFlow(year, month);

    const avgIncome = monthsFlow.reduce((s, m) => s + m.income, 0) / (monthsFlow.length || 1);
    const avgExpense = monthsFlow.reduce((s, m) => s + m.expense, 0) / (monthsFlow.length || 1);
    const yearSavings = all.filter(t => t.date.startsWith(`${year}-`)).reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);

    const maxExpenseTx = Transactions.getByPeriod(year, month)
      .filter(t => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)[0];

    this.animateNumber('reportAvgIncome', avgIncome);
    this.animateNumber('reportAvgExpense', avgExpense);
    this.animateNumber('reportYearSavings', yearSavings);
    document.getElementById('reportMaxExpense').textContent = maxExpenseTx ? `${maxExpenseTx.description} (${this.formatCurrency(maxExpenseTx.amount)})` : 'R$ 0,00';

    const tbody = document.getElementById('reportCategoryRankingBody');
    const periodTx = Transactions.getByPeriod(year, month).filter(t => t.type === 'expense');

    if (periodExpenses.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted" style="padding: 2rem;">Nenhuma despesa para exibir no período.</td></tr>';
    } else {
      tbody.innerHTML = periodExpenses.map((cat, idx) => {
        const count = periodTx.filter(t => t.categoryId === cat.categoryId).length;
        return `
          <tr class="stagger-item" style="--item-index: ${idx}">
            <td>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span class="legend-color-dot" style="background-color: ${cat.color}"></span>
                <strong>${cat.name}</strong>
              </div>
            </td>
            <td>${count} lançamento(s)</td>
            <td><strong>${cat.percentage.toFixed(1)}%</strong></td>
            <td class="text-right"><strong class="text-danger">${this.formatCurrency(cat.amount)}</strong></td>
          </tr>
        `;
      }).join('');
    }

    this.refreshIcons();
  },

  // Popula selects de categorias e contas
  populateSelects() {
    const categories = Storage.getCategories();
    const accounts = Storage.getAccounts();

    const txCatSelect = document.getElementById('txCategory');
    if (txCatSelect) {
      txCatSelect.innerHTML = categories.map(c => `
        <option value="${c.id}">${c.type === 'income' ? '🟢' : '🔴'} ${c.name}</option>
      `).join('');
    }

    const filterCatSelect = document.getElementById('txFilterCategory');
    if (filterCatSelect) {
      filterCatSelect.innerHTML = '<option value="all">Todas as Categorias</option>' + categories.map(c => `
        <option value="${c.id}">${c.name}</option>
      `).join('');
    }

    const budgetCatSelect = document.getElementById('budgetCategory');
    if (budgetCatSelect) {
      const expenseCategories = categories.filter(c => c.type === 'expense');
      budgetCatSelect.innerHTML = expenseCategories.map(c => `
        <option value="${c.id}">${c.name}</option>
      `).join('');
    }

    const txAccSelect = document.getElementById('txAccount');
    if (txAccSelect) {
      txAccSelect.innerHTML = accounts.map(a => `
        <option value="${a.id}">${a.type === 'credit' ? '💳' : '🏦'} ${a.name}</option>
      `).join('');
    }

    const filterAccSelect = document.getElementById('txFilterAccount');
    if (filterAccSelect) {
      filterAccSelect.innerHTML = '<option value="all">Todas as Contas</option>' + accounts.map(a => `
        <option value="${a.id}">${a.name}</option>
      `).join('');
    }

    const transfFrom = document.getElementById('transferFrom');
    const transfTo = document.getElementById('transferTo');
    if (transfFrom && transfTo) {
      const bankAccounts = accounts.filter(a => a.type !== 'credit');
      const optionsHtml = bankAccounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
      transfFrom.innerHTML = optionsHtml;
      transfTo.innerHTML = optionsHtml;
      if (bankAccounts.length > 1) {
        transfTo.selectedIndex = 1;
      }
    }
  },

  // Notificação Toast com Animação de Entrada e Saída
  showToast(message, type = 'info') {
    try {
      const container = document.getElementById('toastContainer');
      if (!container) return;

      const safeType = (type === 'danger') ? 'error' : type;
      const toast = document.createElement('div');
      toast.className = `toast toast-${safeType}`;
      
      let iconName = 'info';
      if (safeType === 'success') iconName = 'check-circle';
      if (safeType === 'error') iconName = 'alert-triangle';
      if (safeType === 'warning') iconName = 'alert-circle';

      toast.innerHTML = `
        <i data-lucide="${iconName}"></i>
        <span>${message || 'Aviso do sistema'}</span>
      `;

      container.appendChild(toast);
      this.refreshIcons();

      setTimeout(() => {
        toast.classList.add('closing');
        setTimeout(() => toast.remove(), 250);
      }, 3500);
    } catch (err) {
      console.warn('[UI] Falha ao exibir Toast:', err);
    }
  },

  // ==========================================================================
  // Métodos de UI de Autenticação & Perfil
  // ==========================================================================

  // Extrai iniciais do nome do usuário (Ex: "Maria Silva" -> "MS")
  getUserInitials(name) {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  },

  // Atualiza todo o estado visual do usuário logado na Sidebar, Header e Dropdown
  updateUserProfileUI(user) {
    if (!user) return;

    const initials = this.getUserInitials(user.name);
    const color = user.avatarColor || '#2563eb';

    // 1. Sidebar Footer
    const sidebarAvatar = document.getElementById('sidebarUserAvatar');
    const sidebarInitials = document.getElementById('sidebarUserInitials');
    const sidebarName = document.getElementById('sidebarUserName');
    const sidebarStatus = document.getElementById('sidebarUserStatus');

    if (sidebarAvatar) sidebarAvatar.style.backgroundColor = color;
    if (sidebarInitials) sidebarInitials.textContent = initials;
    if (sidebarName) sidebarName.textContent = user.name;
    if (sidebarStatus) {
      sidebarStatus.textContent = user.emailVerified ? 'E-mail Verificado' : 'E-mail Não Verificado';
      sidebarStatus.className = `user-summary-status ${user.emailVerified ? 'text-success' : 'text-warning'}`;
    }

    // 2. Top Header Profile Trigger
    const headerAvatar = document.getElementById('headerUserAvatar');
    const headerInitials = document.getElementById('headerUserInitials');
    const headerName = document.getElementById('headerUserName');
    const headerBadge = document.getElementById('headerUserBadge');

    if (headerAvatar) headerAvatar.style.backgroundColor = color;
    if (headerInitials) headerInitials.textContent = initials;
    if (headerName) headerName.textContent = user.name;
    if (headerBadge) {
      if (user.emailVerified) {
        headerBadge.className = 'header-user-badge verified';
        headerBadge.innerHTML = '<i data-lucide="check"></i> Verificado';
      } else {
        headerBadge.className = 'header-user-badge unverified';
        headerBadge.innerHTML = '<i data-lucide="alert-circle"></i> Pendente';
      }
    }

    // 3. Dropdown Menu Info
    const dropdownName = document.getElementById('dropdownUserName');
    const dropdownEmail = document.getElementById('dropdownUserEmail');
    const dropdownStatus = document.getElementById('dropdownEmailStatus');
    const btnDropdownVerify = document.getElementById('btnDropdownVerifyEmail');

    if (dropdownName) dropdownName.textContent = user.name;
    if (dropdownEmail) dropdownEmail.textContent = user.email;
    if (dropdownStatus) {
      dropdownStatus.className = `badge-status-inline ${user.emailVerified ? '' : 'warning'}`;
      dropdownStatus.innerHTML = user.emailVerified
        ? '<i data-lucide="check"></i> E-mail Confirmado'
        : '<i data-lucide="alert-circle"></i> E-mail Não Verificado';
    }
    if (btnDropdownVerify) {
      btnDropdownVerify.style.display = user.emailVerified ? 'none' : 'flex';
    }

    // 4. Banner de alerta no topo
    this.renderEmailVerificationBanner(user);
    this.refreshIcons();
  },

  // Exibe ou oculta banner de aviso de e-mail pendente
  renderEmailVerificationBanner(user) {
    const banner = document.getElementById('emailVerificationBanner');
    if (!banner) return;
    if (user && !user.emailVerified) {
      banner.style.display = 'flex';
    } else {
      banner.style.display = 'none';
    }
  },

  // Exibe modal de autenticação (Overlay)
  showAuthModal(initialTab = 'login') {
    const overlay = document.getElementById('authOverlay');
    if (overlay) overlay.classList.add('active');
    this.switchAuthTab(initialTab);
    this.refreshIcons();
  },

  // Oculta modal de autenticação
  hideAuthModal() {
    const overlay = document.getElementById('authOverlay');
    if (overlay) overlay.classList.remove('active');
  },

  // Alterna entre abas e telas do fluxo de autenticação
  switchAuthTab(tabName) {
    // Abas de topo
    const tabLogin = document.getElementById('tabBtnLogin');
    const tabReg = document.getElementById('tabBtnRegister');
    const authTabs = document.getElementById('authTabs');

    if (tabName === 'login') {
      if (tabLogin) tabLogin.classList.add('active');
      if (tabReg) tabReg.classList.remove('active');
      if (authTabs) authTabs.style.display = 'grid';
    } else if (tabName === 'register') {
      if (tabLogin) tabLogin.classList.remove('active');
      if (tabReg) tabReg.classList.add('active');
      if (authTabs) authTabs.style.display = 'grid';
    } else {
      // Telas sem abas (verificação / recuperação)
      if (authTabs) authTabs.style.display = 'none';
    }

    // Formulários
    const forms = {
      login: document.getElementById('formLogin'),
      register: document.getElementById('formRegister'),
      verify: document.getElementById('formVerifyEmail'),
      recover: document.getElementById('formRecoverPassword')
    };

    Object.keys(forms).forEach(k => {
      if (forms[k]) forms[k].classList.toggle('active', k === tabName);
    });

    this.refreshIcons();
  },

  // Exibe mensagens de alerta nos formulários de autenticação
  setAuthAlert(elementId, message, type = 'danger') {
    const alertEl = document.getElementById(elementId);
    if (!alertEl) return;
    alertEl.className = `auth-alert alert-${type}`;
    alertEl.innerHTML = message;
    alertEl.style.display = 'block';
  },

  clearAuthAlert(elementId) {
    const alertEl = document.getElementById(elementId);
    if (alertEl) {
      alertEl.style.display = 'none';
      alertEl.innerHTML = '';
    }
  },

  // Atualiza medidor visual de força da senha
  updatePasswordStrengthUI(strength) {
    const fill = document.getElementById('strengthBarFill');
    const badge = document.getElementById('strengthBadge');
    const hints = document.getElementById('strengthHints');

    if (fill) {
      fill.style.width = `${strength.percent}%`;
      fill.style.backgroundColor = strength.color;
    }

    if (badge) {
      badge.textContent = strength.label;
      badge.style.color = strength.color;
    }

    if (hints) {
      hints.textContent = strength.feedback.length ? strength.feedback.join(' • ') : '';
    }
  },

  // Alterna visibilidade da senha (input type password/text)
  togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (!input) return;

    if (input.type === 'password') {
      input.type = 'text';
      if (icon) icon.setAttribute('data-lucide', 'eye-off');
    } else {
      input.type = 'password';
      if (icon) icon.setAttribute('data-lucide', 'eye');
    }
    this.refreshIcons();
  },

  // Abre modal de perfil e segurança
  openProfileModal(user) {
    if (!user) return;
    const modal = document.getElementById('modalProfile');
    if (!modal) return;

    const avatar = document.getElementById('modalProfileAvatar');
    const initials = document.getElementById('modalProfileInitials');
    const inputName = document.getElementById('profileName');
    const inputEmail = document.getElementById('profileEmail');
    const colorPicker = document.getElementById('profileColor');
    const badge = document.getElementById('profileEmailBadge');
    const createdEl = document.getElementById('profileCreatedAt');
    const loginEl = document.getElementById('profileLastLogin');

    if (avatar) avatar.style.backgroundColor = user.avatarColor || '#2563eb';
    if (initials) initials.textContent = this.getUserInitials(user.name);
    if (inputName) inputName.value = user.name || '';
    if (inputEmail) inputEmail.value = user.email || '';
    if (colorPicker) colorPicker.value = user.avatarColor || '#2563eb';

    if (badge) {
      badge.innerHTML = user.emailVerified
        ? '<span class="badge-status-inline"><i data-lucide="check"></i> E-mail Confirmado</span>'
        : '<span class="badge-status-inline warning"><i data-lucide="alert-circle"></i> E-mail Não Verificado</span>';
    }

    if (createdEl) {
      createdEl.textContent = user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'Hoje';
    }
    if (loginEl) {
      loginEl.textContent = user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('pt-BR') : 'Agora';
    }

    // Reseta abas do modal para "info"
    document.querySelectorAll('.profile-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.profileTab === 'info');
    });
    document.querySelectorAll('.profile-tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === 'formProfileInfo');
    });

    this.clearAuthAlert('changePasswordAlert');
    modal.classList.add('active');
    this.refreshIcons();
  },

  // Abre modal de verificação avulso
  openStandaloneVerifyModal(user) {
    if (!user) return;
    const modal = document.getElementById('modalStandaloneVerifyEmail');
    if (!modal) return;

    const emailEl = document.getElementById('standaloneVerifyEmail');
    if (emailEl) emailEl.textContent = user.email;

    // Limpa inputs de dígito
    for (let i = 1; i <= 6; i++) {
      const d = document.getElementById(`stdDigit${i}`);
      if (d) d.value = '';
    }

    this.clearAuthAlert('stdVerifyAlert');
    modal.classList.add('active');
    this.refreshIcons();
  }
};

window.UI = UI;

