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
  * User manager
  * Multilanguage
* What's missing for the first alpha
  * Well, i don't know, wanna try it?!?

# Code languages and standards we use
* JS: https://standardjs.com
* ES6 (with Babel converter for frontend): https://babeljs.io/docs/plugins/preset-env/
* SCSS (with converter for frontend): http://sass-lang.com/

# Install linux
* Download a realase zip and unpack to a directory
* Run `npm install --production`
* Start server with `./wfc start`
* Stop server with `./wfc stop`
* Open http://IPTOSERVER:4340 in your browser

# Install synology
* Install package node 4
* Via SSH terminal do the same as install linux
* Notice: Some disktations have very low ram and cpu to run this application at full speed
 
# Development setup
* Git clone master to a directory of your choice
* `npm install`
* `npm run build` (and also everytime you change some frontend code)
* Start server with `./wfc start` (Stop with `./wfc stop`)
* Open http://localhost:4340 in your browser
* Changes in frontend require `npm run build` to be executed afterwards
* Changes in backend `/src` folder require `./wfc restart` to be executed afterwards

# Development procedure
First, always talk with me/us. If you have an idea don't go ahead and investigate much time for development. Maybe there is already something similar in development. Use GitHub issues to discuss about requests and bugs. Fork it, pull changes. There some pre-commit hooks that don't let you commit your code that isn't passing our tests.