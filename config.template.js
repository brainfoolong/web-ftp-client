'use strict'

/**
 * User configuration
 * Copy to config.js to enable it
 */
let config = {
  /**
   * The host to bind the webinterface to
   * null if you want allow every hostname
   */
  'host': null,

  /**
   * The port for the server and websocket
   * The given number is the one for the webinterface
   * Notice that both given number and the number+1 will be required
   */
  'port': 4340,

  /**
   * Set to true to get more information for errors and stuff like that
   */
  'development': false
}

module.exports = config
