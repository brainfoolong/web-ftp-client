# Brains Web FTP Client
[![Build Status](https://travis-ci.org/brainfoolong/web-ftp-client.svg?branch=master)](https://travis-ci.org/brainfoolong/web-ftp-client)

A web based FTP client. Like really simple, kind of, filezilla, but for your browser. The main goal of this tool is: Install on a server/NAS/synology/raspberry/desktop and use it like a desktop tool. It can be installed on almost every device, including your server for example. Everything that can run `nodejs` can also run this client. I've mainly built this to run on my NAS because i just want to download huge data from a FTP to my NAS directly, without struggling with the command line.

![Preview](https://brainfoolong.github.io/web-ftp-client/images/preview.png "Preview")


# Work in progress
No release yet. Watch/star if you like it.
* Already working features
  * Local file browser
  * Server file browser
  * FTP Browser/Download/Upload/Delete
  * FTP with TLS Browser/Download/Upload/Delete
  * SFTP Browser/Download/Upload/Delete
  * Queue manager
  * Log manager
  * Multilanguage
* Whats missing for the first alpha
  * Interface for usermanagement, implement also admin role only can add and edit servers and users
  * 100% use of translation files, something hardcoded yet
  * Some other small fixes, repairs, red-bulls, days, etc...

# Code languages and standards we use
* JS: https://standardjs.com
* ES6 (with Babel converter for frontend): https://babeljs.io/docs/plugins/preset-env/
* SCSS (with converter for frontend): http://sass-lang.com/
 
# Development setup
* Git clone master to a directory of your choice
* `npm install --dev`
* `npm run build` (and also everytime you change some frontend code)
* Start server with `./wfc start` (Stop with `./wfc stop`)
* Open http://localhost:4340 in your browser