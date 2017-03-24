'use strict'

/**
 * socket stuff
 * @type {object}
 */
gl.socket = {}

/** @type {WebSocket} */
gl.socket.con = null

/** @type {function[]} */
gl.socket.callbacks = []

/** @type {object} */
gl.socket.queue = []

/** @type {{}} */
gl.socket.onMessageEvents = {}

/** @type {number|null} */
gl.socket.port = null

/**
 * Send the queue
 */
gl.socket.sendQueue = function () {
  // send all messages in the queue
  for (var i = 0; i < gl.socket.queue.length; i++) {
    var q = gl.socket.queue[i]
    gl.socket.send(q.action, q.message, q.callback)
  }
  gl.socket.queue = []
}

/**
 * Connect to WebSocket
 * @param {function=} callback If connection is established
 */
gl.socket.connect = function (callback) {
  var cb = function () {
    var con = new window.WebSocket('ws://' + window.location.hostname + ':' + gl.socket.port)
    /**
     * On open connection
     */
    con.onopen = function () {
      gl.socket.con = con
      callback()
      gl.socket.sendQueue()
    }

    /**
     * On WebSocket error
     * @param error
     */
    con.onerror = function (error) {
      console.error('WebSocket Error ' + error)
    }

    /**
     * On message received from backend
     */
    con.onmessage = function (e) {
      if (e.data) {
        var data = JSON.parse(e.data)
        if (data.action) {
          if (typeof data.callbackId !== 'undefined') {
            var callbackId = data.callbackId
            if (gl.socket.callbacks[callbackId] === null) {
              console.error('No socket callback for id ' + callbackId + ', maybe dupe callback in backend?')
            } else {
              gl.socket.callbacks[callbackId](data.message)
              gl.socket.callbacks[callbackId] = null
            }
          }
        }
      }
    }

    /**
     * On connection close
     */
    con.onclose = function () {
      gl.socket.con = null
      // reload page after 5 seconds
      gl.note('socket.disconnect', 'danger')
      setTimeout(function () {
        window.location.reload()
      }, 5000)
    }
  }
  if (gl.socket.port) {
    cb()
  } else {
    // load the required port number
    $.get('wsport', function (port) {
      gl.socket.port = parseInt(port)
      cb()
    })
  }
}

/**
 * Send a command to the backend
 * @param {string} action
 * @param {object=} message
 * @param {function=} callback
 */
gl.socket.send = function (action, message, callback) {
  var receiveCallback = function (receivedMessage) {
    if (receivedMessage && receivedMessage.error) {
      var message = 'Server Error: ' + receivedMessage.error.message
      if (receivedMessage.error.stack) {
        message = '<strong>Server Error</strong>\n' + receivedMessage.error.stack
      }
      gl.note(message, 'danger')
      gl.socket.callbacks = []
      return
    }
    if (callback) callback(receivedMessage)
  }
  if (typeof message === 'undefined') {
    message = null
  }
  // if connection not yet established add to queue
  if (gl.socket.con === null) {
    gl.socket.queue.push({
      'action': action,
      'message': message,
      'callback': callback
    })
    return
  }
  var data = {
    'action': action,
    'callbackId': gl.socket.callbacks.length,
    'message': message
  }
  gl.socket.callbacks.push(receiveCallback)
  gl.socket.con.send(JSON.stringify(data))
}
