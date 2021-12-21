const { Plugin } = require('powercord/entities')
const { React, getModule, getModuleByDisplayName } = require('powercord/webpack')
const { inject, uninject } = require('powercord/injector')
const { getReactInstance } = require('powercord/util')
const SpotifyAPI = require('./SpotifyAPI.js')

const Settings = require('./components/Settings.jsx')
const AltSpotifyEmbed = require('./components/AltSpotifyEmbed.jsx')
const AudioControls = require('./components/AudioControls.jsx')
module.exports = class Spotimbed extends Plugin {
  async startPlugin () {
    this.loadStylesheet('style.css')

    powercord.api.settings.registerSettings('vpc-spotimbed', {
      category: this.entityID,
      label: 'SpotiMbed',
      render: ({ getSetting, updateSetting, toggleSetting }) => React.createElement(Settings, {
        getSetting,
        updateSetting,
        toggleSetting,
        refreshEmbeds: () => this.forceUpdate(),
      })
    })

    this.spotifyApi = SpotifyAPI

    this.ConnectedAltSpotifyEmbed = this.settings.connectStore(AltSpotifyEmbed)
    this.ConnectedAudioControls = this.settings.connectStore(AudioControls)
    this.patchSpotifyEmbed()
  }

  pluginWillUnload () {
    uninject('vpc-spotimbed-embed')
    powercord.api.settings.unregisterSettings('vpc-spotimbed')
    this.forceUpdate()
  }

  async patchSpotifyEmbed () {
    const Embed = await getModuleByDisplayName('Embed')
    const classNames = {
      ...await getModule([ 'thin' ]),
    }

    inject('vpc-spotimbed-embed', Embed.prototype, 'render', (_, res) => {
      if (res.props.embed?.provider?.name === 'Spotify') {
        return React.createElement(this.ConnectedAltSpotifyEmbed, {
          embed: res.props.embed,
          spotifyApi: this.spotifyApi,
          AudioControls: this.ConnectedAudioControls,
          classNames,
        })
      } else {
        return res
      }
    })

    this.forceUpdate()
  }

  forceUpdate () {
    document.querySelectorAll('[id^="chat-messages-"]').forEach(e => getReactInstance(e)?.memoizedProps?.onMouseMove?.())
  }
}
