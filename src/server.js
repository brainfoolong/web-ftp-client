'use strict'

const path = require('path')
const db = require('./db')

/**
 * Server container
 * @param {string} id
 */
function Server (id) {

  Server.instances[id] = this

  /** @type {string} */
  this.id = id
  /** @type {object} */
  this.data = db.get('servers').get(id).cloneDeep().value()

  /**
   * Update the server data in the database
   */
  this.update = function () {
    db.get('servers').set(id, this.data).value()
  }

  /**
   * Log a message
   * @param {string} message
   * @param {string} type
   */
  this.log = function (message, type) {
    if (!this.data.logs) {
      this.data.logs = []
    }
    this.data.logs = this.data.slice(-200)
    this.data.logs.push({
      'time': new Date(),
      'message': message,
      'type': type
    })
  }
}

/**
 * Get a ftp instance for a server
 * @param {string} id
 * @return Server
 */
Server.get = function (id) {
  if (typeof Server.instances[id] !== 'undefined') {
    return Server.instances[id]
  }
  const server = new Server(id)
  return server
}

/** @type {object<string, Server>} */
Server.instances = {}

module.exports = Server
