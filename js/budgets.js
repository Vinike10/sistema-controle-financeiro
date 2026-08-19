/**
 * Control DIN - Budgets & Goals Service (js/budgets.js)
 * Gerencia limites mensais de gastos por categoria e metas de economia / objetivos.
 */

// Utilitário de parsing numérico seguro
function parseNumericValue(val) {
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
}

const Budgets = {
  // Retorna todos os orçamentos
  getAll() {
    try {
      return Storage.getBudgets();
    } catch (err) {
      console.warn('[Budgets] Erro ao recuperar orçamentos:', err);
      return [];
    }
  },

  getById(id) {
    if (!id) return null;
    return this.getAll().find(b => b.id === id) || null;
  },

  add(budgetData) {
    if (!budgetData || typeof budgetData !== 'object' || !budgetData.categoryId) {
      throw new Error('Selecione uma categoria válida para o orçamento.');
    }

    const limit = parseNumericValue(budgetData.monthlyLimit);
    if (limit <= 0) {
      throw new Error('Informe um teto de gastos mensal maior que zero.');
    }

    const all = this.getAll();
    const newBudget = {
      ...budgetData,
      id: budgetData.id || `bgt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      monthlyLimit: limit,
      createdAt: new Date().toISOString()
    };

    all.push(newBudget);
    Storage.saveBudgets(all);
    return newBudget;
  },

  create(budgetData) {
    return this.add(budgetData);
  },

  update(id, updatedFields) {
    if (!id || !updatedFields) return false;
    const all = this.getAll();
    const index = all.findIndex(b => b.id === id);
    if (index === -1) return false;

    const current = all[index];
    const newLimit = updatedFields.monthlyLimit !== undefined ? parseNumericValue(updatedFields.monthlyLimit) : current.monthlyLimit;

    all[index] = {
      ...current,
      ...updatedFields,
      monthlyLimit: newLimit > 0 ? newLimit : current.monthlyLimit,
      updatedAt: new Date().toISOString()
    };

    Storage.saveBudgets(all);
    return true;
  },

  delete(id) {
    if (!id) return false;
    const all = this.getAll();
    const filtered = all.filter(b => b.id !== id);
    Storage.saveBudgets(filtered);
    return true;
  },

  // Calcula o consumo de cada orçamento para o mês selecionado
  getBudgetsWithUsage(year, month) {
    try {
      const budgets = this.getAll();
      const categories = (typeof Storage !== 'undefined') ? Storage.getCategories() : [];
      const catMap = new Map(categories.map(c => [c.id, c]));

      const periodExpenses = (typeof Transactions !== 'undefined')
        ? Transactions.getByPeriod(year, month).filter(tx => tx && tx.type === 'expense')
        : [];

      return budgets.map(b => {
        const cat = catMap.get(b.categoryId) || { name: 'Categoria Não Encontrada', color: '#94a3b8', icon: 'tag' };
        
        const spent = periodExpenses
          .filter(tx => tx && tx.categoryId === b.categoryId && !isNaN(tx.amount))
          .reduce((sum, tx) => sum + tx.amount, 0);

        const safeLimit = Math.max(0.01, b.monthlyLimit || 0.01);
        const percentage = (spent / safeLimit) * 100;
        const remaining = b.monthlyLimit - spent;

        let status = 'normal'; // normal, warning (>80%), danger (>100%)
        if (percentage >= 100) status = 'danger';
        else if (percentage >= 80) status = 'warning';

        return {
          ...b,
          categoryName: cat.name,
          categoryColor: cat.color,
          categoryIcon: cat.icon,
          spent,
          percentage,
          remaining,
          status
        };
      });
    } catch (err) {
      console.warn('[Budgets] Erro no cálculo de orçamentos:', err);
      return [];
    }
  }
};

const Goals = {
  getAll() {
    try {
      return Storage.getGoals();
    } catch (err) {
      console.warn('[Goals] Erro ao recuperar metas:', err);
      return [];
    }
  },

  getById(id) {
    if (!id) return null;
    return this.getAll().find(g => g.id === id) || null;
  },

  add(goalData) {
    if (!goalData || typeof goalData !== 'object' || !goalData.title?.trim()) {
      throw new Error('Informe um título para a meta.');
    }

    const target = parseNumericValue(goalData.targetAmount);
    if (target <= 0) {
      throw new Error('O valor alvo da meta deve ser maior que zero.');
    }

    const current = parseNumericValue(goalData.currentAmount || 0);

    const all = this.getAll();
    const newGoal = {
      ...goalData,
      id: goalData.id || `goal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: goalData.title.trim(),
      targetAmount: target,
      currentAmount: Math.max(0, current),
      deadline: goalData.deadline || null,
      color: goalData.color || '#10b981',
      createdAt: new Date().toISOString()
    };

    all.push(newGoal);
    Storage.saveGoals(all);
    return newGoal;
  },

  create(goalData) {
    return this.add(goalData);
  },

  update(id, updatedFields) {
    if (!id || !updatedFields) return false;
    const all = this.getAll();
    const index = all.findIndex(g => g.id === id);
    if (index === -1) return false;

    const existing = all[index];
    const targetAmount = updatedFields.targetAmount !== undefined ? parseNumericValue(updatedFields.targetAmount) : existing.targetAmount;
    const currentAmount = updatedFields.currentAmount !== undefined ? parseNumericValue(updatedFields.currentAmount) : existing.currentAmount;

    all[index] = {
      ...existing,
      ...updatedFields,
      title: updatedFields.title ? updatedFields.title.trim() : existing.title,
      targetAmount: targetAmount > 0 ? targetAmount : existing.targetAmount,
      currentAmount: Math.max(0, currentAmount),
      updatedAt: new Date().toISOString()
    };

    Storage.saveGoals(all);
    return true;
  },

  delete(id) {
    if (!id) return false;
    const all = this.getAll();
    const filtered = all.filter(g => g.id !== id);
    Storage.saveGoals(filtered);
    return true;
  },

  // Registra um aporte financeiro em uma meta de economia
  deposit(goalId, amount) {
    if (!goalId) return { success: false, message: 'Meta não selecionada.' };

    const goal = this.getById(goalId);
    if (!goal) return { success: false, message: 'Meta de economia não encontrada.' };

    const depositAmount = parseNumericValue(amount);
    if (depositAmount <= 0) return { success: false, message: 'O valor do aporte deve ser maior que zero.' };

    goal.currentAmount = (Number(goal.currentAmount) || 0) + depositAmount;
    goal.updatedAt = new Date().toISOString();

    const all = this.getAll().map(g => g.id === goalId ? goal : g);
    Storage.saveGoals(all);
    
    const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(depositAmount);
    return { success: true, goal, message: `Aporte de ${formatted} registrado com sucesso!` };
  },

  // Retorna metas com percentual calculado
  getGoalsWithProgress() {
    try {
      const goals = this.getAll();
      return goals.map(g => {
        const target = Number(g.targetAmount) || 0.01;
        const current = Number(g.currentAmount) || 0;
        const percentage = target > 0 ? (current / target) * 100 : 0;
        const remaining = Math.max(0, target - current);

        return {
          ...g,
          percentage: Math.min(100, Math.max(0, percentage)),
          rawPercentage: Math.max(0, percentage),
          remaining
        };
      });
    } catch (err) {
      console.warn('[Goals] Erro no cálculo do progresso das metas:', err);
      return [];
    }
  }
};

window.Budgets = Budgets;
window.Goals = Goals;
