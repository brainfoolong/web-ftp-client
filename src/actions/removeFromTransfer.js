'use strict'

const queue = require(__dirname + '/../queue')
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
  let entries = queue.getEntries()
  for (let i = 0; i < message.entries.length; i++) {
    // is entry currently in transfering state, stop transfers from this server
    let entry = entries[message.entries[i]]
    if (entry.status === 'transfering') {
      FtpServer.get(entry.serverId, function (ftpServer) {
        if (ftpServer) {
          ftpServer.stopTransfers()
        }
      })
    }
    delete entries[message.entries[i]]
  }
  queue.saveEntries(entries)
  callback()
}

module.exports = action
