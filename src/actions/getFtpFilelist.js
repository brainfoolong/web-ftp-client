'use strict'

const FtpServer = require(__dirname + '/../ftpServer')

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
  FtpServer.get(message.server, function (server) {
    if (!server) {
      callback()
      return
    }
    server.readdir(message.directory, function (list) {
      callback({
        'currentDirectory': message.directory,
        'files': list
      })
    })
  })
}

module.exports = action
