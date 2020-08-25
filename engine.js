const displayWidth = 1280
const displayHeight = 720
const rc = displayHeight / displayWidth
let sc = 1
let canvas
let context
let delay
let oldTimeStamp
let fps

window.onresize = resize

function resize () {
  const dpi = window.devicePixelRatio

  const height = window.innerWidth * rc
  if (height > window.innerHeight) {
    const w = Math.floor(window.innerHeight / rc * dpi)

    canvas.width = w
    canvas.height = Math.floor(window.innerHeight * dpi)
    sc = w / displayWidth
  } else {
    const w = Math.floor(window.innerWidth * dpi)

    canvas.width = w
    canvas.height = Math.floor(height * dpi)
    sc = w / displayWidth
  }
}

window.onload = init

function init () {
  canvas = document.querySelector('#canvas')
  context = canvas.getContext('2d')

  resize()

  setup()
  oldTimeStamp = Date.now()
  window.requestAnimationFrame(gameLoop)
}

function gameLoop () {
  const timeStamp = Date.now()

  delay = (timeStamp - oldTimeStamp) / 1000
  oldTimeStamp = timeStamp

  fps = Math.round(1 / delay)

  context.clearRect(0, 0, canvas.width, canvas.height)
  draw()

  window.requestAnimationFrame(gameLoop)
}

/* draw functions */

function fill(color) {
  context.fillStyle = color
}

function rect(x, y, w, h = w) {
  context.fillRect(x * sc, y * sc, w * sc, h * sc)
}

function font(size, font) {
  context.font = `${size * sc}px ${font}`
}

function text(text, x, y) {
  context.fillText(text, x * sc, y * sc)
}