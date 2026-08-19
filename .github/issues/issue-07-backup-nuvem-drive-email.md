# Issue #07: [Funcionalidade] Backup na Nuvem, Envio para E-mail (Outlook/Hotmail), Google Drive e Restauração Inteligente

## 📌 Contexto & Objetivo
Implementar uma central completa e prática de **Backup e Sincronização em Nuvem Pessoal**, permitindo ao usuário proteger suas informações financeiras com 1 clique sem depender de configurações complexas de servidores ou bancos de dados externos.

---

## 🎯 Requisitos & Funcionalidades
1. **Envio de Backup para E-mail (Outlook / Hotmail / Gmail)**:
   - Botão rápido para envio de relatório consolidado (saldos, receitas, despesas, contas e metas) e bloco JSON de dados direto para o e-mail do usuário.
2. **Integração com Google Drive / Web Share API**:
   - Geração de arquivo padronizado (`ControlDIN_Backup_YYYY-MM-DD.json`) e compartilhamento via Web Share API para salvar no Google Drive, OneDrive ou pastas do sistema operacional.
3. **Download Rápido em JSON e Extrato CSV**:
   - Cópia de segurança completa em JSON e extrato estruturado para Microsoft Excel / Google Planilhas.
4. **Restauração Inteligente com Drag-and-Drop**:
   - Zona de arrastar e soltar arquivos `.json` com pré-visualização instantânea das estatísticas (transações, contas, metas e data) antes de confirmar.
   - Opções de restauração: **Substituir** ou **Mesclar**.
5. **Rastreamento de Status do Último Backup**:
   - Gravação e exibição da data e hora da última cópia de segurança realizada.

---

## 🧪 Critérios de Aceite
- [x] O usuário consegue enviar o backup completo e o resumo financeiro para o seu e-mail cadastrado.
- [x] O usuário consegue compartilhar/salvar o arquivo de backup no Google Drive ou baixá-lo em formato `.json`.
- [x] A restauração por drag-and-drop valida a integridade do arquivo e exibe pré-visualização antes da aplicação.
- [x] O status do último backup é atualizado e exibido no modal.

---

## 🔗 Vínculo com Pull Request
- **Branch**: `feat/issue-07-backup-nuvem-drive-email`
- **Comando no PR**: `Closes #07`
