// dashboard.js
// 全局存储图表实例
let guestChartInstance = null;

// 使用一致的 api 函数
async function fetchGuestStatistics() {
  try {
    // 使用 api() 函数代替直接 fetch
    const data = await api('guest-stats', {});

    if (data.ok) {
      return data;
    } else {
      console.error('Error fetching stats:', data.error);
      return {
        total: 0,
        placed_count: 0,
        unplaced_count: 0
      };
    }
  } catch (error) {
    console.error('Error in api call:', error);
    return {
      total: 0,
      placed_count: 0,
      unplaced_count: 0
    };
  }
}

async function renderGuestStats() {
  const data = await fetchGuestStatistics();

  // 更新统计数字
  document.getElementById('total-guests').textContent = data.total;
  document.getElementById('placed-guests').textContent = data.placed_count;
  document.getElementById('unplaced-guests').textContent = data.unplaced_count;

  // 获取图表上下文
  const ctx = document.getElementById('guestChart').getContext('2d');

  // 销毁旧图表实例（如果存在）
  if (guestChartInstance) {
    guestChartInstance.destroy();
  }

  // 创建新图表实例
  guestChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Placed', 'Unplaced'],
      datasets: [{
        data: [data.placed_count, data.unplaced_count],
        backgroundColor: ['#28a745', '#ffc107'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

// 页面加载时渲染
document.addEventListener('DOMContentLoaded', renderGuestStats);

// 添加窗口大小变化时的重绘处理
window.addEventListener('resize', () => {
  if (guestChartInstance) {
    guestChartInstance.resize();
  }
});
