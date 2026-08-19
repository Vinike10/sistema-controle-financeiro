/**
 * Control DIN - Accounts Service (js/accounts.js)
 * Gerencia contas bancárias, cartões de crédito e transferências entre contas.
 */

const Accounts = {
  // Utilitário de parsing numérico seguro
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

  getAll() {
    try {
      return Storage.getAccounts();
    } catch (err) {
      console.warn('[Accounts] Erro ao recuperar contas:', err);
      return [];
    }
  },

  getById(id) {
    if (!id) return null;
    const all = this.getAll();
    return all.find(a => a.id === id) || null;
  },

  add(accData) {
    if (!accData || typeof accData !== 'object' || !accData.name?.trim()) {
      throw new Error('Informe um nome válido para a conta.');
    }

    const all = this.getAll();
    const safeInitial = this.parseAmount(accData.initialBalance);
    const safeLimit = this.parseAmount(accData.limit);
    const closingDay = parseInt(accData.closingDay, 10);
    const dueDay = parseInt(accData.dueDay, 10);

    const newAcc = {
      ...accData,
      id: accData.id || `acc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: accData.name.trim(),
      type: accData.type || 'checking',
      initialBalance: safeInitial,
      limit: safeLimit,
      closingDay: (!isNaN(closingDay) && closingDay >= 1 && closingDay <= 31) ? closingDay : null,
      dueDay: (!isNaN(dueDay) && dueDay >= 1 && dueDay <= 31) ? dueDay : null,
      color: accData.color || '#3b82f6',
      createdAt: new Date().toISOString()
    };

    all.push(newAcc);
    Storage.saveAccounts(all);
    return newAcc;
  },

  create(accData) {
    return this.add(accData);
  },

  update(id, updatedFields) {
    if (!id || !updatedFields) return false;
    const all = this.getAll();
    const index = all.findIndex(a => a.id === id);
    if (index === -1) return false;

    const current = all[index];
    const initialBalance = updatedFields.initialBalance !== undefined ? this.parseAmount(updatedFields.initialBalance) : current.initialBalance;
    const limit = updatedFields.limit !== undefined ? this.parseAmount(updatedFields.limit) : current.limit;
    
    let closingDay = current.closingDay;
    if (updatedFields.closingDay !== undefined) {
      const c = parseInt(updatedFields.closingDay, 10);
      closingDay = (!isNaN(c) && c >= 1 && c <= 31) ? c : null;
    }

    let dueDay = current.dueDay;
    if (updatedFields.dueDay !== undefined) {
      const d = parseInt(updatedFields.dueDay, 10);
      dueDay = (!isNaN(d) && d >= 1 && d <= 31) ? d : null;
    }

    all[index] = {
      ...current,
      ...updatedFields,
      name: updatedFields.name ? updatedFields.name.trim() : current.name,
      initialBalance,
      limit,
      closingDay,
      dueDay,
      updatedAt: new Date().toISOString()
    };

    Storage.saveAccounts(all);
    return true;
  },

  delete(id) {
    if (!id) return false;
    const all = this.getAll();
    const filtered = all.filter(a => a.id !== id);
    Storage.saveAccounts(filtered);
    return true;
  },

  // Calcula o saldo atual de cada conta levando em conta transações pagas
  getAccountsWithBalances() {
    try {
      const accounts = this.getAll();
      const allTransactions = (typeof Transactions !== 'undefined') ? Transactions.getAll() : [];

      return accounts.map(acc => {
        let currentBalance = acc.type !== 'credit' ? (Number(acc.initialBalance) || 0) : 0;
        let cardUsedLimit = 0;

        const accountTransactions = allTransactions.filter(tx => tx && tx.accountId === acc.id);

        accountTransactions.forEach(tx => {
          if (!tx || isNaN(tx.amount)) return;
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
    } catch (err) {
      console.warn('[Accounts] Erro no cálculo de saldos das contas:', err);
      return [];
    }
  },

  // Efetiva transferência entre duas contas (com assinatura posicional ou em objeto)
  transfer(fromAccountId, toAccountId, amount, date, description) {
    return this.transferFunds({ fromAccountId, toAccountId, amount, date, description });
  },

  // Efetiva transferência entre duas contas
  transferFunds({ fromAccountId, toAccountId, amount, date, description }) {
    if (!fromAccountId || !toAccountId) {
      return { success: false, message: 'Selecione a conta de origem e a conta de destino.' };
    }

    if (fromAccountId === toAccountId) {
      return { success: false, message: 'A conta de origem e destino não podem ser as mesmas.' };
    }

    const fromAcc = this.getById(fromAccountId);
    const toAcc = this.getById(toAccountId);

    if (!fromAcc || !toAcc) {
      return { success: false, message: 'Uma das contas selecionadas não foi encontrada.' };
    }

    const transferAmount = this.parseAmount(amount);
    if (transferAmount <= 0) {
      return { success: false, message: 'Informe um valor de transferência válido maior que zero.' };
    }

    const desc = description ? description.trim() : `Transferência: ${fromAcc.name} ➔ ${toAcc.name}`;
    const safeDate = (typeof Transactions !== 'undefined' && Transactions.validateDate) 
      ? Transactions.validateDate(date) 
      : (date || new Date().toISOString().slice(0, 10));
    
    const transferGroupId = `transf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    try {
      // Transação de Saída
      Transactions.add({
        id: `${transferGroupId}-out`,
        description: `[Transferência Saída] ${desc}`,
        amount: transferAmount,
        type: 'expense',
        categoryId: 'cat-outras-desp',
        accountId: fromAccountId,
        date: safeDate,
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
        date: safeDate,
        status: 'paid',
        notes: `Transferência recebida de ${fromAcc.name}`
      });

      return {
        success: true,
        message: `Transferência de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transferAmount)} realizada com sucesso!`
      };
    } catch (err) {
      return {
        success: false,
        message: `Erro ao realizar transferência: ${err.message}`
      };
    }
  }
};

window.Accounts = Accounts;
