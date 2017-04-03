'use strict'

const path = require('path')
const db = require(path.join(__dirname, 'db'))
const Server = require(path.join(__dirname, 'server'))

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
queue.QueueEntry = function (id, mode, serverId, localPath, serverPath, isDirectory, status, size, priority, replace) {
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
  /** @type {string} */
  this.replace = replace
  /** @type {string} */
  this.serverName = Server.get(serverId).getServerData().name
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
      'priority': this.priority,
      'serverName': this.serverName,
      'replace': this.replace
    }
  }
}

/**
 * Create a queue entry from object
 * @param {object} o
 * @returns {queue.QueueEntry}
 */
queue.createQueueEntryFromObject = function (o) {
  return new queue.QueueEntry(o.id, o.mode, o.serverId, o.localPath, o.serverPath, o.isDirectory, o.status, o.size, o.priority, o.replace)
}

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
  // not do that at top of file because of circular reference
  const Server = require(path.join(__dirname, 'server'))
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
 * Transfering next entries in the queue up to max transfers
 * @param {function=} downloadStarted When the download has begun
 * @param {function=} queueDone When the complete queue has been transfered
 */
queue.transferNext = function (downloadStarted, queueDone) {
  let entries = queue.getEntries()
  let entriesArr = []
  let transfering = 0
  let maxTransfering = db.get('settings').get('settings').get('transfer_max').value() || 3
  for (let i in entries) {
    let entry = entries[i]
    if (entry.status === 'queue') {
      entriesArr.push(entry)
    }
    if (entry.status === 'transfering') {
      transfering++
      // stop if we already have all slots filled up
      if (transfering >= maxTransfering) {
        return
      }
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
  let lastTransfered = 0
  let lastProgressTime = 0
  let speedAverageArr = []
  if (!nextEntry) {
    if (queueDone) queueDone()
  } else {
    const step = function (transfered) {
      // skip first iteration to prevent spikes in average speed
      if (lastProgressTime > 0) {
        const speed = ((transfered - lastTransfered)) / ((new Date().getTime() - lastProgressTime) / 1000)
        speedAverageArr.push(speed < 0 ? 0 : speed)
        speedAverageArr = speedAverageArr.slice(-5)
        let speedAverage = 0
        for (let i = 0; i < speedAverageArr.length; i++) {
          speedAverage += speedAverageArr[i]
        }
        if (speedAverage > 0) {
          speedAverage /= Math.round(speedAverageArr.length)
        }
        queue.bulkSendToListeners('transfer-progress', {
          'id': nextEntry.id,
          'filesize': nextEntry.size,
          'transfered': transfered,
          'speed': speed,
          'speedAverage': speedAverage
        })
      }
      lastProgressTime = new Date().getTime()
      lastTransfered = transfered
    }
    const setStatus = function (status) {
      nextEntry.status = status
      queue.saveEntry(nextEntry)
      queue.bulkSendToListeners('transfer-status-update', {
        'id': nextEntry.id,
        'status': status
      })
    }
    setStatus('transfering')
    queue.saveEntry(nextEntry)

    // not require that at top of file because of circular reference
    const FtpServer = require(path.join(__dirname, 'ftpServer'))
    FtpServer.get(nextEntry.serverId, function (ftpServer) {
      if (ftpServer) {
        if (downloadStarted) downloadStarted()
        // time to breath for next transfer
        setTimeout(function () {
          queue.transferNext(downloadStarted, queueDone)
        }, 50)
        ftpServer.transferQueueEntry(nextEntry, step, function () {
          setStatus('success')
          // time to breath for next transfer
          setTimeout(function () {
            queue.transferNext(downloadStarted, queueDone)
          }, 50)
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
