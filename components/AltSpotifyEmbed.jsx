const { get } = require('powercord/http')
const { React, getModule } = require('powercord/webpack')
const { Spinner } = require('powercord/components')
const ContrastAwareness = require('../vpc-ca/ContrastAwareness.js')
const Vibrant = require('../bundles/vibrant.min.js')
const {
  formatOrdinal,
  getMonth,
  formatDuration,
  toClassName,
} = require('../utils.js')
const { REPO_ISSUES_URL, SwatchOption } = require('../constants.js')


const classNames = {
  ...getModule([ 'thin' ], false),
}

module.exports = ContrastAwareness(class AltSpotifyEmbed extends React.PureComponent {
  state = {
    artData: null,
    fetchingArt: false,
    accentSwatches: null,
    resourceData: null,
    fetchingResource: false,
    selectedTrack: 0,
  }

  get _fetchedArt() {
    return this.state.artData
  }
  get _hasArtData() {
    return this.state.artData && this.state.artData !== 'DEFAULT'
  }

  async getSwatches() {
    const { getSetting } = this.props
    if (this.state.accentSwatches) return
    if (!this._hasArtData) return
    if (getSetting('swatch', SwatchOption.Vibrant) === 'None') return

    const swatches = await Vibrant.from(this.state.artData).getSwatches()
    this.setState({ accentSwatches: swatches })
  }

  async fetchArt(artUrl) {
    if (this._fetchedArt || this.state.fetchingArt) return

    this.setState({ fetchingArt: true })
    return get(artUrl).then(res => {
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
  fetchResourceData(resourceType, resourceId) {
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
      case 'playlist': {
        return spotifyApi.getPlaylist(resourceId).then(resolveResource)
      }
      case 'artist': {
        return spotifyApi.getArtist(resourceId).then(artist => {
          return spotifyApi.getArtistTopTracks(resourceId, 'US').then(topTracks => {
            return resolveResource({
              ...artist,
              top_tracks: topTracks.tracks,
            })
          })
        })
      }
    }
  }

  getEmbedStyle() {
    const { getSetting } = this.props
    let accentBackgroundColor = 'var(--background-secondary)'
    let accentTitleColor = 'var(--text-normal)'
    let accentBodyColor = 'var(--text-normal)'
    const swatchName = getSetting('swatch', SwatchOption.Vibrant)
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
  formatReleaseDate(dateString) {
    const dateParts = dateString.split('-')
    if (!dateParts[1]) return dateParts[0]

    if (dateParts[2]) {
      return `${getMonth(dateParts[1] - 1)} ${formatOrdinal(+dateParts[2])}, ${dateParts[0]}`
    }

    return `${getMonth(dateParts[1] - 1)} ${dateParts[0]}`
  }

  renderArt() {
    if (this._hasArtData) {
      return <img draggable="false" className="vpc-spotimbed-art" src={this.state.artData}/>
    } else if (this.state.fetchingArt) {
      return (
        <div className="vpc-spotimbed-art vpc-spotimbed-art-loading">
          <Spinner type="spinningCircle"/>
        </div>
      )
    } else {
      return <svg className="vpc-spotimbed-art vpc-spotimbed-art-default" width="52" height="52" viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg"><title>Album</title><path d="M26 0.00100708C11.641 0.00100708 0 11.642 0 26.001C0 40.36 11.641 52.001 26 52.001C40.36 52 52 40.36 52 26C52 11.64 40.36 0.00100708 26 0.00100708ZM26 50C12.767 50 2 39.234 2 26C2 12.766 12.767 2.00001 26 2.00001C39.234 2.00001 50 12.766 50 26C50 39.234 39.234 50 26 50ZM26 18C21.582 18 18 21.582 18 26C18 30.418 21.582 34 26 34C30.418 34 34 30.418 34 26C34 21.582 30.419 18 26 18ZM26 32C22.692 32 20 29.309 20 26C20 22.691 22.692 20 26 20C29.308 20 32 22.691 32 26C32 29.309 29.309 32 26 32Z" fill="currentColor" fill-rule="evenodd"></path></svg>
    }
  }
  renderPlaceholderInfo() {
    return (
      <div className="vpc-spotimbed-info">
        <div><span className="vpc-spotimbed-placeholder">movies for guys</span></div>
        <div><span className="vpc-spotimbed-placeholder">by dltzk</span></div>
        <div><span className="vpc-spotimbed-placeholder">on Frailty</span></div>
      </div>
    )
  }
  renderResourceLink(resourceData, className = '') {
    let name = resourceData.name
    let url = resourceData.external_urls?.spotify

    if (resourceData.type === 'user') name = resourceData.display_name

    return <a
      className={['vpc-spotimbed-link'].concat(className.split(' ')).join(' ')}
      href={url}
      data-resource-link={true}
      target="_blank"
      title={name}
    >{name}</a>
  }
  renderByline(people) {
    const by = people.length === 1
      ? this.renderResourceLink(people[0])
      : this.renderArtists(people)
    return (
      <div className="vpc-spotimbed-infoline">
        <span>by </span>
        {by}
      </div>
    )
  }
  renderArtists(artists) {
    const artistNames = artists.map(artist => artist.name).join(', ')
    const artistLinks = artists.map(artist => (
      <a
        className="vpc-spotimbed-link vpc-spotimbed-infoline"
        href={artist.external_urls.spotify}
        target="_blank"
      >{artist.name}</a>
    )).reduce((a, b) => [a, ', ', b])
    return <span title={artistNames}>{artistLinks}</span>
  }
  renderTrackRowInfo(track) {
    return (
      <div className="vpc-spotimbed-trackrow-info">
        {this.renderResourceLink(track, 'vpc-spotimbed-trackrow-title')}
        <div className="vpc-spotimbed-trackrow-infoline">{this.renderByline(track.artists)}</div>
      </div>
    )
  }
  renderTrackList(tracks) {
    const tracklistItems = []

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i]
      const columns = []
      columns.push(<div className="vpc-spotimbed-trackrow-index vpc-spotimbed-mono">{i + 1}</div>)
      columns.push(this.renderTrackRowInfo(track))
      columns.push(<div className="vpc-spotimbed-trackrow-length vpc-spotimbed-mono">{formatDuration(track.duration_ms)}</div>)
      tracklistItems.push(
        <div
          className={toClassName(['vpc-spotimbed-trackrow'], {
            'vpc-spotimbed-active': i === this.state.selectedTrack
          })}
          onClick={() => {
            if (i === this.state.selectedTrack) return
            this.setState({ selectedTrack: i })
          }}
          ref={i === this.state.selectedTrack && this.contrastRef('track-row-active')}
        >
          {columns}
        </div>
      )
    }

    return tracklistItems
  }
  render() {
    const {
      AudioControls,
      art: artUrl,
      type: resourceType,
      id: resourceId,
      classNames,
    } = this.props

    switch (resourceType) {
      case 'track': {
        this.fetchArt(artUrl).then(() => this.getSwatches())
        this.fetchResourceData(resourceType, resourceId)

        const art = this.renderArt()

        let info
        const { resourceData } = this.state
        if (resourceData) {
          info = (
            <div className="vpc-spotimbed-info">
              <div className="vpc-spotimbed-titleline">
                {this.renderResourceLink(resourceData, 'vpc-spotimbed-title')}
                <span className="vpc-spotimbed-title-tag vpc-spotimbed-mono">{formatDuration(resourceData.duration_ms)}</span>
              </div>
              <div className="vpc-spotimbed-infoline-wrap">{this.renderByline(resourceData.artists)}</div>
              <div className="vpc-spotimbed-infoline-wrap">
                <div className="vpc-spotimbed-infoline">on {this.renderResourceLink(resourceData.album, 'vpc-spotimbed-track-album')}</div>
              </div>
            </div>
          )
        } else {
          info = this.renderPlaceholderInfo()
        }

        return (
          <div className="vpc-spotimbed-embed" style={this.getEmbedStyle()}>
            <div className="vpc-spotimbed-art-wrap">
              {art}
            </div>
            {info}
            <AudioControls mediaHref={this.state.resourceData?.preview_url}/>
          </div>
        )
      }
      case 'album': {
        this.fetchArt(artUrl).then(() => this.getSwatches())
        this.fetchResourceData(resourceType, resourceId)

        const art = this.renderArt()

        const { resourceData } = this.state

        let info
        let trackListItems
        let previewUrl

        if (resourceData) {
          let albumType = 'Album'
          if (resourceData.album_type === 'single') {
            // https://support.cdbaby.com/hc/en-us/articles/360008275672-What-is-the-difference-between-Single-EP-and-Albums-
            albumType = resourceData.total_tracks >= 4 ? 'EP' : 'Single'
          } else if (resourceData.album_type === 'compilation') {
            albumType = 'Compilation'
          }

          const releaseDate = this.formatReleaseDate(resourceData.release_date)
          let secondaryInfo = releaseDate
          if (resourceData.total_tracks > 1) {
            secondaryInfo += ` \u2022 ${resourceData.total_tracks} songs`
          }

          info = (
            <div className="vpc-spotimbed-info">
              <div className="vpc-spotimbed-titleline">
                {this.renderResourceLink(resourceData, 'vpc-spotimbed-title')}
                <span className="vpc-spotimbed-title-tag">{albumType}</span>
              </div>
              <div className="vpc-spotimbed-infoline-wrap">{this.renderByline(resourceData.artists)}</div>
              <div className="vpc-spotimbed-infoline vpc-spotimbed-infoline-secondary">{secondaryInfo}</div>
            </div>
          )

          trackListItems = this.renderTrackList(resourceData.tracks.items)
          previewUrl = resourceData.tracks.items[this.state.selectedTrack].preview_url
        } else {
          info = this.renderPlaceholderInfo()
        }

        return (
          <div className="vpc-spotimbed-embed" style={this.getEmbedStyle()}>
            <div className="vpc-spotimbed-art-wrap">
              {art}
            </div>
            {info}
            <div className={`vpc-spotimbed-content vpc-spotimbed-tracklist ${classNames.thin}`}>{trackListItems}</div>
            <AudioControls mediaHref={previewUrl}/>
          </div>
        )
      }
      case 'playlist': {
        this.fetchArt(artUrl).then(() => this.getSwatches())
        this.fetchResourceData(resourceType, resourceId)

        const art = this.renderArt()

        const { resourceData } = this.state

        let info
        let trackListItems
        let previewUrl

        if (resourceData) {
          const secondaryInfo = `${resourceData.followers.total} likes` +
            ` \u2022 ${resourceData.tracks.total} songs` +
            `` // TODO: duration

          info = (
            <div className="vpc-spotimbed-info">
              <div className="vpc-spotimbed-titleline">
                {this.renderResourceLink(resourceData, 'vpc-spotimbed-title')}
              </div>
              <div className="vpc-spotimbed-infoline-wrap">{this.renderByline([resourceData.owner])}</div>
              <div className="vpc-spotimbed-infoline vpc-spotimbed-infoline-secondary">{secondaryInfo}</div>
            </div>
          )

          const tracks = resourceData.tracks.items
            .filter(item => !item.is_local && item.track)
            .map(item => item.track)
          trackListItems = this.renderTrackList(tracks)
          previewUrl = tracks[this.state.selectedTrack]?.preview_url
        } else {
          info = this.renderPlaceholderInfo()
        }

        return (
          <div className="vpc-spotimbed-embed" style={this.getEmbedStyle()}>
            <div className="vpc-spotimbed-art-wrap">
              {art}
            </div>
            {info}
            <div className={`vpc-spotimbed-content vpc-spotimbed-tracklist ${classNames.thin}`}>{trackListItems}</div>
            <AudioControls mediaHref={previewUrl}/>
          </div>
        )
      }
      case 'artist': {
        this.fetchArt(artUrl).then(() => this.getSwatches())
        this.fetchResourceData(resourceType, resourceId)

        const art = this.renderArt()

        const { resourceData } = this.state

        let info
        let trackListItems
        let previewUrl

        if (resourceData) {
          info = (
            <div className="vpc-spotimbed-info">
              <div className="vpc-spotimbed-titleline">
                {this.renderResourceLink(resourceData, 'vpc-spotimbed-title')}
              </div>
              <div className="vpc-spotimbed-infoline vpc-spotimbed-infoline-secondary">Top Tracks</div>
            </div>
          )

          trackListItems = this.renderTrackList(resourceData.top_tracks)
          previewUrl = resourceData.top_tracks[this.state.selectedTrack].preview_url
        } else {
          info = this.renderPlaceholderInfo()
        }

        return (
          <div className="vpc-spotimbed-embed" style={this.getEmbedStyle()}>
            <div className="vpc-spotimbed-art-wrap">
              {art}
            </div>
            {info}
            <div className={`vpc-spotimbed-content vpc-spotimbed-tracklist ${classNames.thin}`}>{trackListItems}</div>
            <AudioControls mediaHref={previewUrl}/>
          </div>
        )
      }
      default: {
        return <div className="vpc-spotimbed-unsupported">This Spotify embed is not supported by SpotImbed, please <a href={REPO_ISSUES_URL} target="_blank">open an issue</a> and include the above link</div>
      }
    }
  }
})
