/**
 * Control DIN - Charts Service with Smooth Motion Principles (js/charts.js)
 * Renderizador de gráficos interativos com HTML5 Canvas nativo, suporte a Retina/DPI
 * e animações fluidas via requestAnimationFrame com interpolação suave.
 */

let activeCashFlowAnimationId = null;
let activeDonutAnimationId = null;

// Easing natural (Ease-Out Cubic)
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

const Charts = {
  // Gráfico de Fluxo Financeiro com Animação de Crescimento Suave
  renderCashFlow(canvasId, monthsData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (activeCashFlowAnimationId) {
      cancelAnimationFrame(activeCashFlowAnimationId);
      activeCashFlowAnimationId = null;
    }

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 500;
    const height = 260;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    if (!monthsData || monthsData.length === 0) {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Nenhum dado financeiro para exibir', width / 2, height / 2);
      return;
    }

    const padding = { top: 30, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Valor máximo para a escala
    let maxVal = 0;
    monthsData.forEach(d => {
      if (d.income > maxVal) maxVal = d.income;
      if (d.expense > maxVal) maxVal = d.expense;
    });

    if (maxVal === 0) maxVal = 1000;
    maxVal = Math.ceil(maxVal * 1.15); // margem de respiro no topo

    const animationDuration = 550; // ms
    let startTime = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / animationDuration);
      const easeProgress = easeOutCubic(progress);

      ctx.clearRect(0, 0, width, height);

      // Gridlines horizontais
      const gridLines = 4;
      ctx.lineWidth = 1;
      ctx.strokeStyle = document.body.classList.contains('theme-dark') ? '#1e293b' : '#f1f5f9';
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';

      for (let i = 0; i <= gridLines; i++) {
        const y = padding.top + (chartHeight / gridLines) * i;
        const val = maxVal - (maxVal / gridLines) * i;

        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        ctx.fillText(formatShortBRL(val), padding.left - 8, y + 4);
      }

      // Desenhar Barras Animadas de Receitas e Despesas
      const groupWidth = chartWidth / monthsData.length;
      const barWidth = Math.min(22, groupWidth * 0.32);
      const spacing = 4;

      monthsData.forEach((d, idx) => {
        const groupCenterX = padding.left + groupWidth * idx + groupWidth / 2;

        // Barra de Receita (Verde animada)
        const targetIncomeHeight = (d.income / maxVal) * chartHeight;
        const currentIncomeHeight = targetIncomeHeight * easeProgress;
        const incomeX = groupCenterX - barWidth - spacing / 2;
        const incomeY = padding.top + chartHeight - currentIncomeHeight;

        ctx.fillStyle = '#10b981';
        drawRoundedRect(ctx, incomeX, incomeY, barWidth, currentIncomeHeight, 4);

        // Barra de Despesa (Vermelho animada)
        const targetExpenseHeight = (d.expense / maxVal) * chartHeight;
        const currentExpenseHeight = targetExpenseHeight * easeProgress;
        const expenseX = groupCenterX + spacing / 2;
        const expenseY = padding.top + chartHeight - currentExpenseHeight;

        ctx.fillStyle = '#ef4444';
        drawRoundedRect(ctx, expenseX, expenseY, barWidth, currentExpenseHeight, 4);

        // Label do Mês
        ctx.fillStyle = document.body.classList.contains('theme-dark') ? '#94a3b8' : '#475569';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(d.label, groupCenterX, height - padding.bottom + 20);
      });

      // Legenda no topo
      drawChartLegend(ctx, width - padding.right, 14);

      if (progress < 1) {
        activeCashFlowAnimationId = requestAnimationFrame(animate);
      } else {
        activeCashFlowAnimationId = null;
      }
    };

    activeCashFlowAnimationId = requestAnimationFrame(animate);
  },

  // Gráfico Donut de Despesas com Animação Radial Suave
  renderCategoryDonut(canvasId, legendId, categoriesData) {
    const canvas = document.getElementById(canvasId);
    const legendContainer = document.getElementById(legendId);
    if (!canvas || !legendContainer) return;

    if (activeDonutAnimationId) {
      cancelAnimationFrame(activeDonutAnimationId);
      activeDonutAnimationId = null;
    }

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 200;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const totalExpense = categoriesData.reduce((sum, c) => sum + c.amount, 0);

    if (totalExpense === 0 || categoriesData.length === 0) {
      ctx.clearRect(0, 0, size, size);
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, 75, 0, 2 * Math.PI);
      ctx.strokeStyle = document.body.classList.contains('theme-dark') ? '#1e293b' : '#e2e8f0';
      ctx.lineWidth = 26;
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Sem gastos no mês', size / 2, size / 2 + 4);

      legendContainer.innerHTML = '<p class="text-muted text-center" style="font-size: 0.8rem; padding: 1rem;">Nenhuma despesa registrada para o período selecionado.</p>';
      return;
    }

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = 70;
    const lineWidth = 24;

    const animationDuration = 600; // ms
    let startTime = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / animationDuration);
      const easeProgress = easeOutCubic(progress);

      ctx.clearRect(0, 0, size, size);

      let startAngle = -Math.PI / 2;
      const totalAvailableSweep = 2 * Math.PI * easeProgress;

      categoriesData.forEach(cat => {
        const fullSliceAngle = (cat.amount / totalExpense) * (2 * Math.PI);
        const currentSliceAngle = (cat.amount / totalExpense) * totalAvailableSweep;
        const endAngle = startAngle + currentSliceAngle;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.strokeStyle = cat.color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'butt';
        ctx.stroke();

        startAngle = endAngle;
      });

      // Texto no Centro do Donut com Fade-in
      ctx.save();
      ctx.globalAlpha = easeProgress;
      ctx.fillStyle = document.body.classList.contains('theme-dark') ? '#f8fafc' : '#0f172a';
      ctx.font = 'bold 15px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(formatBRL(totalExpense), centerX, centerY + 2);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText('Total Gasto', centerX, centerY - 16);
      ctx.restore();

      if (progress < 1) {
        activeDonutAnimationId = requestAnimationFrame(animate);
      } else {
        activeDonutAnimationId = null;
      }
    };

    activeDonutAnimationId = requestAnimationFrame(animate);

    // Renderizar Lista de Legenda com animação escalonada
    legendContainer.innerHTML = categoriesData.map((c, idx) => `
      <div class="legend-item stagger-item" style="--item-index: ${idx}">
        <div class="legend-left">
          <span class="legend-color-dot" style="background-color: ${c.color}"></span>
          <span class="legend-name">${c.name}</span>
        </div>
        <div class="legend-right">
          <span class="legend-amount">${formatBRL(c.amount)}</span>
          <span class="text-muted" style="font-size: 0.75rem; margin-left: 4px;">(${c.percentage.toFixed(0)}%)</span>
        </div>
      </div>
    `).join('');
  }
};

// Funções auxiliares
function drawRoundedRect(ctx, x, y, width, height, radius) {
  if (height <= 0) return;
  if (height < radius) radius = height;
  ctx.beginPath();
  ctx.moveTo(x, y + height);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height);
  ctx.closePath();
  ctx.fill();
}

function drawChartLegend(ctx, rightX, y) {
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'left';

  // Despesas
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(rightX - 70, y - 9, 10, 10);
  ctx.fillStyle = '#64748b';
  ctx.fillText('Despesas', rightX - 55, y);

  // Receitas
  ctx.fillStyle = '#10b981';
  ctx.fillRect(rightX - 150, y - 9, 10, 10);
  ctx.fillStyle = '#64748b';
  ctx.fillText('Receitas', rightX - 135, y);
}

function formatBRL(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
}

function formatShortBRL(val) {
  if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `R$ ${(val / 1000).toFixed(0)}k`;
  return `R$ ${val.toFixed(0)}`;
}

window.Charts = Charts;
