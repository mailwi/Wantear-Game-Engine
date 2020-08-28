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
const keyCodes = {}

const prerenderCanvas = document.createElement('canvas')
const prerenderContext = prerenderCanvas.getContext('2d')
prerenderContext.imageSmoothingEnabled = true
prerenderContext.imageSmoothingQuality = 'high'
document.body.append(prerenderCanvas)

let countToTrash = 0

let seeCollisions

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
  seeCollisions = false

  canvas = document.querySelector('#canvas')
  context = canvas.getContext('2d')
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'

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

  document.addEventListener('keydown', e => {
    keyCodes[e.code] = true
  })

  document.addEventListener('keyup', e => {
    keyCodes[e.code] = false

    if ('whenKeyPressed' in events) {
      const whenKeyPressedEvent = events.whenKeyPressed
      for (let i = 0; i < whenKeyPressedEvent.length; i++) {
        if (whenKeyPressedEvent[i] && whenKeyPressedEvent[i].data === e.code) whenKeyPressedEvent[i].code()
      }
    }
  })

  resize()

  setup()

  for (spriteName in sprites) {
    sprites[spriteName].setup()
  }

  if ('whenGameStart' in events) {
    const whenGameStartEvent = events.whenGameStart
    for (let i = 0; i < whenGameStartEvent.length; i++) {
      if (whenGameStartEvent[i]) whenGameStartEvent[i].code()
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

  if (countToTrash > 50) {
    for (const name in events) {
      const event = events[name]
      events[name] = event.filter(sprite => sprite !== null)
    }

    for (const name in clones) {
      const sprites = clones[name]
      clones[name] = sprites.filter(sprite => sprite !== null)
    }

    layers = layers.filter(sprite => sprite !== null)

    collisionShapes = collisionShapes.filter(collisionShape => collisionShape !== null)

    countToTrash = 0
  }

  for (let i = 0; i < collisionShapes.length; i++) {
    if (collisionShapes[i]) collisionShapes[i].reset()
  }

  for (let i = 0; i < collisionShapes.length; i++) {
    for (let j = i + 1; j < collisionShapes.length; j++) {
      if (collisionShapes[i]) collisionShapes[i].eval(collisionShapes[j])
    }
  }

  if ('forever' in events) {
    const foreverEvent = events.forever
    for (let i = 0; i < foreverEvent.length; i++) {
      if (foreverEvent[i]) foreverEvent[i].code()
    }
  }

  if ('foreverWait' in events) {
    const foreverWaitEvent = events.foreverWait
    for (let i = 0; i < foreverWaitEvent.length; i++) {
      if (!foreverWaitEvent[i].wait) {
        foreverWaitEvent[i].wait = true
        foreverWaitEvent[i].code().then(() => {
          foreverWaitEvent[i].wait = false
          return true
        })
      }
    }
  }

  context.clearRect(0, 0, canvas.width, canvas.height)

  layers.sort((a, b) => {
    if (a === null) return 1
    if (b === null) return -1
    return a.layer - b.layer
  })

  for (let i = 0; i < layers.length; i++) {
    const sprite = layers[i]
    if (sprite && sprite.drawSprite) {
      sprite.drawSprite()
    }
  }

  if (seeCollisions) {
    for (let i = 0; i < collisionShapes.length; i++) {
      fill('rgba(255, 0, 0, 0.25)')

      const collisionShape = collisionShapes[i]
      if (collisionShape instanceof CollisionRect) {
        rect(collisionShape.sprite.x + collisionShape.x, collisionShape.sprite.y + collisionShape.y, collisionShape.w, collisionShape.h)
      } else if (collisionShape instanceof CollisionPoint) {
        rect(collisionShape.sprite.x + collisionShape.x - 2, collisionShape.sprite.y + collisionShape.y - 2, 4, 4)
      }
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

  rectRect (r1x, r1y, r1w, r1h, r2x, r2y, r2w, r2h) {
    if (r1x + r1w >= r2x && r1x <= r2x + r2w && r1y + r1h >= r2y && r1y <= r2y + r2h) {
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
    } else if (collisionShape instanceof CollisionRect) {
      if (this.rectRect(this.sprite.x + this.x, this.sprite.y + this.y, this.w, this.h,
        collisionShape.sprite.x + collisionShape.x,
        collisionShape.sprite.y + collisionShape.y,
        collisionShape.w, collisionShape.h)) {
        this.addCollidingShape(collisionShape.sprite.name, collisionShape)
        collisionShape.addCollidingShape(this.sprite.name, this)
      }
    }
  }
}

let collisionShapes = []

/* Sprite system */

class Sprite {
  constructor (name, code) {
    this.name = name
    this.code = code
    this.x = 0
    this.y = 0
    this.size = 1
    this.layer = -1
    this.drawSprite = null
    this.local = {}

    this.costumes = {}
    this.costumesOrder = []
    this.currentCostume = ''
    this.currentCostumeNumber = 0
    this.currentCostumeImage = null
    this.show = true
    this.costumesLoaded = null
    this.costumeMirror = false

    this.sounds = {}
    this.soundsLoaded = null

    this.collisionShape = null
    this.whenThisSpriteClickedEvent = null
    this.whenIStartAsACloneEvent = null

    this.clone = false
  }

  goto (x, y) {
    this.x = x
    this.y = y
  }

  touching (name) {
    if (this.collisionShape && this.collisionShape.colliding() && name in this.collisionShape.collidingShapes) {
      return true
    }
    return false
  }

  whenThisSpriteClicked (code) {
    this.whenThisSpriteClickedEvent = code
  }

  createCloneOf (name) {
    const sprite = sprites[name]
    const clone = new Sprite(name, sprite.code)
    clone.x = sprite.x
    clone.y = sprite.y
    clone.size = sprite.size
    clone.layer = sprite.layer
    clone.local = Object.assign({}, sprite.local)
    clone.costumes = Object.assign({}, sprite.costumes)
    clone.costumesOrder = Object.assign([], sprite.costumesOrder)
    clone.currentCostume = sprite.currentCostume
    clone.currentCostumeNumber = sprite.currentCostumeNumber
    clone.currentCostumeImage = sprite.currentCostumeImage
    clone.costumesLoaded = true

    layers.push(clone)

    if (name in clones) {
      clones[name].push(clone)
    } else {
      clones[name] = [clone]
    }

    clone.clone = true
    clone.setup()
    clone.whenIStartAsACloneEvent()
  }

  createCloneOfMySelf () {
    this.createCloneOf(this.name)
  }

  whenIStartAsAClone (code) {
    this.whenIStartAsACloneEvent = code
  }

  set (name, value) {
    this.local[name] = value
  }

  get (name) {
    return this.local[name]
  }

  /* costume functions */

  async _engineAddCostumes (images) {
    function getImage (data) {
      return new Promise((resolve) => {
        const image = new Image()
        image.addEventListener('load', () => resolve(image))
        image.src = data
      })
    }

    for (let i = 0; i < images.length; i++) {
      const costume = images[i]
      const image = await getImage(costume.data)
      this.costumes[costume.name] = { image: image, index: i }
      this.costumesOrder.push(costume.name)

      if (this.currentCostumeImage === null) {
        this.currentCostume = name
        this.currentCostumeNumber = i + 1
        this.currentCostumeImage = image
      }
    }
  }

  addCostumes (images) {
    if (!this.clone) {
      this.costumesLoaded = this._engineAddCostumes(images)
    }
  }

  drawCostume () {
    if (this.currentCostumeImage && this.show) {
      const width = this.currentCostumeImage.width * this.size * sc
      const height = this.currentCostumeImage.height * this.size * sc

      prerenderCanvas.width = width
      prerenderCanvas.height = height

      prerenderContext.clearRect(0, 0, prerenderCanvas.width, prerenderCanvas.height)

      if (this.costumeMirror) {
        prerenderContext.translate(width, 0)
        prerenderContext.scale(-1, 1)
      }

      prerenderContext.drawImage(this.currentCostumeImage, 0, 0, width, height)
      context.drawImage(prerenderCanvas, this.x * sc, this.y * sc)
    }
  }

  nextCostume () {
    this.currentCostumeNumber++
    if (this.currentCostumeNumber > this.costumesOrder.length) {
      this.currentCostumeNumber = 1
    }

    const index = this.currentCostumeNumber - 1
    this.currentCostume = this.costumesOrder[index]
    this.currentCostumeImage = this.costumes[this.currentCostume].image
  }

  switchCostumeTo (name) {
    this.currentCostume = name
    this.currentCostumeNumber = this.costumes[name].index + 1
    this.currentCostumeImage = this.costumes[name].image
  }

  mirror (value) {
    if (value !== undefined) {
      this.costumeMirror = value
    } else {
      this.costumeMirror = !this.costumeMirror
    }
  }

  show () {
    this.show = true
  }

  hide () {
    this.show = false
  }

  /* layer functions */

  goToBackLayer () {
    if (this.layer !== 0) {
      this.layer = 0
    }
  }

  goToFrontLayer () {
    if (this.layer !== layerIndex - 1) {
      this.layer = layerIndex
      layerIndex++
    }
  }

  goBackwardLayers (goIndex) {
    this.layer -= goIndex
    if (this.layer < 0) this.layer = 0
  }

  goForwardLayers (goIndex) {
    this.layer += goIndex
    if (this.layer >= layerIndex) layerIndex = this.layer + 1
  }

  /* sound functions */

  async _engineAddSounds (sounds) {
    function getSound (data) {
      return new Promise((resolve) => {
        const sound = new Audio(data)
        sound.addEventListener('canplaythrough', () => resolve(sound))
      })
    }

    for (const name in sounds) {
      this.sounds[name] = await getSound(sounds[name])
    }
  }

  addSounds (sounds) {
    this.soundsLoaded = this._engineAddSounds(sounds)
  }

  async playSoundUntilDone (name, instanceSound = false) {
    function soundEnded (sound) {
      return new Promise((resolve) => {
        const soundFunc = () => {
          sound.removeEventListener('ended', soundFunc)
          resolve()
        }
        sound.addEventListener('ended', soundFunc)
      })
    }

    let sound
    if (!instanceSound) {
      sound = this.sounds[name]
    } else {
      sound = new Audio(this.sounds[name].src)
    }

    sound.play()
    await soundEnded(sound)
  }

  startSound (name, instanceSound = false) {
    let sound
    if (!instanceSound) {
      sound = this.sounds[name]
    } else {
      sound = new Audio(this.sounds[name].src)
    }

    sound.play()
  }

  pauseSound (name) {
    this.sounds[name].pause()
  }

  stopSound (name) {
    this.sounds[name].pause()
    this.sounds[name].currentTime = 0
  }

  changeVolumeBy (name, value) {
    this.sounds[name].volume += value
  }

  setVolumeTo (name, value) {
    this.sounds[name].volume = value
  }

  getVolume (name) {
    return this.sounds[name].volume
  }

  getSound (name) {
    return this.sounds[name]
  }

  /* sound functions */

  draw (code) {
    this.drawSprite = code
  }

  deleteThisClone () {
    if (this.clone) {
      const spriteClones = clones[this.name]
      const index = spriteClones.indexOf(this)
      spriteClones[index] = null

      for (const key in events) {
        const sprites = events[key]
        const index = sprites.findIndex((spriteData) => spriteData && spriteData.sprite === this)
        if (index !== -1) {
          sprites[index] = null
        }
      }

      const indexLayer = layers.indexOf(this)
      layers[indexLayer] = null

      this.collisionShape.sprite = null
      const indexShape = collisionShapes.indexOf(this.collisionShape)
      collisionShapes[indexShape] = null
      this.collisionShape = null

      countToTrash++
    }
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

  /* event functions */

  whenGameStart (code) {
    subscribe('whenGameStart', code, this)
  }

  forever (code) {
    subscribe('forever', code, this)
  }

  foreverWait (code) {
    subscribe('foreverWait', code, this)
  }

  repeatUntil (condition, code) {
    const repeatFunc = async (resolve) => {
      if (!condition()) {
        await code()
        setTimeout(() => repeatFunc(resolve), 1)
      } else {
        resolve()
      }
    }

    return new Promise(repeatFunc)
  }

  whenKeyPressed (keyCode, code) {
    subscribe('whenKeyPressed', code, this, keyCode)
  }
}

const sprites = {}
const clones = {}
let layers = []

let layerIndex = 0

function createSprite (name, code) {
  const sprite = new Sprite(name, code)
  sprites[name] = sprite
  layers.push(sprite)
  sprite.layer = layerIndex
  layerIndex++
}

createSprite('mouse-pointer', function () {
  this.collisionPoint(0, 0)

  this.whenGameStart(() => {
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

    this.forever(() => {
      this.goto(mouseX, mouseY)
    })
  })
})

/* event functions */

function unsubscribe (name, sprite, index = null) {
  if (name in events) {
    if (index) {
      events[name][index] = null
      countToTrash++
    } else {
      index = events[name].findIndex((spriteData) => spriteData.sprite === sprite)
      events[name][index] = null
      countToTrash++
    }
  }
}

function subscribe (name, code, sprite, data) {
  if (name in events) {
    events[name].push({ sprite: sprite, code: code, data: data })
  } else {
    events[name] = [{ sprite: sprite, code: code, data: data }]
  }
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

/* global functions */

function waitSeconds (seconds) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), seconds * 1000)
  })
}

function keyPressed (keyCode) {
  if (keyCodes[keyCode]) {
    return true
  }
  return false
}
