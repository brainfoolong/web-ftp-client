'use strict'

const crypto = require('crypto')
const path = require('path')

/**
 * Hash generator
 */
const hash = {}

/**
 * Generate random hash
 * @param {number} length
 * @returns {string}
 */
hash.random = function (length) {
  return crypto.randomBytes(length / 2).toString('hex')
}

/**
 * Generate salted md5 hash
 * @param {string} str
 * @returns {string}
 */
hash.saltedMd5 = function (str) {
  const db = require(path.join(__dirname, 'db'))
  return crypto.createHash('md5').update(str + '' + db.get('settings').get('salt').value()).digest('hex')
}

module.exports = hash
