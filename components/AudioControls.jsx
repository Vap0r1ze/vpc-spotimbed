const { React, getModule, getModuleByDisplayName } = require('powercord/webpack');
const { AsyncComponent } = require('powercord/components')

const ReclassedMediaPlayer = AsyncComponent.from(getModuleByDisplayName('MediaPlayer').then(MediaPlayer => {
  return class ReclassedMediaPlayer extends MediaPlayer {
    render () {
      return React.cloneElement(super.render(), { className: 'vpc-spotimbed-media-player' })
    }
  }
}))

module.exports = class AudioControls extends React.PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      volume: props.getSetting('volume', 0.5),
      isMuted: false,
    }
  }
  onMute (isMuted) {
    this.setState({ isMuted })
  }
  onVolumeChange (volume) {
    this.props.updateSetting('volume', volume)
    this.setState({ volume })
  }

  render () {
    const { mediaHref, autoPlay } = this.props

    return (
      <div class="vpc-spotimbed-controls">
        {mediaHref && <ReclassedMediaPlayer
          src={mediaHref}
          type="AUDIO"
          height={300}
          width={400}
          forceExternal={false}
          autoPlay={autoPlay}
          playable={true}
          fileName=""
          fileSize=""
          renderLinkComponent={() => <></>}
          volume={() => this.state.volume}
          onMute={this.onMute.bind(this)}
          onVolumeChange={this.onVolumeChange.bind(this)}
          autoMute={() => {}}
        />}
      </div>
    )
  }
}
