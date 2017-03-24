'use strict'

// does convert every required js file in the project

const path = require('path')
const fs = require('fs')
const sass = require('node-sass')
const mode = process.argv[2] || 'dev'
const singleFile = process.argv[3]

const directories = ['public/stylesheets/src']
const options = {
  'dev': {},
  'prod': {'outputStyle': 'compressed'}
}

for (let i = 0; i < directories.length; i++) {
  let directory = directories[i]
  directory = path.join(__dirname, '..', directory)
  const files = fs.readdirSync(directory)
  for (let j = 0; j < files.length; j++) {
    const file = files[j]
    if (file.match(/\.scss$/)) {
      const filepath = path.join(directory, file)
      if (singleFile && singleFile !== filepath) {
        continue
      }
      let filepathGen = path.join(path.dirname(directory), 'dist', path.basename(file, '.scss') + '.css')
      var opt = options[mode]
      opt.file = filepath
      let data = sass.renderSync(opt)
      fs.writeFileSync(filepathGen, data.css)
    }
  }
}