'use strict'

const fs = require('fs')
const path = require('path')

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
 * Slug invalid characters in given path to be safe to use on every OS
 * Helpful when transfering files from one OS to another
 * @param {string} fullpath
 * @returns {string}
 */
fstools.slugifyPath = function (fullpath) {
  fullpath = fullpath.replace(/\\/g, '/')
  let newPath = ''
  let spl = fullpath.split('/')
  // windows drive letter
  if (spl[0].match(/[a-z]+:/i)) {
    newPath = spl.shift() + '/'
  }
  return path.normalize(newPath + spl.join('/').replace(/[:?*"><|]/g, ''))
}

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
