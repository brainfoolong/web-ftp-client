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
 * Which files are currently transfering
 * @type {object<string, boolean>}
 */
transfers.transfering = {}

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
  transfers.sendToListeners('transfer-add', entry)
}

/**
 * Transfering next in the queue
 * @param {function=} downloadStarted When the download has begun
 * @param {function=} queueDone When the complete queue has been transfered
 */
transfers.transferNext = function (downloadStarted, queueDone) {
  let entries = transfers.getEntries()
  let entriesArr = []
  for (let i in entries) {
    let entry = entries[i]
    let streamId = entry.serverPath + '_' + entry.localPath
    if (entry.status === 'queue' && !transfers.transfering[streamId]) {
      entriesArr.push(entry)
    }
  }
  entriesArr.sort(function (a, b) {
    if (a.priority > b.priority) {
      return 1
    } else if (a.priority < b.priority) {
      return -1
    } else {
      return 0
    }
  })
  entriesArr.sort(function (a, b) {
    if (a.id > b.id) {
      return 1
    } else if (a.id < b.id) {
      return -1
    } else {
      return 0
    }
  })
  let nextEntry = entriesArr.shift()
  if (!nextEntry) {
    if (queueDone) queueDone()
  } else {
    const transferId = nextEntry.serverPath + '_' + nextEntry.localPath
    const progress = function () {
      let stat = fs.statSync(nextEntry.localPath)
      transfers.sendToListeners('transfer-progress', {
        'id': nextEntry.id,
        'filesize': nextEntry.size,
        'transfered': stat.size
      })
    }
    const setStatus = function (status) {
      delete transfers.transfering[transferId]
      nextEntry.status = status
      transfers.saveEntry(nextEntry)
      transfers.sendToListeners('transfer-end', {'id': nextEntry.id, 'to': status})
      if (status === 'success') {
        transfers.transferNext(downloadStarted, queueDone)
      }
    }
    if (nextEntry.directory) {
      if (!fs.existsSync(nextEntry.localPath)) {
        fs.mkdirSync(nextEntry.localPath, {'mode': fsttools.defaultMask})
      }
      setStatus('success')
    } else {
      transfers.transfering[transferId] = true
      FtpServer.get(nextEntry.server, function (ftpServer) {
        if (ftpServer) {
          // create directory of not yet exist
          let directory = path.dirname(nextEntry.localPath)
          if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, {'mode': fsttools.defaultMask})
          }
          transfers.sendToListeners('transfer-start', {
            'id': nextEntry.id
          })
          if (downloadStarted) downloadStarted()
          ftpServer.download(nextEntry.serverPath, nextEntry.localPath, 'replace-newer', function () {
            progress()
          }, function () {
            setStatus('success')
          }, function () {
            setStatus('error')
          }, function () {
            transfers.sendToListeners('transfer-stopped', {'id': nextEntry.id})
            delete transfers.transfering[transferId]
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
