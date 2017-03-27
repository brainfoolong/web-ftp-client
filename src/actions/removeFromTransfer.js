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
  let entries = transfers.getEntries()
  for (let i = 0; i < message.entries.length; i++) {
    delete entries[message.entries[i]]
  }
  transfers.saveEntries(entries)
  callback()
}

module.exports = action
