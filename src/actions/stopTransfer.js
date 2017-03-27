'use strict'

const FtpServer = require('./../FtpServer')

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
  // stop transfers for each server
  for (let i in FtpServer.instances) {
    FtpServer.instances[i].stopTransfers()
    FtpServer.instances[i].server.log('log.server.transfers.stopped')
  }
}

module.exports = action
