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

/* Render class */

const layersNeedLogic = true
const collisionsNeedLogic = true
const is2D = true

let seeCollisions

class Render {
  constructor () {
    seeCollisions = false

    document.documentElement.style.height = '100%'
    document.body.style.height = '100%'
    document.body.style.backgroundColor = 'black'
    document.body.style.margin = '0px'
    document.body.style.display = 'grid'
    document.body.style.placeItems = 'center'

    this.canvas = document.createElement('canvas')
    this.canvas.style.backgroundColor = 'white'
    this.canvas.style.imageRendering = 'auto'
    this.context = this.canvas.getContext('2d')
    this.context.imageSmoothingEnabled = true
    this.context.imageSmoothingQuality = 'high'
    document.body.append(this.canvas)

    this.prerenderCanvas = document.createElement('canvas')
    this.prerenderCanvas.style.backgroundColor = 'white'
    this.prerenderCanvas.style.imageRendering = 'auto'
    this.prerenderContext = this.prerenderCanvas.getContext('2d')
    this.prerenderContext.imageSmoothingEnabled = true
    this.prerenderContext.imageSmoothingQuality = 'high'

    window.onresize = () => {
      this.resize()
    }

    this.sc = 1
    this.layers = []
    this.layerIndex = 0
    this.collisionShapes = []

    this.canvas.addEventListener('mousedown', e => {
      mouseDown = true
      mouseX = Math.round(e.offsetX / this.sc)
      mouseY = Math.round(e.offsetY / this.sc)
    })

    this.canvas.addEventListener('mousemove', e => {
      mouseX = Math.round(e.offsetX / this.sc)
      mouseY = Math.round(e.offsetY / this.sc)
    })

    this.canvas.addEventListener('mouseup', e => {
      mouseDown = false
      mouseX = Math.round(e.offsetX / this.sc)
      mouseY = Math.round(e.offsetY / this.sc)
    })

    window.addEventListener('load', () => {
      this.resize()
    })
  }

  resize () {
    const dpi = window.devicePixelRatio

    const height = window.innerWidth * rc
    if (height > window.innerHeight) {
      const w = Math.floor(window.innerHeight / rc * dpi)

      this.canvas.width = w
      this.canvas.height = Math.floor(window.innerHeight * dpi)
      this.sc = w / displayWidth
    } else {
      const w = Math.floor(window.innerWidth * dpi)

      this.canvas.width = w
      this.canvas.height = Math.floor(height * dpi)
      this.sc = w / displayWidth
    }
  }

  clear () {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  /* costume functions */

  async addCostumes (sprite, images) {
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
      sprite.costumes[costume.name] = {
        data: image,
        index: i,
        offsetX: costume.offsetX || 0,
        offsetY: costume.offsetY || 0
      }
      sprite.costumesOrder.push(costume.name)

      if (sprite.currentCostumeData === null) {
        sprite.currentCostume = name
        sprite.currentCostumeNumber = i + 1
        sprite.currentCostumeData = image
      }
    }
  }

  drawCostume (sprite) {
    let costume
    if (sprite.currentCostume) {
      costume = sprite.costumes[sprite.currentCostume]
    } else {
      costume = { offsetX: 0, offsetY: 0 }
    }

    const width = sprite.currentCostumeData.width * sprite.size * this.sc
    const height = sprite.currentCostumeData.height * sprite.size * this.sc

    this.prerenderCanvas.width = width
    this.prerenderCanvas.height = height

    this.prerenderContext.clearRect(0, 0, this.prerenderCanvas.width, this.prerenderCanvas.height)

    if (sprite.costumeMirror) {
      this.prerenderContext.translate(width, 0)
      this.prerenderContext.scale(-1, 1)
    }

    this.prerenderContext.drawImage(sprite.currentCostumeData, 0, 0, width, height)
    this.context.drawImage(this.prerenderCanvas, (sprite.x + costume.offsetX) * this.sc, (sprite.y + costume.offsetY) * this.sc)
  }

  /* layer functions */

  layersToTrash () {
    this.layers = this.layers.filter(sprite => sprite !== null)
  }

  layersAdd (sprite) {
    this.layers.push(sprite)
    sprite.layer = this.layerIndex
    this.layerIndex++
  }

  layersOnlyAdd (sprite) {
    this.layers.push(sprite)
  }

  goToBackLayer (sprite) {
    if (sprite.layer !== 0) {
      sprite.layer = 0
    }
  }

  goToFrontLayer (sprite) {
    if (sprite.layer !== this.layerIndex - 1) {
      sprite.layer = this.layerIndex
      this.layerIndex++
    }
  }

  goBackwardLayers (sprite, goIndex) {
    sprite.layer -= goIndex
    if (sprite.layer < 0) sprite.layer = 0
  }

  goForwardLayers (sprite, goIndex) {
    sprite.layer += goIndex
    if (sprite.layer >= this.layerIndex) this.layerIndex = sprite.layer + 1
  }

  setLayer (sprite, index) {
    sprite.layer = index
  }

  deleteFromLayers (sprite) {
    const indexLayer = this.layers.indexOf(sprite)
    this.layers[indexLayer] = null
  }

  layersLoop () {
    this.layers.sort((a, b) => {
      if (a === null) return 1
      if (b === null) return -1
      return a.layer - b.layer
    })

    for (let i = 0; i < this.layers.length; i++) {
      const sprite = this.layers[i]
      if (sprite && sprite.drawSprite) {
        sprite.drawSprite()
      }
    }
  }

  /* collision functions */

  collisionsToTrash () {
    this.collisionShapes = this.collisionShapes.filter(collisionShape => collisionShape !== null)
  }

  deleteFromCollisions (sprite) {
    sprite.collisionShape.sprite = null
    const indexShape = this.collisionShapes.indexOf(sprite.collisionShape)
    this.collisionShapes[indexShape] = null
    sprite.collisionShape = null
  }

  collisionsLoop () {
    for (let i = 0; i < this.collisionShapes.length; i++) {
      if (this.collisionShapes[i]) this.collisionShapes[i].reset()
    }

    for (let i = 0; i < this.collisionShapes.length; i++) {
      for (let j = i + 1; j < this.collisionShapes.length; j++) {
        if (this.collisionShapes[i]) this.collisionShapes[i].eval(this.collisionShapes[j])
      }
    }
  }

  drawCollisions () {
    if (seeCollisions) {
      for (let i = 0; i < this.collisionShapes.length; i++) {
        fill('rgba(255, 0, 0, 0.25)')

        const collisionShape = this.collisionShapes[i]
        if (collisionShape instanceof CollisionRect) {
          rect(collisionShape.sprite.x + collisionShape.x, collisionShape.sprite.y + collisionShape.y, collisionShape.w, collisionShape.h)
        } else if (collisionShape instanceof CollisionPoint) {
          rect(collisionShape.sprite.x + collisionShape.x - 2, collisionShape.sprite.y + collisionShape.y - 2, 4, 4)
        }
      }
    }
  }

  touching (sprite, name) {
    if (sprite.collisionShape && sprite.collisionShape.colliding() && name in sprite.collisionShape.collidingShapes) {
      return true
    }
    return false
  }

  /* draw functions */

  fill (color) {
    this.context.fillStyle = color
  }

  rect (x, y, w, h = w) {
    this.context.fillRect(x * this.sc, y * this.sc, w * this.sc, h * this.sc)
  }

  font (size, font) {
    this.context.font = `${size * this.sc}px ${font}`
  }

  text (text, x, y) {
    this.context.fillText(text, x * this.sc, y * this.sc)
  }
}

const render = new Render()

function mouseLogic () {
  collisionPoint(this, 0, 0)

  this.whenGameStart(() => {
    render.canvas.addEventListener('mouseup', _ => {
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
}

/* collision functions */

function collisionPoint (sprite, x, y) {
  sprite.collisionShape = new CollisionPoint(sprite, x, y)
  render.collisionShapes.push(sprite.collisionShape)
}

function collisionRect (sprite, x, y, w, h) {
  sprite.collisionShape = new CollisionRect(sprite, x, y, w, h)
  render.collisionShapes.push(sprite.collisionShape)
}

/* draw functions */

function fill (color) {
  render.fill(color)
}

function rect (x, y, w, h = w) {
  render.rect(x, y, w, h)
}

function font (size, font) {
  render.font(size, font)
}

function text (text, x, y) {
  render.text(text, x, y)
}
