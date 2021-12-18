const { Plugin } = require('powercord/entities')
const { React, getModuleByDisplayName } = require('powercord/webpack')
const { inject, uninject } = require('powercord/injector')
const { getReactInstance } = require('powercord/util')

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

    this.spotify = powercord.pluginManager.get('pc-spotify')
    this.spotifyApi = this.spotify.SpotifyAPI

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

    inject('vpc-spotimbed-embed', Embed.prototype, 'render', (_, res) => {
      if (res.props.embed?.provider?.name === 'Spotify') {
        return React.createElement(this.ConnectedAltSpotifyEmbed, {
          embed: res.props.embed,
          spotifyApi: this.spotifyApi,
          AudioControls: this.ConnectedAudioControls,
        })
      } else {
        return res
      }
    })

    this.forceUpdate()
  }

  // injectSpotifyEmbed (args, res) {
  //   if (!args) return
  //   const oldRender = res.props.render
  //   res.props.render = (...renderArgs) => {
  //     const { lang, content } = args[0]

  //     if (this.skippedLangs[lang]) {
  //       return oldRender(...renderArgs)
  //     }

  //     return React.createElement(ShikiHighlighter, {})
  //   }
  // }

  forceUpdate () {
    document.querySelectorAll('[id^="chat-messages-"]').forEach(e => getReactInstance(e)?.memoizedProps?.onMouseMove?.())
  }
}
