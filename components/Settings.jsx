const { React } = require('powercord/webpack')
const { SelectInput } = require('powercord/components/settings')
const { SwatchOption } = require('../constants.js')

module.exports = class Settings extends React.PureComponent {
  state = {
    lastEdited: Date.now(),
  }

  render () {
    const {
      getSetting,
      updateSetting,
      refreshEmbeds,
    } = this.props

    return (
      <div>
        <SelectInput
          onChange={({ value }) => {
            updateSetting('swatch', value)
            this.setState({ lastEdited: Date.now() })
            refreshEmbeds()
          }}
          options={[{
            label: 'None',
            value: SwatchOption.None,
          }, {
            label: 'Vibrant',
            value: SwatchOption.Vibrant,
          }, {
            label: 'Dark Vibrant',
            value: SwatchOption.DarkVibrant,
          }, {
            label: 'Light Vibrant',
            value: SwatchOption.LightVibrant,
          }, {
            label: 'Dark Muted',
            value: SwatchOption.DarkMuted,
          }, {
            label: 'Light Muted',
            value: SwatchOption.LightMuted,
          }]}
          value={getSetting('swatch', SwatchOption.Vibrant)}
          searchable={true}
          required={true}
        >
          Palette
        </SelectInput>
      </div>
    )
  }
}
