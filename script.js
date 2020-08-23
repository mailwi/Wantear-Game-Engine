const displayWidth = 1280
const displayHeight = 720
const rc = displayHeight / displayWidth
let sc = 1
let canvas
let context

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

  // Start the first frame request
  window.requestAnimationFrame(gameLoop)
}

function gameLoop (timeStamp) {
  draw()

  // Keep requesting new frames
  window.requestAnimationFrame(gameLoop)
}

function draw () {
  context.clearRect(0, 0, canvas.width, canvas.height)

  const randomColor = Math.random() > 0.5 ? '#ff8080' : '#0099b0'
  context.fillStyle = randomColor
  context.fillRect(100 * sc, 50 * sc, 200 * sc, 175 * sc)

  context.fillStyle = 'black'
  context.font = `${50 * sc}px Arial`
  context.fillText('Текст такой странный', 500 * sc, 100 * sc)
}
