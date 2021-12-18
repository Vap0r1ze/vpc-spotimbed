const { React } = require('powercord/webpack')
const { SelectInput, TextInput, SwitchItem, RadioGroup, SliderInput } = require('powercord/components/settings')
const { Spinner } = require('powercord/components')
const { sleep } = require('powercord/util')

module.exports = class Settings extends React.PureComponent {
  state = {
    lastEdited: Date.now(),
  }

  render () {
    const {
      getSetting,
      updateSetting,
      toggleSetting,
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
            value: 'None',
          }, {
            label: 'Vibrant',
            value: 'Vibrant',
          }, {
            label: 'DarkVibrant',
            value: 'DarkVibrant',
          }, {
            label: 'LightVibrant',
            value: 'LightVibrant',
          }, {
            label: 'DarkMuted',
            value: 'DarkMuted',
          }, {
            label: 'LightMuted',
            value: 'LightMuted',
          }]}
          value={getSetting('swatch', 'Vibrant')}
          searchable={true}
          required={true}
        >
          Palette
        </SelectInput>
      </div>
    )
  }
}
