module.exports = class Color {
  constructor (color) {
    let rgba = [0, 0, 0, 0]

    try {
      if (color instanceof Array) {
        rgba = rgba.map((channel, i) => color[i] == null ? channel : color[i])
      } else if (color[0] === '#') {
        let hex = color.slice(1)
        if (hex.length < 6) {
          hex = hex.split('').map(channel => channel + channel).join('')
        }
        rgba[0] = parseInt(hex.slice(0, 2), 16)
        rgba[1] = parseInt(hex.slice(2, 4), 16)
        rgba[2] = parseInt(hex.slice(4, 6), 16)
        if (hex.length < 8) rgba[3] = 1
        else rgba[3] = parseInt(hex.slice(6, 8), 16) / 255
      } else if (color.startsWith('rgb')) {
        const channels = color.replace(/rgba?/, '').slice(1, -1).split(/, */)
        rgba[0] = parseInt(channels[0])
        rgba[1] = parseInt(channels[1])
        rgba[2] = parseInt(channels[2])
        if (channels[3]) rgba[3] = parseFloat(channels[3])
        else rgba[3] = 1
      }
    } catch {
      rgba = [0, 0, 0, 0]
    }

    this._rgba = rgba
  }

  get r () { return this._rgba[0] }
  get g () { return this._rgba[1] }
  get b () { return this._rgba[2] }
  get a () { return this._rgba[3] }

  get rgba () {
    return this._rgba.slice()
  }
  get rgb () {
    return this._rgba.slice(0, 3)
  }
  get hex () {
    if (this._hex) return this._hex
    const hexRGBA = [ this.r, this.g, this.b, Math.floor(this.a * 255) ]
    this._hex = `#${hexRGBA.map(channel => channel.toString(16).padStart(2, '0')).join('').replace(/ff$/, '')}`
    return this._hex
  }

  get yiq () {
    if (this._yiq) return this._yiq
    const rgb = this.rgb
    this._yiq = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000
    return this._yiq
  }

  get titleTextColor () {
    if (this._titleTextColor) return this._titleTextColor
    this._titleTextColor = this.yiq < 200 ? '#fff' : '#000'
    return this._titleTextColor
  }
  get bodyTextColor () {
    if (this._bodyTextColor) return this._bodyTextColor
    this._bodyTextColor = this.yiq < 150 ? '#fff' : '#000'
    return this._bodyTextColor
  }

  mix (color) {
    if (!(color instanceof Color)) {
      color = new Color(color)
    }
    if (this.a === 0) return color
    if (color.a === 0) return this
    if (color.a === 1) return color

    const a = 1 - (1 - color.a) * (1 - this.a)
    const rgb = [
      Math.floor(color.r * color.a / a + this.r * this.a * (1 - color.a) / a),
      Math.floor(color.g * color.a / a + this.g * this.a * (1 - color.a) / a),
      Math.floor(color.b * color.a / a + this.b * this.a * (1 - color.a) / a),
    ]
    return new Color([...rgb, a])
  }
}
