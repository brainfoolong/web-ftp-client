'use strict'

const queue = require('./../queue')
const FtpServer = require('./../ftpServer')

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
  // stop queue for each ftp server that currently processing this entries
  if (message.progressEntries) {
    let servers = {}
    for (let i = 0; i < message.progressEntries.length; i++) {
      let entry = message.progressEntries[i]
      servers[entry.id] = entry.id
    }
    for (let i in servers) {
      FtpServer.get(servers[i], function (ftpServer) {
        if (ftpServer) {
          ftpServer.stopTransfers()
        }
      })
    }
  }
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
