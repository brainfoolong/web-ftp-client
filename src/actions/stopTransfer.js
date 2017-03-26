'use strict'

const transfers = require('./../transfers')
const db = require('./../db')
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
  db.get('transfers').set('enabled', false).value()
  for (let i in FtpServer.instances) {
    FtpServer.instances[i].disconnect()
  }
}

module.exports = action
