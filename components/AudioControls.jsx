const { React, getModuleByDisplayName } = require('powercord/webpack');
const { AsyncComponent } = require('powercord/components')

const ReclassedMediaPlayer = AsyncComponent.from(getModuleByDisplayName('MediaPlayer').then(MediaPlayer => {
  return class ReclassedMediaPlayer extends MediaPlayer {
    render() {
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
  onMute(isMuted) {
    this.setState({ isMuted })
  }
  onVolumeChange(volume) {
    this.props.updateSetting('volume', volume)
    this.setState({ volume })
  }

  render() {
    const { mediaHref } = this.props

    let mediaPlayer
    if (mediaHref) {
      mediaPlayer = <ReclassedMediaPlayer
        key={mediaHref}
        src={mediaHref}
        type="AUDIO"
        height={300}
        width={400}
        forceExternal={false}
        autoPlay={false}
        playable={true}
        fileName=""
        fileSize=""
        renderLinkComponent={() => <></>}
        volume={() => this.state.volume}
        onMute={this.onMute.bind(this)}
        onVolumeChange={this.onVolumeChange.bind(this)}
        autoMute={() => {}}
      />
    } else {
      mediaPlayer = <div className="vpc-spotimbed-placeholder-wrap">
        <div className="vpc-spotimbed-placeholder vpc-spotimbed-placeholder-btn"/>
        <div className="vpc-spotimbed-placeholder" style={{ width: '66px' }}/>
        <div className="vpc-spotimbed-placeholder vpc-spotimbed-placeholder-scrubber"/>
        <div className="vpc-spotimbed-placeholder vpc-spotimbed-placeholder-btn"/>
      </div>
    }

    return (
      <div className="vpc-spotimbed-controls">
        {mediaPlayer}
      </div>
    )
  }
}
