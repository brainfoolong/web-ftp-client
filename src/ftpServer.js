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

  /**
   * Connect
   * @param {function} callback
   */
  this.connect = function (callback) {
    self.server.log('log.ftpserver.connect')
    if (self.server.data.protocol === 'ftp') {
      self.ftpClient = new FtpClient()
    }
    if (self.server.data.protocol === 'sftp') {
      self.sshClient = new SshClient()
      self.sshClient.on('ready', function () {
        self.server.log('log.ftpserver.ready')
        self.sshClient.sftp(function (err, sftp) {
          if (err) {
            self.server.log(err.message, null, 'error')
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
        self.server.log(err.message, null, 'error')
      }).on('end', function () {
        self.disconnect()
      }).connect({
        host: self.server.data.host,
        port: self.server.data.port,
        username: self.server.data.username,
        password: self.server.data.password
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
          self.server.log(err.message, null, 'error')
          return
        }
        for (let i = 0; i < list.length; i++) {
          let file = list[i]
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
   * @param {string} mode Could be: replace-always, replace-newer, replace-sizediff, replace-newer-or-sizediff, continue, rename
   * @param {function} step
   * @param {function} end
   * @param {function} error
   * @param {function} stop
   */
  this.download = function (serverPath, localPath, mode, step, end, error, stop) {
    self.server.log('log.ftpserver.download', {'serverPath': serverPath, 'localPath': localPath})
    if (this.ftpClient) {

    }
    if (this.sshClient) {
      self.sftp.fastGet(serverPath, localPath, {
        'concurrency' : 1024,
        'chunkSize' : 32768 * 8,
        'step': function (total_transferred, chunk, total) {
          step(chunk)
          if (total_transferred === total) {
            end()
          }
        }
      }, function (err) {
        if (err) {
          error(err)
        }
      })
    }
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
