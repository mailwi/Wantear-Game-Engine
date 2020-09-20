import { Ref, createElement } from '../lib/plugins/htmlHelper'

export default class HomeScreen {
  constructor () {
    const obj = new Ref({
      hp: 100,
      i: 0,
      text: ''
    })
    obj.show = false

    const elm = createElement({
      elm: 'div',
      class: {
        guiClass: true
      },
      style: {
        color: 'red',
        background: 'green'
      },
      body: [
        {
          elm: 'input',
          id: 'userInput',
          style: 'width: 300px; height: 25px;',
          value: obj.ref('text'),
          input () {
            obj.text = this.value
          }
        },
        {
          elm: 'button',
          id: 'submit',
          class: {
            show: obj.ref('show')
          },
          style: {
            width: obj.ref('hp', (val) => val * 3 + 'px'),
            height: '25px'
          },
          body: obj.ref('i', (val) => val === 0 ? 'Click me' : val),
          click () {
            obj.hp -= 10
            obj.i++
            obj.text = 'HI!!!'
            obj.show = !obj.show

            if (elm.body[0] && elm.body[0].elm === 'input') {
              elm.body[0].remove()
            }
          }
        }
      ]
    })
  }
}
