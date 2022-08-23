const { get } = require('powercord/http')
const { getModule, http, spotify, constants: { Endpoints } } = require('powercord/webpack')
const { SPOTIFY_BASE_URL } = require('./constants.js')

let usedCached = false

module.exports = {
  accessToken: null,
  accessTokenPromise: null,
  resourcePromises: {},

  getAccessToken() {
    if (this.accessTokenPromise) return this.accessTokenPromise
    this.accessTokenPromise = (async () => {
      if (!usedCached) {
        const spotifyMdl = await getModule([ 'getActiveSocketAndDevice' ])
        const active = spotifyMdl.getActiveSocketAndDevice()
        if (active?.socket?.accessToken) {
          usedCached = true
          this.accessTokenPromise = null
          return active.socket.accessToken
        }
      }

      usedCached = false
      const spotifyUserID = await http.get(Endpoints.CONNECTIONS)
        .then(res =>
          res.body.find(connection =>
            connection.type === 'spotify'
          ).id
        )

      return spotify.getAccessToken(spotifyUserID)
        .then(r => {
          this.accessTokenPromise = null
          return r.body.access_token
        }).catch(error => {
          console.error(error)
          return new Promise(() => {})
        })
    })()
    return this.accessTokenPromise
  },

  genericRequest(request) {
    request.set('Authorization', `Bearer ${this.accessToken}`)
    return request
      .catch(async (err) => {
        if (err) {
          if (err.statusCode === 401) {
            this.accessToken = await this.getAccessToken()
            delete request._res
            return this.genericRequest(request)
          }
          console.error(err.body, request.opts)
          throw err
        }
      })
  },
  getResource(resourcePath) {
    if (this.resourcePromises[resourcePath]) return this.resourcePromises[resourcePath]
    const resourcePromise = this.genericRequest(
      get(`${SPOTIFY_BASE_URL}${resourcePath}`)
    ).then(r => {
      delete this.resourcePromises[resourcePath]
      return r.body
    })
    this.resourcePromises[resourcePath] = resourcePromise
    return resourcePromise
  },

  getTrack(trackId) {
    return this.getResource(`/tracks/${trackId}`)
  },
  getAlbum(albumId) {
    return this.getResource(`/albums/${albumId}`)
  },
  getPlaylist(playlistId) {
    return this.getResource(`/playlists/${playlistId}`)
  },
  getArtist(artistId) {
    return this.getResource(`/artists/${artistId}`)
  },
  getArtistTopTracks(artistId, market) {
    return this.getResource(`/artists/${artistId}/top-tracks?market=${market}`)
  },

  search(query, type = 'track', limit = 20) {
    return this.genericRequest(
      get(`${SPOTIFY_BASE_URL}/search`)
        .query('q', query)
        .query('type', type)
        .query('limit', limit)
    ).then(r => r.body)
  },

  async _fetchAll(url, limit, offset) {
    const items = []
    while (url) {
      const req = get(url)
      if (limit) {
        req.query('limit', limit)
        limit = 0
      }
      if (offset) {
        req.query('offset', offset)
        offset = 0
      }
      const res = await this.genericRequest(req).then(r => r.body)
      items.push(...res.items)
      url = res.next
    }
    return items
  }
}
