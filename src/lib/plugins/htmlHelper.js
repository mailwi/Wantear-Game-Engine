import { rc, displayWidth } from '../renders/renderCanvas'

const revokes = new WeakMap()

function createProxy (target, handler) {
  const { proxy, revoke } = Proxy.revocable(target, handler)

  revokes.set(proxy, revoke)

  return proxy
}

const refHandler = {
  get (target, prop, receiver) {
    if (prop in target._obj) {
      return target._obj[prop]
    }

    return target[prop]
  },
  set (target, key, value, receiver) {
    if (key in target._subscribers) {
      const subscribers = target._subscribers[key]
      let i = 0
      while (i < subscribers.length) {
        const subscriber = subscribers[i]
        try {
          if (subscriber.obj) {
            if (subscriber.keyFunc) {
              subscriber.obj[subscriber.key] = subscriber.keyFunc(value)
            } else {
              subscriber.obj[subscriber.key] = value
            }
          }
          i++
        } catch (e) {
          if (e instanceof TypeError) {
            subscriber.obj = null
            subscriber.key = null
            subscriber.keyFunc = null
            subscribers.splice(i, 1)
          } else {
            console.log(e)
            break
          }
        }
      }
    }
    target._obj[key] = value
    return true
  }
}

class RefKey {
  constructor (ref, key, keyFunc) {
    this.ref = ref
    this.key = key
    this.keyFunc = keyFunc
  }
}

export class Ref {
  constructor (obj) {
    this._obj = obj
    this._proxy = createProxy(this, refHandler)
    this._subscribers = {}

    return this._proxy
  }

  ref (key, keyFunc) {
    return new RefKey(this, key, keyFunc)
  }

  subscribe (objKey, obj, refKey) {
    const subscriber = {
      obj: obj,
      key: objKey,
      keyFunc: refKey.keyFunc
    }

    const key = refKey.key

    if (key in this._subscribers) {
      this._subscribers[key].push(subscriber)
    } else {
      this._subscribers[key] = [subscriber]
    }

    this._proxy[key] = this._obj[key]
  }
}

class HTMLHelper {
  constructor () {
    this.root = document.createElement('div')
    this.root.id = 'gui'
    document.body.append(this.root)

    this.rootObj = { elm: 'root', _element: this.root, body: [] }

    this.sc = 1

    const classHandler = {
      get (target, prop, receiver) {
        return Reflect.get(...arguments)
      },
      set (target, key, value, receiver) {
        if (value instanceof RefKey) {
          value.ref.subscribe(key, receiver, value)
          return true
        } else {
          if (key === '_deleted') return Reflect.set(...arguments)
          if (value) {
            target._element.classList.add(key)
          } else {
            target._element.classList.remove(key)
          }
          return Reflect.set(...arguments)
        }
      }
    }

    this.classHandler = classHandler

    const styleHandler = {
      get (target, prop, receiver) {
        return Reflect.get(...arguments)
      },
      set (target, key, value, receiver) {
        if (value instanceof RefKey) {
          value.ref.subscribe(key, receiver, value)
          return true
        } else {
          if (key === '_deleted') return Reflect.set(...arguments)
          target._element.style[key] = value
          return Reflect.set(...arguments)
        }
      }
    }

    this.styleHandler = styleHandler

    this.handler = {
      get (target, prop, receiver) {
        if (prop === 'value') {
          return target._element.value
        }
        return Reflect.get(...arguments)
      },
      set (target, key, value, receiver) {
        const element = target._element
        if (value instanceof RefKey) {
          value.ref.subscribe(key, receiver, value)
          return true
        } else {
          switch (key) {
            case 'class':
              if (value === null) break
              if (typeof value === 'string') {
                if (value) {
                  element.className = value + ' elm'
                } else {
                  element.className = 'elm'
                }
              } else {
                target._element.classList.add('elm')
                const classList = value
                classList._element = target._element
                const classProxy = createProxy(classList, classHandler)
                for (const key in classList) {
                  if (key === '_element') continue
                  classProxy[key] = classList[key]
                }
                return Reflect.set(target, key, classProxy, receiver)
              }
              break
            case 'style':
              if (value === null) break
              if (typeof value === 'string') {
                element.style.cssText = value
              } else {
                const style = value
                style._element = target._element
                const styleProxy = createProxy(style, styleHandler)
                for (const key in style) {
                  styleProxy[key] = style[key]
                }
                return Reflect.set(target, key, styleProxy, receiver)
              }
              break
            case 'id':
              element.id = value
              break
            case 'body':
              if (value === null) break
              if (typeof value === 'object') {
                const body = value
                for (let i = 0; i < body.length; i++) {
                  body[i] = createElement(body[i], receiver, true)
                }
              } else if (typeof value === 'string' || typeof value === 'number') {
                element.innerHTML = value
              }
              break
            case 'value':
              element.value = value
              break
          }
        }
        return Reflect.set(...arguments)
      }
    }

    window.addEventListener('resize', () => {
      this.resize()
    })

    this.resize()
  }

  ref (obj, refKey, obj2, refKey2, objFunc) {
    return createProxy(obj2, {
      set (target, key, value, receiver) {
        if (key === refKey2) {
          if (objFunc) {
            obj[refKey] = objFunc(value)
          } else {
            obj[refKey] = value
          }
        }
        return Reflect.set(...arguments)
      }
    })
  }

  removeElement () {
    let classRevoke, styleRevoke

    if (typeof this.class === 'object') {
      this.class._deleted = true
      this.class._element = null
      classRevoke = revokes.get(this.class)
      classRevoke()
      this.class = null
    }

    if (typeof this.style === 'object') {
      this.style._deleted = true
      this.style._element = null
      styleRevoke = revokes.get(this.style)
      styleRevoke()
      this.style = null
    }

    this._deleted = true

    if (this.parent) {
      const body = this.parent.body
      const index = body.findIndex(obj => obj === this)
      body.splice(index, 1)
      this.parent = null
    }

    this._element.remove()
    this._element = null

    if (typeof this.body === 'object') {
      this.body.forEach(obj => {
        obj.remove()
      })
    }

    this.body = null

    const revoke = revokes.get(this)
    revoke()
  }

  createElement (obj, parent, tree = false) {
    const elm = document.createElement(obj.elm)
    obj._element = elm
    obj.remove = this.removeElement
    const proxy = createProxy(obj, this.handler)

    if (obj.class === undefined) obj.class = ''

    for (const key in obj) {
      proxy[key] = obj[key]
    }

    if (obj.click) elm.addEventListener('click', (e) => { proxy.click(e) })
    if (obj.over) elm.addEventListener('mouseover', (e) => { proxy.over(e) })
    if (obj.out) elm.addEventListener('mouseout', (e) => { proxy.out(e) })
    if (obj.menu) elm.addEventListener('contextmenu', (e) => { proxy.menu(e) })
    if (obj.down) elm.addEventListener('mousedown', (e) => { proxy.down(e) })
    if (obj.up) elm.addEventListener('mouseup', (e) => { proxy.up(e) })
    if (obj.move) elm.addEventListener('mousemove', (e) => { proxy.move(e) })
    if (obj.input) elm.addEventListener('input', (e) => { proxy.input(e) })

    if (parent) {
      if (!tree) parent.body.push(proxy)
      obj.parent = parent
      parent._element.append(obj._element)
    } else {
      obj.parent = this.rootObj
      this.rootObj.body.push(proxy)
      this.root.append(obj._element)
    }

    return proxy
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
}

const htmlHelper = new HTMLHelper()

export function createElement (obj, parent, tree = false) {
  return htmlHelper.createElement(obj, parent, tree)
}

export { htmlHelper }
