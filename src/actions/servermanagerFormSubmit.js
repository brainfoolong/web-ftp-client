'use strict'

const extend = require('extend')
const path = require('path')
const db = require(path.join(__dirname, '../db'))
const Server = require(path.join(__dirname, '../server'))
const FtpServer = require(path.join(__dirname, '../ftpServer'))
const aes = require(path.join(__dirname, '../aes'))

const action = {}

/**
 * Require admin
 * @type {boolean}
 */
action.requireAdmin = true

/**
 * Execute the action
 * @param {WebSocketUser} user
 * @param {*} message
 * @param {function} callback
 */
action.execute = function (user, message, callback) {
  const formData = message.formData
  if (formData.host && formData.port) {
    let storedData = {}
    if (message.id) {
      storedData = Server.get(message.id).getServerData()
    } else {
      storedData = {
        'id': db.getNextId()
      }
    }
    const salt = db.get('settings').get('salt').value()
    if (formData.password.length <= 0) {
      delete formData.password
    }
    if (formData.keyfile_passphrase.length <= 0) {
      delete formData.keyfile_passphrase
    }
    // simply merging data from form into data object
    extend(true, storedData, formData)

    // encrypt passwords in database
    if (typeof formData.password !== 'undefined' && formData.password.length) {
      storedData.password = aes.encrypt(salt + '_' + storedData.id, formData.password)
    }
    if (typeof formData.keyfile_passphrase !== 'undefined' && formData.keyfile_passphrase.length) {
      storedData.keyfile_passphrase = aes.encrypt(salt + '_' + storedData.id, formData.keyfile_passphrase)
    }
    Server.get(storedData.id).setServerData(storedData)
    if (typeof FtpServer.instances[storedData.id] !== 'undefined') {
      FtpServer.instances[storedData.id].disconnect()
    }
  }
  callback()
}

module.exports = action
