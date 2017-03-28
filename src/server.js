'use strict'

const path = require('path')
const db = require(path.join(__dirname, 'db'))
const logs = require(path.join(__dirname, 'logs'))

/**
 * Server container
 * @param {string} id
 */
function Server (id) {
  /** @type {string} */
  this.id = id

  /**
   * Get server data
   * @return object
   */
  this.getServerData = function () {
    return db.get('servers').get(this.id).cloneDeep().value()
  }

  /**
   * Set server data
   * @param {object} data
   */
  this.setServerData = function (data) {
    db.get('servers').set(this.id, data).write()
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
  /**
   * Log an error message
   * @param {Error} err
   */
  this.logError = function (err) {
    logs.logError(this.id, err)
  }
}

/**
 * Get a server instance, simply hold the server data and provide fancy log methods
 * @param {string} id
 * @return Server
 */
Server.get = function (id) {
  if (typeof Server.instances[id] !== 'undefined') {
    return Server.instances[id]
  }
  const server = new Server(id)
  Server.instances[id] = server
  return server
}

/** @type {object<string, Server>} */
Server.instances = {}

module.exports = Server
