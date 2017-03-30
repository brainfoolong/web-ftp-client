'use strict'

const path = require('path')
const fs = require('fs')
const fstools = require('./../src/fstools')
const babel = require('babel-core')

const directories = ['public/scripts/src', 'public/tpl/src']

for (let i = 0; i < directories.length; i++) {
  let directory = directories[i]
  directory = path.join(__dirname, '..', directory)
  const files = fs.readdirSync(directory)
  for (let j = 0; j < files.length; j++) {
    const file = files[j]
    if (file.match(/\.js$/)) {
      const filepath = path.join(directory, file)
      let filepathGen = path.join(path.dirname(directory), 'dist', file)
      let data = babel.transformFileSync(filepath, {'minified': true})
      fs.writeFileSync(filepathGen, data.code, {'mode': fstools.defaultMask})
    }
  }
}
