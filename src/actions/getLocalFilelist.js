'use strict'

const db = require('./../db')
const fs = require('fs')
const path = require('path')

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
  let filesout = []
  let files = fs.readdirSync(message.directory)
  for (let i = 0; i < files.length; i++) {
    let file = files[i]
    let stat = fs.statSync(path.join(message.directory, file))
    filesout.push({
      "filename" : file,
      "directory" : stat.isDirectory(),
      "attrs" : stat
    })
  }
  callback(filesout)
}

module.exports = action
