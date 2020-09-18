class AudioEngine {
  constructor () {
    this.ctx = null
  }

  createContext () {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)()
  }

  async _addSounds (sprite, sounds) {
    const ctx = this.ctx
    async function getSound (url) {
      return new Promise((resolve) => {
        const sound = new AudioWeb(ctx, url)
        sound.canplaythrough = () => resolve(sound)
      })
    }

    for (const name in sounds) {
      sprite.sounds[name] = await getSound(sounds[name])
    }
  }

  addSounds (sprite, sounds) {
    sprite.soundsLoaded = this._addSounds(sprite, sounds)
  }

  async _addMusic (sprite, music) {
    function getMusic (data) {
      return new Promise((resolve) => {
        const music = new Audio(data)
        music.addEventListener('canplaythrough', () => resolve(music))
      })
    }

    for (const name in music) {
      const loadedMusic = await getMusic(music[name])
      sprite.sounds[name] = loadedMusic
      const source = this.ctx.createMediaElementSource(loadedMusic)
      source.connect(this.ctx.destination)
    }
  }

  addMusic (sprite, music) {
    sprite.musicLoaded = this._addMusic(sprite, music)
  }

  async playSoundUntilDone (sprite, name) {
    function soundEnded (sound) {
      return new Promise((resolve) => {
        const soundFunc = () => {
          sound.ended = null
          resolve()
        }
        sound.ended = soundFunc
      })
    }

    const sound = sprite.sounds[name]

    sound.play()
    await soundEnded(sound)
  }

  async playMusicUntilDone (sprite, name) {
    function musicEnded (music) {
      return new Promise((resolve) => {
        const musicFunc = () => {
          music.removeEventListener('ended', musicFunc)
          resolve()
        }
        music.addEventListener('ended', musicFunc)
      })
    }

    const music = sprite.sounds[name]

    music.play()
    await musicEnded(music)
  }

  startAudio (sprite, name) {
    const sound = sprite.sounds[name]

    sound.play()
  }

  pauseMusic (sprite, name) {
    sprite.sounds[name].pause()
  }

  stopMusic (sprite, name) {
    sprite.sounds[name].pause()
    sprite.sounds[name].currentTime = 0
  }

  changeVolumeBy (sprite, name, value) {
    sprite.sounds[name].volume += value
  }

  setVolumeTo (sprite, name, value) {
    sprite.sounds[name].volume = value
  }

  getVolume (sprite, name) {
    return sprite.sounds[name].volume
  }

  getAudio (sprite, name) {
    return sprite.sounds[name]
  }
}

class AudioWeb {
  constructor (ctx, url) {
    this.ctx = ctx
    this.url = url
    this.canplaythrough = null
    this.ended = null
    this.volume = 1
    fetch(url)
      .then(data => data.arrayBuffer())
      .then(arrayBuffer => {
        this.ctx.decodeAudioData(arrayBuffer).then(decodedAudio => {
          this.audio = decodedAudio
          if (this.canplaythrough) {
            this.canplaythrough()
          }
        })
      })
  }

  play () {
    const source = this.ctx.createBufferSource()
    source.buffer = this.audio
    source.loop = false
    const volumeNode = this.ctx.createGain()
    source.connect(volumeNode)
    volumeNode.connect(this.ctx.destination)
    volumeNode.gain.value = this.volume
    source.start()
    source.onended = () => {
      if (this.ended) {
        this.ended()
      }
    }
  }
}

export const A = new AudioEngine()
