'use strict'

const path = require('path')
const queue = require(path.join(__dirname, '../queue'))

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
  queue.transferNext()
}

module.exports = action
