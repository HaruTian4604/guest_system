/**
 * 页码插件
 */
class Pager {
  /**
   * 插件选项
   * @type {{limit: number}}
   */
  opts = {
    limit: 5,
  }

  /**
   * 最大页码
   * @type {number}
   */
  max = 1

  /**
   * 最小页码
   * @type {number}
   */
  min = 1

  /**
   * 当前页码
   * @type {number}
   */
  current = 1

  /**
   * new Pager({
   *   total: number
   *   limit: number
   *   on_change: (page:number) => void
   * })
   * @param opt
   */
  constructor(opts) {
    this.opts = { ...this.opts, ...opts }
    this.min = 1
    this.max = Math.ceil(this.opts.total / this.opts.limit)
  }

  /**
   * 更改页码
   * @param offset 偏移量
   */
  change(offset) {
    const new_page = parseInt(this.current) + parseInt(offset)
    if (!this.validate_page(new_page)) { return }
    this.go(new_page)
  }

  /**
   * 去某一页
   * @param page 页码
   */
  go(page) {
    if (!this.validate_page(page)) { return }
    this.current = page
    const fn = this.opts.on_change
    if (fn) {
      fn(this.current)
    }
  }

  /**
   * 验证页码是否合法
   * @param page
   */
  validate_page(page) {
    return page <= this.max && page >= this.min
  }

  /**
   * 下一页
   */
  next() {
    this.change(1)
  }

  /**
   * 上一页
   */
  prev() {
    this.change(-1)
  }
}
