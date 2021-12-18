// const color2Rgba = require('../color2Rgba.min.js')
const { React } = require('powercord/webpack')
const { Spinner } = require('powercord/components')
// const { clipboard } = require('electron')
const Vibrant = require('../vibrant.min.js')
global.Vibrant = Vibrant

module.exports = class AltSpotifyEmbed extends React.PureComponent {
  state = {
    artData: null, // null -> not fetched, string -> fetched, false -> couldn't fetch
    fetchingArt: false,
    accentSwatches: null,
    resourceData: null,
    fetchingResource: false,
  }

  async fetchArt (url) {
    const artData = await fetch(url).then(res => {
      if (res.status === 200) {
        return res.blob().then(blob => {
          return new Promise(resolve => {
            const reader = new FileReader()
            reader.onload = event => {
              resolve(event.target.result)
            }
            reader.readAsDataURL(blob)
          })
        })
      }
      return false
    })
    this.setState({
      artData,
      fetchingArt: false,
    })
    if (artData) {
      Vibrant.from(artData).getSwatches().then(swatches => {
        this.setState({ accentSwatches: swatches })
      })
    }
  }

  render () {
    const {
      getSetting,
      updateSetting,
      toggleSetting,
      embed,
      spotifyApi,
      AudioControls,
    } = this.props
    const resourcePath = new URL(embed.url).pathname.split('/')
    const resourceType = resourcePath[1]

    switch (resourceType) {
      case 'track': {
        // Get Album Art
        if (this.state.artData == null && !this.state.fetchingArt) {
          this.setState({ fetchingArt: true })
          this.fetchArt(embed.thumbnail.url)
        }
        // Get Track Data
        if (this.state.resourceData == null && !this.state.fetchingResource) {
          this.setState({ fetchingResource: true })
          spotifyApi.getTrack(resourcePath[2]).then(track => {
            this.setState({
              fetchingResource: false,
              resourceData: track,
            })
          })
        }

        // Album Art + Placeholder
        let art
        if (this.state.artData) {
          art = <img draggable="false" class="vpc-spotimbed-art" src={this.state.artData}/>
        } else if (this.state.fetchingArt) {
          art = (
            <div class="vpc-spotimbed-art vpc-spotimbed-art-loading">
              <Spinner type="spinningCircle"/>
            </div>
          )
        } else {
          art = <svg class="vpc-spotimbed-art vpc-spotimbed-art-default" width="52" height="52" viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg"><title>Album</title><path d="M26 0.00100708C11.641 0.00100708 0 11.642 0 26.001C0 40.36 11.641 52.001 26 52.001C40.36 52 52 40.36 52 26C52 11.64 40.36 0.00100708 26 0.00100708ZM26 50C12.767 50 2 39.234 2 26C2 12.766 12.767 2.00001 26 2.00001C39.234 2.00001 50 12.766 50 26C50 39.234 39.234 50 26 50ZM26 18C21.582 18 18 21.582 18 26C18 30.418 21.582 34 26 34C30.418 34 34 30.418 34 26C34 21.582 30.419 18 26 18ZM26 32C22.692 32 20 29.309 20 26C20 22.691 22.692 20 26 20C29.308 20 32 22.691 32 26C32 29.309 29.309 32 26 32Z" fill="currentColor" fill-rule="evenodd"></path></svg>
        }

        // Info + Placeholder
        let info
        const { resourceData } = this.state
        if (resourceData) {
          const artistNames = resourceData.artists.map(artist => artist.name).join(', ')
          const artistLinks = resourceData.artists.map(artist => (
            <a
              class="vpc-spotimbed-link vpc-spotimbed-track-artist"
              href={artist.external_urls.spotify}target="_blank">{artist.name}</a>
          )).reduce((a, b) => [a, ', ', b])
          info = (
            <div class="vpc-spotimbed-info">
              <div class="vpc-spotimbed-trackline">
                <a
                  class="vpc-spotimbed-link vpc-spotimbed-track-title"
                  href={resourceData.external_urls.spotify}
                  target="_blank"
                  title={resourceData.name}
                >{resourceData.name}</a>
                <span class="vpc-spotimbed-track-length">{Math.floor(resourceData.duration_ms/60000)}:{
                  Math.floor(resourceData.duration_ms/1000 % 60).toString().padStart(2, '0')
                }</span>
              </div>
              <div class="vpc-spotimbed-track-artists-wrap">
                <span>by </span>
                <span class="vpc-spotimbed-track-artists" title={artistNames}>{artistLinks}</span>
              </div>
              <div class="vpc-spotimbed-track-album-wrap">on <a
                class="vpc-spotimbed-link vpc-spotimbed-track-album"
                href={resourceData.album.external_urls.spotify}
                target="_blank"
                title={resourceData.album.name}
              >{resourceData.album.name}</a></div>
            </div>
          )
        } else { // Placeholder
          info = (
            <div class="vpc-spotimbed-info">
              <div><span class="vpc-spotimbed-track-title vpc-spotimbed-placeholder">movies for guys</span></div>
              <div><span class="vpc-spotimbed-track-artist vpc-spotimbed-placeholder">by dltzk</span></div>
              <div><span class="vpc-spotimbed-track-album vpc-spotimbed-placeholder">on Frailty</span></div>
            </div>
          )
        }

        // Swatch
        let accentBackgroundColor = 'var(--background-secondary)'
        let accentTitleColor = 'var(--text-normal)'
        let accentBodyColor = 'var(--text-normal)'
        const swatchName = getSetting('swatch', 'Vibrant')
        if (this.state.accentSwatches && swatchName !== 'None') {
          const swatch = this.state.accentSwatches[swatchName]
          accentBackgroundColor = swatch.hex
          accentTitleColor = swatch.getTitleTextColor()
          accentBodyColor = swatch.getBodyTextColor()
        }

        return (
          <div class="vpc-spotimbed-embed" style={{
            background: accentBackgroundColor,
            '--vpc-spotimbed-title': accentTitleColor,
            color: accentBodyColor,
          }}>
            <div class="vpc-spotimbed-art-wrap">
              {art}
            </div>
            {info}
            <AudioControls mediaHref={this.state.resourceData?.preview_url} autoPlay={false}/>
          </div>
        )
      }
      default: {
        return <p style={{ color: 'var(--text-normal)' }}>Unsupported Embed</p>
      }
    }
  }
}
