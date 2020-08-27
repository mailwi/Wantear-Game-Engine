function setup () {
  const obj = {
    score: 0,
    px: 0,
    py: 0,
    enemySpeed: 0
  }

  createSprite('Player', function () {
    this.addCostumes([
      { name: 'idle', data: 'images/platformChar_idle.png' },
      { name: 'walk1', data: 'images/platformChar_walk1.png' },
      { name: 'walk2', data: 'images/platformChar_walk2.png' }
    ])

    this.collisionRect(0, 0, 50, 50)

    this.set('animation', 0)
    this.set('move', false)

    this.whenGameStart(() => {
      this.goto(100, 100)

      this.forever(() => {
        this.set('move', false)

        if (keyPressed('KeyW')) {
          this.y -= delay * 150
          obj.py = this.y + 25
          this.set('animation', 1)
          this.set('move', true)
        }

        if (keyPressed('KeyS')) {
          this.y += delay * 150
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

      this.foreverWait(async () => {
        await this.costumesLoaded

        const animation = this.get('animation')
        switch (animation) {
          case 0:
            this.switchCostumeTo('idle')
            break
          case 1:
            this.switchCostumeTo('walk1')
            await this.repeatUntil(() => this.get('animation') !== 1, async () => {
              await waitSeconds(0.25)
              if (this.currentCostume !== 'walk2') {
                this.nextCostume()
              } else {
                this.switchCostumeTo('walk1')
              }
            })
            break
        }

        this.goToFrontLayer()
      })
    })

    this.draw(() => {
      this.drawCostume()

      fill('black')
      font('25', 'Arial')
      text(fps + ' ' + obj.enemySpeed, 50, 50)
      text('Score: ' + obj.score, 50, 75)
    })

    this.whenKeyPressed('Space', () => {
      obj.px = this.x + 25
      obj.py = this.y + 25
      this.createCloneOf('Bullet')
    })
  })

  createSprite('Bullet', function () {
    this.collisionRect(-5, -5, 10, 10)

    this.whenGameStart(() => {
      this.goto(-100, -100)
    })

    this.whenIStartAsAClone(() => {
      this.goto(obj.px, obj.py)

      this.forever(() => {
        this.x += delay * 300

        if (this.touching('Enemy') || this.x > 1280) {
          this.deleteThisClone()
        }
      })
    })

    this.draw(() => {
      fill('red')
      rect(this.x - 5, this.y - 5, 10, 10)
    })
  })

  createSprite('Enemy', function () {
    this.collisionRect(-25, -25, 50, 50)

    this.whenGameStart(() => {
      this.goto(-100, -100)

      this.foreverWait(async () => {
        this.createCloneOfMySelf()
        let seconds = 1 - obj.enemySpeed / 25
        if (seconds < 0.25) seconds = 0.25
        obj.enemySpeed += 0.25
        await waitSeconds(seconds)
      })
    })

    this.whenIStartAsAClone(() => {
      this.goto(Math.random() * 300 + 900, Math.random() * 600 + 100)

      this.forever(() => {
        this.x -= delay * (150 + obj.enemySpeed * 5)

        if (this.touching('Bullet')) {
          obj.score++
          this.deleteThisClone()
        }
      })

      this.draw(() => {
        fill('green')
        rect(this.x - 25, this.y - 25, 50, 50)
      })
    })
  })
}
