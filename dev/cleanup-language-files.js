'use strict'

const path = require('path')
const fs = require('fs')
const fstools = require('./../src/fstools')

const directories = ['lang']
const baseLangData = sortObject(JSON.parse(fs.readFileSync(path.join(__dirname, '../lang/en.json'))))

for (let i = 0; i < directories.length; i++) {
  let directory = directories[i]
  directory = path.join(__dirname, '..', directory)
  const files = fs.readdirSync(directory)
  for (let j = 0; j < files.length; j++) {
    const file = files[j]
    if (file.match(/\.json$/)) {
      const filepath = path.join(directory, file)
      const lang = path.basename(file, '.json')
      let data = fs.readFileSync(filepath)
      // resort keys
      let json = JSON.parse(data)
      if (lang !== 'en') {
        // delete keys that are not existing in dest anymore
        for (let i in json) {
          if (typeof baseLangData[i] === 'undefined') {
            delete json[i]
          }
        }
        // add keys that are in the source but not in dest
        for (let i in baseLangData) {
          if (typeof json[i] === 'undefined') {
            json[i] = null
          }
        }
      }
      json = sortObject(json)
      updateJsonFile(json, filepath)
    }
  }
}

function sortObject (o) {
  let newO = {}
  let keys = Object.keys(o)
  keys.sort()
  for (let i = 0; i < keys.length; i++) {
    newO[keys[i]] = o[keys[i]]
  }
  return newO
}

function updateJsonFile (values, file) {
  let fileData = '{\n'
  for (let i in values) {
    fileData += '  ' + JSON.stringify(i) + ': ' + JSON.stringify(values[i]) + ',\n'
  }
  fileData = fileData.substr(0, fileData.length - 2) + '\n}'
  fs.writeFileSync(file, fileData, {'mode': fstools.defaultMask})
}
