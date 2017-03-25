'use strict'

const db = require('./db')
const logs = require('./logs')

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
   * @param {object=} params
   * @param {string=} type
   */
  this.log = function (message, params, type) {
    logs.log(this.id, message, params, type)
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
  return new Server(id)
}

/** @type {object<string, Server>} */
Server.instances = {}

module.exports = Server
