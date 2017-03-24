'use strict'

const db = require('./../db')
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
  var server = FtpServer.get(message.server)
  callback()

}

module.exports = action
