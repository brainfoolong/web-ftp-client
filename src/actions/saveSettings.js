'use strict'

const path = require('path')
const db = require(path.join(__dirname, '../db'))

const action = {}

/**
 * Require admin
 * @type {boolean}
 */
action.requireAdmin = true

/**
 * Execute the action
 * @param {WebSocketUser} user
 * @param {*} message
 * @param {function} callback
 */
action.execute = function (user, message, callback) {
  db.get('settings').set('settings', message).write()
  callback()
}

module.exports = action
