'use strict'

const transfers = require('./../transfers')
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
  let entries = transfers.getEntries()
  // stop transfers for each ftp server that currently processing this entries
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
    delete entries[message.entries[i]]
  }
  transfers.saveEntries(entries)
  callback()
}

module.exports = action
