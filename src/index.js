const { Plugin } = require('powercord/entities')
const { React, getModule, getModuleByDisplayName } = require('powercord/webpack')
const { inject, uninject } = require('powercord/injector')
const { getReactInstance } = require('powercord/util')
const spotifyApi = require('./spotifyApi.js')

const Settings = require('./components/Settings.jsx')
const AltSpotifyEmbed = require('./components/AltSpotifyEmbed.jsx')
const AudioControls = require('./components/AudioControls.jsx')
const Embed = getModuleByDisplayName('Embed', false)

module.exports = class SpotImbed extends Plugin {
  startPlugin() {
    this.loadStylesheet('style.css')

    this.ConnectedAltSpotifyEmbed = this.settings.connectStore(AltSpotifyEmbed)
    this.ConnectedAudioControls = this.settings.connectStore(AudioControls)

    powercord.api.settings.registerSettings('vpc-spotimbed', {
      category: this.entityID,
      label: 'SpotiMbed',
      render: ({ getSetting, updateSetting, toggleSetting }) => React.createElement(Settings, {
        getSetting,
        updateSetting,
        toggleSetting,
      })
    })

    this.patchSpotifyEmbed()
  }

  pluginWillUnload() {
    uninject('vpc-spotimbed-embed')
    powercord.api.settings.unregisterSettings('vpc-spotimbed')
  }

  patchSpotifyEmbed() {
    inject('vpc-spotimbed-embed', Embed.prototype, 'render', (_, res) => {
      const { embed } = res.props
      if (embed?.provider?.name === 'Spotify') {
        const [, resourceType, resourceId] = new URL(embed.url).pathname.split('/')

        return React.createElement(this.ConnectedAltSpotifyEmbed, {
          art: embed.thumbnail.url,
          id: resourceId,
          type: resourceType,
          spotifyApi,
          AudioControls: this.ConnectedAudioControls,
        })
      } else {
        return res
      }
    })
  }
}
