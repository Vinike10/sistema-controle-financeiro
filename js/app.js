/**
 * Control DIN - Main Application Controller with Motion Principles (js/app.js)
 * Orquestrador principal da aplicação: gerencia rotas, eventos, autenticação,
 * modais, validação de e-mail, skeletons de transição e carregamento progressivo.
 */

import { Storage } from './storage.js';
import { Auth } from './auth.js';
import { Transactions } from './transactions.js';
import { Accounts } from './accounts.js';
import { Budgets, Goals } from './budgets.js';
import { UI } from './ui.js';

class App {
  constructor() {
    const today = new Date();
    this.currentYear = today.getFullYear();
    this.currentMonth = today.getMonth() + 1;
    this.activeTab = 'dashboard';
    this.isLoadingView = false;
    this.resendTimer = null;
    this.resendSecondsLeft = 0;
    
    this.filters = {
      search: '',
      type: 'all',
      categoryId: 'all',
      accountId: 'all',
      status: 'all'
    };
  }

  async init() {
    // 1. Inicializa o serviço de autenticação
    await Auth.initAuth();

    // 2. Configura Tema Claro / Escuro
    this.setupTheme();

    // 3. Configura Event Listeners da Autenticação e do Sistema
    this.setupAuthEventListeners();
    this.setupEventListeners();

    // 4. Verifica se o usuário já possui sessão ativa
    const currentUser = Auth.getCurrentUser();
    if (currentUser) {
      this.onUserAuthenticated(currentUser);
    } else {
      // Exibe tela de autenticação
      UI.showAuthModal('login');
    }

    UI.refreshIcons();
  }

  // Executado quando um usuário é autenticado com sucesso (Login, Cadastro ou Demo)
  onUserAuthenticated(user) {
    UI.hideAuthModal();
    Storage.init();
    UI.updateUserProfileUI(user);
    this.updatePeriodDisplay();
    UI.populateSelects();
    this.renderCurrentView();
    UI.refreshIcons();
  }

  // Atualiza o texto do seletor de mês e ano no topo
  updatePeriodDisplay() {
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const label = `${monthNames[this.currentMonth - 1]} / ${this.currentYear}`;
    const periodLabelEl = document.getElementById('periodLabel');
    if (periodLabelEl) periodLabelEl.textContent = label;
  }

  // Exibe skeleton antes de renderizar os dados calculados (transição suave)
  triggerViewLoading(renderFn) {
    if (this.isLoadingView) return;
    this.isLoadingView = true;

    // 1. Ativa Skeleton específico da aba
    switch (this.activeTab) {
      case 'dashboard':
        UI.showDashboardSkeletons();
        break;
      case 'transactions':
        UI.showTransactionsSkeletons();
        break;
      case 'accounts':
        UI.showAccountsSkeletons();
        break;
      case 'budgets':
        UI.showBudgetsSkeletons();
        break;
      case 'reports':
        UI.showReportsSkeletons();
        break;
    }

    // 2. Renderiza os dados reais com transição suave
    setTimeout(() => {
      renderFn();
      this.isLoadingView = false;
    }, 180);
  }

  // Renderiza a tela ativa
  renderCurrentView(withLoading = false) {
    const doRender = () => {
      switch (this.activeTab) {
        case 'dashboard':
          UI.renderDashboard(this.currentYear, this.currentMonth);
          break;
        case 'transactions':
          UI.renderTransactions(this.currentYear, this.currentMonth, this.filters);
          break;
        case 'accounts':
          UI.renderAccounts();
          break;
        case 'budgets':
          UI.renderBudgetsAndGoals(this.currentYear, this.currentMonth);
          break;
        case 'reports':
          UI.renderReports(this.currentYear, this.currentMonth);
          break;
        case 'settings':
          break;
      }
    };

    if (withLoading) {
      this.triggerViewLoading(doRender);
    } else {
      doRender();
    }
  }

  // Alternador de Abas com transições fluidas
  switchTab(tabName) {
    if (this.activeTab === tabName) return;
    this.activeTab = tabName;

    // Atualiza classes ativas na Sidebar
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Atualiza views
    document.querySelectorAll('.tab-view').forEach(view => {
      const isTarget = view.id === `view-${tabName}`;
      view.classList.toggle('active', isTarget);
    });

    // Atualiza Título da Página
    const titles = {
      dashboard: { title: 'Visão Geral', sub: 'Resumo consolidado das suas finanças' },
      transactions: { title: 'Transações', sub: 'Extrato completo de receitas, despesas e transferências' },
      accounts: { title: 'Contas & Cartões', sub: 'Gerenciamento de bancos, cartões de crédito e carteiras' },
      budgets: { title: 'Orçamentos & Metas', sub: 'Acompanhamento de tetos de gastos e objetivos' },
      reports: { title: 'Relatórios & Analytics', sub: 'Análise detalhada de evolução financeira' },
      settings: { title: 'Configurações & Backup', sub: 'Exportação, importação e governança do projeto' }
    };

    if (titles[tabName]) {
      document.getElementById('pageTitle').textContent = titles[tabName].title;
      document.getElementById('pageSubtitle').textContent = titles[tabName].sub;
    }

    // Fecha sidebar no mobile
    document.getElementById('sidebar').classList.remove('open');

    this.renderCurrentView(true);
    UI.refreshIcons();
  }

  // Configuração do Tema Claro / Escuro
  setupTheme() {
    const savedTheme = localStorage.getItem('controldin_theme') || localStorage.getItem('fintrack_theme') || 'light';
    document.body.className = `theme-${savedTheme}`;
    this.updateThemeIcon(savedTheme);
  }

  toggleTheme() {
    const isDark = document.body.classList.contains('theme-dark');
    const newTheme = isDark ? 'light' : 'dark';
    document.body.className = `theme-${newTheme}`;
    localStorage.setItem('controldin_theme', newTheme);
    this.updateThemeIcon(newTheme);
    this.renderCurrentView(false);
  }

  updateThemeIcon(theme) {
    const icon = document.getElementById('themeIcon');
    if (icon) {
      icon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
    }
    const authIcon = document.getElementById('authThemeIcon');
    if (authIcon) {
      authIcon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
    }
    UI.refreshIcons();
  }

  // Modais com animações suaves de abertura e fechamento
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('closing');
      modal.classList.add('active');
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('closing');
      setTimeout(() => {
        modal.classList.remove('active', 'closing');
      }, 200);
    }
  }

  // ==========================================================================
  // EVENT LISTENERS DE AUTENTICAÇÃO, SEGURANÇA E VALIDAÇÃO DE E-MAIL
  // ==========================================================================
  setupAuthEventListeners() {
    // 0. Alternador de Modo Escuro / Claro no card de Autenticação
    document.getElementById('btnAuthThemeToggle')?.addEventListener('click', () => {
      this.toggleTheme();
    });

    // 1. Alternador de Visibilidade de Senhas (Olho)
    document.getElementById('btnToggleLoginPassword')?.addEventListener('click', () => {
      UI.togglePasswordVisibility('loginPassword', 'iconLoginPassword');
    });
    document.getElementById('btnToggleRegPassword')?.addEventListener('click', () => {
      UI.togglePasswordVisibility('regPassword', 'iconRegPassword');
    });
    document.getElementById('btnToggleRegPasswordConfirm')?.addEventListener('click', () => {
      UI.togglePasswordVisibility('regPasswordConfirm', 'iconRegPasswordConfirm');
    });

    // 2. Navegação entre abas e links no modal de Autenticação
    document.getElementById('tabBtnLogin')?.addEventListener('click', () => UI.switchAuthTab('login'));
    document.getElementById('tabBtnRegister')?.addEventListener('click', () => UI.switchAuthTab('register'));
    document.getElementById('btnGoToRegister')?.addEventListener('click', () => UI.switchAuthTab('register'));
    document.getElementById('btnGoToLogin')?.addEventListener('click', () => UI.switchAuthTab('login'));
    document.getElementById('btnGoToRecover')?.addEventListener('click', () => {
      UI.switchAuthTab('recover');
      document.getElementById('recoverStep1').style.display = 'block';
      document.getElementById('recoverStep2').style.display = 'none';
      UI.clearAuthAlert('recoverAlert');
      UI.clearAuthAlert('recoverStep2Alert');
    });
    document.getElementById('btnBackToLoginFromRecover')?.addEventListener('click', () => UI.switchAuthTab('login'));

    // 3. Medidor de Força de Senha em Tempo Real
    const regPasswordInput = document.getElementById('regPassword');
    if (regPasswordInput) {
      regPasswordInput.addEventListener('input', (e) => {
        const val = e.target.value;
        const strength = Auth.evaluatePasswordStrength(val);
        UI.updatePasswordStrengthUI(strength);
      });
    }

    // 4. Validador de E-mail em Tempo Real no Cadastro (Detecção de Erros de Digitação)
    const regEmailInput = document.getElementById('regEmail');
    const regEmailFeedback = document.getElementById('regEmailFeedback');
    if (regEmailInput && regEmailFeedback) {
      regEmailInput.addEventListener('blur', () => {
        const val = regEmailInput.value;
        if (!val) {
          regEmailFeedback.textContent = '';
          return;
        }
        const check = Auth.validateEmail(val);
        if (!check.isValid) {
          regEmailFeedback.className = 'input-feedback text-danger';
          regEmailFeedback.textContent = check.error;
        } else if (check.warning) {
          regEmailFeedback.className = 'input-feedback text-warning';
          regEmailFeedback.innerHTML = `💡 ${check.warning} <a href="#" id="linkAcceptEmailSuggestion" class="btn-link">Corrigir</a>`;
          document.getElementById('linkAcceptEmailSuggestion')?.addEventListener('click', (ev) => {
            ev.preventDefault();
            regEmailInput.value = check.suggestion;
            regEmailFeedback.className = 'input-feedback text-success';
            regEmailFeedback.textContent = '✓ E-mail válido e corrigido!';
          });
        } else {
          regEmailFeedback.className = 'input-feedback text-success';
          regEmailFeedback.textContent = '✓ Formato de e-mail válido';
        }
      });
    }

    // 5. Submit do Formulário de Login
    document.getElementById('formLogin')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const remember = document.getElementById('loginRemember').checked;

      const btnSubmit = document.getElementById('btnLoginSubmit');
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<span>Verificando...</span>';

      try {
        const result = await Auth.login(email, password, remember);
        if (result.success) {
          UI.clearAuthAlert('loginAlert');
          this.onUserAuthenticated(result.user);
          UI.showToast(`Bem-vindo de volta, ${result.user.name}!`, 'success');
        } else {
          UI.setAuthAlert('loginAlert', result.error, result.isLocked ? 'warning' : 'danger');
        }
      } catch (err) {
        UI.setAuthAlert('loginAlert', `Erro inesperado: ${err.message}`, 'danger');
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i data-lucide="log-in"></i><span>Entrar no Sistema</span>';
        UI.refreshIcons();
      }
    });

    // 6. Botão Rápido de Acesso ao Modo Demonstração (1 Clique)
    document.getElementById('btnQuickDemoLogin')?.addEventListener('click', async () => {
      const result = await Auth.loginAsDemo();
      if (result.success) {
        this.onUserAuthenticated(result.user);
        UI.showToast('Você entrou no Modo Demonstração com dados de exemplo pré-carregados!', 'success');
      } else {
        UI.showToast(result.error, 'error');
      }
    });

    // 7. Submit do Formulário de Criação de Conta
    document.getElementById('formRegister')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const password = document.getElementById('regPassword').value;
      const passwordConfirm = document.getElementById('regPasswordConfirm').value;

      if (password !== passwordConfirm) {
        UI.setAuthAlert('regAlert', 'A confirmação da senha não confere com a senha digitada.', 'danger');
        return;
      }

      const btnSubmit = document.getElementById('btnRegisterSubmit');
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<span>Criando conta e gerando código...</span>';

      try {
        const result = await Auth.register({ name, email, password });
        if (result.success) {
          UI.clearAuthAlert('regAlert');
          // Redireciona para tela de confirmação de código de 6 dígitos
          UI.switchAuthTab('verify');
          document.getElementById('verifyTargetEmail').textContent = result.user.email;
          document.getElementById('demoCodeValue').textContent = result.verificationCode;
          
          this.startResendCooldownTimer('resendCountdown', 'btnResendCode');
          this.setup6DigitCodeAutoAdvance('');

          UI.showToast(`Código de confirmação: ${result.verificationCode}`, 'info');
        } else {
          UI.setAuthAlert('regAlert', result.error, 'danger');
        }
      } catch (err) {
        UI.setAuthAlert('regAlert', `Erro ao registrar: ${err.message}`, 'danger');
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i data-lucide="user-check"></i><span>Criar Conta & Validar E-mail</span>';
        UI.refreshIcons();
      }
    });

    // 8. Configuração das 6 caixas de código de verificação (Navegação Automática e Paste)
    this.setup6DigitCodeAutoAdvance('');
    this.setup6DigitCodeAutoAdvance('std');

    // Botão de auto-preenchimento para demonstração
    document.getElementById('btnAutoFillCode')?.addEventListener('click', () => {
      const code = document.getElementById('demoCodeValue').textContent;
      if (code && code !== '------') {
        for (let i = 1; i <= 6; i++) {
          const d = document.getElementById(`digit${i}`);
          if (d) d.value = code[i - 1] || '';
        }
        document.getElementById('digit6')?.focus();
      }
    });

    document.getElementById('btnStdAutoFillCode')?.addEventListener('click', () => {
      const code = document.getElementById('stdDemoCodeValue').textContent;
      if (code && code !== '------') {
        for (let i = 1; i <= 6; i++) {
          const d = document.getElementById(`stdDigit${i}`);
          if (d) d.value = code[i - 1] || '';
        }
        document.getElementById('stdDigit6')?.focus();
      }
    });

    // Submit da Validação de E-mail (Tela inicial pós cadastro)
    document.getElementById('formVerifyEmail')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = Auth.getCurrentUser();
      if (!user) return;

      let code = '';
      for (let i = 1; i <= 6; i++) {
        code += document.getElementById(`digit${i}`)?.value || '';
      }

      const result = Auth.verifyEmail(user.id, code);
      if (result.success) {
        UI.clearAuthAlert('verifyAlert');
        this.onUserAuthenticated(Auth.getCurrentUser());
        UI.showToast(result.message, 'success');
      } else {
        UI.setAuthAlert('verifyAlert', result.error, 'danger');
      }
    });

    // Botão "Validar mais tarde e acessar o sistema"
    document.getElementById('btnSkipVerification')?.addEventListener('click', () => {
      const user = Auth.getCurrentUser();
      if (user) {
        this.onUserAuthenticated(user);
        UI.showToast('Lembre-se de confirmar seu e-mail no banner superior para segurança total.', 'info');
      }
    });

    // 9. Simulador de Caixa de Entrada de E-mail Recebido
    const openSimulator = (code, email, name) => {
      const activeUser = Auth.getCurrentUser();
      const targetEmail = email || activeUser?.email || 'seu.email@exemplo.com';
      const targetName = name || activeUser?.name || 'Usuário';
      const targetCode = code || document.getElementById('demoCodeValue')?.textContent || '123456';

      const recEl = document.getElementById('simEmailRecipient');
      const greetEl = document.getElementById('simEmailGreeting');
      const codeEl = document.getElementById('simEmailCodeDisplay');

      if (recEl) recEl.textContent = targetEmail;
      if (greetEl) greetEl.textContent = `Olá, ${targetName}! Seja bem-vindo ao Control DIN.`;
      if (codeEl) codeEl.textContent = targetCode;

      this.openModal('modalEmailSimulator');
      UI.refreshIcons();
    };

    document.getElementById('btnOpenEmailSimulator')?.addEventListener('click', () => {
      const code = document.getElementById('demoCodeValue')?.textContent;
      const email = document.getElementById('verifyTargetEmail')?.textContent;
      const user = Auth.getCurrentUser();
      openSimulator(code, email, user?.name);
    });

    document.getElementById('btnStdOpenEmailSimulator')?.addEventListener('click', () => {
      const code = document.getElementById('stdDemoCodeValue')?.textContent;
      const email = document.getElementById('stdVerifyTargetEmail')?.textContent;
      const user = Auth.getCurrentUser();
      openSimulator(code, email, user?.name);
    });

    document.getElementById('btnClickActivateInEmail')?.addEventListener('click', () => {
      const code = document.getElementById('simEmailCodeDisplay')?.textContent;
      const user = Auth.getCurrentUser();
      if (!user || !code || code === '------') return;

      for (let i = 1; i <= 6; i++) {
        const d = document.getElementById(`digit${i}`);
        if (d) d.value = code[i - 1] || '';
        const sd = document.getElementById(`stdDigit${i}`);
        if (sd) sd.value = code[i - 1] || '';
      }

      const result = Auth.verifyEmail(user.id, code);
      this.closeModal('modalEmailSimulator');
      this.closeModal('modalStandaloneVerifyEmail');

      if (result.success) {
        UI.clearAuthAlert('verifyAlert');
        this.onUserAuthenticated(Auth.getCurrentUser());
        UI.showToast('🎉 E-mail ativado com sucesso através da mensagem de validação!', 'success');
      } else {
        UI.showToast(result.error, 'error');
      }
    });

    // Reenvio de Código com Cooldown (Formulário inicial)
    document.getElementById('btnResendCode')?.addEventListener('click', () => {
      const user = Auth.getCurrentUser();
      if (!user || this.resendSecondsLeft > 0) return;

      const res = Auth.resendVerificationCode(user.id);
      if (res.success) {
        document.getElementById('demoCodeValue').textContent = res.code;
        const codeDisplay = document.getElementById('simEmailCodeDisplay');
        if (codeDisplay) codeDisplay.textContent = res.code;
        this.startResendCooldownTimer('resendCountdown', 'btnResendCode');
        UI.showToast(res.message, 'info');
      }
    });

    // Submit da Verificação no Modal Avulso (via Banner/Perfil)
    document.getElementById('formStandaloneVerifyEmail')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = Auth.getCurrentUser();
      if (!user) return;

      let code = '';
      for (let i = 1; i <= 6; i++) {
        code += document.getElementById(`stdDigit${i}`)?.value || '';
      }

      const result = Auth.verifyEmail(user.id, code);
      if (result.success) {
        this.closeModal('modalStandaloneVerifyEmail');
        UI.updateUserProfileUI(Auth.getCurrentUser());
        UI.showToast(result.message, 'success');
      } else {
        UI.setAuthAlert('stdVerifyAlert', result.error, 'danger');
      }
    });

    // Reenvio de Código no Modal Avulso
    document.getElementById('btnStdResendCode')?.addEventListener('click', () => {
      const user = Auth.getCurrentUser();
      if (!user) return;

      const res = Auth.resendVerificationCode(user.id);
      if (res.success) {
        document.getElementById('stdDemoCodeValue').textContent = res.code;
        this.startResendCooldownTimer('stdResendCountdown', 'btnStdResendCode');
        UI.showToast(res.message, 'info');
      }
    });

    // 9. Fluxo de Recuperação de Senha (Esqueci minha senha)
    document.getElementById('btnSendRecoverCode')?.addEventListener('click', () => {
      const email = document.getElementById('recoverEmail').value.trim();
      const res = Auth.requestPasswordReset(email);
      if (res.success) {
        UI.clearAuthAlert('recoverAlert');
        document.getElementById('recoverStep1').style.display = 'none';
        document.getElementById('recoverStep2').style.display = 'block';
        document.getElementById('recoverCode').value = res.code; // Preenche código na simulação
        UI.showToast(`Código de recuperação: ${res.code}`, 'info');
      } else {
        UI.setAuthAlert('recoverAlert', res.error, 'danger');
      }
    });

    document.getElementById('formRecoverPassword')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('recoverEmail').value.trim();
      const code = document.getElementById('recoverCode').value.trim();
      const newPassword = document.getElementById('recoverNewPassword').value;

      const res = await Auth.resetPasswordWithCode(email, code, newPassword);
      if (res.success) {
        UI.switchAuthTab('login');
        UI.setAuthAlert('loginAlert', res.message, 'success');
        document.getElementById('loginEmail').value = email;
        document.getElementById('loginPassword').value = '';
        UI.showToast(res.message, 'success');
      } else {
        UI.setAuthAlert('recoverStep2Alert', res.error, 'danger');
      }
    });

    // 10. Menu de Usuário no Top Header (Dropdown & Profile Trigger)
    const btnUserProfile = document.getElementById('btnUserProfile');
    const userMenuContainer = document.querySelector('.user-menu-container');

    btnUserProfile?.addEventListener('click', (e) => {
      e.stopPropagation();
      userMenuContainer?.classList.toggle('open');
    });

    // Fecha dropdown ao clicar fora
    document.addEventListener('click', (e) => {
      if (userMenuContainer && !userMenuContainer.contains(e.target)) {
        userMenuContainer.classList.remove('open');
      }
    });

    // Botão "Meu Perfil & Segurança" no dropdown
    document.getElementById('btnOpenProfileModal')?.addEventListener('click', () => {
      userMenuContainer?.classList.remove('open');
      UI.openProfileModal(Auth.getCurrentUser());
    });

    // Botão "Validar E-mail" no banner ou dropdown
    document.getElementById('btnBannerVerifyEmail')?.addEventListener('click', () => {
      UI.openStandaloneVerifyModal(Auth.getCurrentUser());
    });
    document.getElementById('btnDropdownVerifyEmail')?.addEventListener('click', () => {
      userMenuContainer?.classList.remove('open');
      UI.openStandaloneVerifyModal(Auth.getCurrentUser());
    });
    document.getElementById('btnDismissVerifyBanner')?.addEventListener('click', () => {
      document.getElementById('emailVerificationBanner').style.display = 'none';
    });

    // 11. Modal de Perfil: Troca de Abas
    document.querySelectorAll('.profile-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.profileTab;
        document.querySelectorAll('.profile-tab-btn').forEach(b => b.classList.toggle('active', b === btn));
        document.getElementById('formProfileInfo')?.classList.toggle('active', tab === 'info');
        document.getElementById('formChangePassword')?.classList.toggle('active', tab === 'security');
      });
    });

    // Seleção de Cores Pré-definidas no Perfil
    document.querySelectorAll('.color-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const color = btn.dataset.color;
        document.getElementById('profileColor').value = color;
        document.getElementById('modalProfileAvatar').style.backgroundColor = color;
      });
    });

    document.getElementById('profileColor')?.addEventListener('input', (e) => {
      document.getElementById('modalProfileAvatar').style.backgroundColor = e.target.value;
    });

    // Submit: Atualização de Dados do Perfil
    document.getElementById('formProfileInfo')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = Auth.getCurrentUser();
      if (!user) return;

      const name = document.getElementById('profileName').value.trim();
      const color = document.getElementById('profileColor').value;

      const res = Auth.updateProfile(user.id, { name, avatarColor: color });
      if (res.success) {
        UI.updateUserProfileUI(res.user);
        this.closeModal('modalProfile');
        UI.showToast(res.message, 'success');
      } else {
        UI.showToast(res.error, 'error');
      }
    });

    // Submit: Alteração de Senha no Perfil
    document.getElementById('formChangePassword')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = Auth.getCurrentUser();
      if (!user) return;

      const curPass = document.getElementById('currentPassword').value;
      const newPass = document.getElementById('newPassword').value;
      const confPass = document.getElementById('confirmNewPassword').value;

      if (newPass !== confPass) {
        UI.setAuthAlert('changePasswordAlert', 'A confirmação não confere com a nova senha.', 'danger');
        return;
      }

      const res = await Auth.changePassword(user.id, curPass, newPass);
      if (res.success) {
        this.closeModal('modalProfile');
        document.getElementById('formChangePassword').reset();
        UI.showToast(res.message, 'success');
      } else {
        UI.setAuthAlert('changePasswordAlert', res.error, 'danger');
      }
    });

    // 12. Logout
    const handleLogout = () => {
      if (confirm('Deseja realmente sair da sua conta?')) {
        userMenuContainer?.classList.remove('open');
        Auth.logout();
        UI.showAuthModal('login');
        UI.showToast('Sessão encerrada com sucesso.', 'info');
      }
    };

    document.getElementById('btnLogout')?.addEventListener('click', handleLogout);
    document.getElementById('btnSidebarLogout')?.addEventListener('click', handleLogout);
  }

  // Configura navegação automática, backspace e colar nas 6 caixas de dígitos
  setup6DigitCodeAutoAdvance(prefix = '') {
    const p = prefix ? `${prefix}Digit` : 'digit';
    for (let i = 1; i <= 6; i++) {
      const input = document.getElementById(`${p}${i}`);
      if (!input) continue;

      input.addEventListener('input', (e) => {
        const val = e.target.value;
        if (val.length >= 1) {
          input.value = val[val.length - 1]; // Mantém apenas 1 dígito
          if (i < 6) {
            document.getElementById(`${p}${i + 1}`)?.focus();
          }
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value && i > 1) {
          const prev = document.getElementById(`${p}${i - 1}`);
          if (prev) {
            prev.focus();
            prev.value = '';
          }
        }
      });

      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text').trim();
        if (/^\d{6}$/.test(text)) {
          for (let k = 1; k <= 6; k++) {
            const digitInput = document.getElementById(`${p}${k}`);
            if (digitInput) digitInput.value = text[k - 1];
          }
          document.getElementById(`${p}6`)?.focus();
        }
      });
    }
  }

  // Temporizador de Cooldown para Reenvio de Código (30s)
  startResendCooldownTimer(countdownElementId, buttonElementId) {
    if (this.resendTimer) clearInterval(this.resendTimer);

    this.resendSecondsLeft = 30;
    const btn = document.getElementById(buttonElementId);
    const label = document.getElementById(countdownElementId);

    if (btn) btn.disabled = true;

    this.resendTimer = setInterval(() => {
      this.resendSecondsLeft--;
      if (label) label.textContent = `${this.resendSecondsLeft}s`;

      if (this.resendSecondsLeft <= 0) {
        clearInterval(this.resendTimer);
        if (btn) btn.disabled = false;
        if (label) label.textContent = 'Agora';
      }
    }, 1000);
  }

  // ==========================================================================
  // CONFIGURAÇÃO DOS EVENT LISTENERS GERAIS DO SISTEMA
  // ==========================================================================
  setupEventListeners() {
    // 1. Navegação por abas
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchTab(btn.dataset.tab);
      });
    });

    // Botões de atalho no Dashboard
    document.getElementById('btnGoToTransactions')?.addEventListener('click', () => this.switchTab('transactions'));
    document.getElementById('btnGoToBudgets')?.addEventListener('click', () => this.switchTab('budgets'));

    // 2. Navegação de Período (Mês Anterior / Próximo) com Skeleton Transitório
    document.getElementById('btnPeriodPrev')?.addEventListener('click', () => {
      this.currentMonth--;
      if (this.currentMonth < 1) {
        this.currentMonth = 12;
        this.currentYear--;
      }
      this.updatePeriodDisplay();
      this.renderCurrentView(true);
    });

    document.getElementById('btnPeriodNext')?.addEventListener('click', () => {
      this.currentMonth++;
      if (this.currentMonth > 12) {
        this.currentMonth = 1;
        this.currentYear++;
      }
      this.updatePeriodDisplay();
      this.renderCurrentView(true);
    });

    // 3. Tema Claro / Escuro
    document.getElementById('btnThemeToggle')?.addEventListener('click', () => this.toggleTheme());

    // 4. Sidebar Mobile
    document.getElementById('btnToggleSidebar')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.add('open');
    });
    document.getElementById('btnCloseSidebar')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.remove('open');
    });

    // 5. Fechamento de Modais pelos botões [data-close-modal]
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close-modal');
        this.closeModal(modalId);
      });
    });

    // Fecha modal clicando no overlay externo
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closeModal(overlay.id);
        }
      });
    });

    // ==================== MODAL DE TRANSAÇÃO ====================
    document.getElementById('btnOpenTransactionModal')?.addEventListener('click', () => {
      document.getElementById('formTransaction').reset();
      document.getElementById('txId').value = '';
      document.getElementById('modalTxTitle').textContent = 'Nova Transação';
      
      const now = new Date();
      const monthStr = String(this.currentMonth).padStart(2, '0');
      const dayStr = String(now.getDate()).padStart(2, '0');
      document.getElementById('txDate').value = `${this.currentYear}-${monthStr}-${dayStr}`;

      this.setTransactionTypeTab('expense');
      document.getElementById('installmentRow').style.display = 'flex';

      this.openModal('modalTransaction');
    });

    document.querySelectorAll('.type-tab-btn').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        const type = tabBtn.dataset.txType;
        this.setTransactionTypeTab(type);
      });
    });

    document.getElementById('formTransaction')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('txId').value;
      const type = document.getElementById('txType').value;
      const description = document.getElementById('txDescription').value.trim();
      const amount = parseFloat(document.getElementById('txAmount').value);
      const categoryId = document.getElementById('txCategory').value;
      const accountId = document.getElementById('txAccount').value;
      const date = document.getElementById('txDate').value;
      const status = document.getElementById('txStatus').value;
      const notes = document.getElementById('txNotes').value.trim();
      const installments = parseInt(document.getElementById('txInstallments').value, 10) || 1;

      if (!description || isNaN(amount) || amount <= 0 || !date) {
        UI.showToast('Preencha os campos obrigatórios corretamente.', 'error');
        return;
      }

      if (id) {
        Transactions.update(id, { description, amount, type, categoryId, accountId, date, status, notes });
        UI.showToast('Transação atualizada com sucesso!', 'success');
      } else {
        if (installments > 1 && type === 'expense') {
          Transactions.createInstallments({ description, amount, categoryId, accountId, date, status, notes, installments });
          UI.showToast(`Transação criada em ${installments} parcelas com sucesso!`, 'success');
        } else {
          Transactions.create({ description, amount, type, categoryId, accountId, date, status, notes });
          UI.showToast('Transação registrada com sucesso!', 'success');
        }
      }

      this.closeModal('modalTransaction');
      this.renderCurrentView(false);
    });

    // ==================== MODAL DE TRANSFERÊNCIA ====================
    document.getElementById('btnOpenTransferModal')?.addEventListener('click', () => {
      document.getElementById('formTransfer').reset();
      const now = new Date();
      const monthStr = String(this.currentMonth).padStart(2, '0');
      const dayStr = String(now.getDate()).padStart(2, '0');
      document.getElementById('transferDate').value = `${this.currentYear}-${monthStr}-${dayStr}`;

      UI.populateSelects();
      this.openModal('modalTransfer');
    });

    document.getElementById('formTransfer')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fromAccountId = document.getElementById('transferFrom').value;
      const toAccountId = document.getElementById('transferTo').value;
      const amount = parseFloat(document.getElementById('transferAmount').value);
      const date = document.getElementById('transferDate').value;
      const notes = document.getElementById('transferNotes').value.trim();

      if (fromAccountId === toAccountId) {
        UI.showToast('A conta de origem e destino não podem ser as mesmas.', 'error');
        return;
      }

      if (isNaN(amount) || amount <= 0 || !date) {
        UI.showToast('Informe um valor de transferência válido.', 'error');
        return;
      }

      const result = Accounts.transfer(fromAccountId, toAccountId, amount, date, notes);
      if (result.success) {
        UI.showToast(result.message, 'success');
        this.closeModal('modalTransfer');
        this.renderCurrentView(false);
      } else {
        UI.showToast(result.message, 'error');
      }
    });

    // ==================== MODAL DE CONTA / CARTÃO ====================
    document.getElementById('btnOpenAccountModal')?.addEventListener('click', () => {
      document.getElementById('formAccount').reset();
      document.getElementById('accId').value = '';
      document.getElementById('modalAccountTitle').textContent = 'Nova Conta / Cartão';
      document.getElementById('accColor').value = '#3b82f6';
      document.getElementById('cardDetailsRow').style.display = 'none';
      document.getElementById('accInitialBalance').parentElement.style.display = 'block';
      this.openModal('modalAccount');
    });

    document.getElementById('accType')?.addEventListener('change', (e) => {
      const isCard = e.target.value === 'credit';
      document.getElementById('cardDetailsRow').style.display = isCard ? 'flex' : 'none';
      document.getElementById('accInitialBalance').parentElement.style.display = isCard ? 'none' : 'block';
    });

    document.getElementById('formAccount')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('accId').value;
      const name = document.getElementById('accName').value.trim();
      const type = document.getElementById('accType').value;
      const initialBalance = parseFloat(document.getElementById('accInitialBalance').value) || 0;
      const color = document.getElementById('accColor').value;
      const closingDay = parseInt(document.getElementById('accClosingDay').value, 10) || null;
      const dueDay = parseInt(document.getElementById('accDueDay').value, 10) || null;

      if (!name) {
        UI.showToast('Informe o nome da conta.', 'error');
        return;
      }

      if (id) {
        Accounts.update(id, { name, type, initialBalance, color, closingDay, dueDay });
        UI.showToast('Conta atualizada com sucesso!', 'success');
      } else {
        Accounts.create({ name, type, initialBalance, color, closingDay, dueDay });
        UI.showToast('Conta criada com sucesso!', 'success');
      }

      UI.populateSelects();
      this.closeModal('modalAccount');
      this.renderCurrentView(false);
    });

    // ==================== MODAL DE ORÇAMENTO ====================
    document.getElementById('btnOpenBudgetModal')?.addEventListener('click', () => {
      document.getElementById('formBudget').reset();
      document.getElementById('budgetId').value = '';
      document.getElementById('modalBudgetTitle').textContent = 'Novo Orçamento de Categoria';
      UI.populateSelects();
      this.openModal('modalBudget');
    });

    document.getElementById('formBudget')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('budgetId').value;
      const categoryId = document.getElementById('budgetCategory').value;
      const monthlyLimit = parseFloat(document.getElementById('budgetLimit').value);

      if (!categoryId || isNaN(monthlyLimit) || monthlyLimit <= 0) {
        UI.showToast('Preencha os campos do orçamento corretamente.', 'error');
        return;
      }

      if (id) {
        Budgets.update(id, { categoryId, monthlyLimit });
        UI.showToast('Orçamento atualizado!', 'success');
      } else {
        Budgets.create({ categoryId, monthlyLimit });
        UI.showToast('Orçamento definido com sucesso!', 'success');
      }

      this.closeModal('modalBudget');
      this.renderCurrentView(false);
    });

    // ==================== MODAL DE META ====================
    document.getElementById('btnOpenGoalModal')?.addEventListener('click', () => {
      document.getElementById('formGoal').reset();
      document.getElementById('goalId').value = '';
      document.getElementById('modalGoalTitle').textContent = 'Nova Meta de Economia';
      document.getElementById('goalColor').value = '#10b981';
      this.openModal('modalGoal');
    });

    document.getElementById('formGoal')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('goalId').value;
      const title = document.getElementById('goalTitle').value.trim();
      const targetAmount = parseFloat(document.getElementById('goalTargetAmount').value);
      const currentAmount = parseFloat(document.getElementById('goalCurrentAmount').value) || 0;
      const deadline = document.getElementById('goalDeadline').value;
      const color = document.getElementById('goalColor').value;

      if (!title || isNaN(targetAmount) || targetAmount <= 0) {
        UI.showToast('Preencha os dados da meta corretamente.', 'error');
        return;
      }

      if (id) {
        Goals.update(id, { title, targetAmount, currentAmount, deadline, color });
        UI.showToast('Meta atualizada!', 'success');
      } else {
        Goals.create({ title, targetAmount, currentAmount, deadline, color });
        UI.showToast('Meta criada com sucesso!', 'success');
      }

      this.closeModal('modalGoal');
      this.renderCurrentView(false);
    });

    // ==================== MODAL DE APORTE EM META ====================
    document.getElementById('formGoalDeposit')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const goalId = document.getElementById('depositGoalId').value;
      const amount = parseFloat(document.getElementById('depositAmount').value);

      if (isNaN(amount) || amount <= 0) {
        UI.showToast('Informe um valor de aporte válido.', 'error');
        return;
      }

      const res = Goals.deposit(goalId, amount);
      if (res.success) {
        UI.showToast(res.message, 'success');
        this.closeModal('modalGoalDeposit');
        this.renderCurrentView(false);
      } else {
        UI.showToast(res.message, 'error');
      }
    });

    // ==================== DELEGAÇÃO DE EVENTOS PARA AÇÕES NA TABELA ====================
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const id = btn.dataset.id;

      // Alternar status pago/pendente com 1 clique
      if (action === 'toggle-tx-status') {
        const tx = Transactions.toggleStatus(id);
        if (tx) {
          UI.showToast(`Transação marcada como ${tx.status === 'paid' ? 'Paga' : 'Pendente'}.`, 'success');
          this.renderCurrentView(false);
        }
      }

      // Excluir Transação
      if (action === 'delete-tx') {
        if (confirm('Deseja realmente excluir esta transação?')) {
          Transactions.delete(id);
          UI.showToast('Transação excluída.', 'info');
          this.renderCurrentView(false);
        }
      }

      // Editar Transação
      if (action === 'edit-tx') {
        const tx = Transactions.getById(id);
        if (tx) {
          document.getElementById('txId').value = tx.id;
          document.getElementById('txDescription').value = tx.description;
          document.getElementById('txAmount').value = tx.amount;
          document.getElementById('txCategory').value = tx.categoryId;
          document.getElementById('txAccount').value = tx.accountId;
          document.getElementById('txDate').value = tx.date;
          document.getElementById('txStatus').value = tx.status;
          document.getElementById('txNotes').value = tx.notes || '';
          this.setTransactionTypeTab(tx.type);
          document.getElementById('installmentRow').style.display = 'none';
          document.getElementById('modalTxTitle').textContent = 'Editar Transação';
          this.openModal('modalTransaction');
        }
      }

      // Excluir Conta
      if (action === 'delete-account') {
        if (confirm('Deseja realmente excluir esta conta?')) {
          Accounts.delete(id);
          UI.populateSelects();
          UI.showToast('Conta excluída.', 'info');
          this.renderCurrentView(false);
        }
      }

      // Excluir Orçamento
      if (action === 'delete-budget') {
        if (confirm('Deseja excluir este orçamento de categoria?')) {
          Budgets.delete(id);
          UI.showToast('Orçamento excluído.', 'info');
          this.renderCurrentView(false);
        }
      }

      // Excluir Meta
      if (action === 'delete-goal') {
        if (confirm('Deseja excluir esta meta?')) {
          Goals.delete(id);
          UI.showToast('Meta excluída.', 'info');
          this.renderCurrentView(false);
        }
      }

      // Abrir modal de Aporte na Meta
      if (action === 'deposit-goal') {
        const goal = Goals.getById(id);
        if (goal) {
          document.getElementById('depositGoalId').value = goal.id;
          document.getElementById('depositAmount').value = '';
          document.getElementById('depositGoalInfo').innerHTML = `
            <div style="background-color: var(--bg-surface-subtle); padding: 0.85rem; border-radius: var(--radius-md); margin-bottom: 1rem;">
              <strong>${goal.title}</strong>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
                Saldo atual: ${UI.formatCurrency(goal.currentAmount)} / Alvo: ${UI.formatCurrency(goal.targetAmount)}
              </div>
            </div>
          `;
          this.openModal('modalGoalDeposit');
        }
      }
    });

    // ==================== FILTROS DE TRANSAÇÕES ====================
    const searchInput = document.getElementById('txSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filters.search = e.target.value;
        UI.renderTransactions(this.currentYear, this.currentMonth, this.filters);
      });
    }

    ['txFilterType', 'txFilterCategory', 'txFilterAccount', 'txFilterStatus'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => {
          this.filters.type = document.getElementById('txFilterType').value;
          this.filters.categoryId = document.getElementById('txFilterCategory').value;
          this.filters.accountId = document.getElementById('txFilterAccount').value;
          this.filters.status = document.getElementById('txFilterStatus').value;
          UI.renderTransactions(this.currentYear, this.currentMonth, this.filters);
        });
      }
    });

    document.getElementById('btnResetFilters')?.addEventListener('click', () => {
      document.getElementById('txSearchInput').value = '';
      document.getElementById('txFilterType').value = 'all';
      document.getElementById('txFilterCategory').value = 'all';
      document.getElementById('txFilterAccount').value = 'all';
      document.getElementById('txFilterStatus').value = 'all';
      this.filters = { search: '', type: 'all', categoryId: 'all', accountId: 'all', status: 'all' };
      UI.renderTransactions(this.currentYear, this.currentMonth, this.filters);
    });

    // ==================== CONFIGURAÇÕES & BACKUP ====================
    document.getElementById('btnExportJSON')?.addEventListener('click', () => {
      Storage.exportBackupJSON();
      UI.showToast('Backup JSON exportado com sucesso!', 'success');
    });

    document.getElementById('btnExportCSV')?.addEventListener('click', () => {
      Storage.exportTransactionsCSV();
      UI.showToast('Extrato CSV gerado com sucesso!', 'success');
    });

    document.getElementById('btnTriggerImportJSON')?.addEventListener('click', () => {
      document.getElementById('inputImportJSON').click();
    });

    document.getElementById('inputImportJSON')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = Storage.importBackupJSON(event.target.result);
        if (result.success) {
          UI.showToast(result.message, 'success');
          UI.populateSelects();
          this.renderCurrentView(true);
        } else {
          UI.showToast(result.message, 'error');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    document.getElementById('btnLoadDemoData')?.addEventListener('click', () => {
      if (confirm('Deseja recarregar os dados de demonstração? Isso substituirá os registros atuais.')) {
        Storage.loadDemoData();
        UI.populateSelects();
        this.renderCurrentView(true);
        UI.showToast('Dados de demonstração carregados com sucesso!', 'success');
      }
    });

    document.getElementById('btnResetAllData')?.addEventListener('click', () => {
      if (confirm('ATENÇÃO: Deseja realmente zerar os dados desta conta? Essa ação não pode ser desfeita.')) {
        Storage.resetAllData();
        Storage.init();
        UI.populateSelects();
        this.renderCurrentView(true);
        UI.showToast('Todos os dados da conta foram resetados.', 'info');
      }
    });
  }

  // Auxiliar para alternar o tipo no modal de transação
  setTransactionTypeTab(type) {
    document.getElementById('txType').value = type;
    document.querySelectorAll('.type-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.txType === type);
    });

    const categories = Storage.getCategories();
    const filteredCategories = categories.filter(c => c.type === type);
    const select = document.getElementById('txCategory');
    if (select) {
      select.innerHTML = filteredCategories.map(c => `
        <option value="${c.id}">${c.name}</option>
      `).join('');
    }
  }
}

// Inicializa a aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
  window.controlDinApp = app;
  window.finTrackApp = app; // Alias para compatibilidade
});
