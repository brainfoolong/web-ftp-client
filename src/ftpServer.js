'use strict'

const FtpClient = require('ftp')
const SshClient = require('ssh2').Client
const path = require('path')
const db = require('./db')
const fs = require('fs')
const fstools = require('./fstools')
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
  /** @type {[]} */
  this.streams = []

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

    }
    if (this.sshClient) {
      self.sftp.readdir(directory, function (err, list) {
        if (err) {
          self.server.logError(err)
          return
        }
        for (let i = 0; i < list.length; i++) {
          let file = list[i]
          file.attrs.mtime = self.getDateOfTime(file.attrs.mtime)
          file.attrs.ctime = self.getDateOfTime(file.attrs.ctime)
          file.directory = file.longname.substr(0, 1) === 'd'
          file.path = directory
          if (file.path.substr(-1) !== '/') {
            file.path += '/'
          }
          file.path += file.filename
        }
        callback(list)
      })
    }
  }

  /**
   * Download a file from the server
   * @param {string} serverPath
   * @param {string} localPath
   * @param {function} step
   * @param {function} end
   * @param {function} error
   * @param {function} stop
   */
  this.download = function (serverPath, localPath, step, end, error, stop) {
    self.server.log('log.ftpserver.download', {'serverPath': serverPath, 'localPath': localPath})
    const transferSettings = db.get('transfers').get('settings').value()
    const _end = end
    end = function () {
      self.server.log('log.ftpserver.download.complete', {'serverPath': serverPath, 'localPath': localPath})
      _end()
    }
    if (this.ftpClient) {

    }
    if (this.sshClient) {
      self.sftp.stat(serverPath, function (err, stat) {
        if (err) {
          self.server.logError(err)
          error(err)
          return
        }

        // 128kb chunk size
        let chunkSize = 1024 * 128
        let chunks = Math.ceil(stat.size / chunkSize)
        let chunkParts = []
        // some number to play with, should not be too high and not too low, about 100 is good if we want to fill
        // a 100mbit transfer
        let concurrency = 100

        let chunkStart = 0
        let byteStart = 0

        // determine what we should do with existing files
        if (fs.existsSync(localPath)) {
          let localstat = fs.statSync(localPath)
          let skip = true
          let mode = transferSettings.mode
          if (mode === 'replace-always') {
            skip = false
          } else if ((mode === 'replace-newer' || mode === 'replace-newer-or-sizediff') && self.getDateOfTime(localstat.mtime) < self.getDateOfTime(stat.mtime)) {
            skip = false
          } else if ((mode === 'replace-sizediff' || mode === 'replace-newer-or-sizediff') && localstat.size !== stat.size) {
            skip = false
          } else if (mode === 'rename') {
            let renameCount = 0
            let newPath = localPath
            while (fs.existsSync(newPath)) {
              newPath = path.join(path.dirname(localPath), renameCount + '_' + path.basename(localPath))
              renameCount++
            }
            localPath = newPath
          }
          // skip if file not need to be transfered
          if (skip) {
            end()
            return
          }
          fs.unlinkSync(localPath)
        }

        // calculate required chunks for this download
        // we split up the read process because of speed improvements
        // without this we would be limited to something about 1MB/s
        for (let i = chunkStart; i < chunks; i++) {
          let start = i * chunkSize
          if (start < byteStart) {
            start = byteStart
          }
          let end = start + chunkSize - 1
          if (end > stat.size) {
            end = stat.size
          }
          chunkParts.push([start, end])
        }

        fs.open(localPath, 'w+', fstools.defaultMask, function (err, fd) {
          if (err) {
            self.server.logError(err)
            error(err)
            return
          }

          let chunksEnded = 0
          let streamsOpened = 0
          let stepCallbackTimer = null

          const processNextChunk = function () {
            // if we have as many streams opened as needed, skip
            if (streamsOpened >= concurrency) {
              return
            }
            let nextChunk = chunkParts.shift()
            // we're done with all chunks
            if (!nextChunk) {
              return
            }
            let offset = nextChunk[0]
            let rstream = self.sftp.createReadStream(serverPath, {'start': nextChunk[0], 'end': nextChunk[1]})
            streamsOpened++
            let streamId = self.streams.length
            self.streams.push({
              'id': streamId,
              'stream': rstream,
              'stop': stop
            })
            rstream.on('data', function (chunk) {
              // if something go weird with the file during the download
              try {
                fs.writeSync(fd, chunk, 0, chunk.length, offset)
              } catch (e) {
                rstream.destroy()
                error(e.message, null, 'error')
                return
              }
              offset += chunk.length
              // limit step callback only call each x ms to prevent mass spam of this step to frontend
              if (!stepCallbackTimer) {
                stepCallbackTimer = setTimeout(function () {
                  stepCallbackTimer = null
                  step()
                }, 150)
              }
            }).on('error', function (err) {
              self.server.logError(err)
              self.streams[streamId] = null
              error(err)
              clearTimeout(stepCallbackTimer)
            }).on('end', function () {
              chunksEnded++
              streamsOpened--
              self.streams[streamId] = null
              clearTimeout(stepCallbackTimer)
              if (chunksEnded >= chunks) {
                // if we are done with all chunks, the end is coming
                fs.close(fd)
                end()
              } else {
                // next chunk if a chunk is done, funny, isn't it
                processNextChunk()
              }
            })
            // next chunk
            // fill up to concurrency
            processNextChunk()
          }
          // initialize the whole process
          processNextChunk()
        })
      })
    }
  }

  /**
   * Stop all running transfers
   */
  this.stopTransfers = function () {
    if (this.ftpClient) {

    }
    if (this.sshClient) {
      for (let i = 0; i < this.streams.length; i++) {
        if (this.streams[i] !== null) {
          this.streams[i].stream.destroy()
          this.streams[i].stop()
        }
      }
    }
    this.streams = []
  }

  /**
   * Disconnect
   */
  this.disconnect = function () {
    self.server.log('log.ftpserver.disconnect')
    delete FtpServer.instances[self.id]
    if (this.ftpClient) {
      self.ftpClient.end()
    }
    if (this.sshClient) {
      self.sshClient.end()
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
