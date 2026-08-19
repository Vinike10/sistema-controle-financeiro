/**
 * Control DIN - Transactions Service (js/transactions.js)
 * Gerencia lógica de negócios de receitas, despesas, parcelamentos e cálculos financeiros.
 */

const Transactions = {
  // Utilitário de parsing e sanitização monetária defensiva
  parseAmount(val) {
    if (typeof val === 'number') {
      return (isNaN(val) || !isFinite(val)) ? 0 : Number(val.toFixed(2));
    }
    if (!val || typeof val !== 'string') return 0;

    let clean = val.replace(/[^\d.,\-+]/g, '').trim();
    if (clean.includes(',') && clean.includes('.')) {
      if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
        clean = clean.replace(/\./g, '').replace(',', '.');
      } else {
        clean = clean.replace(/,/g, '');
      }
    } else if (clean.includes(',')) {
      clean = clean.replace(',', '.');
    }

    const num = parseFloat(clean);
    return (isNaN(num) || !isFinite(num)) ? 0 : Number(num.toFixed(2));
  },

  // Validação e normalização de data ISO (YYYY-MM-DD)
  validateDate(dateString) {
    if (!dateString || typeof dateString !== 'string') {
      return new Date().toISOString().slice(0, 10);
    }
    const match = dateString.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return new Date().toISOString().slice(0, 10);
    }
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);

    if (month < 1 || month > 12) return new Date().toISOString().slice(0, 10);
    const maxDays = new Date(year, month, 0).getDate();
    const safeDay = Math.min(Math.max(1, day), maxDays);
    return `${year}-${String(month).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
  },

  // Gera ID único garantido contra colisões
  generateUniqueId(prefix = 'tx') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  },

  // Retorna todas as transações
  getAll() {
    try {
      return Storage.getTransactions();
    } catch (err) {
      console.warn('[Transactions] Erro ao recuperar transações:', err);
      return [];
    }
  },

  // Retorna transação por ID
  getById(id) {
    if (!id) return null;
    const all = this.getAll();
    return all.find(t => t.id === id) || null;
  },

  // Cria transação (alias)
  create(txData, installments = 1) {
    return this.add(txData, installments);
  },

  // Alias explícito para criação de compras parceladas
  createInstallments(txParams) {
    const { installments = 1, ...rest } = txParams;
    return this.add(rest, installments);
  },

  // Retorna transações filtradas por Ano e Mês (ex: year = 2026, month = 8)
  getByPeriod(year, month) {
    const all = this.getAll();
    const targetPrefix = `${year}-${String(month).padStart(2, '0')}`;
    return all.filter(tx => tx && tx.date && tx.date.startsWith(targetPrefix));
  },

  // Adiciona transação (com suporte a parcelamento automático e soma exata de centavos)
  add(txData, installments = 1) {
    if (!txData || typeof txData !== 'object') {
      throw new Error('Dados da transação inválidos.');
    }

    const all = this.getAll();
    const createdTransactions = [];
    const baseAmount = this.parseAmount(txData.amount);
    const safeDate = this.validateDate(txData.date);

    if (baseAmount <= 0) {
      throw new Error('O valor da transação deve ser maior que zero.');
    }

    const safeInstallments = Math.max(1, parseInt(installments, 10) || 1);

    if (safeInstallments > 1 && txData.type === 'expense') {
      // Cálculo preciso de centavos para garantir que a soma total seja exata
      const totalCents = Math.round(baseAmount * 100);
      const baseInstallmentCents = Math.floor(totalCents / safeInstallments);
      const remainderCents = totalCents - (baseInstallmentCents * safeInstallments);

      const [yearStr, monthStr, dayStr] = safeDate.split('-');
      let currentYear = parseInt(yearStr, 10);
      let currentMonth = parseInt(monthStr, 10);
      const day = parseInt(dayStr, 10);

      for (let i = 1; i <= safeInstallments; i++) {
        const formattedMonth = String(currentMonth).padStart(2, '0');
        const maxDaysInMonth = new Date(currentYear, currentMonth, 0).getDate();
        const safeDay = String(Math.min(day, maxDaysInMonth)).padStart(2, '0');
        const installmentDate = `${currentYear}-${formattedMonth}-${safeDay}`;

        // A primeira parcela absorve o resíduo de centavos do arredondamento
        const centsForThisInstallment = i === 1 ? (baseInstallmentCents + remainderCents) : baseInstallmentCents;
        const installmentAmount = Number((centsForThisInstallment / 100).toFixed(2));

        const newTx = {
          ...txData,
          id: this.generateUniqueId(`tx-inst-${i}`),
          description: `${txData.description || 'Despesa Parcelada'} (${i}/${safeInstallments})`,
          amount: installmentAmount,
          date: installmentDate,
          status: i === 1 ? (txData.status || 'paid') : 'pending',
          installmentIndex: i,
          installmentTotal: safeInstallments,
          createdAt: new Date().toISOString()
        };

        createdTransactions.push(newTx);

        // Avança para o próximo mês com ajuste de ano
        currentMonth++;
        if (currentMonth > 12) {
          currentMonth = 1;
          currentYear++;
        }
      }
    } else {
      const newTx = {
        ...txData,
        id: txData.id || this.generateUniqueId('tx'),
        amount: baseAmount,
        date: safeDate,
        description: txData.description ? txData.description.trim() : 'Sem descrição',
        status: txData.status === 'pending' ? 'pending' : 'paid',
        createdAt: new Date().toISOString()
      };
      createdTransactions.push(newTx);
    }

    const updated = [...createdTransactions, ...all];
    Storage.saveTransactions(updated);
    return createdTransactions;
  },

  // Atualiza uma transação existente
  update(id, updatedFields) {
    if (!id || !updatedFields) return false;
    const all = this.getAll();
    const index = all.findIndex(t => t.id === id);
    if (index === -1) return false;

    const current = all[index];
    const newAmount = updatedFields.amount !== undefined ? this.parseAmount(updatedFields.amount) : current.amount;
    const newDate = updatedFields.date !== undefined ? this.validateDate(updatedFields.date) : current.date;

    all[index] = {
      ...current,
      ...updatedFields,
      amount: newAmount,
      date: newDate,
      updatedAt: new Date().toISOString()
    };

    Storage.saveTransactions(all);
    return true;
  },

  // Exclui uma transação
  delete(id) {
    if (!id) return false;
    const all = this.getAll();
    const filtered = all.filter(t => t.id !== id);
    Storage.saveTransactions(filtered);
    return true;
  },

  // Alterna o status entre 'paid' e 'pending'
  toggleStatus(id) {
    if (!id) return false;
    const all = this.getAll();
    const item = all.find(t => t.id === id);
    if (!item) return false;

    item.status = item.status === 'paid' ? 'pending' : 'paid';
    item.updatedAt = new Date().toISOString();
    Storage.saveTransactions(all);
    return item.status;
  },

  // Calcula os indicadores chave para o período selecionado
  calculateMetrics(year, month) {
    const periodTransactions = this.getByPeriod(year, month);

    let totalIncome = 0;
    let paidIncome = 0;
    let totalExpense = 0;
    let paidExpense = 0;

    periodTransactions.forEach(tx => {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
        if (tx.status === 'paid') paidIncome += tx.amount;
      } else if (tx.type === 'expense') {
        totalExpense += tx.amount;
        if (tx.status === 'paid') paidExpense += tx.amount;
      }
    });

    const netBalance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    // Calcula saldo total acumulado de todas as contas no sistema
    const allTransactions = this.getAll();
    const accounts = Storage.getAccounts();

    let consolidatedBalance = accounts.reduce((acc, a) => {
      // Se não for cartão de crédito, inclui saldo inicial
      if (a.type !== 'credit') {
        return acc + (Number(a.initialBalance) || 0);
      }
      return acc;
    }, 0);

    allTransactions.forEach(tx => {
      if (tx.status === 'paid') {
        if (tx.type === 'income') {
          consolidatedBalance += tx.amount;
        } else if (tx.type === 'expense') {
          consolidatedBalance -= tx.amount;
        }
      }
    });

    return {
      totalIncome,
      paidIncome,
      totalExpense,
      paidExpense,
      netBalance,
      savingsRate: Math.max(0, savingsRate),
      consolidatedBalance,
      count: periodTransactions.length
    };
  },

  // Retorna distribuição de gastos por categoria para um período
  getExpenseByCategory(year, month) {
    const periodTransactions = this.getByPeriod(year, month);
    const categories = Storage.getCategories();
    const catMap = new Map(categories.map(c => [c.id, c]));

    const expenseMap = {};
    let totalExpenses = 0;

    periodTransactions.forEach(tx => {
      if (tx.type === 'expense') {
        totalExpenses += tx.amount;
        expenseMap[tx.categoryId] = (expenseMap[tx.categoryId] || 0) + tx.amount;
      }
    });

    const result = Object.keys(expenseMap).map(catId => {
      const cat = catMap.get(catId) || { name: 'Outras', color: '#94a3b8' };
      const amount = expenseMap[catId];
      const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
      return {
        categoryId: catId,
        name: cat.name,
        color: cat.color,
        amount,
        percentage
      };
    });

    return result.sort((a, b) => b.amount - a.amount);
  },

  // Retorna o fluxo dos últimos 6 meses até o mês selecionado
  getSixMonthsFlow(currentYear, currentMonth) {
    const monthsData = [];
    const all = this.getAll();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const prefix = `${y}-${String(m).padStart(2, '0')}`;
      
      const monthTx = all.filter(tx => tx.date.startsWith(prefix));
      let income = 0;
      let expense = 0;

      monthTx.forEach(tx => {
        if (tx.type === 'income') income += tx.amount;
        if (tx.type === 'expense') expense += tx.amount;
      });

      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      monthsData.push({
        label: `${monthNames[m - 1]}/${String(y).slice(2)}`,
        year: y,
        month: m,
        income,
        expense,
        net: income - expense
      });
    }

    return monthsData;
  }
};

window.Transactions = Transactions;
