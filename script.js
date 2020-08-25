function setup () {
  console.log('setup')
}

let move = 0

function draw () {
  const randomColor = Math.random() > 0.5 ? '#ff8080' : '#0099b0'
  move += delay

  fill(randomColor)
  rect(100 * move, 50, 200, 175)

  fill('black')
  font(50, 'Arial')
  text('Текст такой странный: ' + fps, 500, 100)
}