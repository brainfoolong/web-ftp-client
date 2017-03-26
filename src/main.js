'use strict'
/**
 * Main script
 */
Error.stackTraceLimit = Infinity

let mode = process.argv[2]
if (!mode) {
  process.stdout.write('Usage: node main.js start|update-core')
  process.exit(0)
}

if (mode === 'start') {
  require('./routes')
  require('./websocketmgr')
  require('./config')
  require('./core')
}

// update core
if (mode === 'update-core') {
  const request = require('request')
  const fs = require('fs')
  const fstools = require('./fstools')
  const unzip = require('unzip')
  const dir = './..'
  request('https://codeload.github.com/brainfoolong/web-ftp-client/zip/master', function () {
    fs.createReadStream(dir + '/master.zip').pipe(unzip.Parse()).on('entry', function (entry) {
      const fileName = entry.path.split('/').slice(1).join('/')
      if (!fileName.length) return
      const path = dir + '/' + fileName
      if (entry.type === 'Directory') {
        if (!fs.existsSync(path)) fs.mkdirSync(path, fstools.defaultMask)
        entry.autodrain()
      } else {
        entry.pipe(fs.createWriteStream(path, {'mode': fstools.defaultMask}))
      }
    }).on('close', function () {
      process.stdout.write('Application successfully updated\n')
      fs.unlinkSync(dir + '/master.zip')
      process.exit(0)
    })
  }).pipe(fs.createWriteStream(dir + '/master.zip'))
}
