'use strict'

const db = require('./../db')

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
    'version': require('./../core').latestVersion
  })
}

module.exports = action