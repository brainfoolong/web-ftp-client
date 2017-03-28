'use strict'

const FtpClient = require('ftp')
const SshClient = require('ssh2').Client
const path = require('path')
const db = require('./db')
const fs = require('fs')
const fstools = require('./fstools')
const queue = require('./queue')
const Server = require('./server')

/**
 * FTP handler for a server
 * @param {string} id
 */
function FtpServer (id) {
  const self = this
  FtpServer.instances[id] = this

  /** @type {string} */
  this.id = id
  /** @type {Server} */
  this.server = Server.get(id)
  /** @type {ftp} */
  this.ftpClient = null
  /** @type {sshClient} */
  this.sshClient = null
  /** @type {object} */
  this.sftp = null

  /**
   * Get date of a specific stat time
   * @param {number|string} time
   * @return Date
   */
  this.getDateOfTime = function (time) {
    if (typeof time === 'number') {
      return new Date(time * 1000)
    }
    return new Date(time)
  }

  /**
   * Connect
   * @param {function} callback
   */
  this.connect = function (callback) {
    self.server.log('log.ftpserver.connect')
    const serverData = self.server.getServerData()
    if (serverData.protocol === 'ftp') {
      self.ftpClient = new FtpClient()
      self.ftpClient.on('ready', function () {
        self.server.log('log.ftpserver.ready')
        callback(true)
      }).on('error', function (err) {
        self.disconnect()
        self.server.logError(err)
      }).on('end', function () {
        self.disconnect()
      }).connect({
        host: serverData.host,
        port: serverData.port,
        user: serverData.username,
        password: serverData.password,
        secure: serverData.encryption === 'none' ? false : serverData.encryption
      })
    }
    if (serverData.protocol === 'sftp') {
      self.sshClient = new SshClient()
      self.sshClient.on('ready', function () {
        self.server.log('log.ftpserver.ready')
        self.sshClient.sftp(function (err, sftp) {
          if (err) {
            self.server.logError(err)
            callback(false)
            self.disconnect()
            return
          }
          self.server.log('log.ftpserver.sftpready')
          self.sftp = sftp
          callback(true)
        })
      }).on('error', function (err) {
        self.disconnect()
        self.server.logError(err)
      }).on('end', function () {
        self.disconnect()
      }).connect({
        host: serverData.host,
        port: serverData.port,
        username: serverData.username,
        password: serverData.password
      })
    }
  }
  /**
   * Readdir
   * @param {string} directory
   * @param {function} callback
   */
  this.readdir = function (directory, callback) {
    self.server.log('log.ftpserver.readdir', {'directory': directory})
    if (this.ftpClient) {
      this.ftpClient.list(directory, function (err, list) {
        if (err) {
          self.server.logError(err)
          return
        }
        if (typeof list === 'undefined') {
          self.server.logError(new Error('Could not read directory ' + directory))
          return
        }
        const files = []
        for (let i = 0; i < list.length; i++) {
          let file = list[i]
          let path = directory
          if (path.substr(-1) !== '/') {
            path += '/'
          }
          path += file.name
          files.push({
            'size': file.size,
            'mtime': self.getDateOfTime(file.date),
            'filename': file.name,
            'isDirectory': file.type === 'd',
            'path': path
          })
        }
        callback(files)
      })
    }
    if (this.sshClient) {
      self.sftp.readdir(directory, function (err, list) {
        if (err) {
          self.server.logError(err)
          return
        }
        for (let i = 0; i < list.length; i++) {
          let stat = list[i]
          let file = {}
          file.filename = stat.filename
          file.size = stat.attrs.size
          file.mtime = self.getDateOfTime(stat.attrs.mtime)
          file.isDirectory = stat.longname.substr(0, 1) === 'd'
          file.path = directory
          if (file.path.substr(-1) !== '/') {
            file.path += '/'
          }
          file.path += file.filename
          list[i] = file
        }
        callback(list)
      })
    }
  }

  /**
   * Transfer given queue entry
   * @param {queue.QueueEntry} queueEntry
   * @param {function} step
   * @param {function} end
   * @param {function} error
   */
  this.transferQueueEntry = function (queueEntry, step, end, error) {
    self.server.log('log.ftpserver.' + queueEntry.mode, {
      'serverPath': queueEntry.serverPath,
      'localPath': queueEntry.localPath
    })

    const transferSettings = db.get('queue').get('settings').value()
    const _end = end
    const _error = error
    const stepInverval = setInterval(step, 150)

    // override the given handlers to cleanup before firing these callbacks
    end = function () {
      clearInterval(stepInverval)
      self.server.log('log.ftpserver.' + queueEntry.mode + '.complete', {
        'serverPath': queueEntry.serverPath,
        'localPath': queueEntry.localPath
      })
      _end()
    }
    error = function (err) {
      self.server.logError(err)
      clearInterval(stepInverval)
      _error(err)
    }

    let serverStat = null
    let localStat = null
    let useLocalPath = queueEntry.localPath
    let useServerPath = queueEntry.serverPath
    let localDirectory = path.dirname(queueEntry.localPath)
    let serverDirectory = path.dirname(queueEntry.serverPath)

    if (fs.existsSync(useLocalPath)) {
      localStat = fs.statSync(useLocalPath)
    }

    const statsReceived = function () {
      const destStat = queueEntry.mode === 'download' ? localStat : serverStat
      const srcStat = queueEntry.mode !== 'download' ? localStat : serverStat

      if (queueEntry.isDirectory) {
        // if directory not exist create it
        if (!destStat) {
          if (queueEntry.mode === 'download') {
            fstools.mkdirRecursive(useLocalPath, fstools.defaultMask, function (err) {
              if (err) {
                error(err)
                return
              }
              end()
            })
          }
          if (queueEntry.mode === 'upload') {
            self.mkdirRecursive(useServerPath, function (err) {
              if (err) {
                error(err)
                return
              }
              end()
            })
          }
        } else {
          end()
        }
      } else {
        // determine what we should do with existing files
        if (destStat) {
          let skip = true
          let mode = transferSettings.mode
          if (mode === 'replace-always') {
            skip = false
          } else if ((mode === 'replace-newer' || mode === 'replace-newer-or-sizediff') && self.getDateOfTime(destStat.mtime) < self.getDateOfTime(srcStat.mtime)) {
            skip = false
          } else if ((mode === 'replace-sizediff' || mode === 'replace-newer-or-sizediff') && destStat.size !== srcStat.size) {
            skip = false
          } else if (mode === 'rename') {
            let renameCount = 0
            let newPath = queueEntry.localPath
            while (fs.existsSync(newPath)) {
              newPath = path.join(path.dirname(queueEntry.localPath), renameCount + '_' + path.basename(queueEntry.localPath))
              renameCount++
            }
            useLocalPath = newPath
          }
          // skip if file not need to be transfered
          if (skip) {
            end()
            return
          }
        }
        startTransfer()
      }
    }

    const startTransfer = function () {
      self[queueEntry.mode](useLocalPath, useServerPath, function (err) {
        if (err) {
          error(err)
          return
        }
        end()
      })
    }

    const directoriesCreated = function () {
      self.stat(useServerPath, function (err, stat) {
        if (err) {
          error(err)
          return
        }
        serverStat = stat
        statsReceived()
      })
    }

    // check if directories exists in destination
    if (queueEntry.mode === 'download') {
      if (!fs.existsSync(localDirectory)) {
        fstools.mkdirRecursive(localDirectory, fstools.defaultMask, function (err) {
          if (err) {
            error(err)
            return
          }
          directoriesCreated()
        })
      }
    }
    if (queueEntry.mode === 'upload') {
      this.stat(serverDirectory, function (err) {
        if (err) {
          console.log('mkdir', err, serverDirectory)
          self.mkdirRecursive(serverDirectory, function (err) {
            if (err) {
              error(err)
              return
            }
            directoriesCreated()
          })
        } else {
          directoriesCreated()
        }
      })
    }
  }

  /**
   * Get file stat
   * @param {string} filePath
   * @param {function} callback First param is error, second is stat
   */
  this.stat = function (filePath, callback) {
    if (this.ftpClient) {
      self.ftpClient.size(filePath, function (err, size) {
        if (err) {
          callback(err)
          return
        }
        self.ftpClient.lastMod(filePath, function (err, mtime) {
          if (err) {
            callback(err)
            return
          }
          callback(null, {
            'filename': path.basename(filePath),
            'path': filePath,
            'size': size,
            'mtime': mtime
          })
        })
      })
    }
    if (this.sshClient) {
      self.sftp.stat(filePath, function (err, stat) {
        if (err) {
          callback()
          return
        }
        callback(null, {
          'filename': path.basename(filePath),
          'path': filePath,
          'size': stat.size,
          'mtime': self.getDateOfTime(stat.mtime)
        })
      })
    }
  }

  /**
   * Make a directory, do it recursive if parents also not exist
   * @param {string} directory
   * @param {function} callback
   */
  this.mkdirRecursive = function (directory, callback) {
    if (this.ftpClient) {
      this.ftpClient.mkdir(directory, true, callback)
    }
    if (this.sshClient) {
      const parent = path.dirname(directory)
      if (parent === directory) {
        callback()
        return
      }
      this.stat(parent, function (err) {
        if (err) {
          self.mkdirRecursive(parent, callback)
          return
        }
        self.mkdir(directory, callback)
      })
    }
  }

  /**
   * Make a directory
   * @param {string} directory
   * @param {function} callback
   */
  this.mkdir = function (directory, callback) {
    if (this.ftpClient) {
      this.ftpClient.mkdir(directory, callback)
    }
    if (this.sshClient) {
      this.sftp.mkdir(directory, callback)
    }
  }

  /**
   * Download a file from the server
   * @param {string} localPath
   * @param {string} serverPath
   * @param {function} callback
   */
  this.download = function (localPath, serverPath, callback) {
    if (this.ftpClient) {
      this.ftpClient.get(serverPath, function (err, rstream) {
        let wstream = fs.createWriteStream(localPath)
        wstream.on('end', function () {
          if (callback) callback()
          callback = null
        })
        wstream.on('close', function () {
          if (callback) callback()
          callback = null
        })
        wstream.on('error', function (err) {
          if (callback) callback(err)
          callback = null
        })
        rstream.pipe(wstream)
      })
    }
    if (this.sshClient) {
      this.sftp.fastGet(serverPath, localPath, callback)
    }
  }

  /**
   * Upload a file on the server
   * @param {string} localPath
   * @param {string} serverPath
   * @param {function} callback
   */
  this.upload = function (localPath, serverPath, callback) {
    if (this.ftpClient) {
      this.ftpClient.put(localPath, serverPath, callback)
    }
    if (this.sshClient) {
      this.sftp.fastPut(localPath, serverPath, callback)
    }
  }

  /**
   * Stop all running transfers
   */
  this.stopTransfers = function () {
    if (this.ftpClient) {
      this.ftpClient.abort()
      this.resetQueues()
    }
    if (this.sshClient) {
      this.disconnect()
    }
  }

  /**
   * Disconnect
   */
  this.disconnect = function () {
    self.server.log('log.ftpserver.disconnect')
    this.resetQueues()
    delete FtpServer.instances[self.id]
    if (this.ftpClient) {
      self.ftpClient.end()
    }
    if (this.sshClient) {
      self.sshClient.end()
    }
  }

  /**
   * Reset all transfering queues for this server to queue
   */
  this.resetQueues = function () {
    let entries = db.get('queue').get('entries').find({'serverId': self.id}).value()
    if (entries) {
      for (let i in entries) {
        entries[i].status = 'queue'
        queue.saveEntry(entries[i])
        queue.sendToListeners('transfer-status-update', {'id': i, 'status': 'queue'})
      }
    }
  }
}

/**
 * Get a ftp instance for a server
 * If not yet connected, try to connect and than get the instance
 * @param {string} id
 * @param {function} callback
 */
FtpServer.get = function (id, callback) {
  if (typeof FtpServer.instances[id] !== 'undefined') {
    callback(FtpServer.instances[id])
    return
  }
  const server = new FtpServer(id)
  server.connect(function (status) {
    if (status) {
      callback(server)
      return
    }
    callback()
  })
}

/** @type {object<string, FtpServer>} */
FtpServer.instances = {}

module.exports = FtpServer
