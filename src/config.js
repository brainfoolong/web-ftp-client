'use strict'

const fs = require('fs')

/**
 * Default configuration
 * Override with local config.js file in root
 */
let config = {
  'host': null,
  'port': 4340
}

// load config.js if exist
if (fs.existsSync('./../config.js')) {
  config = require('./../config.js')
}

module.exports = config
