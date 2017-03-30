'use strict'

const path = require('path')
const fs = require('fs')
const FtpServer = require(path.join(__dirname, '../ftpServer'))
const fstools = require(path.join(__dirname, '../fstools'))

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
  if (message.type === 'server') {
    FtpServer.get(message.serverId, function (server) {
      if (!server) {
        callback()
        return
      }
      server.mkdir(message.directory + '/' + message.directoryName, function (list) {
        callback()
      })
    })
  }
  if (message.type === 'local') {
    fs.mkdirSync(message.directory + '/' + message.directoryName, fstools.defaultMask)
    callback()
  }
}

module.exports = action
