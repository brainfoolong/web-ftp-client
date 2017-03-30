'use strict'

require('./build')

const path = require('path')
const fs = require('fs')
const Zip = require('node-zip')

// pack all required files into a release zip
const zipArchive = new Zip()
const pkg = require('./../package')
const zipFile = path.join(__dirname, 'release-' + pkg.version + '.zip')
const ignoreFiles = [
  'db/',
  'docs',
  'lang',
  'public/scripts/src',
  'public/scripts/dist/.gitignore',
  'public/stylesheets/src',
  'public/stylesheets/dist/.gitignore',
  'public/tpl/src',
  'public/tpl/dist/.gitignore',
  'dev',
  'logs/',
  'node_modules/',
  '{.}',
  'npm-debug.log'
]
const rootDir = path.join(__dirname, '..')

function packfiles (directory) {
  const files = fs.readdirSync(directory)
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const filepath = path.join(directory, file)
    let invalid = false
    for (let j = 0; j < ignoreFiles.length; j++) {
      const ignoreFile = path.join(__dirname, '..', ignoreFiles[j]).replace(/{\.}/g, '.')
      if (filepath.substr(0, ignoreFile.length) === ignoreFile) {
        invalid = true
        break
      }
    }
    if (invalid) {
      continue
    }
    const stat = fs.statSync(filepath)
    const relative = path.relative(rootDir, filepath)

    if (stat.isDirectory()) {
      zipArchive.folder(relative)
      packfiles(filepath)
    } else {
      zipArchive.file(relative, fs.readFileSync(filepath))
    }
  }
}

packfiles(rootDir)

const data = zipArchive.generate({base64: false, compression: 'DEFLATE'})
fs.writeFileSync(zipFile, data, 'binary')
