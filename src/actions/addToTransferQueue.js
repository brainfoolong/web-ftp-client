'use strict'

const path = require('path')
const fs = require('fs')
const queue = require(path.join(__dirname, '../queue'))
const FtpServer = require(path.join(__dirname, '../ftpServer'))
const db = require(path.join(__dirname, '../db'))
const fstools = require(path.join(__dirname, '../fstools'))

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
  let filterRegex = null
  if (message.filter) {
    filterRegex = new RegExp(message.filter.replace(/\*/g, '.*?').replace(/ /g, '|'), 'i')
  }
  const flat = filterRegex && message.flat

  /**
   * Add files to queue
   * @param {FtpServer} ftpServer
   * @param {[]} files
   * @param {function} callback
   */
  const addFiles = function (ftpServer, files, callback) {
    let entries = []
    let filesDone = 0
    let filesCount = files.length
    const fileProcessCallback = function () {
      filesDone++
      if (filesDone >= filesCount) {
        callback()
      }
    }
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
        if (flat) {
          localPath = fstools.slugifyPath(path.join(message.localDirectory, path.basename(serverPath)))
        }
      }
      if (message.mode === 'upload') {
        localPath = file.path
        relativePath = localPath.substr(message.localDirectory.length)
        serverPath = fstools.slugifyPath(message.serverDirectory + '/' + relativePath.replace(/[\\]/g, '/')).replace(/[\\]/g, '/')
        if (flat) {
          serverPath = fstools.slugifyPath(path.join(message.serverDirectory, path.basename(localPath)))
        }
      }

      const queueEntry = new queue.QueueEntry(
        db.getNextId(),
        message.mode,
        message.server,
        localPath,
        serverPath,
        file.isDirectory,
        'queue',
        file.size,
        0,
        message.replace
      )
      if (file.isDirectory) {
        if (message.recursive) {
          // let em some time to breath for this heavy duty jobs
          setTimeout(function () {
            if (message.mode === 'download') {
              ftpServer.readdir(file.path, function (filesSub) {
                if (!flat) entries.push(queueEntry)
                nextFile()
                addFiles(ftpServer, filesSub, fileProcessCallback)
              })
            }
            if (message.mode === 'upload') {
              if (!flat) entries.push(queueEntry)
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
              addFiles(ftpServer, fileObjects, fileProcessCallback)
            }
          }, 150)
        }
      } else {
        if (!filterRegex || file.path.match(filterRegex)) {
          entries.push(queueEntry)
        }
        nextFile()
        fileProcessCallback()
      }
    }
    if (!files.length) {
      fileProcessCallback()
    } else {
      nextFile()
    }
  }
  FtpServer.get(message.server, function (ftpServer) {
    if (ftpServer) {
      addFiles(ftpServer, message.files, function () {
        // start transfer if requested
        if (message.forceTransfer) {
          setTimeout(function () {
            require(path.join(__dirname, 'startTransfer')).execute(user, message, callback)
          }, 3000)
        }
      })
    }
  })
}

module.exports = action
