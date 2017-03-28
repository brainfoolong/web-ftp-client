'use strict'

const path = require('path')
const FtpServer = require(path.join(__dirname, '../ftpServer'))

const action = {}

/**
 * Require user
 * @type {boolean}
 */
action.requireUser = true

/**
 * Execute the action
 * @param {WebSocketUser} user
 * @param {*} message
 * @param {function} callback
 */
action.execute = function (user, message, callback) {
  // stop queue for each server
  for (let i in FtpServer.instances) {
    FtpServer.instances[i].server.log('log.server.queue.stopped')
    FtpServer.instances[i].stopTransfers()
  }
}

module.exports = action
