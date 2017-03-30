'use strict'

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
      let json = JSON.parse(data)
      distFileData += 'gl.lang.values[\'' + path.basename(file, '.json') + '\'] = ' + JSON.stringify(json) + '\n'
    }
  }
}

fs.writeFileSync(distFile, distFileData, {'mode': fstools.defaultMask})
