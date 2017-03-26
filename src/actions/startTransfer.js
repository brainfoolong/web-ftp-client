'use strict'

const transfers = require('./../transfers')
const db = require('./../db')
const fs = require('fs')
const path = require('path')

const action = {}

/**
 * Require user
 * @type {boolean}
 */
action.requireUser = true

/**
 * Execute the action
 * @param {WebSocketUser} user
 * @param {*} message
 * @param {function} callback
 */
action.execute = function (user, message, callback) {
  db.get('transfers').set('enabled', true).value()
}

module.exports = action
