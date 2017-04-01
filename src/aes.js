'use strict'

const crypto = require('crypto')
const path = require('path')
const hash = require(path.join(__dirname, 'hash'))

const aes = {}

/**
 * Decrypt
 * @param {string} password
 * @param {object} encryptdata
 * @returns {string}
 */
aes.decrypt = function (password, encryptdata) {
  let buffer = new Buffer(encryptdata.t, 'base64').toString('binary')
  const cryptkey = crypto.createHash('sha256').update(encryptdata.s + password).digest()
  const decipher = crypto.createDecipheriv('aes-256-cbc', cryptkey, encryptdata.iv)
  let decoded = decipher.update(buffer, 'binary', 'utf8')
  decoded += decipher.final('utf8')
  return decoded
}

/**
 * Encrypt
 * @param {string} password
 * @param {string} str
 * @returns {{iv: string, s: string, t: String}}
 */
aes.encrypt = function (password, str) {
  const iv = hash.random(16)
  const s = hash.random(64)
  const cryptkey = crypto.createHash('sha256').update(s + password).digest()
  const encipher = crypto.createCipheriv('aes-256-cbc', cryptkey, iv)
  let encryptdata = encipher.update(str, 'utf8', 'binary')
  encryptdata += encipher.final('binary')
  return {
    'iv': iv,
    's': s,
    't': new Buffer(encryptdata, 'binary').toString('base64')
  }
}
module.exports = aes
