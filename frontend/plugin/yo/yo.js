window.yo = yo
window.yo_info = yo_info
window.yo_success = yo_success
window.yo_error = yo_error
window.yo_warn = yo_warn

let el

function yo_info(title, content, duration = 5000) {
  yo({
    type: 'info',
    title,
    content,
    duration,
  })
}

function yo_success(title, content, duration = 3000) {
  yo({
    type: 'success',
    title,
    content,
    duration,
  })
}

function yo_error(title, content, duration = 10000) {
  yo({
    type: 'error',
    title,
    content,
    duration,
  })
}

function yo_warn(title, content, duration = 10000) {
  yo({
    type: 'warn',
    title,
    content,
    duration,
  })
}

/**
 * 显示提示信息
 * @param config {
 *  type: 'success'|'error'|'warn'|'info'
 *  title: string
 *  content: string
 *  duration: number
 *  on_click: Function
 * }
 */
function yo(config) {
  config = { ...{ type: 'info', duration: 5000 }, ...config }

  init()
  el.setAttribute('class', `yo ${config.type}`)
  el.querySelector('.yo-title').innerText = config.title
  const content = el.querySelector('.yo-content')
  if (config.content) {
    content.innerText = config.content
    content.classList.remove('hidden')
  } else {
    content.classList.add('hidden')
  }

  if (config.on_click) {
    el.addEventListener('click', config.on_click)
  }

  show()

  if (config.duration) {
    const timer = setTimeout(() => {
      hide()
      clearTimeout(timer)
    }, config.duration)
  }
}

/**
 * 初始化
 */
function init() {
  el = document.querySelector('.yo')

  if (!el) {
    // 创建初始元素
    el = document.createElement('div')
    el.classList.add('yo')
    el.innerHTML = `
  <div class="yo-container">
    <div class="yo-title"></div>
    <div class="yo-content"></div>
  </div>`
    document.body.appendChild(el)
    hide()
  }

  el.addEventListener('click', hide)
}

function show() {
  el.hidden = false
}

function hide() {
  el.hidden = true
}
