'use strict'

const path = require('path')
const fs = require('fs')

/**
 * A single websocket user
 * @constructor
 */
function WebSocketUser (socket) {
  /** @type {WebSocketUser} */
  const self = this
  /** @type {number|null} */
  this.id = null
  /** @type {WebSocket} */
  this.socket = socket
  /** @type {object} */
  this.bulkList = {}
  /** @type {object} */
  this.bulkTimeouts = {}
  /**
   * The current stored userdata
   * Updated with each websocket incoming message
   * @type {null}
   */
  this.userData = null

  self.id = WebSocketUser.instances.length
  WebSocketUser.instances.push(self)

  /**
   * Send message to client
   * @param {string} action
   * @param {object=} message
   * @param {number=} callbackId
   */
  this.send = function (action, message, callbackId) {
    if (self.socket) {
      if (typeof message === 'undefined') {
        message = null
      }
      const data = {
        'action': action,
        'message': message
      }
      if (typeof callbackId === 'number') {
        data.callbackId = callbackId
      }
      try {
        self.socket.send(JSON.stringify(data))
      } catch (err) {

      }
    }
  }

  /**
   * Do a bulk send, collect all bulkSends and send them out only each 500ms
   * This prevent mass spam of socket and frontend and give everything time to breath
   * All bulk sends of last 500ms will simply be collected to an array
   * @param {string} action
   * @param {object=} message
   */
  this.bulkSend = function (action, message) {
    const time = new Date().getTime()
    if (typeof this.bulkList[action] === 'undefined') {
      this.bulkList[action] = {'lastSent': time, 'collection': []}
    }
    const bulkColl = this.bulkList[action]
    bulkColl.collection.push(message)

    const send = function () {
      bulkColl.lastSent = time
      const arr = bulkColl.collection
      bulkColl.collection = []
      self.send(action, {'bulk': true, 'messages': arr})
    }
    const wait = (bulkColl.lastSent + 1000) - time
    // if wait time is over, send bulk
    if (wait <= 0) {
      send()
    } else {
      // timeout for the next send
      if (this.bulkTimeouts[action]) clearTimeout(this.bulkTimeouts[action])
      this.bulkTimeouts[action] = setTimeout(send, wait)
    }
  }

  /**
   * If the socket got closed
   */
  this.closed = function () {
    WebSocketUser.instances.splice(self.id, 1)
    self.socket = null
    self.userData = null
  }

  /**
   * On receive message from socket
   * @param {object} frontendMessage
   */
  this.onMessage = function (frontendMessage) {
    // just send a message to the user for the callback in the frontend
    const sendCallback = function (message) {
      self.send(frontendMessage.action, message, frontendMessage.callbackId)
    }
    const actionPath = path.join(__dirname, 'actions/' + frontendMessage.action.replace(/[^a-z0-9_-]/ig, '') + '.js')
    if (fs.existsSync(actionPath)) {
      const action = require(actionPath)
      if (action.requireAdmin && (!self.userData || !self.userData.admin)) {
        sendCallback({
          'error': {
            'message': 'Require an administrator for: ' + frontendMessage.action
          }
        })
        return
      }
      if (action.requireUser && !self.userData) {
        sendCallback({
          'error': {
            'message': 'Require a valid user for: ' + frontendMessage.action
          }
        })
        return
      }
      try {
        action.execute(self, frontendMessage.message, sendCallback)
      } catch (e) {
        sendCallback({
          'error': {
            'message': e.message,
            'stack': e.stack
          }
        })
      }
    } else {
      sendCallback({
        'error': {
          'message': 'Action ' + frontendMessage.action + ' not exist in ' + actionPath
        }
      })
    }
  }

  /**
   * Convert to json
   * @returns {object}
   */
  this.toJSON = function () {
    return {'username': this.userData.username}
  }
}

/**
 * All user instances
 * @type WebSocketUser[]
 */
WebSocketUser.instances = []

/**
 * Bulk send a message to all users
 * @param {string} action
 * @param {*} message
 */
WebSocketUser.bulkSendToAll = function (action, message) {
  for (let i = 0; i < WebSocketUser.instances.length; i++) {
    WebSocketUser.instances[i].bulkSend(action, message)
  }
}

/**
 * Send a message to all users
 * @param {string} action
 * @param {*} message
 */
WebSocketUser.sendToAll = function (action, message) {
  for (let i = 0; i < WebSocketUser.instances.length; i++) {
    WebSocketUser.instances[i].send(action, message)
  }
}

module.exports = WebSocketUser
