'use strict'

const path = require('path')
const logs = require(path.join(__dirname, '../logs'))

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
  callback(logs.get())
  // add the user to the logs listeners
  // will receive messages when new logs have been added
  logs.listeners.push(user)
}

module.exports = action
