'use strict'

const request = require('request')
const path = require('path')

/**
 * Core
 * @type {object}
 */
const core = {}

/** @type {string|null} */
core.latestVersion = null

/** @type {string|null} */
core.latestVersionZip = null

/**
 * Fetch latest version for the core
 * @param {function=} callback
 */
core.fetchLatestVersion = function (callback) {
  const pkg = require(path.join(__dirname, '../package'))
  request({
    url: 'https://api.github.com/repos/brainfoolong/' + pkg.name + '/releases',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
    }
  }, function (error, response, body) {
    if (!error) {
      const releases = JSON.parse(body)
      if (releases) {
        releases.sort(function (a, b) {
          return a.id < b.id
        })
        const release = releases.shift()
        core.latestVersion = release.tag_name
        if (release.assets) {
          core.latestVersionZip = release.assets[0].browser_download_url
        }
      }
    }
    if (callback) callback(body)
  })
}

// fetch latest version each hour
setInterval(core.fetchLatestVersion, 1000 * 60 * 60)
// and call 5 second after server startup
setTimeout(core.fetchLatestVersion, 5000)

module.exports = core
