'use strict'

const transfers = require('./../transfers')
const path = require('path')
const FtpServer = require('./../ftpServer')
const db = require('./../db')
const fstools = require('./../fstools')

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
  /**
   * Add files to queue
   * @param {FtpServer} ftpServer
   * @param {[]} files
   */
  const addFiles = function (ftpServer, files) {
    let entries = []
    const nextFile = function () {
      if (!files.length) {
        // if all done, add to queue
        transfers.addToQueueBulk(ftpServer.server.id, entries)
        return
      }
      let file = files.shift()
      let serverPath = file.path
      let relativePath = serverPath.substr(message.serverPath.length)
      let localPath = path.join(message.localPath, relativePath)
      entries.push({
        'id': db.getNextId(),
        'mode': message.mode,
        'server': message.server,
        'localPath': fstools.slugifyPath(localPath),
        'serverPath': serverPath,
        'directory': file.directory,
        'status': 'queue',
        'size': file.attrs.size,
        'priority': 0
      })
      if (file.directory && message.recursive) {
        // let em some time to breath for this heavy duty jobs
        setTimeout(function () {
          ftpServer.readdir(file.path, function (filesSub) {
            nextFile()
            addFiles(ftpServer, filesSub)
          })
        }, 150)
      } else {
        nextFile()
      }
    }
    nextFile()
  }
  FtpServer.get(message.server, function (ftpServer) {
    if (ftpServer) {
      addFiles(ftpServer, message.files)
      // start transfer if requested
      if (message.forceTransfer) {
        setTimeout(function () {
          require('./startTransfer').execute(user, message, callback)
        }, 3000)
      }
    }
  })
}

module.exports = action
