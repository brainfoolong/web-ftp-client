'use strict'

const path = require('path')
const db = require(__dirname + '/db')
const fs = require('fs')
const Server = require(__dirname + '/server')
const FtpServer = require(__dirname + '/ftpServer')

/**
 * Queue
 * @type {object}
 */
const queue = {}

/**
 * A queue entry
 * First param could also be an object with all props
 * @param {number|object} id
 * @param {string} mode
 * @param {string} serverId
 * @param {string} localPath
 * @param {string} serverPath
 * @param {boolean} isDirectory
 * @param {string} status
 * @param {number} size
 * @param {number} priority
 * @constructor
 */
queue.QueueEntry = function (id, mode, serverId, localPath, serverPath, isDirectory, status, size, priority) {
  /** @type {number} */
  this.id = id
  /** @type {string} */
  this.mode = mode
  /** @type {string} */
  this.serverId = serverId
  /** @type {string} */
  this.localPath = localPath
  /** @type {string} */
  this.serverPath = serverPath
  /** @type {boolean} */
  this.isDirectory = isDirectory
  /** @type {string} */
  this.status = status
  /** @type {number} */
  this.size = size
  /** @type {number} */
  this.priority = priority

  /**
   * Convert to json
   * @returns {object}
   */
  this.toJson = function () {
    return {
      'id': this.id,
      'mode': this.mode,
      'serverId': this.serverId,
      'localPath': this.localPath,
      'serverPath': this.serverPath,
      'isDirectory': this.isDirectory,
      'status': this.status,
      'size': this.size,
      'priority': this.priority
    }
  }
}

/**
 * Create a queue entry from object
 * @param {object} o
 * @returns {queue.QueueEntry}
 */
queue.createQueueEntryFromObject = function (o) {
  return new queue.QueueEntry(o.id, o.mode, o.serverId, o.localPath, o.serverPath, o.isDirectory, o.status, o.size, o.priority)
}

/**
 * Which files are currently transfering
 * @type {object<string, boolean>}
 */
queue.transfering = {}

/**
 * Save give entry
 * @param {queue.QueueEntry|object} entry
 */
queue.saveEntry = function (entry) {
  db.get('queue').get('entries').set(entry.id, entry).write()
}

/**
 * Save given entries
 * @param {object<number, queue.QueueEntry>} entries
 */
queue.saveEntries = function (entries) {
  db.get('queue').set('entries', entries).write()
}

/**
 * Get given entry
 * @param {string} id
 * @returns {queue.QueueEntry|null}
 */
queue.getEntry = function (id) {
  let entry = db.get('queue').get('entries').get(id).cloneDeep().value()
  if (entry) {
    return queue.createQueueEntryFromObject(entry)
  }
  return null
}

/**
 * Get all queue
 * @returns {object<string, queue.QueueEntry>}
 */
queue.getEntries = function () {
  let entries = db.get('queue').get('entries').cloneDeep().value()
  if (entries) {
    for (let i in entries) {
      entries[i] = queue.createQueueEntryFromObject(entries[i])
    }
  }
  return entries
}

/**
 * Add to queue bulk
 * @param {string} serverId
 * @param {queue.QueueEntry[]} addEntries
 */
queue.addToQueueBulk = function (serverId, addEntries) {
  const server = Server.get(serverId)
  let entries = queue.getEntries()
  for (let i = 0; i < addEntries.length; i++) {
    let entry = addEntries[i]
    entries[entry.id] = entry
    server.log('logs.transfer.queue.added.' + entry.mode, {
      'localPath': entry.localPath,
      'serverPath': entry.serverPath
    })
  }
  queue.saveEntries(entries)
  queue.bulkSendToListeners('transfer-add-bulk', addEntries)
}

/**
 * Transfering next in the queue
 * @param {function=} downloadStarted When the download has begun
 * @param {function=} queueDone When the complete queue has been transfered
 */
queue.transferNext = function (downloadStarted, queueDone) {
  let entries = queue.getEntries()
  let entriesArr = []
  for (let i in entries) {
    let entry = entries[i]
    if (entry.status === 'queue') {
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
  /** @type {queue.QueueEntry} */
  let nextEntry = entriesArr.shift()
  if (!nextEntry) {
    if (queueDone) queueDone()
  } else {
    const progress = function () {
      if (fs.existsSync(nextEntry.localPath)) {
        let stat = fs.statSync(nextEntry.localPath)
        queue.sendToListeners('transfer-progress', {
          'id': nextEntry.id,
          'filesize': nextEntry.size,
          'transfered': stat.size
        })
      }
    }
    const setStatus = function (status) {
      nextEntry.status = status
      queue.saveEntry(nextEntry)
      queue.sendToListeners('transfer-status-update', {
        'id': nextEntry.id,
        'status': status,
        'localDirectory': path.dirname(nextEntry.localPath)
      })
      if (status === 'success') {
        queue.transferNext(downloadStarted, queueDone)
      }
    }
    setStatus('transfering')
    queue.saveEntry(nextEntry)
    FtpServer.get(nextEntry.serverId, function (ftpServer) {
      if (ftpServer) {
        if (downloadStarted) downloadStarted()
        ftpServer.transferQueueEntry(nextEntry, function () {
          progress()
        }, function () {
          setStatus('success')
        }, function () {
          setStatus('error')
        })
      } else {
        setStatus('error')
      }
    })
  }
}

/**
 * Send a message to all listeners via bulk send
 * @param {string} action
 * @param {*} message
 */
queue.bulkSendToListeners = function (action, message) {
  for (let i = 0; i < queue.listeners.length; i++) {
    queue.listeners[i].bulkSend(action, message)
  }
}

/**
 * Send a message to all listeners
 * @param {string} action
 * @param {*} message
 */
queue.sendToListeners = function (action, message) {
  for (let i = 0; i < queue.listeners.length; i++) {
    queue.listeners[i].send(action, message)
  }
}

/**
 * The websocket users that listen for transfer updates
 * @type {WebSocketUser[]}
 */
queue.listeners = []

module.exports = queue
