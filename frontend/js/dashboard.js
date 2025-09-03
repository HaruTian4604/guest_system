// dashboard.js
// 全局存储所有图表实例
const chartInstances = {};

/**
 * 将 API 数据转为 {labels, data} 的帮助函数
 * @param {Array<{month:string,count:number}|{label:string,count:number}>} items
 * @param {Object} opt
 * @returns {{labels: string[], data: number[]}}
 */
function toLabelsAndData(items = [], opt = {}) {
  const fmtMonth = (s) => {
    // 允许 "YYYY-MM" 或 Date 格式
    if (!s) return '';
    if (/^\d{4}-\d{2}$/.test(s)) {
      const [y, m] = s.split('-');
      return `${y}-${m}`;
    }
    const d = new Date(s);
    if (isNaN(d)) return String(s);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  };
  const useMonth = !!opt.month;
  const labels = [];
  const data = [];
  for (const it of items) {
    const lb = useMonth ? fmtMonth(it.month) : (it.label ?? '');
    labels.push(lb);
    data.push(Number(it.count || 0));
  }
  return { labels, data };
}


/**
 * 通用图表配置
 * @param {Object} config - 图表配置
 * @param {string} config.canvasId - canvas元素ID
 * @param {string} config.apiEndpoint - API端点
 * @param {string} config.chartName - 图表名称（用于错误提示）
 * @param {string} config.chartType - 图表类型（doughnut, bar等）
 * @param {Array} config.labels - 标签数组
 * @param {Array} config.backgroundColor - 背景颜色数组
 * @param {Object} config.dataElements - 数据元素ID映射
 */
async function renderChart(config) {
  try {
    // 获取数据
    const data = await api(config.apiEndpoint, {});

    if (!data.ok) {
      yo_error(`Failed to load ${config.chartName} data: ${data.error || 'Unknown error'}`);
      return;
    }

    // 更新统计数字（有些图表没有 dataElements）
    if (config.dataElements) {
      for (const [key, elementId] of Object.entries(config.dataElements)) {
        const element = document.getElementById(elementId);
        if (element) element.textContent = data[key] ?? 0;
      }
    }


    // 获取画布上下文
    const ctx = document.getElementById(config.canvasId).getContext('2d');

    // 销毁旧实例
    if (chartInstances[config.canvasId]) {
      chartInstances[config.canvasId].destroy();
    }

    // 如果提供 transform，则优先用 transform 生成 labels/data（适合序列型数据）
    let labels = config.labels;
    let datasetData = null;
    if (typeof config.transform === 'function') {
      const t = config.transform(data);
      labels = t.labels;
      datasetData = t.data;
    } else {
      datasetData = config.dataKeys.map(key => data[key]);
    }

    // 创建新图表
    chartInstances[config.canvasId] = new Chart(ctx, {
      type: config.chartType,
      data: {
        labels,
        datasets: [{
          label: config.datasetLabel || undefined,
          data: datasetData,
          backgroundColor: config.backgroundColor,
          borderWidth: 1
        }]
      },
      options: getChartOptions(config.options || {})
    });

  } catch (error) {
    yo_error(`Failed to render ${config.chartName} chart: ${error.message}`);
  }
}

/**
 * 获取通用图表选项
 */
function getChartOptions(overrides = {}) {
  const base = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 15, boxWidth: 12, font: { size: 12 } }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = Number(context.raw) || 0;
            const ds0 = context.chart?.data?.datasets?.[0]?.data || [];
            const total = ds0.map(Number).reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            // 若是非饼/环图则不显示百分比
            const showPct = ['pie', 'doughnut', 'polarArea'].includes(context.chart?.config?.type);
            return showPct ? `${label}: ${value} (${percentage}%)` : `${label}: ${value}`;
          }
        }
      }
    }
  };
  // 简单合并
  return Object.assign({}, base, overrides, {
    plugins: Object.assign({}, base.plugins, overrides.plugins || {}),
    scales: Object.assign({}, base.scales || {}, overrides.scales || {})
  });
}

/**
 * 初始化所有图表
 */
async function initCharts() {
  // 配置所有图表
  const charts = [
    {
      canvasId: 'guestChart',
      apiEndpoint: 'guest-dashboard',
      chartName: 'Guest Status',
      chartType: 'doughnut',
      labels: ['Placed', 'Unplaced'],
      backgroundColor: ['#28a745', '#ffc107'],
      dataKeys: ['placed_count', 'unplaced_count'],
      options: { cutout: '60%' },
      dataElements: {
        total: 'total-guests',
        placed_count: 'placed-guests',
        unplaced_count: 'unplaced-guests'
      }
    },
    {
      canvasId: 'accommodationChart',
      apiEndpoint: 'accommodation-dashboard',
      chartName: 'Accommodation Status',
      chartType: 'doughnut',
      labels: ['Available', 'Unavailable'],
      backgroundColor: ['#28a745', '#ffc107'],
      dataKeys: ['available_count', 'unavailable_count'],
      options: { cutout: '60%' },
      dataElements: {
        total: 'total-accommodations',
        available_count: 'available-accommodations',
        unavailable_count: 'unavailable-accommodations'
      }
    },
    {
      canvasId: 'placementChart',
      apiEndpoint: 'placement-dashboard',
      chartName: 'Placements Ending (Next 12 Months)',
      chartType: 'bar',
      labels: [],
      backgroundColor: '#36a2eb',
      dataKeys: [],
      datasetLabel: 'Endings',
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
      },
      transform: (resp) => {
        // 兼容不同后端字段：items / data / rows
        const items = resp.items || resp.data || resp.rows || [];
        return toLabelsAndData(items, { month: true });
      }
    }
  ];

  // 并行渲染所有图表
  await Promise.all(charts.map(chart => renderChart(chart)));
}

/**
 * 窗口调整时重绘所有图表
 */
function handleResize() {
  Object.values(chartInstances).forEach(chart => {
    if (chart) chart.resize();
  });
}

// 页面加载时初始化所有图表
document.addEventListener('DOMContentLoaded', () => {
  initCharts();
  window.addEventListener('resize', handleResize);
});

// 在文件最后添加
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCharts);
} else {
  initCharts();
}
