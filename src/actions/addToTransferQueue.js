'use strict'

const path = require('path')
const fs = require('fs')
const queue = require('./../queue')
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
        queue.addToQueueBulk(ftpServer.server.id, entries)
        return
      }
      let file = files.shift()
      let serverPath = null
      let relativePath = null
      let localPath = null

      if (message.mode === 'download') {
        serverPath = file.path
        relativePath = serverPath.substr(message.serverDirectory.length)
        localPath = fstools.slugifyPath(path.join(message.localDirectory, relativePath))
      }
      if (message.mode === 'upload') {
        localPath = file.path
        relativePath = localPath.substr(message.localDirectory.length)
        serverPath = fstools.slugifyPath(message.serverDirectory + '/' + relativePath.replace(/[\\]/g, '/')).replace(/[\\]/g, '/')
      }
      if (file.isDirectory) {
        if (message.recursive) {
          // let em some time to breath for this heavy duty jobs
          setTimeout(function () {
            if (message.mode === 'download') {
              ftpServer.readdir(file.path, function (filesSub) {
                nextFile()
                addFiles(ftpServer, filesSub)
              })
            }
            if (message.mode === 'upload') {
              let files = fs.readdirSync(file.path)
              let fileObjects = []
              for (let i = 0; i < files.length; i++) {
                let filepath = path.join(file.path, files[i])
                const stat = fs.statSync(filepath)
                fileObjects.push({
                  'filename': files[i],
                  'path': filepath,
                  'size': stat.size,
                  'mtime': stat.mtime,
                  'isDirectory': stat.isDirectory()
                })
              }
              nextFile()
              addFiles(ftpServer, fileObjects)
            }
          }, 150)
        }
      } else {
        entries.push(new queue.QueueEntry(
          db.getNextId(),
          message.mode,
          message.server,
          localPath,
          serverPath,
          file.isDirectory,
          'queue',
          file.size,
          0
        ))
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
