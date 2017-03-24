'use strict'

/**
 * Storage handling
 * @type {object}
 */
gl.storage = {}

/**
 * Get data from storage, from sessionstorage or localstorage, try both
 * @param {string} key
 * @returns {*}
 */
gl.storage.get = function (key) {
  let s = window.sessionStorage
  let value = s.getItem(key)
  if (value === null) {
    s = window.localStorage
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
gl.storage.set = function (key, value, session) {
  const s = session ? window.sessionStorage : window.localStorage
  if (value === null || typeof value === 'undefined') {
    s.removeItem(key)
  } else {
    s.setItem(key, JSON.stringify(value))
  }
}
