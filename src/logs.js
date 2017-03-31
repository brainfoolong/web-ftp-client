'use strict'

const path = require('path')
const db = require(path.join(__dirname, 'db'))

const logs = {}

/**
 * Get all log messages
 * @return []
 */
logs.get = function () {
  const logs = db.get('logs').cloneDeep().value()
  if (!logs.messages) {
    return []
  }
  return logs.messages
}

/**
 * Log a message
 * @param {string} server
 * @param {string} message
 * @param {object=} params
 * @param {string=} type
 */
logs.log = function (server, message, params, type) {
  const logsDb = db.get('logs').cloneDeep().value()
  if (!logsDb.messages) {
    logsDb.messages = []
  }

  logsDb.messages = logsDb.messages.slice(-50)
  const msg = {
    'server': server,
    'serverName': server ? require(path.join(__dirname, 'server')).get(server).getServerData().name : null,
    'time': new Date(),
    'message': message,
    'params': params,
    'type': type || 'info'
  }
  logsDb.messages.push(msg)
  db.get('logs').set('messages', logsDb.messages).write()
  // send to all listeners
  for (let i = 0; i < logs.listeners.length; i++) {
    logs.listeners[i].bulkSend('log', msg)
  }
}

/**
 * Log an error message
 * @param {string} server
 * @param {Error} err
 */
logs.logError = function (server, err) {
  const e = new Error(err.message)
  let msg = e.message
  if (require(path.join(__dirname, 'config.js')).development) {
    msg += ' | STACK: ' + e.stack
  }
  logs.log(server, msg, null, 'error')
}

/**
 * The websocket users that listen for new log messages
 * @type {WebSocketUser[]}
 */
logs.listeners = []

module.exports = logs
