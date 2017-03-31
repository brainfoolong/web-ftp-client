'use strict'

require('./build')

const path = require('path')
const fs = require('fs')
const AdmZip = require('adm-zip')

// pack all required files into a release zip
const pkg = require('./../package')
const zipFile = path.join(__dirname, 'release-' + pkg.version + '.zip')
const zipArchive = new AdmZip()
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
    const relative = path.relative(rootDir, filepath).replace(/\\/g, '/')

    if (stat.isDirectory()) {
      zipArchive.addFile(relative + '/', new Buffer(0), '', '0644')
      packfiles(filepath)
    } else {
      zipArchive.addFile(relative, fs.readFileSync(filepath), '', '0644')
    }
  }
}

packfiles(rootDir)

if (fs.existsSync(zipFile)) fs.unlinkSync(zipFile)

zipArchive.writeZip(zipFile)
