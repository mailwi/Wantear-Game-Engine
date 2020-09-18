class SpriteClass {
  constructor (spriteObj) {
    this.spriteNode = new SpriteNode(spriteObj)
  }

  clone (parent, data) {
    this.spriteNode.clone(parent, data)
  }
}
