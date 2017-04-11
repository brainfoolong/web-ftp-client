'use strict'

const path = require('path')
const FtpServer = require(path.join(__dirname, '../ftpServer'))
const Server = require(path.join(__dirname, '../server'))

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
    if (!ftpServer) {
      callback()
      return
    }
    const server = Server.get(message.server)
    if (typeof message.directory === 'undefined' || message.directory === '') {
      message.directory = server.getServerData().root_server || '/'
    }
    ftpServer.readdir(message.directory, function (list) {
      callback({
        'currentDirectory': message.directory,
        'files': list
      })
    })
  })
}

module.exports = action
