'use strict'

const path = require('path')
const WebSocketServer = require('ws').Server
const WebSocketUser = require(path.join(__dirname, 'websocketuser'))
const config = require(path.join(__dirname, 'config'))

/**
 * Some tools for web socket server management
 */
const WebSocketMgr = {}

/**
 * The socket server itself
 * @type {null|WebSocketServer}
 */
WebSocketMgr.server = null

/**
 * Start the websocket server
 */
WebSocketMgr.startServer = function () {
  try {
    if (WebSocketMgr.server === null) {
      WebSocketMgr.server = new WebSocketServer({port: config.port + 1})
      WebSocketMgr.server.on('connection', function connection (ws) {
        const user = new WebSocketUser(ws)
        ws.on('message', function incoming (message) {
          try {
            user.onMessage(JSON.parse(message))
          } catch (e) {
            console.error(new Date(), e.stack)
          }
        })
        ws.on('close', function () {
          try {
            user.closed()
          } catch (e) {
            console.error(new Date(), e.stack)
          }
        })
      })
      // if for some reason the server went down, restart it some seconds later
      WebSocketMgr.server.on('close', function close () {
        WebSocketMgr.server = null
        WebSocketUser.instances = []
      })
    }
  } catch (e) {
    console.error(new Date(), 'Start Websocket Server error', e)
  }
}

// start websocket server and create an interval
WebSocketMgr.startServer()
// check each x seconds if the server is down and try to restart it
setInterval(WebSocketMgr.startServer, 10000)
