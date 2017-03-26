'use strict'

const transfers = require('./../transfers')

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
  callback(transfers.getEntries())
  // add the user to the logs listeners
  // will receive messages when something in the transfers changes
  transfers.listeners.push(user)
}

module.exports = action
