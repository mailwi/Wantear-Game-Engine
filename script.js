function setup () {
  createSprite('Sprite1', function () {
    this.collisionRect(0, 0, 50, 50)

    whenGameStart(() => {
      this.goto(100, 100)

      forever(() => {
        fill('gray')
        rect(this.x, this.y, 50, 50)
      })
    })

    this.whenThisSpriteClicked(() => {
      this.createCloneOfMySelf()
    })

    this.whenIStartAsAClone(() => {
      forever(() => {
        this.x += delay * 150
        fill('red')
        rect(this.x + 15, this.y + 15, 20, 20)
      })
    })
  })
}
