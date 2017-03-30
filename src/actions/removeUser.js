'use strict'

const path = require('path')
const db = require(path.join(__dirname, '../db'))
const WebSocketUser = require(path.join(__dirname, '../websocketuser'))

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
  let users = db.get('users').cloneDeep().value()
  delete users[message.userId]
  // validate that there is always at least one admin
  let hasAdmin = false
  for (let i in users) {
    if (users[i].admin) {
      hasAdmin = true
      break
    }
  }
  if (hasAdmin) {
    db.get('users').setState(users)
    // disconnect the users that have been removed
    for (let i = 0; i < WebSocketUser.instances.length; i++) {
      if (WebSocketUser.instances[i].userData.id === parseInt(message.userId)) {
        WebSocketUser.instances[i].socket.close()
      }
    }
  }
  callback(hasAdmin)
}

module.exports = action
