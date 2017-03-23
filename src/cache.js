'use strict'

/**
 * Simple cached value management
 */
const cache = {}

/**
 * The values
 * @type {{}}
 * @private
 */
cache._values = {}

/**
 * Get a value from cache
 * @param {string} key
 * @returns {*}
 */
cache.get = function (key) {
  if (typeof cache._values[key] === 'undefined') {
    return null
  }
  if (cache._values[key].time > new Date().getTime() / 1000) {
    return cache._values[key].value
  }
  delete cache._values[key]
  return null
}

/**
 * Set a value in cache
 * @param {string} key
 * @param {*} value
 * @param {number} lifetime Lifetime in seconds
 */
cache.set = function (key, value, lifetime) {
  cache._values[key] = {'value': value, 'time': new Date().getTime() / 1000 + lifetime}
}

module.exports = cache
