<#
.SYNOPSIS
    Script automatizado para criar as Issues do projeto Control DIN no GitHub via GitHub CLI (gh).
.DESCRIPTION
    Lê o catálogo de issues em .github/issues/ e as publica no repositório remoto.
.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .github/create_issues.ps1
#>

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " 🚀 Control DIN - Criador Automático de GitHub Issues" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# Garante que os caminhos padrão do GitHub CLI e Git estejam no PATH desta sessão
$extraPaths = @("C:\Program Files\GitHub CLI", "C:\Program Files\Git\cmd", "C:\Program Files\Git\bin", "$env:LOCALAPPDATA\Programs\GitHub CLI")
foreach ($p in $extraPaths) {
    if ((Test-Path $p) -and ($env:PATH -notlike "*$p*")) {
        $env:PATH = "$p;$env:PATH"
    }
}

# Verifica se o GitHub CLI (gh) está instalado
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ GitHub CLI (gh) não foi encontrado." -ForegroundColor Yellow
    Write-Host "💡 Instale o GitHub CLI com: winget install --id GitHub.cli" -ForegroundColor White
    exit 0
}

# Verifica se está autenticado no GitHub
& gh auth status 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Você precisa conectar sua conta do GitHub primeiro." -ForegroundColor Yellow
    Write-Host "👉 Execute: gh auth login" -ForegroundColor Cyan
    exit 1
}

$issues = @(
    @{
        Title = "[Feature] Sistema de Autenticação Segura, Validação de E-mail e Multi-tenancy Local (#01)"
        BodyFile = ".github/issues/issue-01-auth-email-validation.md"
        Labels = "enhancement,security"
    },
    @{
        Title = "[Security] Criptografia de Credenciais com Salt (Web Crypto API) e Rate Limiting (#02)"
        BodyFile = ".github/issues/issue-02-crypto-security-rate-limiting.md"
        Labels = "security,enhancement"
    },
    @{
        Title = "[Feature] Fluxo de Verificação de E-mail (Token 6 Dígitos) e Recuperação de Senha (#03)"
        BodyFile = ".github/issues/issue-03-email-verification-password-reset.md"
        Labels = "enhancement"
    },
    @{
        Title = "[Enhancement] Isolamento de Dados Multi-tenant por Usuário e Gestão de Perfil (#04)"
        BodyFile = ".github/issues/issue-04-multi-tenant-user-profile.md"
        Labels = "enhancement"
    }
)

foreach ($item in $issues) {
    Write-Host "Criando Issue: $($item.Title)..." -ForegroundColor Green
    if (Test-Path $item.BodyFile) {
        gh issue create --title $item.Title --body-file $item.BodyFile
    } else {
        gh issue create --title $item.Title --body "Consulte a documentação em $($item.BodyFile)"
    }
}

Write-Host "✅ Todas as issues foram processadas com sucesso!" -ForegroundColor Green
