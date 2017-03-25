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
  transfers.listeners.push(user)
}

module.exports = action
