function setup () {
  createSprite('Sprite1', function () {
    this.collisionRect(-25, -25, 50, 50)

    let move = true

    whenGameStart(() => {
      this.goto(100, 100)

      forever(() => {
        if (move) this.x += delay * 50
        fill('gray')
        if (mouseDown) {
          fill('red')
        }

        if (this.touching('mouse-pointer')) {
          console.log('mouse around Sprite1')
        }

        rect(this.x - 25, this.y - 25, 50, 50)
      })

      this.whenThisSpriteClicked(() => {
        move = !move
      })
    })
  })
}
