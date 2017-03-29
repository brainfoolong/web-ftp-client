'use strict'

const path = require('path')
const db = require(path.join(__dirname, '../db'))
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
  FtpServer.get(message.serverId, function (ftpServer) {
    if (ftpServer) {
      ftpServer.stopTransfers()
      ftpServer.deleteQueues()
      ftpServer.disconnect()
      let servers = db.get('servers').value()
      delete servers[message.serverId]
      db.get('servers').setState(servers)
      callback()
    } else {
      callback()
    }
  })
}

module.exports = action
