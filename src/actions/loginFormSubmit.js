'use strict'

const path = require('path')
const db = require(path.join(__dirname, '../db'))
const hash = require(path.join(__dirname, '../hash'))

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
  const formData = message
  if (formData.username && formData.password) {
    const pwHash = hash.saltedMd5(formData.password)
    let userData = db.get('users').find({
      'username': formData.username,
      'passwordHash': pwHash
    }).cloneDeep().value()
    if (userData) {
      // set the socket userdata if valid login
      user.userData = userData
      callback(userData)
      return
    }
    // create user as admin if not yet exist
    if (!db.get('users').size().value()) {
      userData = {
        'id': db.getNextId(),
        'username': formData.username,
        'passwordHash': pwHash,
        'loginHash': hash.random(32),
        'admin': true
      }
      delete userData.password
      // set the socket userdata with newly created credentials
      user.userData = userData
      db.get('users').set(userData.id, userData).write()
      callback(userData)
    }
  }
  callback(false)
}

module.exports = action
