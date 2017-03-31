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
  const fstools = require(path.join(__dirname, 'fstools'))
  const core = require(path.join(__dirname, 'core'))

  const dir = path.resolve(__dirname, '..')
  const localZipFile = path.join(path.dirname(dir), path.basename(dir) + '.zip')

  core.fetchLatestVersion(function () {
    request(core.latestVersionZip, function () {
      const AdmZip = require('adm-zip')
      const zipArchive = new AdmZip(localZipFile)
      const zipEntries = zipArchive.getEntries()
      zipEntries.forEach(function (zipEntry) {
        const filepath = path.join(dir, zipEntry.entryName.toString()).replace(/\\/g, path.sep)
        process.stdout.write('File ' + filepath + '\n')
        if (zipEntry.isDirectory) {
          if (!fs.existsSync(filepath)) fs.mkdirSync(filepath, fstools.defaultMask)
        } else {
          fs.writeFileSync(filepath, zipEntry.getData())
        }
      })
      process.stdout.write('Application successfully updated\n')
      fs.unlinkSync(localZipFile)
      process.exit(0)
    }).pipe(fs.createWriteStream(localZipFile))
  })
}
