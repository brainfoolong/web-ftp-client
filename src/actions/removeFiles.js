'use strict'

const fstools = require(__dirname + '/../fstools')
const fs = require('fs')
const Server = require(__dirname + '/../server')
const FtpServer = require(__dirname + '/../ftpserver')

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
  const server = Server.get(message.server)
  if (message.mode === 'local') {
    try {
      for (let i = 0; i < message.files.length; i++) {
        let file = message.files[i]
        if (file.isDirectory) {
          fstools.deleteRecursive(file.path, function (filepath) {
            server.log('log.local.file.deleted', {'file': filepath})
          })
        } else {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path)
            server.log('log.local.file.deleted', {'file': file.path})
          }
        }
      }
      callback()
    } catch (err) {
      server.logError(err)
    }
  }
  if (message.mode === 'server') {
    FtpServer.get(message.server, function (ftpServer) {
      if (ftpServer) {
        let filesDeleted = 0
        for (let i = 0; i < message.files.length; i++) {
          let file = message.files[i]
          const doneCallback = function () {
            filesDeleted++
            if (filesDeleted === message.files.length) {
              callback()
            }
          }
          if (file.isDirectory) {
            ftpServer.rmdir(file.path, true, function (err) {
              if (err) {
                server.logError(err)
                return
              }
              doneCallback()
              server.log('log.server.file.deleted', {'file': file.path})
            })
          } else {
            ftpServer.deleteFile(file.path, function (err) {
              if (err) {
                server.logError(err)
                return
              }
              doneCallback()
              server.log('log.server.file.deleted', {'file': file.path})
            })
          }
        }
      }
    })
  }
}

module.exports = action
