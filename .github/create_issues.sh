#!/usr/bin/env bash
# ==============================================================================
# Script automatizado para criação de issues do Control DIN no GitHub via CLI
# ==============================================================================

echo "🚀 Control DIN - Criando Issues no GitHub..."

if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) não instalado. Instale em https://cli.github.com/ ou use os arquivos em .github/issues/"
    exit 0
fi

declare -a ISSUES=(
    "[Feature] Sistema de Autenticação Segura, Validação de E-mail e Multi-tenancy Local (#01)|.github/issues/issue-01-auth-email-validation.md"
    "[Security] Criptografia de Credenciais com Salt (Web Crypto API) e Rate Limiting (#02)|.github/issues/issue-02-crypto-security-rate-limiting.md"
    "[Feature] Fluxo de Verificação de E-mail (Token 6 Dígitos) e Recuperação de Senha (#03)|.github/issues/issue-03-email-verification-password-reset.md"
    "[Enhancement] Isolamento de Dados Multi-tenant por Usuário e Gestão de Perfil (#04)|.github/issues/issue-04-multi-tenant-user-profile.md"
)

for item in "${ISSUES[@]}"; do
    IFS="|" read -r title file <<< "$item"
    echo "Criando: $title..."
    if [ -f "$file" ]; then
        gh issue create --title "$title" --body-file "$file"
    else
        gh issue create --title "$title" --body "Consulte a documentação em $file"
    fi
done

echo "✅ Concluído com sucesso!"
