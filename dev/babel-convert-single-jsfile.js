'use strict'

// does convert a single js file in development mode

const path = require('path')
const fs = require('fs')
const fstools = require('./../src/fstools')
const babel = require('babel-core')
const filepath = process.argv[2]

let destfile = path.join(path.dirname(filepath), '../dist', path.basename(filepath))
let data = babel.transformFileSync(filepath, {'sourceMaps': 'both'})
fs.writeFileSync(destfile, data.code, {'mode': fstools.defaultMask})
