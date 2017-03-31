'use strict'
/**
 * Main script
 */

const path = require('path')
const mode = process.argv[2]

Error.stackTraceLimit = Infinity

if (!mode) {
  process.stdout.write('Usage: node main.js start|update-core')
  process.exit(0)
}

if (mode === 'start') {
  require(path.join(__dirname, 'routes'))
  require(path.join(__dirname, 'websocketmgr'))
  require(path.join(__dirname, 'config'))
  require(path.join(__dirname, 'core'))
}

// update core
if (mode === 'update-core') {
  const request = require('request')
  const fs = require('fs')
  const unzip = require('unzip')
  const fstools = require(path.join(__dirname, 'fstools'))
  const core = require(path.join(__dirname, 'core'))

  const dir = path.resolve(__dirname, '..')
  const localZipFile = path.join(path.dirname(dir), path.basename(dir) + '.zip')

  core.fetchLatestVersion(function () {
    request(core.latestVersionZip, function () {
      fs.createReadStream(localZipFile).pipe(unzip.Parse()).on('entry', function (entry) {
        const fileName = entry.path
        if (!fileName.length) return
        const filepath = path.join(dir, fileName)
        if (entry.type === 'Directory') {
          if (!fs.existsSync(filepath)) fs.mkdirSync(filepath, fstools.defaultMask)
          entry.autodrain()
        } else {
          entry.pipe(fs.createWriteStream(filepath, {'mode': fstools.defaultMask}))
        }
      }).on('close', function () {
        process.stdout.write('Application successfully updated\n')
        fs.unlinkSync(localZipFile)
        process.exit(0)
      }).on('error', function (err) {
        process.stderr.write(err.message)
        process.exit(0)
      })
    }).pipe(fs.createWriteStream(localZipFile))
  })
}
