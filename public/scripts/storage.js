'use strict'

/**
 * Storage handling
 */
var storage = {}

/**
 * Get data from storage, from sessionstorage or localstorage, try both
 * @param {string} key
 * @returns {*}
 */
storage.get = function (key) {
  var s = sessionStorage
  var value = s.getItem(key)
  if (value === null) {
    s = localStorage
    value = s.getItem(key)
    if (value === null) return null
  }
  return JSON.parse(value)
}

/**
 * Set data in storage
 * @param {string} key
 * @param {*} value
 * @param {boolean=} session
 */
storage.set = function (key, value, session) {
  var s = session ? sessionStorage : localStorage
  if (value === null || typeof value === 'undefined') {
    s.removeItem(key)
  } else {
    s.setItem(key, JSON.stringify(value))
  }
}