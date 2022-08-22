const { React } = require('powercord/webpack')
const Color = require('./Color.js')

module.exports = Component => {
  return class ContrastAwareComponent extends Component {
    constructor (props) {
      super(props)
      this.contrastRefs = {}
    }

    _vpcCAGetBackground (el) {
      let currentEl = el
      let currentColor = new Color()

      do {
        const elBackground = new Color(getComputedStyle(currentEl).backgroundColor)
        currentColor = elBackground.mix(currentColor)
        if (currentColor.a === 1) break
      } while (currentEl = currentEl.parentElement)

      if (currentColor.a !== 1) currentColor = new Color('#fff').mix(currentColor)

      return currentColor
    }
    _vpcCACheckContrast () {
      for (const ref of Object.values(this.contrastRefs)) {
        if (!ref.current || !document.contains(ref.current)) continue
        const el = ref.current
        const bg = this._vpcCAGetBackground(el)
        el.attributeStyleMap.set('--vpc-ca-title', bg.titleTextColor)
        el.attributeStyleMap.set('--vpc-ca-body', bg.bodyTextColor)
        el.attributeStyleMap.set('--vpc-ca-bg', bg.hex)
      }
    }

    contrastRef (id) {
      if (this.contrastRefs[id]) return this.contrastRefs[id]
      return this.contrastRefs[id] = React.createRef()
    }

    render () {
      const rendered = super.render()
      setImmediate(() => this._vpcCACheckContrast())
      return rendered
    }
  }
}
