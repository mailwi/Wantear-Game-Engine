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

  for (let i = 0; i < collisionShapes.length; i++) {
    collisionShapes[i].reset()
  }

  for (let i = 0; i < collisionShapes.length; i++) {
    for (let j = i + 1; j < collisionShapes.length; j++) {
      collisionShapes[i].eval(collisionShapes[j])
    }
  }

  context.clearRect(0, 0, canvas.width, canvas.height)

  if ('forever' in events) {
    const foreverEvent = events.forever
    for (let i = 0; i < foreverEvent.length; i++) {
      foreverEvent[i]()
    }
  }

  for (let i = 0; i < collisionShapes.length; i++) {
    fill('rgba(255, 0, 0, 0.25)')

    const collisionShape = collisionShapes[i]
    if (collisionShape instanceof CollisionRect) {
      rect(collisionShape.sprite.x + collisionShape.x, collisionShape.sprite.y + collisionShape.y, collisionShape.w, collisionShape.h)
    } else if (collisionShape instanceof CollisionPoint) {
      rect(collisionShape.sprite.x + collisionShape.x - 2, collisionShape.sprite.y + collisionShape.y - 2, 4, 4)
    }
  }

  window.requestAnimationFrame(gameLoop)
}

/* Collision classes */

class CollisionShape {
  constructor () {
    this.collidingShapes = {}
  }

  reset () {
    this.collidingShapes = {}
  }

  addCollidingShape (name, shape) {
    if (name in this.collidingShapes) {
      this.collidingShapes[name].push(shape)
    } else {
      this.collidingShapes[name] = [shape]
    }
  }

  colliding () {
    if (Object.keys(this.collidingShapes).length > 0) {
      return true
    }
    return false
  }

  pointRect (px, py, rx, ry, rw, rh) {
    if (px >= rx && px <= rx + rw && py >= ry && py <= ry + rh) {
      return true
    }
    return false
  }
}

class CollisionPoint extends CollisionShape {
  constructor (sprite, x, y) {
    super()
    this.sprite = sprite
    this.x = x
    this.y = y
  }

  eval (collisionShape) {
    if (collisionShape instanceof CollisionRect) {
      if (this.pointRect(this.sprite.x + this.x, this.sprite.y + this.y,
        collisionShape.sprite.x + collisionShape.x,
        collisionShape.sprite.y + collisionShape.y,
        collisionShape.w, collisionShape.h)) {
        this.addCollidingShape(collisionShape.sprite.name, collisionShape)
        collisionShape.addCollidingShape(this.sprite.name, this)
      }
    }
  }
}

class CollisionRect extends CollisionShape {
  constructor (sprite, x, y, w, h) {
    super()
    this.sprite = sprite
    this.x = x
    this.y = y
    this.w = w
    this.h = h
  }

  eval (collisionShape) {
    if (collisionShape instanceof CollisionPoint) {
      if (this.pointRect(collisionShape.sprite.x + collisionShape.x, collisionShape.sprite.y + collisionShape.y,
        this.sprite.x + this.x,
        this.sprite.y + this.y,
        this.w, this.h)) {
        this.addCollidingShape(collisionShape.sprite.name, collisionShape)
        collisionShape.addCollidingShape(this.sprite.name, this)
      }
    }
  }
}

const collisionShapes = []

/* Sprite system */

class Sprite {
  constructor (name, code) {
    this.name = name
    this.code = code
    this.x = 0
    this.y = 0
    this.clones = []
    this.collisionShape = null
    this.whenThisSpriteClickedEvent = null
  }

  goto (x, y) {
    this.x = x
    this.y = y
  }

  touching (name) {
    // console.log(this.collisionShape && this.collisionShape.colliding())
    if (this.collisionShape && this.collisionShape.colliding() && name in this.collisionShape.collidingShapes) {
      return true
    }
    return false
  }

  whenThisSpriteClicked (code) {
    this.whenThisSpriteClickedEvent = code
  }

  collisionPoint (x, y) {
    this.collisionShape = new CollisionPoint(this, x, y)
    collisionShapes.push(this.collisionShape)
  }

  collisionRect (x, y, w, h) {
    this.collisionShape = new CollisionRect(this, x, y, w, h)
    collisionShapes.push(this.collisionShape)
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

createSprite('mouse-pointer', function () {
  this.collisionPoint(0, 0)

  whenGameStart(() => {
    canvas.addEventListener('mouseup', _ => {
      if (this.collisionShape.colliding()) {
        const collidingShapes = this.collisionShape.collidingShapes
        for (const name in collidingShapes) {
          const shapes = collidingShapes[name]
          for (let i = 0; i < shapes.length; i++) {
            const sprite = shapes[i].sprite
            if (sprite.whenThisSpriteClickedEvent) {
              sprite.whenThisSpriteClickedEvent()
            }
          }
        }
      }
    })

    forever(() => {
      this.goto(mouseX, mouseY)
    })
  })
})

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
