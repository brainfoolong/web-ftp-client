'use strict'

// build the language files and resort all translation json files

const path = require('path')
const fs = require('fs')
const fstools = require('./../src/fstools')

const directories = ['lang']
const distFile = path.join(__dirname, '..', 'public/scripts/dist/lang.values.js')

let distFileData = '\'use strict\'\n'
for (let i = 0; i < directories.length; i++) {
  let directory = directories[i]
  directory = path.join(__dirname, '..', directory)
  const files = fs.readdirSync(directory)
  for (let j = 0; j < files.length; j++) {
    const file = files[j]
    if (file.match(/\.json$/)) {
      const filepath = path.join(directory, file)
      let data = fs.readFileSync(filepath)
      let json = sortObject(JSON.parse(data))
      distFileData += 'gl.lang.values[\'' + path.basename(file, '.json') + '\'] = ' + JSON.stringify(json) + '\n'
      if (process.argv[4] !== 'skip-resort') {
        updateJsonFile(json, filepath)
      }
    }
  }
}

fs.writeFileSync(distFile, distFileData, {'mode': fstools.defaultMask})

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
