'use strict'

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
      self.socket.send(JSON.stringify(data))
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
    const actionPath = './actions/' + frontendMessage.action.replace(/[^a-z0-9_-]/ig, '') + '.js'
    if (fs.existsSync(actionPath)) {
      const action = require(actionPath)
      if (action.requireUser && !self.userData) {
        sendCallback({
          'error': {
            'message': 'Require a valid user for this action ' + frontendMessage.action
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
 * @type []
 */
WebSocketUser.instances = []

module.exports = WebSocketUser
