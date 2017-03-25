'use strict'

const path = require('path')
const db = require('./db')
const Server = require('./Server')

const transfers = {}

transfers.saveEntries = function (entries) {
  db.get('transfers').setState(entries)
}

transfers.getEntries = function () {
  return db.get('transfers').cloneDeep().value()
}

/**
 * Add to queue
 * @param {string} type
 * @param {string} serverId
 * @param {string} localPath
 * @param {string} serverPath
 * @param {boolean} directory
 * @param {number} size
 */
transfers.addToQueue = function (type, serverId, localPath, serverPath, directory, size) {
  let entries = transfers.getEntries()
  let id = db.getNextId()
  const server = Server.get(serverId)
  let entry = {
    'id': id,
    'type': type,
    'server': serverId,
    'localPath': localPath,
    'serverPath': serverPath,
    'directory': directory,
    'status': 'queue',
    'size': size
  }
  entries[id] = entry
  transfers.saveEntries(entries)
  server.log('logs.transfer.queue.added.' + type, {'localPath': localPath, 'serverPath': serverPath})
  for (let i = 0; i < transfers.listeners.length; i++) {
    transfers.listeners[i].send('transfer', entry)
  }
}

/**
 * The websocket users that listen for transfer updates
 * @type {WebSocketUser[]}
 */
transfers.listeners = []

module.exports = transfers
