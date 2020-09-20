import {
  R,
  setup, createContext, createSprite,
  addCostumes, addSounds, addMusic,
  collisionRect, whenGameStart, startAudio, setVolumeTo,
  forever, foreverWait, keyPressed, repeatUntil, waitSeconds, whenKeyPressed,
  drawCostume, goToFrontLayer, createCloneOfMySelf,
  fill, translate, rotate, rect, font, text,
  touching, createCloneOf, deleteThisClone
} from './lib/plugins/globalFunctions'

import HomeScreen from './gui/homeScreen'

const homeScreen = new HomeScreen()

setup(function () {
  R.seeCollisions = true

  createContext()

  const obj = {
    score: 0,
    px: 0,
    py: 0,
    enemySpeed: 0
  }

  createSprite('Player', function () {
    addCostumes(this, [
      { name: 'idle', data: 'assets/images/platformChar_idle.png' },
      { name: 'walk1', data: 'assets/images/platformChar_walk1.png' },
      { name: 'walk2', data: 'assets/images/platformChar_walk2.png' }
    ])

    addSounds(this, {
      shoot: 'assets/sounds/bow.ogg'
    })

    addMusic(this, {
      music: 'assets/sounds/hero.mp3'
    })

    collisionRect(this, 25, 32, 50, 50)

    this.set('animation', 0)
    this.set('move', false)

    whenGameStart(this, async () => {
      await this.costumesLoaded
      await this.soundsLoaded
      await this.musicLoaded
      // startAudio(this, 'music')
      // setVolumeTo(this, 'music', 0.25)

      this.goto(100, 100)

      forever(this, () => {
        this.set('move', false)

        if (keyPressed('KeyW')) {
          // this.mirror(true)
          this.y -= R.delay * 150
          obj.py = this.y + 25
          this.set('animation', 1)
          this.set('move', true)
        }

        if (keyPressed('KeyS')) {
          // this.mirror(false)
          this.y += R.delay * 150
          obj.py = this.y + 25
          this.set('animation', 1)
          this.set('move', true)
        }

        if (this.get('move')) {
          this.set('animation', 1)
        } else {
          this.set('animation', 0)
        }
      })

      whenKeyPressed(this, 'Space', () => {
        // await this.playSoundUntilDone('shoot', true)
        obj.px = this.x + 25
        obj.py = this.y + 25
        createCloneOf(this, 'Bullet')
        startAudio(this, 'shoot')
      })

      foreverWait(this, async () => {
        const animation = this.get('animation')
        switch (animation) {
          case 0:
            this.switchCostumeTo('idle')
            break
          case 1:
            this.switchCostumeTo('walk1')
            await repeatUntil(() => this.get('animation') !== 1, async () => {
              await waitSeconds(0.25)
              if (this.currentCostume !== 'walk2') {
                this.nextCostume()
              } else {
                this.switchCostumeTo('walk1')
              }
            })
            break
        }

        goToFrontLayer(this)
      })
    })

    this.draw(() => {
      drawCostume(this)

      fill('black')
      font('25', 'Arial')
      text(R.fps + ' ' + obj.enemySpeed, 50, 50)
      text('Score: ' + obj.score, 50, 75)
    })
  })

  createSprite('Bullet', function () {
    addCostumes(this, [
      { name: 'shoot', data: 'assets/images/shoot.png' }
    ])

    collisionRect(this, 25, 25, 10, 10)

    whenGameStart(this, async () => {
      await this.costumesLoaded
      this.goto(-100, -100)
    })

    this.whenIStartAsAClone(() => {
      this.goto(obj.px, obj.py)

      forever(this, () => {
        this.x += R.delay * 300

        if (touching(this, 'Enemy') || this.x > 1280) {
          deleteThisClone(this)
        }
      })
    })

    this.draw(() => {
      // fill('red')
      // rect(this.x - 5, this.y - 5, 10, 10)
      drawCostume(this)
    })
  })

  createSprite('Enemy', function () {
    collisionRect(this, -25, -25, 50, 50)

    whenGameStart(this, () => {
      this.goto(-100, -100)

      foreverWait(this, async () => {
        createCloneOfMySelf(this)
        let seconds = 1 - obj.enemySpeed / 25
        if (seconds < 0.25) seconds = 0.25
        obj.enemySpeed += 0.25
        await waitSeconds(seconds)
      })
    })

    this.whenIStartAsAClone(() => {
      this.goto(Math.random() * 300 + 900, Math.random() * 600 + 100)

      forever(this, () => {
        this.x -= R.delay * (150 + obj.enemySpeed * 5)

        if (touching(this, 'Bullet')) {
          obj.score++
          deleteThisClone(this)
        } else if (this.x < 0) {
          deleteThisClone(this)
        }
      })

      this.draw(() => {
        fill('green')
        translate(this.x - 25, this.y - 25)
        rotate(0.05)
        rect(0, 0, 50, 50)
        rotate(-0.05)
        translate(-this.x + 25, -this.y + 25)
      })
    })
  })
})
