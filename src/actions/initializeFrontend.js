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
  // if we've got some login credentials than check against db if login is valid
  const userData = db.get('users').get(message.loginData.id).cloneDeep().value()
  const valid = userData && userData.loginHash === message.loginData.hash
  if (valid) {
    // set the socket userdata if valid login
    user.userData = userData
  }
  callback(user.userData)
}

module.exports = action
