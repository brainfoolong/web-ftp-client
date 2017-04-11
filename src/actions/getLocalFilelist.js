'use strict'

const path = require('path')
const fs = require('fs')
const Server = require(path.join(__dirname, '../server'))

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
  const server = Server.get(message.server)
  const rootDir = path.join(__dirname, '../..')
  // special handler, dot refers to web client root
  if (typeof message.directory === 'undefined' || message.directory === '') {
    message.directory = server.getServerData().root_local || '.'
  }
  if (message.directory === '.') {
    message.directory = path.join(__dirname, '../../..')
  }
  // add a separator if non exist
  if (!message.directory.match(/[\\/]/)) {
    message.directory += path.sep
  }
  message.directory = path.normalize(message.directory)
  if (message.directory.substr(0, rootDir.length) === rootDir) {
    server.logError(new Error('Directory access denied'))
    callback()
    return
  }
  // check if directory exist and return valid stats
  try {
    let stat = fs.statSync(path.join(message.directory))
    if (!stat.isDirectory()) {
      throw Error(message.directory + ' is not a directory')
    }
  } catch (e) {
    server.logError(e)
    callback()
    return
  }
  let files = fs.readdirSync(message.directory)
  for (let i = 0; i < files.length; i++) {
    let file = files[i]
    let stat = null
    // if can't read specific file, ignore
    // those are generally some system files that the user is not allowed to see
    try {
      stat = fs.statSync(path.join(message.directory, file))
    } catch (e) {
      continue
    }
    filesout.push({
      'filename': file,
      'path': path.join(message.directory, file),
      'isDirectory': stat.isDirectory(),
      'size': stat.size,
      'mtime': stat.mtime
    })
  }
  callback({
    'currentDirectory': message.directory,
    'files': filesout
  })
}

module.exports = action
