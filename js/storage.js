/**
 * Control DIN - Storage Service (js/storage.js)
 * Gerencia persistência local no localStorage com particionamento multi-tenant por usuário (userId),
 * migração automática, schema versionado, backup JSON e exportação CSV.
 */

const LEGACY_STORAGE_KEYS = {
  TRANSACTIONS: 'fintrack_transactions_v1',
  ACCOUNTS: 'fintrack_accounts_v1',
  CATEGORIES: 'fintrack_categories_v1',
  BUDGETS: 'fintrack_budgets_v1',
  GOALS: 'fintrack_goals_v1',
  SETTINGS: 'fintrack_settings_v1'
};

const GLOBAL_STORAGE_KEYS = {
  TRANSACTIONS: 'controldin_transactions_v1',
  ACCOUNTS: 'controldin_accounts_v1',
  CATEGORIES: 'controldin_categories_v1',
  BUDGETS: 'controldin_budgets_v1',
  GOALS: 'controldin_goals_v1',
  SETTINGS: 'controldin_settings_v1'
};

// Categorias Padrão
const DEFAULT_CATEGORIES = [
  { id: 'cat-salario', name: 'Salário & Proventos', type: 'income', color: '#10b981', icon: 'banknote' },
  { id: 'cat-freelance', name: 'Freelance & Serviços', type: 'income', color: '#3b82f6', icon: 'laptop' },
  { id: 'cat-rendimentos', name: 'Investimentos & Rendimentos', type: 'income', color: '#8b5cf6', icon: 'trending-up' },
  { id: 'cat-outras-rec', name: 'Outras Receitas', type: 'income', color: '#06b6d4', icon: 'plus-circle' },

  { id: 'cat-alimentacao', name: 'Alimentação & Mercado', type: 'expense', color: '#ef4444', icon: 'shopping-cart' },
  { id: 'cat-moradia', name: 'Moradia & Contas', type: 'expense', color: '#f97316', icon: 'home' },
  { id: 'cat-transporte', name: 'Transporte & Combustível', type: 'expense', color: '#f59e0b', icon: 'car' },
  { id: 'cat-saude', name: 'Saúde & Cuidados', type: 'expense', color: '#ec4899', icon: 'heart-pulse' },
  { id: 'cat-lazer', name: 'Lazer & Viagens', type: 'expense', color: '#8b5cf6', icon: 'film' },
  { id: 'cat-educacao', name: 'Educação & Cursos', type: 'expense', color: '#3b82f6', icon: 'graduation-cap' },
  { id: 'cat-compras', name: 'Compras & Vestuário', type: 'expense', color: '#6366f1', icon: 'shopping-bag' },
  { id: 'cat-outras-desp', name: 'Outras Despesas', type: 'expense', color: '#64748b', icon: 'more-horizontal' }
];

// Contas Padrão
const DEFAULT_ACCOUNTS = [
  { id: 'acc-nubank', name: 'Nubank (Conta Corrente)', type: 'checking', initialBalance: 2450.00, color: '#8b5cf6' },
  { id: 'acc-itau', name: 'Itaú (Investimentos/Poupança)', type: 'savings', initialBalance: 12800.00, color: '#f97316' },
  { id: 'acc-cartao-master', name: 'Cartão de Crédito Black', type: 'credit', initialBalance: 0, color: '#1e293b', closingDay: 25, dueDay: 5, limit: 15000.00 },
  { id: 'acc-carteira', name: 'Dinheiro em Carteira', type: 'cash', initialBalance: 320.00, color: '#10b981' }
];

// Orçamentos Padrão
const DEFAULT_BUDGETS = [
  { id: 'bgt-1', categoryId: 'cat-alimentacao', monthlyLimit: 1600.00 },
  { id: 'bgt-2', categoryId: 'cat-transporte', monthlyLimit: 600.00 },
  { id: 'bgt-3', categoryId: 'cat-lazer', monthlyLimit: 500.00 },
  { id: 'bgt-4', categoryId: 'cat-moradia', monthlyLimit: 2200.00 }
];

// Metas Padrão
const DEFAULT_GOALS = [
  { id: 'goal-1', title: 'Reserva de Emergência (6 Meses)', targetAmount: 30000.00, currentAmount: 18500.00, deadline: '2026-12-31', color: '#10b981' },
  { id: 'goal-2', title: 'Viagem de Férias', targetAmount: 8000.00, currentAmount: 4200.00, deadline: '2026-11-15', color: '#3b82f6' }
];

const Storage = {
  // Retorna o ID do usuário atualmente logado (ou 'usr-demo' como fallback)
  getActiveUserId() {
    const user = (typeof Auth !== 'undefined') ? Auth.getCurrentUser() : null;
    return user ? user.id : 'usr-demo';
  },

  // Retorna a chave de armazenamento isolada por usuário
  getKey(type) {
    const uid = this.getActiveUserId();
    return `controldin_${uid}_${type}_v1`;
  },

  // Migra dados de versões legadas e particiona para o usuário demo
  migrateLegacyData() {
    try {
      // 1. Migração de fintrack_ -> controldin_
      Object.keys(GLOBAL_STORAGE_KEYS).forEach(k => {
        const globalKey = GLOBAL_STORAGE_KEYS[k];
        const legacyKey = LEGACY_STORAGE_KEYS[k];
        if (!localStorage.getItem(globalKey) && localStorage.getItem(legacyKey)) {
          localStorage.setItem(globalKey, localStorage.getItem(legacyKey));
        }
      });

      // 2. Se existirem dados na chave global, migra para o usuário demo 'usr-demo'
      const demoKeyTx = 'controldin_usr-demo_transactions_v1';
      if (!localStorage.getItem(demoKeyTx) && localStorage.getItem(GLOBAL_STORAGE_KEYS.TRANSACTIONS)) {
        localStorage.setItem('controldin_usr-demo_transactions_v1', localStorage.getItem(GLOBAL_STORAGE_KEYS.TRANSACTIONS));
        if (localStorage.getItem(GLOBAL_STORAGE_KEYS.ACCOUNTS)) {
          localStorage.setItem('controldin_usr-demo_accounts_v1', localStorage.getItem(GLOBAL_STORAGE_KEYS.ACCOUNTS));
        }
        if (localStorage.getItem(GLOBAL_STORAGE_KEYS.CATEGORIES)) {
          localStorage.setItem('controldin_usr-demo_categories_v1', localStorage.getItem(GLOBAL_STORAGE_KEYS.CATEGORIES));
        }
        if (localStorage.getItem(GLOBAL_STORAGE_KEYS.BUDGETS)) {
          localStorage.setItem('controldin_usr-demo_budgets_v1', localStorage.getItem(GLOBAL_STORAGE_KEYS.BUDGETS));
        }
        if (localStorage.getItem(GLOBAL_STORAGE_KEYS.GOALS)) {
          localStorage.setItem('controldin_usr-demo_goals_v1', localStorage.getItem(GLOBAL_STORAGE_KEYS.GOALS));
        }
      }
    } catch {
      // Silencioso em caso de restrição
    }
  },

  // Inicialização dos dados da base do usuário ativo
  init() {
    this.migrateLegacyData();

    const catKey = this.getKey('categories');
    const accKey = this.getKey('accounts');
    const bgtKey = this.getKey('budgets');
    const goalKey = this.getKey('goals');
    const txKey = this.getKey('transactions');

    const uid = this.getActiveUserId();

    if (!localStorage.getItem(catKey)) {
      this.saveCategories(DEFAULT_CATEGORIES);
    }

    if (!localStorage.getItem(accKey)) {
      // Se for usuário demo, carrega contas padrão com saldo inicial
      if (uid === 'usr-demo') {
        this.saveAccounts(DEFAULT_ACCOUNTS);
      } else {
        // Novo usuário real: inicializa com contas zeradas para preenchimento
        const cleanAccounts = [
          { id: `acc-${Date.now()}-1`, name: 'Conta Principal (Corrente)', type: 'checking', initialBalance: 0.00, color: '#3b82f6' },
          { id: `acc-${Date.now()}-2`, name: 'Cartão de Crédito', type: 'credit', initialBalance: 0.00, color: '#1e293b', closingDay: 25, dueDay: 5, limit: 5000.00 },
          { id: `acc-${Date.now()}-3`, name: 'Carteira Física (Dinheiro)', type: 'cash', initialBalance: 0.00, color: '#10b981' }
        ];
        this.saveAccounts(cleanAccounts);
      }
    }

    if (!localStorage.getItem(bgtKey)) {
      this.saveBudgets(uid === 'usr-demo' ? DEFAULT_BUDGETS : []);
    }

    if (!localStorage.getItem(goalKey)) {
      this.saveGoals(uid === 'usr-demo' ? DEFAULT_GOALS : []);
    }

    if (!localStorage.getItem(txKey)) {
      if (uid === 'usr-demo') {
        this.seedInitialTransactions();
      } else {
        this.saveTransactions([]);
      }
    }
  },

  // Armazenamento seguro com proteção contra QuotaExceededError e restrições
  safeSetItem(key, value) {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (err) {
      console.warn(`[Storage] Falha ao persistir chave "${key}":`, err);
      if (err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014) {
        if (typeof UI !== 'undefined' && UI.showToast) {
          UI.showToast('Espaço de armazenamento local esgotado no navegador. Exporte um backup e limpe dados antigos.', 'error');
        }
      }
      return false;
    }
  },

  // Leitura segura com tratamento contra JSON corrompido
  safeGetItem(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return defaultValue;
      return JSON.parse(raw);
    } catch (err) {
      console.warn(`[Storage] Dados corrompidos na chave "${key}", recuperando valor padrão:`, err);
      return defaultValue;
    }
  },

  // Transações
  getTransactions() {
    const raw = this.safeGetItem(this.getKey('transactions'), []);
    if (!Array.isArray(raw)) return [];
    
    // Sanitização e validação defensiva dos registros
    return raw.filter(tx => tx && typeof tx === 'object' && tx.id).map(tx => ({
      ...tx,
      amount: (typeof tx.amount === 'number' && !isNaN(tx.amount)) ? Number(tx.amount) : (parseFloat(tx.amount) || 0),
      type: (tx.type === 'income' || tx.type === 'expense' || tx.type === 'transfer') ? tx.type : 'expense',
      date: tx.date || new Date().toISOString().slice(0, 10),
      status: tx.status === 'pending' ? 'pending' : 'paid'
    }));
  },

  saveTransactions(transactions) {
    const validTransactions = Array.isArray(transactions) ? transactions : [];
    return this.safeSetItem(this.getKey('transactions'), validTransactions);
  },

  // Contas
  getAccounts() {
    const raw = this.safeGetItem(this.getKey('accounts'), []);
    if (!Array.isArray(raw)) return [];

    return raw.filter(a => a && typeof a === 'object' && a.id).map(a => ({
      ...a,
      initialBalance: (typeof a.initialBalance === 'number' && !isNaN(a.initialBalance)) ? Number(a.initialBalance) : (parseFloat(a.initialBalance) || 0),
      limit: (typeof a.limit === 'number' && !isNaN(a.limit)) ? Number(a.limit) : (parseFloat(a.limit) || 0),
      type: a.type || 'checking'
    }));
  },

  saveAccounts(accounts) {
    const validAccounts = Array.isArray(accounts) ? accounts : [];
    return this.safeSetItem(this.getKey('accounts'), validAccounts);
  },

  // Categorias
  getCategories() {
    const raw = this.safeGetItem(this.getKey('categories'), DEFAULT_CATEGORIES);
    if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_CATEGORIES;
    return raw.filter(c => c && typeof c === 'object' && c.id);
  },

  saveCategories(categories) {
    const validCategories = (Array.isArray(categories) && categories.length > 0) ? categories : DEFAULT_CATEGORIES;
    return this.safeSetItem(this.getKey('categories'), validCategories);
  },

  // Orçamentos
  getBudgets() {
    const raw = this.safeGetItem(this.getKey('budgets'), []);
    if (!Array.isArray(raw)) return [];

    return raw.filter(b => b && typeof b === 'object' && b.id).map(b => ({
      ...b,
      monthlyLimit: (typeof b.monthlyLimit === 'number' && !isNaN(b.monthlyLimit)) ? Number(b.monthlyLimit) : (parseFloat(b.monthlyLimit) || 0)
    }));
  },

  saveBudgets(budgets) {
    const validBudgets = Array.isArray(budgets) ? budgets : [];
    return this.safeSetItem(this.getKey('budgets'), validBudgets);
  },

  // Metas
  getGoals() {
    const raw = this.safeGetItem(this.getKey('goals'), []);
    if (!Array.isArray(raw)) return [];

    return raw.filter(g => g && typeof g === 'object' && g.id).map(g => ({
      ...g,
      targetAmount: (typeof g.targetAmount === 'number' && !isNaN(g.targetAmount)) ? Number(g.targetAmount) : (parseFloat(g.targetAmount) || 0),
      currentAmount: (typeof g.currentAmount === 'number' && !isNaN(g.currentAmount)) ? Number(g.currentAmount) : (parseFloat(g.currentAmount) || 0)
    }));
  },

  saveGoals(goals) {
    const validGoals = Array.isArray(goals) ? goals : [];
    return this.safeSetItem(this.getKey('goals'), validGoals);
  },

  // Gera dados simulados realistas para o usuário demo
  seedInitialTransactions() {
    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = String(today.getMonth() + 1).padStart(2, '0');
    
    const prevDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = String(prevDate.getMonth() + 1).padStart(2, '0');

    const sampleData = [
      { id: 'tx-1', description: 'Salário Mensal', amount: 8500.00, type: 'income', categoryId: 'cat-salario', accountId: 'acc-nubank', date: `${curYear}-${curMonth}-05`, status: 'paid', notes: 'CLT líquido' },
      { id: 'tx-2', description: 'Projeto Freelance Frontend', amount: 2200.00, type: 'income', categoryId: 'cat-freelance', accountId: 'acc-nubank', date: `${curYear}-${curMonth}-15`, status: 'paid', notes: 'Consultoria' },
      { id: 'tx-3', description: 'Aluguel & Condomínio', amount: 1850.00, type: 'expense', categoryId: 'cat-moradia', accountId: 'acc-nubank', date: `${curYear}-${curMonth}-10`, status: 'paid', notes: 'Boleto mensal' },
      { id: 'tx-4', description: 'Compras Supermercado', amount: 845.60, type: 'expense', categoryId: 'cat-alimentacao', accountId: 'acc-cartao-master', date: `${curYear}-${curMonth}-12`, status: 'paid', notes: 'Feira e mercado' },
      { id: 'tx-5', description: 'Combustível Posto Ipiranga', amount: 260.00, type: 'expense', categoryId: 'cat-transporte', accountId: 'acc-cartao-master', date: `${curYear}-${curMonth}-14`, status: 'paid', notes: 'Tanque cheio' },
      { id: 'tx-6', description: 'Restaurante Fim de Semana', amount: 180.00, type: 'expense', categoryId: 'cat-alimentacao', accountId: 'acc-nubank', date: `${curYear}-${curMonth}-16`, status: 'paid', notes: 'Jantar' },
      { id: 'tx-7', description: 'Internet Fibra 500MB', amount: 129.90, type: 'expense', categoryId: 'cat-moradia', accountId: 'acc-nubank', date: `${curYear}-${curMonth}-20`, status: 'pending', notes: 'Vencimento dia 20' },
      { id: 'tx-8', description: 'Cinema & Streaming', amount: 95.00, type: 'expense', categoryId: 'cat-lazer', accountId: 'acc-cartao-master', date: `${curYear}-${curMonth}-18`, status: 'paid', notes: 'Netflix + Cinema' },
      { id: 'tx-9', description: 'Farmácia & Vitaminas', amount: 140.00, type: 'expense', categoryId: 'cat-saude', accountId: 'acc-nubank', date: `${curYear}-${curMonth}-22`, status: 'pending', notes: 'Medicamentos' },
      
      { id: 'tx-10', description: 'Salário Mês Anterior', amount: 8500.00, type: 'income', categoryId: 'cat-salario', accountId: 'acc-nubank', date: `${prevYear}-${prevMonth}-05`, status: 'paid' },
      { id: 'tx-11', description: 'Aluguel Mês Anterior', amount: 1850.00, type: 'expense', categoryId: 'cat-moradia', accountId: 'acc-nubank', date: `${prevYear}-${prevMonth}-10`, status: 'paid' },
      { id: 'tx-12', description: 'Mercado Mensal', amount: 1200.00, type: 'expense', categoryId: 'cat-alimentacao', accountId: 'acc-cartao-master', date: `${prevYear}-${prevMonth}-15`, status: 'paid' },
      { id: 'tx-13', description: 'Combustível & Manutenção', amount: 480.00, type: 'expense', categoryId: 'cat-transporte', accountId: 'acc-cartao-master', date: `${prevYear}-${prevMonth}-18`, status: 'paid' }
    ];

    this.saveTransactions(sampleData);
  },

  // Gera objeto de backup estruturado completo com metadados e estatísticas
  generateBackupPayload() {
    const user = Auth.getCurrentUser();
    const transactions = this.getTransactions();
    const accounts = this.getAccounts();
    const categories = this.getCategories();
    const budgets = this.getBudgets();
    const goals = this.getGoals();

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const totalBalance = accounts.reduce((acc, a) => {
      const txs = transactions.filter(t => t.accountId === a.id);
      const inc = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return acc + (a.initialBalance || 0) + inc - exp;
    }, 0);

    return {
      version: '1.2.0',
      system: 'Control DIN',
      exportDate: new Date().toISOString(),
      user: user ? { id: user.id, email: user.email, name: user.name } : null,
      stats: {
        totalTransactions: transactions.length,
        totalAccounts: accounts.length,
        totalCategories: categories.length,
        totalBudgets: budgets.length,
        totalGoals: goals.length,
        totalBalance: Number(totalBalance.toFixed(2)),
        totalIncome: Number(totalIncome.toFixed(2)),
        totalExpense: Number(totalExpense.toFixed(2))
      },
      transactions,
      accounts,
      categories,
      budgets,
      goals
    };
  },

  // Obtém a data do último backup registrado
  getLastBackupDate() {
    const uid = this.getActiveUserId();
    return localStorage.getItem(`controldin_${uid}_last_backup_date_v1`) || null;
  },

  // Atualiza a data do último backup realizado
  updateLastBackupDate() {
    const uid = this.getActiveUserId();
    const now = new Date().toISOString();
    localStorage.setItem(`controldin_${uid}_last_backup_date_v1`, now);
    return now;
  },

  // Exportar Backup Completo em JSON para o usuário atual
  exportBackupJSON() {
    const user = Auth.getCurrentUser();
    const fullBackup = this.generateBackupPayload();
    this.updateLastBackupDate();

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ControlDIN_Backup_${user?.name?.replace(/\s+/g, '_') || 'Financas'}_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    return fullBackup;
  },

  // Salvar no Google Drive / Compartilhar via Web Share API
  async shareBackupViaWebShare() {
    const user = Auth.getCurrentUser();
    const fullBackup = this.generateBackupPayload();
    this.updateLastBackupDate();

    const fileName = `ControlDIN_Backup_${user?.name?.replace(/\s+/g, '_') || 'Financas'}_${new Date().toISOString().slice(0,10)}.json`;
    const jsonBlob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const file = new File([jsonBlob], fileName, { type: 'application/json' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: 'Backup Control DIN',
          text: `Backup financeiro de ${user?.name || 'Control DIN'} gerado em ${new Date().toLocaleDateString('pt-BR')}. Salve no Google Drive, OneDrive ou envie com segurança.`,
          files: [file]
        });
        return { success: true, method: 'share', message: 'Backup compartilhado com sucesso!' };
      } catch (err) {
        if (err.name === 'AbortError') {
          return { success: false, aborted: true, message: 'Compartilhamento cancelado.' };
        }
      }
    }

    // Fallback: Baixa o arquivo e orienta salvar no Google Drive
    this.exportBackupJSON();
    return {
      success: true,
      method: 'download',
      message: 'Arquivo de backup baixado! Você pode salvá-lo diretamente na sua pasta do Google Drive ou OneDrive.'
    };
  },

  // Enviar Backup Completo e Resumo Consolidado por E-mail (Outlook / Hotmail / Gmail)
  async sendBackupByEmail() {
    const user = Auth.getCurrentUser();
    if (!user || !user.email) {
      return { success: false, error: 'Usuário não autenticado ou sem e-mail cadastrado.' };
    }

    const backup = this.generateBackupPayload();
    this.updateLastBackupDate();

    const currencyFormat = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

    const accountsSummary = backup.accounts.map(a => {
      const txs = backup.transactions.filter(t => t.accountId === a.id);
      const inc = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const bal = (a.initialBalance || 0) + inc - exp;
      return `  • ${a.name}: ${currencyFormat(bal)}`;
    }).join('\n');

    const goalsSummary = backup.goals.length > 0
      ? backup.goals.map(g => `  • ${g.title}: ${currencyFormat(g.currentAmount)} / ${currencyFormat(g.targetAmount)} (${Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100))}%)`).join('\n')
      : '  • Nenhuma meta cadastrada no momento.';

    const formattedMessage = 
`==================================================
🛡️ RELATÓRIO DE BACKUP FINANCEIRO - CONTROL DIN
==================================================

Olá, ${user.name || 'Usuário'}!

Este é o seu backup de segurança do Control DIN gerado em:
📅 Data: ${new Date().toLocaleString('pt-BR')}
👤 Conta: ${user.email}

--------------------------------------------------
📊 RESUMO FINANCEIRO CONSOLIDADO:
--------------------------------------------------
💰 Saldo Geral em Contas: ${currencyFormat(backup.stats.totalBalance)}
🟢 Total de Receitas:     ${currencyFormat(backup.stats.totalIncome)}
🔴 Total de Despesas:     ${currencyFormat(backup.stats.totalExpense)}
📋 Total de Transações:   ${backup.stats.totalTransactions} registros

🏦 SALDO POR CONTA:
${accountsSummary}

🎯 OBJETIVOS & METAS:
${goalsSummary}

--------------------------------------------------
🔐 BLOCO DE DADOS DE SEGURANÇA (JSON):
--------------------------------------------------
Para restaurar seus dados caso troque de aparelho ou limpe o navegador:
1. Abra o Control DIN.
2. Acesse a Central de Backup & Nuvem > Restaurar.
3. Cole ou importe os dados abaixo:

${JSON.stringify(backup, null, 2)}

--------------------------------------------------
Control DIN - Gestão Financeira Inteligente e Segura`;

    const subject = `🛡️ Cópia de Segurança & Resumo Financeiro - Control DIN (${new Date().toLocaleDateString('pt-BR')})`;

    // Dispara via EmailJS se configurado
    const emailConfig = this.getEmailSettings();
    if (window.emailjs && emailConfig && emailConfig.serviceId && emailConfig.publicKey) {
      try {
        emailjs.init(emailConfig.publicKey);
        const templateParams = {
          to_email: user.email,
          email: user.email,
          reply_to: user.email,
          to_name: user.name || 'Usuário',
          from_name: 'Control DIN - Backup & Nuvem',
          name: user.name || 'Usuário',
          code: 'BACKUP',
          subject: subject,
          message: formattedMessage,
          user_message: formattedMessage
        };

        const response = await emailjs.send(emailConfig.serviceId, emailConfig.templateId || 'template_2apm937', templateParams);
        if (response.status === 200 || response.text === 'OK') {
          return { success: true, message: `Backup e resumo financeiro enviados com sucesso para ${user.email}!` };
        }
      } catch (err) {
        console.warn('Envio de backup via EmailJS:', err);
      }
    }

    // Fallback via FormSubmit
    try {
      const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(user.email)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          _subject: subject,
          _template: 'box',
          'Sistema': 'Control DIN - Central de Backup',
          'Destinatario': user.name || 'Usuário',
          'Data_Backup': new Date().toLocaleString('pt-BR'),
          'Saldo_Total': currencyFormat(backup.stats.totalBalance),
          'Transacoes': backup.stats.totalTransactions,
          'Contas': backup.stats.totalAccounts,
          'Mensagem_Resumo': formattedMessage
        })
      });
      if (response.ok) {
        return { success: true, message: `Cópia de segurança enviada para ${user.email}!` };
      }
    } catch (e) {
      console.warn('FormSubmit backup:', e);
    }

    return {
      success: false,
      error: 'Não foi possível disparar o e-mail automaticamente. Baixe a cópia em JSON ou configure as chaves do EmailJS.'
    };
  },

  // Inspeciona e valida o arquivo JSON antes da restauração (sem alterar dados)
  inspectBackupJSON(jsonString) {
    try {
      const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      if (!data || typeof data !== 'object') {
        return { valid: false, error: 'O arquivo não contém um objeto JSON válido.' };
      }

      if (!data.transactions || !Array.isArray(data.transactions)) {
        return { valid: false, error: 'Arquivo inválido: nenhuma lista de transações encontrada no backup.' };
      }

      const txs = data.transactions;
      const accounts = Array.isArray(data.accounts) ? data.accounts : [];
      const categories = Array.isArray(data.categories) ? data.categories : [];
      const budgets = Array.isArray(data.budgets) ? data.budgets : [];
      const goals = Array.isArray(data.goals) ? data.goals : [];

      const totalIncome = txs.filter(t => t.type === 'income').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
      const totalExpense = txs.filter(t => t.type === 'expense').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

      return {
        valid: true,
        version: data.version || '1.0.0',
        exportDate: data.exportDate || 'Data não identificada',
        user: data.user || null,
        stats: {
          transactionsCount: txs.length,
          accountsCount: accounts.length,
          categoriesCount: categories.length,
          budgetsCount: budgets.length,
          goalsCount: goals.length,
          totalIncome,
          totalExpense,
          netBalance: totalIncome - totalExpense
        },
        payload: data
      };
    } catch (err) {
      return { valid: false, error: `Falha na leitura do arquivo JSON: ${err.message}` };
    }
  },

  // Importar e Restaurar Backup JSON (com suporte a modo mesclar ou substituir)
  importBackupJSON(jsonStringOrObject, mode = 'replace') {
    try {
      const inspection = this.inspectBackupJSON(jsonStringOrObject);
      if (!inspection.valid) {
        return { success: false, message: inspection.error };
      }

      const data = inspection.payload;

      if (mode === 'replace') {
        if (data.transactions) this.saveTransactions(data.transactions);
        if (data.accounts && data.accounts.length > 0) this.saveAccounts(data.accounts);
        if (data.categories && data.categories.length > 0) this.saveCategories(data.categories);
        if (data.budgets) this.saveBudgets(data.budgets);
        if (data.goals) this.saveGoals(data.goals);
      } else {
        // Modo Merge (Mesclar)
        const curTxs = this.getTransactions();
        const curAccs = this.getAccounts();
        const curGoals = this.getGoals();

        // Evita duplicatas de IDs
        const existingTxIds = new Set(curTxs.map(t => t.id));
        const newTxs = (data.transactions || []).filter(t => !existingTxIds.has(t.id));
        this.saveTransactions([...curTxs, ...newTxs]);

        const existingAccIds = new Set(curAccs.map(a => a.id));
        const newAccs = (data.accounts || []).filter(a => !existingAccIds.has(a.id));
        if (newAccs.length > 0) this.saveAccounts([...curAccs, ...newAccs]);

        const existingGoalIds = new Set(curGoals.map(g => g.id));
        const newGoals = (data.goals || []).filter(g => !existingGoalIds.has(g.id));
        if (newGoals.length > 0) this.saveGoals([...curGoals, ...newGoals]);
      }

      this.updateLastBackupDate();

      return {
        success: true,
        message: `🎉 Backup restaurado com sucesso! (${inspection.stats.transactionsCount} transações, ${inspection.stats.accountsCount} contas)`,
        stats: inspection.stats
      };
    } catch (err) {
      return { success: false, message: `Erro ao restaurar backup: ${err.message}` };
    }
  },

  // Exportar CSV de Transações
  exportTransactionsCSV() {
    const user = Auth.getCurrentUser();
    const transactions = this.getTransactions();
    const categories = this.getCategories();
    const accounts = this.getAccounts();

    const catMap = new Map(categories.map(c => [c.id, c.name]));
    const accMap = new Map(accounts.map(a => [a.id, a.name]));

    const headers = ['ID', 'Data', 'Tipo', 'Descrição', 'Categoria', 'Conta', 'Valor', 'Status', 'Observações'];
    
    const rows = transactions.map(tx => [
      `"${tx.id}"`,
      `"${tx.date}"`,
      `"${tx.type === 'income' ? 'Receita' : (tx.type === 'expense' ? 'Despesa' : 'Transferência')}"`,
      `"${(tx.description || '').replace(/"/g, '""')}"`,
      `"${catMap.get(tx.categoryId) || tx.categoryId || ''}"`,
      `"${accMap.get(tx.accountId) || tx.accountId || ''}"`,
      tx.amount.toFixed(2).replace('.', ','),
      `"${tx.status === 'paid' ? 'Pago' : 'Pendente'}"`,
      `"${(tx.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodeURI(csvContent));
    downloadAnchor.setAttribute("download", `ControlDIN_Extrato_${user?.name?.replace(/\s+/g, '_') || 'Extrato'}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  // Recarregar dados de demonstração
  loadDemoData() {
    this.saveCategories(DEFAULT_CATEGORIES);
    this.saveAccounts(DEFAULT_ACCOUNTS);
    this.saveBudgets(DEFAULT_BUDGETS);
    this.saveGoals(DEFAULT_GOALS);
    this.seedInitialTransactions();
  },

  // Zerar dados do usuário atual
  resetAllData() {
    const keys = ['transactions', 'accounts', 'categories', 'budgets', 'goals'];
    keys.forEach(k => localStorage.removeItem(this.getKey(k)));
  },

  // Baixar Planilha Modelo (CSV) para o usuário preencher
  downloadModelCSV() {
    const headers = ['Data', 'Descricao', 'Valor', 'Tipo', 'Categoria', 'Conta', 'Status', 'Observacoes'];
    const sampleRows = [
      ['2026-08-10', 'Supermercado Semanal', '350,50', 'expense', 'Alimentação & Mercado', 'Conta Principal', 'paid', 'Compras do mês'],
      ['2026-08-05', 'Salário / Pró-labore', '4800,00', 'income', 'Salário & Proventos', 'Conta Principal', 'paid', 'Salário mensal'],
      ['2026-08-12', 'Abastecimento Posto Gasolina', '180,00', 'expense', 'Transporte & Combustível', 'Conta Principal', 'paid', 'Etanol'],
      ['2026-08-15', 'Internet Fibra Óptica', '129,90', 'expense', 'Moradia & Contas', 'Conta Principal', 'paid', 'Mensalidade'],
      ['2026-08-20', 'Serviço Freelance / Consultoria', '1250,00', 'income', 'Freelance & Serviços', 'Conta Principal', 'pending', 'A receber']
    ];

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(';'), ...sampleRows.map(r => r.join(';'))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodeURI(csvContent));
    downloadAnchor.setAttribute("download", "ControlDIN_Planilha_Modelo.csv");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  // Parser inteligente de texto CSV para lista de transações
  parseCSVTransactions(csvText, defaultAccountId = null) {
    if (!csvText || typeof csvText !== 'string') {
      return { success: false, error: 'O arquivo CSV está vazio ou inválido.' };
    }

    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      return { success: false, error: 'O arquivo deve conter ao menos um cabeçalho e uma linha de dados.' };
    }

    // Detecta separador (; ou , ou \t)
    const firstLine = lines[0];
    const semiCount = (firstLine.match(/;/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const sep = (tabCount > semiCount && tabCount > commaCount) ? '\t' : (semiCount >= commaCount ? ';' : ',');

    // Limpa aspas e quebra linha
    const splitCSVLine = (line) => {
      const result = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === sep && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const header = splitCSVLine(lines[0]).map(h => h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
    
    // Mapeamento de índices de colunas
    const colIdx = {
      date: header.findIndex(h => h.includes('data') || h.includes('date') || h.includes('dia')),
      desc: header.findIndex(h => h.includes('desc') || h.includes('historico') || h.includes('memo') || h.includes('nome') || h.includes('titulo')),
      amount: header.findIndex(h => h.includes('valor') || h.includes('amount') || h.includes('value') || h.includes('quantia')),
      type: header.findIndex(h => h.includes('tipo') || h.includes('type')),
      category: header.findIndex(h => h.includes('categ') || h.includes('categoria')),
      account: header.findIndex(h => h.includes('conta') || h.includes('banco') || h.includes('account')),
      status: header.findIndex(h => h.includes('status') || h.includes('situacao')),
      notes: header.findIndex(h => h.includes('obs') || h.includes('nota') || h.includes('detalhe'))
    };

    // Se não encontrou colunas essenciais por nome, tenta por ordem padrão (0: Data, 1: Descrição, 2: Valor)
    if (colIdx.date === -1) colIdx.date = 0;
    if (colIdx.desc === -1) colIdx.desc = 1;
    if (colIdx.amount === -1) colIdx.amount = 2;

    const categories = this.getCategories();
    const accounts = this.getAccounts();
    const fallbackAccId = defaultAccountId || (accounts.length > 0 ? accounts[0].id : 'acc-default');

    const parsedTransactions = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = splitCSVLine(lines[i]);
      if (cols.length === 0 || (cols.length === 1 && !cols[0])) continue;

      try {
        const rawDate = cols[colIdx.date] || '';
        const rawDesc = cols[colIdx.desc] || `Transação importada #${i}`;
        const rawAmount = cols[colIdx.amount] || '0';
        const rawType = (colIdx.type !== -1 && cols[colIdx.type]) ? cols[colIdx.type].toLowerCase() : '';
        const rawCategory = (colIdx.category !== -1 && cols[colIdx.category]) ? cols[colIdx.category] : '';
        const rawAccount = (colIdx.account !== -1 && cols[colIdx.account]) ? cols[colIdx.account] : '';
        const rawStatus = (colIdx.status !== -1 && cols[colIdx.status]) ? cols[colIdx.status].toLowerCase() : 'paid';
        const rawNotes = (colIdx.notes !== -1 && cols[colIdx.notes]) ? cols[colIdx.notes] : '';

        // 1. Normalização de Data
        let isoDate = new Date().toISOString().slice(0, 10);
        if (rawDate) {
          const dParts = rawDate.replace(/\//g, '-').split('-');
          if (dParts.length === 3) {
            if (dParts[0].length === 4) {
              // YYYY-MM-DD
              isoDate = `${dParts[0]}-${dParts[1].padStart(2, '0')}-${dParts[2].padStart(2, '0')}`;
            } else if (dParts[2].length === 4) {
              // DD-MM-YYYY
              isoDate = `${dParts[2]}-${dParts[1].padStart(2, '0')}-${dParts[0].padStart(2, '0')}`;
            }
          }
        }

        // 2. Normalização do Valor (Trata R$, espaços, pontos de milhar e vírgula decimal)
        let cleanValStr = rawAmount.replace(/[^\d.,\-+]/g, '').trim();
        let isNegative = cleanValStr.startsWith('-') || cleanValStr.includes('(');
        cleanValStr = cleanValStr.replace(/[\-\+\(\)]/g, '');

        if (cleanValStr.includes(',') && cleanValStr.includes('.')) {
          // Ex: 1.250,50 ou 1,250.50
          if (cleanValStr.lastIndexOf(',') > cleanValStr.lastIndexOf('.')) {
            cleanValStr = cleanValStr.replace(/\./g, '').replace(',', '.');
          } else {
            cleanValStr = cleanValStr.replace(/,/g, '');
          }
        } else if (cleanValStr.includes(',')) {
          cleanValStr = cleanValStr.replace(',', '.');
        }

        let numAmount = Math.abs(parseFloat(cleanValStr) || 0);

        // 3. Determinação de Tipo (Receita vs Despesa)
        let type = 'expense';
        if (rawType.includes('rec') || rawType.includes('inc') || rawType.includes('cred') || rawType.includes('ganho')) {
          type = 'income';
        } else if (rawType.includes('desp') || rawType.includes('exp') || rawType.includes('deb')) {
          type = 'expense';
        } else if (isNegative) {
          type = 'expense';
        } else if (colIdx.type === -1 && !isNegative && cleanValStr) {
          // Se não especificado e positivo, assume despesa exceto se o texto indicar ganho
          const descLower = rawDesc.toLowerCase();
          if (descLower.includes('salario') || descLower.includes('pix recebido') || descLower.includes('rendimento') || descLower.includes('venda')) {
            type = 'income';
          } else {
            type = 'expense';
          }
        }

        // 4. Mapeamento de Categoria
        let categoryId = type === 'income' ? 'cat-outras-rec' : 'cat-outras-desp';
        if (rawCategory) {
          const catMatch = categories.find(c => c.name.toLowerCase().includes(rawCategory.toLowerCase()) || rawCategory.toLowerCase().includes(c.name.toLowerCase()));
          if (catMatch) categoryId = catMatch.id;
        }

        // 5. Mapeamento de Conta
        let targetAccountId = fallbackAccId;
        if (rawAccount) {
          const accMatch = accounts.find(a => a.name.toLowerCase().includes(rawAccount.toLowerCase()) || rawAccount.toLowerCase().includes(a.name.toLowerCase()));
          if (accMatch) targetAccountId = accMatch.id;
        }

        // 6. Status
        let status = (rawStatus.includes('pend') || rawStatus.includes('agend')) ? 'pending' : 'paid';

        parsedTransactions.push({
          id: `tx-import-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          description: rawDesc.slice(0, 100),
          amount: Number(numAmount.toFixed(2)),
          type,
          categoryId,
          accountId: targetAccountId,
          date: isoDate,
          status,
          notes: rawNotes ? rawNotes.slice(0, 200) : 'Importado via planilha',
          isRecurring: false,
          isInstallment: false
        });
      } catch (err) {
        errors.push(`Linha ${i + 1}: ${err.message}`);
      }
    }

    return {
      success: parsedTransactions.length > 0,
      transactions: parsedTransactions,
      totalCount: parsedTransactions.length,
      errors: errors.slice(0, 5),
      summary: {
        totalIncome: parsedTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0),
        totalExpense: parsedTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0),
        countIncome: parsedTransactions.filter(t => t.type === 'income').length,
        countExpense: parsedTransactions.filter(t => t.type === 'expense').length
      }
    };
  },

  // Salvar / Mesclar lote de transações importadas
  importTransactions(transactionsToImport, mode = 'merge') {
    if (!Array.isArray(transactionsToImport) || transactionsToImport.length === 0) {
      return { success: false, message: 'Nenhuma transação para importar.' };
    }

    let currentTxs = this.getTransactions();

    if (mode === 'replace') {
      this.saveTransactions(transactionsToImport);
    } else {
      // Merge: junta transações preservando dados existentes
      const merged = [...currentTxs, ...transactionsToImport];
      this.saveTransactions(merged);
    }

    return {
      success: true,
      message: `🎉 ${transactionsToImport.length} transações foram importadas com sucesso!`,
      count: transactionsToImport.length
    };
  },

  // Obter configurações do EmailJS
  getEmailSettings() {
    try {
      const data = localStorage.getItem('controldin_email_config_v1');
      const parsed = data ? JSON.parse(data) : {};
      return {
        serviceId: parsed.serviceId || 'service_rghx0s7',
        templateId: parsed.templateId || 'template_2apm937',
        publicKey: parsed.publicKey || '2VRr8eSttp8KWw-Lv'
      };
    } catch {
      return { serviceId: 'service_rghx0s7', templateId: 'template_2apm937', publicKey: '2VRr8eSttp8KWw-Lv' };
    }
  },

  // Salvar configurações do EmailJS
  saveEmailSettings(config) {
    localStorage.setItem('controldin_email_config_v1', JSON.stringify({
      serviceId: config.serviceId?.trim() || '',
      templateId: config.templateId?.trim() || '',
      publicKey: config.publicKey?.trim() || ''
    }));
  }
};

window.Storage = Storage;
window.DEFAULT_CATEGORIES = DEFAULT_CATEGORIES;
window.DEFAULT_ACCOUNTS = DEFAULT_ACCOUNTS;
window.DEFAULT_BUDGETS = DEFAULT_BUDGETS;
window.DEFAULT_GOALS = DEFAULT_GOALS;
