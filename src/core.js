'use strict'

const request = require('request')
/**
 * Core
 * @type {object}
 */
const core = {}

/** @type {string} */
core.latestVersion = ''

/**
 * Fetch latest version for the core
 */
core.fetchLatestVersion = function () {
  request('https://raw.githubusercontent.com/brainfoolong/web-ftp-client/master/package.json', function (error, response, body) {
    if (!error) {
      const manifest = JSON.parse(body)
      if (manifest && manifest.version) {
        core.latestVersion = manifest.version
      }
    }
  })
}

// fetch latest version each hour
setInterval(core.fetchLatestVersion, 1000 * 60 * 60)
// and call 5 second after server startup
setTimeout(core.fetchLatestVersion, 5000)

module.exports = core
