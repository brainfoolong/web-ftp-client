'use strict'

const extend = require('extend')
const path = require('path')
const db = require(path.join(__dirname, '../db'))
const hash = require(path.join(__dirname, '../hash'))
const WebSocketUser = require(path.join(__dirname, '../websocketuser'))

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
  const formData = message.formData
  if (formData.username) {
    const users = db.get('users').cloneDeep().value()
    let hasAdmin = false
    for (let i in users) {
      if (users[i].admin) {
        hasAdmin = true
        break
      }
    }
    let storedData = {}
    if (message.id) {
      storedData = db.get('users').get(message.id).cloneDeep().value()
    } else {
      storedData = {
        'id': db.getNextId()
      }
      storedData.loingHash = hash.random(32)
    }
    storedData.passwordHash = hash.saltedMd5(formData.password)

    if (formData.admin) {
      hasAdmin = true
    }
    if (!hasAdmin) {
      callback(false)
    } else {
      // simply merging
      // data from form into data object
      extend(true, storedData, formData)
      db.get('users').set(storedData.id, storedData).write()
      // disconnect the users that have been edited
      for (let i = 0; i < WebSocketUser.instances.length; i++) {
        if (WebSocketUser.instances[i].userData.id === storedData.id) {
          WebSocketUser.instances[i].socket.close()
        }
      }
      callback(true)
    }
  }
}

module.exports = action
