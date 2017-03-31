'use strict'

const path = require('path')
const os = require('os')
const exec = require('child_process').exec
const config = require(path.join(__dirname, '../config'))

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
  if (os.platform() !== 'linux' || config.development) {
    callback(false)
    return
  }
  const dir = path.join(__dirname, '../..')
  exec('cd ' + dir + ' && ./wfc update', null, function () {
    callback(true)
  })
}

module.exports = action
