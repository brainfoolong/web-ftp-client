'use strict'

const path = require('path')
const db = require(path.join(__dirname, '../db'))

const action = {}

/**
 * Require user
 * @type {boolean}
 */
action.requireUser = false

/**
 * Execute the action
 * @param {WebSocketUser} user
 * @param {*} message
 * @param {function} callback
 */
action.execute = function (user, message, callback) {
  callback({
    'installed': db.get('users').size().value() > 0,
    'version': require(path.join(__dirname, '../core')).latestVersion
  })
}

module.exports = action
