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
    for (let i = 0; i < files.length; i++) {
      let file = files[i]
      let serverPath = file.path
      let relativePath = serverPath.substr(message.serverPath.length)
      let localPath = path.join(message.localPath, relativePath)
      entries.push({
        'id': db.getNextId(),
        'type': message.type,
        'server': message.server,
        'localPath': fstools.slugifyPath(localPath),
        'serverPath': serverPath,
        'directory': file.directory,
        'status': 'queue',
        'size': file.attrs.size,
        'priority': 0
      })
      if (file.directory && message.recursive) {
        ftpServer.readdir(file.path, function (filesSub) {
          // let em some time to breath
          // this jobs are heavy for tons of files
          setTimeout(function () {
            addFiles(ftpServer, filesSub)
          }, 50);
        })
      }
    }
    transfers.addToQueueBulk(ftpServer.server.id, entries)
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
