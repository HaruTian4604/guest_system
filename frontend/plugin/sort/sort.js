// frontend/admin/plugin/sort/sort.js
class TableSorter {
  static init(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    // 添加排序事件监听
    const headers = table.querySelectorAll('thead th.sortable');
    headers.forEach(header => {
      header.addEventListener('click', () => this.sortTable(header));
    });
  }

  // 处理表格排序
  static sortTable(header) {
    const table = header.closest('table');
    const field = header.dataset.field;
    const currentDirection = header.dataset.direction || 'asc';
    const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';

    // 更新所有表头状态
    table.querySelectorAll('th.sortable').forEach(h => {
      h.classList.remove('sorted-asc', 'sorted-desc');
      delete h.dataset.direction;
    });

    // 设置当前排序状态
    header.dataset.direction = newDirection;
    header.classList.add(`sorted-${newDirection}`);

    // 触发自定义事件
    const event = new CustomEvent('sortChanged', {
      detail: { field, direction: newDirection }
    });
    table.dispatchEvent(event);
  }
}
