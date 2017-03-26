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
  'id': {'id': 0},
  'servers': {},
  'settings': {'salt': hash.random(64)},
  'users': {},
  'logs': {},
  'splitboxtabs': {},
  'transfers': {'entries': {}, 'settings': {'mode': 'replace-always'}}
}

/**
 * Get next id
 * @returns {number}
 */
db.getNextId = function () {
  let id = db.get('id').value()
  id.id++
  db.get('id').set('id', id.id).value()
  return id.id
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
  // settings defaults
  if (typeof db._defaults[file] !== 'undefined') {
    inst.defaults(db._defaults[file]).value()
  }
  return inst
  return Low(filepath)
}

module.exports = db
