/**
 * Control DIN - Budgets & Goals Service (js/budgets.js)
 * Gerencia limites mensais de gastos por categoria e metas de economia / objetivos.
 */

const Budgets = {
  // Retorna todos os orçamentos
  getAll() {
    return Storage.getBudgets();
  },

  add(budgetData) {
    const all = this.getAll();
    const newBudget = {
      ...budgetData,
      id: budgetData.id || `bgt-${Date.now()}`,
      monthlyLimit: Number(budgetData.monthlyLimit),
      createdAt: new Date().toISOString()
    };
    all.push(newBudget);
    Storage.saveBudgets(all);
    return newBudget;
  },

  update(id, updatedFields) {
    const all = this.getAll();
    const index = all.findIndex(b => b.id === id);
    if (index === -1) return false;

    all[index] = {
      ...all[index],
      ...updatedFields,
      monthlyLimit: Number(updatedFields.monthlyLimit || all[index].monthlyLimit),
      updatedAt: new Date().toISOString()
    };
    Storage.saveBudgets(all);
    return true;
  },

  delete(id) {
    const all = this.getAll();
    const filtered = all.filter(b => b.id !== id);
    Storage.saveBudgets(filtered);
    return true;
  },

  // Calcula o consumo de cada orçamento para o mês selecionado
  getBudgetsWithUsage(year, month) {
    const budgets = this.getAll();
    const categories = Storage.getCategories();
    const catMap = new Map(categories.map(c => [c.id, c]));

    const periodExpenses = Transactions.getByPeriod(year, month).filter(tx => tx.type === 'expense');

    return budgets.map(b => {
      const cat = catMap.get(b.categoryId) || { name: 'Categoria Desconhecida', color: '#94a3b8', icon: 'tag' };
      
      const spent = periodExpenses
        .filter(tx => tx.categoryId === b.categoryId)
        .reduce((sum, tx) => sum + tx.amount, 0);

      const percentage = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
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
  }
};

const Goals = {
  getAll() {
    return Storage.getGoals();
  },

  getById(id) {
    return this.getAll().find(g => g.id === id);
  },

  add(goalData) {
    const all = this.getAll();
    const newGoal = {
      ...goalData,
      id: goalData.id || `goal-${Date.now()}`,
      targetAmount: Number(goalData.targetAmount),
      currentAmount: Number(goalData.currentAmount || 0),
      createdAt: new Date().toISOString()
    };
    all.push(newGoal);
    Storage.saveGoals(all);
    return newGoal;
  },

  update(id, updatedFields) {
    const all = this.getAll();
    const index = all.findIndex(g => g.id === id);
    if (index === -1) return false;

    all[index] = {
      ...all[index],
      ...updatedFields,
      targetAmount: Number(updatedFields.targetAmount || all[index].targetAmount),
      currentAmount: Number(updatedFields.currentAmount !== undefined ? updatedFields.currentAmount : all[index].currentAmount),
      updatedAt: new Date().toISOString()
    };
    Storage.saveGoals(all);
    return true;
  },

  delete(id) {
    const all = this.getAll();
    const filtered = all.filter(g => g.id !== id);
    Storage.saveGoals(filtered);
    return true;
  },

  // Registra um aporte financeiro em uma meta de economia
  deposit(goalId, amount) {
    const goal = this.getById(goalId);
    if (!goal) throw new Error("Meta não encontrada.");

    const depositAmount = Number(amount);
    if (depositAmount <= 0) throw new Error("O valor do aporte deve ser maior que zero.");

    goal.currentAmount = (Number(goal.currentAmount) || 0) + depositAmount;
    goal.updatedAt = new Date().toISOString();

    const all = this.getAll().map(g => g.id === goalId ? goal : g);
    Storage.saveGoals(all);
    return goal;
  },

  // Retorna metas com percentual calculado
  getGoalsWithProgress() {
    const goals = this.getAll();
    return goals.map(g => {
      const percentage = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
      const remaining = Math.max(0, g.targetAmount - g.currentAmount);
      return {
        ...g,
        percentage: Math.min(100, percentage),
        rawPercentage: percentage,
        remaining
      };
    });
  }
};

window.Budgets = Budgets;
window.Goals = Goals;
