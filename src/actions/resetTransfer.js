'use strict'

const path = require('path')
const queue = require(path.join(__dirname, '../queue'))
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
  let entries = queue.getEntries()
  for (let i = 0; i < message.entries.length; i++) {
    // is entry currently in transfering state, stop transfers from this server
    let entry = entries[message.entries[i]]
    if (!entry) continue
    if (entry.status === 'transfering') {
      FtpServer.get(entry.serverId, function (ftpServer) {
        if (ftpServer) {
          ftpServer.stopTransfers()
        }
      }, true)
    }
    entry.status = 'queue'
    queue.bulkSendToListeners('transfer-status-update', {'id': entry.id, 'status': entry.status})
  }
  queue.saveEntries(entries)
}

module.exports = action
