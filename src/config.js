'use strict'

const path = require('path')
const fs = require('fs')

/**
 * Default configuration
 * Override with local config.js file in root
 */
let config = {
  'host': null,
  'port': 4340,
  'development': false
}

// load config.js if exist
if (fs.existsSync(path.join(__dirname, '../config.js'))) {
  config = require(path.join(__dirname, '../config.js'))
}

module.exports = config
