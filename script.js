function setup () {
  const obj = {
    score: 0,
    px: 0,
    py: 0,
    enemySpeed: 0
  }

  createSprite('Player', function () {
    this.collisionRect(0, 0, 50, 50)

    this.whenGameStart(() => {
      this.goto(100, 100)

      this.forever(() => {
        if (mouseDown) {
          this.goto(mouseX - 25, mouseY - 25)
        }

        fill('gray')
        rect(this.x, this.y, 50, 50)

        fill('black')
        font('25', 'Arial')
        text(fps + ' ' + obj.enemySpeed, 50, 50)
        text('Score: ' + obj.score, 50, 75)
      })
    })

    this.whenThisSpriteClicked(() => {
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

        fill('red')
        rect(this.x - 5, this.y - 5, 10, 10)

        if (this.touching('Enemy') || this.x > 1280) {
          this.deleteThisClone()
        }
      })
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

        fill('green')
        rect(this.x - 25, this.y - 25, 50, 50)

        if (this.touching('Bullet')) {
          obj.score++
          this.deleteThisClone()
        }
      })
    })
  })
}
