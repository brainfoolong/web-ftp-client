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
  FtpServer.get(message.server, function (ftpServer) {
    if (ftpServer) {
      ftpServer.disconnect()
    }
  }, true)
  callback()
}

module.exports = action
