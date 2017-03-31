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

  core.fetchLatestVersion(function (body) {
    if (!core.latestVersionZip) {
      process.stderr.write(body)
      process.exit(0)
    } else {
      request(core.latestVersionZip, function () {
        const jsZip = require('jszip')
        jsZip.loadAsync(fs.readFileSync(localZipFile)).then(function (zip) {
          let countDone = 0
          let countFiles = Object.keys(zip.files).length
          const fileDoneCb = function () {
            countDone++
            if (countDone >= countFiles) {
              fs.unlinkSync(localZipFile)
              process.stdout.write('Application successfully updated\n')
              process.exit(0)
            }
          }
          Object.keys(zip.files).forEach(function (index) {
            const zipFile = zip.files[index]
            const filepath = path.join(dir, zipFile.name.replace(/\\/g, path.sep))
            if (zipFile.dir === true) {
              if (!fs.existsSync(filepath)) fs.mkdirSync(filepath, {'mode': fstools.defaultMask})
              process.stdout.write('Directory ' + filepath + '\n')
              fileDoneCb()
            } else {
              zipFile.async('nodebuffer').then(function (fileData) {
                process.stdout.write('File ' + filepath + '\n')
                fs.writeFileSync(filepath, fileData, {'mode': fstools.defaultMask})
                fileDoneCb()
              })
            }
          })
        })
      }).pipe(fs.createWriteStream(localZipFile))
    }
  })
}
