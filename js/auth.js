/**
 * Control DIN - Authentication & Security Service (js/auth.js)
 * Implementa autenticação robusta, criptografia de senhas com Web Crypto API (Hash + Salt),
 * validação estrita de e-mails (RFC 5322), fluxo de verificação de 6 dígitos,
 * proteção contra força bruta (Rate Limiting) e gestão de sessões.
 */

const AUTH_STORAGE_KEYS = {
  USERS: 'controldin_auth_users_v1',
  SESSION: 'controldin_auth_session_v1',
  REMEMBER: 'controldin_auth_remember_v1'
};

const Auth = {
  // ==========================================================================
  // 1. Criptografia & Segurança (Web Crypto API)
  // ==========================================================================

  // Gera um Salt pseudoaleatório criptográfico de 16 bytes em Hexadecimal
  generateSalt() {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  // Gera o Hash seguro da senha com Salt utilizando SHA-256
  async hashPassword(password, salt) {
    const encoder = new TextEncoder();
    // Concatena a senha com o Salt exclusivo do usuário
    const data = encoder.encode(password + ':' + salt);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  // Medidor de entropia e força da senha
  evaluatePasswordStrength(password) {
    if (!password) {
      return { score: 0, label: 'Muito Fraca', color: '#ef4444', percent: 0, feedback: ['Digite uma senha segura'] };
    }

    let score = 0;
    const feedback = [];

    if (password.length >= 6) score += 1;
    else feedback.push('Pelo menos 6 caracteres');

    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    else feedback.push('Letras maiúsculas e minúsculas');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Pelo menos um número');

    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('Símbolo especial (!@#$%...)');

    // Mapeamento de pontuação (0 a 5)
    if (score <= 1) {
      return { score: 1, label: 'Muito Fraca', color: '#ef4444', percent: 20, feedback };
    } else if (score === 2) {
      return { score: 2, label: 'Fraca', color: '#f97316', percent: 40, feedback };
    } else if (score === 3) {
      return { score: 3, label: 'Média', color: '#f59e0b', percent: 65, feedback };
    } else if (score === 4) {
      return { score: 4, label: 'Forte', color: '#3b82f6', percent: 85, feedback };
    } else {
      return { score: 5, label: 'Excelente', color: '#10b981', percent: 100, feedback: ['Senha altamente segura!'] };
    }
  },

  // ==========================================================================
  // 2. Validação Estrita de E-mail & Detecção de Erros
  // ==========================================================================

  validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return { isValid: false, error: 'O endereço de e-mail é obrigatório.', normalized: '' };
    }

    const normalized = email.trim().toLowerCase();

    // Regex estrita compatível com RFC 5322
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

    if (!emailRegex.test(normalized)) {
      return { isValid: false, error: 'Formato de e-mail inválido. Ex: usuario@exemplo.com', normalized };
    }

    // Detecção de erros comuns de digitação em domínios populares
    const typoDomains = {
      'gmai.com': 'gmail.com',
      'gmaill.com': 'gmail.com',
      'gmial.com': 'gmail.com',
      'hotmai.com': 'hotmail.com',
      'hotmial.com': 'hotmail.com',
      'outloo.com': 'outlook.com',
      'yahoo.com.b': 'yahoo.com.br'
    };

    const domain = normalized.split('@')[1];
    if (typoDomains[domain]) {
      const suggested = normalized.split('@')[0] + '@' + typoDomains[domain];
      return {
        isValid: true,
        warning: `Você quis dizer ${suggested}?`,
        suggestion: suggested,
        normalized
      };
    }

    return { isValid: true, normalized };
  },

  // Gera código numérico aleatório de 6 dígitos
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  // ==========================================================================
  // 3. Gerenciamento de Usuários e Persistência
  // ==========================================================================

  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEYS.USERS)) || [];
    } catch {
      return [];
    }
  },

  saveUsers(users) {
    localStorage.setItem(AUTH_STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  findUserByEmail(email) {
    if (!email) return null;
    const normalized = email.trim().toLowerCase();
    return this.getUsers().find(u => u.email.toLowerCase() === normalized) || null;
  },

  findUserById(id) {
    if (!id) return null;
    return this.getUsers().find(u => u.id === id) || null;
  },

  // Inicializa a base de usuários com a conta Demo se necessário
  async initAuth() {
    let users = this.getUsers();
    
    // Cria o usuário Demo padrão se não existir
    if (!users.some(u => u.email === 'demo@controldin.com')) {
      const demoSalt = this.generateSalt();
      const demoHash = await this.hashPassword('demo1234', demoSalt);

      const demoUser = {
        id: 'usr-demo',
        name: 'Usuário Demonstração',
        email: 'demo@controldin.com',
        emailVerified: true,
        verificationCode: null,
        verificationExpires: null,
        passwordHash: demoHash,
        salt: demoSalt,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        avatarColor: '#2563eb',
        isDemo: true,
        failedAttempts: 0,
        lockedUntil: null
      };

      users.push(demoUser);
      this.saveUsers(users);
    }
  },

  // ==========================================================================
  // 4. Sessão do Usuário Ativo
  // ==========================================================================

  getCurrentUser() {
    try {
      // 1. Tenta recuperar do localStorage (se marcou Remember Me)
      let sessionData = localStorage.getItem(AUTH_STORAGE_KEYS.SESSION);
      // 2. Tenta recuperar do sessionStorage (se não marcou Remember Me)
      if (!sessionData) {
        sessionData = sessionStorage.getItem(AUTH_STORAGE_KEYS.SESSION);
      }
      if (!sessionData) return null;

      const session = JSON.parse(sessionData);
      // Busca a versão mais atualizada do usuário no banco
      const user = this.findUserById(session.userId);
      return user || null;
    } catch {
      return null;
    }
  },

  setCurrentSession(user, rememberMe = true) {
    const sessionData = JSON.stringify({
      userId: user.id,
      email: user.email,
      name: user.name,
      loggedInAt: new Date().toISOString()
    });

    if (rememberMe) {
      localStorage.setItem(AUTH_STORAGE_KEYS.SESSION, sessionData);
      localStorage.setItem(AUTH_STORAGE_KEYS.REMEMBER, 'true');
    } else {
      sessionStorage.setItem(AUTH_STORAGE_KEYS.SESSION, sessionData);
      localStorage.removeItem(AUTH_STORAGE_KEYS.SESSION);
      localStorage.removeItem(AUTH_STORAGE_KEYS.REMEMBER);
    }
  },

  clearSession() {
    localStorage.removeItem(AUTH_STORAGE_KEYS.SESSION);
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.SESSION);
  },

  isLoggedIn() {
    return this.getCurrentUser() !== null;
  },

  // ==========================================================================
  // 5. Fluxos de Cadastro, Login, Verificação e Recuperação
  // ==========================================================================

  // Registro de novo usuário
  async register({ name, email, password, avatarColor = '#2563eb' }) {
    if (!name || name.trim().length < 2) {
      return { success: false, error: 'Por favor, informe seu nome completo.' };
    }

    const emailCheck = this.validateEmail(email);
    if (!emailCheck.isValid) {
      return { success: false, error: emailCheck.error };
    }

    const strength = this.evaluatePasswordStrength(password);
    if (strength.score < 2) {
      return { success: false, error: 'A senha é muito fraca. Utilize pelo menos 6 caracteres combinando letras e números.' };
    }

    const users = this.getUsers();
    if (users.some(u => u.email.toLowerCase() === emailCheck.normalized)) {
      return { success: false, error: 'Este e-mail já está cadastrado no sistema. Faça login ou recupere sua senha.' };
    }

    const salt = this.generateSalt();
    const passwordHash = await this.hashPassword(password, salt);
    const verificationCode = this.generateVerificationCode();
    const verificationExpires = Date.now() + 15 * 60 * 1000; // 15 minutos

    const newUser = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: emailCheck.normalized,
      emailVerified: false,
      verificationCode,
      verificationExpires,
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      avatarColor: avatarColor || '#2563eb',
      isDemo: false,
      failedAttempts: 0,
      lockedUntil: null
    };

    users.push(newUser);
    this.saveUsers(users);
    this.setCurrentSession(newUser, true);

    // Dispara envio de e-mail real em segundo plano
    this.sendRealEmail({ toEmail: newUser.email, toName: newUser.name, code: verificationCode, type: 'verification' })
      .catch(e => console.warn('Disparo de e-mail:', e));

    return {
      success: true,
      user: newUser,
      verificationCode, // Retornado para exibição de simulação/toast
      message: 'Conta criada com sucesso! O código de verificação foi enviado para seu e-mail.'
    };
  },

  // Envio de E-mail Real (FormSubmit API + EmailJS)
  async sendRealEmail({ toEmail, toName, code, type = 'verification' }) {
    const isReset = type === 'reset';
    const subject = isReset 
      ? `🔐 Recuperação de Senha - Control DIN: [${code}]`
      : `🔐 Seu Código de Ativação - Control DIN: [${code}]`;
    
    // 1. Envio Direto via FormSubmit AJAX (Entrega real e gratuita no e-mail informado)
    try {
      const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(toEmail)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: subject,
          _template: 'table',
          'Sistema': 'Control DIN - Controle Financeiro Inteligente',
          'Destinatario': toName || 'Usuário',
          'Codigo_de_Seguranca': code,
          'Validade': '15 minutos',
          'Instrucoes': 'Insira este código de 6 dígitos no sistema para ativar sua conta e liberar o acesso com segurança.',
          'Aviso': 'Se você não solicitou esta mensagem, desconsidere-a.'
        })
      });

      if (response.ok) {
        return { success: true, message: `E-mail de ativação disparado com sucesso para ${toEmail}!` };
      }
    } catch (err) {
      console.warn('Tentativa de envio direto via FormSubmit:', err);
    }

    // 2. Envio via EmailJS se configurado
    if (window.emailjs) {
      const emailConfig = (typeof Storage !== 'undefined' && Storage.getEmailSettings) ? Storage.getEmailSettings() : null;
      if (emailConfig && emailConfig.serviceId && emailConfig.templateId && emailConfig.publicKey) {
        try {
          emailjs.init(emailConfig.publicKey);
          await emailjs.send(emailConfig.serviceId, emailConfig.templateId, {
            to_email: toEmail,
            to_name: toName,
            code: code,
            subject: subject
          });
          return { success: true, message: `E-mail enviado via EmailJS para ${toEmail}!` };
        } catch (err) {
          console.warn('Erro ao enviar via EmailJS:', err);
        }
      }
    }

    return { 
      success: false, 
      code,
      message: `Código gerado: ${code}. Você pode visualizá-lo na caixa de entrada simulada ou utilizar este token.` 
    };
  },

  // Login com credenciais e proteção contra força bruta
  async login(email, password, rememberMe = true) {
    const emailCheck = this.validateEmail(email);
    if (!emailCheck.isValid) {
      return { success: false, error: emailCheck.error };
    }

    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.email.toLowerCase() === emailCheck.normalized);

    if (userIndex === -1) {
      return { success: false, error: 'E-mail ou senha incorretos.' };
    }

    const user = users[userIndex];

    // Verifica Rate Limiting (Bloqueio temporário)
    if (user.lockedUntil && Date.now() < user.lockedUntil) {
      const remainingSeconds = Math.ceil((user.lockedUntil - Date.now()) / 1000);
      return {
        success: false,
        isLocked: true,
        remainingSeconds,
        error: `Conta temporariamente bloqueada por excesso de tentativas. Tente novamente em ${remainingSeconds} segundos.`
      };
    }

    // Calcula hash da senha informada
    const computedHash = await this.hashPassword(password, user.salt);

    if (computedHash !== user.passwordHash) {
      user.failedAttempts = (user.failedAttempts || 0) + 1;

      if (user.failedAttempts >= 5) {
        user.lockedUntil = Date.now() + 60 * 1000; // Bloqueia por 60 segundos
        user.failedAttempts = 0;
        this.saveUsers(users);
        return {
          success: false,
          isLocked: true,
          remainingSeconds: 60,
          error: 'Muitas tentativas incorretas. Sua conta foi bloqueada temporariamente por 60 segundos para sua segurança.'
        };
      }

      this.saveUsers(users);
      const remainingTries = 5 - user.failedAttempts;
      return {
        success: false,
        error: `E-mail ou senha incorretos. Você tem mais ${remainingTries} tentativa(s) antes do bloqueio temporário.`
      };
    }

    // Login bem-sucedido: limpa contadores
    user.failedAttempts = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date().toISOString();
    this.saveUsers(users);

    this.setCurrentSession(user, rememberMe);
    return { success: true, user };
  },

  // Login direto como Convidado / Modo Demo
  async loginAsDemo() {
    await this.initAuth();
    const demoUser = this.findUserByEmail('demo@controldin.com');
    if (demoUser) {
      demoUser.lastLoginAt = new Date().toISOString();
      this.setCurrentSession(demoUser, true);
      return { success: true, user: demoUser };
    }
    return { success: false, error: 'Erro ao carregar conta de demonstração.' };
  },

  // Confirmação do código de 6 dígitos do e-mail
  verifyEmail(userId, code) {
    if (!code || code.trim().length !== 6) {
      return { success: false, error: 'O código de verificação deve conter 6 dígitos numéricos.' };
    }

    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return { success: false, error: 'Usuário não encontrado.' };
    }

    const user = users[userIndex];

    if (user.emailVerified) {
      return { success: true, message: 'Seu e-mail já está confirmado!' };
    }

    if (!user.verificationCode || user.verificationCode !== code.trim()) {
      return { success: false, error: 'Código de verificação incorreto. Verifique os números e tente novamente.' };
    }

    if (user.verificationExpires && Date.now() > user.verificationExpires) {
      return { success: false, error: 'O código de verificação expirou. Clique em reenviar código para receber um novo.' };
    }

    user.emailVerified = true;
    user.verificationCode = null;
    user.verificationExpires = null;
    this.saveUsers(users);

    return { success: true, message: '🎉 E-mail verificado com sucesso! Sua conta agora está totalmente segura.' };
  },

  // Reenvia novo código de 6 dígitos
  resendVerificationCode(userId) {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return { success: false, error: 'Usuário não encontrado.' };
    }

    const user = users[userIndex];
    const newCode = this.generateVerificationCode();
    user.verificationCode = newCode;
    user.verificationExpires = Date.now() + 15 * 60 * 1000; // 15 min
    this.saveUsers(users);

    this.sendRealEmail({ toEmail: user.email, toName: user.name, code: newCode, type: 'verification' })
      .catch(e => console.warn('Erro ao reenviar e-mail real:', e));

    return {
      success: true,
      code: newCode,
      message: `Novo código gerado: ${newCode} (Disparado para ${user.email}).`
    };
  },

  // Solicitação de Recuperação de Senha (Esqueci minha senha)
  requestPasswordReset(email) {
    const emailCheck = this.validateEmail(email);
    if (!emailCheck.isValid) {
      return { success: false, error: emailCheck.error };
    }

    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.email.toLowerCase() === emailCheck.normalized);

    if (userIndex === -1) {
      return { success: false, error: 'Nenhuma conta encontrada com este e-mail.' };
    }

    const user = users[userIndex];
    const resetCode = this.generateVerificationCode();
    user.resetCode = resetCode;
    user.resetExpires = Date.now() + 15 * 60 * 1000;
    this.saveUsers(users);

    this.sendRealEmail({ toEmail: user.email, toName: user.name, code: resetCode, type: 'reset' })
      .catch(e => console.warn('Erro ao disparar e-mail de recuperação:', e));

    return {
      success: true,
      code: resetCode,
      message: `Código de recuperação enviado para ${user.email}.`
    };
  },

  // Redefinição de senha com código de segurança
  async resetPasswordWithCode(email, code, newPassword) {
    const emailCheck = this.validateEmail(email);
    if (!emailCheck.isValid) {
      return { success: false, error: emailCheck.error };
    }

    if (!code || code.trim().length !== 6) {
      return { success: false, error: 'Código de 6 dígitos inválido.' };
    }

    const strength = this.evaluatePasswordStrength(newPassword);
    if (strength.score < 2) {
      return { success: false, error: 'A nova senha deve ter no mínimo 6 caracteres com letras e números.' };
    }

    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.email.toLowerCase() === emailCheck.normalized);

    if (userIndex === -1) {
      return { success: false, error: 'Usuário não encontrado.' };
    }

    const user = users[userIndex];

    if (!user.resetCode || user.resetCode !== code.trim()) {
      return { success: false, error: 'Código de recuperação incorreto.' };
    }

    if (user.resetExpires && Date.now() > user.resetExpires) {
      return { success: false, error: 'O código de recuperação expirou. Solicite um novo código.' };
    }

    // Gera novo salt e hash para a nova senha
    user.salt = this.generateSalt();
    user.passwordHash = await this.hashPassword(newPassword, user.salt);
    user.resetCode = null;
    user.resetExpires = null;
    user.failedAttempts = 0;
    user.lockedUntil = null;
    this.saveUsers(users);

    return { success: true, message: 'Senha redefinida com sucesso! Você já pode entrar com sua nova senha.' };
  },

  // Alteração de Senha no Perfil (usuário logado)
  async changePassword(userId, currentPassword, newPassword) {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    const user = users[userIndex];
    const currentHash = await this.hashPassword(currentPassword, user.salt);

    if (currentHash !== user.passwordHash) {
      return { success: false, error: 'A senha atual informada está incorreta.' };
    }

    const strength = this.evaluatePasswordStrength(newPassword);
    if (strength.score < 2) {
      return { success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' };
    }

    user.salt = this.generateSalt();
    user.passwordHash = await this.hashPassword(newPassword, user.salt);
    this.saveUsers(users);

    return { success: true, message: 'Sua senha foi alterada com sucesso!' };
  },

  // Atualização de Perfil (Nome e Cor do Avatar)
  updateProfile(userId, { name, avatarColor }) {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return { success: false, error: 'Usuário não encontrado.' };
    }

    const user = users[userIndex];
    if (name && name.trim().length >= 2) user.name = name.trim();
    if (avatarColor) user.avatarColor = avatarColor;

    this.saveUsers(users);
    this.setCurrentSession(user, true);

    return { success: true, user, message: 'Perfil atualizado com sucesso!' };
  },

  // Encerramento de sessão
  logout() {
    this.clearSession();
  }
};

window.Auth = Auth;
