const displayWidth = 1280
const displayHeight = 720
const rc = displayHeight / displayWidth
let delay
let oldTimeStamp
let fps
let mouseDown
let mouseX
let mouseY
const keyCodes = {}

let countToTrash = 0

const events = {}

window.onload = init

function init () {
  mouseDown = false

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

    if (layersNeedLogic) render.layersToTrash()

    if (collisionsNeedLogic) render.collisionsToTrash()

    countToTrash = 0
  }

  if (collisionsNeedLogic) render.collisionsLoop()

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

  render.clear()

  render.layersLoop()

  if (collisionsNeedLogic) render.drawCollisions()

  window.requestAnimationFrame(gameLoop)
}

/* Sprite system */

class Sprite {
  constructor (name, code) {
    this.name = name
    this.code = code
    this.x = 0
    this.y = 0
    this.z = 0
    this.size = 1
    this.layer = null
    this.drawSprite = null
    this.local = {}

    this.costumes = {}
    this.costumesOrder = []
    this.currentCostume = ''
    this.currentCostumeNumber = 0
    this.currentCostumeData = null
    this.show = true
    this.costumesLoaded = null
    this.costumeMirror = false

    this.sounds = {}
    this.soundsLoaded = null

    if (collisionsNeedLogic) this.collisionShape = null
    this.whenThisSpriteClickedEvent = null
    this.whenIStartAsACloneEvent = null

    this.clone = false
  }

  goto (x, y) {
    this.x = x
    this.y = y
  }

  touching (name) {
    return render.touching(this, name)
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
    clone.currentCostumeData = sprite.currentCostumeData
    clone.costumesLoaded = true

    render.layersOnlyAdd(clone)

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

  addCostumes (costumesData) {
    if (!this.clone) {
      this.costumesLoaded = render.addCostumes(this, costumesData)
    }
  }

  drawCostume () {
    if (this.currentCostumeData && this.show) {
      render.drawCostume(this)
    }
  }

  nextCostume () {
    this.currentCostumeNumber++
    if (this.currentCostumeNumber > this.costumesOrder.length) {
      this.currentCostumeNumber = 1
    }

    const index = this.currentCostumeNumber - 1
    this.currentCostume = this.costumesOrder[index]
    this.currentCostumeData = this.costumes[this.currentCostume].data
  }

  switchCostumeTo (name) {
    this.currentCostume = name
    this.currentCostumeNumber = this.costumes[name].index + 1
    this.currentCostumeData = this.costumes[name].data
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
    render.goToBackLayer(this)
  }

  goToFrontLayer () {
    render.goToFrontLayer(this)
  }

  goBackwardLayers (goValue) {
    render.goBackwardLayers(this, goValue)
  }

  goForwardLayers (goValue) {
    render.goForwardLayers(this, goValue)
  }

  setLayer (value) {
    render.setLayer(this, value)
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

      if (layersNeedLogic) render.deleteFromLayers(this)

      if (collisionsNeedLogic) render.deleteFromCollisions(this)

      countToTrash++
    }
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

function createSprite (name, code) {
  const sprite = new Sprite(name, code)
  sprites[name] = sprite
  render.layersAdd(sprite)
}

createSprite('mouse-pointer', mouseLogic)

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
