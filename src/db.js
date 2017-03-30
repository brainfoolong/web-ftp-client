'use strict'

const path = require('path')
const low = require('lowdb')
const hash = require(path.join(__dirname, 'hash'))

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
  'id': {'id': 0},
  'servers': {},
  'settings': {'salt': hash.random(64)},
  'users': {},
  'logs': {},
  'splitboxtabs': {'tabs': {}},
  'queue': {'entries': {}, 'settings': {'mode': 'replace-always'}}
}

/**
 * Which dbs are in memory
 * @type {Array}
 * @private
 */
db._inMemory = ['queue', 'logs']

/**
 * The instances
 * @type {object<string, low>}
 * @private
 */
db._instances = []

/**
 * Get next id
 * @returns {number}
 */
db.getNextId = function () {
  let id = db.get('id').value()
  id.id++
  db.get('id').set('id', id.id).write()
  return id.id
}

/**
 * Get lowdb instance
 * @param {string} file
 * @param {string=} folder
 * @returns {low}
 */
db.get = function (file, folder) {
  let relativePath = folder ? folder + '/' + file : file
  let filepath = path.join(__dirname, '../db')
  if (folder) filepath = path.join(filepath, folder)
  filepath = path.join(filepath, file + '.json')
  if (typeof db._instances[relativePath] !== 'undefined') {
    return db._instances[relativePath]
  }
  const inst = low(db._inMemory.indexOf(relativePath) > -1 ? undefined : filepath)
  // set defaults
  if (typeof db._defaults[file] !== 'undefined') {
    inst.defaults(db._defaults[file]).write()
  }
  db._instances[relativePath] = inst
  return inst
}

module.exports = db
