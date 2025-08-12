// dashboard.js
// 全局存储所有图表实例
const chartInstances = {};

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

    // 更新统计数字
    for (const [key, elementId] of Object.entries(config.dataElements)) {
      const element = document.getElementById(elementId);
      if (element) {
        element.textContent = data[key] || 0;
      }
    }

    // 获取画布上下文
    const ctx = document.getElementById(config.canvasId).getContext('2d');

    // 销毁旧实例
    if (chartInstances[config.canvasId]) {
      chartInstances[config.canvasId].destroy();
    }

    // 创建新图表
    chartInstances[config.canvasId] = new Chart(ctx, {
      type: config.chartType,
      data: {
        labels: config.labels,
        datasets: [{
          data: config.dataKeys.map(key => data[key]),
          backgroundColor: config.backgroundColor,
          borderWidth: 1
        }]
      },
      options: getChartOptions()
    });

  } catch (error) {
    yo_error(`Failed to render ${config.chartName} chart: ${error.message}`);
  }
}

/**
 * 获取通用图表选项
 */
function getChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          boxWidth: 12,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            // 确保将原始值转换为数字
            const value = Number(context.raw) || 0;

            // 确保所有值都转换为数字再计算总和
            const total = context.chart.data.datasets[0].data
              .map(Number)
              .reduce((a, b) => a + b, 0);

            // 添加保护避免除以0
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };
}

/**
 * 初始化所有图表
 */
async function initCharts() {
  // 配置所有图表
  const charts = [
    {
      canvasId: 'guestChart',
      apiEndpoint: 'guest-stats',
      chartName: 'Guest Status',
      chartType: 'doughnut',
      labels: ['Placed', 'Unplaced'],
      backgroundColor: ['#28a745', '#ffc107'],
      dataKeys: ['placed_count', 'unplaced_count'],
      dataElements: {
        total: 'total-guests',
        placed_count: 'placed-guests',
        unplaced_count: 'unplaced-guests'
      }
    },
    // 添加更多图表配置
    // {
    //   canvasId: 'ageChart',
    //   apiEndpoint: 'age-stats',
    //   chartName: 'Age Distribution',
    //   chartType: 'doughnut',
    //   labels: ['Children', 'Adults', 'Seniors'],
    //   backgroundColor: ['#36a2eb', '#ff6384', '#ffcd56'],
    //   dataKeys: ['children_count', 'adults_count', 'seniors_count'],
    //   dataElements: {
    //     total: 'total-ages',
    //     children_count: 'children-count',
    //     adults_count: 'adults-count',
    //     seniors_count: 'seniors-count'
    //   }
    // }
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
