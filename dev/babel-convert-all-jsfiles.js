'use strict'

// does convert every required js file in the project

const path = require('path')
const fs = require('fs')
const fstools = require('./../src/fstools')
const babel = require('babel-core')
const mode = process.argv[2] || 'dev'
const singleFile = process.argv[3]

const directories = ['public/scripts/src', 'public/tpl/src']
const options = {
  'dev': {'sourceMaps': 'both'},
  'prod': {'minified': true}
}

for (let i = 0; i < directories.length; i++) {
  let directory = directories[i]
  directory = path.join(__dirname, '..', directory)
  const files = fs.readdirSync(directory)
  for (let j = 0; j < files.length; j++) {
    const file = files[j]
    if (file.match(/\.js$/)) {
      const filepath = path.join(directory, file)
      if (singleFile && singleFile !== filepath) {
        continue
      }
      let filepathGen = path.join(path.dirname(directory), 'dist', file)
      let data = babel.transformFileSync(filepath, options[mode])
      fs.writeFileSync(filepathGen, data.code, {'mode': fstools.defaultMask})
    }
  }
}
