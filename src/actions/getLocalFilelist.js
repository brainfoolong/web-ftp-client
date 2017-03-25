'use strict'

const db = require('./../db')
const Server = require('./../server')
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
  let server = Server.get(message.server)
  if (message.directory === '.') {
    message.directory = path.join(__dirname, '../..')
  }
  if (!message.directory.match(/[\\\/]/)) {
    message.directory += path.sep
  }
  message.directory = path.normalize(message.directory)
  try {
    fs.statSync(path.join(message.directory))
  } catch (e) {
    server.log(e.message, "error")
    callback()
    return
  }
  let files = fs.readdirSync(message.directory)
  for (let i = 0; i < files.length; i++) {
    let file = files[i]
    let stat = null
    try {
      stat = fs.statSync(path.join(message.directory, file))
    } catch (e) {
      continue
    }
    filesout.push({
      'filename': file,
      'path': path.join(message.directory, file),
      'directory': stat.isDirectory(),
      'attrs': stat
    })
  }
  callback({
    'currentDirectory': message.directory,
    'files': filesout
  })
}

module.exports = action
