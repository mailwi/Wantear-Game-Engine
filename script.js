function setup () {
  createSprite('Sprite1', function () {
    whenGameStart(() => {
      this.goto(100, 100)

      forever(() => {
        this.x += delay * 50
        fill('gray')
        if (mouseDown) {
          fill('red')
        }
        rect(this.x - 25, this.y - 25, 50, 50)
      })
    })
  })
}
