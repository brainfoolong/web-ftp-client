'use strict'

const path = require('path')
const fs = require('fs')
const fstools = require('./../src/fstools')
const sass = require('node-sass')

const directories = ['public/stylesheets/src']

for (let i = 0; i < directories.length; i++) {
  let directory = directories[i]
  directory = path.join(__dirname, '..', directory)
  const files = fs.readdirSync(directory)
  for (let j = 0; j < files.length; j++) {
    const file = files[j]
    if (file.match(/\.scss$/)) {
      const filepath = path.join(directory, file)
      let filepathGen = path.join(path.dirname(directory), 'dist', path.basename(file, '.scss') + '.css')
      let data = sass.renderSync({'outputStyle': 'compressed', 'file': filepath})
      fs.writeFileSync(filepathGen, data.css, {'mode': fstools.defaultMask})
    }
  }
}
