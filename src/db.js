'use strict'

const Low = require('lowdb')
const hash = require('./hash')
const path = require('path')

/**
 * LowDB helper
 */
const db = {}

/**
 * The db defaults
 * @type {object<string, *>}
 * @private
 */
db._defaults = {
  'servers': {},
  'settings': {},
  'users': {},
  'logs': {}
}

/**
 * Get lowdb instance
 * @param {string} file
 * @param {string=} folder
 * @returns {Low}
 */
db.get = function (file, folder) {
  let filepath = path.join(__dirname, '../db')
  if (folder) filepath = path.join(filepath, folder)
  filepath = path.join(filepath, file + '.json')
  const inst = Low(filepath)
  // if getting settings than set some defaults
  if (typeof db._defaults[file] !== 'undefined') {
    if (file === 'settings') {
      db._defaults[file].salt = hash.random(64)
    }
    inst.defaults(db._defaults[file]).value()
  }
  return inst
}

module.exports = db
