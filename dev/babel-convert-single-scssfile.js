'use strict'

const path = require('path')
const fs = require('fs')
const fstools = require('./../src/fstools')
const sass = require('node-sass')
const filepath = process.argv[2]

let destfile = path.join(path.dirname(filepath), '../dist', path.basename(filepath, '.scss') + '.css')
let data = sass.renderSync({'file': filepath})
fs.writeFileSync(destfile, data.css, {'mode': fstools.defaultMask})
