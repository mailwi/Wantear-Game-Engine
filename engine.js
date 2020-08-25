const displayWidth = 1280
const displayHeight = 720
const rc = displayHeight / displayWidth
let sc = 1
let canvas
let context
let delay
let oldTimeStamp
let fps
let mouseDown = false
let mouseX
let mouseY

const events = {}

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

  canvas.addEventListener('mousedown', e => {
    mouseDown = true
    mouseX = Math.round(e.offsetX / sc)
    mouseY = Math.round(e.offsetY / sc)
  })

  canvas.addEventListener('mousemove', e => {
    mouseX = Math.round(e.offsetX / sc)
    mouseY = Math.round(e.offsetY / sc)
  })

  canvas.addEventListener('mouseup', e => {
    mouseDown = false
    mouseX = Math.round(e.offsetX / sc)
    mouseY = Math.round(e.offsetY / sc)
  })

  resize()

  setup()

  for (spriteName in sprites) {
    sprites[spriteName].setup()
  }

  if ('whenGameStart' in events) {
    const whenGameStartEvent = events.whenGameStart
    for (let i = 0; i < whenGameStartEvent.length; i++) {
      whenGameStartEvent[i]()
    }
  }

  oldTimeStamp = Date.now()
  window.requestAnimationFrame(gameLoop)
}

function gameLoop () {
  const timeStamp = Date.now()

  delay = (timeStamp - oldTimeStamp) / 1000
  oldTimeStamp = timeStamp

  fps = Math.round(1 / delay)

  context.clearRect(0, 0, canvas.width, canvas.height)

  if ('forever' in events) {
    const foreverEvent = events.forever
    for (let i = 0; i < foreverEvent.length; i++) {
      foreverEvent[i]()
    }
  }

  window.requestAnimationFrame(gameLoop)
}

/* Sprite system */

class Sprite {
  constructor (name, code) {
    this.name = name
    this.code = code
    this.x = 0
    this.y = 0
    this.clones = []
  }

  goto (x, y) {
    this.x = x
    this.y = y
  }

  setup () {
    this.code()
  }
}

const sprites = {}

function createSprite (name, code) {
  const sprite = new Sprite(name, code)
  sprites[name] = sprite
}

/* event functions */

function subscribe (name, code) {
  if (name in events) {
    events[name].push(code)
  } else {
    events[name] = [code]
  }
}

function whenGameStart (code) {
  subscribe('whenGameStart', code)
}

function forever (code) {
  subscribe('forever', code)
}

/* draw functions */

function fill (color) {
  context.fillStyle = color
}

function rect (x, y, w, h = w) {
  context.fillRect(x * sc, y * sc, w * sc, h * sc)
}

function font (size, font) {
  context.font = `${size * sc}px ${font}`
}

function text (text, x, y) {
  context.fillText(text, x * sc, y * sc)
}
