'use strict'

const fs = require('fs')

/**
 * FS helper tools
 */
const fstools = {}

/**
 * The default mask for file operations
 * @type {number}
 */
fstools.defaultMask = parseInt('0777', 8) & ~process.umask()

/**
 * Delete directories and files recursive
 * Use with caution
 * @param {string} path
 */
fstools.deleteRecursive = function (path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function (file) {
      const curPath = path + '/' + file
      if (fs.lstatSync(curPath).isDirectory()) {
        fstools.deleteRecursive(curPath)
      } else {
        fs.unlinkSync(curPath)
      }
    })
    fs.rmdirSync(path)
  }
}

module.exports = fstools
