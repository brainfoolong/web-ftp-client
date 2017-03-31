'use strict'

const path = require('path')
const db = require(path.join(__dirname, '../db'))

const action = {}

/**
 * Require admin
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
  const servers = db.get('servers').cloneDeep().value()
  // strip out sensible data
  if (servers) {
    for (let i in servers) {
      delete servers[i].keyfile_passphrase
      delete servers[i].password
    }
  }
  callback(servers)
}

module.exports = action
