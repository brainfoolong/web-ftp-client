'use strict'

const transfers = require('./../transfers')
const path = require('path')
const FtpServer = require('./../ftpServer')

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
    for (let i = 0; i < files.length; i++) {
      let file = files[i]
      let serverPath = file.path
      let relativePath = serverPath.substr(message.serverPath.length)
      let localPath = path.join(message.localPath, relativePath)
      transfers.addToQueue(message.type, message.server, localPath, serverPath, file.directory, file.attrs.size)
      if (file.directory && message.recursive) {
        ftpServer.readdir(file.path, function (files) {
          addFiles(ftpServer, files)
        })
      }
    }
  }
  FtpServer.get(message.server, function (ftpServer) {
    if (ftpServer) {
      addFiles(ftpServer, message.files)
      // start transfer if requested
      if (message.download) {
        setTimeout(function () {
          require('./startTransfer').execute(user, message, callback)
        }, 3000)
      }
    }
  })
}

module.exports = action
