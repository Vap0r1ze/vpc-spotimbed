const { get } = require('powercord/http')
const { React } = require('powercord/webpack')
const { Spinner } = require('powercord/components')
const Vibrant = require('../vibrant.min.js')
const { formatOrdinal, getMonth, formatDuration, toClassName } = require('../utils.js')
const { REPO_ISSUES_URL } = require('../constants.js')

module.exports = class AltSpotifyEmbed extends React.PureComponent {
  state = {
    artData: null,
    fetchingArt: false,
    accentSwatches: null,
    resourceData: null,
    fetchingResource: false,
    selectedTrack: 0,
  }

  get _fetchedArt () {
    return this.state.artData
  }
  get _hasArtData () {
    return this.state.artData && this.state.artData !== 'DEFAULT'
  }

  async getSwatches () {
    const { getSetting } = this.props
    if (this.state.accentSwatches) return
    if (!this._hasArtData) return
    if (getSetting('swatch', 'Vibrant') === 'None') return

    const swatches = await Vibrant.from(this.state.artData).getSwatches()
    this.setState({ accentSwatches: swatches })
  }

  async fetchArt (embed) {
    if (this._fetchedArt || this.state.fetchingArt) return

    this.setState({ fetchingArt: true })
    return get(embed.thumbnail.url).then(res => {
      if (res.ok) {
        return `data:${res.headers['content-type']};base64,${res.raw.base64Slice()}`
      }
      throw null
    }).catch(error => {
      if (error) console.log(error)
      return 'DEFAULT'
    }).then(artData => {
      this.setState({
        artData,
        fetchingArt: false,
      })
    })
  }
  fetchResourceData (resourceType, resourceId) {
    if (this.state.resourceData != null || this.state.fetchingResource) return
    const { spotifyApi } = this.props

    const resolveResource = resourceData => this.setState({ fetchingResource: false, resourceData })
    this.setState({ fetchingResource: true })

    switch (resourceType) {
      case 'track': {
        return spotifyApi.getTrack(resourceId).then(resolveResource)
      }
      case 'album': {
        return spotifyApi.getAlbum(resourceId).then(resolveResource)
      }
    }
  }

  getEmbedStyle () {
    const { getSetting } = this.props
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
    return {
      background: accentBackgroundColor,
      '--vpc-spotimbed-title': accentTitleColor,
      color: accentBodyColor,
    }
  }
  formatReleaseDate (dateString) {
    const dateParts = dateString.split('-')
    if (!dateParts[1]) return dateParts[0]

    if (dateParts[2]) {
      return `${getMonth(dateParts[1] - 1)} ${formatOrdinal(+dateParts[2])}, ${dateParts[0]}`
    }

    return `${getMonth(dateParts[1] - 1)} ${dateParts[0]}`
  }

  renderArt () {
    if (this._hasArtData) {
      return <img draggable="false" class="vpc-spotimbed-art" src={this.state.artData}/>
    } else if (this.state.fetchingArt) {
      return (
        <div class="vpc-spotimbed-art vpc-spotimbed-art-loading">
          <Spinner type="spinningCircle"/>
        </div>
      )
    } else {
      return <svg class="vpc-spotimbed-art vpc-spotimbed-art-default" width="52" height="52" viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg"><title>Album</title><path d="M26 0.00100708C11.641 0.00100708 0 11.642 0 26.001C0 40.36 11.641 52.001 26 52.001C40.36 52 52 40.36 52 26C52 11.64 40.36 0.00100708 26 0.00100708ZM26 50C12.767 50 2 39.234 2 26C2 12.766 12.767 2.00001 26 2.00001C39.234 2.00001 50 12.766 50 26C50 39.234 39.234 50 26 50ZM26 18C21.582 18 18 21.582 18 26C18 30.418 21.582 34 26 34C30.418 34 34 30.418 34 26C34 21.582 30.419 18 26 18ZM26 32C22.692 32 20 29.309 20 26C20 22.691 22.692 20 26 20C29.308 20 32 22.691 32 26C32 29.309 29.309 32 26 32Z" fill="currentColor" fill-rule="evenodd"></path></svg>
    }
  }
  renderPlaceholderInfo () {
    return (
      <div class="vpc-spotimbed-info">
        <div><span class="vpc-spotimbed-placeholder">movies for guys</span></div>
        <div><span class="vpc-spotimbed-placeholder">by dltzk</span></div>
        <div><span class="vpc-spotimbed-placeholder">on Frailty</span></div>
      </div>
    )
  }
  renderResourceLink (resourceData, className = '') {
    return <a
      class={['vpc-spotimbed-link'].concat(className.split(' ')).join(' ')}
      href={resourceData.external_urls.spotify}
      data-resource-link={true}
      target="_blank"
      title={resourceData.name}
    >{resourceData.name}</a>
  }
  renderByline (artists) {
    return (
      <div class="vpc-spotimbed-infoline">
        <span>by </span>
        {this.renderArtists(artists)}
      </div>
    )
  }
  renderArtists (artists) {
    const artistNames = artists.map(artist => artist.name).join(', ')
    const artistLinks = artists.map(artist => (
      <a
        class="vpc-spotimbed-link vpc-spotimbed-infoline"
        href={artist.external_urls.spotify}
        target="_blank"
      >{artist.name}</a>
    )).reduce((a, b) => [a, ', ', b])
    return <span title={artistNames}>{artistLinks}</span>
  }
  renderTrackRowInfo (track) {
    return (
      <div class="vpc-spotimbed-trackrow-info">
        {this.renderResourceLink(track, 'vpc-spotimbed-trackrow-title')}
        <div class="vpc-spotimbed-trackrow-infoline">{this.renderByline(track.artists)}</div>
      </div>
    )
  }
  renderTrackList (tracks) {
    const tracklistItems = []

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i]
      tracklistItems.push(
        <div
          class={toClassName(['vpc-spotimbed-trackrow'], {
            'vpc-spotimbed-active': i === this.state.selectedTrack
          })}
          onClick={() => {
            if (i === this.state.selectedTrack) return
            this.setState({ selectedTrack: i })
          }}
        >
          <div class="vpc-spotimbed-trackrow-index vpc-spotimbed-mono">{i + 1}</div>
          {this.renderTrackRowInfo(track)}
          <div class="vpc-spotimbed-trackrow-length vpc-spotimbed-mono">{formatDuration(track.duration_ms)}</div>
        </div>
      )
    }

    return tracklistItems
  }
  render () {
    const {
      AudioControls,
      embed,
      classNames,
    } = this.props
    const resourcePath = new URL(embed.url).pathname.split('/')
    const resourceType = resourcePath[1]

    switch (resourceType) {
      case 'track': {
        this.fetchArt(embed).then(() => this.getSwatches())
        this.fetchResourceData(resourceType, resourcePath[2])

        const art = this.renderArt()

        let info
        const { resourceData } = this.state
        if (resourceData) {
          info = (
            <div class="vpc-spotimbed-info">
              <div class="vpc-spotimbed-titleline">
                {this.renderResourceLink(resourceData, 'vpc-spotimbed-title')}
                <span class="vpc-spotimbed-title-tag vpc-spotimbed-mono">{formatDuration(resourceData.duration_ms)}</span>
              </div>
              <div class="vpc-spotimbed-infoline-wrap">{this.renderByline(resourceData.artists)}</div>
              <div class="vpc-spotimbed-infoline-wrap">
                <div class="vpc-spotimbed-infoline">on {this.renderResourceLink(resourceData.album, 'vpc-spotimbed-track-album')}</div>
              </div>
            </div>
          )
        } else {
          info = this.renderPlaceholderInfo()
        }

        return (
          <div class="vpc-spotimbed-embed" style={this.getEmbedStyle()}>
            <div class="vpc-spotimbed-art-wrap">
              {art}
            </div>
            {info}
            <AudioControls mediaHref={this.state.resourceData?.preview_url} autoPlay={false}/>
          </div>
        )
      }
      case 'album': {
        this.fetchArt(embed).then(() => this.getSwatches())
        this.fetchResourceData(resourceType, resourcePath[2])

        const art = this.renderArt()

        const { resourceData } = this.state

        let info
        if (resourceData) {
          let albumType = 'Album'
          if (resourceData.album_type === 'single') {
            albumType = resourceData.total_tracks > 1 ? 'EP' : 'Single'
          }

          const releaseDate = this.formatReleaseDate(resourceData.release_date)
          let secondaryInfo = releaseDate
          if (resourceData.total_tracks > 1) {
            secondaryInfo += ` \u2022 ${resourceData.total_tracks} songs`
          }

          info = (
            <div class="vpc-spotimbed-info">
              <div class="vpc-spotimbed-titleline">
                {this.renderResourceLink(resourceData, 'vpc-spotimbed-title')}
                <span class="vpc-spotimbed-title-tag">{albumType}</span>
              </div>
              <div class="vpc-spotimbed-infoline-wrap">{this.renderByline(resourceData.artists)}</div>
              <div class="vpc-spotimbed-infoline vpc-spotimbed-infoline-secondary">{secondaryInfo}</div>
            </div>
          )
        } else {
          info = this.renderPlaceholderInfo()
        }

        let trackListItems
        if (resourceData) {
          trackListItems = this.renderTrackList(resourceData.tracks.items)
        }

        let previewUrl
        if (resourceData) {
          previewUrl = resourceData.tracks.items[this.state.selectedTrack].preview_url
        }

        return (
          <div class="vpc-spotimbed-embed" style={this.getEmbedStyle()}>
            <div class="vpc-spotimbed-art-wrap">
              {art}
            </div>
            {info}
            <div class={`vpc-spotimbed-content vpc-spotimbed-tracklist ${classNames.thin}`}>{trackListItems}</div>
            <AudioControls mediaHref={previewUrl} autoPlay={false}/>
          </div>
        )
      }
      default: {
        return <div class="vpc-spotimbed-unsupported">This Spotify embed is not supported by SpotImbed, please <a href={REPO_ISSUES_URL} target="_blank">open an issue</a> and include the above link</div>
      }
    }
  }
}
