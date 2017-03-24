'use strict'

const db = require('./../db')
const hash = require('./../hash')
const extend = require("extend")

const action = {}

/**
 * Require user
 * @type {boolean}
 */
action.requireUser = false

/**
 * Execute the action
 * @param {WebSocketUser} user
 * @param {*} message
 * @param {function} callback
 */
action.execute = function (user, message, callback) {
  const formData = message.formData
  if (formData.host && formData.port) {
    let storedData = {}
    if(message.id){
      storedData = db.get('servers').get(message.id).cloneDeep().value();
    } else{
      storedData = {
        "id" : hash.random(32)
      }
    }
    extend(true, storedData, formData)
    console.log(storedData)
    db.get('servers').set(storedData.id, storedData).value()
  }
  callback()
}

module.exports = action
