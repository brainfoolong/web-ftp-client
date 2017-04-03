'use strict'

const path = require('path')
const fs = require('fs')
const db = require(path.join(__dirname, '../db'))
const core = require(path.join(__dirname, '../core'))

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
    'latestVersion': core.latestVersion,
    'currentVersion': require(path.join(__dirname, '../../package')).version,
    'development': require(path.join(__dirname, '../config')).development,
    'changelog': require('marked')(fs.readFileSync(path.join(__dirname, '../../CHANGELOG.md')).toString())
  })
}

module.exports = action
