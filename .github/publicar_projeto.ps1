<#
.SYNOPSIS
    Publicador completo com 1 clique para o GitHub (Control DIN).
.DESCRIPTION
    1. Detecta e carrega o Git e GitHub CLI (gh).
    2. Conecta à sua conta do GitHub via navegador (se ainda não conectado).
    3. Inicializa o Git localmente e faz o primeiro commit.
    4. Cria o repositório no seu GitHub e envia todos os arquivos (push).
    5. Publica automaticamente todas as Issues especificadas em .github/issues/.
.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .github/publicar_projeto.ps1
#>

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " 🚀 Control DIN - Publicador Automático no GitHub" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Carrega os caminhos do Git e GitHub CLI
$extraPaths = @("C:\Program Files\GitHub CLI", "C:\Program Files\Git\cmd", "C:\Program Files\Git\bin", "$env:LOCALAPPDATA\Programs\GitHub CLI")
foreach ($p in $extraPaths) {
    if ((Test-Path $p) -and ($env:PATH -notlike "*$p*")) {
        $env:PATH = "$p;$env:PATH"
    }
}

# 2. Verifica autenticação no GitHub CLI
Write-Host "`n[1/4] Verificando conexão com sua conta do GitHub..." -ForegroundColor Yellow
& gh auth status 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "👉 Conectando ao GitHub... Siga as instruções rápidas na tela/navegador:" -ForegroundColor Cyan
    & gh auth login --web -p https
}

# 3. Inicializa o Git localmente
Write-Host "`n[2/4] Preparando os arquivos locais no Git..." -ForegroundColor Yellow
if (-not (Test-Path ".git")) {
    & git init
}

& git add .
& git commit -m "feat(#01): implementa sistema de controle financeiro com autenticacao segura, validacao de email e governanca" -q
& git branch -M main

# 4. Cria e publica o repositório no GitHub
Write-Host "`n[3/4] Criando repositório e enviando arquivos para o GitHub..." -ForegroundColor Yellow
& gh repo create "sistema-controle-financeiro" --public --source=. --remote=origin --push 2>$null
if ($LASTEXITCODE -ne 0) {
    # Caso o repositório já exista, faz apenas o push
    & git push -u origin main
}

# 5. Publica todas as Issues
Write-Host "`n[4/4] Publicando as Issues cadastradas no GitHub..." -ForegroundColor Yellow
& powershell -ExecutionPolicy Bypass -File ".github/create_issues.ps1"

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host " 🎉 PARABÉNS! Seu projeto e todas as issues estão no ar!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
