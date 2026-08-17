/**
 * Control DIN - Transactions Service (js/transactions.js)
 * Gerencia lógica de negócios de receitas, despesas, parcelamentos e cálculos financeiros.
 */

const Transactions = {
  // Retorna todas as transações
  getAll() {
    return Storage.getTransactions();
  },

  // Retorna transações filtradas por Ano e Mês (ex: year = 2026, month = 8)
  getByPeriod(year, month) {
    const all = this.getAll();
    const targetPrefix = `${year}-${String(month).padStart(2, '0')}`;
    return all.filter(tx => tx.date.startsWith(targetPrefix));
  },

  // Adiciona transação (com suporte a parcelamento automático em X vezes)
  add(txData, installments = 1) {
    const all = this.getAll();
    const createdTransactions = [];
    const baseAmount = Number(txData.amount);

    if (installments > 1 && txData.type === 'expense') {
      const installmentAmount = +(baseAmount / installments).toFixed(2);
      const [yearStr, monthStr, dayStr] = txData.date.split('-');
      let currentYear = parseInt(yearStr, 10);
      let currentMonth = parseInt(monthStr, 10);
      const day = parseInt(dayStr, 10);

      for (let i = 1; i <= installments; i++) {
        // Formata data da parcela
        const formattedMonth = String(currentMonth).padStart(2, '0');
        // Ajusta se o dia for maior que os dias do mês
        const maxDaysInMonth = new Date(currentYear, currentMonth, 0).getDate();
        const safeDay = String(Math.min(day, maxDaysInMonth)).padStart(2, '0');
        const installmentDate = `${currentYear}-${formattedMonth}-${safeDay}`;

        const newTx = {
          ...txData,
          id: `tx-${Date.now()}-${i}`,
          description: `${txData.description} (${i}/${installments})`,
          amount: installmentAmount,
          date: installmentDate,
          status: i === 1 ? txData.status : 'pending',
          installmentIndex: i,
          installmentTotal: installments,
          createdAt: new Date().toISOString()
        };

        createdTransactions.push(newTx);

        // Avança para o próximo mês
        currentMonth++;
        if (currentMonth > 12) {
          currentMonth = 1;
          currentYear++;
        }
      }
    } else {
      const newTx = {
        ...txData,
        id: txData.id || `tx-${Date.now()}`,
        amount: baseAmount,
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
    const all = this.getAll();
    const index = all.findIndex(t => t.id === id);
    if (index === -1) return false;

    all[index] = {
      ...all[index],
      ...updatedFields,
      amount: Number(updatedFields.amount !== undefined ? updatedFields.amount : all[index].amount),
      updatedAt: new Date().toISOString()
    };

    Storage.saveTransactions(all);
    return true;
  },

  // Exclui uma transação
  delete(id) {
    const all = this.getAll();
    const filtered = all.filter(t => t.id !== id);
    Storage.saveTransactions(filtered);
    return true;
  },

  // Alterna o status entre 'paid' e 'pending'
  toggleStatus(id) {
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
