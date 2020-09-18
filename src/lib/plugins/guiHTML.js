class GUI {
  constructor () {
    this.root = document.createElement('div')
    this.root.style.position = 'absolute'
    this.root.style.pointerEvents = 'none'
    document.body.append(this.root)

    this.sc = 1

    this.strokeStyle = 'rgb(0, 0, 0)'
    this.fillStyle = 'rgb(0, 0, 0)'

    this.strokeWeight = 1
    this.strokeType = 'solid'

    this.queue = []
    this.queueIndex = 0

    this.cachedItem = null

    window.addEventListener('resize', () => {
      this.resize()
    })

    this.resize()
  }

  resize () {
    const height = window.innerWidth * rc
    if (height > window.innerHeight) {
      const w = Math.floor(window.innerHeight / rc)

      this.root.style.width = w + 'px'
      this.root.style.height = Math.floor(window.innerHeight) + 'px'
      this.sc = w / displayWidth
    } else {
      const w = Math.floor(window.innerWidth)

      this.root.style.width = w + 'px'
      this.root.style.height = Math.floor(height) + 'px'
      this.sc = w / displayWidth
    }
  }

  cached () {
    this.cachedItem = this.queue[this.queueIndex]
    this.queueIndex++
    return this.cachedItem !== undefined
  }

  reset () {
    this.queueIndex = 0
  }

  noStroke () {
    this.strokeStyle = ''
  }

  noFill () {
    this.fillStyle = ''
  }

  stroke (r, g, b, a) {
    const color = a ? `rgb(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`
    if (this.strokeStyle !== color) this.strokeStyle = color
  }

  fill (r, g, b, a) {
    const color = a ? `rgb(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`
    if (this.fillStyle !== color) this.fillStyle = color
  }

  setXY (x, y) {
    if (this.cachedItem.style.left !== x * this.sc + 'px') this.cachedItem.style.left = x * this.sc + 'px'
    if (this.cachedItem.style.top !== y * this.sc + 'px') this.cachedItem.style.top = y * this.sc + 'px'
  }

  setWH (w, h = w) {
    if (this.cachedItem.style.width !== w * this.sc + 'px') this.cachedItem.style.width = w * this.sc + 'px'
    if (this.cachedItem.style.height !== h * this.sc + 'px') this.cachedItem.style.height = h * this.sc + 'px'
  }

  setStyles () {
    if (this.strokeStyle !== '') {
      if (this.cachedItem.style.borderColor !== this.strokeStyle) this.cachedItem.style.borderColor = this.strokeStyle
      if (this.cachedItem.style.borderWidth !== this.strokeWeight * this.sc + 'px') this.cachedItem.style.borderWidth = this.strokeWeight * this.sc + 'px'
    } else {
      this.cachedItem.style.border = 'none'
    }

    if (this.fillStyle !== '') {
      if (this.cachedItem.style.backgroundColor !== this.fillStyle) this.cachedItem.style.backgroundColor = this.fillStyle
    } else {
      this.cachedItem.style.backgroundColor = 'transparent'
    }
  }

  rect (x, y, w, h = w) {
    if (this.cached()) {
      this.setXY(x, y)
      this.setWH(w, h)
      this.setStyles()
    } else {
      const r = document.createElement('div')
      r.style.position = 'absolute'
      r.style.left = x * this.sc + 'px'
      r.style.top = y * this.sc + 'px'
      r.style.width = w * this.sc + 'px'
      r.style.height = h * this.sc + 'px'
      r.style.borderColor = this.strokeStyle
      r.style.borderWidth = this.strokeWeight
      r.style.borderStyle = this.strokeType
      r.style.backgroundColor = this.fillStyle
      this.queue.push(r)
      this.root.append(r)
    }
  }
}

const gui = new GUI()
