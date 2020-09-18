import { R, A, E } from '../engine'

/* collision functions */

export function collisionPoint (sprite, x, y) {
  R.collisionPoint(sprite, x, y)
}

export function collisionRect (sprite, x, y, w, h) {
  R.collisionRect(sprite, x, y, w, h)
}

export function touching (sprite, name) {
  return R.touching(sprite, name)
}

/* costume functions */

export function addCostumes (sprite, costumesData) {
  R.addCostumes(sprite, costumesData)
}

export function drawCostume (sprite) {
  R.drawCostume(sprite)
}

/* layer functions */

export function goToFrontLayer (sprite) {
  R.goToFrontLayer(sprite)
}

/* audio functions */

export function createContext () {
  A.createContext()
}

export function addSounds (sprite, sounds) {
  A.addSounds(sprite, sounds)
}

export function addMusic (sprite, music) {
  A.addMusic(sprite, music)
}

export function startSound (sprite, name, instanceSound) { // audioHTML
  A.startSound(sprite, name, instanceSound)
}

export function startAudio (sprite, name) { // audioWeb
  A.startAudio(sprite, name)
}

export async function playSoundUntilDone (sprite, name, instanceSound = false) {
  await A.playSoundUntilDone(sprite, name, instanceSound = false)
}

export async function playMusicUntilDone (sprite, name) {
  await A.playMusicUntilDone(sprite, name)
}

export function setVolumeTo (sprite, name, volume) {
  A.setVolumeTo(sprite, name, volume)
}

/* engine functions */

export function setup (f) {
  E.setup(f)
}

export function createSprite (name, code) {
  E.createSprite(name, code)
}

export function createCloneOf (sprite, name) {
  E.createCloneOf(sprite, name)
}

export function createCloneOfMySelf (sprite) {
  E.createCloneOfMySelf(sprite)
}

export function deleteThisClone (sprite) {
  E.deleteThisClone(sprite)
}

/* event functions */

export function whenGameStart (sprite, code) {
  E.whenGameStart(sprite, code)
}

export function forever (sprite, code) {
  E.forever(sprite, code)
}

export function foreverWait (sprite, code) {
  E.foreverWait(sprite, code)
}

export function repeatUntil (condition, code) {
  return E.repeatUntil(condition, code)
}

export function waitSeconds (seconds) {
  return E.waitSeconds(seconds)
}

export function keyPressed (keyCode) {
  return E.keyPressed(keyCode)
}

export function whenKeyPressed (sprite, keyCode, code) {
  E.whenKeyPressed(sprite, keyCode, code)
}

export function broadcast (message) {
  E.broadcast(message)
}

export async function broadcastAndWait (message) {
  await E.broadcastAndWait(message)
}

export function whenIReceive (sprite, message, code) {
  E.whenIReceive(sprite, message, code)
}

export function unsubscribe (name, sprite, index = null) {
  E.unsubscribe(name, sprite, index)
}

export function beforeInit (code) {
  E.beforeInit = code
}

/* draw functions */

export function translate (x, y) {
  R.translate(x, y)
}

export function rotate (radians) {
  R.rotate(radians)
}

export function fill (color) {
  R.fill(color)
}

export function stroke (color) {
  R.stroke(color)
}

export function noFill () {
  R.noFill()
}

export function noStroke () {
  R.noStroke()
}

export function rect (x, y, w, h) {
  R.rect(x, y, w, h)
}

export function font (size, font) {
  R.font(size, font)
}

export function text (text, x, y) {
  R.text(text, x, y)
}

export { R, A, E }
