'use strict'

const FtpClient = require('ftp')
const SshClient = require('ssh2').Client
const path = require('path')
const db = require('./db')
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
    if (self.server.data.protocol === 'ftp') {
      self.ftpClient = new FtpClient()
    }
    if (self.server.data.protocol === 'sftp') {
      self.sshClient = new SshClient()
      self.sshClient.on('ready', function () {
        self.sshClient.sftp(function (err, sftp) {
          if (err) {
            self.server.log(err, 'error')
            callback(false)
            self.disconnect()
            return
          }
          self.sftp = sftp
          callback(true)
        })
      }).on('error', function (err) {
        self.server.log(err, 'error')
        callback(false)
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
    if (this.ftpClient) {

    }
    if (this.sshClient) {
      self.sftp.readdir('/', function (err, list) {
        if (err) {
          self.server.log(err, 'error')
          return
        }
        for (let i = 0; i < list.length; i++) {
          let file = list[i]
          file.directory = file.longname.substr(0, 1) === 'd'
        }
        callback(list)
      })
    }
  }

  /**
   * Disconnect
   */
  this.disconnect = function () {
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
