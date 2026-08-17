/**
 * Control DIN - Accounts Service (js/accounts.js)
 * Gerencia contas bancárias, cartões de crédito e transferências entre contas.
 */

const Accounts = {
  getAll() {
    return Storage.getAccounts();
  },

  getById(id) {
    const all = this.getAll();
    return all.find(a => a.id === id);
  },

  add(accData) {
    const all = this.getAll();
    const newAcc = {
      ...accData,
      id: accData.id || `acc-${Date.now()}`,
      initialBalance: Number(accData.initialBalance) || 0,
      limit: Number(accData.limit) || 0,
      closingDay: Number(accData.closingDay) || 0,
      dueDay: Number(accData.dueDay) || 0,
      createdAt: new Date().toISOString()
    };
    all.push(newAcc);
    Storage.saveAccounts(all);
    return newAcc;
  },

  update(id, updatedFields) {
    const all = this.getAll();
    const index = all.findIndex(a => a.id === id);
    if (index === -1) return false;

    all[index] = {
      ...all[index],
      ...updatedFields,
      initialBalance: updatedFields.initialBalance !== undefined ? Number(updatedFields.initialBalance) : all[index].initialBalance,
      limit: updatedFields.limit !== undefined ? Number(updatedFields.limit) : all[index].limit,
      updatedAt: new Date().toISOString()
    };

    Storage.saveAccounts(all);
    return true;
  },

  delete(id) {
    const all = this.getAll();
    const filtered = all.filter(a => a.id !== id);
    Storage.saveAccounts(filtered);
    return true;
  },

  // Calcula o saldo atual de cada conta levando em conta transações pagas
  getAccountsWithBalances() {
    const accounts = this.getAll();
    const allTransactions = Transactions.getAll();

    return accounts.map(acc => {
      let currentBalance = acc.type !== 'credit' ? (Number(acc.initialBalance) || 0) : 0;
      let cardUsedLimit = 0;

      const accountTransactions = allTransactions.filter(tx => tx.accountId === acc.id);

      accountTransactions.forEach(tx => {
        if (acc.type === 'credit') {
          // No cartão de crédito, somamos as despesas da fatura aberta
          if (tx.type === 'expense' && tx.status === 'paid') {
            cardUsedLimit += tx.amount;
          }
        } else {
          // Em contas bancárias e carteira
          if (tx.status === 'paid') {
            if (tx.type === 'income') {
              currentBalance += tx.amount;
            } else if (tx.type === 'expense') {
              currentBalance -= tx.amount;
            }
          }
        }
      });

      return {
        ...acc,
        currentBalance,
        cardUsedLimit,
        availableLimit: acc.type === 'credit' ? Math.max(0, (acc.limit || 0) - cardUsedLimit) : null
      };
    });
  },

  // Efetiva transferência entre duas contas
  transferFunds({ fromAccountId, toAccountId, amount, date, description }) {
    if (fromAccountId === toAccountId) {
      throw new Error("A conta de origem e destino devem ser diferentes.");
    }

    const fromAcc = this.getById(fromAccountId);
    const toAcc = this.getById(toAccountId);

    if (!fromAcc || !toAcc) {
      throw new Error("Conta não encontrada.");
    }

    const transferAmount = Number(amount);
    const desc = description || `Transferência: ${fromAcc.name} ➔ ${toAcc.name}`;
    const transferGroupId = `transf-${Date.now()}`;

    // Transação de Saída
    Transactions.add({
      id: `${transferGroupId}-out`,
      description: `[Transferência Saída] ${desc}`,
      amount: transferAmount,
      type: 'expense',
      categoryId: 'cat-outras-desp',
      accountId: fromAccountId,
      date: date || new Date().toISOString().slice(0, 10),
      status: 'paid',
      notes: `Transferência enviada para ${toAcc.name}`
    });

    // Transação de Entrada
    Transactions.add({
      id: `${transferGroupId}-in`,
      description: `[Transferência Entrada] ${desc}`,
      amount: transferAmount,
      type: 'income',
      categoryId: 'cat-outras-rec',
      accountId: toAccountId,
      date: date || new Date().toISOString().slice(0, 10),
      status: 'paid',
      notes: `Transferência recebida de ${fromAcc.name}`
    });

    return true;
  }
};

window.Accounts = Accounts;
