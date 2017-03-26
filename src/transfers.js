'use strict'

const path = require('path')
const db = require('./db')
const fs = require('fs')
const fsttools = require('./fstools')
const Server = require('./Server')
const FtpServer = require('./FtpServer')

/**
 * Transfers
 * @type {object}
 */
const transfers = {}

/**
 * Save give entry
 * @param {object} entry
 */
transfers.saveEntry = function (entry) {
  db.get('transfers').get('entries').set(entry.id, entry).value()
}

/**
 * Save given entries
 * @param {object} entries
 */
transfers.saveEntries = function (entries) {
  db.get('transfers').set('entries', entries).value()
}

/**
 * Get given entry
 * @param {string} id
 * @returns {object}
 */
transfers.getEntry = function (id) {
  return db.get('transfers').get('entries').get(id).cloneDeep().value()
}

/**
 * Get all transfers
 * @returns {object}
 */
transfers.getEntries = function () {
  return db.get('transfers').get('entries').cloneDeep().value()
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
    'size': size,
    'priority': 0
  }
  transfers.saveEntry(entry)
  server.log('logs.transfer.queue.added.' + type, {'localPath': localPath, 'serverPath': serverPath})
  transfers.sendToListeners('transfer', entry)
}

/**
 * Transfering next in the queue
 */
transfers.startTransferNext = function () {
  if (!db.get('transfers').get('enabled').value()) {
    return
  }
  let entries = transfers.getEntries()
  let entriesArr = []
  for (let i in entries) {
    if (entries[i].status === 'queue') {
      entriesArr.push(entries[i])
    }
  }
  entriesArr.sort(function (a, b) {
    if (a.priority > b.priority) {
      return 1
    } else if (a.priority < b.priority) {
      return -0
    } else {
      return 0
    }
  })
  let nextEntry = entriesArr.shift()
  if (nextEntry) {
    const cb = function () {
      let stat = fs.statSync(nextEntry.localPath)
      transfers.sendToListeners('transfer-progress', {
        'id': nextEntry.id,
        'filesize': nextEntry.size,
        'transfered': stat.size
      })
    }

    const setStatus = function (status) {
      nextEntry.status = status
      transfers.saveEntry(nextEntry)
      transfers.sendToListeners('transfer-move', {'id': nextEntry.id, 'to': status})
      if (status === 'success') {
        transfers.startTransferNext()
      }
    }
    if (nextEntry.directory) {
      if (!fs.existsSync(nextEntry.localPath)) {
        fs.mkdirSync(nextEntry.localPath, {'mode': fsttools.defaultMask})
      }
      setStatus('success')
    } else {
      FtpServer.get(nextEntry.server, function (ftpServer) {
        if (ftpServer) {
          // create directory of not yet exist
          let directory = path.dirname(nextEntry.localPath)
          if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, {'mode': fsttools.defaultMask})
          }
          ftpServer.download(nextEntry.serverPath, nextEntry.localPath, 'replace-always', function () {
            cb()
          }, function () {
            cb()
            setStatus('success')
          }, function () {
            cb()
            setStatus('error')
          }, function () {
            transfers.sendToListeners('transfer-stopped', {'id': nextEntry.id})
          })
        } else {
          setStatus('error')
        }
      })
    }
  }
}

/**
 * Send a message to all listeners
 * @param {string} action
 * @param {*} message
 */
transfers.sendToListeners = function (action, message) {
  for (let i = 0; i < transfers.listeners.length; i++) {
    transfers.listeners[i].send(action, message)
  }
}

/**
 * The websocket users that listen for transfer updates
 * @type {WebSocketUser[]}
 */
transfers.listeners = []

module.exports = transfers
